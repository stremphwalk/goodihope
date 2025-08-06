-- Migration: Add user_lab_settings table for cross-platform lab preferences
-- Date: 2025-07-30

CREATE TABLE IF NOT EXISTS "user_lab_settings" (
	"id" SERIAL PRIMARY KEY NOT NULL,
	"user_id" UUID NOT NULL,
	"settings" JSONB NOT NULL,
	"created_at" TIMESTAMP DEFAULT NOW(),
	"updated_at" TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Add unique constraint to ensure one settings record per user
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_user_id_unique" UNIQUE("user_id");

-- Add index for faster user lookups
CREATE INDEX "idx_user_lab_settings_user_id" ON "user_lab_settings" ("user_id");

-- Add trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_lab_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_lab_settings_updated_at_trigger
    BEFORE UPDATE ON "user_lab_settings"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_lab_settings_updated_at();