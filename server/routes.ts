import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchMedications, getCommonDosages } from "./parseCSVMedications";
import { extractLabValuesFromImage, extractMedicationsFromImage } from "./vision";
import { sanitizeString, validateBase64Image, SECURITY_CONFIG } from "./security";
import { db } from "./database";
import { dotPhrases, users, userPresets } from "../shared/schema";
import { eq, desc, and, ne, sql } from "drizzle-orm";
import { checkJwt } from './auth';
import { generateUniqueShareCode, isValidShareCode, normalizeShareCode } from './shareCodeUtils';
import { generateUniqueCustomIdentifier, isValidCustomIdentifier, formatCustomIdentifier } from './customIdentifierUtils';

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

// Function to get or create a user in your local database
const getOrCreateUser = async (cognitoSub: string) => {
  // Check cache first
  const cached = userCache.get(cognitoSub);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }

  let user = await db.select().from(users).where(eq(users.username, cognitoSub)).limit(1);

  if (user.length === 0) {
    // If user doesn't exist, create a new one with a custom identifier
    try {
      const customIdentifier = await generateUniqueCustomIdentifier();
      const newUser = await db.insert(users).values({
        username: cognitoSub,
        password: 'cognito-user', // Password is required but not used for Cognito logins
        customIdentifier: customIdentifier,
      }).returning();
      user = newUser;
    } catch (error) {
      console.error('Error creating user with custom identifier:', error);
      // Fallback: create user without custom identifier
      const newUser = await db.insert(users).values({
        username: cognitoSub,
        password: 'cognito-user',
      }).returning();
      user = newUser;
    }
  }

  // Cache the user
  userCache.set(cognitoSub, { user: user[0], timestamp: Date.now() });
  
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
            username: users.username,
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
        const user = await getOrCreateUser(req.auth.sub);
        const userTime = Date.now() - userStartTime;
        console.log(`[PERF] User lookup took ${userTime}ms`);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
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