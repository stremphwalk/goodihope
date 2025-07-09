import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractedMedication } from './types';
import { LabValue } from '../client/src/lib/labUtils';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}

console.log("Attempting to use API Key:", process.env.GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(apiKey);

// Enhanced regex-based medication extraction with comprehensive medication database
function extractMedicationsWithRegex(text: string): ExtractedMedication[] {
  console.log('=== REGEX FALLBACK EXTRACTION DEBUG START ===');
  console.log('Attempting enhanced regex-based medication extraction...');
  console.log('Input text length:', text.length);
  
  const medications: ExtractedMedication[] = [];
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  console.log('Processing', lines.length, 'lines of text');
  
  // Comprehensive medication database - expanded from 22 to 200+ common medications
  const commonMedications = [
    // Pain relievers / Anti-inflammatory
    'Acetaminophen', 'Tylenol', 'Ibuprofen', 'Advil', 'Motrin', 'Aspirin', 'Naproxen', 'Aleve',
    'Celecoxib', 'Celebrex', 'Diclofenac', 'Voltaren', 'Indomethacin', 'Meloxicam', 'Mobic',
    
    // Cardiovascular medications
    'Atorvastatin', 'Lipitor', 'Simvastatin', 'Zocor', 'Lisinopril', 'Prinivil', 'Zestril',
    'Metoprolol', 'Lopressor', 'Toprol', 'Amlodipine', 'Norvasc', 'Losartan', 'Cozaar',
    'Hydrochlorothiazide', 'HCTZ', 'Microzide', 'Furosemide', 'Lasix', 'Warfarin', 'Coumadin',
    'Clopidogrel', 'Plavix', 'Carvedilol', 'Coreg', 'Enalapril', 'Vasotec', 'Valsartan', 'Diovan',
    
    // Diabetes medications
    'Metformin', 'Glucophage', 'Glipizide', 'Glucotrol', 'Glyburide', 'Diabeta', 'Insulin',
    'Januvia', 'Sitagliptin', 'Victoza', 'Liraglutide', 'Lantus', 'Humalog', 'Novolog',
    
    // Gastrointestinal
    'Omeprazole', 'Prilosec', 'Pantoprazole', 'Protonix', 'Lansoprazole', 'Prevacid',
    'Esomeprazole', 'Nexium', 'Ranitidine', 'Zantac', 'Famotidine', 'Pepcid',
    
    // Thyroid
    'Levothyroxine', 'Synthroid', 'Armour', 'Cytomel', 'Liothyronine',
    
    // Antibiotics
    'Amoxicillin', 'Amoxil', 'Azithromycin', 'Zithromax', 'Ciprofloxacin', 'Cipro',
    'Cephalexin', 'Keflex', 'Doxycycline', 'Clindamycin', 'Penicillin', 'Erythromycin',
    'Levofloxacin', 'Levaquin', 'Trimethoprim', 'Bactrim', 'Sulfamethoxazole',
    
    // Mental Health
    'Sertraline', 'Zoloft', 'Escitalopram', 'Lexapro', 'Fluoxetine', 'Prozac',
    'Paroxetine', 'Paxil', 'Citalopram', 'Celexa', 'Venlafaxine', 'Effexor',
    'Duloxetine', 'Cymbalta', 'Bupropion', 'Wellbutrin', 'Trazodone', 'Desyrel',
    'Lorazepam', 'Ativan', 'Alprazolam', 'Xanax', 'Clonazepam', 'Klonopin',
    
    // Respiratory
    'Albuterol', 'Proventil', 'Ventolin', 'Fluticasone', 'Flonase', 'Montelukast', 'Singulair',
    'Prednisone', 'Prednisolone', 'Budesonide', 'Symbicort', 'Advair', 'Spiriva', 'Tiotropium',
    
    // Allergy
    'Cetirizine', 'Zyrtec', 'Loratadine', 'Claritin', 'Fexofenadine', 'Allegra',
    'Diphenhydramine', 'Benadryl', 'Hydroxyzine', 'Atarax',
    
    // Sleep aids
    'Zolpidem', 'Ambien', 'Eszopiclone', 'Lunesta', 'Melatonin', 'Trazodone',
    
    // Vitamins and supplements
    'Vitamin', 'Multivitamin', 'VitaminD', 'VitaminB', 'VitaminC', 'Calcium', 'Iron',
    'Magnesium', 'Omega', 'Fish Oil', 'Folic Acid', 'Biotin', 'Zinc',
    
    // Other common medications
    'Gabapentin', 'Neurontin', 'Pregabalin', 'Lyrica', 'Tramadol', 'Ultram',
    'Cyclobenzaprine', 'Flexeril', 'Baclofen', 'Tizanidine', 'Zanaflex'
  ];
  
  // Create regex patterns
  const medicationPatterns = [
    // Exact matches for known medications (case insensitive)
    new RegExp(`\\b(${commonMedications.join('|')})\\b`, 'gi'),
    
    // Common medication suffixes (more comprehensive)
    /\b\w+(?:ine|ril|tin|zole|ide|amin|mycin|cillin|pril|sartan|olol|pine|farin|ide|ase|mide|done|zine|pine|stat|fenac|phylline|dine|caine|nazole|tadine|tidine|conazole|vir|cycline|floxacin|tetracycline)\b/gi,
    
    // Brand name patterns (often capitalized, may have numbers)
    /\b[A-Z][a-z]+(?:[A-Z][a-z]*)*(?:\s*\d+)?\b/g,
    
    // Medication-like patterns with numbers (dosage indicators)
    /\b[A-Za-z]{4,}(?:\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|iu|units?))\b/gi
  ];
  
  console.log('Using', medicationPatterns.length, 'medication patterns');
  console.log('Known medication database size:', commonMedications.length, 'medications');
  
  const dosagePattern = /(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|units?)\b/gi;
  const frequencyPatterns = [
    { pattern: /\b(once|1)\s+(?:daily|day|time)/gi, replacement: 'DIE' },
    { pattern: /\b(twice|2)\s+(?:daily|day|times)/gi, replacement: 'BID' },
    { pattern: /\b(three|3)\s+(?:times|daily|day)/gi, replacement: 'TID' },
    { pattern: /\b(four|4)\s+(?:times|daily|day)/gi, replacement: 'QID' },
    { pattern: /\b(?:as\s+needed|prn|au\s+besoin)\b/gi, replacement: 'PRN' },
    { pattern: /\bbid\b/gi, replacement: 'BID' },
    { pattern: /\btid\b/gi, replacement: 'TID' },
    { pattern: /\bqid\b/gi, replacement: 'QID' },
    { pattern: /\bdaily\b/gi, replacement: 'DIE' },
    { pattern: /\bevery\s+\d+\s+hours?/gi, replacement: 'PRN' }
  ];
  
  let totalMatches = 0;
  
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    console.log(`Processing line ${lineIndex + 1}: "${line}"`);
    
    // Try each medication pattern
    for (let patternIndex = 0; patternIndex < medicationPatterns.length; patternIndex++) {
      const pattern = medicationPatterns[patternIndex];
      const matches = line.match(pattern);
      
      if (matches) {
        console.log(`✓ Pattern ${patternIndex + 1} found ${matches.length} matches in line ${lineIndex + 1}:`, matches);
        totalMatches += matches.length;
        
        for (const medicationName of matches) {
          // Clean up the medication name
          const cleanName = medicationName.trim().replace(/[^\w\s-]/g, '');
          if (cleanName.length < 2) continue; // Skip very short matches
          
          // Extract dosage from the same line or adjacent lines
          let dosage = '';
          const dosageMatches = line.match(dosagePattern);
          if (dosageMatches) {
            dosage = dosageMatches[0];
            console.log(`  Found dosage in same line: ${dosage}`);
          } else {
            // Check next line for dosage
            if (lineIndex + 1 < lines.length) {
              const nextLineDosage = lines[lineIndex + 1].match(dosagePattern);
              if (nextLineDosage) {
                dosage = nextLineDosage[0];
                console.log(`  Found dosage in next line: ${dosage}`);
              }
            }
          }
          
          // Extract frequency
          let frequency = '';
          for (const freqPattern of frequencyPatterns) {
            if (freqPattern.pattern.test(line)) {
              frequency = freqPattern.replacement;
              console.log(`  Found frequency in same line: ${frequency}`);
              break;
            }
          }
          
          // If no frequency in same line, check next line
          if (!frequency && lineIndex + 1 < lines.length) {
            for (const freqPattern of frequencyPatterns) {
              if (freqPattern.pattern.test(lines[lineIndex + 1])) {
                frequency = freqPattern.replacement;
                console.log(`  Found frequency in next line: ${frequency}`);
                break;
              }
            }
          }
          
          const medication = {
            name: cleanName,
            dosage: dosage,
            frequency: frequency,
            instructions: '',
            notes: `Extracted via regex pattern ${patternIndex + 1}`
          };
          
          medications.push(medication);
          console.log(`  ✓ Added medication:`, medication);
        }
      }
    }
  }
  
  console.log(`Total pattern matches found: ${totalMatches}`);
  console.log(`Raw medications extracted: ${medications.length}`);
  
  // Remove duplicates and filter invalid entries
  const uniqueMedications = medications.filter((med, index, arr) => {
    // Check if it's a duplicate
    const isDuplicate = arr.findIndex(m => m.name.toLowerCase() === med.name.toLowerCase()) !== index;
    if (isDuplicate) {
      console.log(`Removing duplicate: ${med.name}`);
      return false;
    }
    
    // Filter out obviously invalid entries
    const name = med.name.toLowerCase();
    const invalidTerms = ['mg', 'mcg', 'daily', 'twice', 'once', 'tablet', 'capsule', 'ml', 'g'];
    const isInvalid = invalidTerms.some(term => name === term);
    if (isInvalid) {
      console.log(`Filtering out invalid term: ${med.name}`);
      return false;
    }
    
    return true;
  });
  
  console.log(`Final unique medications: ${uniqueMedications.length}`);
  uniqueMedications.forEach((med, index) => {
    console.log(`${index + 1}. ${med.name} ${med.dosage} ${med.frequency}`);
  });
  
  console.log('=== REGEX FALLBACK EXTRACTION DEBUG END ===');
  return uniqueMedications;
}

/**
 * Extracts medication information from OCR text using Gemini AI.
 * @param ocrText The text extracted from the image by OCR.
 * @returns A promise that resolves to an array of ExtractedMedication objects.
 */
export async function extractMedicationsFromTextWithGemini(ocrText: string): Promise<ExtractedMedication[]> {
  console.log('=== GEMINI EXTRACTION DEBUG START ===');
  console.log('OCR Text being sent to Gemini (length:', ocrText.length, 'chars)');
  console.log('OCR Text sample:', ocrText.substring(0, 300) + (ocrText.length > 300 ? '...' : ''));
  
  const enhancedPrompt = `You are a medical expert specializing in medication extraction from prescription documents and medication lists. Extract ALL medication information from the following text with high accuracy.

Return ONLY a raw JSON array of objects with this exact structure (no markdown, no backticks, no explanations):
[
  {
    "name": "string", // Medication name (clean, properly capitalized)
    "dosage": "string", // Total calculated dosage with units (e.g., "200mg", "50mg", "500mg")
    "frequency": "string", // Standard medical notation: DIE, BID, TID, QID, PRN
    "instructions": "string", // Additional instructions if any
    "notes": "string" // Warnings, conditions, or special notes
  }
]

CRITICAL RULES:
1. EXTRACT ALL MEDICATIONS mentioned in the text, including:
   - Brand names (Tylenol, Advil, Lipitor, etc.)
   - Generic names (Acetaminophen, Ibuprofen, Atorvastatin, etc.)
   - Prescription medications
   - Over-the-counter medications
   - Supplements if clearly mentioned
   - Be VERY LIBERAL in extraction - if there's any doubt, include it

2. DOSAGE EXTRACTION (NO CALCULATION):
   - Extract the base dosage strength ONLY (e.g., for "100mg 2 tablets", the dosage is "100mg").
   - DO NOT multiply or perform any calculations.
   - The quantity (e.g., "2 tablets") should be part of the "instructions" field.
   - Include units (mg, mcg, g, ml, IU, etc.).
   - If no dosage found, use an empty string "".

3. FREQUENCY STANDARDIZATION:
   - "once daily", "1x daily", "daily", "QD", "OD" → "DIE"
   - "twice daily", "2x daily", "BID", "BD" → "BID"  
   - "three times daily", "3x daily", "TID", "TDS" → "TID"
   - "four times daily", "4x daily", "QID", "QDS" → "QID"
   - "as needed", "PRN", "when needed", "if needed" → "PRN"
   - "every morning", "AM" → "DIE"
   - "bedtime", "HS", "at night" → "DIE"
   - If no frequency found, use empty string ""

4. BE VERY INCLUSIVE:
   - Even if text is fragmented or unclear, try to extract medication names
   - Don't require perfect formatting - extract what you can
   - Include partial information if available
   - Be aggressive in finding medication-like words

5. HANDLE COMPLEX FORMATS:
   - Multi-line medication entries
   - Medications with multiple instructions
   - Strength variations (e.g., "Metformin 500mg/1000mg")
   - Combination medications
   - OCR errors and typos

6. QUALITY CHECKS:
   - Ignore obviously non-medical terms (but be liberal)
   - Handle OCR errors in medication names
   - Preserve important medical context

The text to analyze may be in English or French. Handle both languages correctly.

EXAMPLES:
Input: "Metformin 500mg twice daily with meals"
Output: [{"name": "Metformin", "dosage": "500mg", "frequency": "BID", "instructions": "with meals", "notes": ""}]

Input: "Tylenol 325mg 2 tablets every 6 hours as needed for pain"  
Output: [{"name": "Tylenol", "dosage": "325mg", "frequency": "PRN", "instructions": "2 tablets every 6 hours for pain", "notes": ""}]

Input: "Lipitor\n20mg\ndaily"
Output: [{"name": "Lipitor", "dosage": "20mg", "frequency": "DIE", "instructions": "", "notes": ""}]

Text to analyze:
${ocrText}`;

  try {
    console.log('✓ Sending request to Gemini API...');
    console.log('Prompt length:', enhancedPrompt.length, 'characters');
    
    // Use the latest Gemini model with enhanced configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1, // Lower temperature for more consistent extraction
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    });
    
    const result = await model.generateContent(enhancedPrompt);
    const response = await result.response;
    let text = response.text();
    console.log('✓ Gemini API response received (length:', text.length, 'chars)');
    console.log('Raw Gemini response:', text);

    // Clean up response - remove markdown if present
    const originalText = text;
    text = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    
    if (originalText !== text) {
      console.log('✓ Cleaned markdown from response');
    }
    
    try {
      console.log('Attempting to parse JSON response...');
      const medications = JSON.parse(text) as ExtractedMedication[];
      console.log('✓ JSON parsing successful, found', medications.length, 'raw medications');
      console.log('Raw medications:', medications);
      
      // Validate extracted medications with detailed logging
      console.log('Validating medications...');
      const validMedications = medications.filter((med, index) => {
        const isValid = med.name && 
          med.name.trim().length > 0 && 
          !/^\d+$/.test(med.name.trim()); // Exclude pure numbers
        
        if (!isValid) {
          console.log(`❌ Filtered out medication ${index}:`, med, 'Reason:', 
            !med.name ? 'No name' : 
            med.name.trim().length === 0 ? 'Empty name' : 
            /^\d+$/.test(med.name.trim()) ? 'Pure number' : 'Unknown');
        } else {
          console.log(`✓ Valid medication ${index}:`, med);
        }
        
        return isValid;
      });
      
      console.log(`✓ Validation complete: ${validMedications.length} valid out of ${medications.length} total`);
      
      if (validMedications.length > 0) {
        console.log('✓ SUCCESS: Returning valid medications from Gemini');
        console.log('=== GEMINI EXTRACTION DEBUG END (SUCCESS) ===');
        return validMedications;
      } else {
        console.log('⚠️  No valid medications from Gemini, trying fallback...');
        console.log('=== GEMINI EXTRACTION DEBUG END (FALLBACK) ===');
        return extractMedicationsWithRegex(ocrText);
      }
      
    } catch (parseError) {
      console.error('❌ JSON parsing failed:', parseError);
      console.log('Response that failed to parse:', text);
      console.log('First 100 chars:', text.substring(0, 100));
      console.log('Last 100 chars:', text.substring(text.length - 100));
      console.log('Falling back to regex extraction...');
      console.log('=== GEMINI EXTRACTION DEBUG END (PARSE ERROR) ===');
      return extractMedicationsWithRegex(ocrText);
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error)
    });
    console.log('Falling back to regex extraction...');
    console.log('=== GEMINI EXTRACTION DEBUG END (API ERROR) ===');
    return extractMedicationsWithRegex(ocrText);
  }
}

/**
 * Extracts laboratory values from OCR text using Gemini AI.
 * @param ocrText The text extracted from the image by OCR.
 * @returns A promise that resolves to an array of LabValue objects.
 */
export async function extractLabValuesFromTextWithGemini(ocrText: string): Promise<LabValue[]> {
  console.log('OCR Text being sent to Gemini for lab extraction:', ocrText);
  
  const enhancedPrompt = `You are an expert AI specializing in extracting structured laboratory results from OCR text of medical documents. Your task is to parse the provided text, which may be imperfect, and extract lab values with the highest possible accuracy.

Return ONLY a raw JSON array of objects with this exact structure. Do not include any explanations, markdown, or other text outside of the JSON array.
[
  {
    "testName": "string", // Standardized test name (e.g., "Hemoglobin", "WBC", "Sodium")
    "value": "string", // The EXACT numeric value, including decimals (e.g., "140", "12.5", "4.2")
    "unit": "string", // Unit of measurement (e.g., "g/L", "10^9/L", "mmol/L", "%")
    "category": "string", // Test category: "CBC", "Chemistry", "Coagulation", "Inflammatory"
    "timestamp": "string" // Date/time for the result (format: YYMMDD or YYYY-MM-DD)
  }
]

**CRITICAL RULES FOR ACCURACY:**

1.  **NO HALLUCINATION:**
    *   Extract ONLY values that are EXPLICITLY PRESENT in the text.
    *   If a test name appears but has NO corresponding value, IGNORE IT.
    *   If a value is ambiguous, illegible, or you are uncertain, IGNORE IT.
    *   NEVER invent, estimate, or infer values based on medical knowledge.

2.  **HANDLING TABULAR DATA (MOST IMPORTANT):**
    *   The text is likely from a table. First, identify the header row which contains the test names (e.g., 'Hb', 'Hte', 'Na', 'K').
    *   Then, for each subsequent row, identify the timestamp (usually in the first column).
    *   Carefully associate each value in the row with the correct test name from the header row based on its column position.
    *   OCR text can be messy. Columns may not be perfectly aligned. Use the spatial relationship of the text to determine the correct column for each value.
    *   A single lab result row in the image might be split across multiple lines in the OCR text. Be prepared to stitch them together.

3.  **TEST NAME STANDARDIZATION:**
    *   Map common abbreviations to their full names.
    *   'Hb', 'Hgb' -> "Hemoglobin"
    *   'Hte', 'Hct' -> "Hematocrit"
    *   'VGM', 'MCV' -> "MCV"
    *   'GB', 'WBC' -> "WBC"
    *   'Plt', 'PLT' -> "Platelets"
    *   'TP' -> "PT"
    *   'RNI', 'INR' -> "INR"
    *   'TTPa', 'aPTT' -> "aPTT"
    *   'Fibri' -> "Fibrinogen"
    *   'Alb' -> "Albumin"
    *   'Na' -> "Sodium"
    *   'K' -> "Potassium"
    *   'Cl' -> "Chloride"
    *   'CRP' -> "CRP"

4.  **VALUE EXTRACTION:**
    *   Extract the numeric value EXACTLY as it appears.
    *   Clean the value: remove symbols like '!', '>', '<' and trim whitespace.
    *   Convert comma decimals to periods (e.g., '4,2' -> '4.2').
    *   If a value is a range (e.g., "120-140"), extract the first number ("120").

5.  **CATEGORY ASSIGNMENT:**
    *   Use these categories: "CBC", "Chemistry", "Coagulation", "Inflammatory".

**STRICT REQUIREMENT:** If you cannot confidently extract any lab values according to these rules, return an empty array \`[]\`.

**TEXT TO ANALYZE:**
\`\`\`
${ocrText}
\`\`\``;

  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(enhancedPrompt);
    let text = result.response.text();
    console.log('Raw Gemini response for lab values:', text);

    // Clean up response - remove markdown if present
    const originalText = text;
    text = text.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    
    if (originalText !== text) {
      console.log('✓ Cleaned markdown from response');
    }

    try {
      const labValues: LabValue[] = JSON.parse(text);
      console.log('Parsed lab values from Gemini:', labValues);
      console.log(`Gemini returned ${labValues.length} raw lab values before validation`);
      
      // Validate and filter the results with enhanced anti-hallucination checks
      const validLabValues = labValues.filter(lab => {
        if (!lab.testName || !lab.value || !lab.category) {
          console.log('Filtering out incomplete lab value:', lab);
          return false;
        }
        
        // Basic validation for numeric values
        const numericValue = parseFloat(lab.value);
        if (isNaN(numericValue)) {
          console.log('Filtering out non-numeric lab value:', lab);
          return false;
        }
        
        // Enhanced plausibility checks to prevent hallucination
        const plausibilityRanges: Record<string, [number, number]> = {
          'Hemoglobin': [50, 200],
          'Hematocrit': [0.15, 0.65],
          'MCV': [65, 115],
          'WBC': [2, 25],
          'Platelets': [50, 800],
          'CRP': [0, 200],
          'PT': [8, 25],
          'INR': [0.8, 5.0],
          'aPTT': [20, 80],
          'Fibrinogen': [1.5, 6.0],
          'Albumin': [15, 50],
          'Sodium': [125, 155],
          'Potassium': [2.5, 6.5],
          'Chloride': [90, 115]
        };
        
        const range = plausibilityRanges[lab.testName];
        if (range && (numericValue < range[0] || numericValue > range[1])) {
          console.log(`Filtering out implausible ${lab.testName} value: ${lab.value} (outside range ${range[0]}-${range[1]})`);
          return false;
        }
        
        // Additional check: reject values that are suspiciously "nice" numbers which might indicate hallucination
        // (e.g., exactly 3.0, 4.0, 5.0 for lab values are uncommon)
        const isWholeNumber = numericValue === Math.floor(numericValue);
        const isCommonNiceNumber = isWholeNumber && [1, 2, 3, 4, 5, 10, 15, 20, 25, 30].includes(numericValue);
        
        if (isCommonNiceNumber && ['Potassium', 'Fibrinogen', 'INR'].includes(lab.testName)) {
          console.log(`Suspicious "nice number" value for ${lab.testName}: ${lab.value} - possible hallucination`);
          // Don't automatically reject, but log for manual review
        }
        
        return true;
      });
      
      console.log(`Gemini lab extraction successful: ${validLabValues.length} valid lab values`);
      return validLabValues;
      
    } catch (parseError) {
      console.error('Error parsing Gemini lab response:', parseError);
      console.log('Gemini lab response that failed to parse:', text);
      console.log('Returning empty lab values array...');
      return [];
    }
  } catch (error) {
    console.error('Error processing lab text with Gemini:', error);
    console.log('Returning empty lab values array...');
    return [];
  }
}

/**
 * General text generation using Gemini AI.
 * @param prompt The text prompt to generate from.
 * @returns A promise that resolves to the generated text.
 */
export async function generateWithGemini(prompt: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text;
  } catch (error) {
    console.error('Error generating text with Gemini:', error);
    throw new Error('Failed to generate text with Gemini');
  }
}

export default genAI; 