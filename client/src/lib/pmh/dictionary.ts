export const PMH_CHIPS = ["Hypertension","Type 2 diabetes mellitus","Coronary artery disease","Atrial fibrillation","COPD","Chronic kidney disease","Heart failure","Stroke/TIA","Asthma","GERD","Hypothyroidism","Osteoarthritis","Depression/Anxiety","NSTEMI"] as const;

export const SYNONYMS: Record<string,string> = {
  htn:"Hypertension", t2dm:"Type 2 diabetes mellitus", dm2:"Type 2 diabetes mellitus",
  dm:"Diabetes mellitus", cad:"Coronary artery disease", af:"Atrial fibrillation",
  afib:"Atrial fibrillation", copd:"COPD", ckd:"Chronic kidney disease",
  chf:"Heart failure", hf:"Heart failure", tia:"Stroke/TIA",
  gerd:"GERD", hypothyroid:"Hypothyroidism", oa:"Osteoarthritis",
  nstemi:"NSTEMI", stemi:"STEMI",
};