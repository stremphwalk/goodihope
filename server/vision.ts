import { ImageAnnotatorClient } from '@google-cloud/vision';
import { LabValue } from '../client/src/lib/labUtils';
import { ExtractedMedication } from './types';
import { extractMedicationsFromTextWithGemini } from './gemini';

// Initialize the Vision API client
let vision: ImageAnnotatorClient;

try {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Try to parse as JSON first (if it's a JSON string)
    try {
      const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
      vision = new ImageAnnotatorClient({
        credentials: credentials,
        projectId: credentials.project_id
      });
    } catch {
      // If parsing fails, assume it's a file path and let GCP handle it
      vision = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
      });
    }
  } else {
    // Use default credentials (for production environments with service account)
    vision = new ImageAnnotatorClient();
  }
} catch (error) {
  console.error('Error initializing Vision API client:', error);
  // Create a fallback client that will throw errors when used
  vision = new ImageAnnotatorClient();
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
  'Hemoglobin': [30, 250], // g/L
  'Hematocrit': [0.15, 0.65], // fraction or 15-65%
  'MCV': [60, 130], // fL
  'WBC': [1, 50], // 10^9/L
  'Platelets': [10, 1000], // 10^9/L
  'CRP': [0, 500], // mg/L
  'PT': [5, 60], // s
  'INR': [0.5, 10],
  'aPTT': [10, 200], // s
  'Fibrinogen': [0.5, 10], // g/L
  'Albumin': [10, 60], // g/L
  'Sodium': [100, 170], // mmol/L
  'Potassium': [2, 8], // mmol/L
  'Chloride': [60, 130], // mmol/L
};

function isPlausibleLabValue(testName: string, value: string): boolean {
  const range = LAB_PLAUSIBLE_RANGES[testName];
  if (!range) return true; // If no range, allow
  let num = parseFloat(value);
  if (testName === 'Hematocrit' && num > 1.0) num = num / 100; // Convert % to fraction if needed
  return num >= range[0] && num <= range[1];
}

export async function extractLabValuesFromImage(base64Image: string, mediaType: string = "image/jpeg"): Promise<LabValue[]> {
  try {
    console.log('Starting lab value extraction...');
    const imageBuffer = Buffer.from(base64Image, 'base64');
    const [result] = await vision.textDetection({ image: { content: imageBuffer } });
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      console.log('No text detected in image');
      return [];
    }
    const fullText = detections[0].description || '';
    const lines = fullText.split('\n').map(l => l.trim()).filter(Boolean);
    console.log('OCR lines:', lines);

    // 1. Find the header line
    let headerIdx = lines.findIndex(line => line.toLowerCase().includes('date/heure'));
    console.log('Header index:', headerIdx);
    if (headerIdx === -1) {
      console.log('No header line found. Lines:', lines);
      return [];
    }

    // 2. Collect test names vertically (until a line that looks like a date)
    let testNames: string[] = [];
    let i = headerIdx + 1;
    const dateRegex = /^\d{6}(\s+\d{4})?$/;
    while (i < lines.length && !dateRegex.test(lines[i])) {
      const candidate = lines[i].replace(/[^A-Za-z]/g, '');
      if (LAB_TEST_INFO[candidate as keyof typeof LAB_TEST_INFO]) {
        testNames.push(candidate);
      }
      i++;
    }
    console.log('Detected test names:', testNames);
    if (testNames.length === 0) {
      console.log('No test names found. Lines after header:', lines.slice(headerIdx + 1, headerIdx + 10));
      return [];
    }

    // 3. For each date, collect the next N lines as values for each test
    const labValues: LabValue[] = [];
    while (i < lines.length) {
      if (!dateRegex.test(lines[i])) { i++; continue; }
      const date = lines[i].split(' ')[0];
      let values: string[] = [];
      let j = 1;
      while (j <= testNames.length && (i + j) < lines.length && !dateRegex.test(lines[i + j])) {
        values.push(lines[i + j]);
        j++;
      }
      // Map values to test names
      for (let k = 0; k < testNames.length && k < values.length; k++) {
        const testName = testNames[k];
        const valueRaw = values[k].replace(',', '.').replace('!', '').replace('>', '');
        if (!isNaN(parseFloat(valueRaw))) {
          const info = LAB_TEST_INFO[testName as keyof typeof LAB_TEST_INFO];
          if (info && isPlausibleLabValue(info.name, valueRaw)) {
            labValues.push({
              testName: info.name,
              value: valueRaw,
              unit: info.unit,
              category: info.category,
              timestamp: date
            });
          } else {
            console.log(`Filtered out implausible value for ${info?.name}: ${valueRaw}`);
          }
        }
      }
      i += j;
    }
    console.log(`Extracted ${labValues.length} lab values:`, JSON.stringify(labValues, null, 2));
    return labValues;
  } catch (error) {
    console.error('Error processing image with Vision API:', error);
    throw new Error('Failed to extract lab values from image');
  }
}

// Medication extraction using Google Vision OCR
export async function extractMedicationsFromImage(base64Image: string, mediaType: string = "image/jpeg"): Promise<ExtractedMedication[]> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Perform text detection
    const [result] = await vision.textDetection({
      image: { content: imageBuffer }
    });

    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      console.log('No text detected in image');
      return [];
    }

    // Get the full text
    const fullText = detections[0].description || '';
    console.log('Detected text:', fullText);

    // Use Gemini to extract medications from the OCR text
    const medications = await extractMedicationsFromTextWithGemini(fullText);
    console.log(`Gemini extracted ${medications.length} medications:`, medications);
    return medications;
  } catch (error) {
    console.error('Error processing image with Vision API and Gemini:', error);
    throw new Error('Failed to extract medications from image');
  }
} 