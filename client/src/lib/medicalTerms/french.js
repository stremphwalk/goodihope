/**
 * French Medical Terminology Context for Soniox Transcription
 * Terminologie médicale française organisée par sections de documentation médicale
 */

// Racines médicales communes, préfixes et suffixes
export const medicalRoots = [
  'cardio', 'pulmo', 'hépatо', 'néphro', 'neuro', 'gastro', 'dermato', 'hémato',
  'ostéo', 'arthro', 'myo', 'encéphalo', 'angio', 'cysto', 'entéro', 'broncho',
  'pneumo', 'réno', 'spléno', 'thyro', 'adéno', 'chondro', 'fibro', 'lipo'
];

export const medicalSuffixes = [
  'ite', 'ose', 'émie', 'urie', 'pathie', 'trophie', 'scopie', 'tomie', 'ectomie',
  'plastie', 'stomie', 'lyse', 'genèse', 'phobie', 'philie', 'algie', 'dynie'
];

// Termes de l'Histoire de la Maladie Actuelle (HMA)
export const hpiTerms = [
  // Descripteurs de symptômes
  'aigu', 'chronique', 'intermittent', 'constant', 'progressif', 'stable',
  'aigu', 'sourd', 'lancinant', 'brûlant', 'crampoïde', 'douloureux', 'poignardant',
  'irradiant', 'localisé', 'diffus', 'bilatéral', 'unilatéral',
  
  // Échelles de sévérité
  'léger', 'modéré', 'sévère', 'atroce', 'tolérable', 'intolérable',
  
  // Temporalité
  'début soudain', 'début graduel', 'matin', 'soir', 'nocturne',
  'post-prandial', 'pré-prandial', 'à l\'effort', 'au repos',
  
  // Symptômes courants
  'douleur thoracique', 'essoufflement', 'dyspnée', 'palpitations', 'syncope',
  'présyncope', 'étourdissements', 'céphalée', 'nausée', 'vomissement', 'diarrhée',
  'constipation', 'douleur abdominale', 'mal de dos', 'douleur articulaire', 'douleur musculaire',
  'fatigue', 'faiblesse', 'fièvre', 'frissons', 'sueurs nocturnes', 'perte de poids',
  'gain de poids', 'perte d\'appétit', 'anorexie', 'polyurie', 'polydipsie',
  'polyphagie', 'dysurie', 'hématurie', 'hémoptysie', 'hématémèse',
  'méléna', 'hématochézie', 'orthopnée', 'dyspnée paroxystique nocturne'
];

// Termes d'Examen Physique
export const physicalExamTerms = [
  // Apparence générale
  'bonne apparence', 'mauvaise apparence', 'apparence toxique', 'en détresse',
  'confortable', 'alerte', 'orienté', 'coopératif', 'anxieux', 'léthargique',
  
  // Signes vitaux
  'tension artérielle', 'fréquence cardiaque', 'fréquence respiratoire', 'température',
  'saturation en oxygène', 'oxymétrie de pouls', 'orthostatique', 'hypertension',
  'hypotension', 'tachycardie', 'bradycardie', 'tachypnée', 'bradypnée',
  'fièvre', 'afébrile', 'hypothermie',
  
  // Tête et cou
  'normocéphale', 'atraumatique', 'pupilles égales rondes réactives à la lumière',
  'mouvements oculaires intacts', 'ictère scléral', 'pâleur conjonctivale',
  'lymphadénopathie', 'thyromégalie', 'raideur de nuque', 'souffle carotidien',
  'distension veineuse jugulaire',
  
  // Cardiovasculaire
  'rythme et fréquence réguliers', 'rythme irrégulier', 'souffle', 'galop',
  'frottement', 'clic', 'pouls périphériques', 'remplissage capillaire', 'œdème',
  'cyanose', 'hippocratisme digital', 'choc de pointe',
  
  // Respiratoire
  'clair à l\'auscultation', 'ronchus', 'râles', 'crépitants', 'sibilants',
  'stridor', 'diminution des bruits respiratoires', 'absence des bruits respiratoires',
  'matité à la percussion', 'hyperrésonance', 'frémissement tactile',
  'égophonie', 'pectoriloquie aphone',
  
  // Abdominal
  'souple', 'non sensible', 'non distendu', 'bruits intestinaux', 'hyperactifs',
  'hypoactifs', 'absents', 'hépatomégalie', 'splénomégalie', 'masses',
  'sensibilité de rebond', 'défense', 'rigidité', 'signe de Murphy', 'point de McBurney',
  
  // Neurologique
  'nerfs crâniens intacts', 'force motrice', 'sensibilité intacte', 'réflexes',
  'coordination', 'démarche', 'Romberg', 'Babinski', 'clonus', 'fasciculations',
  'tremblement', 'dysmétrie', 'dysdiadococinésie',
  
  // Musculosquelettique
  'amplitude de mouvement', 'gonflement articulaire', 'déformation articulaire', 'crépitation',
  'atrophie musculaire', 'faiblesse musculaire', 'sensibilité', 'épanchement'
];

// Termes de Laboratoire
export const laboratoryTerms = [
  // FSC (Formule sanguine complète)
  'formule sanguine complète', 'numération des globules blancs', 'hémoglobine', 'hématocrite',
  'numération plaquettaire', 'volume globulaire moyen', 'distribution des globules rouges',
  'neutrophiles', 'lymphocytes', 'monocytes', 'éosinophiles', 'basophiles',
  'formes jeunes', 'blastes', 'schizocytes', 'sphérocytes',
  
  // Chimie
  'panel métabolique de base', 'panel métabolique complet', 'sodium',
  'potassium', 'chlorure', 'dioxyde de carbone', 'urée sanguine',
  'créatinine', 'glucose', 'albumine', 'protéine totale', 'phosphatase alcaline',
  'alanine aminotransférase', 'aspartate aminotransférase', 'bilirubine totale',
  'bilirubine directe', 'bilirubine indirecte',
  
  // Marqueurs cardiaques
  'troponine', 'créatine kinase', 'CK-MB', 'peptide natriurétique cérébral',
  'pro-BNP', 'myoglobine',
  
  // Coagulation
  'temps de prothrombine', 'temps de thromboplastine partielle', 'rapport international normalisé',
  'fibrinogène', 'D-dimères', 'produits de dégradation de la fibrine',
  
  // Gaz sanguins
  'gaz sanguin artériel', 'gaz sanguin veineux', 'pH', 'pression partielle de dioxyde de carbone',
  'pression partielle d\'oxygène', 'bicarbonate', 'excès de base', 'saturation en oxygène',
  'lactate', 'trou anionique',
  
  // Marqueurs inflammatoires
  'protéine C réactive', 'vitesse de sédimentation', 'procalcitonine',
  
  // Endocrinien
  'hormone stimulant la thyroïde', 'thyroxine libre', 'triiodothyronine libre',
  'hémoglobine glyquée A1c', 'glucose à jeun', 'glucose aléatoire', 'insuline',
  'cortisol', 'hormone adrénocorticotrope'
];

// Termes de Médicaments
export const medicationTerms = [
  // Voies d'administration
  'oral', 'intraveineux', 'intramusculaire', 'sous-cutané', 'topique',
  'inhalation', 'sublingual', 'rectal', 'transdermique', 'ophtalmique',
  'otique', 'nasal', 'per os', 'par la bouche',
  
  // Fréquences
  'une fois par jour', 'deux fois par jour', 'trois fois par jour', 'quatre fois par jour',
  'toutes les quatre heures', 'toutes les six heures', 'toutes les huit heures', 'toutes les douze heures',
  'au besoin', 'PRN', 'avant les repas', 'après les repas', 'avec les repas',
  'au coucher', 'le matin', 'le soir',
  
  // Classes de médicaments courantes
  'antihypertenseur', 'antibiotique', 'analgésique', 'anti-inflammatoire',
  'anticoagulant', 'antiplaquettaire', 'bêta-bloquant', 'inhibiteur de l\'ECA',
  'ARA', 'bloqueur des canaux calciques', 'diurétique', 'statine', 'inhibiteur de la pompe à protons',
  'bloqueur H2', 'bronchodilatateur', 'corticostéroïde', 'insuline', 'metformine',
  'aspirine', 'acétaminophène', 'ibuprofène', 'warfarine', 'héparine',
  'lisinopril', 'métoprolol', 'amlodipine', 'atorvastatine', 'oméprazole'
];

// Termes d'Antécédents Médicaux
export const pastMedicalHistoryTerms = [
  // Conditions courantes
  'diabète sucré', 'diabète de type 1', 'diabète de type 2', 'hypertension',
  'maladie coronarienne', 'infarctus du myocarde', 'insuffisance cardiaque',
  'fibrillation auriculaire', 'maladie pulmonaire obstructive chronique', 'asthme',
  'maladie rénale chronique', 'insuffisance rénale terminale', 'accident vasculaire cérébral',
  'accident ischémique transitoire', 'maladie artérielle périphérique', 'thrombose veineuse profonde',
  'embolie pulmonaire', 'hyperlipidémie', 'hypothyroïdie', 'hyperthyroïdie',
  'arthrose', 'polyarthrite rhumatoïde', 'ostéoporose', 'dépression',
  'anxiété', 'trouble bipolaire', 'schizophrénie', 'démence', 'maladie d\'Alzheimer',
  'maladie de Parkinson', 'épilepsie', 'migraine', 'reflux gastro-œsophagien',
  'ulcère gastroduodénal', 'maladie inflammatoire de l\'intestin', 'maladie de Crohn',
  'colite ulcéreuse', 'cirrhose', 'hépatite B', 'hépatite C', 'VIH',
  'cancer', 'cancer du sein', 'cancer du poumon', 'cancer du côlon', 'cancer de la prostate'
];

// Termes d'Évaluation et Plan
export const assessmentPlanTerms = [
  // Descripteurs d'évaluation
  'stable', 'instable', 'amélioration', 'détérioration', 'résolu', 'en cours',
  'aigu', 'chronique', 'exacerbation', 'rémission', 'bien contrôlé',
  'mal contrôlé', 'compensé', 'décompensé',
  
  // Actions du plan
  'continuer', 'cesser', 'augmenter', 'diminuer', 'titrer', 'surveiller',
  'suivi', 'référer', 'consulter', 'congé', 'admission', 'observer',
  'répéter', 'obtenir', 'commander', 'planifier', 'recommander', 'conseiller',
  'éduquer', 'counseling',
  
  // Suivi
  'retour en clinique', 'suivi dans', 'appeler si', 'urgence',
  'soins primaires', 'spécialiste', 'cardiologie', 'pneumologie', 'gastroentérologie',
  'néphrologie', 'neurologie', 'endocrinologie', 'rhumatologie', 'oncologie',
  'psychiatrie', 'orthopédie', 'dermatologie', 'ophtalmologie', 'oto-rhino-laryngologie'
];

// Obtenir les termes contextuels selon la section
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
      // Retourner tous les termes pour le contexte médical général
      return [
        ...baseTerms,
        ...hpiTerms.slice(0, 20), // Limiter aux plus courants
        ...physicalExamTerms.slice(0, 30),
        ...laboratoryTerms.slice(0, 25),
        ...medicationTerms.slice(0, 20),
        ...pastMedicalHistoryTerms.slice(0, 25),
        ...assessmentPlanTerms.slice(0, 15)
      ];
  }
}

// Abréviations médicales courantes qui doivent être reconnues
export const medicalAbbreviations = {
  'TA': 'tension artérielle',
  'FC': 'fréquence cardiaque',
  'FR': 'fréquence respiratoire',
  'SatO2': 'saturation en oxygène',
  'SOB': 'essoufflement',
  'DOE': 'dyspnée à l\'effort',
  'DPN': 'dyspnée paroxystique nocturne',
  'DT': 'douleur thoracique',
  'IDM': 'infarctus du myocarde',
  'IC': 'insuffisance cardiaque',
  'MPOC': 'maladie pulmonaire obstructive chronique',
  'DM': 'diabète sucré',
  'HTA': 'hypertension artérielle',
  'MRC': 'maladie rénale chronique',
  'AVC': 'accident vasculaire cérébral',
  'AIT': 'accident ischémique transitoire',
  'TVP': 'thrombose veineuse profonde',
  'EP': 'embolie pulmonaire',
  'RGO': 'reflux gastro-œsophagien',
  'IVU': 'infection des voies urinaires',
  'IVRS': 'infection des voies respiratoires supérieures',
  'MRC': 'maladie rénale chronique',
  'IRT': 'insuffisance rénale terminale'
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