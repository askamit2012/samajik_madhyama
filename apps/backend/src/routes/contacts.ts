import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq, and } from "drizzle-orm"
import { authenticate, AuthRequest } from "../middleware/auth"
import { validate, contactSchema } from "../middleware/validate"

const router: Router = Router()

router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const contacts = await db.select().from(schema.contacts)
      .where(eq(schema.contacts.ownerId, req.user!.id))
    res.json(contacts)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" })
  }
})

router.post("/", authenticate, validate(contactSchema), async (req: AuthRequest, res) => {
  try {
    const { name, email, tags } = req.body
    const [newContact] = await db
      .insert(schema.contacts)
      .values({ name, email, tags, ownerId: req.user!.id })
      .returning()
    res.status(201).json(newContact)
  } catch (error) {
    res.status(500).json({ error: "Failed to create contact" })
  }
})

router.put("/:id", authenticate, validate(contactSchema.partial()), async (req: AuthRequest, res) => {
  try {
    const { name, email, tags } = req.body
    const [updatedContact] = await db
      .update(schema.contacts)
      .set({ name, email, tags })
      .where(and(eq(schema.contacts.id, parseInt(req.params.id)), eq(schema.contacts.ownerId, req.user!.id)))
      .returning()
    res.json(updatedContact)
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" })
  }
})

router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    await db.delete(schema.contacts)
      .where(and(eq(schema.contacts.id, parseInt(req.params.id)), eq(schema.contacts.ownerId, req.user!.id)))
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contact" })
  }
})

export { router as contactsRouter }
