import { Router } from "express"
import { db, schema } from "@repo/database"
import { eq, inArray } from "drizzle-orm"
import { authenticate, AuthRequest } from "../middleware/auth"
import nodemailer from "nodemailer"

const router: Router = Router()

// Configure Mailtrap transporter (Sandbox)
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER || "test_user",
    pass: process.env.MAILTRAP_PASS || "test_pass"
  }
})

// Get all campaigns for a user
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const campaignsList = await db.query.campaigns.findMany({
      where: eq(schema.campaigns.ownerId, req.user!.id),
      orderBy: (campaigns, { desc }) => [desc(campaigns.createdAt)]
    })
    res.json(campaignsList)
  } catch (error) {
    console.error("Error fetching campaigns:", error)
    res.status(500).json({ error: "Failed to fetch campaigns" })
  }
})

// Create and Send Campaign
router.post("/send", authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, subject, templateId, contactIds } = req.body

    if (!name || !subject || !templateId || !contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: "Missing required fields or no contacts selected" })
    }

    // 1. Fetch Template
    const templates = await db.select().from(schema.emailTemplates)
      .where(eq(schema.emailTemplates.id, templateId))
      .limit(1)
      
    if (templates.length === 0 || templates[0].ownerId !== req.user!.id) {
      return res.status(404).json({ error: "Template not found" })
    }
    const template = templates[0]

    // 2. Create Campaign Record
    const newCampaign = await db.insert(schema.campaigns).values({
      name,
      subject,
      templateId,
      ownerId: req.user!.id,
      status: "sending"
    }).returning()
    const campaignId = newCampaign[0].id

    // 3. Fetch Contacts
    const recipients = await db.select().from(schema.contacts)
      .where(inArray(schema.contacts.id, contactIds))
    
    // Filter out contacts that do not belong to the user
    const validRecipients = recipients.filter(c => c.ownerId === req.user!.id)

    // 4. Send Emails via Nodemailer
    const promises = validRecipients.map(async (contact) => {
      try {
        await transporter.sendMail({
          from: '"SocialApp Admin" <admin@socialapp.local>',
          to: contact.email,
          subject: subject,
          html: template.htmlContent, // Simplistic without merge-tags for now
          text: template.plainText || undefined
        })
        
        // Log Success
        await db.insert(schema.campaignRecipients).values({
          campaignId,
          contactId: contact.id,
          status: "sent",
          sentAt: new Date()
        })
      } catch (err: any) {
        console.error(`Failed to send email to ${contact.email}:`, err)
        // Log Failure
        await db.insert(schema.campaignRecipients).values({
          campaignId,
          contactId: contact.id,
          status: "failed",
          error: err.message
        })
      }
    })

    await Promise.allSettled(promises)

    // 5. Mark Campaign Completed
    await db.update(schema.campaigns)
      .set({ status: "completed", sentAt: new Date() })
      .where(eq(schema.campaigns.id, campaignId))

    res.status(200).json({ message: "Campaign sent successfully", campaignId })
  } catch (error) {
    console.error("Error sending campaign:", error)
    res.status(500).json({ error: "Failed to send campaign" })
  }
})

export default router
