import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"
import { authenticate, AuthRequest } from "../middleware/auth"

const router: Router = Router()

/**
 * User AI Preferences (User Managed)
 */

// GET preferences
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const prefs = await db.select()
      .from(schema.userAiPreferences)
      .where(eq(schema.userAiPreferences.userId, req.user!.id))
      .limit(1)
    
    if (prefs.length === 0) {
       // Return defaults if none set
       return res.json({ preferredTier: "free", textModelId: null, imageModelId: null })
    }
    res.json(prefs[0])
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch AI preferences" })
  }
})

// PUT preferences
router.put("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const { preferredTier, textModelId, imageModelId } = req.body
    const userId = req.user!.id

    const existing = await db.select()
      .from(schema.userAiPreferences)
      .where(eq(schema.userAiPreferences.userId, userId))
      .limit(1)

    if (existing.length > 0) {
      const updated = await db.update(schema.userAiPreferences)
        .set({ preferredTier, textModelId, imageModelId })
        .where(eq(schema.userAiPreferences.userId, userId))
        .returning()
      res.json(updated[0])
    } else {
      const inserted = await db.insert(schema.userAiPreferences)
        .values({ userId, preferredTier, textModelId, imageModelId })
        .returning()
      res.status(201).json(inserted[0])
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to save AI preferences" })
  }
})

export default router
