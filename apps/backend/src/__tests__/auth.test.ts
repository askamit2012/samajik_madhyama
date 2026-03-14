import { describe, it, expect, vi } from "vitest"
import jwt from "jsonwebtoken"

const JWT_SECRET = "test_secret"

describe("Auth Logic", () => {
  it("should generate a valid JWT", () => {
    const payload = { id: 1, role: "user" }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" })
    
    expect(token).toBeDefined()
    const decoded = jwt.verify(token, JWT_SECRET) as any
    expect(decoded.id).toBe(payload.id)
    expect(decoded.role).toBe(payload.role)
  })

  it("should fail with invalid secret", () => {
    const token = jwt.sign({ id: 1 }, JWT_SECRET)
    expect(() => jwt.verify(token, "wrong_secret")).toThrow()
  })
})
