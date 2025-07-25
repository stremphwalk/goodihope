-- Migration: Add assignment field and update status values for Kanban board
-- This migration adds task assignment capability and updates status values

-- Add assignment field to group_todos table
ALTER TABLE "group_todos" ADD COLUMN "assigned_to_user_id" integer REFERENCES "users"("id");

-- Update existing status values from old system to new Kanban values
UPDATE "group_todos" SET "status" = 'todo' WHERE "status" = 'active';
UPDATE "group_todos" SET "status" = 'done' WHERE "status" = 'completed';

-- Note: 'in_progress' status remains the same, 'review' is new and will be used for tasks ready for review