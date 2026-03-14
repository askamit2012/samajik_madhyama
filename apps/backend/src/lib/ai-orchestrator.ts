import { db, schema } from "@repo/database"
import { eq, and, asc } from "drizzle-orm"
import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * AI Orchestrator: High-level controller for AI operations.
 * Handles model selection, preference matching, and failover/retry logic.
 */

type AIType = "text" | "image"

export class AiOrchestrator {
  private static genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null

  /**
   * Resolves the best available agent for a user based on their settings and tier limits.
   */
  static async resolveAgent(userId: number, type: AIType) {
    // 1. Get user preferences
    const [prefs] = await db.select()
      .from(schema.userAiPreferences)
      .where(eq(schema.userAiPreferences.userId, userId))
      .limit(1)

    const preferredTier = prefs?.preferredTier || "free"
    const preferredModelId = type === "text" ? prefs?.textModelId : prefs?.imageModelId

    // 2. Query available active models of the matching type, sorted by preference logic
    // We prioritize the user's specific selection, then their tier, then anything active.
    const models = await db.select()
      .from(schema.aiModels)
      .where(and(
        eq(schema.aiModels.type, type),
        eq(schema.aiModels.isActive, "true")
      ))
      .orderBy(asc(schema.aiModels.tier)) // Simple sort for now

    if (models.length === 0) {
      throw new Error(`No active AI agents available for ${type} generation.`)
    }

    // Filter to preferred tier models
    let candidateModels = models.filter(m => m.tier === preferredTier)
    
    // If we want paid but none available, or vice versa, fall back to anything available
    if (candidateModels.length === 0) {
      candidateModels = models
    }

    // Put preferred model at the top if it exists
    if (preferredModelId) {
       const idx = candidateModels.findIndex(m => m.id === preferredModelId)
       if (idx > -1) {
          const [m] = candidateModels.splice(idx, 1)
          candidateModels.unshift(m)
       }
    }

    return candidateModels
  }

  /**
   * Generates text content with automatic failover across candidate models.
   */
  static async generateText(userId: number, prompt: string): Promise<string> {
    const candidates = await this.resolveAgent(userId, "text")
    let lastError: any = null

    for (const model of candidates) {
      try {
        console.log(`[AI] Attempting generation with ${model.name} (${model.provider})...`)
        
        if (model.provider === "gemini") {
           if (!this.genAI) throw new Error("GEMINI_API_KEY not configured on server.")
           const genModel = this.genAI.getGenerativeModel({ model: model.name || "gemini-1.5-flash" })
           const result = await genModel.generateContent(prompt)
           const response = await result.response
           return response.text()
        }

        // Add more providers (OpenAI, etc.) here
        throw new Error(`Unsupported provider: ${model.provider}`)

      } catch (error: any) {
        lastError = error
        console.error(`[AI] Model ${model.name} failed:`, error.message)
        // Check for rate limits or quota errors to trigger failover
        const isQuotaError = error.message?.includes("429") || error.message?.includes("quota")
        if (!isQuotaError && candidates.indexOf(model) === candidates.length - 1) break 
        // Continue to next model if it's a quota issue or we have more candidates
      }
    }

    throw new Error(lastError?.message || "All AI agents failed to generate content.")
  }

  /**
   * Generates image content (placeholder for now, structured for failover).
   */
  static async generateImage(userId: number, prompt: string): Promise<string> {
    const candidates = await this.resolveAgent(userId, "image")
    
    for (const model of candidates) {
        // Placeholder for Replicate / DALL-E integration
        console.warn(`[AI] Image generation requested with ${model.name} but not yet integrated.`)
        // In a real implementation, we'd hit the API here.
    }
    
    throw new Error("Image generation engine currently under maintenance. Please try a text variant.")
  }
}
