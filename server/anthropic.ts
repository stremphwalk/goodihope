import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

console.log("ANTHROPIC_API_KEY is set:", !!process.env.ANTHROPIC_API_KEY);

interface LabValue {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  category: string;
  timestamp?: string;
}

interface ExtractedMedication {
  id?: string;
  name: string;
  dosage: string;
  quantity?: string;
  frequency?: string;
  category?: string;
  addedAt?: number;
  isPRN?: boolean;
}

export async function extractMedicationsFromImage(base64Image: string, mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg"): Promise<ExtractedMedication[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a medical AI assistant specialized in extracting medication information from images of medication lists, prescriptions, or pharmacy labels.

Your task is to analyze the provided image and extract ALL medications mentioned with their complete dosing information.

CRITICAL: When extracting dosage information, you must capture:
1. The BASE dosage strength (e.g., "50 mg", "200 mg")
2. The QUANTITY instructions (e.g., "2 comprimés", "½ comprimé", "0.5 capsule", "take 2", "take half")

Extract the following information for each medication found:
- name: The medication name (prefer brand names when visible, otherwise generic names)
- dosage: The BASE strength/dose only (e.g., "50 mg", "200 mg", "5 mg") - do NOT calculate total dose
- quantity: The number or fraction of pills/capsules to take (e.g., "2", "0.5", "½", "1.5")
- frequency: How often taken (e.g., "BID", "TID", "QID", "DIE", "once daily", "twice daily")

Return the results as a JSON array with this exact structure:
[
  {
    "name": "Medication Name",
    "dosage": "50 mg",
    "quantity": "2",
    "frequency": "BID"
  },
  {
    "name": "Another Medication",
    "dosage": "200 mg", 
    "quantity": "0.5",
    "frequency": "DIE"
  }
]

Important guidelines:
- Extract ALL medications visible in the image
- Use standard medical abbreviations for frequency (BID, TID, QID, DIE)
- Include dosage strength with units (mg, mcg, g, mL, IU, etc.)
- Always include quantity field - use "1" if not specified
- For fractions, use decimal format (0.5 instead of ½, 0.25 instead of ¼)
- If any field is not clearly visible, omit that field
- Use proper medication names (brand or generic)
- Return empty array if no medications are found
- Only return valid JSON format

Examples of quantity extraction:
- "2 comprimés" → quantity: "2"
- "½ comprimé" → quantity: "0.5" 
- "1.5 capsules" → quantity: "1.5"
- "take 2 tablets" → quantity: "2"
- "one capsule" → quantity: "1"`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please extract all medication information from this image including medication names, dosages, quantities, and frequencies. Pay special attention to capturing both the base dosage strength and the quantity of pills/capsules to take."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const responseText = (textContent as any).text;
    console.log("Raw API response:", responseText);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("No JSON array found in response");
      return [];
    }

    let medications: ExtractedMedication[] = [];
    try {
      medications = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("Failed to parse JSON from Anthropic response:", err);
      return [];
    }
    if (!Array.isArray(medications)) {
      console.error("Parsed medications is not an array:", medications);
      return [];
    }
    if (medications.length === 0) {
      console.log("No medications were found in images");
    }
    // Ensure all required fields are present
    medications = medications.filter(med => med.name && med.dosage);
    // Process and categorize medications using our enhanced logic
    return medications.map(med => {
      // Calculate total dosage if quantity is provided
      let finalDosage = med.dosage;
      if (med.quantity && med.quantity !== "1") {
        const dosageMatch = med.dosage.match(/(\d+(?:\.\d+)?)\s*(mg|mcg|g|IU|ml|units?)/i);
        if (dosageMatch) {
          const baseDose = parseFloat(dosageMatch[1]);
          const unit = dosageMatch[2];
          const quantity = parseFloat(med.quantity);
          const totalDose = baseDose * quantity;
          if (totalDose % 1 === 0) {
            finalDosage = `${totalDose} ${unit}`;
          } else {
            finalDosage = `${totalDose.toFixed(2).replace(/\.?0+$/, '')} ${unit}`;
          }
        }
      }
      return {
        name: med.name,
        dosage: finalDosage,
        frequency: med.frequency || 'DIE',
        quantity: med.quantity || '1',
        category: 'Other Important',
      };
    });
  } catch (error) {
    console.error("Error extracting medications from image:", error);
    return [];
  }
}

// Location: server/anthropic.ts

export async function extractLabValuesFromImage(base64Image: string, mediaType: string = "image/jpeg"): Promise<LabValue[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620", 
      max_tokens: 4096,
      system: `Extract every lab value from the provided medical report image. For each row, extract all values as separate objects. The leftmost column contains the date and time in YYMMDD or YYMMDD HHMM format. The bottom row is the most recent; rows get older as you go up. For each value, always associate it with the correct date from its row. Do not summarize or deduplicate.

Return a JSON array of objects with:
- testName (e.g., 'Hb', 'Na', 'Plt')
- value (numerical result)
- unit (e.g., 'g/L', 'mmol/L')
- referenceRange (if present)
- category (e.g., 'Hématologie', 'Biochimie')
- timestamp (date, e.g., '250608' or '250608 0800')

The date (timestamp) field is required for every value. Return only the JSON array, no extra text.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract all laboratory values from this image. Return only a JSON array as described."
            },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                data: base64Image
              }
            }
          ]
        }
      ]
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const rawText = textContent.text;
    console.log("Raw API response for lab values:", rawText);

    // Efficient, robust JSON array extraction (compatible with ES2017)
    const jsonMatch = rawText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No valid JSON array found in the AI response:", rawText);
        return [];
    }

    try {
      const labValues: LabValue[] = JSON.parse(jsonMatch[0]);
      if (labValues.length === 0) {
        console.log("No lab values were found in images");
      }
      return labValues;
    } catch (error) {
      console.error("Error parsing lab values JSON:", error);
        return [];
    }
  } catch (error) {
    console.error('Error during the Anthropic API call or processing:', error);
    throw new Error('Failed to extract lab values from image');
  }
}

/**
 * Extract medications from OCR text using Anthropic LLM.
 * Requirements:
 * - Only base generic medications (ignore 'sr', 'xr', etc.)
 * - Use whatever language is present
 * - Exclude non-medication lines (e.g., instructions)
 * - Deduplicate by generic name + dose
 * - Return structured JSON: name, dosage, frequency (required), quantity (default 1 if not present)
 */
export async function extractMedicationsFromTextWithLLM(ocrText: string): Promise<ExtractedMedication[]> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      system: `You are a medical AI assistant specialized in extracting medication information from OCR text of medication lists, prescriptions, or pharmacy labels.\n\nYour task is to analyze the provided OCR text and extract ALL medications mentioned with their complete dosing information.\n\nCRITICAL: When extracting dosage information, you must capture:\n1. The BASE dosage strength (e.g., '50 mg', '200 mg')\n2. The QUANTITY instructions (e.g., '2 comprimés', '½ comprimé', '0.5 capsule', 'take 2', 'take half')\n\nExtract the following information for each medication found:\n- name: The base generic medication name (ignore brand names and ignore any 'sr', 'xr', 'cr', 'la', 'mr', 'er', 'sa', 'xl', '24h', 'retard', etc. modifiers)\n- dosage: The BASE strength/dose only (e.g., '50 mg', '200 mg', '5 mg')\n- quantity: The number or fraction of pills/capsules to take (e.g., '2', '0.5', '1.5'). Use '1' if not specified.\n- frequency: How often taken (e.g., 'BID', 'TID', 'QID', 'DIE', 'once daily', 'twice daily'). This field is required.\n\nReturn the results as a JSON array with this exact structure:\n[\n  {\n    "name": "Medication Name",\n    "dosage": "50 mg",\n    "quantity": "2",\n    "frequency": "BID"\n  },\n  {\n    "name": "Another Medication",\n    "dosage": "200 mg",\n    "quantity": "0.5",\n    "frequency": "DIE"\n  }\n]\n\nImportant guidelines:\n- Extract ONLY base generic medications (ignore brand names and ignore any 'sr', 'xr', 'cr', 'la', 'mr', 'er', 'sa', 'xl', '24h', 'retard', etc. modifiers)\n- Use whatever language is present in the text\n- Exclude any lines that are not medications (e.g., instructions like 'Prendre 17 G DIE', 'Appliquez', 'Faire', etc.)\n- Deduplicate by generic name + dose\n- Use standard medical abbreviations for frequency (BID, TID, QID, DIE)\n- Always include quantity field - use '1' if not specified\n- For fractions, use decimal format (0.5 instead of ½, 0.25 instead of ¼)\n- If any field is not clearly visible, omit that field\n- Return empty array if no medications are found\n- Only return valid JSON format\n\nExamples of quantity extraction:\n- '2 comprimés' → quantity: '2'\n- '½ comprimé' → quantity: '0.5'\n- '1.5 capsules' → quantity: '1.5'\n- 'take 2 tablets' → quantity: '2'\n- 'one capsule' → quantity: '1'\n\nExample input:\nHOME MEDICATIONS:\n- Allopurinol 200 MG DIE\n- Jamp allopurinol 200 MG DIE\n- Apixaban 5 MG DIE\n- Metoprolol 100 MG DIE\n- Aa metoprolol sr 100 MG DIE\n- Rosuvastatine 20 MG DIE\n- Rosuvastatin 20 MG DIE\n- Prendre 17 G DIE\n\nExample output:\n[\n  {"name": "Allopurinol", "dosage": "200 MG", "quantity": "1", "frequency": "DIE"},\n  {"name": "Apixaban", "dosage": "5 MG", "quantity": "1", "frequency": "DIE"},\n  {"name": "Metoprolol", "dosage": "100 MG", "quantity": "1", "frequency": "DIE"},\n  {"name": "Rosuvastatine", "dosage": "20 MG", "quantity": "1", "frequency": "DIE"}\n]\n\nDo not include any extra text, only the JSON array.`,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: ocrText
            }
          ],
        },
      ],
    });

    const textContent = response.content[0];
    if (textContent.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic API');
    }

    const responseText = (textContent as any).text;
    console.log("Raw LLM API response (text):", responseText);

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.log("No JSON array found in LLM response");
      return [];
    }

    let medications: ExtractedMedication[] = [];
    try {
      medications = JSON.parse(jsonMatch[0]);
    } catch (err) {
      console.error("Failed to parse JSON from LLM response:", err);
      return [];
    }
    if (!Array.isArray(medications)) {
      console.error("Parsed medications is not an array:", medications);
      return [];
    }
    if (medications.length === 0) {
      console.log("No medications were found in OCR text");
    }
    // Ensure all required fields are present
    medications = medications.filter(med => med.name && med.dosage && med.frequency);
    return medications;
  } catch (error) {
    console.error("Error extracting medications from OCR text with LLM:", error);
    return [];
  }
}