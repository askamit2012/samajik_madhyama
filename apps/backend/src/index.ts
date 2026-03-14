import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { logger } from "./lib/logger"
import { requestId } from "./middleware/request-id"
import { errorHandler } from "./middleware/error-handler"

dotenv.config()

type AppMode = "api" | "worker" | "all"
const appMode = ((process.env.APP_MODE || "all") as AppMode).toLowerCase() as AppMode
const enableApi = appMode === "api" || appMode === "all"
const enableWorkers = appMode === "worker" || appMode === "all"

// ========== Fail-fast: JWT_SECRET ==========
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    logger.error("FATAL: JWT_SECRET environment variable is not set. Refusing to start in production.")
    process.exit(1)
  } else {
    logger.warn("⚠️  WARNING: JWT_SECRET not set. Using insecure fallback — DO NOT use in production.")
  }
}

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())
app.use(requestId)

// ========== Health ==========
app.get("/health", (_req, res) => {
  res.json({ status: "ok", mode: appMode, ts: new Date().toISOString() })
})

async function main(): Promise<void> {
  if (enableApi) {
    // ========== Routes ==========
    const { contactsRouter } = await import("./routes/contacts")
    const { templatesRouter } = await import("./routes/templates")
    const { default: oauthRouter } = await import("./routes/oauth")
    const { default: platformRouter } = await import("./routes/platform-credentials")
    const { default: postsRouter } = await import("./routes/posts")
    const { default: authRouter } = await import("./routes/auth")
    const { default: adminUsersRouter } = await import("./routes/admin-users")
    const { default: campaignsRouter } = await import("./routes/campaigns")
    const { default: aiModelsRouter } = await import("./routes/ai-models")
    const { default: aiSettingsRouter } = await import("./routes/ai-settings")
    const { default: aiRouter } = await import("./routes/ai")

    app.use("/contacts", contactsRouter)
    app.use("/templates", templatesRouter)
    app.use("/oauth", oauthRouter)
    app.use("/platform-credentials", platformRouter)
    app.use("/posts", postsRouter)
    app.use("/auth", authRouter)
    app.use("/admin-users", adminUsersRouter)
    app.use("/campaigns", campaignsRouter)
    app.use("/ai-models", aiModelsRouter)
    app.use("/ai-settings", aiSettingsRouter)
    app.use("/ai", aiRouter)
  }

  let stopSchedulers: (() => void) | null = null
  let closeWorkers: (() => Promise<void>) | null = null

  if (enableWorkers) {
    // ========== Workers (background processing) ==========
    const { startPostScheduler, stopPostScheduler } = await import("./workers/post-scheduler")
    const { sweepExpiringTokens } = await import("./workers/token-refresh")
    const { createCampaignWorker } = await import("./workers/campaign-worker")

    const campaignWorker = createCampaignWorker()

    // Start the post scheduler (polls every 60s)
    startPostScheduler()

    // Sweep expiring OAuth tokens every 6 hours
    const tokenSweepTimer = setInterval(
      () => sweepExpiringTokens().catch(console.error),
      6 * 60 * 60 * 1000
    )
    sweepExpiringTokens().catch(console.error) // run once on startup

    stopSchedulers = () => {
      stopPostScheduler()
      clearInterval(tokenSweepTimer)
    }

    closeWorkers = async () => {
      await campaignWorker.close()
    }
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info("Shutting down gracefully...")
    stopSchedulers?.()
    if (closeWorkers) await closeWorkers()
    process.exit(0)
  }
  process.on("SIGTERM", shutdown)
  process.on("SIGINT", shutdown)

  // ========== Global error handler ==========
  app.use(errorHandler)

  app.listen(port, () => {
    logger.info(`✅ Backend running on port ${port} (mode=${appMode})`)
  })
}

main().catch((err) => {
  logger.error({ err }, "FATAL: backend failed to start")
  process.exit(1)
})
