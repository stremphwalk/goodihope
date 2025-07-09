ALTER TABLE "dot_phrases" ADD COLUMN "share_code" text;--> statement-breakpoint
ALTER TABLE "dot_phrases" ADD COLUMN "is_public" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "dot_phrases" ADD COLUMN "shared_at" timestamp;--> statement-breakpoint
ALTER TABLE "dot_phrases" ADD COLUMN "import_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "dot_phrases" ADD CONSTRAINT "dot_phrases_share_code_unique" UNIQUE("share_code");