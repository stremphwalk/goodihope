import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedMedication } from './types';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

console.log("Attempting to use API Key:", process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Extracts medication information from OCR text using Gemini AI.
 * @param ocrText The text extracted from the image by OCR.
 * @returns A promise that resolves to an array of ExtractedMedication objects.
 */
export async function extractMedicationsFromTextWithGemini(ocrText: string): Promise<ExtractedMedication[]> {
  console.log('OCR Text being sent to Gemini:', ocrText);
  
  const prompt = `Extract medication information from the following text. Return ONLY a raw JSON array of objects with the following structure, without any markdown formatting or backticks:
  {
    "name": "string", // The name of the medication
    "dosage": "string", // The total dosage (e.g., if 100mg 2 capsules, write "200mg")
    "frequency": "string", // Use standard notation: DIE (once daily), BID (twice daily), TID (three times daily), QID (four times daily), PRN (as needed)
    "instructions": "string", // Any additional instructions
    "notes": "string" // Any additional notes or warnings
  }
  
  Rules for processing:
  1. Convert all frequencies to standard notation:
     - "once daily", "1 fois par jour", "daily" → "DIE"
     - "twice daily", "2 fois par jour", "bid" → "BID"
     - "three times daily", "3 fois par jour", "tid" → "TID"
     - "four times daily", "4 fois par jour", "qid" → "QID"
     - "as needed", "au besoin", "si nécessaire" → "PRN"
  
  2. Calculate total dosage:
     - If multiple units are taken, multiply the unit dose by the number of units
     - Example: "100mg 2 capsules" → "200mg"
     - Example: "100mg 1/2 capsule" → "50mg"
     - Example: "500mg 1 tablet" → "500mg"
  
  3. Do not include the number of capsules/tablets in the dosage field, only the total calculated dose.
  
  Return ONLY the raw JSON array, nothing else. No markdown, no backticks, no explanation. If no medications are found, return an empty array.
  
  Text to analyze:
  ${ocrText}`;

  try {
    // Use the latest Gemini model name as per Google API instructions
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response:', text);

    try {
      const medications = JSON.parse(text) as ExtractedMedication[];
      return medications;
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse medication information');
    }
  } catch (error) {
    console.error('Error processing text with Gemini:', error);
    throw error;
  }
}

export default genAI; 