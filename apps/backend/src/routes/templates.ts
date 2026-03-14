import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq, and } from "drizzle-orm"
import { authenticate, AuthRequest } from "../middleware/auth"
import { validate, templateSchema } from "../middleware/validate"

const router: Router = Router()

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const templates = await db.select().from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.ownerId, req.user!.id))
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates" })
  }
})

router.post("/", authenticate, validate(templateSchema), async (req: AuthRequest, res) => {
  try {
    const { name, subject, htmlContent, plainText } = req.body
    const [newTemplate] = await db
      .insert(schema.emailTemplates)
      .values({ name, subject, htmlContent, plainText, ownerId: req.user!.id })
      .returning()
    res.status(201).json(newTemplate)
  } catch (error) {
    res.status(500).json({ error: "Failed to create template" })
  }
})

router.put("/:id", authenticate, validate(templateSchema.partial()), async (req: AuthRequest, res) => {
  try {
    const { name, subject, htmlContent, plainText } = req.body
    const [updatedTemplate] = await db
      .update(schema.emailTemplates)
      .set({ name, subject, htmlContent, plainText, updatedAt: new Date() })
      .where(and(eq(schema.emailTemplates.id, parseInt(req.params.id)), eq(schema.emailTemplates.ownerId, req.user!.id)))
      .returning()
    res.json(updatedTemplate)
  } catch (error) {
    res.status(500).json({ error: "Failed to update template" })
  }
})

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await db.delete(schema.emailTemplates)
      .where(and(eq(schema.emailTemplates.id, parseInt(req.params.id)), eq(schema.emailTemplates.ownerId, req.user!.id)))
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: "Failed to delete template" })
  }
})

export { router as templatesRouter }
