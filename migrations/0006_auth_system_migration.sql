-- Migration to update user authentication system
-- Drop the old username column and add new auth fields

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN email TEXT,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN reset_token TEXT,
ADD COLUMN reset_token_expires TIMESTAMP,
ADD COLUMN last_login_at TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Copy existing username to email (temporary for migration)
UPDATE users SET email = username WHERE email IS NULL;

-- Make email required and unique
ALTER TABLE users 
ALTER COLUMN email SET NOT NULL,
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Drop the old username column
ALTER TABLE users DROP COLUMN username;

-- Create user_sessions table
CREATE TABLE user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);