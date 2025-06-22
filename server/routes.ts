import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchMedications, getCommonDosages } from "./parseCSVMedications";
import { extractLabValuesFromImage, extractMedicationsFromImage } from "./vision";
import { sanitizeString, validateBase64Image, SECURITY_CONFIG } from "./security";

export async function registerRoutes(app: Express): Promise<Server> {
  try {
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
