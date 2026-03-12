import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

export * from "./schema"
export { schema }

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/social"

const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
