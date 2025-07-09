import { ImageAnnotatorClient } from '@google-cloud/vision';
import { existsSync, readFileSync } from 'fs';
import { LabValue } from '../client/src/lib/labUtils';
import { ExtractedMedication } from './types';
import { extractMedicationsFromTextWithGemini, extractLabValuesFromTextWithGemini } from './gemini';

// Types for enhanced error handling
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ExtractionMetrics {
  totalTime: number;
  visionTime: number;
  geminiTime: number;
  ocrLength: number;
  medicationCount: number;
  confidence: number;
}

// Initialize the Vision API client with comprehensive error tracking
let vision: ImageAnnotatorClient | null = null;
let visionClientError: string | null = null;
let visionInitAttempts = 0;
let lastInitAttempt: Date | null = null;

// Debug and monitoring
const DEBUG_MODE = process.env.NODE_ENV === 'development';
const MAX_INIT_ATTEMPTS = 3;
const INIT_RETRY_DELAY = 5000; // 5 seconds

async function initializeVisionClient(): Promise<void> {
  if (vision && !visionClientError) {
    return; // Already initialized successfully
  }
  
  if (visionInitAttempts >= MAX_INIT_ATTEMPTS) {
    console.error(`❌ Max Vision API init attempts (${MAX_INIT_ATTEMPTS}) reached`);
    return;
  }
  
  visionInitAttempts++;
  lastInitAttempt = new Date();
  
  try {
    console.log(`🔧 Vision API initialization attempt ${visionInitAttempts}/${MAX_INIT_ATTEMPTS}`);
    
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      // Try to parse as JSON first (if it's a JSON string)
      try {
        console.log('🔍 Attempting to parse credentials as JSON...');
        const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
        
        // Validate required fields
        if (!credentials.project_id || !credentials.type || !credentials.private_key) {
          throw new Error('Missing required fields in credentials JSON');
        }
        
        console.log(`🔧 Creating Vision client for project: ${credentials.project_id}`);
        vision = new ImageAnnotatorClient({
          credentials: credentials,
          projectId: credentials.project_id
        });
        
        // Test the connection
        await testVisionConnection(vision);
        
        visionClientError = null;
        console.log(`✅ Vision API client initialized with JSON credentials (project: ${credentials.project_id})`);
      } catch (jsonError: unknown) {
        console.log('📝 JSON parsing failed:', (jsonError as Error).message);
        console.log('🔍 Credentials preview:', process.env.GOOGLE_APPLICATION_CREDENTIALS?.substring(0, 50) + '...');
        console.log('📝 Trying as file path...');
        
        // If parsing fails, assume it's a file path
        try {
          if (existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
            const credFile = JSON.parse(readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8'));
            
            vision = new ImageAnnotatorClient({
              keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
            });
            
            // Test the connection
            await testVisionConnection(vision);
            
            visionClientError = null;
            console.log(`✅ Vision API client initialized with file (project: ${credFile.project_id})`);
          } else {
            throw new Error(`Credentials file does not exist: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}`);
          }
        } catch (fileError: unknown) {
          throw new Error(`File credentials failed: ${(fileError as Error).message}`);
        }
      }
    } else {
      // Use default credentials (for production environments with service account)
      console.log('🔧 Attempting default credentials...');
      vision = new ImageAnnotatorClient();
      
      // Test the connection
      await testVisionConnection(vision);
      
      visionClientError = null;
      console.log('✅ Vision API client initialized with default credentials');
    }
  } catch (error: unknown) {
    console.error(`❌ Vision API init attempt ${visionInitAttempts} failed:`, error);
    visionClientError = `Vision API initialization failed (attempt ${visionInitAttempts}): ${(error as Error).message}`;
    vision = null;
    
    // Schedule retry if we haven't hit max attempts
    if (visionInitAttempts < MAX_INIT_ATTEMPTS) {
      console.log(`⏰ Retrying Vision API init in ${INIT_RETRY_DELAY/1000}s...`);
      setTimeout(() => initializeVisionClient(), INIT_RETRY_DELAY);
    }
  }
}

async function testVisionConnection(client: ImageAnnotatorClient): Promise<void> {
  // Test with a minimal 1x1 pixel image
  const testImage = Buffer.from('iVBORw0KGgoAAAANSUlEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  
  try {
    const [result] = await client.textDetection({ 
      image: { content: testImage } 
    });
    console.log('✅ Vision API connection test successful');
  } catch (testError: unknown) {
    throw new Error(`Vision API connection test failed: ${(testError as Error).message}`);
  }
}

// Initialize on module load
initializeVisionClient().catch(error => {
  console.error('Failed to initialize Vision API on module load:', error);
});

// Input validation function
function validateExtractionInput(base64Image: string, mediaType: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validate base64 image
  if (!base64Image || typeof base64Image !== 'string') {
    errors.push('Base64 image data is required');
  } else {
    if (base64Image.length < 50) {
      errors.push('Base64 image data too short (likely invalid)');
    } else if (base64Image.length < 100) {
      warnings.push('Base64 image data is very short, may be a minimal test image');
    }
    
    if (base64Image.length > 20 * 1024 * 1024) { // 20MB limit
      errors.push('Base64 image data too large (>20MB)');
    }
    
    // Check for valid base64
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64Image)) {
      errors.push('Invalid base64 format');
    }
  }
  
  // Validate media type
  const validMediaTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  if (!mediaType || !validMediaTypes.includes(mediaType.toLowerCase())) {
    warnings.push(`Unsupported media type: ${mediaType}, defaulting to image/jpeg`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// Enhanced OCR preprocessing with better error handling
function preprocessOCRTextSafe(rawText: string): { text: string; metrics: any } {
  if (!rawText || typeof rawText !== 'string') {
    return { text: '', metrics: { originalLength: 0, processedLength: 0, corrections: 0 } };
  }
  
  const originalLength = rawText.length;
  let corrections = 0;
  
  try {
    const processed = preprocessOCRText(rawText);
    corrections = Math.abs(processed.length - rawText.length);
    
    return {
      text: processed,
      metrics: { originalLength, processedLength: processed.length, corrections }
    };
  } catch (error: unknown) {
    console.error('OCR preprocessing failed, using raw text:', error);
    return {
      text: rawText,
      metrics: { originalLength, processedLength: rawText.length, corrections: 0, error: (error as Error).message }
    };
  }
}

// Fallback OCR simulation for when Vision API is unavailable
function simulateOCRFromImageData(base64Image: string, mediaType: string): string {
  // This is a fallback that could extract text from known test patterns
  // In a real scenario, you might use alternative OCR libraries or services
  console.log('🔄 Using OCR simulation fallback');
  
  // For demo/testing purposes, return a sample medication list
  // In production, you might use alternative OCR services or local libraries
  const sampleMedicationText = `
Sample Medication List:
Metformin 500mg twice daily
Lisinopril 10mg once daily  
Ibuprofen 400mg as needed
`;
  
  console.log('⚠️ OCR SIMULATION: Returning sample medication text for testing');
  console.log('In production, implement alternative OCR solution');
  
  return sampleMedicationText;
}

// Enhanced medication extraction with comprehensive error handling and metrics
async function extractMedicationsWithMetrics(cleanedText: string, extractionId: string): Promise<{ medications: ExtractedMedication[], metrics: any }> {
  const startTime = Date.now();
  
  try {
    console.log(`🤖 Sending to Gemini AI [${extractionId}]...`);
    const geminiStart = Date.now();
    
    const medications = await extractMedicationsFromTextWithGemini(cleanedText);
    
    const geminiTime = Date.now() - geminiStart;
    const totalTime = Date.now() - startTime;
    
    const metrics = {
      totalTime,
      geminiTime,
      textLength: cleanedText.length,
      medicationCount: medications.length,
      averageNameLength: medications.length > 0 ? 
        medications.reduce((sum, med) => sum + med.name.length, 0) / medications.length : 0,
      hasValidDosages: medications.filter(m => m.dosage && m.dosage.trim().length > 0).length,
      hasValidFrequencies: medications.filter(m => m.frequency && m.frequency.trim().length > 0).length
    };
    
    console.log(`✅ Gemini extraction completed [${extractionId}]:`, {
      medications: medications.length,
      time: `${geminiTime}ms`,
      validDosages: metrics.hasValidDosages,
      validFrequencies: metrics.hasValidFrequencies
    });
    
    return { medications, metrics };
    
  } catch (error: unknown) {
    console.error(`❌ Medication extraction failed [${extractionId}]:`, error);
    return {
      medications: [],
      metrics: {
        totalTime: Date.now() - startTime,
        error: (error as Error).message,
        textLength: cleanedText.length,
        medicationCount: 0
      }
    };
  }
}

// Define lab test categories and their corresponding tests
const LAB_CATEGORIES = {
  'CBC': ['Hb', 'Hte', 'VGM', 'GB', 'Plt'],
  'Coagulation': ['TP', 'RNI', 'TTPa', 'Fibri'],
  'Chemistry': ['Na', 'K', 'Cl', 'Alb'],
  'Inflammatory': ['CRP']
};

// Map test names to their display names and units
const LAB_TEST_INFO = {
  'Hb': { name: 'Hemoglobin', unit: 'g/L', category: 'CBC' },
  'Hte': { name: 'Hematocrit', unit: '%', category: 'CBC' },
  'VGM': { name: 'MCV', unit: 'fL', category: 'CBC' },
  'GB': { name: 'WBC', unit: '10^9/L', category: 'CBC' },
  'Plt': { name: 'Platelets', unit: '10^9/L', category: 'CBC' },
  'CRP': { name: 'CRP', unit: 'mg/L', category: 'Inflammatory' },
  'TP': { name: 'PT', unit: 's', category: 'Coagulation' },
  'RNI': { name: 'INR', unit: '', category: 'Coagulation' },
  'TTPa': { name: 'aPTT', unit: 's', category: 'Coagulation' },
  'Fibri': { name: 'Fibrinogen', unit: 'g/L', category: 'Coagulation' },
  'Alb': { name: 'Albumin', unit: 'g/L', category: 'Chemistry' },
  'Na': { name: 'Sodium', unit: 'mmol/L', category: 'Chemistry' },
  'K': { name: 'Potassium', unit: 'mmol/L', category: 'Chemistry' },
  'Cl': { name: 'Chloride', unit: 'mmol/L', category: 'Chemistry' }
};

// Add physiological plausibility ranges for each test
const LAB_PLAUSIBLE_RANGES: Record<string, [number, number]> = {
  'Hemoglobin': [50, 200], // g/L - more restrictive range
  'Hematocrit': [0.15, 0.65], // fraction or 15-65%
  'MCV': [65, 115], // fL - normal range is roughly 80-100
  'WBC': [2, 25], // 10^9/L - more restrictive for realistic values
  'Platelets': [50, 800], // 10^9/L - more restrictive 
  'CRP': [0, 200], // mg/L - most clinical values under 200
  'PT': [8, 25], // s - normal is 11-14s, up to 25s for therapeutic anticoagulation
  'INR': [0.8, 5.0], // normal is 0.8-1.2, therapeutic up to 5
  'aPTT': [20, 80], // s - normal is 25-35s, therapeutic up to 80s
  'Fibrinogen': [1.5, 6.0], // g/L - normal range is 1.8-4.5 g/L
  'Albumin': [15, 50], // g/L - normal range is 35-50 g/L
  'Sodium': [125, 155], // mmol/L - more restrictive for safety
  'Potassium': [2.5, 6.5], // mmol/L - normal is 3.5-5.0, allow some abnormal values
  'Chloride': [90, 115], // mmol/L - normal is 98-108
};

function isPlausibleLabValue(testName: string, value: string): boolean {
  const range = LAB_PLAUSIBLE_RANGES[testName];
  if (!range) return true; // If no range, allow
  let num = parseFloat(value);
  if (testName === 'Hematocrit' && num > 1.0) num = num / 100; // Convert % to fraction if needed
  return num >= range[0] && num <= range[1];
}

// Enhanced cross-validation for related lab values
function performCrossValidation(labValues: LabValue[]): LabValue[] {
  console.log('Performing cross-validation on lab values...');
  
  // Group values by timestamp for cross-validation
  const valuesByTimestamp = new Map<string, LabValue[]>();
  labValues.forEach(lab => {
    if (!valuesByTimestamp.has(lab.timestamp || '')) {
      valuesByTimestamp.set(lab.timestamp || '', []);
    }
    valuesByTimestamp.get(lab.timestamp || '')!.push(lab);
  });
  
  const validatedValues: LabValue[] = [];
  
  for (const [timestamp, values] of Array.from(valuesByTimestamp)) {
    const valueMap = new Map<string, number>();
    values.forEach((lab: LabValue) => {
      valueMap.set(lab.testName, parseFloat(lab.value));
    });
    
    // Cross-validation rules based on physiological relationships
    let allValid = true;
    const warnings: string[] = [];
    
    // 1. Hemoglobin and Hematocrit relationship (Hct ≈ Hb/3)
    const hb = valueMap.get('Hemoglobin');
    const hct = valueMap.get('Hematocrit');
    if (hb && hct) {
      const expectedHct = hb / 3 / 100; // Convert to fraction
      const actualHct = hct > 1 ? hct / 100 : hct; // Ensure fraction
      const ratio = Math.abs(actualHct - expectedHct) / expectedHct;
      if (ratio > 0.25) { // Allow 25% deviation
        warnings.push(`Hb/Hct ratio suspicious: Hb=${hb}, Hct=${hct} (expected ~${(expectedHct * 100).toFixed(1)}%)`);
      }
    }
    
    // 2. Electrolyte relationships (Na + K + Cl should be reasonable)
    const na = valueMap.get('Sodium');
    const k = valueMap.get('Potassium');
    const cl = valueMap.get('Chloride');
    if (na && k && cl) {
      const anionGap = na - cl - (k * 24); // Rough anion gap calculation
      if (anionGap < 3 || anionGap > 20) {
        warnings.push(`Suspicious electrolyte pattern: Na=${na}, K=${k}, Cl=${cl} (anion gap=${anionGap.toFixed(1)})`);
      }
    }
    
    // 3. Coagulation relationships (INR should correlate with PT)
    const pt = valueMap.get('PT');
    const inr = valueMap.get('INR');
    if (pt && inr) {
      // Normal PT is ~11-14s, normal INR is ~1.0
      // Rough correlation: INR ≈ (PT/12)^ISI where ISI ≈ 1.0-1.4
      const expectedINR = Math.pow(pt / 12, 1.2);
      const ratio = Math.abs(inr - expectedINR) / expectedINR;
      if (ratio > 0.3) { // Allow 30% deviation
        warnings.push(`PT/INR relationship suspicious: PT=${pt}s, INR=${inr} (expected INR ~${expectedINR.toFixed(2)})`);
      }
    }
    
    // 4. Check for impossible combinations
    const plt = valueMap.get('Platelets');
    const wbc = valueMap.get('WBC');
    if (plt && wbc && plt < wbc) {
      warnings.push(`Impossible: Platelets (${plt}) less than WBC (${wbc})`);
      allValid = false;
    }
    
    // Log warnings but don't necessarily reject values
    if (warnings.length > 0) {
      console.log(`Cross-validation warnings for ${timestamp}:`, warnings);
    }
    
    // Only add values if they pass basic validation (we keep warnings as informational)
    if (allValid) {
      validatedValues.push(...values);
    } else {
      console.log(`Rejecting values for ${timestamp} due to cross-validation failures`);
    }
  }
  
  console.log(`Cross-validation complete: ${validatedValues.length}/${labValues.length} values passed`);
  return validatedValues;
}

// Structured parsing fallback for lab values when Gemini fails
function extractLabValuesWithStructuredParsing(text: string): LabValue[] {
  console.log('Starting structured parsing fallback for lab values');
  console.log('OCR Text to process:', text.substring(0, 500) + (text.length > 500 ? '...' : ''));
  const labValues: LabValue[] = [];
  
  // Split text into lines and clean
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
  console.log(`Processing ${lines.length} lines for lab extraction`);
  console.log('First 10 lines:', lines.slice(0, 10));
  
  // Try to find header row with test names
  let headerLine: string | null = null;
  let headerIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Look for lines containing multiple lab test abbreviations
    const testCount = Object.keys(LAB_TEST_INFO).filter(test => 
      line.toLowerCase().includes(test.toLowerCase())
    ).length;
    
    if (testCount >= 3) { // Need at least 3 test names to consider it a header
      headerLine = line;
      headerIndex = i;
      console.log(`Found potential header at line ${i}: "${line}"`);
      break;
    }
  }
  
  if (!headerLine) {
    console.log('No header line found, trying line-by-line extraction');
    return extractLabValuesLineByLine(lines);
  }
  
  // Parse header to get test names and their positions
  const testPositions = new Map<string, number>();
  Object.keys(LAB_TEST_INFO).forEach(abbrev => {
    const index = headerLine!.toLowerCase().indexOf(abbrev.toLowerCase());
    if (index !== -1) {
      testPositions.set(abbrev, index);
      console.log(`Found test ${abbrev} at position ${index}`);
    }
  });
  
  if (testPositions.size === 0) {
    console.log('No test positions found in header, trying line-by-line extraction');
    return extractLabValuesLineByLine(lines);
  }
  
  // Sort tests by position for easier parsing
  const sortedTests = Array.from(testPositions.entries()).sort((a, b) => a[1] - b[1]);
  console.log('Sorted test positions:', sortedTests);
  
  // Process data rows (lines after header)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip empty lines or lines that look like headers
    if (!line || line.length < 5) continue;
    
    // Look for timestamp pattern (YYMMDD, DD/MM/YY, etc.)
    const timestampMatch = line.match(/\b(\d{6}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/);
    const timestamp = timestampMatch ? timestampMatch[1] : '';
    
    console.log(`Processing data line ${i}: "${line}"`);
    
    // Extract values based on test positions
    const values = extractValuesFromLine(line, sortedTests);
    
    values.forEach(({ testAbbrev, value }) => {
      const testInfo = LAB_TEST_INFO[testAbbrev as keyof typeof LAB_TEST_INFO];
      if (testInfo && value) {
        const labValue: LabValue = {
          testName: testInfo.name,
          value: value,
          unit: testInfo.unit,
          category: testInfo.category,
          timestamp: timestamp
        };
        
        // Validate plausibility
        if (isPlausibleLabValue(testInfo.name, value)) {
          labValues.push(labValue);
          console.log(`✓ Added lab value: ${testInfo.name} = ${value} ${testInfo.unit}`);
        } else {
          console.log(`✗ Rejected implausible value: ${testInfo.name} = ${value}`);
        }
      }
    });
  }
  
  console.log(`Structured parsing extracted ${labValues.length} lab values`);
  return labValues;
}

// Helper function to extract values from a line based on test positions
function extractValuesFromLine(line: string, testPositions: Array<[string, number]>): Array<{testAbbrev: string, value: string}> {
  const results: Array<{testAbbrev: string, value: string}> = [];
  
  // Find all numeric values in the line
  const valueMatches = Array.from(line.matchAll(/\b(\d+(?:[,\.]\d+)?)\b/g));
  
  if (valueMatches.length === 0) {
    return results;
  }
  
  // Try to match values to tests based on position
  for (let i = 0; i < testPositions.length; i++) {
    const [testAbbrev, ] = testPositions[i];
    
    // For simplicity, assign values in order they appear
    if (i < valueMatches.length) {
      let value = valueMatches[i][1];
      // Convert comma decimal to period
      value = value.replace(',', '.');
      
      results.push({ testAbbrev, value });
    }
  }
  
  return results;
}

// Line-by-line extraction when no clear table structure is found
function extractLabValuesLineByLine(lines: string[]): LabValue[] {
  console.log('Attempting line-by-line lab extraction');
  const labValues: LabValue[] = [];
  
  for (const line of lines) {
    // Look for patterns like "Hb: 120" or "Sodium 140"
    for (const [abbrev, testInfo] of Object.entries(LAB_TEST_INFO)) {
      // Create regex patterns for this test
      const patterns = [
        new RegExp(`\\b${abbrev}\\s*[:\\-]?\\s*(\\d+(?:[,\\.]\\d+)?)\\b`, 'i'),
        new RegExp(`\\b${testInfo.name}\\s*[:\\-]?\\s*(\\d+(?:[,\\.]\\d+)?)\\b`, 'i')
      ];
      
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          let value = match[1].replace(',', '.');
          
          if (isPlausibleLabValue(testInfo.name, value)) {
            labValues.push({
              testName: testInfo.name,
              value: value,
              unit: testInfo.unit,
              category: testInfo.category,
              timestamp: ''
            });
            console.log(`✓ Found lab value: ${testInfo.name} = ${value} ${testInfo.unit}`);
            break; // Found match for this test, move to next test
          }
        }
      }
    }
  }
  
  console.log(`Line-by-line extraction found ${labValues.length} lab values`);
  return labValues;
}

export async function extractLabValuesFromImage(base64Image: string, mediaType: string = "image/jpeg"): Promise<LabValue[]> {
  const extractionId = `lab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`=== LAB VALUE EXTRACTION START [${extractionId}] ===`);
    
    // Validate input
    const validationResult = validateExtractionInput(base64Image, mediaType);
    if (!validationResult.isValid) {
      throw new Error(`Lab extraction input validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Ensure Vision API is ready
    if (!vision) {
      console.log('🔧 Vision API not ready for lab extraction, attempting initialization...');
      await initializeVisionClient();
      
      if (!vision) {
        const errorMsg = visionClientError || 'Google Vision API client not initialized';
        console.error('❌ Vision API client error:', errorMsg);
        throw new Error(`Vision API unavailable: ${errorMsg}`);
      }
    }
    
    const imageBuffer = Buffer.from(base64Image, 'base64');
    console.log(`📤 Processing lab image [${extractionId}]: ${imageBuffer.length} bytes`);
    
    const [result] = await vision.textDetection({ 
      image: { content: imageBuffer },
      imageContext: {
        languageHints: ['en', 'fr'],
        textDetectionParams: {
          enableTextDetectionConfidenceScore: true
        }
      }
    });
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      console.log(`❌ No text detected in lab image [${extractionId}]`);
      return [];
    }
    
    const fullText = detections[0].description || '';
    console.log(`✅ Lab OCR text extracted [${extractionId}]: ${fullText.length} characters`);
    
    if (DEBUG_MODE) {
      console.log('Lab OCR preview:', fullText.substring(0, 200) + (fullText.length > 200 ? '...' : ''));
    }
    
    // Try Gemini first, then fallback to structured parsing if needed
    const geminiResults = await extractLabValuesFromTextWithGemini(fullText);
    console.log(`Gemini extraction completed with ${geminiResults.length} results.`);
    
    if (geminiResults.length > 0) {
      return geminiResults;
    }
    
    // Fallback to structured parsing when Gemini returns empty results
    console.log('Gemini returned no results, falling back to structured parsing...');
    return extractLabValuesWithStructuredParsing(fullText);
  } catch (error: unknown) {
    console.error(`❌ LAB EXTRACTION ERROR [${extractionId}]:`, error);
    console.error('Lab extraction context:', {
      extractionId,
      timestamp: new Date().toISOString(),
      imageSize: base64Image?.length || 0,
      mediaType,
      visionStatus: vision ? 'ready' : 'not ready',
      errorMessage: error instanceof Error ? (error as Error).message : String(error)
    });
    
    throw new Error(`Failed to extract lab values from image [${extractionId}]: ${(error as Error).message}`);
  }
}

// Text preprocessing function to clean and normalize OCR output
function preprocessOCRText(rawText: string): string {
  if (!rawText) return '';
  
  let cleanedText = rawText;
  
  // Fix common OCR errors and character substitutions
  const ocrCorrections: Array<[RegExp, string]> = [
    // Common OCR character substitutions in medication names only
    [/\b([A-Za-z]+)0([A-Za-z]+)\b/g, '$1O$2'], // Zero to letter O in medication names
    [/\b([A-Za-z]+)1([A-Za-z]+)\b/g, '$1I$2'], // One to letter I in medication names
    
    // Fix spacing issues around common medication terms
    [/(\w)(mg|mcg|g|ml|tabs|tablet|capsule|cap)/gi, '$1 $2'],
    [/(mg|mcg|g|ml|tabs|tablet|capsule|cap)(\w)/gi, '$1 $2'],
    
    // Normalize dosage terminology
    [/\bmcg\b/gi, 'mcg'],
    [/\bmg\b/gi, 'mg'],
    [/\btabs?\b/gi, 'tablet'],
    [/\bcaps?\b/gi, 'capsule'],
    
    // Fix common medication name OCR errors
    [/\bMetf0rmin\b/gi, 'Metformin'],
    [/\bLip1tor\b/gi, 'Lipitor'],
    [/\bPrin1vil\b/gi, 'Prinivil'],
    [/\bTylen0l\b/gi, 'Tylenol'],
    [/\bAdv1l\b/gi, 'Advil'],
    
    // Clean up extra whitespace and line breaks
    [/\s+/g, ' '],
    [/\n+/g, '\n'],
  ];
  
  ocrCorrections.forEach(([pattern, replacement]) => {
    cleanedText = cleanedText.replace(pattern, replacement as string);
  });
  
  // Handle fragmented medication names across lines
  const lines = cleanedText.split('\n');
  const reconstructedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
    
    // If current line ends with incomplete medication info and next line starts with related info
    if (currentLine && nextLine) {
      // Check if we should merge lines (common medication patterns)
      const shouldMerge = 
        // Line ends with medication name, next starts with dosage
        (/\b[A-Za-z]+$/.test(currentLine) && /^\d+\s*(mg|mcg|g)\b/i.test(nextLine)) ||
        // Line ends with dosage, next starts with frequency  
        (/\d+\s*(mg|mcg|g)$/.test(currentLine) && /^(once|twice|three|bid|tid|qid|daily)/i.test(nextLine)) ||
        // Line ends with incomplete word, next completes it
        (/[a-z]$/.test(currentLine) && /^[a-z]/i.test(nextLine));
      
      if (shouldMerge) {
        reconstructedLines.push(`${currentLine} ${nextLine}`);
        i++; // Skip next line since we merged it
        continue;
      }
    }
    
    reconstructedLines.push(currentLine);
  }
  
  const finalText = reconstructedLines.join('\n');
  
  console.log('OCR text preprocessing:');
  console.log('Original length:', rawText.length);
  console.log('Cleaned length:', finalText.length);
  console.log('Cleaned text sample:', finalText.substring(0, 200));
  
  return finalText;
}

// Medication extraction using Google Vision OCR
export async function extractMedicationsFromImage(base64Image: string, mediaType: string = "image/jpeg"): Promise<ExtractedMedication[]> {
  const extractionId = `extract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    console.log(`=== MEDICATION EXTRACTION START [${extractionId}] ===`);
    console.log('📊 Extraction Parameters:');
    console.log(`  - Image size: ${base64Image.length} bytes`);
    console.log(`  - Media type: ${mediaType}`);
    console.log(`  - Timestamp: ${new Date().toISOString()}`);
    
    // Comprehensive input validation
    const validationResult = validateExtractionInput(base64Image, mediaType);
    if (!validationResult.isValid) {
      throw new Error(`Input validation failed: ${validationResult.errors.join(', ')}`);
    }
    
    // Ensure Vision API is initialized or provide fallback
    if (!vision) {
      console.log('🔧 Vision API not ready, attempting re-initialization...');
      await initializeVisionClient();
      
      if (!vision) {
        const errorMsg = visionClientError || 'Google Vision API client not initialized after retry';
        console.error('❌ Vision API unavailable:', errorMsg);
        
        // Check if we should use fallback
        if (DEBUG_MODE || process.env.ALLOW_OCR_FALLBACK === 'true') {
          console.log('🔄 Using fallback OCR simulation due to Vision API unavailability');
          const simulatedText = simulateOCRFromImageData(base64Image, mediaType);
          const fallbackResult = await extractMedicationsWithMetrics(simulatedText, extractionId);
          console.log(`✅ Fallback extraction completed [${extractionId}]: ${fallbackResult.medications.length} medications`);
          return fallbackResult.medications;
        }
        
        throw new Error(`Vision API unavailable and no fallback enabled: ${errorMsg}`);
      }
    }
    
    // Convert base64 to buffer with validation
    let imageBuffer: Buffer;
    try {
      imageBuffer = Buffer.from(base64Image, 'base64');
      console.log(`✅ Image buffer created: ${imageBuffer.length} bytes`);
      
      // Additional image validation
      if (imageBuffer.length < 100) {
        console.warn('⚠️ Image buffer suspiciously small, may be corrupted');
      }
      
      if (imageBuffer.length > 10 * 1024 * 1024) { // 10MB
        console.warn('⚠️ Large image detected, processing may be slow');
      }
    } catch (bufferError: unknown) {
      throw new Error(`Failed to decode base64 image: ${(bufferError as Error).message}`);
    }

    // Perform text detection with enhanced settings and retry logic
    console.log('📤 Sending image to Google Vision API...');
    let result: any;
    let visionAttempts = 0;
    const maxVisionAttempts = 3;
    
    while (visionAttempts < maxVisionAttempts) {
      try {
        visionAttempts++;
        console.log(`🔍 Vision API attempt ${visionAttempts}/${maxVisionAttempts}`);
        
        const startTime = Date.now();
        [result] = await vision.textDetection({
          image: { content: imageBuffer },
          imageContext: {
            languageHints: ['en', 'fr'], // Support English and French
            textDetectionParams: {
              enableTextDetectionConfidenceScore: true
            }
          }
        });
        
        const visionTime = Date.now() - startTime;
        console.log(`✅ Vision API response received in ${visionTime}ms`);
        break;
        
      } catch (visionError: unknown) {
        console.error(`❌ Vision API attempt ${visionAttempts} failed:`, visionError);
        
        if (visionAttempts >= maxVisionAttempts) {
          throw new Error(`Vision API failed after ${maxVisionAttempts} attempts: ${(visionError as Error).message}`);
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * visionAttempts));
      }
    }

    const detections = result.textAnnotations;
    console.log(`📊 Vision API response [${extractionId}]:`, {
      detectionsCount: detections?.length || 0,
      fullTextDetected: detections && detections.length > 0,
      hasFullText: detections && detections[0] && detections[0].description
    });
    
    if (!detections || detections.length === 0) {
      console.log(`❌ NO TEXT DETECTED [${extractionId}] - Diagnostic Information:`);
      console.log('🔍 Possible issues:');
      console.log('  - Image quality too low for OCR');
      console.log('  - Text too small, blurry, or low contrast');
      console.log('  - Image format not optimally supported');
      console.log('  - No actual text content in the image');
      console.log('  - Image might be purely graphical/decorative');
      
      // Log image characteristics for debugging
      const imageInfo = {
        size: imageBuffer.length,
        mediaType,
        base64Preview: base64Image.substring(0, 50) + '...'
      };
      console.log('📊 Image characteristics:', imageInfo);
      
      // Try fallback if enabled
      if (DEBUG_MODE || process.env.ALLOW_OCR_FALLBACK === 'true') {
        console.log('🔄 Attempting fallback OCR simulation...');
        const simulatedText = simulateOCRFromImageData(base64Image, mediaType);
        if (simulatedText.trim().length > 0) {
          const fallbackResult = await extractMedicationsWithMetrics(simulatedText, extractionId);
          console.log(`✅ Fallback provided ${fallbackResult.medications.length} medications`);
          return fallbackResult.medications;
        }
      }
      
      return [];
    }

    // Get the full text and preprocess it safely
    const rawText = detections[0].description || '';
    console.log(`✅ Raw OCR text extracted [${extractionId}]:`, {
      length: rawText.length,
      lines: rawText.split('\n').length,
      words: rawText.split(/\s+/).filter(Boolean).length
    });
    
    if (DEBUG_MODE) {
      console.log('Raw OCR preview:', rawText.substring(0, 300) + (rawText.length > 300 ? '...' : ''));
    }
    
    const preprocessResult = preprocessOCRTextSafe(rawText);
    const cleanedText = preprocessResult.text;
    
    console.log(`✅ Text preprocessed [${extractionId}]:`, {
      originalLength: preprocessResult.metrics.originalLength,
      processedLength: preprocessResult.metrics.processedLength,
      corrections: preprocessResult.metrics.corrections
    });
    
    if (DEBUG_MODE && cleanedText !== rawText) {
      console.log('Cleaned text preview:', cleanedText.substring(0, 300) + (cleanedText.length > 300 ? '...' : ''));
    }

    // Analyze text content for medication indicators
    const medicationIndicators = [
      { name: 'Dosage Units', pattern: /\b\d+\s*(mg|mcg|g|ml|tablet|cap|capsule)\b/gi },
      { name: 'Frequency Terms', pattern: /\b(daily|twice|once|bid|tid|qid|prn)\b/gi },
      { name: 'Medical Terms', pattern: /\b(medication|medicine|drug|prescription|rx)\b/gi },
      { name: 'Drug Suffixes', pattern: /\b[A-Za-z]{4,}(ine|ril|tin|zole|ide|amin|mycin|cillin)\b/gi }
    ];
    
    const indicatorResults = medicationIndicators.map(indicator => {
      const matches = cleanedText.match(indicator.pattern) || [];
      return {
        name: indicator.name,
        count: matches.length,
        matches: matches.slice(0, 3) // First 3 matches for debugging
      };
    });
    
    const hasIndicators = indicatorResults.some(result => result.count > 0);
    const totalIndicators = indicatorResults.reduce((sum, result) => sum + result.count, 0);
    
    console.log(`🔍 Content analysis [${extractionId}]:`, {
      hasMedicationIndicators: hasIndicators,
      totalIndicators,
      breakdown: indicatorResults.filter(r => r.count > 0)
    });
    
    if (!hasIndicators) {
      console.log(`⚠️ WARNING [${extractionId}]: No obvious medication indicators found`);
      console.log('This might not be a medication document, but processing anyway...');
    }

    // Extract medications with comprehensive metrics
    const extractionResult = await extractMedicationsWithMetrics(cleanedText, extractionId);
    const medications = extractionResult.medications;
    const extractionMetrics = extractionResult.metrics;
    
    // Final results analysis
    if (medications.length === 0) {
      console.log(`❌ NO MEDICATIONS EXTRACTED [${extractionId}] - Detailed Analysis:`);
      console.log('🔍 Investigation checklist:');
      console.log('  1. Gemini API connectivity and quota');
      console.log('  2. OCR text quality and medical relevance');
      console.log('  3. Regex fallback trigger conditions');
      console.log('  4. Validation filter strictness');
      console.log('  5. Language detection accuracy');
      
      console.log('📊 Extraction metrics:', extractionMetrics);
    } else {
      console.log(`✅ SUCCESS [${extractionId}]: ${medications.length} medications extracted`);
      
      if (DEBUG_MODE) {
        console.log('Extracted medications:', medications.map(m => ({
          name: m.name,
          dosage: m.dosage || 'N/A',
          frequency: m.frequency || 'N/A'
        })));
      }
      
      console.log('📊 Final metrics:', {
        ...extractionMetrics,
        qualityScore: calculateQualityScore(medications),
        completenessScore: calculateCompletenessScore(medications)
      });
    }
    
    console.log(`=== MEDICATION EXTRACTION END [${extractionId}] ===`);
    return medications;
  } catch (error: unknown) {
    console.error(`❌ CRITICAL ERROR [${extractionId}]:`, error);
    console.error('Error context:', {
      extractionId,
      timestamp: new Date().toISOString(),
      imageSize: base64Image?.length || 0,
      mediaType,
      visionClientStatus: vision ? 'initialized' : 'not initialized',
      visionError: visionClientError,
      errorDetails: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? (error as Error).message : String(error),
        stack: error instanceof Error ? (error as Error).stack?.split('\n').slice(0, 5).join('\n') : undefined
      }
    });
    
    // Attempt graceful degradation
    if ((error as Error).message.includes('Vision API') && !(error as Error).message.includes('quota')) {
      console.log('🔄 Attempting Vision API re-initialization...');
      try {
        await initializeVisionClient();
        console.log('✅ Vision API re-initialized, but not retrying extraction to avoid loops');
      } catch (reinitError: unknown) {
        console.error('❌ Vision API re-initialization also failed:', reinitError);
      }
    }
    
    throw new Error(`Failed to extract medications from image [${extractionId}]: ${(error as Error).message}`);
  }
}

// Quality scoring functions
function calculateQualityScore(medications: ExtractedMedication[]): number {
  if (medications.length === 0) return 0;
  
  let totalScore = 0;
  for (const med of medications) {
    let score = 0;
    
    // Name quality (0-40 points)
    if (med.name && med.name.length >= 2) score += 20;
    if (med.name && med.name.length >= 4) score += 10;
    if (med.name && /[A-Z]/.test(med.name)) score += 10; // Has capital letters
    
    // Dosage quality (0-30 points)
    if (med.dosage && med.dosage.trim().length > 0) score += 15;
    if (med.dosage && /\d+/.test(med.dosage)) score += 10; // Has numbers
    if (med.dosage && /(mg|mcg|g|ml)/i.test(med.dosage)) score += 5; // Has units
    
    // Frequency quality (0-30 points)
    if (med.frequency && med.frequency.trim().length > 0) score += 15;
    if (med.frequency && /(DIE|BID|TID|QID|PRN)/i.test(med.frequency)) score += 15; // Standard notation
    
    totalScore += score;
  }
  
  return Math.round((totalScore / (medications.length * 100)) * 100); // Convert to percentage
}

function calculateCompletenessScore(medications: ExtractedMedication[]): number {
  if (medications.length === 0) return 0;
  
  const withName = medications.filter(m => m.name && m.name.trim().length > 0).length;
  const withDosage = medications.filter(m => m.dosage && m.dosage.trim().length > 0).length;
  const withFrequency = medications.filter(m => m.frequency && m.frequency.trim().length > 0).length;
  
  const nameScore = (withName / medications.length) * 40;
  const dosageScore = (withDosage / medications.length) * 30;
  const frequencyScore = (withFrequency / medications.length) * 30;
  
  return Math.round(nameScore + dosageScore + frequencyScore);
}