import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, rosNotes, dotPhrases } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

// Railway provides DATABASE_URL environment variable
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create postgres connection
const client = postgres(connectionString, {
  max: 1, // Use connection pooling in production
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});

// Create drizzle database instance
export const db = drizzle(client);

// Export tables for easy access
export { users, rosNotes, dotPhrases };

// Database operations
export const userQueries = {
  async getUserById(id: number) {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  },

  async getUserByUsername(username: string) {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  },

  async createUser(userData: { username: string; password: string }) {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  },

  async updateUser(id: number, userData: Partial<typeof users.$inferInsert>) {
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