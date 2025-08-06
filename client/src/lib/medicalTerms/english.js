/**
 * English Medical Terminology Context for Soniox Transcription
 * Organized by medical documentation sections for context-aware transcription
 */

// Common medical prefixes, suffixes, and roots
export const medicalRoots = [
  'cardio', 'pulmo', 'hepato', 'nephro', 'neuro', 'gastro', 'dermato', 'hemato',
  'osteo', 'arthro', 'myo', 'encephalo', 'angio', 'cysto', 'entero', 'broncho',
  'pneumo', 'reno', 'spleno', 'thyro', 'adeno', 'chondro', 'fibro', 'lipo'
];

export const medicalSuffixes = [
  'itis', 'osis', 'emia', 'uria', 'pathy', 'trophy', 'scopy', 'tomy', 'ectomy',
  'plasty', 'stomy', 'lysis', 'genesis', 'phobia', 'philia', 'algia', 'dynia'
];

// History of Present Illness (HPI) Terms
export const hpiTerms = [
  // Symptom descriptors
  'acute', 'chronic', 'intermittent', 'constant', 'progressive', 'stable',
  'sharp', 'dull', 'throbbing', 'burning', 'cramping', 'aching', 'stabbing',
  'radiating', 'localized', 'diffuse', 'bilateral', 'unilateral',
  
  // Severity scales
  'mild', 'moderate', 'severe', 'excruciating', 'tolerable', 'intolerable',
  
  // Timing
  'sudden onset', 'gradual onset', 'morning', 'evening', 'nocturnal',
  'post-prandial', 'pre-prandial', 'exertional', 'at rest',
  
  // Common symptoms
  'chest pain', 'shortness of breath', 'dyspnea', 'palpitations', 'syncope',
  'presyncope', 'dizziness', 'headache', 'nausea', 'vomiting', 'diarrhea',
  'constipation', 'abdominal pain', 'back pain', 'joint pain', 'muscle pain',
  'fatigue', 'weakness', 'fever', 'chills', 'night sweats', 'weight loss',
  'weight gain', 'appetite loss', 'anorexia', 'polyuria', 'polydipsia',
  'polyphagia', 'dysuria', 'hematuria', 'hemoptysis', 'hematemesis',
  'melena', 'hematochezia', 'orthopnea', 'paroxysmal nocturnal dyspnea'
];

// Physical Examination Terms
export const physicalExamTerms = [
  // General appearance
  'well-appearing', 'ill-appearing', 'toxic-appearing', 'distressed',
  'comfortable', 'alert', 'oriented', 'cooperative', 'anxious', 'lethargic',
  
  // Vital signs
  'blood pressure', 'heart rate', 'respiratory rate', 'temperature',
  'oxygen saturation', 'pulse oximetry', 'orthostatic', 'hypertension',
  'hypotension', 'tachycardia', 'bradycardia', 'tachypnea', 'bradypnea',
  'fever', 'afebrile', 'hypothermia',
  
  // HEENT
  'normocephalic', 'atraumatic', 'pupils equal round reactive to light',
  'extraocular movements intact', 'scleral icterus', 'conjunctival pallor',
  'lymphadenopathy', 'thyromegaly', 'neck stiffness', 'carotid bruits',
  'jugular venous distension',
  
  // Cardiovascular
  'regular rate and rhythm', 'irregular rhythm', 'murmur', 'gallop',
  'rub', 'click', 'peripheral pulses', 'capillary refill', 'edema',
  'cyanosis', 'clubbing', 'point of maximal impulse',
  
  // Respiratory
  'clear to auscultation', 'rhonchi', 'rales', 'crackles', 'wheezes',
  'stridor', 'diminished breath sounds', 'absent breath sounds',
  'dullness to percussion', 'hyperresonance', 'tactile fremitus',
  'egophony', 'whispered pectoriloquy',
  
  // Abdominal
  'soft', 'non-tender', 'non-distended', 'bowel sounds', 'hyperactive',
  'hypoactive', 'absent', 'hepatomegaly', 'splenomegaly', 'masses',
  'rebound tenderness', 'guarding', 'rigidity', 'Murphy sign', 'McBurney point',
  
  // Neurological
  'cranial nerves intact', 'motor strength', 'sensory intact', 'reflexes',
  'coordination', 'gait', 'Romberg', 'Babinski', 'clonus', 'fasciculations',
  'tremor', 'dysmetria', 'dysdiadochokinesia',
  
  // Musculoskeletal
  'range of motion', 'joint swelling', 'joint deformity', 'crepitus',
  'muscle atrophy', 'muscle weakness', 'tenderness', 'effusion'
];

// Laboratory Terms
export const laboratoryTerms = [
  // CBC
  'complete blood count', 'white blood cell count', 'hemoglobin', 'hematocrit',
  'platelet count', 'mean corpuscular volume', 'red blood cell distribution width',
  'neutrophils', 'lymphocytes', 'monocytes', 'eosinophils', 'basophils',
  'bands', 'blasts', 'schistocytes', 'spherocytes',
  
  // Chemistry
  'basic metabolic panel', 'comprehensive metabolic panel', 'sodium',
  'potassium', 'chloride', 'carbon dioxide', 'blood urea nitrogen',
  'creatinine', 'glucose', 'albumin', 'total protein', 'alkaline phosphatase',
  'alanine aminotransferase', 'aspartate aminotransferase', 'total bilirubin',
  'direct bilirubin', 'indirect bilirubin',
  
  // Cardiac markers
  'troponin', 'creatine kinase', 'CK-MB', 'brain natriuretic peptide',
  'pro-BNP', 'myoglobin',
  
  // Coagulation
  'prothrombin time', 'partial thromboplastin time', 'international normalized ratio',
  'fibrinogen', 'D-dimer', 'fibrin degradation products',
  
  // Blood gases
  'arterial blood gas', 'venous blood gas', 'pH', 'partial pressure carbon dioxide',
  'partial pressure oxygen', 'bicarbonate', 'base excess', 'oxygen saturation',
  'lactate', 'anion gap',
  
  // Inflammatory markers
  'C-reactive protein', 'erythrocyte sedimentation rate', 'procalcitonin',
  
  // Endocrine
  'thyroid stimulating hormone', 'free thyroxine', 'free triiodothyronine',
  'hemoglobin A1c', 'fasting glucose', 'random glucose', 'insulin',
  'cortisol', 'adrenocorticotropic hormone'
];

// Medication Terms
export const medicationTerms = [
  // Routes
  'oral', 'intravenous', 'intramuscular', 'subcutaneous', 'topical',
  'inhalation', 'sublingual', 'rectal', 'transdermal', 'ophthalmic',
  'otic', 'nasal', 'per os', 'by mouth',
  
  // Frequencies
  'once daily', 'twice daily', 'three times daily', 'four times daily',
  'every four hours', 'every six hours', 'every eight hours', 'every twelve hours',
  'as needed', 'PRN', 'before meals', 'after meals', 'with meals',
  'at bedtime', 'in the morning', 'in the evening',
  
  // Common drug classes
  'antihypertensive', 'antibiotic', 'analgesic', 'anti-inflammatory',
  'anticoagulant', 'antiplatelet', 'beta blocker', 'ACE inhibitor',
  'ARB', 'calcium channel blocker', 'diuretic', 'statin', 'proton pump inhibitor',
  'H2 blocker', 'bronchodilator', 'corticosteroid', 'insulin', 'metformin',
  'aspirin', 'acetaminophen', 'ibuprofen', 'warfarin', 'heparin',
  'lisinopril', 'metoprolol', 'amlodipine', 'atorvastatin', 'omeprazole'
];

// Past Medical History Terms
export const pastMedicalHistoryTerms = [
  // Common conditions
  'diabetes mellitus', 'type 1 diabetes', 'type 2 diabetes', 'hypertension',
  'coronary artery disease', 'myocardial infarction', 'heart failure',
  'atrial fibrillation', 'chronic obstructive pulmonary disease', 'asthma',
  'chronic kidney disease', 'end stage renal disease', 'cerebrovascular accident',
  'transient ischemic attack', 'peripheral arterial disease', 'deep vein thrombosis',
  'pulmonary embolism', 'hyperlipidemia', 'hypothyroidism', 'hyperthyroidism',
  'osteoarthritis', 'rheumatoid arthritis', 'osteoporosis', 'depression',
  'anxiety', 'bipolar disorder', 'schizophrenia', 'dementia', 'Alzheimer disease',
  'Parkinson disease', 'epilepsy', 'migraine', 'gastroesophageal reflux disease',
  'peptic ulcer disease', 'inflammatory bowel disease', 'Crohn disease',
  'ulcerative colitis', 'cirrhosis', 'hepatitis B', 'hepatitis C', 'HIV',
  'cancer', 'breast cancer', 'lung cancer', 'colon cancer', 'prostate cancer'
];

// Assessment and Plan Terms
export const assessmentPlanTerms = [
  // Assessment descriptors
  'stable', 'unstable', 'improving', 'worsening', 'resolved', 'ongoing',
  'acute', 'chronic', 'exacerbation', 'remission', 'well-controlled',
  'poorly controlled', 'compensated', 'decompensated',
  
  // Plan actions
  'continue', 'discontinue', 'increase', 'decrease', 'titrate', 'monitor',
  'follow up', 'refer', 'consult', 'discharge', 'admit', 'observe',
  'repeat', 'obtain', 'order', 'schedule', 'recommend', 'advise',
  'educate', 'counsel',
  
  // Follow-up
  'return to clinic', 'follow up in', 'call if', 'emergency department',
  'primary care', 'specialist', 'cardiology', 'pulmonology', 'gastroenterology',
  'nephrology', 'neurology', 'endocrinology', 'rheumatology', 'oncology',
  'psychiatry', 'orthopedics', 'dermatology', 'ophthalmology', 'otolaryngology'
];

// Get contextual terms based on section
export function getContextualTerms(section) {
  const baseTerms = [...medicalRoots, ...medicalSuffixes];
  
  switch (section) {
    case 'hpi':
    case 'chief-complaint':
      return [...baseTerms, ...hpiTerms];
    
    case 'physical-exam':
      return [...baseTerms, ...physicalExamTerms];
    
    case 'lab-results':
    case 'laboratory':
      return [...baseTerms, ...laboratoryTerms];
    
    case 'medications':
      return [...baseTerms, ...medicationTerms];
    
    case 'past-medical-history':
    case 'pmh':
      return [...baseTerms, ...pastMedicalHistoryTerms];
    
    case 'assessment':
    case 'plan':
    case 'impression':
      return [...baseTerms, ...assessmentPlanTerms];
    
    default:
      // Return all terms for general medical context
      return [
        ...baseTerms,
        ...hpiTerms.slice(0, 20), // Limit to most common
        ...physicalExamTerms.slice(0, 30),
        ...laboratoryTerms.slice(0, 25),
        ...medicationTerms.slice(0, 20),
        ...pastMedicalHistoryTerms.slice(0, 25),
        ...assessmentPlanTerms.slice(0, 15)
      ];
  }
}

// Common medical abbreviations that should be recognized
export const medicalAbbreviations = {
  'BP': 'blood pressure',
  'HR': 'heart rate',
  'RR': 'respiratory rate',
  'O2 sat': 'oxygen saturation',
  'SOB': 'shortness of breath',
  'DOE': 'dyspnea on exertion',
  'PND': 'paroxysmal nocturnal dyspnea',
  'CP': 'chest pain',
  'MI': 'myocardial infarction',
  'CHF': 'congestive heart failure',
  'COPD': 'chronic obstructive pulmonary disease',
  'DM': 'diabetes mellitus',
  'HTN': 'hypertension',
  'CAD': 'coronary artery disease',
  'CVA': 'cerebrovascular accident',
  'TIA': 'transient ischemic attack',
  'DVT': 'deep vein thrombosis',
  'PE': 'pulmonary embolism',
  'GERD': 'gastroesophageal reflux disease',
  'UTI': 'urinary tract infection',
  'URI': 'upper respiratory infection',
  'CKD': 'chronic kidney disease',
  'ESRD': 'end stage renal disease'
};

export default {
  medicalRoots,
  medicalSuffixes,
  hpiTerms,
  physicalExamTerms,
  laboratoryTerms,
  medicationTerms,
  pastMedicalHistoryTerms,
  assessmentPlanTerms,
  medicalAbbreviations,
  getContextualTerms
};