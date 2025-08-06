-- Migration: Add additional constraints and validation to user_lab_settings table
-- Date: 2025-07-30

-- Add constraint to ensure settings JSONB is not empty
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_settings_not_empty" 
CHECK (jsonb_typeof(settings) = 'object' AND settings != '{}');

-- Add constraint to ensure settings has required version field
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_version_required" 
CHECK (settings ? 'version' AND (settings->>'version')::int >= 1);

-- Add constraint to ensure settings has panelOrder array
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_panel_order_required" 
CHECK (settings ? 'panelOrder' AND jsonb_typeof(settings->'panelOrder') = 'array');

-- Add constraint to limit settings size (prevent abuse)
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_size_limit" 
CHECK (length(settings::text) <= 102400); -- 100KB limit

-- Add check to ensure timestamps are reasonable
ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_created_at_reasonable" 
CHECK (created_at >= '2025-01-01'::timestamp AND created_at <= NOW() + INTERVAL '1 hour');

ALTER TABLE "user_lab_settings" ADD CONSTRAINT "user_lab_settings_updated_at_reasonable" 
CHECK (updated_at >= created_at AND updated_at <= NOW() + INTERVAL '1 hour');

-- Add comment for documentation
COMMENT ON TABLE "user_lab_settings" IS 'Stores user-specific lab display preferences for cross-platform synchronization';
COMMENT ON COLUMN "user_lab_settings"."settings" IS 'JSONB object containing lab settings with version, panelOrder, and other preferences';
COMMENT ON COLUMN "user_lab_settings"."user_id" IS 'References users.id with CASCADE delete to clean up when user is deleted';