import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"

const router: Router = Router()

// Get all platform credentials
router.get("/", async (req, res) => {
  try {
    const credentials = await db.select().from(schema.platformCredentials)
    res.json(credentials)
  } catch (error) {
    console.error("Failed to fetch platform credentials:", error)
    res.status(500).json({ error: "Failed to fetch platform credentials" })
  }
})

// Create or update platform credentials
router.post("/", async (req, res) => {
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

// Delete a platform credential
router.delete("/:platform", async (req, res) => {
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
