import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"
import { authenticate, requireSuperAdmin, AuthRequest } from "../middleware/auth"

const router: Router = Router()

// GET — all admins can read; mask secret
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const credentials = await db.select().from(schema.platformCredentials)
    // Mask the secret in responses
    const masked = credentials.map(c => ({ ...c, appSecret: c.appSecret ? "••••••••••••" : null }))
    res.json(masked)
  } catch (error) {
    console.error("Failed to fetch platform credentials:", error)
    res.status(500).json({ error: "Failed to fetch platform credentials" })
  }
})

// POST — superadmin only
router.post("/", authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { platform, appId, appSecret } = req.body
    
    // Check if it exists
    const existing = await db.select().from(schema.platformCredentials).where(eq(schema.platformCredentials.platform, platform)).limit(1)
    
    if (existing.length > 0) {
      // Update
      const updated = await db
        .update(schema.platformCredentials)
        .set({ appId, appSecret, updatedAt: new Date() })
        .where(eq(schema.platformCredentials.platform, platform))
        .returning()
      res.json(updated[0])
    } else {
      // Insert
      const inserted = await db
        .insert(schema.platformCredentials)
        .values({ platform, appId, appSecret })
        .returning()
      res.status(201).json(inserted[0])
    }
  } catch (error) {
    console.error("Failed to save platform credentials:", error)
    res.status(500).json({ error: "Failed to save platform credentials" })
  }
})

// DELETE — superadmin only
router.delete("/:platform", authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { platform } = req.params
    await db.delete(schema.platformCredentials).where(eq(schema.platformCredentials.platform, platform))
    res.status(204).send()
  } catch (error) {
    console.error("Failed to delete platform credentials:", error)
    res.status(500).json({ error: "Failed to delete platform credentials" })
  }
})

export default router
