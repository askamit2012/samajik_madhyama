import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq, and } from "drizzle-orm"
import { authenticate, AuthRequest } from "../middleware/auth"

const router: Router = Router()

// -----------------------------------------------------------------
// Platform Publishing Helpers
// -----------------------------------------------------------------
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
  // Step 1: create media object
  const containerRes = await fetch(`https://graph.instagram.com/me/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ caption: content, media_type: "TEXT", access_token: accessToken })
  })
  const container = await containerRes.json() as any
  if (!containerRes.ok) throw new Error(container.error?.message || "Instagram container failed")
  
  // Step 2: publish
  const publishRes = await fetch(`https://graph.instagram.com/me/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: accessToken })
  })
  const published = await publishRes.json() as any
  if (!publishRes.ok) throw new Error(published.error?.message || "Instagram publish failed")
  return published.id
}

async function publishToLinkedIn(content: string, accessToken: string, platformUserId: string): Promise<string> {
  const res = await fetch("https://api.linkedin.com/v2/ugcPosts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0"
    },
    body: JSON.stringify({
      author: `urn:li:person:${platformUserId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: { text: content },
          shareMediaCategory: "NONE"
        }
      },
      visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
    })
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.message || "LinkedIn publish failed")
  return data.id
}

async function publishToTwitter(content: string, accessToken: string): Promise<string> {
  const res = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text: content })
  })
  const data = await res.json() as any
  if (!res.ok) throw new Error(data.detail || "Twitter publish failed")
  return data.data?.id
}

// -----------------------------------------------------------------
// Routes
// -----------------------------------------------------------------

// GET /posts — all posts for logged-in user
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const posts = await db.select().from(schema.posts)
      .where(eq(schema.posts.authorId, req.user!.id))
      .orderBy(schema.posts.createdAt)
    res.json(posts)
  } catch (error) {
    console.error("Failed to fetch posts:", error)
    res.status(500).json({ error: "Failed to fetch posts" })
  }
})

// POST /posts — create a post
router.post("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, platform, status, scheduledFor } = req.body
    const newPost = await db.insert(schema.posts).values({
      content,
      platform,
      status: status || "draft",
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      authorId: req.user!.id,
    }).returning()
    res.status(201).json(newPost[0])
  } catch (error) {
    console.error("Failed to create post:", error)
    res.status(500).json({ error: "Failed to create post" })
  }
})

// PUT /posts/:id — update a post
router.put("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const { content, platform, status, scheduledFor } = req.body
    const updated = await db.update(schema.posts).set({
      content, platform, status,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      updatedAt: new Date()
    }).where(
      and(eq(schema.posts.id, Number(req.params.id)), eq(schema.posts.authorId, req.user!.id))
    ).returning()
    if (updated.length === 0) return res.status(404).json({ error: "Post not found" })
    res.json(updated[0])
  } catch (error) {
    console.error("Failed to update post:", error)
    res.status(500).json({ error: "Failed to update post" })
  }
})

// DELETE /posts/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await db.delete(schema.posts).where(
      and(eq(schema.posts.id, Number(req.params.id)), eq(schema.posts.authorId, req.user!.id))
    )
    res.status(204).send()
  } catch (error) {
    console.error("Failed to delete post:", error)
    res.status(500).json({ error: "Failed to delete post" })
  }
})

// POST /posts/:id/publish — publish to the platform NOW
router.post("/:id/publish", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const posts = await db.select().from(schema.posts)
      .where(and(eq(schema.posts.id, Number(req.params.id)), eq(schema.posts.authorId, userId)))
      .limit(1)
    
    if (posts.length === 0) return res.status(404).json({ error: "Post not found" })
    const post = posts[0]

    // Get user's OAuth token for this platform
    const connections = await db.select().from(schema.oauthConnections)
      .where(and(eq(schema.oauthConnections.userId, userId), eq(schema.oauthConnections.platform, post.platform)))
      .limit(1)
    
    if (connections.length === 0) {
      return res.status(400).json({ error: `Not connected to ${post.platform}. Please connect your account first.` })
    }
    const { accessToken, platformUserId } = connections[0]

    let platformPostId: string | undefined
    try {
      switch (post.platform) {
        case "facebook":
          platformPostId = await publishToFacebook(post.content, accessToken)
          break
        case "instagram":
          platformPostId = await publishToInstagram(post.content, accessToken)
          break
        case "linkedin":
          platformPostId = await publishToLinkedIn(post.content, accessToken, platformUserId || "")
          break
        case "twitter":
          platformPostId = await publishToTwitter(post.content, accessToken)
          break
        default:
          return res.status(400).json({ error: `Publishing to ${post.platform} is not yet supported` })
      }
      
      // Mark as published
      const updated = await db.update(schema.posts)
        .set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.posts.id, post.id))
        .returning()
      
      res.json({ message: "Published successfully", post: updated[0], platformPostId })
    } catch (publishError: any) {
      // Mark as failed
      await db.update(schema.posts)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(schema.posts.id, post.id))
      
      res.status(502).json({ error: publishError.message || "Platform publish failed" })
    }
  } catch (error) {
    console.error("Failed to publish post:", error)
    res.status(500).json({ error: "Failed to publish post" })
  }
})

export default router
