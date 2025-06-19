// Default ROS systems and symptoms (EN/FR)
export const rosSymptomOptions = {
  respiratory: {
    label: { en: "Respiratory", fr: "Respiratoire" },
    symptoms: [
      { key: "dyspnea", en: "Dyspnea", fr: "Dyspnée" },
      { key: "pleuritic_chest_pain", en: "Pleuritic chest pain", fr: "Douleur thoracique pleurétique" },
      { key: "hemoptysis", en: "Hemoptysis", fr: "Hémoptysie" },
      { key: "sputum_production", en: "Sputum production", fr: "Expectoration" },
      { key: "cough", en: "Cough", fr: "Toux" },
      { key: "wheezing", en: "Wheezing", fr: "Sifflements" },
    ],
  },
  cardiovascular: {
    label: { en: "Cardiovascular", fr: "Cardiaque" },
    symptoms: [
      { key: "chest_pain", en: "Chest pain", fr: "Douleur thoracique" },
      { key: "palpitations", en: "Palpitations", fr: "Palpitations" },
      { key: "orthopnea", en: "Orthopnea", fr: "Orthopnée" },
      { key: "pnd", en: "Paroxysmal nocturnal dyspnea", fr: "Dyspnée paroxystique nocturne" },
      { key: "edema", en: "Edema", fr: "Œdème" },
    ],
  },
  gastrointestinal: {
    label: { en: "Gastrointestinal", fr: "Gastro-intestinal" },
    symptoms: [
      { key: "nausea", en: "Nausea", fr: "Nausée" },
      { key: "vomiting", en: "Vomiting", fr: "Vomissements" },
      { key: "diarrhea", en: "Diarrhea", fr: "Diarrhée" },
      { key: "abdominal_pain", en: "Abdominal pain", fr: "Douleur abdominale" },
      { key: "constipation", en: "Constipation", fr: "Constipation" },
      { key: "hematemesis", en: "Hematemesis", fr: "Hématémèse" },
      { key: "melena", en: "Melena", fr: "Méléna" },
    ],
  },
  neurologic: {
    label: { en: "Neurologic", fr: "Neurologique" },
    symptoms: [
      { key: "headache", en: "Headache", fr: "Céphalée" },
      { key: "dizziness", en: "Dizziness", fr: "Étourdissements" },
      { key: "syncope", en: "Syncope", fr: "Syncope" },
      { key: "seizures", en: "Seizures", fr: "Convulsions" },
      { key: "weakness", en: "Weakness", fr: "Faiblesse" },
    ],
  },
  genitourinary: {
    label: { en: "Genitourinary", fr: "Génom-urinaire" },
    symptoms: [
      { key: "dysuria", en: "Dysuria", fr: "Dysurie" },
      { key: "hematuria", en: "Hematuria", fr: "Hématurie" },
      { key: "urgency", en: "Urgency", fr: "Urgence" },
      { key: "frequency", en: "Frequency", fr: "Fréquence" },
      { key: "incontinence", en: "Incontinence", fr: "Incontinence" },
    ],
  },
};
