import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Stethoscope, 
  Thermometer, 
  Eye, 
  Heart, 
  HeartPulse, 
  Pill,
  Copy,
  Trash2,
  CheckCircle,
  RotateCcw,
  Brain,
  Bone,
  Shield,
  Activity,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Search,
  FileText,
  TrendingUp,
  Users,
  TestTube,
  Beaker,
  Zap,
  Languages
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

const labCategories = {
  "CBC": {
    icon: TestTube,
    color: "bg-red-600",
    tests: {
      "WBC": { name: "White Blood Cells", range: "4.0-11.0", unit: "×10⁹/L" },
      "RBC": { name: "Red Blood Cells", range: "4.2-5.4 (M), 3.6-5.0 (F)", unit: "×10¹²/L" },
      "Hemoglobin": { name: "Hemoglobin", range: "140-180 (M), 120-160 (F)", unit: "g/L" },
      "Hematocrit": { name: "Hematocrit", range: "0.42-0.52 (M), 0.37-0.47 (F)", unit: "L/L" },
      "Platelets": { name: "Platelets", range: "150-450", unit: "×10⁹/L" }
    }
  },
  "BMP": {
    icon: Beaker,
    color: "bg-blue-600",
    tests: {
      "Sodium": { name: "Sodium", range: "136-145", unit: "mmol/L" },
      "Potassium": { name: "Potassium", range: "3.5-5.0", unit: "mmol/L" },
      "Chloride": { name: "Chloride", range: "98-107", unit: "mmol/L" },
      "CO2": { name: "CO2", range: "22-29", unit: "mmol/L" },
      "Urea": { name: "Urea", range: "2.5-7.1", unit: "mmol/L" },
      "Creatinine": { name: "Creatinine", range: "62-115 (M), 53-97 (F)", unit: "μmol/L" },
      "Glucose": { name: "Glucose", range: "3.9-5.6", unit: "mmol/L" }
    }
  },
  "LFTs": {
    icon: Activity,
    color: "bg-green-600",
    tests: {
      "ALT": { name: "ALT", range: "7-56", unit: "U/L" },
      "AST": { name: "AST", range: "10-40", unit: "U/L" },
      "ALP": { name: "Alkaline Phosphatase", range: "44-147", unit: "U/L" },
      "Total_Bilirubin": { name: "Total Bilirubin", range: "5-21", unit: "μmol/L" },
      "Albumin": { name: "Albumin", range: "35-50", unit: "g/L" }
    }
  },
  "Coagulation": {
    icon: Heart,
    color: "bg-purple-600",
    tests: {
      "PT": { name: "Prothrombin Time", range: "11-13", unit: "seconds" },
      "INR": { name: "INR", range: "0.8-1.1", unit: "" },
      "PTT": { name: "Partial Thromboplastin Time", range: "25-35", unit: "seconds" }
    }
  },
  "Cardiac": {
    icon: HeartPulse,
    color: "bg-red-500",
    tests: {
      "Troponin": { name: "Troponin I", range: "<40", unit: "ng/L" },
      "CK_MB": { name: "CK-MB", range: "0-6.3", unit: "μg/L" },
      "BNP": { name: "BNP", range: "<100", unit: "ng/L" }
    }
  },
  "Inflammatory": {
    icon: Shield,
    color: "bg-orange-600",
    tests: {
      "ESR": { name: "ESR", range: "0-22 (M), 0-29 (F)", unit: "mm/hr" },
      "CRP": { name: "C-Reactive Protein", range: "<3.0", unit: "mg/L" },
      "Procalcitonin": { name: "Procalcitonin", range: "<0.25", unit: "μg/L" }
    }
  },
  "Blood Gases": {
    icon: Zap,
    color: "bg-sky-600",
    tests: {
      "pH": { name: "pH", range: "7.35-7.45", unit: "" },
      "pCO2": { name: "pCO2", range: "35-45", unit: "mmHg" },
      "pO2": { name: "pO2", range: "80-100", unit: "mmHg" },
      "HCO3": { name: "HCO3", range: "22-26", unit: "mmol/L" },
      "Base_Excess": { name: "Base Excess", range: "-2 to +2", unit: "mmol/L" },
      "O2_Sat": { name: "O2 Saturation", range: "95-100", unit: "%" },
      "Lactate": { name: "Lactate", range: "0.5-2.2", unit: "mmol/L" }
    }
  }
};

const intubationParameters = {
  "Mode": { name: "Ventilator Mode", options: ["AC/VC", "SIMV", "PSV", "CPAP", "BiPAP"], unit: "" },
  "TV": { name: "Tidal Volume", range: "200-800", unit: "mL", min: 200, max: 800, step: 10 },
  "RR": { name: "Respiratory Rate", range: "8-35", unit: "/min", min: 8, max: 35, step: 1 },
  "PEEP": { name: "PEEP", range: "0-20", unit: "cmH2O", min: 0, max: 20, step: 1 },
  "FiO2": { name: "FiO2", range: "21-100", unit: "%", min: 21, max: 100, step: 1 },
  "Peak_Pressure": { name: "Peak Pressure", range: "10-50", unit: "cmH2O", min: 10, max: 50, step: 1 },
  "Plateau_Pressure": { name: "Plateau Pressure", range: "10-40", unit: "cmH2O", min: 10, max: 40, step: 1 },
  "Mean_Pressure": { name: "Mean Airway Pressure", range: "5-25", unit: "cmH2O", min: 5, max: 25, step: 1 }
};

const rosOptions = {
  General: {
    detailed: "No fevers, chills, night sweats, or weight loss",
    concise: "No constitutional symptoms"
  },
  HEENT: {
    detailed: "No headaches, visual changes, hearing loss, sore throat, or nasal congestion",
    concise: "No HEENT symptoms"
  },
  Cardiovascular: {
    detailed: "No chest pain, palpitations, shortness of breath, or lower extremity edema",
    concise: "No cardiovascular symptoms"
  },
  Respiratory: {
    detailed: "No cough, shortness of breath, wheezing, or chest tightness",
    concise: "No respiratory symptoms"
  },
  Gastrointestinal: {
    detailed: "No abdominal pain, nausea, vomiting, diarrhea, or constipation",
    concise: "No gastrointestinal symptoms"
  },
  Genitourinary: {
    detailed: "No urinary frequency, urgency, dysuria, or hematuria",
    concise: "No genitourinary symptoms"
  },
  Musculoskeletal: {
    detailed: "No joint pain, muscle aches, back pain, or stiffness",
    concise: "No musculoskeletal symptoms"
  },
  Neurological: {
    detailed: "No headaches, dizziness, weakness, numbness, or changes in coordination",
    concise: "No neurological symptoms"
  },
  Psychiatric: {
    detailed: "No depression, anxiety, mood changes, or sleep disturbances",
    concise: "No psychiatric symptoms"
  },
  Skin: {
    detailed: "No rashes, lesions, itching, or changes in moles",
    concise: "No skin symptoms"
  },
  Endocrine: {
    detailed: "No heat or cold intolerance, excessive thirst, or changes in appetite",
    concise: "No endocrine symptoms"
  },
  Hematologic: {
    detailed: "No easy bruising, bleeding, or swollen lymph nodes",
    concise: "No hematologic symptoms"
  }
};

const physicalExamOptions = {
  General: "Alert, well-appearing, in no acute distress",
  Vital: "Afebrile, normotensive, normal heart rate and respiratory rate",
  HEENT: "NCAT, PERRL, EOMI, no lymphadenopathy, throat clear",
  Cardiovascular: "Regular rate and rhythm, no murmurs, rubs, or gallops",
  Respiratory: "Clear to auscultation bilaterally, no wheezes or rales", 
  Gastrointestinal: "Soft, non-tender, non-distended, normal bowel sounds",
  Genitourinary: "Deferred or normal external genitalia",
  Musculoskeletal: "Normal range of motion, no joint swelling or tenderness",
  Neurological: "Alert and oriented x3, cranial nerves II-XII intact, normal strength and sensation",
  Skin: "Warm, dry, intact, no rashes or lesions",
  Extremities: "No clubbing, cyanosis, or edema"
};

const systemIcons = {
  General: Thermometer,
  HEENT: Eye,
  Cardiovascular: Heart,
  Respiratory: HeartPulse,
  Gastrointestinal: Pill,
  Genitourinary: Shield,
  Musculoskeletal: Bone,
  Neurological: Brain,
  Psychiatric: Activity,
  Skin: CheckCircle,
  Endocrine: Activity,
  Hematologic: Heart,
  Vital: Activity,
  Extremities: Bone
};

const systemColors = {
  General: "bg-blue-600",
  HEENT: "bg-emerald-600", 
  Cardiovascular: "bg-red-600",
  Respiratory: "bg-cyan-600",
  Gastrointestinal: "bg-orange-600",
  Genitourinary: "bg-purple-600",
  Musculoskeletal: "bg-amber-600",
  Neurological: "bg-indigo-600",
  Psychiatric: "bg-pink-600",
  Skin: "bg-teal-600",
  Endocrine: "bg-green-600",
  Hematologic: "bg-rose-600",
  Vital: "bg-slate-600",
  Extremities: "bg-yellow-600"
};

export default function ReviewOfSystems() {
  const [selectedRosSystems, setSelectedRosSystems] = useState<Set<string>>(new Set());
  const [selectedPeSystems, setSelectedPeSystems] = useState<Set<string>>(new Set());
  const [selectedLabCategories, setSelectedLabCategories] = useState<Set<string>>(new Set());
  const [labValues, setLabValues] = useState<Record<string, Record<string, { current: string; past: string[] }>>>({});
  const [normalCategories, setNormalCategories] = useState<Set<string>>(new Set());
  const [bloodGasTypes, setBloodGasTypes] = useState<Record<string, string>>({});
  const [rosSystemModes, setRosSystemModes] = useState<Record<string, "detailed" | "concise">>({});
  const [intubationValues, setIntubationValues] = useState<Record<string, { current: string; past: string[] }>>({});
  const [intubationExpanded, setIntubationExpanded] = useState(false);
  const [note, setNote] = useState("");
  const [rosExpanded, setRosExpanded] = useState(false);
  const [peExpanded, setPeExpanded] = useState(false);
  const [labExpanded, setLabExpanded] = useState(false);
  const [noteType, setNoteType] = useState<"admission" | "progress" | "consultation">("admission");
  const [admissionType, setAdmissionType] = useState<"general" | "icu">("general");
  const [progressType, setProgressType] = useState<"general" | "icu">("general");
  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();

  // Helper function to get translated system names
  const getTranslatedSystemName = (system: string, type: 'ros' | 'pe' | 'lab') => {
    if (language === 'fr') {
      const key = `${type}.${system.toLowerCase().replace(/[^a-z]/g, '')}`;
      const translated = t(key);
      return translated !== key ? translated : system;
    }
    return system;
  }

  const getTranslatedLabTestName = (testName: string): string => {
    if (language === 'fr') {
      const labTestTranslations: Record<string, string> = {
        'White Blood Cells': 'Globules blancs',
        'Red Blood Cells': 'Globules rouges',
        'Hemoglobin': 'Hémoglobine',
        'Hematocrit': 'Hématocrite',
        'Platelets': 'Plaquettes',
        'Sodium': 'Sodium',
        'Potassium': 'Potassium',
        'Chloride': 'Chlorure',
        'CO2': 'CO2',
        'BUN': 'Urée',
        'Creatinine': 'Créatinine',
        'Glucose': 'Glucose',
        'AST': 'AST',
        'ALT': 'ALT',
        'Bilirubin': 'Bilirubine',
        'Total Bilirubin': 'Bilirubine totale',
        'Total Bilirubine': 'Bilirubine totale',
        'Alkaline Phosphatase': 'Phosphatase alcaline',
        'Phosphatase alcaline': 'Phosphatase alcaline',
        'CRP': 'CRP',
        'C-Reactive Protein': 'Protéine C-réactive',
        'ESR': 'VS',
        'Procalcitonin': 'Procalcitonine',
        'PT': 'TP',
        'INR': 'INR',
        'PTT': 'TCA',
        'pH': 'pH',
        'pCO2': 'pCO2',
        'pO2': 'pO2',
        'HCO3': 'HCO3',
        'Base Excess': 'Excès de base',
        'O2 Sat': 'SatO2',
        'Lactate': 'Lactate'
      };
      
      return labTestTranslations[testName] || testName;
    }
    return testName;
  };

  const getTranslatedBloodGasType = (gasType: string): string => {
    if (language === 'fr') {
      const gasTypeTranslations: Record<string, string> = {
        'Arterial': 'Gaz artériel',
        'Venous': 'Gaz veineux',
        'Capillary': 'Gaz capillaire',
        'ABG': 'Gaz artériel',
        'VBG': 'Gaz veineux'
      };
      
      if (gasType.includes('blood gas')) {
        const type = gasType.replace(' blood gas', '');
        return gasTypeTranslations[type] || gasType;
      }
      
      return gasTypeTranslations[gasType] || gasType;
    }
    return gasType;
  };

  const getTranslatedIntubationParameterName = (paramName: string): string => {
    if (language === 'fr') {
      const paramTranslations: Record<string, string> = {
        'Ventilator Mode': 'Mode ventilatoire',
        'Tidal Volume': 'Volume courant',
        'Respiratory Rate': 'Fréquence respiratoire',
        'PEEP': 'PEEP',
        'FiO2': 'FiO2',
        'Peak Pressure': 'Pression de crête',
        'Plateau Pressure': 'Pression de plateau',
        'Mean Airway Pressure': 'Pression moyenne des voies aériennes'
      };
      
      return paramTranslations[paramName] || paramName;
    }
    return paramName;
  };

  // Helper function to translate laboratory test names
  const getLabTestName = (testName: string) => {
    if (language === 'fr') {
      const testMap: { [key: string]: string } = {
        'White Blood Cells': t('lab.test.whiteBloodCells'),
        'Red Blood Cells': t('lab.test.redBloodCells'),
        'Hemoglobin': t('lab.test.hemoglobin'),
        'Hematocrit': t('lab.test.hematocrit'),
        'Platelets': t('lab.test.platelets'),
        'Sodium': t('lab.test.sodium'),
        'Potassium': t('lab.test.potassium'),
        'Chloride': t('lab.test.chloride'),
        'Bicarbonate': t('lab.test.bicarbonate'),
        'Glucose': t('lab.test.glucose'),
        'Creatinine': t('lab.test.creatinine'),
        'BUN': t('lab.test.bun'),
        'Urea': t('lab.test.urea'),
        'Alkaline Phosphatase': t('lab.test.alkalinePhosphatase'),
        'Total Bilirubin': t('lab.test.totalBilirubin'),
        'Albumin': t('lab.test.albumin'),
        'Prothrombin Time': t('lab.test.prothrombinTime'),
        'Partial Thromboplastin Time': t('lab.test.partialThromboplastinTime'),
        'C-Reactive Protein': t('lab.test.cReactiveProtein'),
        'ESR': t('lab.test.esr'),
        'Procalcitonin': t('lab.test.procalcitonin'),
        'Base Excess': t('lab.test.baseExcess')
      };
      return testMap[testName] || testName;
    }
    return testName;
  };

  // Helper function to translate units
  const getTranslatedUnit = (unit: string) => {
    if (language === 'fr') {
      const unitMap: { [key: string]: string } = {
        'seconds': t('lab.unit.seconds')
      };
      return unitMap[unit] || unit;
    }
    return unit;
  };

  // Helper function to translate laboratory category names
  const getLabCategoryName = (categoryName: string) => {
    if (language === 'fr') {
      const categoryMap: { [key: string]: string } = {
        'CBC': 'FSC',
        'BMP': 'Chimie',
        'LFT': 'Bilan hépatique',
        'LFTs': 'Bilan hépatique',
        'Cardiac': 'Cardiaque',
        'Inflammatory': 'Inflammatoire',
        'Blood Gases': 'Gaz'
      };
      return categoryMap[categoryName] || categoryName;
    }
    return categoryName;
  };

  // Update note when note type or admission type changes
  React.useEffect(() => {
    updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
  }, [noteType, admissionType, progressType]);

  const toggleLabCategory = (category: string) => {
    const newSelected = new Set(selectedLabCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
      // Clear lab values for this category
      const newLabValues = { ...labValues };
      delete newLabValues[category];
      setLabValues(newLabValues);
      
      // Remove from normal categories
      const newNormalCategories = new Set(normalCategories);
      newNormalCategories.delete(category);
      setNormalCategories(newNormalCategories);
    } else {
      newSelected.add(category);
      // Initialize lab values for this category
      const categoryTests = labCategories[category as keyof typeof labCategories].tests;
      const newLabValues = { ...labValues };
      newLabValues[category] = {};
      Object.keys(categoryTests).forEach(test => {
        newLabValues[category][test] = { current: "", past: ["", "", "", ""] };
      });
      setLabValues(newLabValues);
    }
    setSelectedLabCategories(newSelected);
    updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
  };

  const updateLabValue = (category: string, test: string, value: string, type: 'current' | 'past' = 'current', pastIndex?: number) => {
    const newLabValues = { ...labValues };
    if (!newLabValues[category]) {
      newLabValues[category] = {};
    }
    if (!newLabValues[category][test]) {
      newLabValues[category][test] = { current: "", past: ["", "", "", ""] };
    }
    
    if (type === 'current') {
      newLabValues[category][test].current = value;
    } else if (pastIndex !== undefined) {
      // Update specific past value index
      const pastValues = [...newLabValues[category][test].past];
      while (pastValues.length < 4) {
        pastValues.push("");
      }
      pastValues[pastIndex] = value;
      newLabValues[category][test].past = pastValues;
    }
    
    setLabValues(newLabValues);
    updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
  };

  const toggleNormalValues = (category: string) => {
    const newLabValues = { ...labValues };
    const newNormalCategories = new Set(normalCategories);
    
    if (normalCategories.has(category)) {
      // Remove normal setting
      if (newLabValues[category]) {
        const categoryKey = `${category}_normal`;
        delete newLabValues[category][categoryKey];
        
        // If no other values exist, clear the category completely
        if (Object.keys(newLabValues[category]).length === 0) {
          delete newLabValues[category];
        }
      }
      newNormalCategories.delete(category);
    } else {
      // Set normal values
      if (!newLabValues[category]) {
        newLabValues[category] = {};
      }
      
      const categoryKey = `${category}_normal`;
      newLabValues[category][categoryKey] = { 
        current: `${category} normal`, 
        past: ["", "", "", ""] 
      };
      newNormalCategories.add(category);
    }
    
    setNormalCategories(newNormalCategories);
    setLabValues(newLabValues);
    updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
  };

  const toggleRosSystem = (system: string, mode: "detailed" | "concise") => {
    const newSelected = new Set(selectedRosSystems);
    const newModes = { ...rosSystemModes };
    
    if (newSelected.has(system) && rosSystemModes[system] === mode) {
      // If already selected with same mode, remove it
      newSelected.delete(system);
      delete newModes[system];
    } else {
      // Add or update the system with new mode
      newSelected.add(system);
      newModes[system] = mode;
    }
    
    setSelectedRosSystems(newSelected);
    setRosSystemModes(newModes);
    updateNote(newSelected, selectedPeSystems, newModes);
    
    toast({
      title: newSelected.has(system) ? "ROS System Added" : "ROS System Removed", 
      description: `${system} ${newSelected.has(system) ? `(${mode}) added to` : "removed from"} note`,
    });
  };

  const togglePeSystem = (system: string) => {
    const newSelected = new Set(selectedPeSystems);
    if (newSelected.has(system)) {
      newSelected.delete(system);
    } else {
      newSelected.add(system);
    }
    setSelectedPeSystems(newSelected);
    updateNote(selectedRosSystems, newSelected, rosSystemModes);
    
    toast({
      title: newSelected.has(system) ? "PE System Added" : "PE System Removed",
      description: `${system} ${newSelected.has(system) ? "added to" : "removed from"} note`,
    });
  };

  const selectAllRosSystems = () => {
    const allSystems = new Set(Object.keys(rosOptions));
    const allModes: Record<string, "detailed" | "concise"> = {};
    Object.keys(rosOptions).forEach(system => {
      allModes[system] = "detailed";
    });
    setSelectedRosSystems(allSystems);
    setRosSystemModes(allModes);
    updateNote(allSystems, selectedPeSystems, allModes);
    toast({
      title: "All ROS Systems Selected",
      description: "Complete ROS with all pertinent negatives generated",
    });
  };

  const selectAllPeSystems = () => {
    const allSystems = new Set(Object.keys(physicalExamOptions));
    setSelectedPeSystems(allSystems);
    updateNote(selectedRosSystems, allSystems, rosSystemModes);
    toast({
      title: "All PE Systems Selected",
      description: "Complete Physical Exam with all normal findings generated",
    });
  };

  const selectAllSystems = () => {
    const allRosSystems = new Set(Object.keys(rosOptions));
    const allPeSystems = new Set(Object.keys(physicalExamOptions));
    const allModes: Record<string, "detailed" | "concise"> = {};
    Object.keys(rosOptions).forEach(system => {
      allModes[system] = "detailed";
    });
    setSelectedRosSystems(allRosSystems);
    setSelectedPeSystems(allPeSystems);
    setRosSystemModes(allModes);
    updateNote(allRosSystems, allPeSystems, allModes);
    toast({
      title: "All Systems Selected",
      description: "Complete ROS and Physical Exam generated",
    });
  };

  const resetForm = () => {
    setSelectedRosSystems(new Set());
    setSelectedPeSystems(new Set());
    setSelectedLabCategories(new Set());
    setLabValues({});
    setNormalCategories(new Set());
    setBloodGasTypes({});
    setRosSystemModes({});
    setIntubationValues({});
    setNote("");
    setRosExpanded(false);
    setPeExpanded(false);
    setLabExpanded(false);
    setIntubationExpanded(false);
    setNoteType("admission");
    setAdmissionType("general");
    setProgressType("general");
    toast({
      title: "Form Reset",
      description: "All selections have been cleared",
    });
  };

  const updateNote = (rosSystems: Set<string>, peSystems: Set<string>, systemModes: Record<string, "detailed" | "concise">) => {
    let noteText = "";
    
    // Generate ROS text for inclusion in HPI
    let rosText = "";
    if (rosSystems.size > 0) {
      const rosEntries = Array.from(rosSystems).map(system => {
        if (language === 'fr') {
          // Use French clinical findings
          const mode = systemModes[system] || "detailed";
          const key = `ros.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}.${mode}`;
          const frenchFindings = t(key);
          return frenchFindings !== key ? frenchFindings : rosOptions[system as keyof typeof rosOptions][mode];
        } else {
          const findings = rosOptions[system as keyof typeof rosOptions];
          const mode = systemModes[system] || "detailed";
          return findings[mode];
        }
      });
      
      rosText = rosEntries.join(", ") + ".";
      
      const uncoveredRosSystems = Object.keys(rosOptions).filter(system => !rosSystems.has(system));
      if (uncoveredRosSystems.length > 0) {
        rosText += language === 'fr' ? ` ${t('note.allOtherSystemsNegative')}` : " All other systems reviewed and negative.";
      }
    }
    
    // Generate Physical Exam text
    let peText = "";
    if (peSystems.size > 0) {
      const peEntries = Array.from(peSystems).map(system => {
        if (language === 'fr') {
          const systemName = getTranslatedSystemName(system, 'pe');
          const frenchFindings = t(`pe.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}`);
          const findings = frenchFindings !== `pe.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}` ? frenchFindings : physicalExamOptions[system as keyof typeof physicalExamOptions];
          return findings;
        } else {
          const findings = physicalExamOptions[system as keyof typeof physicalExamOptions];
          return `${system}: ${findings}`;
        }
      });
      peText = peEntries.join("\n");
    }

    // Generate Laboratory Results text
    let labText = "";
    if (selectedLabCategories.size > 0) {
      const labSections: string[] = [];
      
      Array.from(selectedLabCategories).forEach(category => {
        const categoryData = labCategories[category as keyof typeof labCategories];
        const values = labValues[category] || {};
        
        const categoryResults: string[] = [];
        
        // Check for "normal" entry first
        const normalKey = `${category}_normal`;
        if (values[normalKey] && values[normalKey].current) {
          categoryResults.push(values[normalKey].current);
        } else {
          // Special handling for Blood Gases - format as single line
          if (category === "Blood Gases") {
            const bloodGasResults: string[] = [];
            const otherResults: string[] = [];
            
            Object.entries(categoryData.tests).forEach(([testKey, testData]) => {
              const labValue = values[testKey];
              if (labValue && labValue.current && labValue.current.trim() !== "") {
                if (testKey === "Lactate") {
                  let resultText = `${getTranslatedLabTestName(testData.name)}: ${labValue.current}`;
                  if (labValue.past && labValue.past.length > 0) {
                    const pastValues = labValue.past.filter(val => val.trim() !== "");
                    if (pastValues.length > 0) {
                      resultText += ` (${pastValues.join(", ")})`;
                    }
                  }
                  otherResults.push(resultText);
                } else {
                  let gasValue = `${getTranslatedLabTestName(testData.name)} ${labValue.current}`;
                  if (labValue.past && labValue.past.length > 0) {
                    const pastValues = labValue.past.filter(val => val.trim() !== "");
                    if (pastValues.length > 0) {
                      gasValue += ` (${pastValues.join(", ")})`;
                    }
                  }
                  bloodGasResults.push(gasValue);
                }
              }
            });
            
            // Add grouped blood gas results as single line
            if (bloodGasResults.length > 0) {
              const gasType = bloodGasTypes["Blood Gases"] ? `${bloodGasTypes["Blood Gases"]} blood gas` : "ABG";
              const translatedGasType = getTranslatedBloodGasType(gasType);
              categoryResults.push(`${translatedGasType}: ${bloodGasResults.join(", ")}`);
            }
            
            // Add other results (like lactate)
            categoryResults.push(...otherResults);
          } else {
            // Process individual test results for other categories
            Object.entries(categoryData.tests).forEach(([testKey, testData]) => {
              const labValue = values[testKey];
              if (labValue && labValue.current && labValue.current.trim() !== "") {
                let resultText = `${getTranslatedLabTestName(testData.name)}: ${labValue.current}`;
                
                // Add past values if they exist
                if (labValue.past && labValue.past.length > 0) {
                  const pastValues = labValue.past.filter(val => val.trim() !== "");
                  if (pastValues.length > 0) {
                    resultText += ` (${pastValues.join(", ")})`;
                  }
                }
                
                categoryResults.push(resultText);
              }
            });
          }
        }
        
        if (categoryResults.length > 0) {
          labSections.push(categoryResults.join(", "));
        }
      });
      
      if (labSections.length > 0) {
        labText = labSections.join("\n");
      }
    }
    
    // Generate note based on type
    if (noteType === "admission") {
      if (admissionType === "general") {
        if (language === 'fr') {
          noteText = `MOTIF D'ADMISSION :\n[Entrer le motif d'admission]\n\n`;
          noteText += `ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]\n\n`;
          noteText += `ALLERGIES :\n[Entrer les allergies connues]\n\n`;
          noteText += `HISTOIRE SOCIALE :\n[Entrer l'histoire sociale]\n\n`;
          noteText += `MÉDICAMENTS À DOMICILE :\n[Entrer les médicaments à domicile]\n\n`;
          noteText += `MÉDICAMENTS ACTUELS :\n[Entrer les médicaments actuels]\n\n`;
          noteText += `HISTOIRE DE LA MALADIE ACTUELLE :\n[Entrer l'HMA]`;
        } else {
          noteText = `REASON FOR ADMISSION:\n[Enter reason for admission]\n\n`;
          noteText += `PAST MEDICAL HISTORY:\n[Enter past medical history]\n\n`;
          noteText += `ALLERGIES:\n[Enter known allergies]\n\n`;
          noteText += `SOCIAL HISTORY:\n[Enter social history]\n\n`;
          noteText += `HOME MEDICATIONS:\n[Enter home medications]\n\n`;
          noteText += `CURRENT MEDICATIONS:\n[Enter current medications]\n\n`;
          noteText += `HISTORY OF PRESENTING ILLNESS:\n[Enter HPI]`;
        }
        
        if (rosText) {
          noteText += `\n\n${rosText}`;
        }
        
        noteText += language === 'fr' ? `\n\nEXAMEN PHYSIQUE:` : `\n\nPHYSICAL EXAMINATION:`;
        if (peText) {
          noteText += `\n${peText}`;
        } else {
          noteText += language === 'fr' ? `\n[Entrer les résultats de l'examen physique]` : `\n[Enter physical examination findings]`;
        }
        
        noteText += language === 'fr' ? `\n\nRÉSULTATS DE LABORATOIRE:` : `\n\nLABORATORY RESULTS:`;
        if (labText) {
          noteText += `\n${labText}\n\n`;
        } else {
          noteText += language === 'fr' ? `\n[Entrer les résultats de laboratoire]\n\n` : `\n[Enter laboratory results]\n\n`;
        }
        noteText += language === 'fr' ? `IMAGERIE:\n[Entrer les résultats d'imagerie]\n\n` : `IMAGING:\n[Enter imaging results]\n\n`;
        noteText += language === 'fr' ? `IMPRESSION CLINIQUE:\n[Entrer les impressions cliniques]\n\n` : `CLINICAL IMPRESSION:\n[Enter clinical impressions]\n\n`;
        noteText += language === 'fr' ? `PLAN:\n[Entrer le plan de traitement]` : `PLAN:\n[Enter treatment plan]`;
      } else {
        // ICU admission note
        if (language === 'fr') {
          noteText = `MOTIF D'ADMISSION :\n[Entrer le motif d'admission]\n\n`;
          noteText += `ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]\n\n`;
          noteText += `ALLERGIES :\n[Entrer les allergies connues]\n\n`;
          noteText += `HISTOIRE SOCIALE :\n[Entrer l'histoire sociale]\n\n`;
          noteText += `MÉDICAMENTS À DOMICILE :\n[Entrer les médicaments à domicile]\n\n`;
          noteText += `MÉDICAMENTS ACTUELS :\n[Entrer les médicaments actuels]\n\n`;
          noteText += `HISTOIRE DE LA MALADIE ACTUELLE :\n[Entrer l'HMA]`;
        } else {
          noteText = `REASON FOR ADMISSION:\n[Enter reason for admission]\n\n`;
          noteText += `PAST MEDICAL HISTORY:\n[Enter past medical history]\n\n`;
          noteText += `ALLERGIES:\n[Enter known allergies]\n\n`;
          noteText += `SOCIAL HISTORY:\n[Enter social history]\n\n`;
          noteText += `HOME MEDICATIONS:\n[Enter home medications]\n\n`;
          noteText += `CURRENT MEDICATIONS:\n[Enter current medications]\n\n`;
          noteText += `HISTORY OF PRESENTING ILLNESS:\n[Enter HPI]`;
        }
        
        if (rosText) {
          noteText += `\n\n${rosText}`;
        }
        
        // Map PE findings and lab results to ICU system sections for admission
        const icuAdmissionSections = language === 'fr' ? {
          "NEUROLOGIQUE": {
            peFindings: ["General", "Neurological"],
            labCategories: [],
            labTests: []
          },
          "HÉMODYNAMIQUE": {
            peFindings: ["Cardiovascular", "Vital"],
            labCategories: ["Cardiac"],
            labTests: ["Blood Gases:Lactate"]
          },
          "RESPIRATOIRE": {
            peFindings: ["Respiratory"],
            labCategories: [],
            labTests: ["Blood Gases:pH", "Blood Gases:pCO2", "Blood Gases:pO2", "Blood Gases:HCO3", "Blood Gases:Base_Excess", "Blood Gases:O2_Sat"]
          },
          "GASTRO-INTESTINAL": {
            peFindings: ["Gastrointestinal"],
            labCategories: ["LFTs"],
            labTests: []
          },
          "NÉPHRO-MÉTABOLIQUE": {
            peFindings: ["Genitourinary"],
            labCategories: ["BMP"],
            labTests: []
          },
          "HÉMATO-INFECTIEUX": {
            peFindings: ["Skin", "Extremities"],
            labCategories: ["CBC", "Inflammatory", "Coagulation"],
            labTests: []
          }
        } : {
          "NEUROLOGICAL": {
            peFindings: ["General", "Neurological"],
            labCategories: [],
            labTests: []
          },
          "HEMODYNAMIC": {
            peFindings: ["Cardiovascular", "Vital"],
            labCategories: ["Cardiac"],
            labTests: ["Blood Gases:Lactate"]
          },
          "RESPIRATORY": {
            peFindings: ["Respiratory"],
            labCategories: [],
            labTests: ["Blood Gases:pH", "Blood Gases:pCO2", "Blood Gases:pO2", "Blood Gases:HCO3", "Blood Gases:Base_Excess", "Blood Gases:O2_Sat"]
          },
          "GASTROINTESTINAL": {
            peFindings: ["Gastrointestinal"],
            labCategories: ["LFTs"],
            labTests: []
          },
          "NEPHRO-METABOLIC": {
            peFindings: ["Genitourinary"],
            labCategories: ["BMP"],
            labTests: []
          },
          "HEMATO-INFECTIOUS": {
            peFindings: ["Skin", "Extremities"],
            labCategories: ["CBC", "Inflammatory", "Coagulation"],
            labTests: []
          }
        };
        
        Object.entries(icuAdmissionSections).forEach(([sectionName, config]) => {
          noteText += `\n\n${sectionName}:`;
          
          // Add PE findings with French translation
          const sectionPeFindings = config.peFindings.filter(system => 
            peSystems.size > 0 && Array.from(peSystems).includes(system)
          ).map(system => {
            if (language === 'fr') {
              const key = `pe.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}`;
              const frenchFindings = t(key);
              return frenchFindings !== key ? frenchFindings : physicalExamOptions[system as keyof typeof physicalExamOptions];
            } else {
              const findings = physicalExamOptions[system as keyof typeof physicalExamOptions];
              return findings;
            }
          });
          
          // Add intubation parameters for respiratory section
          const intubationFindings: string[] = [];
          if ((sectionName === "RESPIRATORY" || sectionName === "RESPIRATOIRE") && Object.keys(intubationValues).length > 0) {
            const ventParams: string[] = [];
            Object.entries(intubationValues).forEach(([paramKey, paramData]) => {
              if (paramData.current && paramData.current.trim() !== "") {
                const paramInfo = intubationParameters[paramKey as keyof typeof intubationParameters];
                if (paramInfo) {
                  const translatedParamName = getTranslatedIntubationParameterName(paramInfo.name);
                  let ventEntry = `${translatedParamName}: ${paramData.current}`;
                  
                  // Add trending data if available
                  const pastValues = paramData.past.filter(val => val && val.trim() !== "");
                  if (pastValues.length > 0) {
                    ventEntry += ` (${pastValues.join(", ")})`;
                  }
                  
                  ventParams.push(ventEntry);
                }
              }
            });
            
            if (ventParams.length > 0) {
              const ventSettingsLabel = language === 'fr' ? 'Paramètres ventilatoires' : 'Ventilator settings';
              intubationFindings.push(`${ventSettingsLabel}: ${ventParams.join(", ")}`);
            }
          }
          
          // Add relevant lab results with trending
          const sectionLabFindings: string[] = [];
          
          // Handle specific lab tests first
          if (config.labTests) {
            // Group blood gas results for single line display
            const bloodGasResults: string[] = [];
            const otherLabResults: string[] = [];
            
            config.labTests.forEach(testPath => {
              const [categoryName, testKey] = testPath.split(':');
              if (labValues[categoryName] && labValues[categoryName][testKey]) {
                const testData = labValues[categoryName][testKey];
                if (testData.current && testData.current.trim() !== "") {
                  const categoryData = labCategories[categoryName as keyof typeof labCategories];
                  const testInfo = categoryData.tests[testKey as keyof typeof categoryData.tests];
                  
                  if (categoryName === "Blood Gases") {
                    // For blood gases, collect values for single line display
                    if (testKey === "Lactate") {
                      let labEntry = `Lactate ${testData.current}`;
                      const pastValues = testData.past.filter(val => val && val.trim() !== "");
                      if (pastValues.length > 0) {
                        labEntry += ` [${pastValues.join(", ")}]`;
                      }
                      otherLabResults.push(labEntry);
                    } else {
                      // Collect blood gas values for single line
                      let gasValue = `${testInfo?.name || testKey} ${testData.current}`;
                      const pastValues = testData.past.filter(val => val && val.trim() !== "");
                      if (pastValues.length > 0) {
                        gasValue += ` (${pastValues.join(", ")})`;
                      }
                      bloodGasResults.push(gasValue);
                    }
                  } else {
                    let labEntry = testInfo ? `${testInfo.name} ${testData.current}` : testData.current;
                    
                    const pastValues = testData.past.filter(val => val && val.trim() !== "");
                    if (pastValues.length > 0) {
                      labEntry += ` [${pastValues.join(", ")}]`;
                    }
                    
                    otherLabResults.push(labEntry);
                  }
                }
              }
            });
            
            // Add grouped blood gas results as single line
            if (bloodGasResults.length > 0) {
              const gasType = bloodGasTypes["Blood Gases"] ? `${bloodGasTypes["Blood Gases"]} blood gas` : "ABG";
              sectionLabFindings.push(`${gasType}: ${bloodGasResults.join(", ")}`);
            }
            
            // Add other lab results
            sectionLabFindings.push(...otherLabResults);
          }
          
          // Handle general lab categories (excluding specific tests already handled)
          config.labCategories.forEach(labCategory => {
            if (labValues[labCategory]) {
              const categoryData = labCategories[labCategory as keyof typeof labCategories];
              Object.entries(labValues[labCategory]).forEach(([testKey, testData]) => {
                // Skip if this test is already handled by specific test routing
                const isSpecificTest = config.labTests?.some(testPath => testPath === `${labCategory}:${testKey}`);
                if (isSpecificTest) return;
                
                if (testData.current && testData.current.trim() !== "") {
                  // Check if it's a "normal" entry
                  if (testKey.endsWith('_normal')) {
                    sectionLabFindings.push(testData.current);
                  } else {
                    // Get the test name from categoryData
                    const testInfo = categoryData.tests[testKey as keyof typeof categoryData.tests];
                    let labEntry = testInfo ? `${testInfo.name} ${testData.current}` : testData.current;
                    
                    // Add blood gas type if applicable
                    if (labCategory === "Blood Gases" && bloodGasTypes[labCategory]) {
                      labEntry = `${bloodGasTypes[labCategory]} ${labEntry}`;
                    }
                    
                    // Add trending data if available
                    const pastValues = testData.past.filter(val => val && val.trim() !== "");
                    if (pastValues.length > 0) {
                      labEntry += ` [${pastValues.join(", ")}]`;
                    }
                    
                    sectionLabFindings.push(labEntry);
                  }
                }
              });
            }
          });
          
          const allFindings = [...sectionPeFindings, ...sectionLabFindings, ...intubationFindings];
          
          if (allFindings.length > 0) {
            noteText += `\n${allFindings.join("\n")}`;
          } else {
            noteText += `\n[Enter ${sectionName.toLowerCase()} findings]`;
          }
        });
        
        noteText += `\n\nCLINICAL IMPRESSION:\n[Enter clinical impressions]\n\n`;
        noteText += `PLAN:\n[Enter treatment plan]`;
      }
    } else if (noteType === "progress") {
      if (progressType === "general") {
        noteText = language === 'fr' ? `HISTOIRE DE LA MALADIE ACTUELLE:\n[Entrer le statut actuel et l'historique de l'intervalle]` : `HISTORY OF PRESENTING ILLNESS:\n[Enter current status and interval history]`;
        
        if (rosText) {
          noteText += `\n\n${rosText}`;
        }
        
        noteText += language === 'fr' ? `\n\nEXAMEN PHYSIQUE:` : `\n\nPHYSICAL EXAMINATION:`;
        if (peText) {
          noteText += `\n${peText}`;
        } else {
          noteText += language === 'fr' ? `\n[Entrer les résultats de l'examen physique]` : `\n[Enter physical examination findings]`;
        }
        
        noteText += language === 'fr' ? `\n\nRÉSULTATS DE LABORATOIRE:` : `\n\nLABORATORY RESULTS:`;
        if (labText) {
          noteText += `\n${labText}\n\n`;
        } else {
          noteText += language === 'fr' ? `\n[Entrer les résultats de laboratoire]\n\n` : `\n[Enter laboratory results]\n\n`;
        }
        noteText += language === 'fr' ? `IMAGERIE:\n[Entrer les résultats d'imagerie]\n\n` : `IMAGING:\n[Enter imaging results]\n\n`;
        noteText += language === 'fr' ? `IMPRESSION CLINIQUE:\n[Entrer les impressions cliniques]\n\n` : `CLINICAL IMPRESSION:\n[Enter clinical impressions]\n\n`;
        noteText += language === 'fr' ? `PLAN:\n[Entrer le plan de traitement]` : `PLAN:\n[Enter treatment plan]`;
      } else {
        // ICU progress note
        noteText = language === 'fr' ? `HISTOIRE DE LA MALADIE ACTUELLE:\n[Entrer le statut actuel et l'historique de l'intervalle]` : `HISTORY OF PRESENTING ILLNESS:\n[Enter current status and interval history]`;
        
        if (rosText) {
          noteText += `\n\n${rosText}`;
        }
        
        // Map PE findings and lab results to ICU system sections
        const icuProgressSections = language === 'fr' ? {
          "NEUROLOGIQUE": {
            peFindings: ["General", "Neurological"],
            labCategories: [],
            labTests: []
          },
          "HÉMODYNAMIQUE": {
            peFindings: ["Cardiovascular", "Vital"],
            labCategories: ["Cardiac"],
            labTests: ["Blood Gases:Lactate"]
          },
          "RESPIRATOIRE": {
            peFindings: ["Respiratory"],
            labCategories: [],
            labTests: ["Blood Gases:pH", "Blood Gases:pCO2", "Blood Gases:pO2", "Blood Gases:HCO3", "Blood Gases:Base_Excess", "Blood Gases:O2_Sat"]
          },
          "GASTRO-INTESTINAL": {
            peFindings: ["Gastrointestinal"],
            labCategories: ["LFTs"],
            labTests: []
          },
          "NÉPHRO-MÉTABOLIQUE": {
            peFindings: ["Genitourinary"],
            labCategories: ["BMP"],
            labTests: []
          },
          "HÉMATO-INFECTIEUX": {
            peFindings: ["Skin", "Extremities"],
            labCategories: ["CBC", "Inflammatory", "Coagulation"],
            labTests: []
          }
        } : {
          "NEUROLOGICAL": {
            peFindings: ["General", "Neurological"],
            labCategories: [],
            labTests: []
          },
          "HEMODYNAMIC": {
            peFindings: ["Cardiovascular", "Vital"],
            labCategories: ["Cardiac"],
            labTests: ["Blood Gases:Lactate"]
          },
          "RESPIRATORY": {
            peFindings: ["Respiratory"],
            labCategories: [],
            labTests: ["Blood Gases:pH", "Blood Gases:pCO2", "Blood Gases:pO2", "Blood Gases:HCO3", "Blood Gases:Base_Excess", "Blood Gases:O2_Sat"]
          },
          "GASTROINTESTINAL": {
            peFindings: ["Gastrointestinal"],
            labCategories: ["LFTs"],
            labTests: []
          },
          "NEPHRO-METABOLIC": {
            peFindings: ["Genitourinary"],
            labCategories: ["BMP"],
            labTests: []
          },
          "HEMATO-INFECTIOUS": {
            peFindings: ["Skin", "Extremities"],
            labCategories: ["CBC", "Inflammatory", "Coagulation"],
            labTests: []
          }
        };
        
        Object.entries(icuProgressSections).forEach(([sectionName, config]) => {
          noteText += `\n\n${sectionName}:`;
          
          // Add PE findings with proper French translation
          const sectionPeFindings = config.peFindings.filter(system => 
            peSystems.size > 0 && Array.from(peSystems).includes(system)
          ).map(system => {
            if (language === 'fr') {
              const key = `pe.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}`;
              const frenchFindings = t(key);
              return frenchFindings !== key ? frenchFindings : physicalExamOptions[system as keyof typeof physicalExamOptions];
            } else {
              const findings = physicalExamOptions[system as keyof typeof physicalExamOptions];
              return findings;
            }
          });
          
          // Add intubation parameters for respiratory section
          const intubationFindings: string[] = [];
          if ((sectionName === "RESPIRATORY" || sectionName === "RESPIRATOIRE") && Object.keys(intubationValues).length > 0) {
            const ventParams: string[] = [];
            Object.entries(intubationValues).forEach(([paramKey, paramData]) => {
              if (paramData.current && paramData.current.trim() !== "") {
                const paramInfo = intubationParameters[paramKey as keyof typeof intubationParameters];
                if (paramInfo) {
                  const translatedParamName = getTranslatedIntubationParameterName(paramInfo.name);
                  let ventEntry = `${translatedParamName}: ${paramData.current}`;
                  
                  // Add trending data if available
                  const pastValues = paramData.past.filter(val => val && val.trim() !== "");
                  if (pastValues.length > 0) {
                    ventEntry += ` (${pastValues.join(", ")})`;
                  }
                  
                  ventParams.push(ventEntry);
                }
              }
            });
            
            if (ventParams.length > 0) {
              intubationFindings.push(`Ventilator settings: ${ventParams.join(", ")}`);
            }
          }
          
          // Add relevant lab results with trending
          const sectionLabFindings: string[] = [];
          
          // Handle specific lab tests first
          if (config.labTests) {
            // Group blood gas results for single line display
            const bloodGasResults: string[] = [];
            const otherLabResults: string[] = [];
            
            config.labTests.forEach(testPath => {
              const [categoryName, testKey] = testPath.split(':');
              if (labValues[categoryName] && labValues[categoryName][testKey]) {
                const testData = labValues[categoryName][testKey];
                if (testData.current && testData.current.trim() !== "") {
                  const categoryData = labCategories[categoryName as keyof typeof labCategories];
                  const testInfo = categoryData.tests[testKey as keyof typeof categoryData.tests];
                  
                  if (categoryName === "Blood Gases") {
                    // For blood gases, collect values for single line display
                    if (testKey === "Lactate") {
                      let labEntry = `Lactate ${testData.current}`;
                      const pastValues = testData.past.filter(val => val && val.trim() !== "");
                      if (pastValues.length > 0) {
                        labEntry += ` [${pastValues.join(", ")}]`;
                      }
                      otherLabResults.push(labEntry);
                    } else {
                      // Collect blood gas values for single line
                      let gasValue = `${testInfo?.name || testKey} ${testData.current}`;
                      const pastValues = testData.past.filter(val => val && val.trim() !== "");
                      if (pastValues.length > 0) {
                        gasValue += ` (${pastValues.join(", ")})`;
                      }
                      bloodGasResults.push(gasValue);
                    }
                  } else {
                    let labEntry = testInfo ? `${testInfo.name} ${testData.current}` : testData.current;
                    
                    const pastValues = testData.past.filter(val => val && val.trim() !== "");
                    if (pastValues.length > 0) {
                      labEntry += ` [${pastValues.join(", ")}]`;
                    }
                    
                    otherLabResults.push(labEntry);
                  }
                }
              }
            });
            
            // Add grouped blood gas results as single line
            if (bloodGasResults.length > 0) {
              const gasType = bloodGasTypes["Blood Gases"] ? `${bloodGasTypes["Blood Gases"]} blood gas` : "ABG";
              sectionLabFindings.push(`${gasType}: ${bloodGasResults.join(", ")}`);
            }
            
            // Add other lab results
            sectionLabFindings.push(...otherLabResults);
          }
          
          // Handle general lab categories (excluding specific tests already handled)
          config.labCategories.forEach(labCategory => {
            if (labValues[labCategory]) {
              const categoryData = labCategories[labCategory as keyof typeof labCategories];
              Object.entries(labValues[labCategory]).forEach(([testKey, testData]) => {
                // Skip if this test is already handled by specific test routing
                const isSpecificTest = config.labTests?.some(testPath => testPath === `${labCategory}:${testKey}`);
                if (isSpecificTest) return;
                
                if (testData.current && testData.current.trim() !== "") {
                  // Check if it's a "normal" entry
                  if (testKey.endsWith('_normal')) {
                    sectionLabFindings.push(testData.current);
                  } else {
                    // Get the test name from categoryData
                    const testInfo = categoryData.tests[testKey as keyof typeof categoryData.tests];
                    let labEntry = testInfo ? `${testInfo.name} ${testData.current}` : testData.current;
                    
                    // Add blood gas type if applicable
                    if (labCategory === "Blood Gases" && bloodGasTypes[labCategory]) {
                      labEntry = `${bloodGasTypes[labCategory]} ${labEntry}`;
                    }
                    
                    // Add trending data if available
                    const pastValues = testData.past.filter(val => val && val.trim() !== "");
                    if (pastValues.length > 0) {
                      labEntry += ` [${pastValues.join(", ")}]`;
                    }
                    
                    sectionLabFindings.push(labEntry);
                  }
                }
              });
            }
          });
          
          const allFindings = [...sectionPeFindings, ...sectionLabFindings, ...intubationFindings];
          
          if (allFindings.length > 0) {
            noteText += `\n${allFindings.join("\n")}`;
          } else {
            noteText += `\n[Enter ${sectionName.toLowerCase()} findings]`;
          }
        });
        
        const clinicalImpressionHeader = language === 'fr' ? 'IMPRESSION CLINIQUE' : 'CLINICAL IMPRESSION';
        const clinicalImpressionText = language === 'fr' ? '[Entrer les impressions cliniques]' : '[Enter clinical impressions]';
        const planHeader = language === 'fr' ? 'PLAN' : 'PLAN';
        const planText = language === 'fr' ? '[Entrer le plan de traitement]' : '[Enter treatment plan]';
        noteText += `\n\n${clinicalImpressionHeader}:\n${clinicalImpressionText}\n\n`;
        noteText += `${planHeader}:\n${planText}`;
      }
    } else if (noteType === "consultation") {
      noteText = `CONSULTATION NOTE:\n[Consultation sections to be defined]`;
    }
    
    // Apply complete French translations to the entire note text
    if (language === 'fr') {
      // Fix any remaining English laboratory test names
      noteText = noteText.replace(/White Blood Cells/g, 'Globules blancs');
      noteText = noteText.replace(/Red Blood Cells/g, 'Globules rouges');
      noteText = noteText.replace(/Hemoglobin/g, 'Hémoglobine');
      noteText = noteText.replace(/Hematocrit/g, 'Hématocrite');
      noteText = noteText.replace(/Platelets/g, 'Plaquettes');
      noteText = noteText.replace(/Sodium/g, 'Sodium');
      noteText = noteText.replace(/Potassium/g, 'Potassium');
      noteText = noteText.replace(/Chloride/g, 'Chlorure');
      noteText = noteText.replace(/Bicarbonate/g, 'Bicarbonate');
      noteText = noteText.replace(/Glucose/g, 'Glucose');
      noteText = noteText.replace(/Creatinine/g, 'Créatinine');
      noteText = noteText.replace(/BUN/g, 'Urée');
      noteText = noteText.replace(/Urea/g, 'Urée');
      noteText = noteText.replace(/Alkaline Phosphatase/g, 'Phosphatase alkaline');
      noteText = noteText.replace(/Total Bilirubin/g, 'Bilirubine totale');
      noteText = noteText.replace(/Albumin/g, 'Albumine');
      noteText = noteText.replace(/Prothrombin Time/g, 'PT');
      noteText = noteText.replace(/Partial Thromboplastin Time/g, 'PTT');
      noteText = noteText.replace(/C-Reactive Protein/g, 'CRP');
      noteText = noteText.replace(/ESR/g, 'VS');
      noteText = noteText.replace(/Procalcitonin/g, 'Procalcitonine');
      noteText = noteText.replace(/Base Excess/g, 'Excédent de base');
      noteText = noteText.replace(/Lactate/g, 'Lactate');
      
      // Fix any remaining English section headers
      noteText = noteText.replace(/CLINICAL IMPRESSION:/g, 'IMPRESSION CLINIQUE:');
      noteText = noteText.replace(/PLAN:/g, 'PLAN:');
      noteText = noteText.replace(/ABG:/g, 'GAZ:');
      noteText = noteText.replace(/Ventilator settings:/g, 'Paramètres ventilatoires:');
      
      // Fix any remaining English physical exam findings
      noteText = noteText.replace(/No acute distress/g, 'Aucune détresse aiguë');
      noteText = noteText.replace(/Alert and oriented/g, 'Alerte et orienté');
      noteText = noteText.replace(/Regular rate and rhythm/g, 'Rythme et fréquence réguliers');
      noteText = noteText.replace(/Clear to auscultation bilaterally/g, 'Clair à l\'auscultation bilatérale');
      noteText = noteText.replace(/Soft, non-tender, non-distended/g, 'Souple, non sensible, non distendu');
      noteText = noteText.replace(/No pedal edema/g, 'Aucun œdème des membres inférieurs');
      noteText = noteText.replace(/Warm and well-perfused/g, 'Chaud et bien perfusé');
      noteText = noteText.replace(/No rash or lesions/g, 'Aucune éruption cutanée ou lésion');
      
      // Fix any remaining English placeholder text
      noteText = noteText.replace(/\[Enter neurologique findings\]/g, '[Entrer les constatations neurologiques]');
      noteText = noteText.replace(/\[Enter hémodynamique findings\]/g, '[Entrer les constatations hémodynamiques]');
      noteText = noteText.replace(/\[Enter respiratoire findings\]/g, '[Entrer les constatations respiratoires]');
      noteText = noteText.replace(/\[Enter gastro-intestinal findings\]/g, '[Entrer les constatations gastro-intestinales]');
      noteText = noteText.replace(/\[Enter néphro-métabolique findings\]/g, '[Entrer les constatations néphro-métaboliques]');
      noteText = noteText.replace(/\[Enter hémato-infectieux findings\]/g, '[Entrer les constatations hémato-infectieuses]');
      noteText = noteText.replace(/\[Enter (.+?) findings\]/g, '[Entrer les constatations $1]');
      
      // Fix specific placeholder texts for clinical impression and plan
      noteText = noteText.replace(/\[Enter clinical impressions\]/g, '[Entrer les impressions cliniques]');
      noteText = noteText.replace(/\[Enter treatment plan\]/g, '[Entrer le plan de traitement]');
    }
    
    setNote(noteText);
  };

  const copyNote = async () => {
    try {
      await navigator.clipboard.writeText(note);
      toast({
        title: "Note Copied",
        description: "ROS note copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy note to clipboard",
        variant: "destructive",
      });
    }
  };

  const totalRosSystems = Object.keys(rosOptions).length;
  const totalPeSystems = Object.keys(physicalExamOptions).length;
  const totalSystems = totalRosSystems + totalPeSystems;
  const documentedSystems = selectedRosSystems.size + selectedPeSystems.size;
  const completionPercentage = Math.round((documentedSystems / totalSystems) * 100);

  const renderRosSection = () => (
    <Card className="overflow-hidden">
      <div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 cursor-pointer"
        onClick={() => setRosExpanded(!rosExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardList className="text-white w-5 h-5" />
            <h3 className="text-lg font-semibold text-white">{language === 'fr' ? 'Revue des systèmes' : 'Review of systems'}</h3>
            <span className="text-white/80 text-sm">({selectedRosSystems.size}/{Object.keys(rosOptions).length})</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectAllRosSystems();
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? t('button.selectAll') : 'Select All'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRosSystems(new Set());
                setRosSystemModes({});
                updateNote(new Set(), selectedPeSystems, {});
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? t('button.clear') : 'Clear'}
            </button>
            {rosExpanded ? (
              <ChevronUp className="text-white w-5 h-5" />
            ) : (
              <ChevronDown className="text-white w-5 h-5" />
            )}
          </div>
        </div>
      </div>
      {rosExpanded && (
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(rosOptions).map(([system, findings]) => {
              const IconComponent = systemIcons[system as keyof typeof systemIcons];
              const colorClass = systemColors[system as keyof typeof systemColors];
              const isSelected = selectedRosSystems.has(system);
              const selectedMode = rosSystemModes[system];
              
              return (
                <div key={system} className="group relative">
                  <Card 
                    className={`transition-all duration-200 hover:shadow-lg ${
                      isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <CardContent className="p-4 relative overflow-hidden">
                      {/* Normal view */}
                      <div className="group-hover:opacity-0 transition-opacity duration-200">
                        <div className="flex items-start space-x-3">
                          <div className={`${colorClass} p-2 rounded-lg flex-shrink-0`}>
                            <IconComponent className="text-white w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold text-gray-900 text-sm">{getTranslatedSystemName(system, 'ros')}</h4>
                              {isSelected && (
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs text-gray-500 capitalize">{selectedMode}</span>
                                  <CheckCircle className="text-green-500 w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {isSelected ? findings[selectedMode] : (language === 'fr' ? "Survoler pour sélectionner détaillé ou concis" : "Hover to select detailed or concise")}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Hover split view */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white">
                        <div className="h-full flex">
                          {/* Detailed half */}
                          <div 
                            className={`w-1/2 p-3 cursor-pointer transition-colors duration-200 hover:bg-blue-50 border-r border-gray-200 ${
                              selectedMode === "detailed" ? "bg-blue-100" : ""
                            }`}
                            onClick={() => toggleRosSystem(system, "detailed")}
                          >
                            <div className="flex items-start space-x-2">
                              <div className={`${colorClass} p-1.5 rounded flex-shrink-0`}>
                                <IconComponent className="text-white w-3 h-3" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-medium text-gray-900 text-xs">{language === 'fr' ? t('ros.mode.detailed') : 'Detailed'}</h5>
                                  {selectedMode === "detailed" && (
                                    <CheckCircle className="text-green-500 w-3 h-3" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 leading-tight">
                                  {language === 'fr' ? 
                                    t(`ros.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}.detailed`) || findings.detailed 
                                    : findings.detailed}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Concise half */}
                          <div 
                            className={`w-1/2 p-3 cursor-pointer transition-colors duration-200 hover:bg-purple-50 ${
                              selectedMode === "concise" ? "bg-purple-100" : ""
                            }`}
                            onClick={() => toggleRosSystem(system, "concise")}
                          >
                            <div className="flex items-start space-x-2">
                              <div className={`${colorClass} p-1.5 rounded flex-shrink-0`}>
                                <IconComponent className="text-white w-3 h-3" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <h5 className="font-medium text-gray-900 text-xs">{language === 'fr' ? t('ros.mode.concise') : 'Concise'}</h5>
                                  {selectedMode === "concise" && (
                                    <CheckCircle className="text-green-500 w-3 h-3" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 leading-tight">
                                  {language === 'fr' ? 
                                    t(`ros.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}.concise`) || findings.concise 
                                    : findings.concise}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );



  const renderPeSection = () => (
    <Card className="overflow-hidden">
      <div 
        className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 cursor-pointer"
        onClick={() => setPeExpanded(!peExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search className="text-white w-5 h-5" />
            <h3 className="text-lg font-semibold text-white">{language === 'fr' ? 'Examen physique' : 'Physical Exam'}</h3>
            <span className="text-white/80 text-sm">({selectedPeSystems.size}/{Object.keys(physicalExamOptions).length})</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                selectAllPeSystems();
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? t('button.selectAll') : 'Select All'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPeSystems(new Set());
                updateNote(selectedRosSystems, new Set(), rosSystemModes);
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? t('button.clear') : 'Clear'}
            </button>
            {peExpanded ? (
              <ChevronUp className="text-white w-5 h-5" />
            ) : (
              <ChevronDown className="text-white w-5 h-5" />
            )}
          </div>
        </div>
      </div>
      {peExpanded && (
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(physicalExamOptions).map(([system, findings]) => {
              const IconComponent = systemIcons[system as keyof typeof systemIcons];
              const colorClass = systemColors[system as keyof typeof systemColors];
              const isSelected = selectedPeSystems.has(system);
              
              return (
                <Card 
                  key={system} 
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => togglePeSystem(system)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`${colorClass} p-2 rounded-lg flex-shrink-0`}>
                        <IconComponent className="text-white w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{getTranslatedSystemName(system, 'pe')}</h4>
                          {isSelected && (
                            <CheckCircle className="text-green-500 w-4 h-4" />
                          )}
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {language === 'fr' ? 
                            t(`pe.findings.${system.toLowerCase().replace(/[^a-z]/g, '')}`) || findings 
                            : findings}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="text-white w-4 h-4" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Arinote</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Languages className="w-4 h-4 text-gray-500" />
              <div className="flex border rounded-lg">
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-l-lg transition-colors ${
                    language === 'en' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setLanguage('en')}
                >
                  EN
                </button>
                <button
                  className={`px-3 py-1 text-sm font-medium rounded-r-lg transition-colors ${
                    language === 'fr' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setLanguage('fr')}
                >
                  FR
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Selection Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Note Type Selection */}
            <Card>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('noteType.label')}</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={resetForm}
                    className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {t('button.clearAll')}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      noteType === "admission" 
                        ? "border-blue-500 bg-blue-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setNoteType("admission")}
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className={`w-5 h-5 ${noteType === "admission" ? "text-blue-600" : "text-gray-400"}`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{language === 'fr' ? 'Note d\'admission' : 'Admission Note'}</h4>
                        <p className="text-sm text-gray-500">{language === 'fr' ? 'Évaluation initiale du patient' : 'Initial patient assessment'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      noteType === "progress" 
                        ? "border-green-500 bg-green-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setNoteType("progress")}
                  >
                    <div className="flex items-center space-x-3">
                      <TrendingUp className={`w-5 h-5 ${noteType === "progress" ? "text-green-600" : "text-gray-400"}`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{language === 'fr' ? 'Note d\'évolution' : 'Progress Note'}</h4>
                        <p className="text-sm text-gray-500">{language === 'fr' ? 'Mise à jour quotidienne du patient' : 'Daily patient update'}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      noteType === "consultation" 
                        ? "border-purple-500 bg-purple-50" 
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setNoteType("consultation")}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className={`w-5 h-5 ${noteType === "consultation" ? "text-purple-600" : "text-gray-400"}`} />
                      <div>
                        <h4 className="font-medium text-gray-900">{language === 'fr' ? 'Consultation' : 'Consultation'}</h4>
                        <p className="text-sm text-gray-500">{language === 'fr' ? 'Évaluation spécialisée' : 'Specialist evaluation'}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Admission Note Sub-options */}
                {noteType === "admission" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">{language === 'fr' ? 'Type d\'admission' : 'Admission Type'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          admissionType === "general" 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setAdmissionType("general")}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${admissionType === "general" ? "bg-blue-500" : "bg-gray-300"}`} />
                          <span className="font-medium text-gray-900">{t('admission.general')}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-5">{t('admission.general.desc')}</p>
                      </div>
                      
                      <div 
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          admissionType === "icu" 
                            ? "border-blue-500 bg-blue-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setAdmissionType("icu")}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${admissionType === "icu" ? "bg-blue-500" : "bg-gray-300"}`} />
                          <span className="font-medium text-gray-900">{t('admission.icu')}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-5">{t('admission.icu.desc')}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Progress Note Sub-options */}
                {noteType === "progress" && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-gray-900 mb-3">{language === 'fr' ? 'Type d\'évolution' : 'Progress Type'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div 
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          progressType === "general" 
                            ? "border-green-500 bg-green-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setProgressType("general")}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${progressType === "general" ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="font-medium text-gray-900">{t('progress.general')}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-5">{t('progress.general.desc')}</p>
                      </div>
                      
                      <div 
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          progressType === "icu" 
                            ? "border-green-500 bg-green-50" 
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => setProgressType("icu")}
                      >
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${progressType === "icu" ? "bg-green-500" : "bg-gray-300"}`} />
                          <span className="font-medium text-gray-900">{t('progress.icu')}</span>
                        </div>
                        <p className="text-sm text-gray-500 ml-5">{t('progress.icu.desc')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Review of Systems Dropdown */}
            {renderRosSection()}

            {/* Physical Exam Dropdown */}
            {renderPeSection()}

            {/* Laboratory Results Dropdown */}
            <Card className="overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 cursor-pointer"
                onClick={() => setLabExpanded(!labExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TestTube className="text-white w-5 h-5" />
                    <h3 className="text-lg font-semibold text-white">{t('labResults.title')}</h3>
                    <span className="text-white/80 text-sm">({selectedLabCategories.size}/{Object.keys(labCategories).length})</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLabCategories(new Set());
                        setLabValues({});
                        updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
                      }}
                      className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      {language === 'fr' ? t('button.clear') : 'Clear'}
                    </button>
                    {labExpanded ? (
                      <ChevronUp className="text-white w-5 h-5" />
                    ) : (
                      <ChevronDown className="text-white w-5 h-5" />
                    )}
                  </div>
                </div>
              </div>
              {labExpanded && (
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(labCategories).map(([category, categoryData]) => {
                      const IconComponent = categoryData.icon;
                      const colorClass = categoryData.color;
                      const isSelected = selectedLabCategories.has(category);
                      
                      return (
                        <div key={category} className="group relative">
                          <Card 
                            className={`transition-all duration-200 hover:shadow-lg cursor-pointer ${
                              isSelected ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => toggleLabCategory(category)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3 mb-3">
                                <div className={`${colorClass} p-2 rounded-lg flex-shrink-0`}>
                                  <IconComponent className="text-white w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold text-gray-900 text-sm">{getLabCategoryName(category)}</h4>
                                    {isSelected && (
                                      <CheckCircle className="text-green-500 w-4 h-4" />
                                    )}
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    isSelected 
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {isSelected ? (language === 'fr' ? t('lab.interface.selected') : 'Selected') : (language === 'fr' ? t('lab.interface.clickToSelect') : 'Click to select')}
                                  </span>
                                </div>
                              </div>
                              
                              {isSelected && (
                                <div className="space-y-2 border-t pt-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-600">{language === 'fr' ? t('lab.interface.labValues') : 'Lab Values'}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleNormalValues(category);
                                      }}
                                      className={`text-xs px-2 py-1 rounded transition-colors ${
                                        normalCategories.has(category)
                                          ? 'bg-green-100 text-green-700 border border-green-300 hover:bg-red-100 hover:text-red-700'
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      }`}
                                    >
                                      {normalCategories.has(category) ? 
                                        (language === 'fr' ? t('lab.interface.normalSet') : '✓ Normal Set (click to remove)') : 
                                        (language === 'fr' ? t('lab.interface.setNormal') : 'Set Normal')}
                                    </button>
                                  </div>
                                  {category === "Blood Gases" && (
                                    <div className="mb-3">
                                      <label className="text-xs font-medium text-gray-700 block mb-2">
                                        {language === 'fr' ? t('lab.interface.bloodGasType') : 'Blood Gas Type'}
                                      </label>
                                      <div className="flex space-x-2">
                                        {["Arterial", "Venous", "Capillary"].map((gasType) => (
                                          <button
                                            key={gasType}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const newTypes = { ...bloodGasTypes };
                                              newTypes[category] = bloodGasTypes[category] === gasType ? "" : gasType;
                                              setBloodGasTypes(newTypes);
                                              updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
                                            }}
                                            className={`flex-1 text-xs px-2 py-1 rounded transition-colors ${
                                              bloodGasTypes[category] === gasType
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                          >
                                            {language === 'fr' ? 
                                              (gasType === 'Arterial' ? t('lab.interface.arterial') : 
                                               gasType === 'Venous' ? t('lab.interface.venous') : 
                                               gasType === 'Capillary' ? t('lab.interface.capillary') : gasType) 
                                              : gasType}
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  {Object.entries(categoryData.tests).map(([testKey, testData]) => (
                                    <div key={testKey} className="space-y-1">
                                      <label className="text-xs font-medium text-gray-700">
                                        {getLabTestName(testData.name)}
                                      </label>
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          type="text"
                                          placeholder={language === 'fr' ? t('lab.interface.currentValue') : 'Current value'}
                                          value={labValues[category]?.[testKey]?.current || ""}
                                          onChange={(e) => updateLabValue(category, testKey, e.target.value, 'current')}
                                          className="text-xs h-8 flex-1"
                                        />
                                        <span className="text-xs text-gray-500 min-w-fit">{testData.unit}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center space-x-1">
                                          <span className="text-xs text-gray-400 w-16">{language === 'fr' ? t('lab.interface.trend') : 'Trend'}:</span>
                                          {[0, 1, 2, 3].map((index) => (
                                            <Input
                                              key={index}
                                              type="text"
                                              placeholder={`T-${index + 1}`}
                                              value={labValues[category]?.[testKey]?.past?.[index] || ""}
                                              onChange={(e) => updateLabValue(category, testKey, e.target.value, 'past', index)}
                                              className="text-xs h-8 flex-1"
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        Normal: {testData.range}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Intubation Parameters - Only show for ICU notes */}
            {(noteType === "admission" && admissionType === "icu") || (noteType === "progress" && progressType === "icu") ? (
              <Card className="overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 cursor-pointer"
                  onClick={() => setIntubationExpanded(!intubationExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Activity className="text-white w-5 h-5" />
                      <h3 className="text-lg font-semibold text-white">{language === 'fr' ? 'Paramètres d\'intubation' : 'Intubation Parameters'}</h3>
                      <span className="text-white/80 text-sm">({Object.keys(intubationValues).filter(key => intubationValues[key]?.current).length}/{Object.keys(intubationParameters).length})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIntubationValues({});
                          updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
                        }}
                        className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
{language === 'fr' ? 'Effacer' : 'Clear'}
                      </button>
                      {intubationExpanded ? (
                        <ChevronUp className="text-white w-5 h-5" />
                      ) : (
                        <ChevronDown className="text-white w-5 h-5" />
                      )}
                    </div>
                  </div>
                </div>
                {intubationExpanded && (
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(intubationParameters).map(([paramKey, paramData]) => (
                        <div key={paramKey} className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-blue-600 p-2 rounded-lg flex-shrink-0">
                              <Activity className="text-white w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{getTranslatedIntubationParameterName(paramData.name)}</h4>
                              <p className="text-sm text-gray-500">
                                {paramData.options ? `Options: ${paramData.options.join(", ")}` : `Range: ${paramData.range}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-gray-700">{language === 'fr' ? 'Valeur actuelle' : 'Current Value'}</label>
                              <div className="flex items-center space-x-2">
                                {'options' in paramData ? (
                                  <select
                                    value={intubationValues[paramKey]?.current || ""}
                                    onChange={(e) => {
                                      const newValues = { ...intubationValues };
                                      if (!newValues[paramKey]) {
                                        newValues[paramKey] = { current: "", past: ["", "", "", ""] };
                                      }
                                      newValues[paramKey].current = e.target.value;
                                      setIntubationValues(newValues);
                                      updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
                                    }}
                                    className="text-xs h-8 flex-1 border rounded px-2"
                                  >
                                    <option value="">{language === 'fr' ? 'Sélectionner le mode' : 'Select mode'}</option>
                                    {paramData.options.map((option: string) => (
                                      <option key={option} value={option}>{option}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <div className="flex-1 space-y-2">
                                    <Slider
                                      value={[parseInt(intubationValues[paramKey]?.current || `${paramData.min}`)]}
                                      onValueChange={(value) => {
                                        const newValues = { ...intubationValues };
                                        if (!newValues[paramKey]) {
                                          newValues[paramKey] = { current: "", past: ["", "", "", ""] };
                                        }
                                        newValues[paramKey].current = value[0].toString();
                                        setIntubationValues(newValues);
                                        updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
                                      }}
                                      max={paramData.max}
                                      min={paramData.min}
                                      step={paramData.step}
                                      className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                      <span>{paramData.min}</span>
                                      <span className="font-medium text-gray-900">
                                        {intubationValues[paramKey]?.current || paramData.min} {paramData.unit}
                                      </span>
                                      <span>{paramData.max}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-gray-400 min-w-fit pr-2">{language === 'fr' ? 'Tendance:' : 'Trend:'}</span>
                                {[0, 1, 2, 3].map((index) => (
                                  <Input
                                    key={index}
                                    type="text"
                                    placeholder={`T-${index + 1}`}
                                    value={intubationValues[paramKey]?.past?.[index] || ""}
                                    onChange={(e) => {
                                      const newValues = { ...intubationValues };
                                      if (!newValues[paramKey]) {
                                        newValues[paramKey] = { current: "", past: ["", "", "", ""] };
                                      }
                                      newValues[paramKey].past[index] = e.target.value;
                                      setIntubationValues(newValues);
                                      updateNote(selectedRosSystems, selectedPeSystems, rosSystemModes);
                                    }}
                                    className="text-xs h-8 flex-1"
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ) : null}
          </div>

          {/* Note Generation Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Generated Note */}
            <Card className="overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{language === 'fr' ? 'Note générée' : 'Generated Note'}</h3>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" onClick={copyNote} className="text-gray-400 hover:text-gray-600 h-8 w-8">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={resetForm} className="text-gray-400 hover:text-gray-600 h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">{language === 'fr' ? 'Sélectionnez les systèmes pour générer la note clinique' : 'Select systems to generate clinical note'}</p>
              </div>
              <CardContent className="p-6">
                <Textarea
                  className="w-full h-80 resize-none text-sm leading-relaxed"
                  placeholder={language === 'fr' ? 'Votre note clinique apparaîtra ici lorsque vous sélectionnez des systèmes...' : 'Your clinical note will appear here as you select systems...'}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </CardContent>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Character count: {note.length}</span>
                  <span className="text-gray-500">Total: {documentedSystems}/{totalSystems}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}