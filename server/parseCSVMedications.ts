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

export function searchMedications(query: string, limit: number = 10): MedicationData[] {
  const medications = createMedicationFromCSV();
  const searchTerm = query.toLowerCase();
  
  const matches = medications.filter(med => 
    med.genericName.toLowerCase().includes(searchTerm) ||
    med.brandName.toLowerCase().includes(searchTerm)
  );
  
  // Consolidate medications by generic name only
  const consolidated = new Map<string, MedicationData>();
  
  matches.forEach(med => {
    const key = med.genericName;
    
    if (!consolidated.has(key)) {
      // Find the most common brand name for this generic
      const genericMatches = matches.filter(m => m.genericName === med.genericName);
      const brandCounts = new Map<string, number>();
      
      genericMatches.forEach(m => {
        const brandName = m.brandName.split(',')[0].trim();
        brandCounts.set(brandName, (brandCounts.get(brandName) || 0) + 1);
      });
      
      // Use the most common brand name
      const mostCommonBrand = Array.from(brandCounts.entries())
        .sort((a, b) => b[1] - a[1])[0][0];
      
      consolidated.set(key, {
        ...med,
        id: `${med.genericName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        brandName: mostCommonBrand,
        strength: '', // We'll show all strengths in dosage selection
        dosageForm: med.dosageForm
      });
    }
  });
  
  return Array.from(consolidated.values()).slice(0, limit);
}

export function getCommonDosages(medicationName: string): string[] {
  const medications = createMedicationFromCSV();
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