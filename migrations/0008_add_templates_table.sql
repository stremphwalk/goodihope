-- Add Templates feature tables (compatible with UUID user IDs)

-- Create templates table
CREATE TABLE IF NOT EXISTS "templates" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "description" text,
  "category" text NOT NULL DEFAULT 'general',
  "specialty" text,
  "content" jsonb NOT NULL, -- Flexible typed content
  "is_public" boolean DEFAULT false,
  "version" integer DEFAULT 1,
  "parent_template_id" integer,
  "compatible_note_types" jsonb,
  "compatible_subtypes" jsonb,
  "section_defaults" jsonb,
  "is_favorite" boolean DEFAULT false,
  "last_used" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Create template usage table to track analytics
CREATE TABLE IF NOT EXISTS "template_usage" (
  "id" serial PRIMARY KEY NOT NULL,
  "template_id" integer NOT NULL REFERENCES "templates"("id") ON DELETE CASCADE,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "patient_context" jsonb,
  "used_at" timestamp DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS "idx_templates_user_id" ON "templates"("user_id");
CREATE INDEX IF NOT EXISTS "idx_template_usage_template_id" ON "template_usage"("template_id");
CREATE INDEX IF NOT EXISTS "idx_template_usage_user_id" ON "template_usage"("user_id"); 