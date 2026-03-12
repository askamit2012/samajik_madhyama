import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { authenticate, AuthRequest } from "../middleware/auth"

const router: Router = Router()
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev_only"

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    
    // Check if user exists
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
    if (existing.length > 0) {
      return res.status(400).json({ error: "Email already in use" })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    // Default role is user. We let only superadmin create other admins.
    const newUser = await db.insert(schema.users).values({
      name,
      email,
      passwordHash,
      role: "user"
    }).returning()
    
    const user = newUser[0]
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" })
    
    res.status(201).json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token 
    })
  } catch (error) {
    console.error("Signup error:", error)
    res.status(500).json({ error: "Failed to create user" })
  }
})

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body
    
    if (!email || !password) {
      return res.status(400).json({ error: "Missing required fields" })
    }
    
    const users = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" })
    }
    
    const user = users[0]
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" })
    
    res.json({ 
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, 
      token 
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Failed to log in" })
  }
})

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const users = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1)
    
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" })
    }
    
    const user = users[0]
    res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (error) {
    console.error("Me error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

export default router
