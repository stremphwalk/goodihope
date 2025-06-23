import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchMedications, getCommonDosages } from "./parseCSVMedications";
import { extractLabValuesFromImage, extractMedicationsFromImage } from "./vision";
import { sanitizeString, validateBase64Image, SECURITY_CONFIG } from "./security";
import { db } from "./database";
import { dotPhrases, users, templates, templateUsage } from "../shared/schema";
import { eq, and, ne } from "drizzle-orm";
import { checkJwt } from './auth';

// Extend the Express Request type to include the auth payload
interface AuthenticatedRequest extends Request {
  auth?: {
    sub: string; // The user's unique identifier from Cognito
    [key: string]: any;
  };
}

// Function to get or create a user in your local database
const getOrCreateUser = async (cognitoSub: string) => {
  let user = await db.select().from(users).where(eq(users.username, cognitoSub)).limit(1);

  if (user.length === 0) {
    // If user doesn't exist, create a new one
    // Note: You might want to handle user creation more robustly
    // depending on your application's logic.
    const newUser = await db.insert(users).values({
      username: cognitoSub,
      password: 'cognito-user', // Password is required but not used for Cognito logins
    }).returning();
    return newUser[0];
  }
  return user[0];
};

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
    app.delete("/api/dot-phrases/:id", checkJwt, async (req, res) => {
      try {
        const { id } = req.params;
        
        // Get userId from authenticated user
        const userId = req.auth?.sub ? parseInt(req.auth.sub) : 1;
        
        const deletedDotPhrase = await db
          .delete(dotPhrases)
          .where(and(eq(dotPhrases.id, parseInt(id)), eq(dotPhrases.userId, userId)))
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

    // Template API endpoints
    
    // GET /api/templates - Get all templates for the current user
    app.get("/api/templates", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        if (!req.auth?.sub) {
          console.error('Template fetch failed: No user identifier in token');
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth.sub);
        const { category, specialty, search } = req.query;
        
        console.log('Fetching templates for user:', { 
          userId: user.id, 
          filters: { category, specialty, search } 
        });
        
        // Build conditions array
        const conditions = [eq(templates.userId, user.id)];
        
        if (category && category !== 'all') {
          conditions.push(eq(templates.category, category as string));
        }
        
        if (specialty && specialty !== 'all') {
          conditions.push(eq(templates.specialty, specialty as string));
        }
        
        // Apply search filter (placeholder for now)
        if (search) {
          // TODO: Implement search functionality
          // conditions.push(like(templates.name, `%${search}%`));
          console.log('Search functionality not yet implemented, ignoring search term:', search);
        }
        
        const userTemplates = await db
          .select()
          .from(templates)
          .where(and(...conditions))
          .orderBy(templates.updatedAt);
        
        console.log('Templates fetched successfully:', { 
          count: userTemplates.length,
          userId: user.id 
        });
        
        // Ensure content is properly structured
        const processedTemplates = userTemplates.map(template => {
          let parsedContent = template.content;
          if (typeof template.content === 'string') {
            try {
              parsedContent = JSON.parse(template.content);
            } catch (parseError) {
              console.error('Failed to parse template content for template', template.id, parseError);
              parsedContent = { sections: [], metadata: {} }; // Fallback to empty structure
            }
          }
          return {
            ...template,
            content: parsedContent
          };
        });
        
        res.json(processedTemplates);
      } catch (error) {
        console.error('Error fetching templates:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
          error: 'Failed to fetch templates',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // POST /api/templates - Create a new template
    app.post("/api/templates", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { 
          name, 
          description, 
          category, 
          specialty, 
          content, 
          isPublic,
          compatibleNoteTypes,
          compatibleSubtypes,
          sectionDefaults
        } = req.body;
        
        if (!req.auth?.sub) {
          console.error('Template creation failed: No user identifier in token');
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth.sub);
        
        // Enhanced validation
        if (!name || !name.trim()) {
          console.error('Template creation failed: Missing or empty name');
          return res.status(400).json({ error: 'Template name is required and cannot be empty' });
        }
        
        if (!category || !category.trim()) {
          console.error('Template creation failed: Missing or empty category');
          return res.status(400).json({ error: 'Category is required and cannot be empty' });
        }
        
        if (!content) {
          console.error('Template creation failed: Missing content');
          return res.status(400).json({ error: 'Template content is required' });
        }
        
        // Validate content structure
        if (typeof content !== 'object' || !content.sections || !Array.isArray(content.sections)) {
          console.error('Template creation failed: Invalid content structure', { content });
          return res.status(400).json({ error: 'Template content must have a valid sections array' });
        }
        
        if (!content.metadata || typeof content.metadata !== 'object') {
          console.error('Template creation failed: Invalid metadata structure', { metadata: content.metadata });
          return res.status(400).json({ error: 'Template content must have valid metadata' });
        }
        
        // Check for duplicate names for this user
        const existing = await db
          .select()
          .from(templates)
          .where(and(eq(templates.userId, user.id), eq(templates.name, name.trim())));
        
        if (existing.length > 0) {
          console.error('Template creation failed: Duplicate name', { name: name.trim(), userId: user.id });
          return res.status(409).json({ error: 'A template with this name already exists' });
        }
        
        console.log('Creating template:', { 
          name: name.trim(), 
          category, 
          userId: user.id,
          sectionsCount: content.sections.length 
        });
        
        const newTemplate = await db
          .insert(templates)
          .values({
            userId: user.id,
            name: name.trim(),
            description: description?.trim() || null,
            category: category.trim(),
            specialty: specialty?.trim() || null,
            content,
            compatibleNoteTypes: compatibleNoteTypes || ['admission'],
            compatibleSubtypes: compatibleSubtypes || ['general'],
            sectionDefaults: sectionDefaults || {},
            isPublic: isPublic || false,
            version: 1,
            lastUsed: new Date(),
            isFavorite: false
          })
          .returning();
        
        console.log('Template created successfully:', { id: newTemplate[0].id, name: newTemplate[0].name });
        res.status(201).json(newTemplate[0]);
      } catch (error) {
        console.error('Error creating template:', error);
        if (error instanceof Error) {
          console.error('Error stack:', error.stack);
        }
        res.status(500).json({ 
          error: 'Failed to create template',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    // PUT /api/templates/:id - Update an existing template
    app.put("/api/templates/:id", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { name, description, category, specialty, content, isPublic } = req.body;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth.sub);
        
        // Validate template ID
        const templateId = parseInt(id);
        if (isNaN(templateId) || templateId <= 0) {
          return res.status(400).json({ error: 'Invalid template ID' });
        }
        
        if (!name || !category || !content) {
          return res.status(400).json({ error: 'Name, category, and content are required' });
        }
        
        // Check if the template exists and belongs to the user
        const existing = await db
          .select()
          .from(templates)
          .where(and(eq(templates.id, templateId), eq(templates.userId, user.id)));
        
        if (existing.length === 0) {
          return res.status(404).json({ error: 'Template not found' });
        }
        
        // Check for duplicate names (excluding current template)
        const duplicate = await db
          .select()
          .from(templates)
          .where(and(
            eq(templates.userId, user.id), 
            eq(templates.name, name.trim()),
            ne(templates.id, templateId)
          ));
        
        if (duplicate.length > 0) {
          return res.status(409).json({ error: 'A template with this name already exists' });
        }
        
        const updatedTemplate = await db
          .update(templates)
          .set({
            name: name.trim(),
            description: description?.trim() || null,
            category: category.trim(),
            specialty: specialty?.trim() || null,
            content,
            isPublic: isPublic || false,
            updatedAt: new Date()
          })
          .where(and(eq(templates.id, templateId), eq(templates.userId, user.id)))
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
        
        const user = await getOrCreateUser(req.auth.sub);
        
        // Validate template ID
        const templateId = parseInt(id);
        if (isNaN(templateId) || templateId <= 0) {
          return res.status(400).json({ error: 'Invalid template ID' });
        }
        
        const deletedTemplate = await db
          .delete(templates)
          .where(and(eq(templates.id, templateId), eq(templates.userId, user.id)))
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

    // POST /api/templates/:id/use - Record template usage
    app.post("/api/templates/:id/use", checkJwt, async (req: AuthenticatedRequest, res) => {
      try {
        const { id } = req.params;
        const { patientContext } = req.body;
        
        if (!req.auth?.sub) {
          return res.status(401).json({ error: 'Unauthorized: User identifier not found in token' });
        }
        
        const user = await getOrCreateUser(req.auth.sub);
        
        // Validate template ID
        const templateId = parseInt(id);
        if (isNaN(templateId) || templateId <= 0) {
          return res.status(400).json({ error: 'Invalid template ID' });
        }
        
        // Check if template exists
        const template = await db
          .select()
          .from(templates)
          .where(eq(templates.id, templateId))
          .limit(1);
        
        if (template.length === 0) {
          return res.status(404).json({ error: 'Template not found' });
        }
        
        // Record usage
        await db
          .insert(templateUsage)
          .values({
            templateId: templateId,
            userId: user.id,
            patientContext: patientContext || null
          });
        
        res.json({ message: 'Template usage recorded' });
      } catch (error) {
        console.error('Error recording template usage:', error);
        res.status(500).json({ error: 'Failed to record template usage' });
      }
    });

    // Medication search endpoint using authentic oral medication data
    app.get("/api/medications/search", async (req, res) => {
      try {
        const query = sanitizeString(req.query.q as string, 50);
        const limitParam = req.query.limit as string;
        const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 50); // Limit between 1-50

        if (!query || query.length < SECURITY_CONFIG.VALIDATION.MIN_QUERY_LENGTH) {
          return res.json([]);
        }

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

        res.json(medications);
      } catch (error) {
        console.error('Medication search error:', error);
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
          return res.status(400).json({ error: "Invalid image data" });
        }

        const { data: base64Data, type: imageTypeParam } = imageData;
        
        console.log('Processing image for medication extraction');
        
        const medications = await extractMedicationsFromImage(base64Data, imageTypeParam as any);
        
        console.log(`Extracted ${medications.length} medications`);
        
        res.json(medications);
      } catch (error: any) {
        console.error("Error processing medication image:", error);
        res.status(500).json({ error: "Failed to process medication image" });
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
