import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, rosNotes, dotPhrases, userPresets, userSessions } from '../shared/schema.js';
import { eq, desc, and } from 'drizzle-orm';

// Neon database connection - supports Vercel Neon integration variable names
const connectionString = process.env.POSTGRES_URL || 
                         process.env.POSTGRES_DATABASE_URL ||
                         process.env.NEON_DATABASE_URL || 
                         process.env.DATABASE_URL;

let db: any = null;

if (connectionString) {
  try {
    // Validate connection string format
    if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
      // Create postgres connection optimized for Neon
      const client = postgres(connectionString, {
        max: 1, // Neon recommends single connection per serverless function
        ssl: 'require', // Neon always requires SSL
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false, // Disable prepared statements for serverless
        transform: postgres.camel, // Transform snake_case to camelCase
        onnotice: () => {}, // Suppress NOTICE messages
      });

      // Create drizzle database instance
      db = drizzle(client, {
        schema: { users, rosNotes, dotPhrases, userPresets, userSessions }
      });
      
      console.log('✅ Neon database connection initialized');
    } else {
      console.warn('⚠️  Invalid database URL format, database features disabled');
    }
  } catch (error) {
    console.warn('⚠️  Neon database connection failed, database features disabled:', error);
  }
} else {
  console.warn('⚠️  NEON_DATABASE_URL not provided, database features disabled');
}

export { db };

// Export tables for easy access
export { users, rosNotes, dotPhrases, userPresets, userSessions };

// Database operations with error handling
export const userQueries = {
  async getUserById(id: number) {
    if (!db) throw new Error('Database not available');
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  },

  async getUserByUsername(username: string) {
    if (!db) throw new Error('Database not available');
    if (!username || typeof username !== 'string' || username.length > 50) {
      throw new Error('Invalid username');
    }
    try {
      const result = await db.select().from(users).where(eq(users.email, username)).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error;
    }
  },

  async createUser(userData: { username: string; password: string }) {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: number, userData: Partial<typeof users.$inferInsert>) {
    if (!db) throw new Error('Database not available');
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }
    try {
      const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }
};

export const dotPhraseQueries = {
  async getUserDotPhrases(userId: number) {
    if (!db) throw new Error('Database not available');
    try {
      return await db.select().from(dotPhrases).where(eq(dotPhrases.userId, userId));
    } catch (error) {
      console.error('Error fetching dot phrases:', error);
      throw error;
    }
  },

  async createDotPhrase(dotPhraseData: typeof dotPhrases.$inferInsert) {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(dotPhrases).values(dotPhraseData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating dot phrase:', error);
      throw error;
    }
  },

  async updateDotPhrase(id: number, dotPhraseData: Partial<typeof dotPhrases.$inferInsert>) {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.update(dotPhrases).set(dotPhraseData).where(eq(dotPhrases.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating dot phrase:', error);
      throw error;
    }
  },

  async deleteDotPhrase(id: number, userId: number) {
    if (!db) throw new Error('Database not available');
    try {
      return await db.delete(dotPhrases).where(and(eq(dotPhrases.id, id), eq(dotPhrases.userId, userId)));
    } catch (error) {
      console.error('Error deleting dot phrase:', error);
      throw error;
    }
  }
};

export const rosNoteQueries = {
  async getUserNotes(userId: number) {
    if (!db) throw new Error('Database not available');
    try {
      return await db.select().from(rosNotes).where(eq(rosNotes.userId, userId)).orderBy(desc(rosNotes.createdAt));
    } catch (error) {
      console.error('Error fetching ROS notes:', error);
      throw error;
    }
  },

  async createNote(noteData: typeof rosNotes.$inferInsert) {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(rosNotes).values(noteData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating ROS note:', error);
      throw error;
    }
  },

  async getNoteById(id: number, userId: number) {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.select().from(rosNotes).where(and(eq(rosNotes.id, id), eq(rosNotes.userId, userId))).limit(1);
      return result[0];
    } catch (error) {
      console.error('Error fetching ROS note by ID:', error);
      throw error;
    }
  },

  async deleteNote(id: number, userId: number) {
    if (!db) throw new Error('Database not available');
    try {
      return await db.delete(rosNotes).where(and(eq(rosNotes.id, id), eq(rosNotes.userId, userId)));
    } catch (error) {
      console.error('Error deleting ROS note:', error);
      throw error;
    }
  }
};

export const userPresetQueries = {
  async getUserPresets(userId: number) {
    if (!db) throw new Error('Database not available');
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user ID');
    }
    try {
      return await db.select().from(userPresets).where(eq(userPresets.userId, userId)).orderBy(userPresets.createdAt);
    } catch (error) {
      console.error('Error fetching user presets:', error);
      throw error;
    }
  },

  async createPreset(presetData: typeof userPresets.$inferInsert) {
    if (!db) throw new Error('Database not available');
    try {
      const result = await db.insert(userPresets).values(presetData).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating user preset:', error);
      throw error;
    }
  },

  async updatePreset(id: number, presetData: Partial<typeof userPresets.$inferInsert>) {
    if (!db) throw new Error('Database not available');
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid preset ID');
    }
    try {
      const result = await db.update(userPresets).set(presetData).where(eq(userPresets.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error('Error updating user preset:', error);
      throw error;
    }
  },
};

// Health check function for Neon connection
export async function checkDatabaseHealth() {
  if (!db) {
    return { status: 'error', message: 'Database not initialized' };
  }
  
  try {
    await db.execute('SELECT 1');
    return { status: 'healthy', message: 'Database connection active' };
  } catch (error) {
    return { status: 'error', message: `Database connection failed: ${error}` };
  }
}