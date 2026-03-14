import { Worker, Job } from "bullmq"
import { db, schema } from "@repo/database"
import { eq, and, lte } from "drizzle-orm"

// ============================================================
// Platform Publish Helpers — reused from posts.ts logic
// ============================================================
async function publishToFacebook(content: string, accessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/me/feed?message=${encodeURIComponent(content)}&access_token=${accessToken}`,
    { method: "POST" }
  )
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.error?.message || "Facebook publish failed")
  return data.id
}

async function publishToInstagram(content: string, accessToken: string): Promise<string> {
  // Instagram Basic Display API — create media then publish
  const res = await fetch(
    `https://graph.facebook.com/v18.0/me/media?caption=${encodeURIComponent(content)}&access_token=${accessToken}`,
    { method: "POST" }
  )
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.error?.message || "Instagram media creation failed")
  const publishRes = await fetch(
    `https://graph.facebook.com/v18.0/me/media_publish?creation_id=${data.id}&access_token=${accessToken}`,
    { method: "POST" }
  )
  const publishData = await publishRes.json() as any
  if (!publishRes.ok) throw new Error(publishData.error?.message || "Instagram publish failed")
  return publishData.id
}

async function publishToLinkedIn(content: string, accessToken: string): Promise<string> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify({
      author: "urn:li:person:me",
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE",
        },
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
    }),
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.message || "LinkedIn publish failed")
  return data.id
}

async function publishToTwitter(content: string, accessToken: string): Promise<string> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: content }),
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.detail || "Twitter publish failed")
  return data.data?.id || "unknown"
}

async function publishPost(platform: string, content: string, accessToken: string): Promise<string> {
  switch (platform) {
    case "facebook": return publishToFacebook(content, accessToken)
    case "instagram": return publishToInstagram(content, accessToken)
    case "linkedin": return publishToLinkedIn(content, accessToken)
    case "twitter": return publishToTwitter(content, accessToken)
    default: throw new Error(`Unsupported platform: ${platform}`)
  }
}

// ============================================================
// Scheduled Post Claim & Publish Ticker
// ============================================================
export async function runSchedulerTick(): Promise<void> {
  const now = new Date()

  const duePosts = await db.select().from(schema.posts)
    .where(
      and(
        eq(schema.posts.status, "scheduled"),
        lte(schema.posts.scheduledFor, now)
      )
    )

  if (duePosts.length === 0) return

  console.log(`[post-scheduler] ${duePosts.length} posts due. Publishing...`)

  for (const post of duePosts) {
    try {
      // Get the user's OAuth connection for this platform
      const [connection] = await db.select().from(schema.oauthConnections)
        .where(
          and(
            eq(schema.oauthConnections.userId, post.authorId),
            eq(schema.oauthConnections.platform, post.platform)
          )
        )
        .limit(1)

      if (!connection) {
        console.warn(`[post-scheduler] No OAuth connection for user ${post.authorId} on ${post.platform}. Marking failed.`)
        await db.update(schema.posts)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(schema.posts.id, post.id))
        continue
      }

      await publishPost(post.platform, post.content, connection.accessToken)

      await db.update(schema.posts)
        .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.posts.id, post.id))

      console.log(`[post-scheduler] Published post #${post.id} to ${post.platform}`)
    } catch (err: any) {
      console.error(`[post-scheduler] Failed post #${post.id}:`, err.message)
      await db.update(schema.posts)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(schema.posts.id, post.id))
    }
  }
}

// ============================================================
// Interval Ticker — runs every 60 seconds
// ============================================================
let schedulerTimer: NodeJS.Timeout | null = null

export function startPostScheduler(): void {
  if (schedulerTimer) return // already running
  console.log("[post-scheduler] Starting. Tick every 60s.")
  schedulerTimer = setInterval(async () => {
    try {
      await runSchedulerTick()
    } catch (err) {
      console.error("[post-scheduler] Unexpected tick error:", err)
    }
  }, 60_000)
  // Run once immediately on startup
  runSchedulerTick().catch(console.error)
}

export function stopPostScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
}
