import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Header
    'app.title': 'Review of Systems',
    'app.subtitle': 'Medical Documentation Tool',
    'language.select': 'Language',
    
    // Note Types
    'noteType.label': 'Note Type',
    'noteType.admission': 'Admission',
    'noteType.progress': 'Progress',
    'noteType.consultation': 'Consultation',
    'noteType.icuAdmission': 'ICU Admission',
    'noteType.icuProgress': 'ICU Progress',
    
    // Admission/Progress subtypes
    'admission.general': 'General Admission',
    'admission.icu': 'ICU Admission',
    'progress.general': 'General Progress',
    'progress.icu': 'ICU Progress',
    'admission.general.desc': 'Standard ward admission',
    'admission.icu.desc': 'ICU systems-based note',
    'progress.general.desc': 'Standard progress note',
    'progress.icu.desc': 'ICU progress note',
    'consultation.desc': 'Specialist evaluation',
    
    // Physical Examination
    'physicalExam.title': 'Physical Examination',
    'physicalExam.general': 'General',
    'physicalExam.heent': 'HEENT',
    'physicalExam.cardiovascular': 'Cardiovascular',
    'physicalExam.respiratory': 'Respiratory',
    'physicalExam.abdominal': 'Abdominal',
    'physicalExam.neurological': 'Neurological',
    'physicalExam.musculoskeletal': 'Musculoskeletal',
    'physicalExam.integumentary': 'Integumentary',
    
    // Laboratory Results
    'labResults.title': 'Laboratory Results',
    'labResults.bloodGases': 'Blood Gases',
    'labResults.cbc': 'CBC',
    'labResults.bmp': 'BMP',
    'labResults.lft': 'LFT',
    'labResults.coagulation': 'Coagulation',
    'labResults.cardiac': 'Cardiac Markers',
    'labResults.endocrine': 'Endocrine',
    'labResults.renal': 'Renal Function',
    'labResults.inflammatory': 'Inflammatory Markers',
    'labResults.lipid': 'Lipid Panel',
    'labResults.arterial': 'Arterial',
    'labResults.venous': 'Venous',
    'labResults.capillary': 'Capillary',
    
    // Intubation Parameters
    'intubation.title': 'Intubation Parameters',
    'intubation.ventilatorMode': 'Ventilator Mode',
    'intubation.tidalVolume': 'Tidal Volume',
    'intubation.respiratoryRate': 'Respiratory Rate',
    'intubation.peep': 'PEEP',
    'intubation.fio2': 'FiO2',
    'intubation.plateauPressure': 'Plateau Pressure',
    'intubation.peakPressure': 'Peak Pressure',
    'intubation.meanAirwayPressure': 'Mean Airway Pressure',
    
    // Buttons
    'button.generateNote': 'Generate Note',
    'button.copyNote': 'Copy Note',
    'button.clearAll': 'Clear All Fields',
    'button.clear': 'Clear',
    'button.addTrend': 'Add Trend',
    'button.close': 'Close',
    
    // Messages
    'message.noteGenerated': 'Note generated successfully',
    'message.noteCopied': 'Note copied to clipboard',
    'message.fieldsCleared': 'All fields cleared',
    'message.noDataEntered': 'Please enter some examination findings or lab results to generate a note',
    
    // Physical Exam Options
    'pe.general.normal': 'Well-appearing, no acute distress',
    'pe.general.illAppearing': 'Ill-appearing',
    'pe.general.distress': 'In acute distress',
    'pe.heent.normal': 'Normocephalic, atraumatic',
    'pe.heent.abnormal': 'Abnormal findings',
    'pe.cv.rrr': 'Regular rate and rhythm',
    'pe.cv.murmur': 'Murmur present',
    'pe.resp.clear': 'Clear to auscultation bilaterally',
    'pe.resp.abnormal': 'Abnormal breath sounds',
    'pe.abd.soft': 'Soft, non-tender, non-distended',
    'pe.abd.abnormal': 'Abnormal findings',
    'pe.neuro.intact': 'Neurologically intact',
    'pe.neuro.abnormal': 'Abnormal neurological findings',
    'pe.msk.normal': 'Normal range of motion',
    'pe.msk.abnormal': 'Abnormal findings',
    'pe.skin.normal': 'No rashes or lesions',
    'pe.skin.abnormal': 'Abnormal skin findings',
    
    // Lab Categories
    'labs.cbc': 'CBC',
    'labs.bmp': 'BMP',
    'labs.lft': 'LFT',
    'labs.coagulation': 'Coagulation',
    'labs.cardiac': 'Cardiac Markers',
    'labs.endocrine': 'Endocrine',
    'labs.renal': 'Renal Function',
    'labs.inflammatory': 'Inflammatory Markers',
    'labs.lipid': 'Lipid Panel',
    
    // Individual Lab Test Names
    'lab.test.whiteBloodCells': 'White Blood Cells',
    'lab.test.redBloodCells': 'Red Blood Cells',
    'lab.test.hemoglobin': 'Hemoglobin',
    'lab.test.hematocrit': 'Hematocrit',
    'lab.test.platelets': 'Platelets',
    'lab.test.sodium': 'Sodium',
    'lab.test.potassium': 'Potassium',
    'lab.test.chloride': 'Chloride',
    'lab.test.bicarbonate': 'Bicarbonate',
    'lab.test.glucose': 'Glucose',
    'lab.test.creatinine': 'Creatinine',
    'lab.test.bun': 'BUN',
    'lab.test.urea': 'Urea',
    'lab.test.alkalinePhosphatase': 'Alkaline Phosphatase',
    'lab.test.totalBilirubin': 'Total Bilirubin',
    'lab.test.albumin': 'Albumin',
    'lab.test.prothrombinTime': 'Prothrombin Time',
    'lab.test.partialThromboplastinTime': 'Partial Thromboplastin Time',
    'lab.test.cReactiveProtein': 'C-Reactive Protein',
    'lab.test.esr': 'ESR',
    'lab.test.procalcitonin': 'Procalcitonin',
    'lab.test.baseExcess': 'Base Excess',
    'lab.test.troponin': 'Troponin',
    'lab.test.ck_mb': 'CK-MB',
    'lab.test.bnp': 'BNP',
    'lab.test.lactate': 'Lactate',
    
    // Note sections
    'note.physical': 'PHYSICAL EXAMINATION',
    'note.respiratory': 'RESPIRATORY',
    'note.cardiovascular': 'CARDIOVASCULAR',
    'note.neurological': 'NEUROLOGICAL',
    'note.abdominal': 'ABDOMINAL',
    'note.genitourinary': 'GENITOURINARY',
    'note.musculoskeletal': 'MUSCULOSKELETAL',
    'note.integumentary': 'INTEGUMENTARY',
    'note.heent': 'HEENT',
    
    // Blood gas types
    'bloodgas.arterial': 'Arterial blood gas',
    'bloodgas.venous': 'Venous blood gas',
    'bloodgas.capillary': 'Capillary blood gas',
    
    // Nav
    'nav.medicalNotes': 'Medical Notes',
    'nav.dotPhrases': 'Dot Phrases',
    'nav.brand': 'AriNote',
    'nav.medicalNotes.desc': 'Create medical documentation',
    'nav.dotPhrases.desc': 'Manage shortcuts',
    'nav.calculations': 'Calculations',
    'nav.calculations.desc': 'Medical calculators and scores',
    'dotManager.title': 'Dot Phrase Manager',
    'dotManager.subtitle': 'Create and manage your custom medical documentation shortcuts',
    'dotManager.howTo': 'How to Use Dot Phrases',
    'dotManager.triggers': 'Triggers',
    'dotManager.triggersDesc': 'Start with "/" (e.g., /chest, /neuro)',
    'dotManager.smartOptions': 'Smart Options',
    'dotManager.smartOptionsDesc': 'Insert interactive choices anywhere in your phrase using the Add Smart Option button. These will appear as dropdowns when using the phrase.',
    'dotManager.example': 'Example',
    'dotManager.exampleDesc': 'Patient presents with chest pain, sharp/dull/crushing, radiating to left arm/jaw/back',
    'dotManager.searchPlaceholder': 'Search dot phrases...',
    'dotManager.allCategories': 'All Categories',
    'dotManager.newPhrase': 'New Phrase',
    'dotManager.noPhrases': 'No custom dot phrases yet. Create your first one!',
    'dotManager.category': 'Category',
    'dotManager.trigger': 'Trigger (with /)',
    'dotManager.description': 'Description',
    'dotManager.content': 'Content',
    'dotManager.preview': 'Preview',
    'dotManager.smartOptionsDetected': 'Smart options detected: {count} choice(s)',
    'dotManager.update': 'Update',
    'dotManager.create': 'Create',
    'dotManager.cancel': 'Cancel',
    'dotManager.edit': 'Edit Dot Phrase',
    'dotManager.createNew': 'Create New Dot Phrase',
    'dotManager.updateExisting': 'Update your existing dot phrase',
    'dotManager.addNew': 'Add a new shortcut to your collection',
    'dotManager.totalPhrases': '{count} total phrases',
    'dotManager.withSmartOptions': '{count} with smart options',
    'dotManager.categoriesUsed': '{count} categories used',
    'dotManager.noMatch': 'No dot phrases match your search criteria.',
    'dotManager.noCustom': 'No custom dot phrases yet. Create your first one!',
    'dotManager.addSmartOption': 'Add Smart Option',
    'dotManager.smartOptionsHint': 'Insert interactive choices anywhere in your phrase.',
    'dotManager.insertSmartOptionTitle': 'Insert Smart Option',
    'dotManager.insertSmartOptionDesc': 'Enter each choice below. These will appear as a dropdown when using the phrase.',
    'dotManager.addAnotherOption': 'Add another option',
    'dotManager.moreSmartOptionsSoon': 'More smart options coming soon...',
    'dotManager.insert': 'Insert',
    'dotManager.tabDropdown': 'Dropdown Choices',
    'dotManager.tabDate': 'Date Picker',
    'dotManager.datePickerDesc': 'Insert a date field (e.g., for follow-up).',
    'dotManager.datePickerExample': 'Example: [Date]'
  },
  fr: {
    // Header
    'app.title': 'Revue des Systèmes',
    'app.subtitle': 'Outil de Documentation Médicale',
    'language.select': 'Langue',
    
    // Note Types
    'noteType.label': 'Type de note',
    'noteType.admission': 'Admission',
    'noteType.progress': 'Évolution',
    'noteType.consultation': 'Consultation',
    'noteType.admission.desc': 'Évaluation initiale du patient',
    'noteType.progress.desc': 'Mise à jour quotidienne du patient',
    'noteType.consultation.desc': 'Évaluation spécialisée',
    'noteType.icuAdmission': 'Admission USI',
    'noteType.icuProgress': 'Évolution USI',
    
    // Physical Examination
    'physicalExam.title': 'Examen Physique',
    'physicalExam.general': 'Général',
    'physicalExam.heent': 'Tête et Cou',
    'physicalExam.cardiovascular': 'Cardiovasculaire',
    'physicalExam.respiratory': 'Respiratoire',
    'physicalExam.abdominal': 'Abdominal',
    'physicalExam.neurological': 'Neurologique',
    'physicalExam.musculoskeletal': 'Musculosquelettique',
    'physicalExam.integumentary': 'Tégumentaire',
    
    // Laboratory Results
    'labResults.title': 'Résultats de Laboratoire',
    'labResults.bloodGases': 'Gaz Sanguins',
    'labResults.cbc': 'FSC',
    'labResults.bmp': 'Panel Métabolique',
    'labResults.lft': 'Fonction Hépatique',
    'labResults.coagulation': 'Coagulation',
    'labResults.cardiac': 'Marqueurs Cardiaques',
    'labResults.endocrine': 'Endocrinien',
    'labResults.renal': 'Fonction Rénale',
    'labResults.inflammatory': 'Marqueurs Inflammatoires',
    'labResults.lipid': 'Profil Lipidique',
    'labResults.arterial': 'Artériel',
    'labResults.venous': 'Veineux',
    'labResults.capillary': 'Capillaire',
    
    // Intubation Parameters
    'intubation.title': 'Paramètres d\'Intubation',
    'intubation.ventilatorMode': 'Mode Ventilatoire',
    'intubation.tidalVolume': 'Volume Courant',
    'intubation.respiratoryRate': 'Fréquence Respiratoire',
    'intubation.peep': 'PEEP',
    'intubation.fio2': 'FiO2',
    'intubation.plateauPressure': 'Pression de Plateau',
    'intubation.peakPressure': 'Pression de Pointe',
    'intubation.meanAirwayPressure': 'Pression Moyenne des Voies Aériennes',
    
    // Buttons
    'button.generateNote': 'Générer la Note',
    'button.copyNote': 'Copier la Note',
    'button.clearAll': 'Effacer Tous les Champs',
    'button.clear': 'Effacer',
    'button.addTrend': 'Ajouter Tendance',
    'button.close': 'Fermer',
    
    // Messages
    'message.noteGenerated': 'Note générée avec succès',
    'message.noteCopied': 'Note copiée dans le presse-papiers',
    'message.fieldsCleared': 'Tous les champs effacés',
    'message.noDataEntered': 'Veuillez entrer des résultats d\'examen ou de laboratoire pour générer une note',
    
    // Physical Exam Options
    'pe.general.normal': 'Apparence normale, pas de détresse aiguë',
    'pe.general.illAppearing': 'Apparence malade',
    'pe.general.distress': 'En détresse aiguë',
    'pe.heent.normal': 'Normocéphale, atraumatique',
    'pe.heent.abnormal': 'Résultats anormaux',
    'pe.cv.rrr': 'Rythme et fréquence réguliers',
    'pe.cv.murmur': 'Souffle présent',
    'pe.resp.clear': 'Clair à l\'auscultation bilatérale',
    'pe.resp.abnormal': 'Bruits respiratoires anormaux',
    'pe.abd.soft': 'Souple, non sensible, non distendu',
    'pe.abd.abnormal': 'Résultats anormaux',
    'pe.neuro.intact': 'Neurologiquement intact',
    'pe.neuro.abnormal': 'Résultats neurologiques anormaux',
    'pe.msk.normal': 'Amplitude de mouvement normale',
    'pe.msk.abnormal': 'Résultats anormaux',
    'pe.skin.normal': 'Pas d\'éruptions ou de lésions',
    'pe.skin.abnormal': 'Résultats cutanés anormaux',
    
    // Lab Categories
    'labs.cbc': 'FSC',
    'labs.bmp': 'Chimie',
    'labs.lft': 'Bilan hépatique',
    'labs.coagulation': 'Coagulation',
    'labs.cardiac': 'Cardiaque',
    'labs.endocrine': 'Endocrinien',
    'labs.renal': 'Fonction Rénale',
    'labs.inflammatory': 'Inflammatoire',
    'labs.lipid': 'Profil Lipidique',
    
    // Individual Lab Test Names
    'lab.test.whiteBloodCells': 'Globules blancs',
    'lab.test.redBloodCells': 'Globules rouges',
    'lab.test.hemoglobin': 'Hémoglobine',
    'lab.test.hematocrit': 'Hématocrite',
    'lab.test.platelets': 'Plaquettes',
    'lab.test.sodium': 'Sodium',
    'lab.test.potassium': 'Potassium',
    'lab.test.chloride': 'Chlorure',
    'lab.test.bicarbonate': 'Bicarbonate',
    'lab.test.glucose': 'Glucose',
    'lab.test.creatinine': 'Créatinine',
    'lab.test.bun': 'Urée sanguine',
    'lab.test.urea': 'Urée',
    'lab.test.alkalinePhosphatase': 'Phosphatase alcaline',
    'lab.test.totalBilirubin': 'Bilirubine totale',
    'lab.test.albumin': 'Albumine',
    'lab.test.prothrombinTime': 'Temps de prothrombine',
    'lab.test.partialThromboplastinTime': 'Temps de thromboplastine partielle',
    'lab.test.cReactiveProtein': 'Protéine C-réactive',
    'lab.test.esr': 'Vitesse de sédimentation',
    'lab.test.procalcitonin': 'Procalcitonine',
    'lab.test.baseExcess': 'Excès de base',
    'lab.test.troponin': 'Troponine',
    'lab.test.ck_mb': 'CK-MB',
    'lab.test.bnp': 'BNP',
    'lab.test.lactate': 'Lactate',
    
    // Additional lab tests that may appear
    'lab.test.alt': 'ALT',
    'lab.test.ast': 'AST',
    'lab.test.alp': 'ALP',
    'lab.test.co2': 'CO2',
    'lab.test.pt': 'TP',
    'lab.test.inr': 'INR',
    'lab.test.ptt': 'TCA',
    'lab.test.ph': 'pH',
    'lab.test.pco2': 'pCO2',
    'lab.test.po2': 'pO2',
    'lab.test.hco3': 'HCO3',
    'lab.test.o2sat': 'SatO2',
    
    // Note sections
    'note.physical': 'EXAMEN PHYSIQUE',
    'note.respiratory': 'RESPIRATOIRE',
    'note.cardiovascular': 'CARDIOVASCULAIRE',
    'note.neurological': 'NEUROLOGIQUE',
    'note.abdominal': 'ABDOMINAL',
    'note.genitourinary': 'GÉNITO-URINAIRE',
    'note.musculoskeletal': 'MUSCULOSQUELETTIQUE',
    'note.integumentary': 'TÉGUMENTAIRE',
    'note.heent': 'TÊTE ET COU',
    
    // Blood gas types
    'bloodgas.arterial': 'Gaz sanguin artériel',
    'bloodgas.venous': 'Gaz sanguin veineux',
    'bloodgas.capillary': 'Gaz sanguin capillaire',
    
    // Lab test names
    'lab.wbc': 'Globules blancs',
    'lab.rbc': 'Globules rouges',
    'lab.hemoglobin': 'Hémoglobine',
    'lab.hematocrit': 'Hématocrite',
    'lab.platelets': 'Plaquettes',
    'lab.sodium': 'Sodium',
    'lab.potassium': 'Potassium',
    'lab.chloride': 'Chlorure',
    'lab.co2': 'CO2',
    'lab.bun': 'Urée',
    'lab.creatinine': 'Créatinine',
    'lab.glucose': 'Glucose',
    'lab.alt': 'ALT',
    'lab.ast': 'AST',
    'lab.bilirubin': 'Bilirubine',
    'lab.alkalinephosphatase': 'Phosphatase alcaline',
    'lab.albumin': 'Albumine',
    'lab.pt': 'TP',
    'lab.ptt': 'TCA',
    'lab.inr': 'RIN',
    'lab.troponin': 'Troponine',
    'lab.ckMb': 'CK-MB',
    'lab.bnp': 'BNP',
    'lab.tsh': 'TSH',
    'lab.t4': 'T4',
    'lab.crp': 'CRP',
    'lab.esr': 'VS',
    'lab.procalcitonin': 'Procalcitonine',
    'lab.cholesterol': 'Cholestérol',
    'lab.triglycerides': 'Triglycérides',
    'lab.hdl': 'HDL',
    'lab.ldl': 'LDL',
    'lab.ph': 'pH',
    'lab.pco2': 'pCO2',
    'lab.po2': 'pO2',
    'lab.hco3': 'HCO3',
    'lab.baseExcess': 'Excès de base',
    'lab.lactate': 'Lactate',
    
    // Ventilator settings
    'vent.settings': 'Paramètres du ventilateur',
    'vent.mode.acvc': 'AC/VC',
    'vent.mode.simv': 'SIMV',
    'vent.mode.psv': 'PSV',
    'vent.mode.cpap': 'CPAP',
    'vent.mode.bipap': 'BiPAP',
    
    // Interface sections
    'section.reviewOfSystems': 'Revue des systèmes',
    'section.physicalExam': 'Examen physique',
    'section.labResults': 'Résultats de laboratoire',
    'section.intubationParams': 'Paramètres d\'Intubation',
    'section.generatedNote': 'Note Générée',
    
    // Admission/Progress subtypes
    'admission.general': 'Admission générale',
    'admission.icu': 'Admission USI',
    'progress.general': 'Évolution générale',
    'progress.icu': 'Évolution USI',
    'admission.general.desc': 'Admission standard en service',
    'admission.icu.desc': 'Note USI par systèmes',
    'progress.general.desc': 'Note d\'évolution standard',
    'progress.icu.desc': 'Note d\'évolution USI',
    'consultation.desc': 'Évaluation spécialisée',
    
    // Physical exam systems
    'pe.system.general': 'Général',
    'pe.system.heent': 'Tête et Cou',
    'pe.system.cardiovascular': 'Cardiovasculaire',
    'pe.system.respiratory': 'Respiratoire',
    'pe.system.abdominal': 'Abdominal',
    'pe.system.neurological': 'Neurologique',
    'pe.system.musculoskeletal': 'Musculosquelettique',
    'pe.system.integumentary': 'Tégumentaire',
    
    // Common interface text
    'text.normal': 'Normal',
    'text.abnormal': 'Anormal',
    'text.trending': 'Tendances',
    'text.current': 'Actuel',
    'text.past': 'Antérieur',
    'text.bloodGasType': 'Type de gaz sanguin',
    
    // Review of Systems options
    'ros.general': 'Général',
    'ros.cardiovascular': 'Cardiovasculaire',
    'ros.respiratory': 'Respiratoire',
    'ros.gastrointestinal': 'Gastro-intestinal',
    'ros.genitourinary': 'Génito-urinaire',
    'ros.neurological': 'Neurologique',
    'ros.musculoskeletal': 'Musculosquelettique',
    'ros.integumentary': 'Tégumentaire',
    'ros.heent': 'Tête et cou',
    'ros.endocrine': 'Endocrinien',
    'ros.hematologic': 'Hématologique',
    'ros.psychiatric': 'Psychiatrique',
    
    // Physical Examination options
    'pe.general': 'Général',
    'pe.heent': 'Tête et cou',
    'pe.cardiovascular': 'Cardiovasculaire',
    'pe.respiratory': 'Respiratoire',
    'pe.abdominal': 'Abdominal',
    'pe.neurological': 'Neurologique',
    'pe.musculoskeletal': 'Musculosquelettique',
    'pe.integumentary': 'Tégumentaire',
    'pe.extremities': 'Extrémités',
    
    // Laboratory categories
    'lab.category.cbc': 'FSC',
    'lab.category.bmp': 'Chimie',
    'lab.category.lft': 'Bilan hépatique',
    'lab.category.coagulation': 'Coagulation',
    'lab.category.cardiac': 'Cardiaque',
    'lab.category.endocrine': 'Endocrinien',
    'lab.category.renal': 'Fonction rénale',
    'lab.category.inflammatory': 'Inflammatoire',
    'lab.category.lipid': 'Profil lipidique',
    'lab.category.bloodgases': 'Gaz',
    
    // Additional buttons and actions
    'text.characterCount': 'Nombre de caractères',
    'text.total': 'Total',
    
    // French clinical findings for ROS
    'ros.findings.general.detailed': 'Absence de fièvre, frissons, sueurs nocturnes ou perte de poids',
    'ros.findings.general.concise': 'Aucun symptôme constitutionnel',
    'ros.findings.heent.detailed': 'Absence de céphalées, troubles visuels, perte auditive, mal de gorge ou congestion nasale',
    'ros.findings.heent.concise': 'Aucun symptôme ORL',
    'ros.findings.cardiovascular.detailed': 'Absence de douleur thoracique, palpitations, dyspnée ou œdème des membres inférieurs',
    'ros.findings.cardiovascular.concise': 'Aucun symptôme cardiovasculaire',
    'ros.findings.respiratory.detailed': 'Absence de toux, dyspnée, sibilances ou oppression thoracique',
    'ros.findings.respiratory.concise': 'Aucun symptôme respiratoire',
    'ros.findings.gastrointestinal.detailed': 'Absence de douleur abdominale, nausées, vomissements, diarrhée ou constipation',
    'ros.findings.gastrointestinal.concise': 'Aucun symptôme gastro-intestinal',
    'ros.findings.genitourinary.detailed': 'Absence de pollakiurie, urgence mictionnelle, dysurie ou hématurie',
    'ros.findings.genitourinary.concise': 'Aucun symptôme génito-urinaire',
    'ros.findings.musculoskeletal.detailed': 'Absence de douleur articulaire, myalgies, dorsalgies ou raideur',
    'ros.findings.musculoskeletal.concise': 'Aucun symptôme musculosquelettique',
    'ros.findings.neurological.detailed': 'Absence de céphalées, étourdissements, faiblesse, engourdissements ou troubles de coordination',
    'ros.findings.neurological.concise': 'Aucun symptôme neurologique',
    'ros.findings.psychiatric.detailed': 'Absence de dépression, anxiété, changements d\'humeur ou troubles du sommeil',
    'ros.findings.psychiatric.concise': 'Aucun symptôme psychiatrique',
    'ros.findings.skin.detailed': 'Absence d\'éruptions cutanées, lésions, prurit ou changements des grains de beauté',
    'ros.findings.skin.concise': 'Aucun symptôme cutané',
    'ros.findings.endocrine.detailed': 'Absence d\'intolérance à la chaleur ou au froid, soif excessive ou changements d\'appétit',
    'ros.findings.endocrine.concise': 'Aucun symptôme endocrinien',
    'ros.findings.hematologic.detailed': 'Absence de saignements anormaux, ecchymoses faciles ou fatigue excessive',
    'ros.findings.hematologic.concise': 'Aucun symptôme hématologique',
    
    // French Physical Examination findings
    'pe.findings.general': 'Examen général : Patient alerte et coopératif, sans détresse aiguë',
    'pe.findings.heent': 'Tête et cou : Examen normal, sans lymphadénopathie',
    'pe.findings.cardiovascular': 'Cardiovasculaire : Rythme cardiaque régulier, pas de souffle',
    'pe.findings.respiratory': 'Respiratoire : Bruits respiratoires normaux bilatéralement',
    'pe.findings.gastrointestinal': 'Gastro-intestinal : Abdomen souple, bruits intestinaux normaux',
    'pe.findings.genitourinary': 'Génito-urinaire : Examen normal',
    'pe.findings.neurological': 'Neurologique : Fonction neurologique normale',
    'pe.findings.musculoskeletal': 'Musculosquelettique : Amplitude de mouvement normale',
    'pe.findings.skin': 'Tégumentaire : Peau intacte, pas de lésions',
    'pe.findings.extremities': 'Extrémités : Pas d\'œdème, pouls périphériques normaux',
    
    // Laboratory interface text
    'lab.interface.normal': 'Normal',
    'lab.interface.selected': 'Sélectionné',
    'lab.interface.clickToSelect': 'Cliquer pour sélectionner',
    'lab.interface.labValues': 'Valeurs de laboratoire',
    'lab.interface.addTrend': 'Ajouter tendance',
    'lab.interface.removeTrend': 'Retirer tendance',
    'lab.interface.setNormal': 'Définir comme normal',
    'lab.interface.normalSet': '✓ Normal défini (cliquer pour retirer)',
    'lab.interface.currentValue': 'Valeur actuelle',
    'lab.interface.trend': 'Tendance',
    'lab.interface.bloodGasType': 'Type de gaz sanguin',
    'lab.interface.arterial': 'Artériel',
    'lab.interface.venous': 'Veineux',
    'lab.interface.capillary': 'Capillaire',


    
    // Laboratory units in French
    'lab.unit.seconds': 'secondes',
    
    // ROS mode options in French
    'ros.mode.detailed': 'Détaillé',
    'ros.mode.concise': 'Concis',
    
    // Button translations
    'button.selectAll': 'Tout sélectionner',
    
    // French text snippets for note generation
    'note.allOtherSystemsNegative': 'Tous les autres systèmes révisés et négatifs.',
    'note.physicalExam': 'EXAMEN PHYSIQUE:',
    'note.rosHeader': 'REVUE DES SYSTÈMES:',
    'note.labResults': 'RÉSULTATS DE LABORATOIRE:',
    'note.intubationParams': 'PARAMÈTRES D\'INTUBATION:',
    
    // Nav
    'nav.medicalNotes': 'Notes médicales',
    'nav.dotPhrases': 'Phrases abrégées',
    'nav.brand': 'AriNote',
    'nav.medicalNotes.desc': 'Créer une documentation médicale',
    'nav.dotPhrases.desc': 'Gérer les raccourcis',
    'nav.calculations': 'Calculs',
    'nav.calculations.desc': 'Calculatrices et scores médicaux',
    'dotManager.title': 'Gestionnaire de phrases abrégées',
    'dotManager.subtitle': 'Créez et gérez vos raccourcis de documentation médicale',
    'dotManager.howTo': 'Comment utiliser les phrases abrégées',
    'dotManager.triggers': 'Déclencheurs',
    'dotManager.triggersDesc': 'Commencez par "/" (ex. : /thorax, /neuro)',
    'dotManager.smartOptions': 'Options intelligentes',
    'dotManager.smartOptionsDesc': 'Insérez des choix interactifs n\'importe où dans votre phrase à l\'aide du bouton Ajouter une option intelligente. Ceux-ci apparaîtront comme des menus déroulants lors de l\'utilisation de la phrase.',
    'dotManager.example': 'Exemple',
    'dotManager.exampleDesc': 'Le patient se présente avec une douleur thoracique, vive / sourde / écrasante, irradiant vers bras gauche / mâchoire / dos',
    'dotManager.searchPlaceholder': 'Rechercher des phrases abrégées...',
    'dotManager.allCategories': 'Toutes les catégories',
    'dotManager.newPhrase': 'Nouvelle phrase',
    'dotManager.noPhrases': 'Aucune phrase abrégée personnalisée. Créez votre première !',
    'dotManager.category': 'Catégorie',
    'dotManager.trigger': 'Déclencheur (avec /)',
    'dotManager.description': 'Description',
    'dotManager.content': 'Contenu',
    'dotManager.preview': 'Aperçu',
    'dotManager.smartOptionsDetected': 'Options intelligentes détectées : {count} choix',
    'dotManager.update': 'Mettre à jour',
    'dotManager.create': 'Créer',
    'dotManager.cancel': 'Annuler',
    'dotManager.edit': 'Modifier la phrase abrégée',
    'dotManager.createNew': 'Créer une nouvelle phrase abrégée',
    'dotManager.updateExisting': 'Mettre à jour votre phrase existante',
    'dotManager.addNew': 'Ajoutez un nouveau raccourci à votre collection',
    'dotManager.totalPhrases': '{count} phrases au total',
    'dotManager.withSmartOptions': '{count} avec options intelligentes',
    'dotManager.categoriesUsed': '{count} catégories utilisées',
    'dotManager.noMatch': 'Aucune phrase ne correspond à vos critères de recherche.',
    'dotManager.noCustom': 'Aucune phrase abrégée personnalisée. Créez votre première !',
    'dotManager.addSmartOption': 'Ajouter une option intelligente',
    'dotManager.smartOptionsHint': 'Insérez des choix interactifs n\'importe où dans votre phrase.',
    'dotManager.insertSmartOptionTitle': 'Insérer une option intelligente',
    'dotManager.insertSmartOptionDesc': 'Entrez chaque choix ci-dessous. Ceux-ci apparaîtront comme un menu déroulant lors de l\'utilisation de la phrase.',
    'dotManager.addAnotherOption': 'Ajouter un autre choix',
    'dotManager.moreSmartOptionsSoon': 'Plus d\'options intelligentes bientôt disponibles...',
    'dotManager.insert': 'Insérer',
    'dotManager.tabDropdown': 'Choix déroulants',
    'dotManager.tabDate': 'Sélecteur de date',
    'dotManager.datePickerDesc': 'Insérez un champ de date (ex. : pour un suivi).',
    'dotManager.datePickerExample': 'Exemple : [Date]'
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}