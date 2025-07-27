import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';
import { users, rosNotes, dotPhrases, userPresets } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';

// Create drizzle database instance using Vercel Postgres
export const db = drizzle(sql, {
  schema: { users, rosNotes, dotPhrases, userPresets }
});

// Export tables for easy access
export { users, rosNotes, dotPhrases, userPresets };

// Database operations (same as original)
export const userQueries = {
  async getUserById(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid user ID');
    }
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  },

  async getUserByUsername(username: string) {
    if (!username || typeof username !== 'string' || username.length > 50) {
      throw new Error('Invalid username');
    }
    const result = await db.select().from(users).where(eq(users.email, username)).limit(1);
    return result[0];
  },

  async createUser(userData: { email: string; password: string; name?: string }) {
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