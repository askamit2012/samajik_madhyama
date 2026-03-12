import { db, schema } from "@repo/database"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"

async function seed() {
  console.log("Seeding initial superadmin...")
  const email = "superadmin@example.com"
  const password = "admin"
  
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
  if (existing.length > 0) {
    console.log("Superadmin already exists.")
    process.exit(0)
  }
  
  const passwordHash = await bcrypt.hash(password, 10)
  
  await db.insert(schema.users).values({
    name: "Super Admin",
    email,
    passwordHash,
    role: "superadmin"
  })
  
  console.log("✅ Superadmin created successfully!")
  console.log(`Email: ${email}`)
  console.log(`Password: ${password}`)
  process.exit(0)
}

seed().catch((e) => {
  console.error("Seed failed:", e)
  process.exit(1)
})
