import { Router } from "express"
import { authenticate, AuthRequest } from "../middleware/auth"
import { AiOrchestrator } from "../lib/ai-orchestrator"
import { z } from "zod"

const router: Router = Router()

const postDraftSchema = z.object({
  brief: z.string().min(5),
  platform: z.string().optional(),
  tone: z.string().default("Professional")
})

const imageRequestSchema = z.object({
  prompt: z.string().min(5)
})

/**
 * Main AI Content Generation Endpoints
 */

// POST /ai/draft-post
router.post("/draft-post", authenticate, async (req: AuthRequest, res) => {
  try {
    const { brief, platform, tone } = postDraftSchema.parse(req.body)
    const userId = req.user!.id
    
    const prompt = `Write 3 social media post variants for ${platform || 'general platforms'} based on this brief: "${brief}". 
    Tone: ${tone}. 
    Ensure they are engaging and include relevant hashtags. 
    Format: Output 3 variants separated by "---".`

    const result = await AiOrchestrator.generateText(userId, prompt)
    const variants = result.split("---").map(v => v.trim()).filter(v => v.length > 0)
    
    res.json({ variants })
  } catch (error: any) {
    console.error("[AI Route Error]", error)
    res.status(400).json({ error: error.message || "Failed to generate post draft" })
  }
})

// POST /ai/generate-image
router.post("/generate-image", authenticate, async (req: AuthRequest, res) => {
  try {
    const { prompt } = imageRequestSchema.parse(req.body)
    const userId = req.user!.id

    // Use full orchestrator logic for image generation
    const imageUrl = await AiOrchestrator.generateImage(userId, prompt)
    res.json({ imageUrl })
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to generate image" })
  }
})

// POST /ai/draft-email
router.post("/draft-email", authenticate, async (req: AuthRequest, res) => {
  try {
    const { goal } = z.object({ goal: z.string().min(5) }).parse(req.body)
    const userId = req.user!.id

    const prompt = `Act as an elite email marketer. Create a high-converting email template for the goal: "${goal}".
    Provide a compelling subject line and a clean HTML body.
    Include {{name}} for personalization.
    Format your response as:
    SUBJECT: [subject here]
    BODY: [html body here]`

    const result = await AiOrchestrator.generateText(userId, prompt)
    const subject = result.match(/SUBJECT: (.*)/)?.[1] || "Automated Message"
    const htmlBody = result.split("BODY:")[1]?.trim() || result

    res.json({ subject, htmlBody })
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Email generation failed" })
  }
})

// POST /ai/suggest-time
router.post("/suggest-time", authenticate, async (req: AuthRequest, res) => {
  try {
    const { platform } = z.object({ platform: z.string() }).parse(req.body)
    
    // Simulations of peak engagement per platform
    const peakHours: Record<string, number[]> = {
      facebook: [9, 13, 15],
      instagram: [11, 13, 19],
      linkedin: [8, 10, 12],
      twitter: [12, 15, 18],
      google: [10, 14, 16]
    }

    const hours = peakHours[platform.toLowerCase()] || [12, 17]
    const suggestedHour = hours[Math.floor(Math.random() * hours.length)]
    
    const suggestion = new Date()
    suggestion.setDate(suggestion.getDate() + 1) // Tomorrow
    suggestion.setHours(suggestedHour, 0, 0, 0)

    res.json({ suggestedTime: suggestion.toISOString() })
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Time suggestion failed" })
  }
})

export default router
