CREATE TABLE IF NOT EXISTS "ai_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"type" text NOT NULL,
	"tier" text NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"model_id" serial NOT NULL,
	"usage_count" serial DEFAULT 0 NOT NULL,
	"reset_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_ai_preferences" (
	"user_id" serial PRIMARY KEY NOT NULL,
	"preferred_tier" text DEFAULT 'free' NOT NULL,
	"text_model_id" serial NOT NULL,
	"image_model_id" serial NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "media_url" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_text_model_id_ai_models_id_fk" FOREIGN KEY ("text_model_id") REFERENCES "ai_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_ai_preferences" ADD CONSTRAINT "user_ai_preferences_image_model_id_ai_models_id_fk" FOREIGN KEY ("image_model_id") REFERENCES "ai_models"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
