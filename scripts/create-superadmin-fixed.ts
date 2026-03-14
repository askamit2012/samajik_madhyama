import { db, schema } from "@repo/database"
import bcrypt from "bcryptjs"

// Load env from backend
import path from "path"
import fs from "fs"
import dotenv from "dotenv"

const envPath = path.join(__dirname, "../apps/backend/.env")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const dbUrl = process.env.DATABASE_URL || "NOT_SET"
console.log(`📡 Using Database URL: ${dbUrl}`)

async function createSuperAdmin() {
  const name = "Super Admin"
  const email = "admin@marketingos.com"
  const password = "admin_password_change_me"

  console.log(`🚀 Creating superadmin in current database: ${email}...`)

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    
    const [user] = await db.insert(schema.users).values({
      name,
      email,
      passwordHash,
      role: "superadmin"
    }).returning()

    console.log("✅ Super Admin created successfully in correct database!")
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    process.exit(0)
  } catch (error: any) {
    if (error.code === '23505') {
       console.error("❌ Error: A user with this email already exists in this database.")
    } else {
       console.error("❌ Failed to create superadmin:", error)
    }
    process.exit(1)
  }
}

createSuperAdmin()
