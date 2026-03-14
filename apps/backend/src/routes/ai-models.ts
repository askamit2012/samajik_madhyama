import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"
import { authenticate, requireSuperAdmin, AuthRequest } from "../middleware/auth"

const router: Router = Router()

/**
 * AI Models Registry Management (SuperAdmin Only)
 */

// GET — List all models
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const models = await db.select().from(schema.aiModels)
    res.json(models)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch AI models" })
  }
})

// POST — Create or Update a model
router.post("/", authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { id, name, provider, type, tier, isActive } = req.body
    
    if (id) {
       const updated = await db.update(schema.aiModels)
        .set({ name, provider, type, tier, isActive, createdAt: new Date() })
        .where(eq(schema.aiModels.id, id))
        .returning()
       return res.json(updated[0])
    }

    const inserted = await db.insert(schema.aiModels)
      .values({ name, provider, type, tier, isActive: isActive ?? "true" })
      .returning()
    res.status(201).json(inserted[0])
  } catch (error) {
    res.status(500).json({ error: "Failed to save AI model" })
  }
})

// DELETE
router.delete("/:id", authenticate, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id)
    await db.delete(schema.aiModels).where(eq(schema.aiModels.id, id))
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: "Failed to delete AI model" })
  }
})

export default router
