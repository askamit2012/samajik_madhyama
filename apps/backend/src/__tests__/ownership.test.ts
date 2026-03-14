import { describe, it, expect } from "vitest"

// Mock ownership logic
function checkOwnership(resource: { userId: number }, currentUserId: number) {
  return resource.userId === currentUserId
}

describe("Ownership Boundaries", () => {
  it("should allow owner to access resource", () => {
    const post = { id: 1, userId: 100, content: "Hello" }
    expect(checkOwnership(post, 100)).toBe(true)
  })

  it("should block non-owner from accessing resource", () => {
    const post = { id: 1, userId: 100, content: "Hello" }
    expect(checkOwnership(post, 101)).toBe(false)
  })
})
