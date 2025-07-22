-- Migration: Add custom identifier to users table
-- This adds a unique custom identifier field (4 letters + 2 numbers) for team grouping

ALTER TABLE users ADD COLUMN custom_identifier TEXT UNIQUE;

-- Create an index for faster lookups by custom identifier
CREATE INDEX idx_users_custom_identifier ON users(custom_identifier); 