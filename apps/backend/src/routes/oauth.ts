import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq, and } from "drizzle-orm"
import jwt from "jsonwebtoken"
import { authenticate, AuthRequest } from "../middleware/auth"
// Using built-in fetch (Node 18+) for HTTP requests

const router: Router = Router()
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only"
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000"
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"

// -----------------------------------------------------------------
// Platform OAuth configuration
// -----------------------------------------------------------------
interface PlatformConfig {
  authUrl: string
  tokenUrl: string
  scopes: string
  /** For token exchange: is it form-based (most) or query-param based (instagram)? */
  tokenMethod: "form" | "query"
  /** For fetching the user's profile ID after token exchange */
  profileUrl?: string
}

const PLATFORM_CONFIG: Record<string, PlatformConfig> = {
  facebook: {
    authUrl: "https://www.facebook.com/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
    scopes: "pages_show_list,pages_read_engagement,pages_manage_posts,public_profile",
    tokenMethod: "query",
    profileUrl: "https://graph.facebook.com/me?fields=id,name",
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scopes: "user_profile,user_media",
    tokenMethod: "form",
    profileUrl: "https://graph.instagram.com/me?fields=id,username",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scopes: "r_liteprofile r_emailaddress w_member_social",
    tokenMethod: "form",
    profileUrl: "https://api.linkedin.com/v2/me",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scopes: "tweet.read tweet.write users.read offline.access",
    tokenMethod: "form",
    profileUrl: "https://api.twitter.com/2/users/me",
  },
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/adwords",
    tokenMethod: "form",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
  },
}

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
const getCallbackUri = (platform: string) =>
  `${BACKEND_URL}/oauth/${platform}/callback`

// Encode userId+platform into the state param for CSRF protection
const encodeState = (userId: number, platform: string) =>
  jwt.sign({ userId, platform }, JWT_SECRET, { expiresIn: "15m" })

const decodeState = (state: string): { userId: number; platform: string } | null => {
  try {
    return jwt.verify(state, JWT_SECRET) as { userId: number; platform: string }
  } catch {
    return null
  }
}

// -----------------------------------------------------------------
// Routes
// -----------------------------------------------------------------

// GET /oauth/connections — list the logged-in user's connections
router.get("/connections", authenticate, async (req: AuthRequest, res) => {
  try {
    const connections = await db
      .select()
      .from(schema.oauthConnections)
      .where(eq(schema.oauthConnections.userId, req.user!.id))

    // Mask tokens
    const masked = connections.map((c) => ({
      id: c.id,
      platform: c.platform,
      platformUserId: c.platformUserId,
      createdAt: c.createdAt,
      expiresAt: c.expiresAt,
    }))
    res.json(masked)
  } catch (error) {
    console.error("Failed to fetch connections:", error)
    res.status(500).json({ error: "Failed to fetch connections" })
  }
})

// DELETE /oauth/connections/:platform — disconnect a platform
router.delete("/connections/:platform", authenticate, async (req: AuthRequest, res) => {
  try {
    await db
      .delete(schema.oauthConnections)
      .where(
        and(
          eq(schema.oauthConnections.userId, req.user!.id),
          eq(schema.oauthConnections.platform, req.params.platform)
        )
      )
    res.status(204).send()
  } catch (error) {
    console.error("Failed to disconnect platform:", error)
    res.status(500).json({ error: "Failed to disconnect platform" })
  }
})

// GET /oauth/:platform/connect — initiate OAuth flow (requires user auth)
router.get("/:platform/connect", authenticate, async (req: AuthRequest, res) => {
  const { platform } = req.params
  const config = PLATFORM_CONFIG[platform]

  if (!config) {
    return res.status(400).json({ error: `Unknown platform: ${platform}` })
  }

  // Fetch admin-configured app credentials
  const creds = await db
    .select()
    .from(schema.platformCredentials)
    .where(eq(schema.platformCredentials.platform, platform))
    .limit(1)

  if (creds.length === 0) {
    return res.status(400).json({
      error: "Platform credentials not configured by admin. Please contact your administrator.",
    })
  }

  const { appId } = creds[0]
  const state = encodeState(req.user!.id, platform)
  const redirectUri = getCallbackUri(platform)

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: config.scopes,
    response_type: "code",
    state,
    // Twitter PKCE-lite hint
    ...(platform === "twitter" ? { code_challenge_method: "plain", code_challenge: state.slice(0, 43) } : {}),
    ...(platform === "google" ? { access_type: "offline", prompt: "consent" } : {}),
  })

  res.redirect(`${config.authUrl}?${params.toString()}`)
})

// GET /oauth/:platform/callback — handle OAuth callback (no auth middleware, uses state)
router.get("/:platform/callback", async (req, res) => {
  const { platform } = req.params
  const { code, state, error: oauthError } = req.query as Record<string, string>

  if (oauthError) {
    console.error(`OAuth error from ${platform}:`, oauthError)
    return res.redirect(`${FRONTEND_URL}/social/accounts?error=${oauthError}`)
  }

  if (!code || !state) {
    return res.redirect(`${FRONTEND_URL}/social/accounts?error=missing_params`)
  }

  const decoded = decodeState(state)
  if (!decoded || decoded.platform !== platform) {
    return res.redirect(`${FRONTEND_URL}/social/accounts?error=invalid_state`)
  }

  const { userId } = decoded
  const config = PLATFORM_CONFIG[platform]

  // Fetch app credentials
  const creds = await db
    .select()
    .from(schema.platformCredentials)
    .where(eq(schema.platformCredentials.platform, platform))
    .limit(1)

  if (creds.length === 0) {
    return res.redirect(`${FRONTEND_URL}/social/accounts?error=missing_credentials`)
  }

  const { appId, appSecret } = creds[0]
  const redirectUri = getCallbackUri(platform)

  try {
    // --- Exchange code for access token ---
    let accessToken: string
    let refreshToken: string | null = null
    let expiresAt: Date | null = null

    if (config.tokenMethod === "query") {
      // e.g. Facebook long-lived token exchange via query params
      const tokenUrl = `${config.tokenUrl}?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
      const tokenRes = await fetch(tokenUrl)
      const tokenData = (await tokenRes.json()) as any
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Token exchange failed:", tokenData)
        return res.redirect(`${FRONTEND_URL}/social/accounts?error=token_exchange_failed`)
      }
      accessToken = tokenData.access_token
      if (tokenData.expires_in) {
        expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
      }
    } else {
      // Form-based POST (LinkedIn, Instagram, Twitter, Google)
      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: appId,
        client_secret: appSecret,
      })

      const tokenRes = await fetch(config.tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      })

      const tokenData = (await tokenRes.json()) as any
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("Token exchange failed:", tokenData)
        return res.redirect(`${FRONTEND_URL}/social/accounts?error=token_exchange_failed`)
      }
      accessToken = tokenData.access_token
      refreshToken = tokenData.refresh_token || null
      if (tokenData.expires_in) {
        expiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
      }
    }

    // --- Fetch the user's platform profile ID ---
    let platformUserId: string | null = null
    if (config.profileUrl) {
      try {
        const profileRes = await fetch(
          `${config.profileUrl}${config.profileUrl.includes("?") ? "&" : "?"}access_token=${accessToken}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )
        if (profileRes.ok) {
          const profile = (await profileRes.json()) as any
          platformUserId = String(profile.id || profile.sub || "")
        }
      } catch (e) {
        console.warn("Profile fetch failed (non-critical):", e)
      }
    }

    // --- Upsert the connection ---
    const existing = await db
      .select()
      .from(schema.oauthConnections)
      .where(
        and(
          eq(schema.oauthConnections.userId, userId),
          eq(schema.oauthConnections.platform, platform)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(schema.oauthConnections)
        .set({ accessToken, refreshToken, expiresAt, platformUserId, updatedAt: new Date() })
        .where(eq(schema.oauthConnections.id, existing[0].id))
    } else {
      await db.insert(schema.oauthConnections).values({
        userId,
        platform,
        accessToken,
        refreshToken,
        expiresAt,
        platformUserId,
      })
    }

    res.redirect(`${FRONTEND_URL}/social/accounts?success=true&platform=${platform}`)
  } catch (error) {
    console.error("OAuth callback error:", error)
    res.redirect(`${FRONTEND_URL}/social/accounts?error=server_error`)
  }
})

export default router
