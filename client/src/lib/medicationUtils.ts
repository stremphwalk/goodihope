import { medicationCategories } from "@/../../shared/schema";

// Common dosages for popular medications - Canadian formulations
export const commonDosages: Record<string, string[]> = {
  // Diabetes medications
  'METFORMIN': ['500 mg', '850 mg', '1000 mg'],
  'JANUVIA': ['25 mg', '50 mg', '100 mg'],
  'JARDIANCE': ['10 mg', '25 mg'],
  'OZEMPIC': ['0.25 mg', '0.5 mg', '1 mg'],
  'TRULICITY': ['0.75 mg', '1.5 mg', '3 mg'],
  
  // Anticoagulants
  'XARELTO': ['10 mg', '15 mg', '20 mg'],
  'ELIQUIS': ['2.5 mg', '5 mg'],
  'COUMADIN': ['1 mg', '2 mg', '5 mg'],
  'WARFARIN': ['1 mg', '2 mg', '5 mg'],
  
  // Statins
  'LIPITOR': ['10 mg', '20 mg', '40 mg'],
  'CRESTOR': ['5 mg', '10 mg', '20 mg'],
  'ZOCOR': ['5 mg', '10 mg', '20 mg'],
  'ATORVASTATIN': ['10 mg', '20 mg', '40 mg'],
  'ROSUVASTATIN': ['5 mg', '10 mg', '20 mg'],
  
  // Blood pressure medications
  'NORVASC': ['2.5 mg', '5 mg', '10 mg'],
  'AMLODIPINE': ['2.5 mg', '5 mg', '10 mg'],
  'LISINOPRIL': ['5 mg', '10 mg', '20 mg'],
  'RAMIPRIL': ['1.25 mg', '2.5 mg', '5 mg'],
  'LOSARTAN': ['25 mg', '50 mg', '100 mg'],
  'TELMISARTAN': ['20 mg', '40 mg', '80 mg'],
  'HYDROCHLOROTHIAZIDE': ['12.5 mg', '25 mg', '50 mg'],
  
  // Diuretics
  'LASIX': ['20 mg', '40 mg', '80 mg'],
  'FUROSEMIDE': ['20 mg', '40 mg', '80 mg'],
  
  // Pain medications
  'TYLENOL': ['325 mg', '500 mg', '650 mg'],
  'ACETAMINOPHEN': ['325 mg', '500 mg', '650 mg'],
  'ADVIL': ['200 mg', '400 mg'],
  'IBUPROFEN': ['200 mg', '400 mg', '600 mg'],
  'NAPROXEN': ['220 mg', '275 mg', '550 mg'],
  'VOLTAREN': ['25 mg', '50 mg', '75 mg'],
  'DICLOFENAC': ['25 mg', '50 mg', '75 mg'],
  'CELEBREX': ['100 mg', '200 mg'],
  'TRAMADOL': ['50 mg', '100 mg'],
  
  // Antidepressants
  'PROZAC': ['10 mg', '20 mg', '40 mg'],
  'FLUOXETINE': ['10 mg', '20 mg', '40 mg'],
  'ZOLOFT': ['25 mg', '50 mg', '100 mg'],
  'SERTRALINE': ['25 mg', '50 mg', '100 mg'],
  'EFFEXOR': ['37.5 mg', '75 mg', '150 mg'],
  'VENLAFAXINE': ['37.5 mg', '75 mg', '150 mg'],
  'WELLBUTRIN': ['75 mg', '100 mg', '150 mg'],
  'BUPROPION': ['75 mg', '100 mg', '150 mg'],
  
  // Proton pump inhibitors
  'NEXIUM': ['20 mg', '40 mg'],
  'ESOMEPRAZOLE': ['20 mg', '40 mg'],
  'PANTOPRAZOLE': ['20 mg', '40 mg'],
  'OMEPRAZOLE': ['10 mg', '20 mg', '40 mg'],
  'LANSOPRAZOLE': ['15 mg', '30 mg'],
  
  // Antibiotics
  'AMOXICILLIN': ['250 mg', '500 mg', '875 mg'],
  'CLAVULIN': ['250 mg', '500 mg', '875 mg'],
  'AZITHROMYCIN': ['250 mg', '500 mg'],
  'CLARITHROMYCIN': ['250 mg', '500 mg'],
  'CIPROFLOXACIN': ['250 mg', '500 mg', '750 mg'],
  'LEVOFLOXACIN': ['250 mg', '500 mg', '750 mg'],
  'CEPHALEXIN': ['250 mg', '500 mg'],
  
  // Respiratory medications
  'VENTOLIN': ['100 mcg', '200 mcg'],
  'SALBUTAMOL': ['100 mcg', '200 mcg'],
  'FLOVENT': ['25 mcg', '50 mcg', '125 mcg'],
  'ADVAIR': ['25/50 mcg', '25/125 mcg', '25/250 mcg'],
  'SYMBICORT': ['80/4.5 mcg', '160/4.5 mcg'],
  'MONTELUKAST': ['4 mg', '5 mg', '10 mg'],
  
  // Antihistamines
  'REACTINE': ['5 mg', '10 mg'],
  'CETIRIZINE': ['5 mg', '10 mg'],
  'CLARITIN': ['10 mg'],
  'LORATADINE': ['10 mg'],
  'ALLEGRA': ['60 mg', '120 mg', '180 mg'],
  'FEXOFENADINE': ['60 mg', '120 mg', '180 mg'],
  
  // Thyroid medications
  'SYNTHROID': ['25 mcg', '50 mcg', '75 mcg', '100 mcg'],
  'LEVOTHYROXINE': ['25 mcg', '50 mcg', '75 mcg', '100 mcg'],
  
  // Anti-nausea
  'ONDANSETRON': ['4 mg', '8 mg'],
  'GRAVOL': ['25 mg', '50 mg'],
  'DIMENHYDRINATE': ['25 mg', '50 mg'],
  
  // Cardiac medications
  'AMIODARONE': ['100 mg', '200 mg', '400 mg'],
  'DIGOXIN': ['0.125 mg', '0.25 mg'],
  'METOPROLOL': ['25 mg', '50 mg', '100 mg'],
  'ATENOLOL': ['25 mg', '50 mg', '100 mg'],
  'PROPRANOLOL': ['10 mg', '20 mg', '40 mg'],
  
  // Psychiatric medications
  'SEROQUEL': ['25 mg', '100 mg', '200 mg'],
  'QUETIAPINE': ['25 mg', '100 mg', '200 mg'],
  'RISPERIDONE': ['0.5 mg', '1 mg', '2 mg'],
  'OLANZAPINE': ['2.5 mg', '5 mg', '10 mg'],
  'LITHIUM': ['150 mg', '300 mg', '600 mg'],
  'CLONAZEPAM': ['0.5 mg', '1 mg', '2 mg'],
  'LORAZEPAM': ['0.5 mg', '1 mg', '2 mg'],
  'ATIVAN': ['0.5 mg', '1 mg', '2 mg'],
  
  // Sleep medications
  'ZOPICLONE': ['3.75 mg', '7.5 mg'],
  'TRAZODONE': ['50 mg', '100 mg', '150 mg'],
  
  // Seizure medications
  'DILANTIN': ['30 mg', '100 mg'],
  'PHENYTOIN': ['30 mg', '100 mg'],
  'CARBAMAZEPINE': ['200 mg', '400 mg'],
  'LAMOTRIGINE': ['25 mg', '100 mg', '200 mg'],
  'VALPROIC ACID': ['250 mg', '500 mg'],
  
  // Osteoporosis
  'FOSAMAX': ['35 mg', '70 mg'],
  'ALENDRONATE': ['35 mg', '70 mg'],
  'ACTONEL': ['35 mg'],
  'RISEDRONATE': ['35 mg']
};

// Frequency options
export const frequencies = ['DIE', 'BID', 'TID', 'QID'];

// Frequency translations
export const frequencyTranslations: Record<string, { en: string; fr: string }> = {
  'DIE': { en: 'DIE', fr: 'DIE' },
  'BID': { en: 'BID', fr: 'BID' },
  'TID': { en: 'TID', fr: 'TID' },
  'QID': { en: 'QID', fr: 'QID' },
  'HS': { en: 'HS', fr: 'HS' },
  'once daily': { en: 'DIE', fr: 'DIE' },
  'twice daily': { en: 'BID', fr: 'BID' },
  'three times daily': { en: 'TID', fr: 'TID' },
  'four times daily': { en: 'QID', fr: 'QID' },
  'once weekly': { en: 'once weekly', fr: 'une fois par semaine' },
  'twice weekly': { en: 'twice weekly', fr: 'deux fois par semaine' },
  'three times weekly': { en: 'three times weekly', fr: 'trois fois par semaine' },
  'once monthly': { en: 'once monthly', fr: 'une fois par mois' },
  'as needed': { en: 'PRN', fr: 'PRN' },
  'PRN': { en: 'PRN', fr: 'PRN' },
  'at bedtime': { en: 'HS', fr: 'HS' },
  'in the morning': { en: 'in the morning', fr: 'le matin' },
  'with meals': { en: 'with meals', fr: 'avec les repas' },
  'before meals': { en: 'before meals', fr: 'avant les repas' },
  'after meals': { en: 'after meals', fr: 'après les repas' }
};

// Function to translate frequency based on language
export function translateFrequency(frequency: string, language: 'en' | 'fr'): string {
  const normalizedFreq = frequency.toLowerCase().trim();
  
  // Find exact match first
  const translation = frequencyTranslations[normalizedFreq];
  if (translation) {
    return translation[language];
  }
  
  // Find partial match for complex frequencies
  for (const [key, value] of Object.entries(frequencyTranslations)) {
    if (normalizedFreq.includes(key.toLowerCase())) {
      return value[language];
    }
  }
  
  // Return original if no translation found
  return frequency;
}

export interface ExtractedMedication {
  name: string;
  dosage?: string;
  frequency?: string;
  category?: string;
}

export interface SelectedMedication {
  id: string;
  name: string;
  category: string;
  dosage: string;
  frequency: string;
  isCustom: boolean;
  isDiscontinued: boolean;
  addedAt: number;
}

export interface MedicationData {
  homeMedications: SelectedMedication[];
  hospitalMedications: SelectedMedication[];
}

// Enhanced medication categorization with more precise matching
const medicationGroups = {
  'Antiplatelet/Anticoagulant': {
    priority: 1,
    keywords: ['aspirin', 'bayer', 'ecotrin', 'asa', 'warfarin', 'coumadin', 'jantoven', 'clopidogrel', 'plavix', 'rivaroxaban', 'xarelto', 'apixaban', 'eliquis', 'dabigatran', 'pradaxa', 'enoxaparin', 'lovenox', 'heparin', 'hep-lock', 'fondaparinux', 'arixtra', 'edoxaban', 'savaysa', 'prasugrel', 'effient', 'ticagrelor', 'brilinta', 'bivalirudin', 'angiomax']
  },
  'Cardiac/Hypertension': {
    priority: 2,
    keywords: ['metoprolol', 'lopressor', 'toprol-xl', 'toprol', 'atenolol', 'tenormin', 'carvedilol', 'coreg', 'bisoprolol', 'zebeta', 'sandoz', 'lisinopril', 'prinivil', 'zestril', 'enalapril', 'vasotec', 'losartan', 'cozaar', 'valsartan', 'diovan', 'amlodipine', 'norvasc', 'nifedipine', 'adalat', 'procardia', 'diltiazem', 'cardizem', 'tiazac', 'hydrochlorothiazide', 'microzide', 'hctz', 'furosemide', 'lasix', 'spironolactone', 'aldactone', 'digoxin', 'lanoxin', 'amiodarone', 'cordarone', 'pacerone', 'atorvastatin', 'lipitor', 'simvastatin', 'zocor', 'rosuvastatin', 'crestor', 'pravastatin', 'pravachol', 'isosorbide', 'imdur', 'nitroglycerin', 'nitrostat', 'hydralazine', 'apresoline']
  },
  'Hypoglycemic': {
    priority: 3,
    keywords: ['metformin', 'glucophage', 'fortamet', 'insulin', 'humalog', 'novolog', 'lantus', 'levemir', 'glipizide', 'glucotrol', 'glyburide', 'diabeta', 'micronase', 'glimepiride', 'amaryl', 'gliclazide', 'diamicron', 'pioglitazone', 'actos', 'sitagliptin', 'januvia', 'saxagliptin', 'onglyza', 'liraglutide', 'victoza', 'saxenda', 'exenatide', 'byetta', 'bydureon', 'semaglutide', 'ozempic', 'wegovy', 'empagliflozin', 'jardiance', 'canagliflozin', 'invokana', 'dapagliflozin', 'farxiga', 'repaglinide', 'prandin', 'acarbose', 'precose']
  },
  'Psychiatric': {
    priority: 4,
    keywords: ['sertraline', 'zoloft', 'fluoxetine', 'prozac', 'paroxetine', 'paxil', 'citalopram', 'celexa', 'escitalopram', 'lexapro', 'venlafaxine', 'effexor', 'duloxetine', 'cymbalta', 'bupropion', 'wellbutrin', 'zyban', 'mirtazapine', 'remeron', 'trazodone', 'desyrel', 'lorazepam', 'ativan', 'alprazolam', 'xanax', 'clonazepam', 'klonopin', 'diazepam', 'valium', 'zolpidem', 'ambien', 'quetiapine', 'seroquel', 'risperidone', 'risperdal', 'olanzapine', 'zyprexa', 'aripiprazole', 'abilify', 'lithium', 'lithobid', 'valproic', 'depakote', 'lamotrigine', 'lamictal', 'gabapentin', 'neurontin', 'pregabalin', 'lyrica']
  },
  'Other Important': {
    priority: 5,
    keywords: ['levothyroxine', 'synthroid', 'levoxyl', 'prednisone', 'deltasone', 'rayos', 'prednisolone', 'prelone', 'orapred', 'albuterol', 'proair', 'ventolin', 'proventil', 'omeprazole', 'prilosec', 'losec', 'pantoprazole', 'protonix', 'ciprofloxacin', 'cipro', 'azithromycin', 'zithromax', 'z-pak', 'amoxicillin', 'amoxicilline', 'amoxil', 'clavulanate', 'augmentin', 'phenytoin', 'dilantin', 'levetiracetam', 'keppra', 'doxycycline', 'vibramycin', 'formoterol', 'foradil', 'mometasone', 'nasonex', 'glycopyrronium', 'spiriva', 'salbutamol', 'naloxone', 'narcan']
  },
  'Gastrointestinal': {
    priority: 6,
    keywords: ['polyethylene-glycol-3350', 'miralax', 'docusate', 'colace', 'bisacodyl', 'dulcolax', 'senna', 'senokot', 'lactulose', 'enulose', 'psyllium', 'metamucil']
  },
  'Vitamins/Supplements': {
    priority: 7,
    keywords: ['vitamin', 'drisdol', 'calcitriol', 'cholecalciferol', 'cyanocobalamin', 'calcium', 'tums', 'caltrate', 'iron', 'feosol', 'slow fe', 'magnesium', 'mag-ox', 'folic', 'folate', 'multivitamin', 'centrum', 'one-a-day', 'omega-3', 'fish oil', 'supplement', 'b12', 'cobalamin', 'thiamine', 'riboflavin', 'niacin', 'biotin', 'ascorbic', 'carbonate']
  },
  'Low Priority/Topical': {
    priority: 8,
    keywords: ['eau-de-mer', 'saline', 'nasal rinse', 'rince nasal', 'topique', 'gel nasal', 'nasal spray', 'eye drops', 'gouttes', 'ointment', 'cream', 'lotion', 'shampoo']
  }
};

// Enhanced categorization function with better logic
export function categorizeMedication(medicationName: string): string {
  const name = medicationName.toLowerCase();
  
  // Special case handling for specific medications
  
  // Handle polyethylene glycol variants specifically
  if (name.includes('polyethylene-glycol-3350') || (name.includes('polyethylene') && name.includes('17'))) {
    return 'Gastrointestinal';
  }
  
  // Handle topical/nasal preparations first (before checking other categories)
  if (name.includes('topique') || name.includes('gel nasal') || name.includes('rince nasal') || 
      name.includes('eau-de-mer') || name.includes('nasal spray') || name.includes('gouttes')) {
    return 'Low Priority/Topical';
  }
  
  // Handle combination drugs (like amoxicillin + clavulanate)
  if (name.includes('amoxicilline') && name.includes('clavulanate')) {
    return 'Other Important';
  }
  
  // Check all categories in priority order
  const sortedCategories = Object.entries(medicationGroups).sort((a, b) => a[1].priority - b[1].priority);
  
  for (const [category, data] of sortedCategories) {
    // Skip the low priority category as we handled it above
    if (category === 'Low Priority/Topical') continue;
    
    for (const keyword of data.keywords) {
      // More precise matching - require exact word boundaries for short keywords
      if (keyword.length <= 3) {
        // For short keywords, require exact match or word boundary
        const regex = new RegExp(`\\b${keyword}\\b`, 'i');
        if (regex.test(name)) {
          return category;
        }
      } else {
        // For longer keywords, use includes but be more specific
        if (name.includes(keyword)) {
          return category;
        }
      }
    }
  }
  
  // If no specific category found, determine based on route/formulation
  if (name.includes('topique') || name.includes('nasal') || name.includes('eye') || 
      name.includes('ointment') || name.includes('cream') || name.includes('gel')) {
    return 'Low Priority/Topical';
  }
  
  return 'Other Important';
}

// Function to get the priority order for medication categories
export function getCategoryPriority(category: string): number {
  const categoryData = medicationGroups[category as keyof typeof medicationGroups];
  return categoryData ? categoryData.priority : 9;
}

// Function to parse and calculate total dosage from prescription text
export function calculateTotalDosage(dosageText: string, quantityText: string): string {
  // Extract numbers from dosage (e.g., "325mg" -> 325)
  const dosageMatch = dosageText.match(/(\d+(?:\.\d+)?)/);
  const dosageValue = dosageMatch ? parseFloat(dosageMatch[1]) : 0;
  
  // Extract unit from dosage (e.g., "325mg" -> "mg")
  const unitMatch = dosageText.match(/([a-zA-Z]+|IU|mcg)/i);
  const unit = unitMatch ? unitMatch[1] : '';
  
  // Extract quantity multiplier from text (e.g., "2 comprimés" -> 2, "½ comprimé" -> 0.5)
  let quantity = 1;
  
  if (quantityText.includes('½') || quantityText.includes('0.5')) {
    quantity = 0.5;
  } else if (quantityText.includes('2')) {
    quantity = 2;
  } else if (quantityText.includes('3')) {
    quantity = 3;
  } else if (quantityText.includes('4')) {
    quantity = 4;
  } else if (quantityText.includes('5')) {
    quantity = 5;
  }
  
  const totalDosage = dosageValue * quantity;
  
  // Handle special cases for combination drugs
  if (dosageText.includes('+')) {
    return dosageText; // Keep original format for combinations like "875mg+125mg"
  }
  
  return `${totalDosage}${unit}`;
}

// Function to convert frequency to standard abbreviations
export function standardizeFrequency(frequencyText: string): string {
  const text = frequencyText.toLowerCase();
  
  // Check for PRN (as needed) indicators
  const isPRN = text.includes('besoin') || text.includes('needed') || text.includes('prn') || 
               text.includes('si nécessaire') || text.includes('au besoin');
  
  // Check for duration indicators
  const durationMatch = text.match(/(\d+)\s*(jour|day|semaine|week)/i);
  const duration = durationMatch ? ` for ${durationMatch[1]} ${durationMatch[2]}s` : '';
  
  // Determine base frequency
  let baseFreq = '';
  if (text.includes('4 fois') || text.includes('four times') || text.includes('qid')) {
    baseFreq = 'QID';
  } else if (text.includes('3 fois') || text.includes('three times') || text.includes('tid')) {
    baseFreq = 'TID';
  } else if (text.includes('2 fois') || text.includes('twice') || text.includes('bid')) {
    baseFreq = 'BID';
  } else if (text.includes('semaine') || text.includes('weekly')) {
    baseFreq = 'weekly';
  } else {
    baseFreq = 'DIE'; // Once daily default
  }
  
  return baseFreq + (isPRN ? ' PRN' : '') + duration;
}

// Function to sort medications by importance
export function sortMedicationsByImportance(medications: SelectedMedication[]): SelectedMedication[] {
  return medications.sort((a, b) => {
    const priorityA = getCategoryPriority(a.category);
    const priorityB = getCategoryPriority(b.category);
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same category, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

// Function to create a medication object from user input
export function createMedication(name: string, isCustom: boolean = false): SelectedMedication {
  return {
    id: crypto.randomUUID(),
    name,
    category: categorizeMedication(name),
    dosage: '',
    frequency: '',
    isCustom,
    isDiscontinued: false,
    addedAt: Date.now()
  };
}

// Function to get common dosages for a medication from FDA data
export async function getCommonDosages(medicationName: string): Promise<string[]> {
  try {
    // First check hardcoded list for immediate response
    const upperName = medicationName.toUpperCase();
    if (commonDosages[upperName]) {
      return commonDosages[upperName];
    }
    
    // Fetch from FDA API
    const response = await fetch(`/api/medications/dosages/${encodeURIComponent(medicationName)}`);
    if (response.ok) {
      const dosages = await response.json();
      return dosages || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching dosages:', error);
    // Fallback to hardcoded list
    const upperName = medicationName.toUpperCase();
    return commonDosages[upperName] || [];
  }
}

// Function to format medications for note generation preserving current order
export function formatMedicationsForNote(medications: SelectedMedication[], language: string = 'en'): string {
  // Ensure medications is an array
  if (!Array.isArray(medications) || medications.length === 0) {
    return language === 'fr' ? 'Aucun médicament.' : 'No medications.';
  }

  // Use medications in their current order (no sorting)
  const sortedMeds = medications;

  // Format each medication with a hyphen
  const formattedMeds = sortedMeds.map(med => {
    const parts = [med.name];
    if (med.dosage) parts.push(med.dosage);
    if (med.frequency) parts.push(med.frequency);
    const medString = parts.join(' ');
    return `- ${med.isDiscontinued ? `(X) ${medString}` : medString}`;
  });

  return formattedMeds.join('\n');
}