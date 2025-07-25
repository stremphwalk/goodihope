-- Add todo status field migration
-- Adds status field to group_todos table and migrates existing data

-- Add status column with default value
ALTER TABLE "group_todos" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;

-- Update existing completed todos to have 'completed' status
UPDATE "group_todos" SET "status" = 'completed' WHERE "completed" = true;