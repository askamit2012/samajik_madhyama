import { z, ZodSchema } from "zod"
import { Request, Response, NextFunction } from "express"

/** Wraps a Zod schema into Express middleware that validates req.body.
 *  On failure, returns 400 with a structured error envelope. */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((e: z.ZodIssue) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      })
    }
    req.body = result.data   // replace with coerced/stripped data
    next()
  }
}

/* =====================================================
   SCHEMAS — one per write endpoint
   ===================================================== */

export const signupSchema = z.object({
  name:     z.string().min(1, "Name is required").max(100),
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const postSchema = z.object({
  content:      z.string().min(1, "Content is required").max(63206),
  platform:     z.enum(["facebook", "instagram", "linkedin", "twitter", "google"]),
  status:       z.enum(["draft", "scheduled", "published"]).default("draft"),
  scheduledFor: z.string().datetime({ offset: true }).optional().nullable(),
})

export const contactSchema = z.object({
  name:  z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address"),
  tags:  z.string().max(500).optional().nullable(),
})

export const templateSchema = z.object({
  name:        z.string().min(1, "Name is required").max(200),
  subject:     z.string().min(1, "Subject is required").max(500),
  htmlContent: z.string().min(1, "HTML content is required"),
  plainText:   z.string().optional().nullable(),
})

export const campaignSendSchema = z.object({
  name:       z.string().min(1, "Name is required").max(200),
  subject:    z.string().min(1, "Subject is required").max(500),
  templateId: z.number().int().positive("Template ID must be a positive integer"),
  contactIds: z.array(z.number().int().positive()).min(1, "Select at least one contact"),
})
