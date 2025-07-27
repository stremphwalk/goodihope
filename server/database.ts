import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, rosNotes, dotPhrases, userPresets } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

// Support both Railway and Vercel Postgres environment variables
const connectionString = process.env.DATABASE_URL || 
                         process.env.POSTGRES_URL || 
                         process.env.POSTGRES_DATABASE_URL;

let db: any = null;
let client: any = null;

if (connectionString) {
  try {
    // Validate connection string format
    if (connectionString.startsWith('postgresql://') || connectionString.startsWith('postgres://')) {
      // Create postgres connection with Vercel-optimized settings
      client = postgres(connectionString, {
        max: process.env.NODE_ENV === 'production' ? 1 : 5, // Vercel functions have connection limits
        ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false, // Disable prepared statements for security
        transform: postgres.camel, // Transform snake_case to camelCase
      });

      // Create drizzle database instance
      db = drizzle(client);
      console.log('✅ Database connection initialized');
    } else {
      console.warn('⚠️  Invalid DATABASE_URL format, database features disabled');
    }
  } catch (error) {
    console.warn('⚠️  Database connection failed, database features disabled:', error);
  }
} else {
  console.warn('⚠️  DATABASE_URL not provided, database features disabled');
}

// Graceful shutdown function
export const closeDatabase = async () => {
  if (client) {
    console.log('🔒 Closing database connections...');
    await client.end();
    console.log('✅ Database connections closed');
  }
};

export { db };

// Export tables for easy access
export { users, rosNotes, dotPhrases, userPresets };

// Database operations
export const userQueries = {
  async getUserById(id: number) {
    if (!db) throw new Error('Database not available');
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  },

  async getUserByUsername(username: string) {
    if (!db) throw new Error('Database not available');
    if (!username || typeof username !== 'string' || username.length > 50) {
      throw new Error('Invalid username');
    }
    const result = await db.select().from(users).where(eq(users.email, username)).limit(1);
    return result[0];
  },

  async createUser(userData: { username: string; password: string }) {
    if (!db) throw new Error('Database not available');
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  },

  async updateUser(id: number, userData: Partial<typeof users.$inferInsert>) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }
    const result = await db.update(users).set(userData).where(eq(users.id, id)).returning();
    return result[0];
  }
};

export const dotPhraseQueries = {
  async getUserDotPhrases(userId: number) {
    return await db.select().from(dotPhrases).where(eq(dotPhrases.userId, userId));
  },

  async createDotPhrase(dotPhraseData: typeof dotPhrases.$inferInsert) {
    const result = await db.insert(dotPhrases).values(dotPhraseData).returning();
    return result[0];
  },

  async updateDotPhrase(id: number, dotPhraseData: Partial<typeof dotPhrases.$inferInsert>) {
    const result = await db.update(dotPhrases).set(dotPhraseData).where(eq(dotPhrases.id, id)).returning();
    return result[0];
  },

  async deleteDotPhrase(id: number, userId: number) {
    return await db.delete(dotPhrases).where(and(eq(dotPhrases.id, id), eq(dotPhrases.userId, userId)));
  }
};

export const rosNoteQueries = {
  async getUserNotes(userId: number) {
    return await db.select().from(rosNotes).where(eq(rosNotes.userId, userId)).orderBy(desc(rosNotes.createdAt));
  },

  async createNote(noteData: typeof rosNotes.$inferInsert) {
    const result = await db.insert(rosNotes).values(noteData).returning();
    return result[0];
  },

  async getNoteById(id: number, userId: number) {
    const result = await db.select().from(rosNotes).where(and(eq(rosNotes.id, id), eq(rosNotes.userId, userId))).limit(1);
    return result[0];
  },

  async deleteNote(id: number, userId: number) {
    return await db.delete(rosNotes).where(and(eq(rosNotes.id, id), eq(rosNotes.userId, userId)));
  }
};

// New queries for user presets
export const userPresetQueries = {
  async getUserPresets(userId: number) {
    if (!Number.isInteger(userId) || userId <= 0) {
      throw new Error('Invalid user ID');
    }
    return await db.select().from(userPresets).where(eq(userPresets.userId, userId)).orderBy(userPresets.createdAt);
  },

  async createPreset(presetData: typeof userPresets.$inferInsert) {
    const result = await db.insert(userPresets).values(presetData).returning();
    return result[0];
  },

  async updatePreset(id: number, presetData: Partial<typeof userPresets.$inferInsert>) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid preset ID');
    }
    const result = await db.update(userPresets).set(presetData).where(eq(userPresets.id, id)).returning();
    return result[0];
  },
};