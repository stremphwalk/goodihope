-- Migration: Add user_presets table
-- This adds a table for storing user presets for HPI sections

CREATE TABLE user_presets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  symptoms JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_presets_user_id ON user_presets(user_id);
CREATE INDEX idx_user_presets_updated_at ON user_presets(updated_at);

-- Add unique constraint to prevent duplicate titles per user
-- Note: This will be enforced at the application level for better error handling 