import { describe, it, expect, vi, beforeEach } from "vitest"
import { db } from "@repo/database"
import { AiOrchestrator } from "../lib/ai-orchestrator"

// Mock the database
vi.mock("@repo/database", () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => []),
          orderBy: vi.fn(() => [])
        }))
      }))
    }))
  },
  schema: {
    userAiPreferences: { userId: "userId", preferredTier: "preferredTier", textModelId: "textModelId" },
    aiModels: { type: "type", isActive: "isActive", tier: "tier", name: "name", provider: "provider", id: "id" }
  }
}))

// Mock Gemini
const { mockGenerateContent, mockGetGenerativeModel } = vi.hoisted(() => {
  const genContent = vi.fn()
  return {
    mockGenerateContent: genContent,
    mockGetGenerativeModel: vi.fn(() => ({
      generateContent: genContent
    }))
  }
})

vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: class {
      getGenerativeModel = mockGetGenerativeModel
    }
  }
})

describe("AiOrchestrator Failover", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should fail over to secondary model on 429 error", async () => {
    // 1. Mock DB to return two models
    const mockModels = [
      { id: 1, name: "gemini-1", provider: "gemini", tier: "free", isActive: "true", type: "text" },
      { id: 2, name: "gemini-2", provider: "gemini", tier: "free", isActive: "true", type: "text" }
    ]

    const selectMock = db.select as any
    selectMock.mockReturnValueOnce({
       from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
             limit: vi.fn().mockResolvedValueOnce([]) // No user prefs
          })
       })
    })

    selectMock.mockReturnValueOnce({
       from: vi.fn().mockReturnValueOnce({
          where: vi.fn().mockReturnValueOnce({
             orderBy: vi.fn().mockResolvedValueOnce(mockModels)
          })
       })
    })

    // 2. Mock Gemini to fail the first call with 429 and succeed the second
    mockGenerateContent
      .mockRejectedValueOnce(new Error("429 Too Many Requests"))
      .mockResolvedValueOnce({
        response: { text: () => "Fallback successful" }
      })

    // 3. Execute
    const result = await AiOrchestrator.generateText(1, "test prompt")

    // 4. Verify
    expect(result).toBe("Fallback successful")
    expect(mockGenerateContent).toHaveBeenCalledTimes(2)
  })

  it("should throw error if all models fail", async () => {
     // Mock DB to return one model
     const mockModels = [{ id: 1, name: "gemini-1", provider: "gemini", tier: "free", isActive: "true", type: "text" }]
     const selectMock = db.select as any
     
     selectMock.mockReturnValueOnce({ from: vi.fn().mockReturnValueOnce({ where: vi.fn().mockReturnValueOnce({ limit: vi.fn().mockResolvedValueOnce([]) }) }) })
     selectMock.mockReturnValueOnce({ from: vi.fn().mockReturnValueOnce({ where: vi.fn().mockReturnValueOnce({ orderBy: vi.fn().mockResolvedValueOnce(mockModels) }) }) })

     mockGenerateContent.mockRejectedValueOnce(new Error("Hard fail"))

     await expect(AiOrchestrator.generateText(1, "test")).rejects.toThrow("Hard fail")
  })
})
