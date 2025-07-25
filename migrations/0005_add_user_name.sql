-- Add user name field migration
-- Adds a name field to store user display names from Cognito

ALTER TABLE "users" ADD COLUMN "name" text;