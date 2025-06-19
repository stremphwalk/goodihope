import { Calculation } from './types';

// Helper functions for unit conversion
const convertWeight = (value: number, from: 'kg' | 'lb', to: 'kg' | 'lb'): number => {
  if (from === to) return value;
  return from === 'kg' ? value * 2.20462 : value / 2.20462;
};

const convertHeight = (value: number, from: 'cm' | 'in', to: 'cm' | 'in'): number => {
  if (from === to) return value;
  return from === 'cm' ? value * 0.393701 : value / 0.393701;
};

const convertCreatinine = (value: number, from: 'mg/dL' | 'µmol/L', to: 'mg/dL' | 'µmol/L'): number => {
  if (from === to) return value;
  return from === 'mg/dL' ? value * 88.4 : value / 88.4;
};

// Convert calcium between mg/dL and mmol/L
const convertCalcium = (value: number, from: 'mg/dL' | 'mmol/L', to: 'mg/dL' | 'mmol/L'): number => {
  if (from === to) return value;
  return from === 'mg/dL' ? value * 0.25 : value / 0.25;
};

// Convert albumin between g/dL and g/L
const convertAlbumin = (value: number, from: 'g/dL' | 'g/L', to: 'g/dL' | 'g/L'): number => {
  if (from === to) return value;
  return from === 'g/dL' ? value * 10 : value / 10;
};

// Cardiology Calculations
const cha2ds2VascScore = (inputs: Record<string, any>): number => {
  let score = 0;
  if (inputs.congestiveHeartFailure) score += 1;
  if (inputs.hypertension) score += 1;
  if (inputs.age >= 75) score += 2;
  if (inputs.age >= 65 && inputs.age < 75) score += 1;
  if (inputs.diabetes) score += 1;
  if (inputs.stroke) score += 2;
  if (inputs.vascularDisease) score += 1;
  if (inputs.female) score += 1;
  return score;
};

const calculateQTc = (inputs: Record<string, any>): number => {
  const { qt, hr, formula } = inputs;
  const rr = 60 / hr;
  let result: number;
  switch (formula) {
    case 'Bazett':
      result = qt / Math.sqrt(rr);
      break;
    case 'Fridericia':
      result = qt / Math.cbrt(rr);
      break;
    case 'Framingham':
      result = qt + 154 * (1 - rr);
      break;
    case 'Hodges':
      result = qt + 1.75 * ((60 / rr) - 60);
      break;
    case 'Rautaharju':
      result = qt * ((120 + hr) / 180);
      break;
    default:
      result = qt;
  }
  return Math.round(result);
};

const qtcInterpretation = (qtc: number): string => {
  if (qtc < 350) return 'Short QTc';
  if (qtc > 470) return 'Prolonged QTc';
  return 'Normal QTc';
};

const calculateWellsPE = (inputs: Record<string, any>): number => {
  let score = 0;
  if (inputs.clinicalSignsDVT) score += 3;
  if (inputs.peLikely) score += 3;
  if (inputs.heartRateOver100) score += 1.5;
  if (inputs.immobilizationOrSurgery) score += 1.5;
  if (inputs.previousDVTorPE) score += 1.5;
  if (inputs.hemoptysis) score += 1;
  if (inputs.malignancy) score += 1;
  return score;
};

const wellsPEInterpretation = (score: number): string => {
  // Three-tier model
  let threeTier = '';
  if (score <= 1) threeTier = 'Low Risk';
  else if (score <= 6) threeTier = 'Moderate Risk';
  else threeTier = 'High Risk';

  // Two-tier model
  let twoTier = score <= 4 ? 'PE Unlikely (consider d-dimer)' : 'PE Likely (consider CTA)';

  return `${threeTier}\n${twoTier}`;
};

const calculateMAP = (inputs: Record<string, any>): number => {
  const { sbp, dbp } = inputs;
  return (1/3 * sbp) + (2/3 * dbp);
};

const mapInterpretation = (map: number): string => {
  if (map < 60) return 'Severe hypotension - Immediate intervention needed';
  if (map < 70) return 'Hypotension - Consider intervention';
  if (map > 100) return 'Hypertension - Consider treatment';
  return 'Normal MAP';
};

const cha2ds2VascInterpretation = (score: number): string => {
  if (score === 0) return 'Low risk - No anticoagulation needed';
  if (score === 1) return 'Low risk - Consider anticoagulation';
  if (score >= 2) return 'High risk - Anticoagulation recommended';
  return '';
};

const hasBledScore = (inputs: Record<string, any>): number => {
  let score = 0;
  if (inputs.hypertension) score += 1;
  if (inputs.abnormalRenalFunction) score += 1;
  if (inputs.abnormalLiverFunction) score += 1;
  if (inputs.stroke) score += 1;
  if (inputs.bleeding) score += 1;
  if (inputs.labileINR) score += 1;
  if (inputs.elderly) score += 1;
  if (inputs.drugs) score += 1;
  if (inputs.alcohol) score += 1;
  return score;
};

const hasBledInterpretation = (score: number): string => {
  if (score >= 3) return 'High risk of bleeding - Consider alternative to anticoagulation';
  return 'Low to moderate risk of bleeding';
};

// Nephrology Calculations
const calculateEGFR = (inputs: Record<string, any>): number => {
  const { age, gender, race, creatinine } = inputs;
  const isFemale = gender === 'female';
  const isBlack = race === 'black';
  
  let egfr = 175 * Math.pow(creatinine, -1.154) * Math.pow(age, -0.203);
  if (isFemale) egfr *= 0.742;
  if (isBlack) egfr *= 1.212;
  
  return egfr;
};

const calculateCockcroftGault = (inputs: Record<string, any>): number => {
  const { age, weight, gender, creatinine, unitSystem } = inputs;
  
  // Convert weight to kg if needed
  const weightKg = unitSystem === 'US' ? convertWeight(weight, 'lb', 'kg') : weight;
  
  // Convert creatinine to mg/dL if needed
  const creatinineMgdl = unitSystem === 'SI' ? convertCreatinine(creatinine, 'µmol/L', 'mg/dL') : creatinine;
  
  // Calculate CrCl
  let crcl = ((140 - age) * weightKg) / (72 * creatinineMgdl);
  if (gender === 'female') crcl *= 0.85;
  
  return crcl;
};

const calculateIdealBodyWeight = (inputs: Record<string, any>): number => {
  const { height, gender, unitSystem } = inputs;
  
  // Convert height to inches if needed
  const heightInches = unitSystem === 'SI' ? convertHeight(height, 'cm', 'in') : height;
  
  // Calculate IBW using Devine formula
  let ibw = 50; // Base for males
  if (gender === 'female') {
    ibw = 45.5;
  }
  ibw += 2.3 * (heightInches - 60);
  
  // Convert to kg if needed
  return unitSystem === 'US' ? ibw : convertWeight(ibw, 'lb', 'kg');
};

const calculateAdjustedBodyWeight = (inputs: Record<string, any>): number => {
  const { height, gender, actualWeight, unitSystem } = inputs;
  
  // Calculate IBW first
  const ibw = calculateIdealBodyWeight({ height, gender, unitSystem });
  
  // Convert actual weight to kg if needed
  const actualWeightKg = unitSystem === 'US' ? convertWeight(actualWeight, 'lb', 'kg') : actualWeight;
  
  // Calculate ABW
  const abw = ibw + 0.4 * (actualWeightKg - ibw);
  
  // Convert back to original unit system if needed
  return unitSystem === 'US' ? convertWeight(abw, 'kg', 'lb') : abw;
};

const egfrInterpretation = (egfr: number): string => {
  if (egfr >= 90) return 'Normal kidney function';
  if (egfr >= 60) return 'Mildly reduced kidney function';
  if (egfr >= 45) return 'Mild to moderate reduction in kidney function';
  if (egfr >= 30) return 'Moderate to severe reduction in kidney function';
  if (egfr >= 15) return 'Severe reduction in kidney function';
  return 'Kidney failure';
};

const crclInterpretation = (crcl: number): string => {
  if (crcl >= 90) return 'Normal kidney function';
  if (crcl >= 60) return 'Mild renal impairment';
  if (crcl >= 30) return 'Moderate renal impairment';
  if (crcl >= 15) return 'Severe renal impairment';
  return 'Kidney failure';
};

// General Calculations
const calculateBMI = (inputs: Record<string, any>): number => {
  const { weight, height, unitSystem } = inputs;
  const weightKg = unitSystem === 'US' ? convertWeight(weight, 'lb', 'kg') : weight;
  const heightM = unitSystem === 'US' ? convertHeight(height, 'in', 'cm') / 100 : height / 100;
  return weightKg / (heightM * heightM);
};

const bmiInterpretation = (bmi: number): string => {
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal weight';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
};

const calculateCorrectedCalcium = (inputs: Record<string, any>): number => {
  const { calcium, albumin, unitSystem } = inputs;
  
  // Convert to SI units if needed
  const calciumMmol = unitSystem === 'US' ? convertCalcium(calcium, 'mg/dL', 'mmol/L') : calcium;
  const albuminGL = unitSystem === 'US' ? convertAlbumin(albumin, 'g/dL', 'g/L') : albumin;
  
  // Calculate corrected calcium
  const correctedCalcium = calciumMmol + 0.02 * (40 - albuminGL);
  
  // Convert back to US units if needed
  return unitSystem === 'US' ? convertCalcium(correctedCalcium, 'mmol/L', 'mg/dL') : correctedCalcium;
};

const correctedCalciumInterpretation = (value: number, unitSystem: string): string => {
  const valueMmol = unitSystem === 'US' ? convertCalcium(value, 'mg/dL', 'mmol/L') : value;
  
  if (valueMmol < 2.1) return 'Hypocalcemia';
  if (valueMmol > 2.6) return 'Hypercalcemia';
  return 'Normal calcium level';
};

const calculateNIHSS = (inputs: Record<string, any>): number => {
  let total = 0;
  for (const key in inputs) {
    if (typeof inputs[key] === 'number') {
      total += inputs[key];
    }
  }
  return total;
};

const nihssInterpretation = (score: number): string => {
  if (score === 0) return 'No stroke symptoms';
  if (score <= 4) return 'Minor stroke';
  if (score <= 15) return 'Moderate stroke';
  if (score <= 20) return 'Moderate to severe stroke';
  return 'Severe stroke';
};

const calculateChildPugh = (inputs: Record<string, any>): number => {
  let total = 0;
  const keys = ['bilirubin', 'albumin', 'inr', 'ascites', 'encephalopathy'];
  keys.forEach((key) => {
    if (typeof inputs[key] === 'number') {
      total += inputs[key];
    }
  });
  return total;
};

const childPughInterpretation = (score: number): string => {
  if (score <= 6) return 'Class A';
  if (score <= 9) return 'Class B';
  return 'Class C';
};

const calculateFIB4 = (inputs: Record<string, any>): number => {
  const { age, ast, platelets, alt } = inputs;
  if (!age || !ast || !platelets || !alt) return 0;
  return (age * ast) / (platelets * Math.sqrt(alt));
};

const fib4Interpretation = (fib4: number, age: number): string => {
  if (age <= 35) return 'Alternative fibrosis assessment';
  if (age >= 36 && age <= 65) {
    if (fib4 < 1.3) return 'Advanced fibrosis excluded';
    if (fib4 <= 2.67) return 'Further investigation';
    return 'Advanced fibrosis likely';
  }
  if (age > 65) {
    if (fib4 < 2.0) return 'Advanced fibrosis excluded';
    if (fib4 <= 2.67) return 'Further investigation';
    return 'Advanced fibrosis likely';
  }
  return '';
};

// --- Framingham Risk Score (CCS Chart Accurate) ---
function calculateFraminghamRisk(inputs: Record<string, any>): { totalPoints: number, risk: string } {
  const gender = inputs.sex === 'male' ? 'male' : 'female';
  const age = Number(inputs.age);
  const hdl = Number(inputs.hdlChol);
  const chol = Number(inputs.totalChol);
  const sbp = Number(inputs.sbp);
  const treated = inputs.bpTreated === 1 || inputs.bpTreated === true || inputs.bpTreated === 'Yes';
  const smoker = inputs.smoker === 1 || inputs.smoker === true || inputs.smoker === 'Yes';
  const diabetes = inputs.diabetes === 1 || inputs.diabetes === true || inputs.diabetes === 'Yes';

  let points = 0;

  // Age points (CCS chart exact bins)
  if (gender === 'male') {
    if (age >= 30 && age <= 34) points += 0;
    else if (age >= 35 && age <= 39) points += 2;
    else if (age >= 40 && age <= 44) points += 5;
    else if (age >= 45 && age <= 49) points += 6;
    else if (age >= 50 && age <= 54) points += 8;
    else if (age >= 55 && age <= 59) points += 10;
    else if (age >= 60 && age <= 64) points += 11;
    else if (age >= 65 && age <= 69) points += 12;
    else if (age >= 70 && age <= 74) points += 14;
    else if (age >= 75) points += 15;
  } else {
    if (age >= 30 && age <= 34) points += 0;
    else if (age >= 35 && age <= 39) points += 2;
    else if (age >= 40 && age <= 44) points += 4;
    else if (age >= 45 && age <= 49) points += 5;
    else if (age >= 50 && age <= 54) points += 7;
    else if (age >= 55 && age <= 59) points += 8;
    else if (age >= 60 && age <= 64) points += 9;
    else if (age >= 65 && age <= 69) points += 10;
    else if (age >= 70 && age <= 74) points += 11;
    else if (age >= 75) points += 12;
  }

  // HDL-C (mmol/L) points (CCS chart exact bins)
  if (hdl > 1.6) points += -2;
  else if (hdl >= 1.3 && hdl <= 1.6) points += -1;
  else if (hdl >= 1.2 && hdl <= 1.29) points += 0;
  else if (hdl >= 0.9 && hdl <= 1.19) points += 1;
  else if (hdl < 0.9) points += 2;

  // Total Cholesterol (mmol/L) points (CCS chart exact bins)
  if (gender === 'male') {
    if (chol < 4.1) points += 0;
    else if (chol >= 4.1 && chol <= 5.19) points += 1;
    else if (chol >= 5.2 && chol <= 6.19) points += 2;
    else if (chol >= 6.2 && chol <= 7.2) points += 3;
    else if (chol > 7.2) points += 4;
  } else {
    if (chol < 4.1) points += 0;
    else if (chol >= 4.1 && chol <= 5.19) points += 1;
    else if (chol >= 5.2 && chol <= 6.19) points += 3;
    else if (chol >= 6.2 && chol <= 7.2) points += 4;
    else if (chol > 7.2) points += 5;
  }

  // Systolic Blood Pressure (mmHg) points (CCS chart exact bins)
  if (gender === 'male') {
    if (!treated) {
      if (sbp < 120) points += -2;
      else if (sbp >= 120 && sbp <= 129) points += 0;
      else if (sbp >= 130 && sbp <= 139) points += 1;
      else if (sbp >= 140 && sbp <= 149) points += 2;
      else if (sbp >= 150 && sbp <= 159) points += 2;
      else if (sbp >= 160) points += 3;
    } else {
      if (sbp < 120) points += 0;
      else if (sbp >= 120 && sbp <= 129) points += 2;
      else if (sbp >= 130 && sbp <= 139) points += 3;
      else if (sbp >= 140 && sbp <= 149) points += 4;
      else if (sbp >= 150 && sbp <= 159) points += 4;
      else if (sbp >= 160) points += 5;
    }
  } else {
    if (!treated) {
      if (sbp < 120) points += -3;
      else if (sbp >= 120 && sbp <= 129) points += 0;
      else if (sbp >= 130 && sbp <= 139) points += 1;
      else if (sbp >= 140 && sbp <= 149) points += 2;
      else if (sbp >= 150 && sbp <= 159) points += 4;
      else if (sbp >= 160) points += 5;
    } else {
      if (sbp < 120) points += -1;
      else if (sbp >= 120 && sbp <= 129) points += 2;
      else if (sbp >= 130 && sbp <= 139) points += 3;
      else if (sbp >= 140 && sbp <= 149) points += 5;
      else if (sbp >= 150 && sbp <= 159) points += 6;
      else if (sbp >= 160) points += 7;
    }
  }

  // Smoker points (CCS chart exact)
  if (smoker) {
    points += gender === 'male' ? 4 : 3;
  } else {
    points += 0;
  }

  // Diabetes points (CCS chart exact)
  if (diabetes) {
    points += gender === 'male' ? 3 : 4;
  } else {
    points += 0;
  }

  // Risk lookup (CCS chart exact)
  const riskData: Record<string, Record<string, string>> = {
    male: {
      "-3": "< 1",
      "-2": "1.1",
      "-1": "1.4",
      "0": "1.6",
      "1": "1.9",
      "2": "2.3",
      "3": "2.8",
      "4": "3.3",
      "5": "3.9",
      "6": "4.7",
      "7": "5.6",
      "8": "6.7",
      "9": "7.9",
      "10": "9.4",
      "11": "11.2",
      "12": "13.2",
      "13": "15.6",
      "14": "18.4",
      "15": "21.6",
      "16": "25.3",
      "17": "29.4",
      "18": "> 30",
      "19": "> 30",
      "20": "> 30",
      "21": "> 30"
    },
    female: {
      "-3": "< 1",
      "-2": "< 1",
      "-1": "1.0",
      "0": "1.2",
      "1": "1.5",
      "2": "1.7",
      "3": "2.0",
      "4": "2.4",
      "5": "2.8",
      "6": "3.3",
      "7": "3.9",
      "8": "4.5",
      "9": "5.3",
      "10": "6.3",
      "11": "7.3",
      "12": "8.6",
      "13": "10.0",
      "14": "11.7",
      "15": "13.7",
      "16": "15.9",
      "17": "18.5",
      "18": "21.5",
      "19": "24.8",
      "20": "28.5",
      "21": "> 30"
    }
  };

  // Clamp points to table range
  let lookupPoints = points;
  if (gender === 'male' && lookupPoints < -3) lookupPoints = -3;
  if (gender === 'male' && lookupPoints > 21) lookupPoints = 21;
  if (gender === 'female' && lookupPoints < -3) lookupPoints = -3;
  if (gender === 'female' && lookupPoints > 21) lookupPoints = 21;

  const lookupKey = String(lookupPoints);
  const risk = riskData[gender][lookupKey] ?? 'N/A';

  return { totalPoints: points, risk };
}

export const calculations: Calculation[] = [
  {
    id: 'cha2ds2-vasc',
    name: 'CHA2DS2-VASc Score',
    category: 'Risk Score',
    specialty: 'cardiology',
    description: 'Stroke risk assessment in atrial fibrillation',
    inputs: [
      { id: 'congestiveHeartFailure', label: 'Congestive Heart Failure', type: 'boolean' },
      { id: 'hypertension', label: 'Hypertension', type: 'boolean' },
      { id: 'age', label: 'Age', type: 'number', min: 0, max: 120 },
      { id: 'diabetes', label: 'Diabetes', type: 'boolean' },
      { id: 'stroke', label: 'Stroke/TIA', type: 'boolean' },
      { id: 'vascularDisease', label: 'Vascular Disease', type: 'boolean' },
      { id: 'female', label: 'Female', type: 'boolean' }
    ],
    formula: cha2ds2VascScore,
    interpretation: cha2ds2VascInterpretation,
    references: ['Chest. 2010;138(5):1093-1100'],
    unit: 'points'
  },
  {
    id: 'has-bled',
    name: 'HAS-BLED Score',
    category: 'Risk Score',
    specialty: 'gastroenterology',
    description: 'Bleeding risk assessment in atrial fibrillation',
    inputs: [
      { id: 'hypertension', label: 'Hypertension', type: 'boolean' },
      { id: 'abnormalRenalFunction', label: 'Abnormal Renal Function', type: 'boolean' },
      { id: 'abnormalLiverFunction', label: 'Abnormal Liver Function', type: 'boolean' },
      { id: 'stroke', label: 'Stroke', type: 'boolean' },
      { id: 'bleeding', label: 'Bleeding', type: 'boolean' },
      { id: 'labileINR', label: 'Labile INR', type: 'boolean' },
      { id: 'elderly', label: 'Elderly (>65)', type: 'boolean' },
      { id: 'drugs', label: 'Drugs/Alcohol', type: 'boolean' }
    ],
    formula: hasBledScore,
    interpretation: hasBledInterpretation,
    references: ['Chest. 2010;138(5):1093-1100'],
    unit: 'points'
  },
  {
    id: 'egfr',
    name: 'eGFR (MDRD)',
    category: 'Renal Function',
    specialty: 'nephrology',
    description: 'Estimated Glomerular Filtration Rate using MDRD formula',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', min: 18, max: 120 },
      { id: 'gender', label: 'Gender', type: 'select', options: ['male', 'female'] },
      { id: 'race', label: 'Race', type: 'select', options: ['black', 'other'] },
      { id: 'creatinine', label: 'Serum Creatinine', type: 'number', unit: 'mg/dL', min: 0.1, max: 20 }
    ],
    formula: calculateEGFR,
    interpretation: egfrInterpretation,
    references: ['N Engl J Med. 2006;354(24):2473-2483'],
    unit: 'mL/min/1.73m²'
  },
  {
    id: 'bmi',
    name: 'Body Mass Index',
    category: 'Basic Measurements',
    specialty: 'general',
    description: 'Calculate BMI based on weight and height',
    inputs: [
      { id: 'weight', label: 'Weight', type: 'number', unit: 'kg', min: 20, max: 300 },
      { id: 'height', label: 'Height', type: 'number', unit: 'cm', min: 100, max: 250 },
      { id: 'unitSystem', label: 'Unit System', type: 'select', options: ['US', 'SI'] }
    ],
    formula: calculateBMI,
    interpretation: bmiInterpretation,
    references: ['WHO. Obesity: preventing and managing the global epidemic. 2000'],
    unit: 'kg/m²'
  },
  {
    id: 'corrected-calcium',
    name: 'Corrected Calcium',
    category: 'Laboratory',
    specialty: 'general',
    description: 'Calculate albumin-corrected calcium level',
    inputs: [
      { 
        id: 'calcium', 
        label: 'Serum Calcium', 
        type: 'number', 
        unit: 'mg/dL', 
        min: 5, 
        max: 20 
      },
      { 
        id: 'albumin', 
        label: 'Serum Albumin', 
        type: 'number', 
        unit: 'g/dL', 
        min: 1, 
        max: 6 
      },
      { 
        id: 'unitSystem', 
        label: 'Unit System', 
        type: 'select', 
        options: ['US', 'SI'] 
      }
    ],
    formula: calculateCorrectedCalcium,
    interpretation: (value: number) => correctedCalciumInterpretation(value, 'US'),
    references: ['Payne RB, et al. Ann Clin Biochem. 1973;10:390-396'],
    unit: 'mg/dL'
  },
  {
    id: 'cockcroft-gault',
    name: 'Cockcroft-Gault Creatinine Clearance',
    category: 'Renal Function',
    specialty: 'nephrology',
    description: 'Estimate creatinine clearance using the Cockcroft-Gault equation',
    inputs: [
      { 
        id: 'age', 
        label: 'Age', 
        type: 'number', 
        min: 18, 
        max: 120 
      },
      { 
        id: 'weight', 
        label: 'Weight', 
        type: 'number', 
        unit: 'kg', 
        min: 20, 
        max: 300 
      },
      { 
        id: 'gender', 
        label: 'Gender', 
        type: 'select', 
        options: ['male', 'female'] 
      },
      { 
        id: 'creatinine', 
        label: 'Serum Creatinine', 
        type: 'number', 
        unit: 'mg/dL', 
        min: 0.1, 
        max: 20 
      },
      { 
        id: 'unitSystem', 
        label: 'Unit System', 
        type: 'select', 
        options: ['US', 'SI'] 
      }
    ],
    formula: calculateCockcroftGault,
    interpretation: crclInterpretation,
    references: ['Cockcroft DW, Gault MH. Nephron. 1976;16(1):31-41'],
    unit: 'mL/min'
  },
  {
    id: 'ideal-body-weight',
    name: 'Ideal Body Weight (Devine)',
    category: 'Basic Measurements',
    specialty: 'general',
    description: 'Calculate ideal body weight using the Devine formula',
    inputs: [
      { 
        id: 'height', 
        label: 'Height', 
        type: 'number', 
        unit: 'in', 
        min: 48, 
        max: 96 
      },
      { 
        id: 'gender', 
        label: 'Gender', 
        type: 'select', 
        options: ['male', 'female'] 
      },
      { 
        id: 'unitSystem', 
        label: 'Unit System', 
        type: 'select', 
        options: ['US', 'SI'] 
      }
    ],
    formula: calculateIdealBodyWeight,
    references: ['Devine BJ. Drug Intell Clin Pharm. 1974;8:650-655'],
    unit: 'kg'
  },
  {
    id: 'adjusted-body-weight',
    name: 'Adjusted Body Weight',
    category: 'Basic Measurements',
    specialty: 'general',
    description: 'Calculate adjusted body weight for dosing in obese patients',
    inputs: [
      { 
        id: 'height', 
        label: 'Height', 
        type: 'number', 
        unit: 'in', 
        min: 48, 
        max: 96 
      },
      { 
        id: 'gender', 
        label: 'Gender', 
        type: 'select', 
        options: ['male', 'female'] 
      },
      { 
        id: 'actualWeight', 
        label: 'Actual Weight', 
        type: 'number', 
        unit: 'lb', 
        min: 50, 
        max: 500 
      },
      { 
        id: 'unitSystem', 
        label: 'Unit System', 
        type: 'select', 
        options: ['US', 'SI'] 
      }
    ],
    formula: calculateAdjustedBodyWeight,
    references: ['Devine BJ. Drug Intell Clin Pharm. 1974;8:650-655'],
    unit: 'kg'
  },
  {
    id: 'mean-arterial-pressure',
    name: 'Mean Arterial Pressure (MAP)',
    category: 'Vital Signs',
    specialty: 'cardiology',
    description: 'Calculate mean arterial pressure from systolic and diastolic blood pressure',
    inputs: [
      { 
        id: 'sbp', 
        label: 'Systolic Blood Pressure', 
        type: 'number', 
        unit: 'mmHg', 
        min: 60, 
        max: 250 
      },
      { 
        id: 'dbp', 
        label: 'Diastolic Blood Pressure', 
        type: 'number', 
        unit: 'mmHg', 
        min: 40, 
        max: 150 
      }
    ],
    formula: calculateMAP,
    interpretation: mapInterpretation,
    references: ['Magder S. Crit Care. 2006;10(3):R64'],
    unit: 'mmHg'
  },
  {
    id: 'wells-pe',
    name: "Wells' Criteria for PE",
    category: 'Risk Score',
    specialty: 'pulmonology',
    description: "Calculate Wells' Score for Pulmonary Embolism risk assessment",
    inputs: [
      { 
        id: 'clinicalSignsDVT', 
        label: 'Clinical signs and symptoms of DVT', 
        type: 'boolean' 
      },
      { 
        id: 'peLikely', 
        label: 'PE is #1 diagnosis OR equally likely', 
        type: 'boolean' 
      },
      { 
        id: 'heartRateOver100', 
        label: 'Heart rate > 100', 
        type: 'boolean' 
      },
      { 
        id: 'immobilizationOrSurgery', 
        label: 'Immobilization at least 3 days OR surgery in the previous 4 weeks', 
        type: 'boolean' 
      },
      { 
        id: 'previousDVTorPE', 
        label: 'Previous, objectively diagnosed PE or DVT', 
        type: 'boolean' 
      },
      { 
        id: 'hemoptysis', 
        label: 'Hemoptysis', 
        type: 'boolean' 
      },
      { 
        id: 'malignancy', 
        label: 'Malignancy w/ treatment within 6 months or palliative', 
        type: 'boolean' 
      }
    ],
    formula: calculateWellsPE,
    interpretation: wellsPEInterpretation,
    references: [
      'Wells PS, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. Thromb Haemost. 2000;83(3):416-420',
      'Wells PS, et al. Deriving a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. Thromb Haemost. 2000;83(3):416-420'
    ],
    unit: 'points'
  },
  {
    id: 'qtc',
    name: 'Corrected QT Interval (QTc)',
    category: 'ECG',
    specialty: 'cardiology',
    description: 'Calculate corrected QT interval (QTc) using various formulas',
    inputs: [
      {
        id: 'qt',
        label: 'QT Interval',
        type: 'number',
        unit: 'ms',
        min: 200,
        max: 700
      },
      {
        id: 'hr',
        label: 'Heart Rate',
        type: 'number',
        unit: 'bpm',
        min: 30,
        max: 200
      },
      {
        id: 'formula',
        label: 'Formula',
        type: 'select',
        options: ['Bazett', 'Fridericia', 'Framingham', 'Hodges', 'Rautaharju']
      }
    ],
    formula: calculateQTc,
    interpretation: qtcInterpretation,
    references: [
      'Bazett HC. Heart. 1920;7:353-370.',
      'Fridericia LS. Acta Med Scand. 1920;53:469-486.',
      'Sagie A, et al. Circulation. 1992;86:1526-1533.',
      'Hodges M, et al. J Am Coll Cardiol. 1983;1:694.',
      'Rautaharju PM, et al. J Am Coll Cardiol. 1990;16:1547-1557.'
    ],
    unit: 'ms'
  },
  {
    id: 'nihss',
    name: 'NIH Stroke Scale/Score (NIHSS)',
    category: 'Neurology',
    specialty: 'neurology',
    description: 'National Institutes of Health Stroke Scale for quantifying stroke severity',
    inputs: [
      { id: 'loc', label: '1A: Level of consciousness', type: 'select', options: [
        'Alert; keenly responsive',
        'Arouses to minor stimulation',
        'Requires repeated stimulation to arouse or movements to pain',
        'Postures or unresponsive'
      ] },
      { id: 'locQuestions', label: '1B: Ask month and age', type: 'select', options: [
        'Both questions right',
        '1 question right or dysarthric/intubated/trauma/language barrier',
        '0 questions right or aphasic'
      ] },
      { id: 'locCommands', label: "1C: 'Blink eyes' & 'squeeze hands'", type: 'select', options: [
        'Performs both tasks',
        'Performs 1 task',
        'Performs 0 tasks'
      ] },
      { id: 'gaze', label: '2: Horizontal extraocular movements', type: 'select', options: [
        'Normal',
        'Partial gaze palsy (can be overcome or corrects with oculocephalic reflex)',
        'Forced gaze palsy (cannot be overcome)'
      ] },
      { id: 'visual', label: '3: Visual fields', type: 'select', options: [
        'No visual loss',
        'Partial hemianopia',
        'Complete hemianopia',
        'Bilateral hemianopia or bilaterally blind'
      ] },
      { id: 'facialPalsy', label: '4: Facial palsy', type: 'select', options: [
        'Normal symmetry',
        'Minor paralysis',
        'Partial paralysis (lower face)',
        'Unilateral or bilateral complete paralysis (upper/lower face)'
      ] },
      { id: 'motorLeftArm', label: '5A: Left arm motor drift', type: 'select', options: [
        'No drift for 10 seconds or amputation/joint fusion',
        "Drift, but doesn't hit bed",
        'Drift, hits bed or some effort against gravity',
        'No effort against gravity',
        'No movement'
      ] },
      { id: 'motorRightArm', label: '5B: Right arm motor drift', type: 'select', options: [
        'No drift for 10 seconds or amputation/joint fusion',
        "Drift, but doesn't hit bed",
        'Drift, hits bed or some effort against gravity',
        'No effort against gravity',
        'No movement'
      ] },
      { id: 'motorLeftLeg', label: '6A: Left leg motor drift', type: 'select', options: [
        'No drift for 5 seconds or amputation/joint fusion',
        "Drift, but doesn't hit bed",
        'Drift, hits bed or some effort against gravity',
        'No effort against gravity',
        'No movement'
      ] },
      { id: 'motorRightLeg', label: '6B: Right leg motor drift', type: 'select', options: [
        'No drift for 5 seconds or amputation/joint fusion',
        "Drift, but doesn't hit bed",
        'Drift, hits bed or some effort against gravity',
        'No effort against gravity',
        'No movement'
      ] },
      { id: 'ataxia', label: '7: Limb Ataxia', type: 'select', options: [
        'No ataxia or does not understand/paralyzed/amputation/joint fusion',
        'Ataxia in 1 limb',
        'Ataxia in 2 limbs'
      ] },
      { id: 'sensation', label: '8: Sensation', type: 'select', options: [
        'Normal; no sensory loss',
        'Mild-moderate loss: less sharp/more dull or can sense being touched',
        'Complete loss: cannot sense being touched at all or no response/quadriplegic/coma/unresponsive'
      ] },
      { id: 'language', label: '9: Language/aphasia', type: 'select', options: [
        'Normal; no aphasia',
        'Mild-moderate aphasia',
        'Severe aphasia',
        'Mute/global aphasia/coma/unresponsive'
      ] },
      { id: 'dysarthria', label: '10: Dysarthria', type: 'select', options: [
        'Normal or intubated/unable to test',
        'Mild-moderate dysarthria',
        'Severe dysarthria/mute/anarthric'
      ] },
      { id: 'extinction', label: '11: Extinction/inattention', type: 'select', options: [
        'No abnormality',
        'Visual/tactile/auditory/spatial/personal inattention or extinction to bilateral simultaneous stimulation',
        'Profound hemi-inattention/extinction to >1 modality'
      ] }
    ],
    formula: (inputs: Record<string, any>) => {
      // Sum the indices of the selected options for each item
      let total = 0;
      const inputDefs = [
        'loc','locQuestions','locCommands','gaze','visual','facialPalsy','motorLeftArm','motorRightArm','motorLeftLeg','motorRightLeg','ataxia','sensation','language','dysarthria','extinction'
      ];
      inputDefs.forEach((id) => {
        const val = inputs[id];
        if (typeof val === 'number') {
          total += val;
        }
      });
      return total;
    },
    interpretation: nihssInterpretation,
    references: ['Brott T, et al. Measurements of acute cerebral infarction: a clinical examination scale. Stroke. 1989;20(7):864-870.'],
    unit: 'points'
  },
  {
    id: 'child-pugh',
    name: 'Child-Pugh Score for Cirrhosis Mortality',
    category: 'Liver',
    specialty: 'gastroenterology',
    description: 'Estimate cirrhosis severity and mortality risk using the Child-Pugh score',
    inputs: [
      { id: 'bilirubin', label: 'Bilirubin (Total)', type: 'select', options: [
        '<2 mg/dL (<34.2 µmol/L)',
        '2-3 mg/dL (34.2-51.3 µmol/L)',
        '>3 mg/dL (>51.3 µmol/L)'
      ] },
      { id: 'albumin', label: 'Albumin', type: 'select', options: [
        '>3.5 g/dL (>35 g/L)',
        '2.8-3.5 g/dL (28-35 g/L)',
        '<2.8 g/dL (<28 g/L)'
      ] },
      { id: 'inr', label: 'INR', type: 'select', options: [
        '<1.7',
        '1.7-2.3',
        '>2.3'
      ] },
      { id: 'ascites', label: 'Ascites', type: 'select', options: [
        'Absent',
        'Slight',
        'Moderate'
      ] },
      { id: 'encephalopathy', label: 'Encephalopathy', type: 'select', options: [
        'No Encephalopathy',
        'Grade 1-2',
        'Grade 3-4'
      ] }
    ],
    formula: (inputs: Record<string, any>) => {
      // Each select returns index 0, 1, or 2, so add 1 to get score 1, 2, or 3
      let total = 0;
      ['bilirubin','albumin','inr','ascites','encephalopathy'].forEach((id) => {
        const val = inputs[id];
        if (typeof val === 'number') {
          total += (val + 1);
        }
      });
      return total;
    },
    interpretation: childPughInterpretation,
    references: ['Pugh RN, et al. Br J Surg. 1973;60(8):646-649.'],
    unit: 'points'
  },
  {
    id: 'fib4',
    name: 'FIB-4 Score',
    category: 'Liver',
    specialty: 'gastroenterology',
    description: 'Estimate risk of advanced fibrosis in NAFLD using the FIB-4 score',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 1, max: 120 },
      { id: 'ast', label: 'AST', type: 'number', unit: 'U/L', min: 1, max: 10000 },
      { id: 'platelets', label: 'Platelets', type: 'number', unit: '10^9/L', min: 1, max: 1000 },
      { id: 'alt', label: 'ALT', type: 'number', unit: 'U/L', min: 1, max: 10000 }
    ],
    formula: calculateFIB4,
    // NOTE: Show the age-specific chart and interpretation in the CalculationModal UI for this calculation
    interpretation: (fib4: number) => fib4.toFixed(2),
    references: ['Am J Gastroenterol advance online publication, 11 October 2016; doi: 10.1038/ajg.2016.453'],
    unit: ''
  },
  {
    id: 'framingham-risk',
    name: 'Framingham Risk Score for CVD (Canada)',
    category: 'Cardiology',
    specialty: 'cardiology',
    description: 'Estimate 10-year risk of cardiovascular disease using the Canadian Framingham Risk Score (CCS)',
    inputs: [
      { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 30, max: 74 },
      { id: 'sex', label: 'Sex', type: 'select', options: ['female', 'male'] },
      { id: 'smoker', label: 'Smoker', type: 'select', options: ['No', 'Yes'] },
      { id: 'diabetes', label: 'Diabetes', type: 'select', options: ['No', 'Yes'] },
      { id: 'famCvd', label: 'Family history of premature CVD', type: 'select', options: ['No', 'Yes'] },
      { id: 'totalChol', label: 'Total cholesterol', type: 'number', unit: 'mmol/L', min: 2, max: 10 },
      { id: 'hdlChol', label: 'HDL cholesterol', type: 'number', unit: 'mmol/L', min: 0.5, max: 5 },
      { id: 'sbp', label: 'Systolic BP', type: 'number', unit: 'mm Hg', min: 80, max: 250 },
      { id: 'bpTreated', label: 'Blood pressure being treated with medicines', type: 'select', options: ['No', 'Yes'] }
    ],
    formula: (inputs: Record<string, any>) => {
      const result = calculateFraminghamRisk(inputs);
      return result;
    },
    interpretation: (result: any) => `Points: ${result.totalPoints}\n${result.risk}% 10-year risk`,
    references: ['Adapted from https://ccs.ca/frs/'],
    unit: '%'
  }
];