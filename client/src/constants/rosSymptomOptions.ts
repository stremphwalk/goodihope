// Default ROS systems and symptoms (EN/FR) with descriptions
export const rosSymptomOptions = {
  respiratory: {
    label: { en: "Respiratory", fr: "Respiratoire" },
    symptoms: [
      { key: "dyspnea", en: "Dyspnea", fr: "Dyspnée", description: { en: "Shortness of breath or difficulty breathing", fr: "Essoufflement ou difficulté respiratoire" } },
      { key: "pleuritic_chest_pain", en: "Pleuritic chest pain", fr: "Douleur thoracique pleurétique", description: { en: "Sharp chest pain worsened by breathing", fr: "Douleur thoracique aiguë aggravée par la respiration" } },
      { key: "hemoptysis", en: "Hemoptysis", fr: "Hémoptysie", description: { en: "Coughing up blood", fr: "Toux avec expectoration de sang" } },
      { key: "sputum_production", en: "Sputum production", fr: "Expectoration", description: { en: "Production of mucus or phlegm", fr: "Production de mucus ou de mucosités" } },
      { key: "cough", en: "Cough", fr: "Toux", description: { en: "Sudden expulsion of air from lungs", fr: "Expulsion soudaine d'air des poumons" } },
      { key: "wheezing", en: "Wheezing", fr: "Sifflements", description: { en: "High-pitched whistling sound during breathing", fr: "Son sifflant aigu pendant la respiration" } },
    ],
  },
  cardiovascular: {
    label: { en: "Cardiovascular", fr: "Cardiaque" },
    symptoms: [
      { key: "chest_pain", en: "Chest pain", fr: "Douleur thoracique", description: { en: "Pain or discomfort in chest", fr: "Douleur ou inconfort thoracique" } },
      { key: "palpitations", en: "Palpitations", fr: "Palpitations", description: { en: "Irregular or rapid heartbeat sensation", fr: "Sensation de battements irréguliers ou rapides" } },
      { key: "orthopnea", en: "Orthopnea", fr: "Orthopnée", description: { en: "Shortness of breath when lying flat", fr: "Essoufflement en position couchée" } },
      { key: "pnd", en: "Paroxysmal nocturnal dyspnea", fr: "Dyspnée paroxystique nocturne", description: { en: "Sudden shortness of breath at night", fr: "Essoufflement soudain nocturne" } },
      { key: "edema", en: "Edema", fr: "Œdème", description: { en: "Swelling due to fluid retention", fr: "Gonflement dû à la rétention d'eau" } },
    ],
  },
  gastrointestinal: {
    label: { en: "Gastrointestinal", fr: "Gastro-intestinal" },
    symptoms: [
      { key: "nausea", en: "Nausea", fr: "Nausée", description: { en: "Feeling of sickness with urge to vomit", fr: "Sensation de malaise avec envie de vomir" } },
      { key: "vomiting", en: "Vomiting", fr: "Vomissements", description: { en: "Forceful expulsion of stomach contents", fr: "Expulsion forcée du contenu stomacal" } },
      { key: "diarrhea", en: "Diarrhea", fr: "Diarrhée", description: { en: "Loose, watery stools", fr: "Selles liquides et fréquentes" } },
      { key: "abdominal_pain", en: "Abdominal pain", fr: "Douleur abdominale", description: { en: "Pain in the stomach area", fr: "Douleur dans la région abdominale" } },
      { key: "constipation", en: "Constipation", fr: "Constipation", description: { en: "Infrequent or difficult bowel movements", fr: "Selles peu fréquentes ou difficiles" } },
      { key: "hematemesis", en: "Hematemesis", fr: "Hématémèse", description: { en: "Vomiting blood", fr: "Vomissements de sang" } },
      { key: "melena", en: "Melena", fr: "Méléna", description: { en: "Black, tarry stools", fr: "Selles noires et goudronneuses" } },
    ],
  },
  neurologic: {
    label: { en: "Neurologic", fr: "Neurologique" },
    symptoms: [
      { key: "headache", en: "Headache", fr: "Céphalée", description: { en: "Pain in the head or upper neck", fr: "Douleur à la tête ou au cou supérieur" } },
      { key: "dizziness", en: "Dizziness", fr: "Étourdissements", description: { en: "Sensation of spinning or lightheadedness", fr: "Sensation de rotation ou d'étourdissement" } },
      { key: "syncope", en: "Syncope", fr: "Syncope", description: { en: "Temporary loss of consciousness", fr: "Perte temporaire de conscience" } },
      { key: "seizures", en: "Seizures", fr: "Convulsions", description: { en: "Sudden, uncontrolled electrical disturbance in brain", fr: "Perturbation électrique incontrôlée dans le cerveau" } },
      { key: "weakness", en: "Weakness", fr: "Faiblesse", description: { en: "Reduced strength in muscles", fr: "Réduction de la force musculaire" } },
    ],
  },
  genitourinary: {
    label: { en: "Genitourinary", fr: "Génom-urinaire" },
    symptoms: [
      { key: "dysuria", en: "Dysuria", fr: "Dysurie", description: { en: "Painful urination", fr: "Miction douloureuse" } },
      { key: "hematuria", en: "Hematuria", fr: "Hématurie", description: { en: "Blood in urine", fr: "Sang dans l'urine" } },
      { key: "urgency", en: "Urgency", fr: "Urgence", description: { en: "Sudden compelling need to urinate", fr: "Besoin urgent et impérieux d'uriner" } },
      { key: "frequency", en: "Frequency", fr: "Fréquence", description: { en: "Frequent urination", fr: "Mictions fréquentes" } },
      { key: "incontinence", en: "Incontinence", fr: "Incontinence", description: { en: "Involuntary leakage of urine", fr: "Fuite involontaire d'urine" } },
    ],
  },
  rheumatologic: {
    label: { en: "Rheumatologic", fr: "Rhumatologique" },
    symptoms: [
      { key: "arthralgia", en: "Arthralgia", fr: "Arthralgie", description: { en: "Joint pain", fr: "Douleur articulaire" } },
      { key: "morning_stiffness", en: "Morning stiffness", fr: "Raideur matinale", description: { en: "Stiffness worse in the morning", fr: "Raideur pire le matin" } },
      { key: "myalgia", en: "Myalgia", fr: "Myalgie", description: { en: "Muscle pain", fr: "Douleur musculaire" } },
      { key: "rash_photosensitivity", en: "Photosensitive rash", fr: "Éruption photosensible", description: { en: "Rash worse with sun exposure", fr: "Éruption aggravée par le soleil" } },
      { key: "raynaud", en: "Raynaud phenomenon", fr: "Phénomène de Raynaud", description: { en: "Color changes in fingers with cold", fr: "Changements de couleur des doigts au froid" } },
      { key: "sicca", en: "Sicca symptoms", fr: "Symptômes de sécheresse", description: { en: "Dry eyes and mouth", fr: "Sécheresse oculaire et buccale" } },
    ],
  },
  hematologic: {
    label: { en: "Hematologic", fr: "Hématologique" },
    symptoms: [
      { key: "easy_bruising", en: "Easy bruising", fr: "Ecchymoses faciles", description: { en: "Bruise easily", fr: "Se fait des bleus facilement" } },
      { key: "bleeding", en: "Bleeding", fr: "Saignements", description: { en: "Nose/gum bleeding or prolonged bleeding", fr: "Saignement du nez/des gencives ou prolongé" } },
      { key: "recurrent_infections", en: "Recurrent infections", fr: "Infections récurrentes", description: { en: "Frequent infections", fr: "Infections fréquentes" } },
      { key: "lymphadenopathy", en: "Lymphadenopathy", fr: "Adénopathies", description: { en: "Enlarged lymph nodes", fr: "Ganglions enflés" } },
    ],
  },
  endocrine: {
    label: { en: "Endocrine", fr: "Endocrinien" },
    symptoms: [
      { key: "polyuria", en: "Polyuria", fr: "Polyurie", description: { en: "Urinate frequently", fr: "Mictions fréquentes" } },
      { key: "polydipsia", en: "Polydipsia", fr: "Polydipsie", description: { en: "Excessive thirst", fr: "Soif excessive" } },
      { key: "heat_intolerance", en: "Heat intolerance", fr: "Intolérance à la chaleur", description: { en: "Difficulty tolerating heat", fr: "Intolérance à la chaleur" } },
      { key: "cold_intolerance", en: "Cold intolerance", fr: "Intolérance au froid", description: { en: "Difficulty tolerating cold", fr: "Intolérance au froid" } },
      { key: "weight_change", en: "Weight change", fr: "Changement de poids", description: { en: "Unintentional weight loss or gain", fr: "Perte ou gain de poids involontaire" } },
    ],
  },
  ophthalmologic: {
    label: { en: "Ophthalmologic", fr: "Ophtalmologique" },
    symptoms: [
      { key: "vision_changes", en: "Vision changes", fr: "Troubles visuels", description: { en: "Blurred or double vision", fr: "Vision floue ou double" } },
      { key: "eye_pain", en: "Eye pain", fr: "Douleur oculaire", description: { en: "Pain in or around the eye", fr: "Douleur dans ou autour de l'œil" } },
      { key: "redness", en: "Redness", fr: "Rougeur", description: { en: "Red eyes", fr: "Yeux rouges" } },
      { key: "photophobia", en: "Photophobia", fr: "Photophobie", description: { en: "Light sensitivity", fr: "Sensibilité à la lumière" } },
    ],
  },
};