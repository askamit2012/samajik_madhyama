import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"

const router: Router = Router()

// Default owner hardcoded for MVP until proper auth
const getTempUserId = () => 1 

router.get("/", async (req, res) => {
  try {
    const templates = await db.select().from(schema.emailTemplates).where(eq(schema.emailTemplates.ownerId, getTempUserId()))
    res.json(templates)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch templates" })
  }
})

router.post("/", async (req, res) => {
  try {
    const { name, subject, htmlContent, plainText } = req.body
    const [newTemplate] = await db
      .insert(schema.emailTemplates)
      .values({ name, subject, htmlContent, plainText, ownerId: getTempUserId() })
      .returning()
    res.status(201).json(newTemplate)
  } catch (error) {
    res.status(500).json({ error: "Failed to create template" })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, subject, htmlContent, plainText } = req.body
    const [updatedTemplate] = await db
      .update(schema.emailTemplates)
      .set({ name, subject, htmlContent, plainText, updatedAt: new Date() })
      .where(eq(schema.emailTemplates.id, parseInt(id)))
      .returning()
    res.json(updatedTemplate)
  } catch (error) {
    res.status(500).json({ error: "Failed to update template" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    await db.delete(schema.emailTemplates).where(eq(schema.emailTemplates.id, parseInt(id)))
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: "Failed to delete template" })
  }
})

export { router as templatesRouter }
