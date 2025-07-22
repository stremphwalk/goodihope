import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface MedicationData {
  id: string;
  brandName: string;
  genericName: string;
  strength?: string;
  dosageForm?: string;
  route?: string;
}

interface DosageInfo {
  form: string;
  strength: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parseDosageInfo(dosageStr: string): DosageInfo | null {
  if (!dosageStr || dosageStr.trim() === '') return null;
  
  const cleaned = dosageStr.replace(/\(SA\)/g, '').trim();
  const match = cleaned.match(/^(\w+)\s+(.+)$/);
  
  if (match) {
    const [, form, strength] = match;
    return { form, strength };
  }
  
  return null;
}

function expandDosageForm(abbrev: string): string {
  const forms: Record<string, string> = {
    'Tab': 'Tablet',
    'Cap': 'Capsule',
    'ECT': 'Enteric Coated Tablet',
    'SRC': 'Sustained Release Capsule',
    'SRT': 'Sustained Release Tablet',
    'ERT': 'Extended Release Tablet',
    'CDC': 'Controlled Delivery Capsule',
    'CDR': 'Controlled Delivery Release',
    'Liq': 'Liquid',
    'Sus': 'Suspension',
    'Syr': 'Syrup',
    'Dps': 'Drops',
    'Pws': 'Powder',
    'Gran': 'Granules',
    'ODT': 'Orally Disintegrating Tablet',
    'Kit': 'Kit',
    'Evt': 'Effervescent Tablet',
    'ECC': 'Enteric Coated Capsule',
    'Aem': 'Aerosol',
    'Slt': 'Sublingual Tablet',
    'Crm': 'Cream',
    'Oin': 'Ointment'
  };
  
  return forms[abbrev] || abbrev;
}

function getEmbeddedMedicationData(): MedicationData[] {
  // Production-ready medication data - common medications for medical documentation
  return [
    { id: 'acetaminophen_tylenol_500mg', genericName: 'Acetaminophen', brandName: 'Tylenol', strength: '500mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'ibuprofen_advil_200mg', genericName: 'Ibuprofen', brandName: 'Advil', strength: '200mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'aspirin_bayer_81mg', genericName: 'Aspirin', brandName: 'Bayer', strength: '81mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'lisinopril_prinivil_10mg', genericName: 'Lisinopril', brandName: 'Prinivil', strength: '10mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'metformin_glucophage_500mg', genericName: 'Metformin', brandName: 'Glucophage', strength: '500mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'amlodipine_norvasc_5mg', genericName: 'Amlodipine', brandName: 'Norvasc', strength: '5mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'simvastatin_zocor_20mg', genericName: 'Simvastatin', brandName: 'Zocor', strength: '20mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'omeprazole_prilosec_20mg', genericName: 'Omeprazole', brandName: 'Prilosec', strength: '20mg', dosageForm: 'Capsule', route: 'Oral' },
    { id: 'hydrochlorothiazide_microzide_25mg', genericName: 'Hydrochlorothiazide', brandName: 'Microzide', strength: '25mg', dosageForm: 'Tablet', route: 'Oral' },
    { id: 'albuterol_proair_90mcg', genericName: 'Albuterol', brandName: 'ProAir', strength: '90mcg', dosageForm: 'Inhaler', route: 'Inhalation' }
  ];
}

function createMedicationFromCSV(): MedicationData[] {
  try {
    // In production, use embedded medication data instead of file system access
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode: Using embedded medication data');
      return getEmbeddedMedicationData();
    }
    
    const csvPath = path.join(__dirname, '..', 'attached_assets', 'Pasted-Generic-Name-Brand-Name-s-Oral-Posology-1-Oral-Posology-2-Oral-Posology-3-SODIUM-BICARBONATE-Jam-1748821971961.txt');
    
    // Check if file exists
    if (!fs.existsSync(csvPath)) {
      console.warn(`Medication file not found at: ${csvPath}`);
      console.warn('Returning embedded medication data instead');
      return getEmbeddedMedicationData();
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');
    
    const medications: MedicationData[] = [];
    
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const columns = parseCSVLine(line);
      if (columns.length < 3) continue;
      
      const [genericName, brandNames, posology1, posology2, posology3] = columns;
      
      if (!genericName || !brandNames) continue;
      
      // Split brand names by comma
      const brands = brandNames.split(',').map(b => b.trim());
      const posologies = [posology1, posology2, posology3].filter(p => p && p.trim());
      
      // Create medications for each combination of brand and dosage
      brands.forEach((brand, brandIndex) => {
        posologies.forEach((posology, posIndex) => {
          const dosageInfo = parseDosageInfo(posology);
          if (!dosageInfo) return;
          
          const medication: MedicationData = {
            id: `${genericName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${brand.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${posIndex}`,
            genericName: genericName,
            brandName: brand,
            strength: dosageInfo.strength,
            dosageForm: expandDosageForm(dosageInfo.form),
            route: 'Oral'
          };
          
          medications.push(medication);
        });
      });
    }
    
    console.log(`Loaded ${medications.length} medications from CSV`);
    return medications;
  } catch (error) {
    console.error('Error loading medication data:', error);
    console.warn('Returning empty medication list');
    return [];
  }
}

// Simple fuzzy matching function for better search results
function calculateFuzzyScore(query: string, target: string): number {
  const queryLower = query.toLowerCase();
  const targetLower = target.toLowerCase();
  
  // Exact match gets highest score
  if (targetLower === queryLower) return 100;
  
  // Starts with query gets high score
  if (targetLower.startsWith(queryLower)) return 90;
  
  // Contains query gets medium score
  if (targetLower.includes(queryLower)) return 70;
  
  // Word boundary matching (e.g., "met" matches "Metformin")
  const words = targetLower.split(/\s+/);
  for (const word of words) {
    if (word.startsWith(queryLower)) return 80;
  }
  
  // Fuzzy character matching for typos
  let score = 0;
  let queryIndex = 0;
  
  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      score += 1;
      queryIndex++;
    }
  }
  
  if (queryIndex === queryLower.length) {
    return Math.round((score / queryLower.length) * 60);
  }
  
  return 0;
}

export function searchMedications(query: string, limit: number = 10): MedicationData[] {
  const medications = medicationData;
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm || searchTerm.length < 1) {
    return [];
  }
  
  // Score all medications based on fuzzy matching
  const scoredMatches = medications.map(med => {
    const genericScore = calculateFuzzyScore(searchTerm, med.genericName);
    const brandScore = calculateFuzzyScore(searchTerm, med.brandName);
    const maxScore = Math.max(genericScore, brandScore);
    
    return {
      medication: med,
      score: maxScore,
      matchType: genericScore >= brandScore ? 'generic' : 'brand'
    };
  }).filter(item => item.score > 0);
  
  // Sort by score (highest first)
  scoredMatches.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // If scores are equal, prefer shorter names (more specific matches)
    const aLength = a.matchType === 'generic' ? a.medication.genericName.length : a.medication.brandName.length;
    const bLength = b.matchType === 'generic' ? b.medication.genericName.length : b.medication.brandName.length;
    return aLength - bLength;
  });
  
  // Consolidate medications by generic name, preserving the best match
  const consolidated = new Map<string, {medication: MedicationData, score: number}>();
  
  scoredMatches.forEach(item => {
    const key = item.medication.genericName.toLowerCase();
    
    if (!consolidated.has(key) || consolidated.get(key)!.score < item.score) {
      // Find the most common brand name for this generic
      const genericMatches = scoredMatches.filter(m => 
        m.medication.genericName.toLowerCase() === key
      );
      
      const brandCounts = new Map<string, number>();
      genericMatches.forEach(m => {
        const brandName = m.medication.brandName.split(',')[0].trim();
        brandCounts.set(brandName, (brandCounts.get(brandName) || 0) + 1);
      });
      
      // Use the most common brand name, but prefer exact matches
      let bestBrand = item.medication.brandName;
      if (brandCounts.size > 1) {
        const sortedBrands = Array.from(brandCounts.entries())
          .sort((a, b) => {
            // Prefer brands that match the search term better
            const scoreA = calculateFuzzyScore(searchTerm, a[0]);
            const scoreB = calculateFuzzyScore(searchTerm, b[0]);
            if (scoreA !== scoreB) return scoreB - scoreA;
            return b[1] - a[1]; // Fall back to frequency
          });
        bestBrand = sortedBrands[0][0];
      }
      
      consolidated.set(key, {
        medication: {
          ...item.medication,
          id: `${item.medication.genericName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          brandName: bestBrand,
          strength: '', // We'll show all strengths in dosage selection
          dosageForm: item.medication.dosageForm || 'tablet'
        },
        score: item.score
      });
    }
  });
  
  // Return sorted by score, limited by the requested limit
  return Array.from(consolidated.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.medication);
}

export function getCommonDosages(medicationName: string): string[] {
  const medications = medicationData;
  const searchTerm = medicationName.toLowerCase();
  
  // Search by both generic name and brand name to get all dosages
  const matches = medications.filter(med => 
    med.genericName.toLowerCase().includes(searchTerm) ||
    med.brandName.toLowerCase().includes(searchTerm)
  );
  
  const strengthSet = new Set<string>();
  matches.forEach(med => {
    if (med.strength) {
      strengthSet.add(med.strength);
    }
  });
  
  const dosages = Array.from(strengthSet);
  
  return dosages.sort((a, b) => {
    const numA = parseFloat(a.replace(/[^\d.]/g, ''));
    const numB = parseFloat(b.replace(/[^\d.]/g, ''));
    return numA - numB;
  });
}

export const medicationData = createMedicationFromCSV();