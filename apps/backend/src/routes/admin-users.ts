import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq, ne } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { authenticate, requireSuperAdmin } from "../middleware/auth"

const router: Router = Router()

// Get all admin users
router.get("/", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    // Return all users who are 'admin' or 'superadmin'
    const admins = await db.select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      createdAt: schema.users.createdAt,
    }).from(schema.users)
      .where(ne(schema.users.role, "user"))
      
    res.json(admins)
  } catch (error) {
    console.error("Fetch admins error:", error)
    res.status(500).json({ error: "Failed to fetch admin users" })
  }
})

// Create a new admin or superadmin
router.post("/", authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    
    if (role !== "admin" && role !== "superadmin") {
      return res.status(400).json({ error: "Role must be admin or superadmin" })
    }
    
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already in use" })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const newUser = await db.insert(schema.users).values({
      name,
      email,
      passwordHash,
      role
    }).returning()
    
    const user = newUser[0]
    
    res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (error) {
    console.error("Create admin error:", error)
    res.status(500).json({ error: "Failed to create admin user" })
  }
})

// Delete an admin (cannot delete self)
router.delete("/:id", authenticate, requireSuperAdmin, async (req: any, res) => {
  try {
    const { id } = req.params
    const targetId = Number(id)
    
    if (targetId === req.user.id) {
      return res.status(400).json({ error: "Cannot delete yourself" })
    }
    
    await db.delete(schema.users).where(eq(schema.users.id, targetId))
    res.status(204).send()
  } catch (error) {
    console.error("Delete admin error:", error)
    res.status(500).json({ error: "Failed to delete admin user" })
  }
})

export default router
