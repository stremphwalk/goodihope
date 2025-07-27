#!/usr/bin/env node

/**
 * Vercel Database Setup Script
 * This script sets up the database schema on Vercel Postgres
 */

import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

async function setupDatabase() {
  console.log('🚀 Setting up Vercel Postgres database...');
  
  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, '../migrations/schema.sql');
    let schemaSQL = '';
    
    if (fs.existsSync(schemaPath)) {
      schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    } else {
      // Create schema directly if migration file doesn't exist
      schemaSQL = `
        -- Create users table
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          name TEXT,
          custom_identifier TEXT UNIQUE,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create dot_phrases table
        CREATE TABLE IF NOT EXISTS dot_phrases (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
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

        -- Create ros_notes table
        CREATE TABLE IF NOT EXISTS ros_notes (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          patient_name TEXT NOT NULL,
          patient_dob TEXT NOT NULL,
          patient_mrn TEXT NOT NULL,
          selections JSONB NOT NULL,
          medications JSONB NOT NULL DEFAULT '{"homeMedications":[],"hospitalMedications":[]}',
          generated_note TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create user_presets table
        CREATE TABLE IF NOT EXISTS user_presets (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) NOT NULL,
          title TEXT NOT NULL,
          is_favorite BOOLEAN DEFAULT false,
          symptoms JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS idx_dot_phrases_user_id ON dot_phrases(user_id);
        CREATE INDEX IF NOT EXISTS idx_dot_phrases_trigger ON dot_phrases(trigger);
        CREATE INDEX IF NOT EXISTS idx_ros_notes_user_id ON ros_notes(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_presets_user_id ON user_presets(user_id);
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_custom_identifier ON users(custom_identifier);
      `;
    }

    // Execute the schema
    console.log('📋 Creating database tables...');
    await sql.unsafe(schemaSQL);
    
    console.log('✅ Database setup completed successfully!');
    
    // Verify the setup
    console.log('🔍 Verifying database setup...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log('📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();