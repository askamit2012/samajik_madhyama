import { Worker, Job } from "bullmq"
import { db, schema } from "@repo/database"
import { eq, inArray } from "drizzle-orm"
import nodemailer from "nodemailer"
import { bullmqConnection } from "./queues"

// ============================================================
// Email Transporter (Mailtrap sandbox — swap for production SMTP)
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525"),
  auth: {
    user: process.env.MAILTRAP_USER || process.env.SMTP_USER || "test_user",
    pass: process.env.MAILTRAP_PASS || process.env.SMTP_PASS || "test_pass",
  },
})

// ============================================================
// Job payload type
// ============================================================
export interface CampaignJobData {
  campaignId: number
  userId: number
  templateId: number
  contactIds: number[]
}

export function createCampaignWorker() {
  const campaignWorker = new Worker<CampaignJobData>(
    "campaigns",
    async (job: Job<CampaignJobData>) => {
    const { campaignId, userId, templateId, contactIds } = job.data

    console.log(`[campaign-worker] Starting job ${job.id} for campaign #${campaignId}`)

    // 1. Fetch template (verify ownership)
    const [template] = await db.select().from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.id, templateId))
      .limit(1)

    if (!template || template.ownerId !== userId) {
      throw new Error(`Template #${templateId} not found or not owned by user #${userId}`)
    }

    // 2. Fetch and filter contacts to only those owned by the user
    const contacts = await db.select().from(schema.contacts)
      .where(inArray(schema.contacts.id, contactIds))
    const validContacts = contacts.filter(c => c.ownerId === userId)

    if (validContacts.length === 0) {
      console.warn(`[campaign-worker] No valid contacts for campaign #${campaignId}`)
      await db.update(schema.campaigns)
        .set({ status: "completed", sentAt: new Date() })
        .where(eq(schema.campaigns.id, campaignId))
      return { sent: 0, failed: 0 }
    }

    // 3. Replace merge tags in template content
    const replace = (text: string, contact: typeof validContacts[0]) =>
      text
        .replace(/\{\{name\}\}/gi, contact.name)
        .replace(/\{\{email\}\}/gi, contact.email)

    // 4. Send emails — batch with progress reporting
    let sent = 0
    let failed = 0

    for (let i = 0; i < validContacts.length; i++) {
      const contact = validContacts[i]
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || '"MarketingOS" <noreply@marketingos.local>',
          to: contact.email,
          subject: replace(template.subject, contact),
          html: replace(template.htmlContent, contact),
          text: template.plainText ? replace(template.plainText, contact) : undefined,
        })
        await db.insert(schema.campaignRecipients).values({
          campaignId,
          contactId: contact.id,
          status: "sent",
          sentAt: new Date(),
        })
        sent++
      } catch (err: any) {
        console.error(`[campaign-worker] Failed to send to ${contact.email}:`, err.message)
        await db.insert(schema.campaignRecipients).values({
          campaignId,
          contactId: contact.id,
          status: "failed",
          error: err.message,
        })
        failed++
      }

      // Report progress to BullMQ UI / polling
      await job.updateProgress(Math.round(((i + 1) / validContacts.length) * 100))
    }

    // 5. Mark campaign done
    await db.update(schema.campaigns)
      .set({ status: "completed", sentAt: new Date() })
      .where(eq(schema.campaigns.id, campaignId))

    console.log(`[campaign-worker] Done: ${sent} sent, ${failed} failed for campaign #${campaignId}`)
    return { sent, failed }
    },
    {
      connection: bullmqConnection,
      concurrency: 3,
    }
  )

  campaignWorker.on("completed", (job, result) => {
    console.log(`[campaign-worker] Job ${job.id} completed:`, result)
  })

  campaignWorker.on("failed", (job, err) => {
    console.error(`[campaign-worker] Job ${job?.id} failed:`, err.message)
  })

  return campaignWorker
}
