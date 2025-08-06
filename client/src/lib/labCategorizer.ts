/**
 * Lab Categorization System
 * Maps lab test names to appropriate categories/panels for organized display
 */

export interface LabCategoryMapping {
  [testName: string]: string;
}

// Comprehensive mapping of lab test names to categories
// Supports multiple languages, abbreviations, and common variations
const LAB_CATEGORY_MAPPINGS: LabCategoryMapping = {
  // CANONICAL LABS - Direct mappings for canonical lab names (case variations)
  'HB': 'CBC', 'hb': 'CBC', 'GB': 'CBC', 'gb': 'CBC', 'PLT': 'CBC', 'plt': 'CBC', 'VGM': 'CBC', 'vgm': 'CBC', 'NEUT': 'CBC', 'neut': 'CBC', 'LYMP': 'CBC', 'lymp': 'CBC',
  'RNI': 'Coagulation', 'rni': 'Coagulation', 'TTPA': 'Coagulation', 'ttpa': 'Coagulation',
  'CRP': 'Inflammatory', 'crp': 'Inflammatory',
  'Créat': 'Chemistry', 'creat': 'Chemistry', 'crat': 'Chemistry', 'Urée': 'Chemistry', 'uree': 'Chemistry', 'ure': 'Chemistry', 'DFG ca': 'Chemistry', 'dfg ca': 'Chemistry', 'NA': 'Chemistry', 'na': 'Chemistry', 'K': 'Chemistry', 'k': 'Chemistry',
  'Mg': 'Chemistry', 'mg': 'Chemistry', 'Cl': 'Chemistry', 'cl': 'Chemistry', 'PHOSP': 'Chemistry', 'phosp': 'Chemistry', 'Ca': 'Chemistry', 'ca': 'Chemistry', 'Gluc': 'Chemistry', 'gluc': 'Chemistry',
  'Alb': 'Chemistry', 'alb': 'Chemistry', 'BILIT': 'Chemistry', 'bilit': 'Chemistry', 'ALT': 'Chemistry', 'alt': 'Chemistry', 'GGT': 'Chemistry', 'ggt': 'Chemistry', 'LDH': 'Chemistry', 'ldh': 'Chemistry', 'P alc': 'Chemistry', 'p alc': 'Chemistry',
  'PHV': 'Blood gas', 'phv': 'Blood gas', 'HCO3 V': 'Blood gas', 'hco3 v': 'Blood gas', 'PCO2 V': 'Blood gas', 'pco2 v': 'Blood gas', 'LACVS': 'Blood gas', 'lacvs': 'Blood gas',
  'TROT': 'Cardiac', 'trot': 'Cardiac', 'NT-proBNP': 'Cardiac', 'nt-probnp': 'Cardiac',
  // CBC (Complete Blood Count) / Hématologie
  'hemoglobin': 'CBC',
  'hémoglobine': 'CBC',
  'hgb': 'CBC',
  'hct': 'CBC',
  'hematocrit': 'CBC',
  'hématocrite': 'CBC',
  'wbc': 'CBC',
  'white blood cells': 'CBC',
  'leucocytes': 'CBC',
  'rbc': 'CBC',
  'red blood cells': 'CBC',
  'érythrocytes': 'CBC',
  'gr': 'CBC',
  'plaquettes': 'CBC',
  'platelets': 'CBC',
  'mcv': 'CBC',
  'mch': 'CBC',
  'tcmh': 'CBC',
  'mchc': 'CBC',
  'ccmh': 'CBC',
  'rdw': 'CBC',
  'idr': 'CBC',
  'neutrophils': 'CBC',
  'neutrophiles': 'CBC',
  'lymphocytes': 'CBC',
  'lympho': 'CBC',
  'monocytes': 'CBC',
  'mono': 'CBC',
  'eosinophils': 'CBC',
  'éosinophiles': 'CBC',
  'baso': 'CBC',
  'basophils': 'CBC',
  'basophiles': 'CBC',

  // Coagulation
  'inr': 'Coagulation',
  'pt': 'Coagulation',
  'tp': 'Coagulation',
  'ptt': 'Coagulation',
  'aptt': 'Coagulation',
  'ttp': 'Coagulation',
  'fibrinogen': 'Coagulation',
  'fibrinogène': 'Coagulation',
  'd-dimer': 'Coagulation',
  'ddimer': 'Coagulation',

  // Chemistry / Biochimie
  'sodium': 'Chemistry',
  'potassium': 'Chemistry',
  'chloride': 'Chemistry',
  'chlore': 'Chemistry',
  'co2': 'Chemistry',
  'bicarbonate': 'Chemistry',
  'bun': 'Chemistry',
  'urée': 'Chemistry',
  'urea': 'Chemistry',
  'créatinine': 'Chemistry',
  'creatinine': 'Chemistry',
  'glucose': 'Chemistry',
  'egfr': 'Chemistry',
  'dfg': 'Chemistry',
  'calcium': 'Chemistry',
  'magnesium': 'Chemistry',
  'magnésium': 'Chemistry',
  'phosphate': 'Chemistry',
  'phosphore': 'Chemistry',
  'po4': 'Chemistry',
  'albumin': 'Chemistry',
  'albumine': 'Chemistry',

  // Liver Function Tests (LFT)
  'alat': 'Chemistry',
  'ast': 'Chemistry',
  'asat': 'Chemistry',
  'alp': 'Chemistry',
  'phosphatase alkaline': 'Chemistry',
  'gamma gt': 'Chemistry',
  'bilirubin': 'Chemistry',
  'bilirubine': 'Chemistry',
  'total bili': 'Chemistry',
  'direct bili': 'Chemistry',

  // Cardiac markers
  'troponin': 'Cardiac',
  'troponine': 'Cardiac',
  'total protein': 'Cardiac',
  'protéines totales': 'Cardiac',
  'ck': 'Cardiac',
  'cpk': 'Cardiac',
  'ck-mb': 'Cardiac',
  'bnp': 'Cardiac',
  'proBNP': 'Cardiac',

  // Inflammatory markers
  'c-reactive protein': 'Inflammatory',
  'protéine c réactive': 'Inflammatory',
  'esr': 'Inflammatory',
  'vs': 'Inflammatory',
  'procalcitonin': 'Inflammatory',
  'pct': 'Inflammatory',

  // Lipids
  'cholesterol': 'Lipids',
  'cholestérol': 'Lipids',
  'chol': 'Lipids',
  'hdl': 'Lipids',
  'ldl': 'Lipids',
  'triglycerides': 'Lipids',
  'triglycérides': 'Lipids',
  'tg': 'Lipids',

  // Endocrinology
  'tsh': 'Endocrinology',
  't3': 'Endocrinology',
  't4': 'Endocrinology',
  'hba1c': 'Endocrinology',
  'hemoglobin a1c': 'Endocrinology',
  'cortisol': 'Endocrinology',
  'insulin': 'Endocrinology',
  'insuline': 'Endocrinology',

  // Vitamins
  'vitamin d': 'Chemistry',
  'vitamine d': 'Chemistry',
  'vit d': 'Chemistry',
  'b12': 'Chemistry',
  'vitamin b12': 'Chemistry',
  'folate': 'Chemistry',
  'folates': 'Chemistry',
  'iron': 'Chemistry',
  'fer': 'Chemistry',
  'ferritin': 'Chemistry',
  'ferritine': 'Chemistry',

  // Immunology
  'igG': 'Immunology',
  'igM': 'Immunology',
  'igA': 'Immunology',
  'c3': 'Immunology',
  'c4': 'Immunology',

  // Tumor markers
  'psa': 'Tumor Markers',
  'cea': 'Tumor Markers',
  'ca 19-9': 'Tumor Markers',
  'ca 125': 'Tumor Markers',
  'afp': 'Tumor Markers',
};

/**
 * Normalizes a lab test name for matching
 * Removes special characters, converts to lowercase, handles common variations
 */
function normalizeLabName(testName: string): string {
  if (!testName || typeof testName !== 'string') {
    return '';
  }
  
  try {
    return testName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except dashes
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/^(.*?)(\s*:.*)?$/, '$1') // Remove anything after colon
      .trim();
  } catch (error) {
    console.warn('Error normalizing lab name:', testName, error);
    return testName.toLowerCase().trim();
  }
}

/**
 * Performs fuzzy matching to find the best category for a lab test
 * Uses exact matching first, then partial matching
 */
function findBestCategoryMatch(testName: string): string | null {
  const normalized = normalizeLabName(testName);
  
  if (!normalized) {
    return null;
  }
  
  try {
    // First try exact match
    if (LAB_CATEGORY_MAPPINGS[normalized]) {
      return LAB_CATEGORY_MAPPINGS[normalized];
    }
    
    // Try partial matching - but prioritize exact word boundaries
    // Sort keys by length (longer keys first) to prioritize more specific matches
    const sortedKeys = Object.keys(LAB_CATEGORY_MAPPINGS).sort((a, b) => b.length - a.length);
    
    // First try exact matches (normalized === key)
    for (const key of sortedKeys) {
      if (normalized === key) {
        return LAB_CATEGORY_MAPPINGS[key];
      }
    }
    
    // Then try containment matches, but be more careful
    for (const key of sortedKeys) {
      // Only match if the key is a complete word within the normalized name
      // or if the normalized name is completely contained in the key
      if (normalized.includes(key) && (key.length === normalized.length || normalized.includes(' ' + key + ' ') || normalized.startsWith(key + ' ') || normalized.endsWith(' ' + key))) {
        return LAB_CATEGORY_MAPPINGS[key];
      }
      // Or if the key contains the normalized name as a complete substring (but be careful about partial matches)
      if (key.includes(normalized) && key !== normalized) {
        // Only allow this if normalized is NOT a prefix of other common lab names
        const isAmbiguous = sortedKeys.some(otherKey => otherKey !== key && otherKey.startsWith(normalized) && otherKey.length > normalized.length);
        if (!isAmbiguous) {
          return LAB_CATEGORY_MAPPINGS[key];
        }
      }
    }
    
    // Check for common patterns with more specific matching
    const patterns = [
      // CBC patterns
      { pattern: /^(hb(?!a1c)|hgb|hemoglo|hémoglo)/i, category: 'CBC' },
      { pattern: /^(wbc|gb|leuco|white.*blood|globules.*blancs)/i, category: 'CBC' },
      { pattern: /^(rbc|gr|red.*blood|globules.*rouge)/i, category: 'CBC' },
      { pattern: /^(plt|plaq|plate|thromb)/i, category: 'CBC' },
      { pattern: /^(mcv|vgm|mean.*corp)/i, category: 'CBC' },
      { pattern: /^(mch|tcmh)/i, category: 'CBC' },
      { pattern: /^(neut|lymph|mono|eosino|baso)/i, category: 'CBC' },
      
      // Chemistry patterns
      { pattern: /^(na|sodium)/i, category: 'Chemistry' },
      { pattern: /^(k|potass)/i, category: 'Chemistry' },
      { pattern: /^(cl|chlor)/i, category: 'Chemistry' },
      { pattern: /^(creat|créat)/i, category: 'Chemistry' },
      { pattern: /^(gluc|glucose)/i, category: 'Chemistry' },
      { pattern: /^(ca|calcium)/i, category: 'Chemistry' },
      { pattern: /^(mg|magn)/i, category: 'Chemistry' },
      { pattern: /^(phosp|po4)/i, category: 'Chemistry' },
      { pattern: /^(urea|urée|bun)/i, category: 'Chemistry' },
      { pattern: /^(alb|albumin)/i, category: 'Chemistry' },
      
      // Liver function
      { pattern: /^(alt|alat|sgpt)/i, category: 'Chemistry' },
      { pattern: /^(ast|asat|sgot)/i, category: 'Chemistry' },
      { pattern: /^(alp|phosph.*alc|p.*alc)/i, category: 'Chemistry' },
      { pattern: /^(ggt|gamma)/i, category: 'Chemistry' },
      { pattern: /^(bili|bilit)/i, category: 'Chemistry' },
      { pattern: /^(ldh)/i, category: 'Chemistry' },
      
      // Coagulation patterns
      { pattern: /^(inr|rni)/i, category: 'Coagulation' },
      { pattern: /^(pt|tp|temps.*prothromb)/i, category: 'Coagulation' },
      { pattern: /^(ptt|ttpa|aptt)/i, category: 'Coagulation' },
      { pattern: /^(fibrin)/i, category: 'Coagulation' },
      { pattern: /^(d.*dim)/i, category: 'Coagulation' },
      
      // Inflammatory markers
      { pattern: /^(crp|c.*react)/i, category: 'Inflammatory' },
      { pattern: /^(esr|vs|sed.*rate)/i, category: 'Inflammatory' },
      { pattern: /^(procal|pct)/i, category: 'Inflammatory' },
      
      // Lipids
      { pattern: /^(chol|cholest)/i, category: 'Lipids' },
      { pattern: /^(hdl|ldl)/i, category: 'Lipids' },
      { pattern: /^(trig|tg)/i, category: 'Lipids' },
      
      // Endocrinology
      { pattern: /^(tsh|thyro)/i, category: 'Endocrinology' },
      { pattern: /^(t3|t4)/i, category: 'Endocrinology' },
      { pattern: /^(hba1c|hemoglobin.*a1c|a1c)/i, category: 'Endocrinology' },
      { pattern: /^(cortis|insulin)/i, category: 'Endocrinology' },
      
      // Cardiac markers
      { pattern: /^(trop|ck|cpk|bnp)/i, category: 'Cardiac' }
    ];
    
    for (const { pattern, category } of patterns) {
      if (pattern.test(normalized)) {
        return category;
      }
    }
    
  } catch (error) {
    console.warn('Error in pattern matching for lab:', testName, error);
  }
  
  return null;
}

/**
 * Categorizes a lab test name into an appropriate panel/category
 * Returns the category name or 'General' if no specific category is found
 */
export function categorizeLabTest(testName: string): string {
  if (!testName || typeof testName !== 'string') {
    console.warn('Invalid test name provided to categorizeLabTest:', testName);
    return 'General';
  }
  
  try {
    const category = findBestCategoryMatch(testName);
    const result = category || 'General';
    
    // Log successful categorizations for debugging (can be removed in production)
    if (category && category !== 'General') {
      console.debug(`Categorized "${testName}" as "${category}"`);
    }
    
    return result;
  } catch (error) {
    console.error('Error categorizing lab test:', testName, error);
    return 'General';
  }
}

/**
 * Batch categorize multiple lab test names
 * Useful for processing arrays of lab values
 */
export function categorizeLabTests(testNames: string[]): { [testName: string]: string } {
  const result: { [testName: string]: string } = {};
  
  for (const testName of testNames) {
    result[testName] = categorizeLabTest(testName);
  }
  
  return result;
}

/**
 * Get all available categories in priority order
 */
export function getAvailableCategories(): string[] {
  return [
    'CBC',
    'Coagulation',
    'Inflammatory',
    'Chemistry',
    'Blood gas',
    'Cardiac'
  ];
}

/**
 * Get chemistry sub-categories with their respective labs for logical grouping
 */
export function getChemistrySubCategories(): Record<string, string[]> {
  return {
    'Renal': ['NA', 'K', 'Cl', 'Créat', 'Urée', 'DFG ca', 'na', 'sodium', 'k', 'potassium', 'cl', 'chlore', 'chloride', 'creat', 'créatinine', 'creatinine', 'urea', 'urée', 'bun', 'egfr', 'dfg'],
    'Liver': ['ALT', 'GGT', 'BILIT', 'P alc', 'LDH', 'alt', 'alat', 'sgpt', 'ggt', 'gamma gt', 'bili', 'bilit', 'bilirubin', 'bilirubine', 'alp', 'phosphatase alkaline', 'p alc', 'palc', 'ldh'],
    'Metabolic': ['Gluc', 'Ca', 'Mg', 'PHOSP', 'Alb', 'gluc', 'glucose', 'ca', 'calcium', 'mg', 'magnesium', 'magnésium', 'phosp', 'phosphate', 'phosphore', 'po4', 'alb', 'albumin', 'albumine']
  };
}

/**
 * Get the chemistry sub-category for a given lab test
 */
export function getChemistrySubCategory(testName: string): string | null {
  if (!testName || typeof testName !== 'string') {
    return null;
  }

  const normalized = normalizeLabName(testName);
  const subCategories = getChemistrySubCategories();
  
  for (const [subCategory, labs] of Object.entries(subCategories)) {
    if (labs.some(lab => normalized === lab.toLowerCase() || normalized.includes(lab.toLowerCase()))) {
      return subCategory;
    }
  }
  
  return null;
}

/**
 * Add a custom mapping for a specific lab name
 * Useful for user-defined categorizations
 */
export function addCustomMapping(testName: string, category: string): void {
  if (!testName || !category || typeof testName !== 'string' || typeof category !== 'string') {
    console.warn('Invalid parameters for addCustomMapping:', { testName, category });
    return;
  }
  
  const normalized = normalizeLabName(testName);
  if (normalized) {
    LAB_CATEGORY_MAPPINGS[normalized] = category;
    console.debug(`Added custom mapping: "${testName}" -> "${category}"`);
  }
}

/**
 * Reset custom mappings (useful for testing)
 */
export function resetMappings(): void {
  // This would need to track custom mappings separately to avoid resetting built-in ones
  console.warn('resetMappings not implemented - would need to track custom mappings separately');
}

/**
 * Get mapping statistics for debugging
 */
export function getMappingStats(): { totalMappings: number; categoryCounts: Record<string, number> } {
  const categoryCounts: Record<string, number> = {};
  
  Object.values(LAB_CATEGORY_MAPPINGS).forEach(category => {
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  
  return {
    totalMappings: Object.keys(LAB_CATEGORY_MAPPINGS).length,
    categoryCounts
  };
}