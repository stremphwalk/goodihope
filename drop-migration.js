import dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables from .env file
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

async function dropTable() {
  try {
    console.log('Dropping user_presets table...');
    
    await client`
      DROP TABLE IF EXISTS user_presets;
    `;
    
    console.log('✅ Table dropped successfully!');
  } catch (error) {
    console.error('❌ Failed to drop table:', error);
  } finally {
    await client.end();
  }
}

dropTable(); 