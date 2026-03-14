import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core"

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("user").notNull(), // 'user', 'admin', 'superadmin'
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"), // URL to generated/uploaded image
  authorId: serial("author_id").references(() => users.id).notNull(),
  platform: text("platform").notNull(), // "facebook", "linkedin", "twitter", "instagram"
  status: text("status").default("draft").notNull(), // "draft", "scheduled", "published", "failed"
  scheduledFor: timestamp("scheduled_for"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const platformCredentials = pgTable("platform_credentials", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull().unique(), // "facebook", "linkedin", "twitter", "instagram", "google"
  appId: text("app_id").notNull(),
  appSecret: text("app_secret").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const oauthConnections = pgTable("oauth_connections", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id).notNull(),
  platform: text("platform").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  platformUserId: text("platform_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  tags: text("tags"), // e.g., "subscriber, lead"
  ownerId: serial("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const emailTemplates = pgTable("email_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  plainText: text("plain_text"),
  ownerId: serial("owner_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  templateId: serial("template_id").references(() => emailTemplates.id),
  ownerId: serial("owner_id").references(() => users.id).notNull(),
  status: text("status").default("draft").notNull(), // 'draft', 'scheduled', 'sending', 'completed', 'failed'
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})

export const campaignRecipients = pgTable("campaign_recipients", {
  id: serial("id").primaryKey(),
  campaignId: serial("campaign_id").references(() => campaigns.id).notNull(),
  contactId: serial("contact_id").references(() => contacts.id).notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'sent', 'delivered', 'failed'
  sentAt: timestamp("sent_at"),
  error: text("error"),
})

export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(), // 'gemini', 'openai', 'replicate'
  type: text("type").notNull(), // 'text', 'image'
  tier: text("tier").notNull(), // 'free', 'paid'
  isActive: text("is_active").default("true").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const userAiPreferences = pgTable("user_ai_preferences", {
  userId: integer("user_id").references(() => users.id).primaryKey(),
  preferredTier: text("preferred_tier").default("free").notNull(), // 'free', 'paid'
  textModelId: integer("text_model_id").references(() => aiModels.id),
  imageModelId: integer("image_model_id").references(() => aiModels.id),
})

export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  modelId: integer("model_id").references(() => aiModels.id).notNull(),
  usageCount: integer("usage_count").default(0).notNull(),
  resetAt: timestamp("reset_at").defaultNow().notNull(),
})
