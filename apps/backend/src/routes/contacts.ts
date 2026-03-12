import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"

const router: Router = Router()

// Default owner hardcoded for MVP until proper auth
const getTempUserId = () => 1 

router.get("/", async (req, res) => {
  try {
    const contacts = await db.select().from(schema.contacts).where(eq(schema.contacts.ownerId, getTempUserId()))
    res.json(contacts)
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch contacts" })
  }
})

router.post("/", async (req, res) => {
  try {
    const { name, email, tags } = req.body
    const [newContact] = await db
      .insert(schema.contacts)
      .values({ name, email, tags, ownerId: getTempUserId() })
      .returning()
    res.status(201).json(newContact)
  } catch (error) {
    res.status(500).json({ error: "Failed to create contact" })
  }
})

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, tags } = req.body
    const [updatedContact] = await db
      .update(schema.contacts)
      .set({ name, email, tags })
      .where(eq(schema.contacts.id, parseInt(id)))
      .returning()
    res.json(updatedContact)
  } catch (error) {
    res.status(500).json({ error: "Failed to update contact" })
  }
})

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params
    await db.delete(schema.contacts).where(eq(schema.contacts.id, parseInt(id)))
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: "Failed to delete contact" })
  }
})

export { router as contactsRouter }
