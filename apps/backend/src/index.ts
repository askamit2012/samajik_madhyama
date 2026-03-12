import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import { db, schema } from "@repo/database"

dotenv.config()

const app = express()
const port = process.env.PORT || 4000

app.use(cors())
app.use(express.json())

app.get("/health", (req, res) => {
  res.json({ status: "ok" })
})

import { contactsRouter } from "./routes/contacts"
import { templatesRouter } from "./routes/templates"
import oauthRouter from "./routes/oauth"
import platformRouter from "./routes/platform-credentials"
import postsRouter from "./routes/posts"
import authRouter from "./routes/auth"
import adminUsersRouter from "./routes/admin-users"
import campaignsRouter from "./routes/campaigns"

app.use("/contacts", contactsRouter)
app.use("/templates", templatesRouter)
app.use("/oauth", oauthRouter)
app.use("/platform-credentials", platformRouter)
app.use("/posts", postsRouter)
app.use("/auth", authRouter)
app.use("/admin-users", adminUsersRouter)
app.use("/campaigns", campaignsRouter)

app.get("/users", async (req, res) => {
  try {
    const users = await db.select().from(schema.users)
    res.json(users)
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" })
  }
})

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`)
})
