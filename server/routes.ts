import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { searchMedications, getCommonDosages } from "./parseCSVMedications";
import { extractLabValuesFromImage, extractMedicationsFromImage } from "./vision";

export async function registerRoutes(app: Express): Promise<Server> {
  try {
    // Medication search endpoint using authentic oral medication data
    app.get("/api/medications/search", async (req, res) => {
      try {
        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!query || query.length < 2) {
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
        const medicationName = req.params.medicationName;
        
        if (!medicationName) {
          return res.json([]);
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
        
        if (!image) {
          return res.status(400).json({ error: "No image provided" });
        }

        // Extract base64 data and determine image type
        let base64Data = image;
        let imageType = 'image/jpeg';
        
        if (image.startsWith('data:image/')) {
          const matches = image.match(/^data:(image\/[a-z]+);base64,/);
          if (matches) {
            imageType = matches[1];
            base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
          }
        }
        
        console.log(`Processing ${imageType} image, base64 length: ${base64Data.length}`);
        
        const labValues = await extractLabValuesFromImage(base64Data, imageType);
        
        console.log(`Extracted ${labValues.length} lab values:`, labValues);
        
        res.json({ labValues });
      } catch (error: any) {
        console.error("Error processing lab image:", error);
        res.status(500).json({ error: "Failed to process lab image", details: error?.message || String(error) });
      }
    });

    // Medication image extraction endpoint
    app.post("/api/medications/extract-from-image", async (req, res) => {
      try {
        const { image, mediaType } = req.body;
        
        if (!image) {
          return res.status(400).json({ error: "No image provided" });
        }

        // Extract base64 data and determine image type
        let base64Data = image;
        let imageTypeParam = mediaType || 'image/jpeg';
        
        if (image.startsWith('data:image/')) {
          const matches = image.match(/^data:(image\/[a-z]+);base64,/);
          if (matches) {
            imageTypeParam = matches[1];
            base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
          }
        }
        
        console.log(`Processing medication image ${imageTypeParam}, base64 length: ${base64Data.length}`);
        
        const medications = await extractMedicationsFromImage(base64Data, imageTypeParam as any);
        
        console.log(`Extracted ${medications.length} medications:`, medications);
        
        res.json(medications);
      } catch (error: any) {
        console.error("Error processing medication image:", error);
        res.status(500).json({ error: "Failed to process medication image", details: error?.message || String(error) });
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
