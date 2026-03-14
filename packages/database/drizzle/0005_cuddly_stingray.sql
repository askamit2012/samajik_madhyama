ALTER TABLE "ai_usage_logs" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ALTER COLUMN "model_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ALTER COLUMN "usage_count" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ALTER COLUMN "text_model_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ALTER COLUMN "text_model_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ALTER COLUMN "image_model_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "user_ai_preferences" ALTER COLUMN "image_model_id" DROP NOT NULL;