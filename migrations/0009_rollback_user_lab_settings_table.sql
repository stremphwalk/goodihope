-- Rollback Migration: Remove user_lab_settings table
-- Date: 2025-07-30
-- This is the rollback for 0009_add_user_lab_settings_table.sql

-- Drop the trigger first
DROP TRIGGER IF EXISTS user_lab_settings_updated_at_trigger ON "user_lab_settings";

-- Drop the function
DROP FUNCTION IF EXISTS update_user_lab_settings_updated_at();

-- Drop the index
DROP INDEX IF EXISTS "idx_user_lab_settings_user_id";

-- Drop the table (constraints will be dropped automatically)
DROP TABLE IF EXISTS "user_lab_settings";