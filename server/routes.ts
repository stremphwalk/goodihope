import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchMedications, getCommonDosages } from "./parseCSVMedications";
import { extractLabValuesFromImage, extractMedicationsFromImage } from "./vision";
import { sanitizeString, validateBase64Image, SECURITY_CONFIG } from "./security";
import { userQueries, dotPhraseQueries, rosNoteQueries, userPresetQueries, teamGroupQueries, groupTodoQueries, groupEventQueries } from "./database-supabase";
import { dotPhrases, users, userPresets, teamGroups, groupMembers, groupTodos, groupEvents, templates, templateUsage, userLabSettings } from "../shared/schema";
import { eq, desc, and, ne, sql, gt, lt, gte, lte } from "drizzle-orm";
import { db } from "./database";
import { checkJwt } from './auth';
import { generateUniqueShareCode, isValidShareCode, normalizeShareCode } from './shareCodeUtils';
import { generateUniqueCustomIdentifier, isValidCustomIdentifier, formatCustomIdentifier } from './customIdentifierUtils';
import { generateUniqueInviteCode, isValidInviteCode, cleanupExpiredGroups, getUserActiveGroup, removeUserFromCurrentGroup, getGroupMemberCount } from './groupUtils';
import { dashboardCache, CacheKeys, CacheInvalidation } from './cache';

// Extend the Express Request type to include the auth payload
interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string; // The user's unique identifier from Cognito
    [key: string]: any;
  };
}

// Simple in-memory cache for user lookups (clears every 5 minutes)
const userCache = new Map<string, { user: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

const clearExpiredCache = () => {
  const now = Date.now();
  Array.from(userCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      userCache.delete(key);
    }
  });
};

// Clear expired cache entries every minute
setInterval(clearExpiredCache, 60 * 1000);

// Function to get user from Supabase auth - users are auto-created by trigger
const getOrCreateUser = async (authPayload: any) => {
  const supabaseUserId = authPayload.sub; // This is the Supabase user UUID
  
  // Check cache first
  const cached = userCache.get(supabaseUserId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  // Check if database is available
  if (!db) {
    throw new Error('Database connection not available');
  }

  // Look up user by UUID (not email) since Supabase uses UUIDs as primary keys
  let user = await db.select().from(users).where(eq(users.id, supabaseUserId)).limit(1);

  if (user.length === 0) {
    // User should have been created by the Supabase trigger, but if not found, wait and retry once
    console.log('User not found immediately, waiting for trigger...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    user = await db.select().from(users).where(eq(users.id, supabaseUserId)).limit(1);
    
    if (user.length === 0) {
      throw new Error(`User not found in database. Supabase trigger may have failed for user ${supabaseUserId}`);
    }
  }

  // Cache the user
  userCache.set(supabaseUserId, { user: user[0], timestamp: Date.now() });
  
  return user[0];
};

// Helper function to calculate medication confidence
function calculateMedicationConfidence(medication: any): number {
  let confidence = 0.5; // Base confidence
  
  // Higher confidence for medications with dosage information
  if (medication.dosage && medication.dosage.trim().length > 0) {
    confidence += 0.2;
  }
  
  // Higher confidence for medications with frequency information
  if (medication.frequency && medication.frequency.trim().length > 0) {
    confidence += 0.2;
  }
  
  // Higher confidence for well-known medication names
  const commonMeds = ['tylenol', 'advil', 'aspirin', 'metformin', 'lipitor', 'lisinopril'];
  if (commonMeds.some(med => medication.name.toLowerCase().includes(med))) {
    confidence += 0.1;
  }
  
  // Lower confidence for very short names or unusual patterns
  if (medication.name.length < 4) {
    confidence -= 0.2;
  }
  
  // Cap between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // Custom Dot Phrases API endpoints
    
    // GET /api/dot-phrases - Get all custom dot phrases for the current user
    app.get("/api/dot-phrases", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        const userDotPhrases = await db
          .select()
          .from(dotPhrases)
          .where(eq(dotPhrases.userId, user.id))
          .orderBy(dotPhrases.updatedAt);
        
        res.json(userDotPhrases);
      } catch (error) {
        console.error('Error fetching dot phrases:', error);
        res.status(500).json({ error: 'Failed to fetch dot phrases' });
      }
    });

    // POST /api/dot-phrases - Create a new custom dot phrase
    app.post("/api/dot-phrases", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { trigger, content, description, category } = req.body;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        if (!trigger || !content) {
          return res.status(400).json({ error: 'Trigger and content are required' });
        }
        
        if (!trigger.startsWith('/')) {
          return res.status(400).json({ error: 'Trigger must start with /' });
        }
        
        // Check for duplicate triggers for this user
        const existing = await db
          .select()
          .from(dotPhrases)
          .where(and(eq(dotPhrases.userId, user.id), eq(dotPhrases.trigger, trigger)));
        
        if (existing.length > 0) {
          return res.status(409).json({ error: 'A dot phrase with this trigger already exists' });
        }
        
        const newDotPhrase = await db
          .insert(dotPhrases)
          .values({
            userId: user.id,
            trigger,
            content,
            description: description || null,
            category: category || 'general'
          })
          .returning();
        
        res.status(201).json(newDotPhrase[0]);
      } catch (error) {
        console.error('Error creating dot phrase:', error);
        res.status(500).json({ error: 'Failed to create dot phrase' });
      }
    });

    // PUT /api/dot-phrases/:id - Update an existing custom dot phrase
    app.put("/api/dot-phrases/:id", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { trigger, content, description, category } = req.body;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        if (!trigger || !content) {
          return res.status(400).json({ error: 'Trigger and content are required' });
        }
        
        if (!trigger.startsWith('/')) {
          return res.status(400).json({ error: 'Trigger must start with /' });
        }
        
        // Check if the dot phrase exists and belongs to the user
        const existing = await db
          .select()
          .from(dotPhrases)
          .where(and(eq(dotPhrases.id, parseInt(id)), eq(dotPhrases.userId, user.id)));
        
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Dot phrase not found' });
        }
        
        // Check for duplicate triggers (excluding current phrase)
        const duplicate = await db
          .select()
          .from(dotPhrases)
          .where(and(
            eq(dotPhrases.userId, user.id), 
            eq(dotPhrases.trigger, trigger),
            ne(dotPhrases.id, parseInt(id))
          ));
        
        if (duplicate.length > 0) {
          return res.status(409).json({ error: 'A dot phrase with this trigger already exists' });
        }
        
        const updatedDotPhrase = await db
          .update(dotPhrases)
          .set({
            trigger,
            content,
            description: description || null,
            category: category || 'general',
            updatedAt: new Date()
          })
          .where(and(eq(dotPhrases.id, parseInt(id)), eq(dotPhrases.userId, user.id)))
          .returning();
        
        if (updatedDotPhrase.length === 0) {
          return res.status(404).json({ error: 'Dot phrase not found' });
        }
        
        res.json(updatedDotPhrase[0]);
      } catch (error) {
        console.error('Error updating dot phrase:', error);
        res.status(500).json({ error: 'Failed to update dot phrase' });
      }
    });

    // DELETE /api/dot-phrases/:id - Delete a custom dot phrase
    app.delete("/api/dot-phrases/:id", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        const deletedDotPhrase = await db
          .delete(dotPhrases)
          .where(and(eq(dotPhrases.id, parseInt(id)), eq(dotPhrases.userId, user.id)))
          .returning();
        
        if (deletedDotPhrase.length === 0) {
          return res.status(404).json({ error: 'Dot phrase not found' });
        }
        
        res.json({ message: 'Dot phrase deleted successfully' });
      } catch (error) {
        console.error('Error deleting dot phrase:', error);
        res.status(500).json({ error: 'Failed to delete dot phrase' });
      }
    });

    // Dot Phrase Sharing API endpoints
    
    // POST /api/dot-phrases/:id/share - Generate or retrieve share code for a dot phrase
    app.post("/api/dot-phrases/:id/share", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Check if the dot phrase exists and belongs to the user
        const existing = await db
          .select()
          .from(dotPhrases)
          .where(and(eq(dotPhrases.id, parseInt(id)), eq(dotPhrases.userId, user.id)));
        
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Dot phrase not found' });
        }
        
        const dotPhrase = existing[0];
        
        // If already has a share code, return it
        if (dotPhrase.shareCode) {
          res.json({ 
            shareCode: dotPhrase.shareCode,
            isPublic: dotPhrase.isPublic,
            sharedAt: dotPhrase.sharedAt,
            importCount: dotPhrase.importCount || 0
          });
          return;
        }
        
        // Generate new unique share code
        const checkCodeExists = async (code: string) => {
          const result = await db
            .select()
            .from(dotPhrases)
            .where(eq(dotPhrases.shareCode, code))
            .limit(1);
          return result.length > 0;
        };
        
        const shareCode = await generateUniqueShareCode(checkCodeExists);
        
        // Update the dot phrase with the share code
        const updatedDotPhrase = await db
          .update(dotPhrases)
          .set({
            shareCode,
            isPublic: true,
            sharedAt: new Date(),
            updatedAt: new Date()
          })
          .where(and(eq(dotPhrases.id, parseInt(id)), eq(dotPhrases.userId, user.id)))
          .returning();
        
        if (updatedDotPhrase.length === 0) {
          return res.status(404).json({ error: 'Dot phrase not found' });
        }
        
        res.json({ 
          shareCode,
          isPublic: true,
          sharedAt: updatedDotPhrase[0].sharedAt,
          importCount: 0
        });
      } catch (error) {
        console.error('Error sharing dot phrase:', error);
        res.status(500).json({ error: 'Failed to share dot phrase' });
      }
    });

    // GET /api/dot-phrases/shared/:shareCode - Get shared dot phrase by code
    app.get("/api/dot-phrases/shared/:shareCode", async (req, res) => {
      try {
        const { shareCode } = req.params;
        
        if (!shareCode || !isValidShareCode(shareCode)) {
          return res.status(400).json({ error: 'Invalid share code format' });
        }
        
        const normalizedCode = normalizeShareCode(shareCode);
        
        const sharedDotPhrase = await db
          .select({
            id: dotPhrases.id,
            trigger: dotPhrases.trigger,
            content: dotPhrases.content,
            description: dotPhrases.description,
            category: dotPhrases.category,
            shareCode: dotPhrases.shareCode,
            importCount: dotPhrases.importCount,
            sharedAt: dotPhrases.sharedAt,
            createdAt: dotPhrases.createdAt
          })
          .from(dotPhrases)
          .where(and(
            eq(dotPhrases.shareCode, normalizedCode),
            eq(dotPhrases.isPublic, true)
          ))
          .limit(1);
        
        if (sharedDotPhrase.length === 0) {
          return res.status(404).json({ error: 'Shared dot phrase not found' });
        }
        
        res.json(sharedDotPhrase[0]);
      } catch (error) {
        console.error('Error fetching shared dot phrase:', error);
        res.status(500).json({ error: 'Failed to fetch shared dot phrase' });
      }
    });

    // POST /api/dot-phrases/import/:shareCode - Import dot phrase from share code
    app.post("/api/dot-phrases/import/:shareCode", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { shareCode } = req.params;
        const { customTrigger } = req.body; // Optional custom trigger if user wants to rename
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        if (!shareCode || !isValidShareCode(shareCode)) {
          return res.status(400).json({ error: 'Invalid share code format' });
        }
        
        const user = await getOrCreateUser(req.auth);
        const normalizedCode = normalizeShareCode(shareCode);
        
        // Get the shared dot phrase
        const sharedDotPhrase = await db
          .select()
          .from(dotPhrases)
          .where(and(
            eq(dotPhrases.shareCode, normalizedCode),
            eq(dotPhrases.isPublic, true)
          ))
          .limit(1);
        
        if (sharedDotPhrase.length === 0) {
          return res.status(404).json({ error: 'Shared dot phrase not found' });
        }
        
        const originalPhrase = sharedDotPhrase[0];
        
        // Check if user is trying to import their own phrase
        if (originalPhrase.userId === user.id) {
          return res.status(400).json({ error: 'Cannot import your own dot phrase' });
        }
        
        // Determine the trigger to use
        let finalTrigger = customTrigger || originalPhrase.trigger;
        
        if (!finalTrigger.startsWith('/')) {
          finalTrigger = '/' + finalTrigger.replace(/^\/+/, '');
        }
        
        // Check for existing trigger conflict
        const existingTrigger = await db
          .select()
          .from(dotPhrases)
          .where(and(eq(dotPhrases.userId, user.id), eq(dotPhrases.trigger, finalTrigger)))
          .limit(1);
        
        if (existingTrigger.length > 0) {
          // Suggest alternative trigger
          let counter = 1;
          let suggestedTrigger = `${finalTrigger}${counter}`;
          
          while (true) {
            const checkSuggestion = await db
              .select()
              .from(dotPhrases)
              .where(and(eq(dotPhrases.userId, user.id), eq(dotPhrases.trigger, suggestedTrigger)))
              .limit(1);
            
            if (checkSuggestion.length === 0) break;
            counter++;
            suggestedTrigger = `${finalTrigger}${counter}`;
          }
          
          return res.status(409).json({ 
            error: 'Trigger already exists', 
            suggestedTrigger,
            originalTrigger: finalTrigger
          });
        }
        
        // Create the imported dot phrase
        const importedDotPhrase = await db
          .insert(dotPhrases)
          .values({
            userId: user.id,
            trigger: finalTrigger,
            content: originalPhrase.content,
            description: originalPhrase.description,
            category: originalPhrase.category
          })
          .returning();
        
        // Increment import count on original phrase
        await db
          .update(dotPhrases)
          .set({
            importCount: (originalPhrase.importCount || 0) + 1,
            updatedAt: new Date()
          })
          .where(eq(dotPhrases.id, originalPhrase.id));
        
        res.status(201).json({
          dotPhrase: importedDotPhrase[0],
          importedFrom: {
            shareCode: originalPhrase.shareCode,
            originalTrigger: originalPhrase.trigger
          }
        });
      } catch (error) {
        console.error('Error importing dot phrase:', error);
        res.status(500).json({ error: 'Failed to import dot phrase' });
      }
    });

    // GET /api/dot-phrases/shared/popular - Get most imported shared phrases (optional)
    app.get("/api/dot-phrases/shared/popular", async (req, res) => {
      try {
        const limitParam = req.query.limit as string;
        const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 50);
        
        const popularPhrases = await db
          .select({
            id: dotPhrases.id,
            trigger: dotPhrases.trigger,
            content: dotPhrases.content,
            description: dotPhrases.description,
            category: dotPhrases.category,
            shareCode: dotPhrases.shareCode,
            importCount: dotPhrases.importCount,
            sharedAt: dotPhrases.sharedAt
          })
          .from(dotPhrases)
          .where(and(
            eq(dotPhrases.isPublic, true),
            ne(dotPhrases.shareCode, '')
          ))
          .orderBy(dotPhrases.importCount)
          .limit(limit);
        
        res.json(popularPhrases);
      } catch (error) {
        console.error('Error fetching popular shared phrases:', error);
        res.status(500).json({ error: 'Failed to fetch popular shared phrases' });
      }
    });

    // Custom Identifier API endpoints
    
    // GET /api/user/identifier - Get current user's custom identifier
    app.get("/api/user/identifier", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        if (!user.customIdentifier) {
          // Generate custom identifier for existing users who don't have one
          try {
            const customIdentifier = await generateUniqueCustomIdentifier();
            const updatedUser = await db
              .update(users)
              .set({ customIdentifier })
              .where(eq(users.id, user.id))
              .returning();
            
            return res.json({
              customIdentifier,
              formattedIdentifier: formatCustomIdentifier(customIdentifier),
              isNew: true
            });
          } catch (error) {
            console.error('Error generating custom identifier for existing user:', error);
            return res.status(500).json({ error: 'Failed to generate custom identifier' });
          }
        }
        
        res.json({
          customIdentifier: user.customIdentifier,
          formattedIdentifier: formatCustomIdentifier(user.customIdentifier),
          isNew: false
        });
      } catch (error) {
        console.error('Error fetching user identifier:', error);
        res.status(500).json({ error: 'Failed to fetch user identifier' });
      }
    });


    // GET /api/users/by-identifier/:identifier - Get user by custom identifier (for team features)
    app.get("/api/users/by-identifier/:identifier", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { identifier } = req.params;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        if (!isValidCustomIdentifier(identifier)) {
          return res.status(400).json({ error: 'Invalid custom identifier format' });
        }
        
        const targetUser = await db
          .select({
            id: users.id,
            email: users.email,
            customIdentifier: users.customIdentifier,
            createdAt: users.createdAt
          })
          .from(users)
          .where(eq(users.customIdentifier, identifier))
          .limit(1);
        
        if (targetUser.length === 0) {
          return res.status(404).json({ error: 'User not found with this custom identifier' });
        }
        
        // Don't return sensitive information, just basic user info
        res.json({
          customIdentifier: targetUser[0].customIdentifier,
          formattedIdentifier: formatCustomIdentifier(targetUser[0].customIdentifier!),
          createdAt: targetUser[0].createdAt
        });
      } catch (error) {
        console.error('Error fetching user by identifier:', error);
        res.status(500).json({ error: 'Failed to fetch user by identifier' });
      }
    });

    // User Presets API endpoints

    // GET /api/user-presets - Get all presets for the current user
    app.get("/api/user-presets", checkJwt, async (req: AuthenticatedRequest, res) => {
      const startTime = Date.now();
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const userStartTime = Date.now();
        const user = await getOrCreateUser(req.auth);
        const userTime = Date.now() - userStartTime;
        console.log(`[PERF] User lookup took ${userTime}ms`);
        
        // Check if database is available
        if (!db) {
          return res.status(503).json({ error: 'Database temporarily unavailable' });
        }

        // Use the optimized query function from database.ts
        const presetsStartTime = Date.now();
        const userPresetsData = await db
          .select()
          .from(userPresets)
          .where(eq(userPresets.userId, user.id))
          .orderBy(userPresets.updatedAt);
        const presetsTime = Date.now() - presetsStartTime;
        console.log(`[PERF] Presets query took ${presetsTime}ms`);
        
        const totalTime = Date.now() - startTime;
        console.log(`[PERF] Total /api/user-presets took ${totalTime}ms`);
        
        res.json(userPresetsData);
      } catch (error: any) {
        console.error('Error fetching user presets:', error);
        // Specific check for table not exist
        if (error.code === '42P01') {
          return res.status(500).json({ error: 'Database table "user_presets" does not exist. Please run migrations.' });
        }
        res.status(500).json({ error: 'Failed to fetch user presets' });
      }
    });

    // POST /api/user-presets - Create a new preset
    app.post("/api/user-presets", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { title, isFavorite, symptoms } = req.body;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        if (!title || typeof symptoms !== 'object') {
          return res.status(400).json({ error: 'Title and symptoms are required' });
        }
        
        // Check for duplicate title for this user
        const existing = await db
          .select()
          .from(userPresets)
          .where(and(eq(userPresets.userId, user.id), eq(userPresets.title, title)));
        
        if (existing.length > 0) {
          return res.status(409).json({ error: 'A preset with this title already exists' });
        }
        
        // Count current presets to enforce max 20
        const countResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(userPresets)
          .where(eq(userPresets.userId, user.id));
        const count = countResult[0]?.count || 0;
        if (count >= 20) {
          return res.status(400).json({ error: 'Maximum 20 presets allowed' });
        }
        
        const newPreset = await db
          .insert(userPresets)
          .values({
            userId: user.id,
            title,
            isFavorite: isFavorite || false,
            symptoms
          })
          .returning();
        
        res.status(201).json(newPreset[0]);
      } catch (error: any) {
        console.error('Error creating preset:', error);
        if (error.code === '42P01') {
          return res.status(500).json({ error: 'Database table "user_presets" does not exist. Please run migrations.' });
        }
        res.status(500).json({ error: 'Failed to create preset' });
      }
    });

    // PUT /api/user-presets/:id - Update preset (for favorite toggle)
    app.put("/api/user-presets/:id", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { isFavorite } = req.body;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Check if preset exists and belongs to user
        const existing = await db
          .select()
          .from(userPresets)
          .where(and(eq(userPresets.id, parseInt(id)), eq(userPresets.userId, user.id)));
        
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Preset not found' });
        }
        
        const updatedPreset = await db
          .update(userPresets)
          .set({
            isFavorite,
            updatedAt: new Date()
          })
          .where(and(eq(userPresets.id, parseInt(id)), eq(userPresets.userId, user.id)))
          .returning();
        
        res.json(updatedPreset[0]);
      } catch (error: any) {
        console.error('Error updating preset:', error);
        if (error.code === '42P01') {
          return res.status(500).json({ error: 'Database table "user_presets" does not exist. Please run migrations.' });
        }
        res.status(500).json({ error: 'Failed to update preset' });
      }
    });

    // Templates API endpoints

    // GET /api/templates - Get all templates for the current user
    app.get("/api/templates", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        const userTemplates = await db
          .select()
          .from(templates)
          .where(eq(templates.userId, user.id))
          .orderBy(templates.updatedAt);
        
        res.json(userTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
      }
    });

         // POST /api/templates - Create a new template
     app.post("/api/templates", checkJwt, async (req: AuthenticatedRequest, res) => {
       try {
         const { name, content, description, category = 'general' } = req.body;
         
         if (!req.auth?.sub) {
           return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
         }
         
         const user = await getOrCreateUser(req.auth);
         
         if (!name || !content) {
           return res.status(400).json({ error: 'Name and content are required' });
         }
         
         // Check for duplicate name for this user
         const existing = await db
           .select()
           .from(templates)
           .where(and(eq(templates.userId, user.id), eq(templates.name, name)));
         
         if (existing.length > 0) {
           return res.status(409).json({ error: 'A template with this name already exists' });
         }
         
         const newTemplate = await db
           .insert(templates)
           .values({
             userId: user.id,
             name,
             content,
             description: description || null,
             category
           })
           .returning();
         
         res.status(201).json(newTemplate[0]);
       } catch (error) {
         console.error('Error creating template:', error);
         res.status(500).json({ error: 'Failed to create template' });
       }
     });

         // PUT /api/templates/:id - Update an existing template
     app.put("/api/templates/:id", checkJwt, async (req: AuthenticatedRequest, res) => {
       try {
         const { id } = req.params;
         const { name, content, description, category } = req.body;
         
         if (!req.auth?.sub) {
           return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
         }
         
         const user = await getOrCreateUser(req.auth);
         
         if (!name || !content) {
           return res.status(400).json({ error: 'Name and content are required' });
         }
         
         // Check if the template exists and belongs to the user
         const existing = await db
           .select()
           .from(templates)
           .where(and(eq(templates.id, parseInt(id)), eq(templates.userId, user.id)));
         
         if (existing.length === 0) {
           return res.status(404).json({ error: 'Template not found' });
         }
         
         // Check for duplicate name (excluding current template)
         const duplicate = await db
           .select()
           .from(templates)
           .where(and(
             eq(templates.userId, user.id), 
             eq(templates.name, name),
             ne(templates.id, parseInt(id))
           ));
         
         if (duplicate.length > 0) {
           return res.status(409).json({ error: 'A template with this name already exists' });
         }
         
         const updatedTemplate = await db
           .update(templates)
           .set({
             name,
             content,
             description: description || null,
             category: category || existing[0].category,
             updatedAt: new Date()
           })
           .where(and(eq(templates.id, parseInt(id)), eq(templates.userId, user.id)))
           .returning();
         
         if (updatedTemplate.length === 0) {
           return res.status(404).json({ error: 'Template not found' });
         }
         
         res.json(updatedTemplate[0]);
       } catch (error) {
         console.error('Error updating template:', error);
         res.status(500).json({ error: 'Failed to update template' });
       }
     });

    // DELETE /api/templates/:id - Delete a template
    app.delete("/api/templates/:id", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        const deletedTemplate = await db
          .delete(templates)
          .where(and(eq(templates.id, parseInt(id)), eq(templates.userId, user.id)))
          .returning();
        
        if (deletedTemplate.length === 0) {
          return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json({ message: 'Template deleted successfully' });
      } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
      }
    });

    // Fallback medication data for when search fails
    const fallbackMedications = [
      { id: 'acetaminophen', brandName: 'Tylenol', genericName: 'Acetaminophen', strength: '', dosageForm: 'tablet' },
      { id: 'ibuprofen', brandName: 'Advil', genericName: 'Ibuprofen', strength: '', dosageForm: 'tablet' },
      { id: 'aspirin', brandName: 'Aspirin', genericName: 'Acetylsalicylic acid', strength: '', dosageForm: 'tablet' },
      { id: 'metformin', brandName: 'Glucophage', genericName: 'Metformin', strength: '', dosageForm: 'tablet' },
      { id: 'lisinopril', brandName: 'Prinivil', genericName: 'Lisinopril', strength: '', dosageForm: 'tablet' },
      { id: 'atorvastatin', brandName: 'Lipitor', genericName: 'Atorvastatin', strength: '', dosageForm: 'tablet' },
      { id: 'amlodipine', brandName: 'Norvasc', genericName: 'Amlodipine', strength: '', dosageForm: 'tablet' },
      { id: 'omeprazole', brandName: 'Prilosec', genericName: 'Omeprazole', strength: '', dosageForm: 'capsule' },
      { id: 'levothyroxine', brandName: 'Synthroid', genericName: 'Levothyroxine', strength: '', dosageForm: 'tablet' },
      { id: 'hydrochlorothiazide', brandName: 'Microzide', genericName: 'Hydrochlorothiazide', strength: '', dosageForm: 'tablet' }
    ];

    // Medication search endpoint using authentic oral medication data
    app.get("/api/medications/search", async (req, res) => {
      try {
        const query = sanitizeString(req.query.q as string, 50);
        const limitParam = req.query.limit as string;
        const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 50); // Limit between 1-50

        if (!query || query.length < SECURITY_CONFIG.VALIDATION.MIN_QUERY_LENGTH) {
          console.log(`Medication search: Empty or too short query: "${query}"`);
          return res.json([]);
        }

        console.log(`Medication search request: query="${query}", limit=${limit}`);

        // Search medications using authentic oral medication data
        const results = searchMedications(query, limit);
        
        // Transform to expected format
        const medications = results.map(med => ({
          id: med.id,
          brandName: med.brandName,
          genericName: med.genericName,
          strength: med.strength,
          dosageForm: med.dosageForm
        }));

        console.log(`Medication search: Found ${medications.length} results for "${query}"`);

        // If no results from main search, try fallback search
        if (medications.length === 0) {
          console.log(`No main results for "${query}", attempting fallback search`);
          const fallbackResults = fallbackMedications.filter(med => 
            med.brandName.toLowerCase().includes(query.toLowerCase()) ||
            med.genericName.toLowerCase().includes(query.toLowerCase())
          ).slice(0, limit);
          
          if (fallbackResults.length > 0) {
            console.log(`Fallback search: Found ${fallbackResults.length} results for "${query}"`);
            return res.json(fallbackResults);
          }
        }

        res.json(medications);
      } catch (error) {
        console.error('Medication search error:', error);
        console.error('Error details:', {
          query: req.query.q,
          limit: req.query.limit,
          stack: error instanceof Error ? error.stack : 'Unknown error'
        });
        
        // Return fallback results even on error
        try {
          const query = sanitizeString(req.query.q as string, 50);
          if (query && query.length >= SECURITY_CONFIG.VALIDATION.MIN_QUERY_LENGTH) {
            const fallbackResults = fallbackMedications.filter(med => 
              med.brandName.toLowerCase().includes(query.toLowerCase()) ||
              med.genericName.toLowerCase().includes(query.toLowerCase())
            );
            
            if (fallbackResults.length > 0) {
              console.log(`Error fallback: Returning ${fallbackResults.length} fallback results`);
              return res.json(fallbackResults);
            }
          }
        } catch (fallbackError) {
          console.error('Fallback search also failed:', fallbackError);
        }
        
        res.status(500).json({ error: 'Failed to search medications' });
      }
    });

    // Get dosage recommendations for a medication using New Brunswick Formulary data
    app.get("/api/medications/dosages/:medicationName", async (req, res) => {
      try {
        const medicationName = sanitizeString(req.params.medicationName, SECURITY_CONFIG.VALIDATION.MAX_MEDICATION_NAME_LENGTH);
        
        if (!medicationName) {
          return res.status(400).json({ error: 'Invalid medication name' });
        }

        // Get common dosages for this medication from CSV data
        const dosages = getCommonDosages(medicationName).slice(0, 3);
        
        res.json(dosages);
      } catch (error) {
        console.error('Dosage search error:', error);
        res.status(500).json({ error: 'Failed to get dosages' });
      }
    });

    // Lab image OCR endpoint
    app.post("/api/extract-lab-values", async (req, res) => {
      try {
        const { image } = req.body;
        
        const imageData = validateBase64Image(image);
        if (!imageData) {
          return res.status(400).json({ error: "Invalid image data" });
        }

        const { data: base64Data, type: imageType } = imageData;
        
        console.log('Processing image for lab values extraction');
        
        const labValues = await extractLabValuesFromImage(base64Data, imageType);
        
        console.log(`Extracted ${labValues.length} lab values`);
        
        res.json({ labValues });
      } catch (error: any) {
        console.error("Error processing lab image:", error);
        res.status(500).json({ error: "Failed to process lab image" });
      }
    });

    // Team Groups API endpoints
    
    // POST /api/groups - Create a new team group
    app.post("/api/groups", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const { name, description } = req.body;
        
        if (!name || typeof name !== 'string' || name.trim().length === 0) {
          return res.status(400).json({ error: 'Group name is required' });
        }
        
        if (name.trim().length > 50) {
          return res.status(400).json({ error: 'Group name must be 50 characters or less' });
        }
        
        if (description && description.length > 200) {
          return res.status(400).json({ error: 'Description must be 200 characters or less' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Check if user is already in a group
        const existingGroup = await getUserActiveGroup(user.id);
        if (existingGroup) {
          return res.status(409).json({ error: 'You are already in a team group. Leave your current group first.' });
        }
        
        // Generate unique invite code
        const inviteCode = await generateUniqueInviteCode();
        
        // Set expiry to 7 days from now
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        
        // Create group
        const newGroup = await db
          .insert(teamGroups)
          .values({
            name: name.trim(),
            description: description?.trim() || undefined,
            createdByUserId: user.id,
            inviteCode,
            expiresAt
          })
          .returning();
        
        // Add creator as member
        await db
          .insert(groupMembers)
          .values({
            groupId: newGroup[0].id,
            userId: user.id,
            role: 'creator'
          });
        
        res.status(201).json({
          ...newGroup[0],
          role: 'creator',
          memberCount: 1
        });
      } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: 'Failed to create group' });
      }
    });

    // GET /api/groups/my-active-group - Get user's current active group
    app.get("/api/groups/my-active-group", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        // Clean up expired groups first
        await cleanupExpiredGroups();
        
        const user = await getOrCreateUser(req.auth);
        const activeGroup = await getUserActiveGroup(user.id);
        
        if (!activeGroup) {
          return res.status(404).json({ error: 'No active group found' });
        }
        
        res.json(activeGroup);
      } catch (error) {
        console.error('Error fetching active group:', error);
        res.status(500).json({ error: 'Failed to fetch active group' });
      }
    });

    // POST /api/groups/join - Join a group by invite code
    app.post("/api/groups/join", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const { inviteCode } = req.body;
        
        if (!inviteCode || !isValidInviteCode(inviteCode)) {
          return res.status(400).json({ error: 'Valid 6-character invite code is required' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Find the group by invite code
        const targetGroup = await db
          .select()
          .from(teamGroups)
          .where(and(
            eq(teamGroups.inviteCode, inviteCode.toUpperCase()),
            gt(teamGroups.expiresAt, new Date()) // Only non-expired groups
          ))
          .limit(1);
        
        if (targetGroup.length === 0) {
          return res.status(404).json({ error: 'Invalid invite code or group has expired' });
        }
        
        const group = targetGroup[0];
        
        // Check if group is full (max 6 members)
        const memberCount = await getGroupMemberCount(group.id);
        if (memberCount >= 6) {
          return res.status(409).json({ error: 'Group is full (maximum 6 members)' });
        }
        
        // Check if user is already in this group
        const existingMembership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, group.id),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (existingMembership.length > 0) {
          return res.status(409).json({ error: 'You are already a member of this group' });
        }
        
        // Remove user from any existing group first
        await removeUserFromCurrentGroup(user.id);
        
        // Add user to the new group
        await db
          .insert(groupMembers)
          .values({
            groupId: group.id,
            userId: user.id,
            role: 'member'
          });
        
        // Invalidate dashboard cache for this group
        CacheInvalidation.invalidateMembers(group.id);
        
        res.json({
          group: {
            ...group,
            role: 'member',
            memberCount: memberCount + 1
          },
          message: 'Successfully joined group'
        });
      } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ error: 'Failed to join group' });
      }
    });

    // DELETE /api/groups/leave - Leave current group
    app.delete("/api/groups/leave", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Remove user from their current group
        const result = await db
          .delete(groupMembers)
          .where(eq(groupMembers.userId, user.id))
          .returning();
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'You are not currently in a group' });
        }
        
        // Invalidate dashboard cache for the group they left
        CacheInvalidation.invalidateMembers(result[0].groupId);
        
        res.json({ message: 'Successfully left group' });
      } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: 'Failed to leave group' });
      }
    });

    // GET /api/groups/:id/dashboard - Get complete dashboard data for a group
    app.get("/api/groups/:id/dashboard", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        if (isNaN(groupId)) {
          return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // Check cache first
        const cacheKey = CacheKeys.groupDashboard(groupId);
        const cachedData = dashboardCache.get(cacheKey);
        if (cachedData) {
          return res.json(cachedData);
        }
        
        // Get group details
        const group = await db
          .select()
          .from(teamGroups)
          .where(eq(teamGroups.id, groupId))
          .limit(1);
        
        if (group.length === 0 || new Date() > group[0].expiresAt) {
          return res.status(404).json({ error: 'Group not found or has expired' });
        }
        
        // Get all members with user details
        const members = await db
          .select({
            id: groupMembers.id,
            userId: groupMembers.userId,
            role: groupMembers.role,
            joinedAt: groupMembers.joinedAt,
            user: {
              id: users.id,
              name: users.name,
              customIdentifier: users.customIdentifier
            }
          })
          .from(groupMembers)
          .innerJoin(users, eq(groupMembers.userId, users.id))
          .where(eq(groupMembers.groupId, groupId));
        
        // Get todos with all user details in a single optimized query using LEFT JOINs
        const todosWithUsers = await db
          .select({
            // Todo fields
            todoId: groupTodos.id,
            title: groupTodos.title,
            description: groupTodos.description,
            status: groupTodos.status,
            position: groupTodos.position,
            completed: groupTodos.completed,
            createdByUserId: groupTodos.createdByUserId,
            completedByUserId: groupTodos.completedByUserId,
            assignedToUserId: groupTodos.assignedToUserId,
            createdAt: groupTodos.createdAt,
            completedAt: groupTodos.completedAt,
            
            // Creator user details (always present)
            creatorId: sql`creator.id`.as('creatorId'),
            creatorName: sql`creator.name`.as('creatorName'),
            creatorCustomIdentifier: sql`creator.custom_identifier`.as('creatorCustomIdentifier'),
            
            // Completer user details (nullable)
            completerId: sql`completer.id`.as('completerId'),
            completerName: sql`completer.name`.as('completerName'),
            completerCustomIdentifier: sql`completer.custom_identifier`.as('completerCustomIdentifier'),
            
            // Assignee user details (nullable)
            assigneeId: sql`assignee.id`.as('assigneeId'),
            assigneeName: sql`assignee.name`.as('assigneeName'),
            assigneeCustomIdentifier: sql`assignee.custom_identifier`.as('assigneeCustomIdentifier'),
          })
          .from(groupTodos)
          .innerJoin(sql`users AS creator`, sql`creator.id = ${groupTodos.createdByUserId}`)
          .leftJoin(sql`users AS completer`, sql`completer.id = ${groupTodos.completedByUserId}`)
          .leftJoin(sql`users AS assignee`, sql`assignee.id = ${groupTodos.assignedToUserId}`)
          .where(eq(groupTodos.groupId, groupId))
          .orderBy(groupTodos.status, groupTodos.position);

        // Transform the flat result into the expected nested structure
        const todos = todosWithUsers.map((row: any) => ({
          id: row.todoId,
          title: row.title,
          description: row.description,
          status: row.status,
          position: row.position,
          completed: row.completed,
          createdByUserId: row.createdByUserId,
          completedByUserId: row.completedByUserId,
          assignedToUserId: row.assignedToUserId,
          createdAt: row.createdAt,
          completedAt: row.completedAt,
          createdBy: {
            id: row.creatorId,
            name: row.creatorName,
            customIdentifier: row.creatorCustomIdentifier
          },
          completedBy: row.completerId ? {
            id: row.completerId,
            name: row.completerName,
            customIdentifier: row.completerCustomIdentifier
          } : null,
          assignedTo: row.assigneeId ? {
            id: row.assigneeId,
            name: row.assigneeName,
            customIdentifier: row.assigneeCustomIdentifier
          } : null
        }));
        
        // Get events with creator details
        const events = await db
          .select({
            id: groupEvents.id,
            title: groupEvents.title,
            description: groupEvents.description,
            eventDate: groupEvents.eventDate,
            createdByUserId: groupEvents.createdByUserId,
            createdAt: groupEvents.createdAt,
            createdBy: {
              id: users.id,
              name: users.name,
              customIdentifier: users.customIdentifier
            }
          })
          .from(groupEvents)
          .innerJoin(users, eq(groupEvents.createdByUserId, users.id))
          .where(eq(groupEvents.groupId, groupId))
          .orderBy(groupEvents.eventDate);
        
        const dashboardData = {
          group: group[0],
          members,
          todos,
          events
        };
        
        // Cache the result for 30 seconds
        dashboardCache.set(cacheKey, dashboardData, 30000);
        
        res.json(dashboardData);
      } catch (error) {
        console.error('Error fetching group dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch group dashboard' });
      }
    });

    // POST /api/groups/:id/todos - Add a todo to a group
    app.post("/api/groups/:id/todos", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        const { title, description } = req.body;
        
        if (isNaN(groupId)) {
          return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
          return res.status(400).json({ error: 'Todo title is required' });
        }
        
        if (title.trim().length > 100) {
          return res.status(400).json({ error: 'Title must be 100 characters or less' });
        }
        
        if (description && description.length > 300) {
          return res.status(400).json({ error: 'Description must be 300 characters or less' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // Get the current max position in the 'todo' status for this group
        const maxPositionResult = await db
          .select({
            maxPosition: sql`COALESCE(MAX(position), -1)`
          })
          .from(groupTodos)
          .where(and(
            eq(groupTodos.groupId, groupId),
            eq(groupTodos.status, 'todo')
          ));
        
        const newPosition = (maxPositionResult[0]?.maxPosition as number || -1) + 1;
        
        // Create todo
        const newTodo = await db
          .insert(groupTodos)
          .values({
            groupId,
            title: title.trim(),
            description: description?.trim() || undefined,
            createdByUserId: user.id,
            position: newPosition
          })
          .returning();
        
        // Invalidate dashboard cache for this group
        CacheInvalidation.invalidateTodos(groupId);
        
        res.status(201).json(newTodo[0]);
      } catch (error) {
        console.error('Error creating todo:', error);
        res.status(500).json({ error: 'Failed to create todo' });
      }
    });

    // PUT /api/groups/:id/todos/:todoId/status - Update todo status
    app.put("/api/groups/:id/todos/:todoId/status", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        const todoId = parseInt(req.params.todoId);
        const { status } = req.body;
        
        if (isNaN(groupId) || isNaN(todoId)) {
          return res.status(400).json({ error: 'Invalid group ID or todo ID' });
        }
        
        if (!status || !['todo', 'in_progress', 'review', 'done'].includes(status)) {
          return res.status(400).json({ error: 'Valid status is required: todo, in_progress, review, or done' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // Get current todo
        const todo = await db
          .select()
          .from(groupTodos)
          .where(and(
            eq(groupTodos.id, todoId),
            eq(groupTodos.groupId, groupId)
          ))
          .limit(1);
        
        if (todo.length === 0) {
          return res.status(404).json({ error: 'Todo not found' });
        }
        
        // Update status and related fields
        const updateData: any = {
          status,
          completed: status === 'done' // Keep backward compatibility, done = completed
        };
        
        if (status === 'done') {
          updateData.completedByUserId = user.id;
          updateData.completedAt = new Date();
        } else {
          updateData.completedByUserId = null;
          updateData.completedAt = null;
        }
        
        const updatedTodo = await db
          .update(groupTodos)
          .set(updateData)
          .where(eq(groupTodos.id, todoId))
          .returning();
        
        // Invalidate dashboard cache for this group
        CacheInvalidation.invalidateTodos(groupId);
        
        res.json(updatedTodo[0]);
      } catch (error) {
        console.error('Error updating todo status:', error);
        res.status(500).json({ error: 'Failed to update todo status' });
      }
    });

    // PUT /api/groups/:id/todos/:todoId/assign - Assign todo to user
    app.put("/api/groups/:id/todos/:todoId/assign", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        const todoId = parseInt(req.params.todoId);
        const { assignedToUserId } = req.body;
        
        if (isNaN(groupId) || isNaN(todoId)) {
          return res.status(400).json({ error: 'Invalid group ID or todo ID' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // If assignedToUserId is provided, verify they are also a member of this group
        if (assignedToUserId) {
          const assigneeMembership = await db
            .select()
            .from(groupMembers)
            .where(and(
              eq(groupMembers.groupId, groupId),
              eq(groupMembers.userId, assignedToUserId)
            ))
            .limit(1);
          
          if (assigneeMembership.length === 0) {
            return res.status(400).json({ error: 'Assigned user is not a member of this group' });
          }
        }
        
        // Verify todo exists in this group
        const todo = await db
          .select()
          .from(groupTodos)
          .where(and(
            eq(groupTodos.id, todoId),
            eq(groupTodos.groupId, groupId)
          ))
          .limit(1);
        
        if (todo.length === 0) {
          return res.status(404).json({ error: 'Todo not found' });
        }
        
        // Update assignment (null to unassign)
        const updatedTodo = await db
          .update(groupTodos)
          .set({ assignedToUserId: assignedToUserId || null })
          .where(eq(groupTodos.id, todoId))
          .returning();
        
        // Invalidate dashboard cache for this group
        CacheInvalidation.invalidateTodos(groupId);
        
        res.json(updatedTodo[0]);
      } catch (error) {
        console.error('Error assigning todo:', error);
        res.status(500).json({ error: 'Failed to assign todo' });
      }
    });

    // DELETE /api/groups/:id/todos/:todoId - Delete a todo
    app.delete("/api/groups/:id/todos/:todoId", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        const todoId = parseInt(req.params.todoId);
        
        if (isNaN(groupId) || isNaN(todoId)) {
          return res.status(400).json({ error: 'Invalid group ID or todo ID' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // Delete the todo
        const deletedTodo = await db
          .delete(groupTodos)
          .where(and(
            eq(groupTodos.id, todoId),
            eq(groupTodos.groupId, groupId)
          ))
          .returning();
        
        if (deletedTodo.length === 0) {
          return res.status(404).json({ error: 'Todo not found' });
        }
        
        // Invalidate dashboard cache for this group
        CacheInvalidation.invalidateTodos(groupId);
        
        res.json({ message: 'Todo deleted successfully' });
      } catch (error) {
        console.error('Error deleting todo:', error);
        res.status(500).json({ error: 'Failed to delete todo' });
      }
    });

    // PUT /api/groups/:id/todos/reorder - Reorder todos within the same status or move between statuses
    app.put("/api/groups/:id/todos/reorder", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        const { taskId, newStatus, newPosition } = req.body;
        
        if (isNaN(groupId)) {
          return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        if (!taskId || typeof newPosition !== 'number') {
          return res.status(400).json({ error: 'Task ID and new position are required' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // Get the current task
        const currentTask = await db
          .select()
          .from(groupTodos)
          .where(and(
            eq(groupTodos.id, taskId),
            eq(groupTodos.groupId, groupId)
          ))
          .limit(1);
        
        if (currentTask.length === 0) {
          return res.status(404).json({ error: 'Task not found' });
        }
        
        const task = currentTask[0];
        const oldStatus = task.status;
        const targetStatus = newStatus || oldStatus;
        
        // If moving to a different status, also update status fields
        const statusUpdates: any = {};
        if (newStatus && newStatus !== oldStatus) {
          statusUpdates.status = newStatus;
          if (newStatus === 'done') {
            statusUpdates.completed = true;
            statusUpdates.completedByUserId = user.id;
            statusUpdates.completedAt = new Date();
          } else {
            statusUpdates.completed = false;
            statusUpdates.completedByUserId = null;
            statusUpdates.completedAt = null;
          }
        }
        
        // Start a transaction to ensure consistency
        await db.transaction(async (tx: any) => {
          // First, adjust positions of other tasks in the target status
          if (targetStatus === oldStatus) {
            // Moving within the same status - shift other tasks
            if (newPosition > task.position) {
              // Moving down - shift tasks up
              await tx
                .update(groupTodos)
                .set({ position: sql`position - 1` })
                .where(and(
                  eq(groupTodos.groupId, groupId),
                  eq(groupTodos.status, targetStatus),
                  gt(groupTodos.position, task.position),
                  lte(groupTodos.position, newPosition)
                ));
            } else {
              // Moving up - shift tasks down
              await tx
                .update(groupTodos)
                .set({ position: sql`position + 1` })
                .where(and(
                  eq(groupTodos.groupId, groupId),
                  eq(groupTodos.status, targetStatus),
                  gte(groupTodos.position, newPosition),
                  lt(groupTodos.position, task.position)
                ));
            }
          } else {
            // Moving to different status
            // Shift tasks up in the old status
            await tx
              .update(groupTodos)
              .set({ position: sql`position - 1` })
              .where(and(
                eq(groupTodos.groupId, groupId),
                eq(groupTodos.status, oldStatus),
                gt(groupTodos.position, task.position)
              ));
            
            // Shift tasks down in the new status
            await tx
              .update(groupTodos)
              .set({ position: sql`position + 1` })
              .where(and(
                eq(groupTodos.groupId, groupId),
                eq(groupTodos.status, targetStatus),
                gte(groupTodos.position, newPosition)
              ));
          }
          
          // Update the task with new position and status
          await tx
            .update(groupTodos)
            .set({
              position: newPosition,
              ...statusUpdates
            })
            .where(eq(groupTodos.id, taskId));
        });
        
        // Invalidate dashboard cache for this group
        CacheInvalidation.invalidateTodos(groupId);
        
        res.json({ message: 'Task reordered successfully' });
      } catch (error) {
        console.error('Error reordering task:', error);
        res.status(500).json({ error: 'Failed to reorder task' });
      }
    });

    // POST /api/groups/:id/events - Add an event to a group
    app.post("/api/groups/:id/events", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const groupId = parseInt(req.params.id);
        const { title, description, eventDate } = req.body;
        
        if (isNaN(groupId)) {
          return res.status(400).json({ error: 'Invalid group ID' });
        }
        
        if (!title || typeof title !== 'string' || title.trim().length === 0) {
          return res.status(400).json({ error: 'Event title is required' });
        }
        
        if (title.trim().length > 100) {
          return res.status(400).json({ error: 'Title must be 100 characters or less' });
        }
        
        if (!eventDate) {
          return res.status(400).json({ error: 'Event date is required' });
        }
        
        if (description && description.length > 300) {
          return res.status(400).json({ error: 'Description must be 300 characters or less' });
        }
        
        // Validate date
        const eventDateTime = new Date(eventDate);
        if (isNaN(eventDateTime.getTime())) {
          return res.status(400).json({ error: 'Invalid event date format' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        // Verify user is a member of this group
        const membership = await db
          .select()
          .from(groupMembers)
          .where(and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, user.id)
          ))
          .limit(1);
        
        if (membership.length === 0) {
          return res.status(403).json({ error: 'You are not a member of this group' });
        }
        
        // Create event
        const newEvent = await db
          .insert(groupEvents)
          .values({
            groupId,
            title: title.trim(),
            description: description?.trim() || undefined,
            eventDate: eventDateTime,
            createdByUserId: user.id
          })
          .returning();
        
        res.status(201).json(newEvent[0]);
      } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Failed to create event' });
      }
    });

    // Lab Settings endpoints
    // GET /api/lab-settings - Get user's lab settings
    app.get("/api/lab-settings", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        const userSettings = await db
          .select()
          .from(userLabSettings)
          .where(eq(userLabSettings.userId, user.id))
          .limit(1);
        
        if (userSettings.length === 0) {
          return res.status(404).json({ error: 'Lab settings not found' });
        }
        
        res.json({
          settings: userSettings[0].settings,
          updatedAt: userSettings[0].updatedAt
        });
      } catch (error) {
        console.error('Error getting lab settings:', error);
        res.status(500).json({ error: 'Failed to retrieve lab settings' });
      }
    });

    // POST /api/lab-settings - Save user's lab settings
    app.post("/api/lab-settings", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        const { settings } = req.body;
        
        if (!settings || typeof settings !== 'object') {
          return res.status(400).json({ error: 'Invalid settings object' });
        }
        
        // Comprehensive settings validation
        if (!settings.version || typeof settings.version !== 'number' || settings.version < 1) {
          return res.status(400).json({ error: 'Invalid or missing settings version' });
        }
        
        if (!settings.panelOrder || !Array.isArray(settings.panelOrder)) {
          return res.status(400).json({ error: 'Invalid panel order format' });
        }
        
        // Validate panel order contains only strings
        if (!settings.panelOrder.every((panel: any) => panel && typeof panel === 'string' && panel.trim().length > 0)) {
          return res.status(400).json({ error: 'Panel order must contain valid panel names' });
        }
        
        // Check for reasonable panel order length
        if (settings.panelOrder.length > 50) {
          return res.status(400).json({ error: 'Too many panels in panel order (max 50)' });
        }
        
        // Validate other required arrays
        if (!Array.isArray(settings.panelLabOrders)) {
          return res.status(400).json({ error: 'Invalid panel lab orders format' });
        }
        
        // Check reasonable limits for arrays
        if (settings.panelLabOrders.length > 100) {
          return res.status(400).json({ error: 'Too many panel lab orders (max 100)' });
        }
        
        if (!Array.isArray(settings.trendingPreferences)) {
          return res.status(400).json({ error: 'Invalid trending preferences format' });
        }
        
        if (settings.trendingPreferences.length > 500) {
          return res.status(400).json({ error: 'Too many trending preferences (max 500)' });
        }
        
        if (!Array.isArray(settings.defaultSelections)) {
          return res.status(400).json({ error: 'Invalid default selections format' });
        }
        
        if (settings.defaultSelections.length > 100) {
          return res.status(400).json({ error: 'Too many default selections (max 100)' });
        }
        
        // Validate global trending settings
        if (!settings.globalTrending || typeof settings.globalTrending !== 'object') {
          return res.status(400).json({ error: 'Invalid global trending settings' });
        }
        
        if (typeof settings.globalTrending.defaultTrendCount !== 'number' || 
            settings.globalTrending.defaultTrendCount < 0 || 
            settings.globalTrending.defaultTrendCount > 10) {
          return res.status(400).json({ error: 'Invalid default trend count' });
        }
        
        if (typeof settings.globalTrending.enableByDefault !== 'boolean') {
          return res.status(400).json({ error: 'Invalid enable by default setting' });
        }
        
        // Validate UI settings
        if (!settings.ui || typeof settings.ui !== 'object') {
          return res.status(400).json({ error: 'Invalid UI settings' });
        }
        
        // Check settings size (max 100KB)
        const settingsSize = JSON.stringify(settings).length;
        if (settingsSize > 100 * 1024) {
          return res.status(413).json({ error: 'Settings data too large (max 100KB)' });
        }
        
        // Check if user already has settings
        const existingSettings = await db
          .select()
          .from(userLabSettings)
          .where(eq(userLabSettings.userId, user.id))
          .limit(1);
        
        let result;
        const now = new Date();
        
        if (existingSettings.length > 0) {
          // Update existing settings
          result = await db
            .update(userLabSettings)
            .set({
              settings,
              updatedAt: now
            })
            .where(eq(userLabSettings.userId, user.id))
            .returning();
        } else {
          // Create new settings
          result = await db
            .insert(userLabSettings)
            .values({
              userId: user.id,
              settings,
              createdAt: now,
              updatedAt: now
            })
            .returning();
        }
        
        if (!result || result.length === 0) {
          return res.status(500).json({ error: 'Failed to save settings - no result returned' });
        }
        
        res.json({
          success: true,
          settings: result[0].settings,
          updatedAt: result[0].updatedAt
        });
      } catch (error) {
        console.error('Error saving lab settings:', error);
        
        // Handle specific database errors
        if ((error as any).code === '23505') { // Unique constraint violation
          return res.status(409).json({ error: 'Settings conflict - please refresh and try again' });
        }
        
        if ((error as any).code === '23503') { // Foreign key violation
          return res.status(400).json({ error: 'Invalid user reference' });
        }
        
        if ((error as any).message?.includes('timeout')) {
          return res.status(408).json({ error: 'Database timeout - please try again' });
        }
        
        if ((error as any).message?.includes('connection')) {
          return res.status(503).json({ error: 'Database connection error - please try again later' });
        }
        
        res.status(500).json({ error: 'Failed to save lab settings' });
      }
    });

    // PUT /api/lab-settings - Update user's lab settings
    app.put("/api/lab-settings", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        const { settings } = req.body;
        
        if (!settings || typeof settings !== 'object') {
          return res.status(400).json({ error: 'Invalid settings object' });
        }
        
        // Validate settings structure
        if (!settings.version || !settings.panelOrder || !Array.isArray(settings.panelOrder)) {
          return res.status(400).json({ error: 'Invalid settings format' });
        }
        
        const result = await db
          .update(userLabSettings)
          .set({
            settings,
            updatedAt: new Date()
          })
          .where(eq(userLabSettings.userId, user.id))
          .returning();
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'Lab settings not found' });
        }
        
        res.json({
          success: true,
          settings: result[0].settings,
          updatedAt: result[0].updatedAt
        });
      } catch (error) {
        console.error('Error updating lab settings:', error);
        res.status(500).json({ error: 'Failed to update lab settings' });
      }
    });

    // DELETE /api/lab-settings - Delete user's lab settings
    app.delete("/api/lab-settings", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth);
        
        const result = await db
          .delete(userLabSettings)
          .where(eq(userLabSettings.userId, user.id))
          .returning();
        
        if (result.length === 0) {
          return res.status(404).json({ error: 'Lab settings not found' });
        }
        
        res.json({ success: true, message: 'Lab settings deleted successfully' });
      } catch (error) {
        console.error('Error deleting lab settings:', error);
        res.status(500).json({ error: 'Failed to delete lab settings' });
      }
    });

    // Medication image extraction endpoint
    app.post("/api/medications/extract-from-image", async (req, res) => {
      try {
        const { image, mediaType } = req.body;
        
        const imageData = validateBase64Image(image);
        if (!imageData) {
          return res.status(400).json({ 
            error: "Invalid image data",
            details: "Please ensure the image is in a supported format (JPEG, PNG, WebP) and properly encoded"
          });
        }

        const { data: base64Data, type: imageTypeParam } = imageData;
        
        console.log('Processing image for medication extraction');
        
        const medications = await extractMedicationsFromImage(base64Data, imageTypeParam as any);
        
        console.log(`Extracted ${medications.length} medications`);
        
        if (medications.length === 0) {
          // Return helpful guidance instead of just empty array
          return res.json({
            medications: [],
            suggestions: [
              "Ensure the image contains clear, readable text",
              "Check that medication names and dosages are visible", 
              "Try taking a photo with better lighting",
              "Make sure the image shows prescription labels or medication lists",
              "Verify the image is not too blurry or low resolution"
            ],
            debug: "No medications were detected in the image. This could be due to image quality, unclear text, or the image not containing medication information.",
            success: false
          });
        }
        
        // Add confidence scoring to results
        const enhancedMedications = medications.map(med => ({
          ...med,
          confidence: calculateMedicationConfidence(med),
          source: med.notes?.includes('regex') ? 'fallback' : 'ai'
        }));
        
        res.json({
          medications: enhancedMedications,
          totalFound: medications.length,
          extractionMethod: enhancedMedications.some(m => m.source === 'ai') ? 'AI + Fallback' : 'Pattern Matching',
          success: true
        });
      } catch (error: any) {
        console.error("Error processing medication image:", error);
        
        // Provide more helpful error messages
        let errorMessage = "Failed to process medication image";
        let suggestions: string[] = [];
        
        if (error.message?.includes('Vision API unavailable')) {
          errorMessage = "Image text recognition service is temporarily unavailable";
          suggestions = ["Please try again in a few moments", "Check your internet connection"];
        } else if (error.message?.includes('Failed to extract medications')) {
          errorMessage = "Unable to extract medication information from image";
          suggestions = [
            "Ensure the image shows medication labels or prescription information",
            "Try improving image quality (lighting, focus, resolution)",
            "Make sure text is clearly visible and not obscured"
          ];
        }
        
        res.status(500).json({ 
          error: errorMessage,
          suggestions,
          technical: error.message,
          success: false
        });
      }
    });

    const httpServer = createServer(app);
    console.log('Routes registered successfully');
    return httpServer;
  } catch (error) {
    console.error('Error registering routes:', error);
    throw error;
  }
}