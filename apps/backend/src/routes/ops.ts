import { Router } from "express"
import { requireOpsToken } from "../middleware/ops-auth"
import { runSchedulerTick } from "../workers/post-scheduler"
import { sweepExpiringTokens } from "../workers/token-refresh"
import { campaignQueue } from "../workers/queues"
import { processCampaignJob } from "../workers/campaign-worker"
import { db, schema } from "@repo/database"
import { eq } from "drizzle-orm"

const router = Router()

router.use(requireOpsToken)

router.post("/scheduler/tick", async (_req, res) => {
  const result = await runSchedulerTick()
  res.json({ ok: true, ...result })
})

router.post("/tokens/sweep", async (_req, res) => {
  await sweepExpiringTokens()
  res.json({ ok: true })
})

router.post("/campaigns/process", async (req, res) => {
  const limit = Math.max(1, Math.min(50, Number(req.body?.limit ?? 10)))

  const jobs = await campaignQueue.getJobs(["waiting"], 0, limit - 1, true)
  if (jobs.length === 0) {
    return res.json({ ok: true, found: 0, processed: 0, succeeded: 0, failed: 0 })
  }

  let succeeded = 0
  let failed = 0

  for (const job of jobs) {
    try {
      const campaignId = Number((job.data as any)?.campaignId)
      if (Number.isFinite(campaignId)) {
        await db.update(schema.campaigns)
          .set({ status: "sending", updatedAt: new Date() })
          .where(eq(schema.campaigns.id, campaignId))
      }

      await processCampaignJob(job.data as any)
      await job.remove()
      succeeded++
    } catch (err: any) {
      const campaignId = Number((job.data as any)?.campaignId)
      if (Number.isFinite(campaignId)) {
        await db.update(schema.campaigns)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(schema.campaigns.id, campaignId))
      }
      try { await job.remove() } catch {}
      failed++
    }
  }

  res.json({
    ok: true,
    found: jobs.length,
    processed: jobs.length,
    succeeded,
    failed,
  })
})

export default router

