export const CANONICAL_LABS = [
  // CBC
  'HB', 'GB', 'PLT', 'VGM', 'NEUT', 'LYMP',
  // Coagulation
  'RNI', 'TTPA',
  // Inflammatory
  'CRP',
  // Chemistry - organized by clinical function
  // Renal function
  'NA', 'K', 'Cl', 'Créat', 'Urée', 'DFG ca',
  // Liver function
  'ALT', 'GGT', 'BILIT', 'P alc', 'LDH',
  // Metabolic
  'Gluc', 'Ca', 'Mg', 'PHOSP', 'Alb',
  // Blood gas
  'PHV', 'HCO3 V', 'PCO2 V', 'LACVS',
  // Cardiac
  'TROT', 'NT-proBNP'
] as const;

export type CanonicalLab = (typeof CANONICAL_LABS)[number];

/**
 * Map any synonym/variant (lower-case, accents stripped, special chars removed) to a canonical label.
 */
export const SYNONYM_TO_CANONICAL: Record<string, CanonicalLab> = {
  // CBC
  'hb': 'HB', 'hemoglobin': 'HB', 'hemoglobine': 'HB', 'hémoglobine': 'HB',
  'gb': 'GB', 'wbc': 'GB', 'whitebloodcells': 'GB', 'leucocytes': 'GB',
  'plt': 'PLT', 'plaquettes': 'PLT', 'platelets': 'PLT',
  'mcv': 'VGM', 'vgm': 'VGM',
  'neut': 'NEUT', 'neutrophils': 'NEUT', 'neutrophiles': 'NEUT',
  'lymph': 'LYMP', 'lymphocytes': 'LYMP',

  // Coagulation
  'inr': 'RNI', 'rni': 'RNI',
  'ttpa': 'TTPA', 'ptt': 'TTPA', 'aptt': 'TTPA',

  // Inflammatory
  'c-reactiveprotein': 'CRP', 'proteincreactive': 'CRP', 'protéinecréactive': 'CRP',

  // Chemistry
  'ntprobnp': 'NT-proBNP', 'bnp': 'NT-proBNP',
  'creat': 'Créat', 'creatinine': 'Créat', 'créatinine': 'Créat',
  'egfr': 'DFG ca', 'dfg': 'DFG ca', 'dfgca': 'DFG ca',
  'bun': 'Urée', 'urea': 'Urée', 'uree': 'Urée',
  'na': 'NA', 'sodium': 'NA',
  'k': 'K', 'potassium': 'K',
  'mg': 'Mg', 'magnesium': 'Mg', 'magnésium': 'Mg',
  'cl': 'Cl', 'chlore': 'Cl', 'chloride': 'Cl',
  'phosp': 'PHOSP', 'phosphate': 'PHOSP', 'phosphore': 'PHOSP', 'po4': 'PHOSP',
  'ca': 'Ca', 'calcium': 'Ca',
  'gluc': 'Gluc', 'glucose': 'Gluc',
  'alat': 'ALT', 'sgpt': 'ALT',
  'bili': 'BILIT', 'bilit': 'BILIT', 'bilirubin': 'BILIT', 'bilirubine': 'BILIT',
  'ldh': 'LDH',
  'ggt': 'GGT', 'gammagt': 'GGT',
  'palc': 'P alc', 'phosphatasealkaline': 'P alc', 'alp': 'P alc',
  'albumin': 'Alb', 'albumine': 'Alb', 'alb': 'Alb',

  // Cardiac (moved from Chemistry)
  'totalprotein': 'TROT', 'protéinestotales': 'TROT', 'proteïnestotales': 'TROT', 'tp': 'TROT',
  'troponin': 'TROT', 'troponine': 'TROT', 'trot': 'TROT',

  // Venous blood gas
  'phv': 'PHV', 'phvenous': 'PHV',
  'hco3v': 'HCO3 V', 'bicarbonatev': 'HCO3 V',
  'pco2v': 'PCO2 V',
  'lactate': 'LACVS', 'lacvs': 'LACVS'
};

/** Remove accents, non-alphanumerics, then lower-case */
function normalise(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]/g, '')
    .toLowerCase();
}

/**
 * Convert any raw lab string to its canonical representation or empty string if unknown.
 */
export function getCanonicalLabName(rawName: string): CanonicalLab | '' {
  if (!rawName) return '' as const;
  const norm = normalise(rawName);
  if (SYNONYM_TO_CANONICAL[norm]) return SYNONYM_TO_CANONICAL[norm];
  for (const canonical of CANONICAL_LABS) {
    if (normalise(canonical) === norm) return canonical;
  }
  return '' as const;
} 