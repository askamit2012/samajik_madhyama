import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"
import { authenticate, AuthRequest } from "../middleware/auth"
import { validate, campaignSendSchema } from "../middleware/validate"
import { campaignQueue } from "../workers/queues"

const router: Router = Router()

// GET /campaigns — list campaigns for the authenticated user
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const campaignsList = await db.query.campaigns.findMany({
      where: eq(schema.campaigns.ownerId, req.user!.id),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)],
    })
    res.json(campaignsList)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    res.status(500).json({ error: "Failed to fetch campaigns" })
  }
})

// GET /campaigns/:id/status — get campaign + job progress
router.get("/:id/status", authenticate, async (req: AuthRequest, res) => {
  try {
    const campaign = await db.query.campaigns.findFirst({
      where: eq(schema.campaigns.id, parseInt(req.params.id)),
    })
    if (!campaign || campaign.ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Campaign not found" })
    }

    // Fetch BullMQ job state if jobId is stored
    let jobProgress: number | null = null
    if ((campaign as any).jobId) {
      const job = await campaignQueue.getJob((campaign as any).jobId)
      if (job) jobProgress = await job.progress as number
    }

    res.json({ ...campaign, jobProgress })
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch campaign status" })
  }
})

// POST /campaigns/send — create campaign + enqueue for async sending
router.post("/send", authenticate, validate(campaignSendSchema), async (req: AuthRequest, res) => {
  try {
    const { name, subject, templateId, contactIds } = req.body

    // 1. Verify template ownership
    const [template] = await db.select().from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.id, templateId))
      .limit(1)

    if (!template || template.ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Template not found" })
    }

    // 2. Create campaign record (status = queued)
    const [campaign] = await db.insert(schema.campaigns).values({
      name,
      subject,
      templateId,
      ownerId: req.user!.id,
      status: "queued",
    }).returning()

    // 3. Enqueue the campaign job — returns immediately
    const job = await campaignQueue.add(
      "send-campaign",
      {
        campaignId: campaign.id,
        userId: req.user!.id,
        templateId,
        contactIds,
      },
      {
        // Priority: lower number = higher priority
        priority: 1,
      }
    )

    console.log(`[campaigns] Enqueued campaign #${campaign.id} as job ${job.id}`)

    res.status(202).json({
      message: "Campaign queued for sending",
      campaignId: campaign.id,
      jobId: job.id,
    })
  } catch (error) {
    console.error("Error queueing campaign:", error)
    res.status(500).json({ error: "Failed to queue campaign" })
  }
})

export default router
