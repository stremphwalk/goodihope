const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_ghEHD45PdKXm@ep-soft-dew-ad90yk9c-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
});

const schemaSQL = `
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT,
  custom_identifier TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT false,
  reset_token TEXT,
  reset_token_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create dot phrases table
CREATE TABLE IF NOT EXISTS dot_phrases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  trigger TEXT NOT NULL,
  content TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  share_code TEXT UNIQUE,
  is_public BOOLEAN DEFAULT false,
  shared_at TIMESTAMP,
  import_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create ROS notes table
CREATE TABLE IF NOT EXISTS ros_notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  patient_name TEXT NOT NULL,
  patient_dob TEXT NOT NULL,
  patient_mrn TEXT NOT NULL,
  selections JSONB NOT NULL,
  medications JSONB NOT NULL DEFAULT '{"homeMedications":[],"hospitalMedications":[]}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  version INTEGER DEFAULT 1,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create template usage table
CREATE TABLE IF NOT EXISTS template_usage (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES templates(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  used_at TIMESTAMP DEFAULT NOW()
);

-- NextAuth tables (for compatibility)
CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  UNIQUE(provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  "sessionToken" TEXT UNIQUE NOT NULL,
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions("userId");
CREATE INDEX IF NOT EXISTS idx_sessions_session_token ON sessions("sessionToken");
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_dot_phrases_user_id ON dot_phrases(user_id);
CREATE INDEX IF NOT EXISTS idx_ros_notes_user_id ON ros_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON templates(user_id);
`;

async function setupSchema() {
  try {
    console.log('🚀 Setting up Neon database schema...');
    
    await pool.query(schemaSQL);
    
    console.log('✅ Schema setup complete!');
    console.log('\n📊 Created tables:');
    console.log('  - users (with NextAuth compatibility)');
    console.log('  - user_sessions');
    console.log('  - dot_phrases');
    console.log('  - ros_notes');
    console.log('  - templates');
    console.log('  - template_usage');
    console.log('  - accounts (NextAuth)');
    console.log('  - sessions (NextAuth)');
    console.log('  - verification_tokens (NextAuth)');
    console.log('\n🔗 Database ready for NextAuth + your application!');
    
  } catch (error) {
    console.error('❌ Schema setup failed:', error.message);
  } finally {
    await pool.end();
  }
}

setupSchema();