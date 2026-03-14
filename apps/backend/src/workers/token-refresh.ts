import { db, schema } from "@repo/database"
import { eq, and, lte } from "drizzle-orm"

/**
 * Attempts to refresh the OAuth access token for a connection.
 * Returns the new access token, or throws if refresh is not possible.
 *
 * Platform support:
 *  - Facebook/Instagram: uses long-lived token exchange
 *  - LinkedIn: no offline refresh — returns existing token (user must re-auth)
 *  - Twitter/X: user access token refresh via refresh_token
 */
export async function refreshOAuthToken(connectionId: number): Promise<string> {
  const [connection] = await db.select().from(schema.oauthConnections)
    .where(eq(schema.oauthConnections.id, connectionId))
    .limit(1)

  if (!connection) throw new Error(`OAuth connection #${connectionId} not found`)

  const { platform, refreshToken, accessToken } = connection

  // ── Facebook / Instagram ──────────────────────────────────────
  if (platform === "facebook" || platform === "instagram") {
    const [creds] = await db.select().from(schema.platformCredentials)
      .where(eq(schema.platformCredentials.platform, platform))
      .limit(1)
    if (!creds) throw new Error(`No platform credentials for ${platform}`)

    const res = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${creds.appId}` +
      `&client_secret=${creds.appSecret}` +
      `&fb_exchange_token=${accessToken}`
    )
    const data = await res.json() as any
    if (!res.ok || !data.access_token) {
      throw new Error(data.error?.message || `${platform} token refresh failed`)
    }

    const newToken = data.access_token
    const expiresIn = data.expires_in || 5_184_000 // 60 days default
    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    await db.update(schema.oauthConnections)
      .set({ accessToken: newToken, expiresAt, updatedAt: new Date() })
      .where(eq(schema.oauthConnections.id, connectionId))

    return newToken
  }

  // ── Twitter / X ───────────────────────────────────────────────
  if (platform === "twitter") {
    if (!refreshToken) throw new Error("Twitter connection has no refresh token")

    const [creds] = await db.select().from(schema.platformCredentials)
      .where(eq(schema.platformCredentials.platform, "twitter"))
      .limit(1)
    if (!creds) throw new Error("No platform credentials for twitter")

    const basicAuth = Buffer.from(`${creds.appId}:${creds.appSecret}`).toString("base64")
    const res = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    })
    const data = await res.json() as any
    if (!res.ok || !data.access_token) {
      throw new Error(data.error_description || "Twitter token refresh failed")
    }

    const expiresAt = data.expires_in
      ? new Date(Date.now() + data.expires_in * 1000)
      : null

    await db.update(schema.oauthConnections)
      .set({
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(schema.oauthConnections.id, connectionId))

    return data.access_token
  }

  // ── LinkedIn ────────────────────────────────────────────────────
  // LinkedIn doesn't support offline refresh — return existing token
  // and let the caller handle 401 by prompting re-auth
  if (platform === "linkedin") {
    console.warn(`[token-refresh] LinkedIn does not support offline token refresh for connection #${connectionId}. Token may be expired.`)
    return accessToken
  }

  throw new Error(`Token refresh not supported for platform: ${platform}`)
}

/**
 * Wraps a publish call with automatic token refresh + retry on 401.
 * Usage: withTokenRefresh(connectionId, () => publishPost(...))
 */
export async function withTokenRefresh<T>(
  connectionId: number,
  fn: (accessToken: string) => Promise<T>
): Promise<T> {
  const [connection] = await db.select().from(schema.oauthConnections)
    .where(eq(schema.oauthConnections.id, connectionId))
    .limit(1)

  if (!connection) throw new Error(`OAuth connection #${connectionId} not found`)

  try {
    return await fn(connection.accessToken)
  } catch (err: any) {
    // Detect token expiry signals
    const isExpired =
      err?.message?.includes("401") ||
      err?.message?.toLowerCase().includes("expired") ||
      err?.message?.toLowerCase().includes("invalid token")

    if (isExpired) {
      console.log(`[token-refresh] Token expired for connection #${connectionId}. Refreshing...`)
      const newToken = await refreshOAuthToken(connectionId)
      return await fn(newToken)
    }

    throw err
  }
}

/**
 * Proactive refresh sweep — runs periodically to refresh tokens
 * expiring within the next 24 hours before they're needed.
 */
export async function sweepExpiringTokens(): Promise<void> {
  const threshold = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h from now
  const expiring = await db.select().from(schema.oauthConnections)
    .where(
      and(
        lte(schema.oauthConnections.expiresAt, threshold),
        // Only platforms that support refresh
        // (LinkedIn excluded — no-op, Twitter/Facebook/Instagram supported)
      )
    )

  console.log(`[token-refresh] ${expiring.length} tokens expiring within 24h. Refreshing...`)

  for (const conn of expiring) {
    if (conn.platform === "linkedin") continue // skip — no offline refresh
    try {
      await refreshOAuthToken(conn.id)
      console.log(`[token-refresh] Refreshed ${conn.platform} token for user #${conn.userId}`)
    } catch (err: any) {
      console.error(`[token-refresh] Failed to refresh connection #${conn.id}:`, err.message)
    }
  }
}
