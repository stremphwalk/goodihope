import { MainLayout } from "../components/MainLayout";
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";
import { rosSymptomOptions } from "@/constants/rosSymptomOptions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Search,
  FileText,
  TrendingUp,
  Users,
  TestTube,
  Beaker,
  Zap,
  Languages,
  X,
  Camera,
  Plus,
  Globe,
  RefreshCw,
  AlertCircle,
  Edit3,
  Wind,
  Image,
  Minimize,
  Expand,
  Apple
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "react-oidc-context";
// Template context removed - using direct template management

// Type definitions for templates
interface Template {
  id: number;
  title: string;
  name: string;
  description: string;
  specialty: string;
  category: string;
  content: any;
  noteType: string;
  noteSubtype: string;
  compatibleNoteTypes: string[];
  compatibleSubtypes: string[];
  isFavorite: boolean;
}

type NoteType = 'admission' | 'progress' | 'consultation' | 'custom' | null;
type NoteSubtype = 'general' | 'icu' | 'er' | 'clinic';
import { SmartPMHSection } from "@/components/SmartPMHSection";
import { SmartImpressionSection } from "@/components/SmartImpressionSection";
import { MedicationSection } from "@/components/MedicationSectionNew";
import { AllergiesSection } from "@/components/AllergiesSection";
import { SocialHistorySection } from "@/components/SocialHistorySection";
import { ChiefComplaintSection, type ChiefComplaintData } from "@/components/ChiefComplaintSection";
import { type MedicationData, formatMedicationsForNote } from "@/lib/medicationUtils";
import { LabImageUpload } from "@/components/LabImageUpload";
import { LabValuesDisplay } from "@/components/LabValuesDisplay";
import { ImprovedLabInterface } from "@/components/ImprovedLabInterface";
import { processLabValues, formatLabValuesForNote, type LabValue, type ProcessedLabValue } from "@/lib/labUtils";
import * as DiffMatchPatch from 'diff-match-patch';
import { DotPhraseTextarea } from '@/components/DotPhraseTextarea';
import HpiSection from '@/components/HpiSection';
import { TemplateAwareLivePreview } from '@/components/TemplateAwareLivePreview';

import { type TemplateContent, getSectionById } from '@/lib/sectionLibrary';

// Import is correct; RosSymptomAccordion is used inside HpiSection

// Allergies and Social History data structures
interface AllergiesData {
  hasAllergies: boolean;
  allergiesList: string[];
}

interface SocialHistoryData {
  smoking: {
    status: boolean;
    details: string;
  };
  alcohol: {
    status: boolean;
    details: string;
  };
  drugs: {
    status: boolean;
    details: string;
  };
}

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
  }
};

const rosOptions = {
  "Constitutional": {
    detailed: "No fever, chills, night sweats, or unintentional weight loss",
    concise: "Constitutional symptoms negative"
  },
  "HEENT": {
    detailed: "No headache, vision changes, hearing loss, sore throat, or nasal congestion",
    concise: "HEENT review negative"
  },
  "Cardiovascular": {
    detailed: "No chest pain, palpitations, shortness of breath, or lower extremity edema",
    concise: "Cardiovascular review negative"
  },
  "Respiratory": {
    detailed: "No shortness of breath, cough, sputum production, or wheezing",
    concise: "Respiratory review negative"
  },
  "Gastrointestinal": {
    detailed: "No abdominal pain, nausea, vomiting, diarrhea, or constipation",
    concise: "Gastrointestinal review negative"
  },
  "Genitourinary": {
    detailed: "No dysuria, frequency, urgency, or hematuria",
    concise: "Genitourinary review negative"
  },
  "Musculoskeletal": {
    detailed: "No joint pain, muscle weakness, or limitation of movement",
    concise: "Musculoskeletal review negative"
  },
  "Neurological": {
    detailed: "No headache, dizziness, seizures, weakness, or numbness",
    concise: "Neurological review negative"
  },
  "Psychiatric": {
    detailed: "No depression, anxiety, mood changes, or sleep disturbances",
    concise: "Psychiatric review negative"
  },
  "Endocrine": {
    detailed: "No polyuria, polydipsia, heat or cold intolerance",
    concise: "Endocrine review negative"
  },
  "Hematologic": {
    detailed: "No easy bruising, bleeding, or lymph node enlargement",
    concise: "Hematologic review negative"
  }
};

const physicalExamOptions = {
  "General": "Well-appearing, in no acute distress",
  "Vital Signs": "Temperature 98.6°F, Blood pressure 120/80, Heart rate 72, Respiratory rate 16, Oxygen saturation 98% on room air",
  "HEENT": "Normocephalic, atraumatic. Pupils equal, round, reactive to light. Extraocular movements intact. Oropharynx clear",
  "Cardiovascular": "Regular rate and rhythm, no murmurs, rubs, or gallops. No peripheral edema",
  "Respiratory": "Clear to auscultation bilaterally, no wheezes, rales, or rhonchi",
  "Abdominal": "Soft, non-tender, non-distended, bowel sounds present",
  "Neurological": "Alert and oriented x3, cranial nerves II-XII intact, motor strength 5/5 throughout",
  "Musculoskeletal": "Normal range of motion, no joint swelling or tenderness",
  "Skin": "Warm, dry, intact, no rashes or lesions"
};

import { 
  formatSmartText, 
  formatImpressionText, 
  formatPMHText, 
  formatPlanText, 
  formatHPIText,
  shouldFormatSection 
} from '@/utils/textFormatting';
import { formatMedicalNote, applyMedicalStandards } from '@/utils/noteFormatting';
import { AnimatePresence, motion } from 'framer-motion';

interface SidebarStateProps {
  selectedMenu: string;
  setSelectedMenu: (menu: string) => void;
  selectedSubOption: string;
  setSelectedSubOption: (option: string) => void;
}

const SectionWrapper = ({ title, sectionKey, controls, children }: { title: string; sectionKey: string; controls?: React.ReactNode; children: React.ReactNode }) => (
  <div className="medical-section-wrapper">
    <div className="medical-card-header flex items-center justify-between">
      <h2 className="medical-section-title flex items-center gap-2">
        {sectionIcons[sectionKey]}
        {title}
      </h2>
      {controls && <div className="flex gap-2">{controls}</div>}
    </div>
    <div className="medical-section-content">
      {children}
    </div>
  </div>
);

function ReviewOfSystems({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  // Note state with diff-patch-merge tracking
  const [note, setNote] = useState("");
  const [initialGeneratedText, setInitialGeneratedText] = useState("");
  const [currentText, setCurrentText] = useState("");
  const dmp = useRef(new DiffMatchPatch.diff_match_patch());
  
  const [noteType, setNoteType] = useState<NoteType>(null);
  const [customNoteText, setCustomNoteText] = useState<string>("");
  const [admissionType, setAdmissionType] = useState<NoteSubtype>("general");
  const [progressType, setProgressType] = useState<NoteSubtype>("general");
  
  // Template state management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const isTemplateActive = selectedTemplate !== null;
  
  // Template-related state
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  // ROS state
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  interface SymptomObject {
    key: string;
    severity?: 'mild' | 'moderate' | 'severe';
    note?: string;
  }
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, Set<SymptomObject>>>({});
  const [selectedPeSystems, setSelectedPeSystems] = useState<Set<string>>(new Set());
  
  // ICU intubation
  const [intubationValues, setIntubationValues] = useState<Record<string, { current: string; past: string[] }>>({});
  
  const [medications, setMedications] = useState<MedicationData>({ 
    homeMedications: [], 
    hospitalMedications: [] 
  });
  
  const [allergies, setAllergies] = useState<AllergiesData>({ hasAllergies: false, allergiesList: [] });
  const [newAllergy, setNewAllergy] = useState("");
  
  const [socialHistory, setSocialHistory] = useState<SocialHistoryData>({
    smoking: { status: false, details: "" },
    alcohol: { status: false, details: "" },
    drugs: { status: false, details: "" }
  });

  // Local state for social details
  const [smokingDetails, setSmokingDetails] = useState("");
  const [alcoholDetails, setAlcoholDetails] = useState("");
  const [drugsDetails, setDrugsDetails] = useState("");

  // Sync local state
  useEffect(() => {
    setSmokingDetails(socialHistory.smoking.details);
    setAlcoholDetails(socialHistory.alcohol.details);
    setDrugsDetails(socialHistory.drugs.details);
  }, [socialHistory]);

  // Refs for note generation
  const allergiesRef = useRef(allergies);
  const socialHistoryRef = useRef(socialHistory);
  allergiesRef.current = allergies;
  socialHistoryRef.current = socialHistory;
  
  const [chiefComplaint, setChiefComplaint] = useState<ChiefComplaintData>({
    selectedTemplate: "",
    customComplaint: "",
    presentingSymptoms: "",
    onsetDuration: "",
    associatedSymptoms: "",
    aggravatingFactors: "",
    relievingFactors: "",
    previousTreatment: ""
  });

  const [hpiText, setHpiText] = useState<string>("");

  const [pmhText, setPmhText] = useState<string>('');
  const [impressionText, setImpressionText] = useState<string>('');

  const [labValues, setLabValues] = useState<LabValue[]>([]);
  const [processedLabValues, setProcessedLabValues] = useState<ProcessedLabValue[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<Set<string>>(new Set());
  const [selectedPanel, setSelectedPanel] = useState('bmp');
  
  const [activeTab, setActiveTab] = useState("note-type");
  
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const auth = useAuth();

  // Imagery state
  const imagerySystems = [
    { key: "neuro", label: "Neuro", modalities: ["CT Scan", "MRI", "Angio Scan"] },
    { key: "cardiac", label: "Cardiac", modalities: ["Echo", "CT Angio", "MRI"] },
    { key: "chest", label: "Chest", modalities: ["X-Ray", "CT Scan", "Ultrasound"] },
    { key: "abdomen", label: "Abdomen", modalities: ["Ultrasound", "CT Scan", "MRI"] },
    { key: "pelvis", label: "Pelvis", modalities: ["Ultrasound", "CT Scan", "MRI"] },
    { key: "spine", label: "Spine", modalities: ["X-Ray", "CT Scan", "MRI"] },
    { key: "limb", label: "Limb", modalities: ["X-Ray", "CT Scan", "MRI"] },
  ];
  const [imageryStudies, setImageryStudies] = useState<{ system: string; modality: string; result: string }[]>([]);
  const [newSystem, setNewSystem] = useState("");
  const [newModality, setNewModality] = useState("");
  const [newResult, setNewResult] = useState("");
  
  const [expandedSystem, setExpandedSystem] = useState<string | null>(null);
  const [selectedModality, setSelectedModality] = useState<string>("");
  const [resultInput, setResultInput] = useState<string>("");

  const getApiHeaders = useCallback((id_token: string) => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${id_token}`,
  }), []);

  const loadTemplatesForNoteType = useCallback(async (noteType: NoteType | null, subtype: NoteSubtype) => {
    if (!auth.user?.id_token || !noteType) {
      setAvailableTemplates([]);
      return;
    }

    try {
      setLoadingTemplates(true);
      setTemplateError(null);
      
      const params = new URLSearchParams();
      params.append('compatible_note_type', noteType);
      params.append('compatible_subtype', subtype);
      
      const response = await fetch(`/api/templates?${params.toString()}`, {
        headers: getApiHeaders(auth.user.id_token),
      });
      
      if (!response.ok) {
        throw new Error('Failed to load templates');
      }
      
      const data = await response.json();
      const templates = data.map((template: any) => ({
        ...template,
        createdAt: new Date(template.createdAt),
        updatedAt: new Date(template.updatedAt)
      }));
      
      const compatibleTemplates = templates.filter((template: Template) => {
        const noteTypes = template.compatibleNoteTypes as string[] || [];
        const subtypes = template.compatibleSubtypes as string[] || [];
        
        return noteTypes.includes(noteType) && 
               (subtypes.length === 0 || subtypes.includes(subtype));
      });
      
      setAvailableTemplates(compatibleTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
      setTemplateError(error instanceof Error ? error.message : 'Failed to load templates');
      setAvailableTemplates([]);
    } finally {
      setLoadingTemplates(false);
    }
  }, [auth.user?.id_token, getApiHeaders]);

  const getSectionDefaultContent = useCallback((sectionId: string): string => {
    if (!selectedTemplate || !selectedTemplate.content) return '';
    
    try {
      let templateContent: TemplateContent;
      
      if (typeof selectedTemplate.content === 'object' && selectedTemplate.content !== null) {
        templateContent = selectedTemplate.content as TemplateContent;
      } else if (typeof selectedTemplate.content === 'string' && selectedTemplate.content.trim()) {
        const parsed = JSON.parse(selectedTemplate.content);
        if (!parsed || typeof parsed !== 'object') {
          console.warn('Invalid template content structure:', parsed);
          return '';
        }
        templateContent = parsed as TemplateContent;
      } else {
        console.warn('Unsupported template content type:', typeof selectedTemplate.content);
        return '';
      }
      
      if (!templateContent || !Array.isArray(templateContent.sections)) {
        console.warn('Template content missing sections array:', templateContent);
        return '';
      }
      
      const section = templateContent.sections.find(s => s && s.sectionId === sectionId);
      const content = section?.customContent;
      
      return typeof content === 'string' ? content : '';
    } catch (error) {
      console.error('Error accessing section defaults for sectionId:', sectionId, error);
      return '';
    }
  }, [selectedTemplate]);

  const trackTemplateUsage = useCallback(async (template: Template) => {
    if (!auth.user?.id_token) return;
    
    try {
      await fetch('/api/template-usage', {
        method: 'POST',
        headers: getApiHeaders(auth.user.id_token),
        body: JSON.stringify({
          templateId: template.id,
          patientContext: {
            noteType,
            admissionType,
            progressType,
            timestamp: new Date().toISOString()
          }
        }),
      });
    } catch (error) {
      console.error('Failed to track template usage:', error);
    }
  }, [auth.user?.id_token, getApiHeaders, noteType, admissionType, progressType]);

  const handleTemplateSelection = useCallback((template: Template | null) => {
    setSelectedTemplate(template);
    if (template) {
      trackTemplateUsage(template);
    }
  }, [trackTemplateUsage]);

  const handleAddStudy = () => {
    if (!newSystem || !newModality) return;
    setImageryStudies([
      ...imageryStudies,
      { system: newSystem, modality: newModality, result: newResult }
    ]);
    setNewSystem("");
    setNewModality("");
    setNewResult("");
  };
  const handleRemoveStudy = (idx: number) => {
    setImageryStudies(imageryStudies.filter((_, i) => i !== idx));
  };

  const handleManualLabAdd = useCallback((newLabValues: LabValue[]) => {
    if (!Array.isArray(newLabValues) || newLabValues.length === 0) {
      console.warn('Invalid lab values provided to handleManualLabAdd:', newLabValues);
      return;
    }
    setLabValues(prev => [...prev, ...newLabValues]);
  }, []);

  const handleLabRemove = useCallback((testName: string) => {
    if (!testName) {
      console.warn('Invalid test name provided to handleLabRemove:', testName);
      return;
    }
    setLabValues(prev => prev.filter(lab => 
      lab.testName.toLowerCase() !== testName.toLowerCase()
    ));
  }, []);

  useEffect(() => {
    console.log('🔬 Lab values state changed:', labValues);
    if (labValues.length > 0) {
      const processed = processLabValues(labValues);
      setProcessedLabValues(processed);
    } else {
      setProcessedLabValues([]);
    }
  }, [labValues]);

  const handleCompleteReset = useCallback(() => {
    setNoteType(null);
    setAdmissionType("general");
    setProgressType("general");
    
    setAllergies({ hasAllergies: false, allergiesList: [] });
    setSocialHistory({
      smoking: { status: false, details: "" },
      alcohol: { status: false, details: "" },
      drugs: { status: false, details: "" }
    });
    setMedications({
      homeMedications: [],
      hospitalMedications: []
    });
    setSelectedSymptoms({} as Record<string, Set<SymptomObject>>);
    setSelectedPeSystems(new Set());
    setIntubationValues({});
    setPmhText('');
    setImpressionText('');
    setChiefComplaint({
      selectedTemplate: "",
      customComplaint: "",
      presentingSymptoms: "",
      onsetDuration: "",
      associatedSymptoms: "",
      aggravatingFactors: "",
      relievingFactors: "",
      previousTreatment: ""
    });
    setLabValues([]);
    setProcessedLabValues([]);
    setSelectedLabTests(new Set());
    
    setCurrentText("");
    setInitialGeneratedText("");
    
    setActiveTab("note-type");
    
    setShowResetDialog(false);
    
    toast({
      title: language === 'fr' ? 'Réinitialisation complète' : 'Complete Reset',
      description: language === 'fr' ? 'Toutes les données ont été effacées' : 'All data has been cleared',
    });
  }, [language, toast]);

  const getTabOrder = useCallback(() => {
    const baseTabs = ["note-type", "pmh", "allergies-social", "hpi", "meds", "ros"];
    const icuTabs = ((noteType === "admission" && admissionType === "icu") || (noteType === "progress" && progressType === "icu")) 
      ? ["ventilation"] : [];
    const endTabs = ["impression", "labs", "imagery"];
    return [...baseTabs, ...icuTabs, ...endTabs];
  }, [noteType, admissionType, progressType]);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  const documentedSystems = Object.keys(selectedSymptoms).length + selectedPeSystems.size;
  const totalSystems = Object.keys(rosOptions).length + Object.keys(physicalExamOptions).length;

  const handleLabValuesExtracted = useCallback((newLabValues: LabValue[]) => {
    setLabValues(newLabValues);
  }, []);

  useEffect(() => {
    if (labValues && labValues.length > 0) {
      const processed = processLabValues(labValues);
      setProcessedLabValues(processed);
    } else {
      setProcessedLabValues([]);
    }
  }, [labValues]);

  const generateTextFromOptions = useCallback(() => {
    if (noteType === null) {
      return language === 'fr' 
        ? 'Sélectionnez un type de note (Admission, Évolution ou Consultation) pour commencer à générer votre note clinique.'
        : 'Select a note type (Admission, Progress, or Consultation) to start generating your clinical note.';
    }

    const templateContent = selectedTemplate ? (() => {
      try {
        if (typeof selectedTemplate.content === 'object') {
          return selectedTemplate.content;
        }
        if (typeof selectedTemplate.content === 'string') {
          return JSON.parse(selectedTemplate.content);
        }
        return null;
      } catch (error) {
        console.error('Error parsing template content:', error);
        return null;
      }
    })() : null;

    if (templateContent && templateContent.sections && Array.isArray(templateContent.sections)) {
      try {
        return generateTemplateBasedNote(templateContent);
      } catch (error) {
        console.error('Template-based generation failed, falling back to default:', error);
      }
    }

    return generateDefaultNote();
  }, [noteType, selectedTemplate, language, medications, selectedPeSystems, intubationValues, processedLabValues, pmhText, impressionText, chiefComplaint, hpiText, selectedSymptoms, admissionType, progressType]);

  const generateTemplateBasedNote = useCallback((templateContent: any) => {
    try {
      const sections: string[] = [];
      
      if (!templateContent || !Array.isArray(templateContent.sections)) {
        console.error('Invalid template content structure');
        throw new Error('Invalid template content structure');
      }

      const enabledSections = templateContent.sections
        .filter((section: any) => section && section.sectionId && section.isEnabled !== false && getSectionById(section.sectionId))
        .sort((a: any, b: any) => {
          const orderA = typeof a.order === 'number' ? a.order : 999;
          const orderB = typeof b.order === 'number' ? b.order : 999;
          
          if (orderA === orderB) {
            return a.sectionId.localeCompare(b.sectionId);
          }
          
          return orderA - orderB;
        });

      console.log('Template sections order:', enabledSections.map((s: any) => `${s.order}: ${s.sectionId}`));

      enabledSections.forEach((templateSection: any, index: number) => {
        try {
          const sectionContent = generateSectionContent(templateSection.sectionId, templateSection.customContent);
          
          if (sectionContent && sectionContent.trim()) {
            sections.push(sectionContent);
          } else {
            console.warn(`Section ${templateSection.sectionId} at position ${index + 1} generated empty content`);
          }
        } catch (error) {
          console.error(`Error generating section content for ${templateSection.sectionId}:`, error);
          try {
            const header = getSectionHeader(templateSection.sectionId);
            sections.push(`${header}:\n[Error generating ${templateSection.sectionId}]`);
          } catch (headerError) {
            console.error(`Error generating header for ${templateSection.sectionId}:`, headerError);
          }
        }
      });

      const validSections = sections.filter(section => section && section.trim());
      return formatMedicalNote(validSections);
    } catch (error) {
      console.error('Error in generateTemplateBasedNote:', error);
      return language === 'fr' ? 
        'Erreur lors de la génération de la note avec le modèle. Veuillez réessayer.' :
        'Error generating note with template. Please try again.';
    }
  }, [language, medications, selectedPeSystems, intubationValues, processedLabValues, pmhText, impressionText, chiefComplaint, hpiText, selectedSymptoms, noteType, admissionType, progressType]);

  const getContentWithPriority = useCallback((
    userContent: string | undefined,
    customContent: string | undefined,
    placeholderEn: string,
    placeholderFr: string
  ): string => {
    if (userContent && userContent.trim()) {
      return userContent;
    } else if (customContent && customContent.trim()) {
      return customContent;
    } else {
      return language === 'fr' ? placeholderFr : placeholderEn;
    }
  }, [language]);

  const getSectionHeader = useCallback((sectionId: string): string => {
    const sectionDef = getSectionById(sectionId);
    if (sectionDef) {
      const baseHeader = sectionDef.name.toUpperCase();
      
      const translations: Record<string, { en: string; fr: string }> = {
        'NOTE TYPE': { en: 'NOTE TYPE', fr: 'TYPE DE NOTE' },
        'PAST MEDICAL HISTORY': { en: 'PAST MEDICAL HISTORY', fr: 'ANTÉCÉDENTS MÉDICAUX' },
        'ALLERGIES & SOCIAL HISTORY': { en: 'ALLERGIES & SOCIAL HISTORY', fr: 'ALLERGIES & HISTOIRE SOCIALE' },
        'MEDICATIONS': { en: 'MEDICATIONS', fr: 'MÉDICAMENTS' },
        'HISTORY OF PRESENT ILLNESS': { en: 'HISTORY OF PRESENT ILLNESS', fr: 'HISTOIRE DE LA MALADIE ACTUELLE' },
        'PHYSICAL EXAMINATION': { en: 'PHYSICAL EXAMINATION', fr: 'EXAMEN PHYSIQUE' },
        'LABORATORY RESULTS': { en: 'LABORATORY RESULTS', fr: 'RÉSULTATS DE LABORATOIRE' },
        'IMAGING STUDIES': { en: 'IMAGING STUDIES', fr: 'IMAGERIE' },
        'IMPRESSION/ASSESSMENT': { en: 'CLINICAL IMPRESSION', fr: 'IMPRESSION CLINIQUE' },
        'VENTILATION': { en: 'VENTILATION PARAMETERS', fr: 'PARAMÈTRES DE VENTILATION' },
        'TREATMENT PLAN': { en: 'TREATMENT PLAN', fr: 'PLAN DE TRAITEMENT' }
      };
      
      const translation = translations[baseHeader];
      if (translation) {
        return language === 'fr' ? translation.fr : translation.en;
      }
      
      return baseHeader;
    }
    
    return sectionId.toUpperCase().replace(/-/g, ' ');
  }, [language]);

  const generatePlainSectionContent = useCallback((sectionId: string, customContent?: string): string => {
    try {
      if (customContent && customContent.trim()) {
        return customContent;
      }
      
      switch (sectionId) {
        case 'note-type': {
          return noteType ? noteType.toUpperCase() : '[Enter note type]';
        }
        
        case 'pmh': {
          return getContentWithPriority(
            pmhText,
            customContent,
            '[Enter past medical history]',
            '[Entrer les antécédents médicaux]'
          );
        }
        
        case 'ventilation': {
          if (Object.keys(intubationValues).length === 0) {
            return language === 'fr' ? '[Entrer les paramètres de ventilation]' : '[Enter ventilation parameters]';
          }
          
          let intubationText = "";
          Object.entries(intubationValues).forEach(([param, data]) => {
            if (data.current) {
              intubationText += `${param}: ${data.current}\n`;
            }
          });
          
          return intubationText.trim();
        }
        
        case 'plan': {
          return getContentWithPriority(
            undefined,
            customContent,
            '[Enter treatment plan]',
            '[Entrer le plan de traitement]'
          );
        }
        
        case 'allergies-social': {
          let allergiesText = '';
          const currentAllergies = allergiesRef.current;
          if (!currentAllergies) {
            allergiesText = language === 'fr' ? 'ALLERGIES :\nAucune allergie connue' : 'ALLERGIES:\nNKDA (No Known Drug Allergies)';
          } else if (language === 'fr') {
            if (currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
              allergiesText = `ALLERGIES :\n${currentAllergies.allergiesList.join(', ')}`;
            } else {
              allergiesText = `ALLERGIES :\nAucune allergie connue`;
            }
          } else {
            if (currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
              allergiesText = `ALLERGIES:\n${currentAllergies.allergiesList.join(', ')}`;
            } else {
              allergiesText = `ALLERGIES:\nNKDA (No Known Drug Allergies)`;
            }
          }

          let socialText = language === 'fr' ? "HISTOIRE SOCIALE :\n" : "SOCIAL HISTORY:\n";
          const socialItems = [];
          
          const currentSocialHistory = socialHistoryRef.current;
          if (!currentSocialHistory) {
            socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
            socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
            socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
          } else {
            if (currentSocialHistory.smoking.status) {
              socialItems.push(language === 'fr' 
                ? `Tabagisme: ${currentSocialHistory.smoking.details || ''}`
                : `Smoking: ${currentSocialHistory.smoking.details || ''}`);
            } else {
              socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
            }
            
            if (currentSocialHistory.alcohol.status) {
              socialItems.push(language === 'fr' 
                ? `Alcool: ${currentSocialHistory.alcohol.details || ''}`
                : `Alcohol: ${currentSocialHistory.alcohol.details || ''}`);
            } else {
              socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
            }
            
            if (currentSocialHistory.drugs.status) {
              socialItems.push(language === 'fr' 
                ? `Drogues: ${currentSocialHistory.drugs.details || ''}`
                : `Drugs: ${currentSocialHistory.drugs.details || ''}`);
            } else {
              socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
            }
          }
          
          socialText += socialItems.join('\n');
          return `${allergiesText}\n\n${socialText.trim()}`;
        }
        
        case 'meds': {
          let medicationsText = "";
          
          if (language === 'fr') {
            if (medications.homeMedications.length > 0) {
              const organizedHomeMeds = formatMedicationsForNote(medications.homeMedications, 'fr');
              medicationsText += `MÉDICAMENTS À DOMICILE :\n${organizedHomeMeds}\n\n`;
            } else {
              medicationsText += `MÉDICAMENTS À DOMICILE :\n[Aucun médicament à domicile]\n\n`;
            }
            
            if (medications.hospitalMedications.length > 0) {
              const organizedHospitalMeds = formatMedicationsForNote(medications.hospitalMedications, 'fr');
              medicationsText += `MÉDICAMENTS HOSPITALIERS :\n${organizedHospitalMeds}`;
            } else {
              medicationsText += `MÉDICAMENTS HOSPITALIERS :\n[Aucun médicament hospitalier]`;
            }
          } else {
            if (medications.homeMedications.length > 0) {
              const organizedHomeMeds = formatMedicationsForNote(medications.homeMedications, 'en');
              medicationsText += `HOME MEDICATIONS:\n${organizedHomeMeds}\n\n`;
            } else {
              medicationsText += `HOME MEDICATIONS:\n[No home medications]\n\n`;
            }
            
            if (medications.hospitalMedications.length > 0) {
              const organizedHospitalMeds = formatMedicationsForNote(medications.hospitalMedications, 'en');
              medicationsText += `HOSPITAL MEDICATIONS:\n${organizedHospitalMeds}`;
            } else {
              medicationsText += `HOSPITAL MEDICATIONS:\n[No hospital medications]`;
            }
          }
          
          return medicationsText;
        }
        
        case 'hpi': {
          const content = hpiText || (language === 'fr' ? "[Entrer l'HMA]" : "[Enter HPI]");
          
          let rosText = '';
          if (Object.keys(selectedSymptoms).length > 0) {
            const rosSentences = Object.entries(selectedSymptoms).map(([system, symptoms]: [string, Set<SymptomObject>]) => {
              const symptomList = Array.from(symptoms);
              if (symptomList.length === 0) return '';
              const systemObj = (rosSymptomOptions as Record<string, {symptoms: {key: string, en: string, fr: string, description: {en: string, fr: string}}[]} >)[system];
              const getLabel = (key: string) => {
                const found = systemObj?.symptoms.find((s: {key: string}) => s.key === key);
                if (!found) return key.replace(/_/g, ' ');
                return language === 'fr' ? found.fr : found.en;
              };
              let sentence = '';
              if (language === 'fr') {
                sentence = symptomList.map(s => `pas de ${getLabel(s.key)}${s.severity ? ` (${s.severity})` : ''}${s.note ? `: ${s.note}` : ''}`).join(', ');
              } else {
                sentence = symptomList.map(s => `no ${getLabel(s.key).charAt(0).toLowerCase() + getLabel(s.key).slice(1)}${s.severity ? ` (${s.severity})` : ''}${s.note ? `: ${s.note}` : ''}`).join(', ');
              }
              sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
              if (!sentence.endsWith('.')) sentence += '.';
              return sentence;
            }).filter(Boolean);

            if (language === 'fr') {
              rosText = rosSentences.join(' ');
              const uncoveredSystems = Object.keys(rosSymptomOptions).filter(system => !selectedSymptoms[system] || selectedSymptoms[system].size === 0);
              if (uncoveredSystems.length > 0) {
                rosText += ' Tous les autres systèmes révisés et négatifs.';
              }
            } else {
              rosText = rosSentences.join(' ');
              const uncoveredSystems = Object.keys(rosSymptomOptions).filter(system => !selectedSymptoms[system] || selectedSymptoms[system].size === 0);
              if (uncoveredSystems.length > 0) {
                rosText += ' All other systems reviewed and negative.';
              }
            }
          }
          
          const fullContent = rosText ? 
            (content.trim().endsWith('.') ? `${content} ${rosText}` : `${content}. ${rosText}`) : 
            content;
          
          return fullContent;
        }
        
        case 'physical-exam': {
          if (selectedPeSystems.size === 0) {
            return language === 'fr' ? '[Entrer l\'examen physique]' : '[Enter physical examination]';
          }
          
          const peEntries = Array.from(selectedPeSystems).map(system => {
            const findings = physicalExamOptions[system as keyof typeof physicalExamOptions];
            return language === 'fr' ? findings : `${system}: ${findings}`;
          });
          
          return peEntries.join("\n");
        }
        
        case 'labs': {
          if (processedLabValues.length === 0) {
            return language === 'fr' ? '[Entrer les résultats de laboratoire]' : '[Enter laboratory results]';
          }
          
          const labText = formatLabValuesForNote(processedLabValues);
          return labText;
        }
        
        case 'imagery': {
          if (imageryStudies.length === 0) {
            return language === 'fr' ? '[Entrer les résultats d\'imagerie]' : '[Enter imaging results]';
          }
          
          const studies = imageryStudies.map(study => 
            `${study.system} ${study.modality}: ${study.result}`
          ).join('\n');
          
          return studies;
        }
        
        case 'impression': {
          return getContentWithPriority(
            impressionText,
            customContent,
            '[Enter clinical impressions]',
            '[Entrer les impressions cliniques]'
          );
        }
        
        default: {
          return `[${sectionId}]`;
        }
      }
    } catch (error) {
      console.error(`Error generating content for section ${sectionId}:`, error);
      return `[Error: ${sectionId}]`;
    }
  }, [language, pmhText, medications, selectedPeSystems, processedLabValues, hpiText, impressionText, intubationValues, noteType, selectedSymptoms, imageryStudies]);

  const generateSectionContent = useCallback((sectionId: string, customContent?: string) => {
    try {
      const plainContent = generatePlainSectionContent(sectionId, customContent);
      
      const header = getSectionHeader(sectionId);
      
      let formattedContent = plainContent;
      
      if (shouldFormatSection(sectionId)) {
        switch (sectionId) {
          case 'pmh':
            formattedContent = formatPMHText(plainContent);
            break;
          case 'impression':
            formattedContent = formatImpressionText(plainContent);
            break;
          case 'plan':
            formattedContent = formatPlanText(plainContent);
            break;
          case 'hpi':
            formattedContent = formatHPIText(plainContent);
            break;
          case 'physical-exam':
            formattedContent = formatSmartText(plainContent, { 
              sectionType: 'physical-exam',
              preserveFormatting: true 
            });
            break;
          default:
            formattedContent = plainContent;
        }
      }
      
      return `${header}:\n${formattedContent}`;
    } catch (error) {
      console.error(`Error generating content for section ${sectionId}:`, error);
      const header = getSectionHeader(sectionId);
      return `${header}:\n[Error: ${sectionId}]`;
    }
  }, [generatePlainSectionContent, getSectionHeader]);

  // Move all generate* functions here, before generateDefaultNote
  const generateAllergiesText = useCallback(() => {
    const currentAllergies = allergiesRef.current;
    if (!currentAllergies) {
      return language === 'fr' ? 'ALLERGIES :\nAucune allergie connue' : 'ALLERGIES:\nNKDA (No Known Drug Allergies)';
    }
    
    if (language === 'fr') {
      if (currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
        return `ALLERGIES :\n${currentAllergies.allergiesList.join(', ')}`;
      } else {
        return `ALLERGIES :\nAucune allergie connue`;
      }
    } else {
      if (currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
        return `ALLERGIES:\n${currentAllergies.allergiesList.join(', ')}`;
      } else {
        return `ALLERGIES:\nNKDA (No Known Drug Allergies)`;
      }
    }
  }, [language]);

  const generatePMHText = useCallback(() => {
    if (!pmhText.trim()) {
      return language === 'fr' 
        ? "ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]"
        : "PAST MEDICAL HISTORY:\n[Enter past medical history]";
    }
    
    const lines = pmhText.split('\n');
    const formatted: string[] = [];
    let conditionCount = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        conditionCount++;
        const condition = line.replace('#', '').trim();
        formatted.push(`${conditionCount}. ${condition}`);
      } else if (line.startsWith('-')) {
        const detail = line.replace('-', '').trim();
        formatted.push(`     - ${detail}`);
      } else {
        conditionCount++;
        formatted.push(`${conditionCount}. ${line}`);
      }
    }
    
    const header = language === 'fr' ? "ANTÉCÉDENTS MÉDICAUX :\n" : "PAST MEDICAL HISTORY:\n";
    return header + formatted.join('\n');
  }, [language, pmhText]);

  const generateImpressionText = useCallback(() => {
    if (!impressionText.trim()) {
      return language === 'fr' 
        ? "IMPRESSION CLINIQUE :\n[Entrer les impressions cliniques]"
        : "CLINICAL IMPRESSION:\n[Enter clinical impressions]";
    }
    
    const lines = impressionText.split('\n');
    const formatted: string[] = [];
    let conditionCount = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        conditionCount++;
        const condition = line.replace('#', '').trim();
        formatted.push(`${conditionCount}. ${condition}`);
      } else if (line.startsWith('-')) {
        const detail = line.replace('-', '').trim();
        formatted.push(`     - ${detail}`);
      } else {
        conditionCount++;
        formatted.push(`${conditionCount}. ${line}`);
      }
    }
    
    const header = language === 'fr' ? "IMPRESSION CLINIQUE :\n" : "CLINICAL IMPRESSION:\n";
    return header + formatted.join('\n');
  }, [language, impressionText]);

  const generateSocialHistoryText = useCallback(() => {
    let socialText = language === 'fr' ? "HISTOIRE SOCIALE :\n" : "SOCIAL HISTORY:\n";
    const socialItems = [];
    const currentSocialHistory = socialHistoryRef.current;
    
    if (!currentSocialHistory) {
      socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
      socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
      socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
    } else {
      if (currentSocialHistory.smoking.status) {
        socialItems.push(language === 'fr' 
          ? `Tabagisme: ${currentSocialHistory.smoking.details || ''}`
          : `Smoking: ${currentSocialHistory.smoking.details || ''}`);
      } else {
        socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
      }
    
      if (currentSocialHistory.alcohol.status) {
        socialItems.push(language === 'fr' 
          ? `Alcool: ${currentSocialHistory.alcohol.details || ''}`
          : `Alcohol: ${currentSocialHistory.alcohol.details || ''}`);
      } else {
        socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
      }
      
      if (currentSocialHistory.drugs.status) {
        socialItems.push(language === 'fr' 
          ? `Drogues: ${currentSocialHistory.drugs.details || ''}`
          : `Drugs: ${currentSocialHistory.drugs.details || ''}`);
      } else {
        socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
      }
    }
    
    socialText += socialItems.join('\n');
    return socialText.trim();
  }, [language]);

  const generateMedicationsText = useCallback(() => {
    let medicationsText = "";
    
    if (language === 'fr') {
      if (medications.homeMedications.length > 0) {
        const organizedHomeMeds = formatMedicationsForNote(medications.homeMedications, 'fr');
        medicationsText += `MÉDICAMENTS À DOMICILE :\n${organizedHomeMeds}\n\n`;
      } else {
        medicationsText += `MÉDICAMENTS À DOMICILE :\n[Aucun médicament à domicile]\n\n`;
      }
      
      if (medications.hospitalMedications.length > 0) {
        const organizedHospitalMeds = formatMedicationsForNote(medications.hospitalMedications, 'fr');
        medicationsText += `MÉDICAMENTS HOSPITALIERS :\n${organizedHospitalMeds}`;
      } else {
        medicationsText += `MÉDICAMENTS HOSPITALIERS :\n[Aucun médicament hospitalier]`;
      }
    } else {
      if (medications.homeMedications.length > 0) {
        const organizedHomeMeds = formatMedicationsForNote(medications.homeMedications, 'en');
        medicationsText += `HOME MEDICATIONS:\n${organizedHomeMeds}\n\n`;
      } else {
        medicationsText += `HOME MEDICATIONS:\n[No home medications]\n\n`;
      }
      
      if (medications.hospitalMedications.length > 0) {
        const organizedHospitalMeds = formatMedicationsForNote(medications.hospitalMedications, 'en');
        medicationsText += `HOSPITAL MEDICATIONS:\n${organizedHospitalMeds}`;
      } else {
        medicationsText += `HOSPITAL MEDICATIONS:\n[No hospital medications]`;
      }
    }
    
    return medicationsText;
  }, [language, medications]);

  const generateRosText = useCallback(() => {
    if (Object.keys(selectedSymptoms).length === 0) return "";
    const rosSentences = Object.entries(selectedSymptoms).map(([system, symptoms]: [string, Set<SymptomObject>]) => {
      const symptomList = Array.from(symptoms);
      if (symptomList.length === 0) return '';
      const systemObj = (rosSymptomOptions as Record<string, {symptoms: {key: string, en: string, fr: string, description: {en: string, fr: string}}[]} >)[system];
      const getLabel = (key: string) => {
        const found = systemObj?.symptoms.find((s: {key: string}) => s.key === key);
        if (!found) return key.replace(/_/g, ' ');
        return language === 'fr' ? found.fr : found.en;
      };
      let sentence = '';
      if (language === 'fr') {
        sentence = symptomList.map(s => `pas de ${getLabel(s.key)}${s.severity ? ` (${s.severity})` : ''}${s.note ? `: ${s.note}` : ''}`).join(', ');
      } else {
        sentence = symptomList.map(s => `no ${getLabel(s.key).charAt(0).toLowerCase() + getLabel(s.key).slice(1)}${s.severity ? ` (${s.severity})` : ''}${s.note ? `: ${s.note}` : ''}`).join(', ');
      }
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      if (!sentence.endsWith('.')) sentence += '.';
      return sentence;
    }).filter(Boolean);
  
    let rosText = '';
    if (language === 'fr') {
      rosText = rosSentences.join(' ');
      const uncoveredSystems = Object.keys(rosSymptomOptions).filter(system => !selectedSymptoms[system] || selectedSymptoms[system].size === 0);
      if (uncoveredSystems.length > 0) {
        rosText += ' Tous les autres systèmes révisés et négatifs.';
      }
    } else {
      rosText = rosSentences.join(' ');
      const uncoveredSystems = Object.keys(rosSymptomOptions).filter(system => !selectedSymptoms[system] || selectedSymptoms[system].size === 0);
      if (uncoveredSystems.length > 0) {
        rosText += ' All other systems reviewed and negative.';
      }
    }
    return rosText;
  }, [language, selectedSymptoms]);

  const generatePhysicalExamText = useCallback(() => {
    if (selectedPeSystems.size === 0) return "";
    
    const peEntries = Array.from(selectedPeSystems).map(system => {
      const findings = physicalExamOptions[system as keyof typeof physicalExamOptions];
      return language === 'fr' ? findings : `${system}: ${findings}`;
    });
    
    return language === 'fr' 
      ? `EXAMEN PHYSIQUE :\n${peEntries.join("\n")}`
      : `PHYSICAL EXAMINATION:\n${peEntries.join("\n")}`;
  }, [language, selectedPeSystems]);

  const generateIntubationText = useCallback(() => {
    if (Object.keys(intubationValues).length === 0) return "";
    
    let intubationText = "";
    Object.entries(intubationValues).forEach(([param, data]) => {
      if (data.current) {
        intubationText += `${param}: ${data.current}\n`;
      }
    });
    return intubationText.trim();
  }, [intubationValues]);

  const generateLabValuesText = useCallback(() => {
    if (processedLabValues.length === 0) return "";
    
    const labText = formatLabValuesForNote(processedLabValues);
    return labText ? (language === 'fr' ? `RÉSULTATS DE LABORATOIRE:\n${labText}` : `LABORATORY RESULTS:\n${labText}`) : "";
  }, [language, processedLabValues]);

  const generateImageryText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    if (imageryStudies.length === 0) {
      return language === 'fr' ? "IMAGERIE :\n[Entrer les résultats d'imagerie]" : "IMAGING:\n[Enter imaging results]";
    }
    
    const header = language === 'fr' ? "IMAGERIE :" : "IMAGING:";
    const studies = imageryStudies.map(study => 
      `${study.system} ${study.modality}: ${study.result}`
    ).join('\n');
    
    return `${header}\n${studies}`;
  }, [language, imageryStudies]);

  const generateVentilationText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    const header = language === 'fr' ? "PARAMÈTRES DE VENTILATION :" : "VENTILATION PARAMETERS:";
    
    const intubationText = generateIntubationText();
    
    return intubationText ? `${header}\n${intubationText}` : "";
  }, [language, generateIntubationText]);

  const generatePlanText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    return language === 'fr' ? "PLAN :\n[Entrer le plan de traitement]" : "PLAN:\n[Enter treatment plan]";
  }, [language]);

  const generateHPIText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    const header = language === 'fr' ? "HISTOIRE DE LA MALADIE ACTUELLE :" : "HISTORY OF PRESENT ILLNESS:";
    const content = hpiText || (language === 'fr' ? "[Entrer l'HMA]" : "[Enter HPI]");
    
    const rosText = generateRosText();
    const fullContent = rosText ? 
      (content.trim().endsWith('.') ? `${content} ${rosText}` : `${content}. ${rosText}`) : 
      content;
    
    return `${header}\n${fullContent}`;
  }, [language, hpiText, generateRosText]);

  const generateAllergiesSocialText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    const allergiesText = generateAllergiesText();
    const socialText = generateSocialHistoryText();
    return `${allergiesText}\n\n${socialText}`;
  }, [generateAllergiesText, generateSocialHistoryText]);

  // Now define generateDefaultNote after all helper functions
  const generateDefaultNote = useCallback(() => {
    let generatedText = "";
    
    const sections: string[] = [];
    const isICU = (noteType === "admission" && admissionType === "icu") || (noteType === "progress" && progressType === "icu");
    
    if (noteType === "admission") {
      if (isICU) {
        if (language === 'fr') {
          sections.push(`MOTIF D'ADMISSION :\n${chiefComplaint.customComplaint || '[Entrer le motif d\'admission]'}\n\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`CHIEF COMPLAINT:\n${chiefComplaint.customComplaint || '[Enter chief complaint]'}\n\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      } else {
        if (language === 'fr') {
          sections.push(`MOTIF D'ADMISSION :\n${chiefComplaint.customComplaint || '[Entrer le motif d\'admission]'}\n\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`CHIEF COMPLAINT:\n${chiefComplaint.customComplaint || '[Enter chief complaint]'}\n\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      }
    } else if (noteType === "progress") {
      if (isICU) {
        if (language === 'fr') {
          sections.push(`NOTE D'ÉVOLUTION :\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`PROGRESS NOTE:\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      } else {
        if (language === 'fr') {
          sections.push(`NOTE D'ÉVOLUTION :\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`PROGRESS NOTE:\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      }
    } else if (noteType === "consultation") {
      if (language === 'fr') {
        sections.push(`NOTE DE CONSULTATION :\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
      } else {
        sections.push(`CONSULTATION NOTE:\n${generateHPIText()}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateRosText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
      }
    }

    return sections.join('\n\n');
  }, [noteType, language, chiefComplaint, generateHPIText, generatePMHText, generateAllergiesText, generateSocialHistoryText, generateMedicationsText, generateRosText, generatePhysicalExamText, generateIntubationText, generateLabValuesText, generateImageryText, generateImpressionText, admissionType, progressType]);

  const handleOptionChange = useCallback(() => {
    const newGeneratedText = generateTextFromOptions();
    
    if (initialGeneratedText === "") {
      setInitialGeneratedText(newGeneratedText);
      setCurrentText(newGeneratedText);
      setNote(newGeneratedText);
    } else {
      const diff = dmp.current.diff_main(initialGeneratedText, currentText);
      dmp.current.diff_cleanupSemantic(diff);
      const patch = dmp.current.patch_make(diff);
      const [patchedText] = dmp.current.patch_apply(patch, newGeneratedText);
      
      setCurrentText(patchedText);
      setInitialGeneratedText(newGeneratedText);
      setNote(patchedText);
    }
  }, [generateTextFromOptions, initialGeneratedText, currentText]);

  const handleNoteChange = (newText: string) => {
    setCurrentText(newText);
    setNote(newText);
  };

  const resetToGenerated = () => {
    const newGeneratedText = generateTextFromOptions();
    setInitialGeneratedText(newGeneratedText);
    setCurrentText(newGeneratedText);
    setNote(newGeneratedText);
  };

  const togglePeSystem = (system: string) => {
    setSelectedPeSystems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(system)) {
        newSet.delete(system);
      } else {
        newSet.add(system);
      }
      return newSet;
    });
  };

  const selectAllPeSystems = () => {
    setSelectedPeSystems(new Set(Object.keys(physicalExamOptions)));
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.allergiesList.includes(newAllergy.trim())) {
      setAllergies(prev => ({
        hasAllergies: true,
        allergiesList: [...prev.allergiesList, newAllergy.trim()]
      }));
      setNewAllergy("");
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    setAllergies(prev => {
      const newList = prev.allergiesList.filter(allergy => allergy !== allergyToRemove);
      return {
        hasAllergies: newList.length > 0,
        allergiesList: newList
      };
    });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(note);
      toast({
        title: language === 'fr' ? "Copié!" : "Copied!",
        description: language === 'fr' ? "La note a été copiée dans le presse-papiers." : "Note copied to clipboard.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (noteType) {
      const subtype = noteType === "admission" ? admissionType : 
                     noteType === "progress" ? progressType : "general";
      loadTemplatesForNoteType(noteType, subtype);
    } else {
      setAvailableTemplates([]);
      handleTemplateSelection(null);
    }
  }, [noteType, admissionType, progressType, loadTemplatesForNoteType]);

  useEffect(() => {
    handleOptionChange();
  }, [medications, processedLabValues, pmhText, noteType, admissionType, progressType, chiefComplaint, selectedPeSystems, intubationValues, impressionText, selectedSymptoms, selectedTemplate]);

  const timeoutRef = useRef<NodeJS.Timeout[]>([]);
  
  const handleAllergiesConfirm = useCallback(() => {
    try {
      handleOptionChange();
    } catch (error) {
      console.error('Error in handleAllergiesConfirm:', error);
    }
  }, [handleOptionChange]);

  const handleSocialHistoryConfirm = useCallback(() => {
    try {
      handleOptionChange();
    } catch (error) {
      console.error('Error in handleSocialHistoryConfirm:', error);
    }
  }, [handleOptionChange]);
  
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutRef.current = [];
    };
  }, []);

  useEffect(() => {
    const savedTemplateId = localStorage.getItem('selectedTemplateId');
    if (savedTemplateId && availableTemplates.length > 0) {
      const savedTemplate = availableTemplates.find(t => t.id.toString() === savedTemplateId);
      if (savedTemplate) {
        setSelectedTemplate(savedTemplate);
      }
    }
  }, [availableTemplates]);

  useEffect(() => {
    if (selectedTemplate) {
      localStorage.setItem('selectedTemplateId', selectedTemplate.id.toString());
    } else {
      localStorage.removeItem('selectedTemplateId');
    }
  }, [selectedTemplate]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }
      
      if (selectedSubOption === 'allergies-social') {
        return;
      }

      const tabOrder = getTabOrder();
      const currentIndex = tabOrder.indexOf(activeTab);

      if (event.key === 'ArrowLeft' && currentIndex > 0) {
        event.preventDefault();
        const newTab = tabOrder[currentIndex - 1];
        setActiveTab(newTab);
      } else if (event.key === 'ArrowRight' && currentIndex < tabOrder.length - 1) {
        event.preventDefault();
        const newTab = tabOrder[currentIndex + 1];
        setActiveTab(newTab);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, getTabOrder]);

  const isManuallyEdited = currentText !== initialGeneratedText && initialGeneratedText !== "";

  const sectionIcons: Record<string, React.ReactNode> = {
    "note-type": <FileText className="w-6 h-6 text-blue-500 bg-blue-100 rounded-full p-1" />,
    "pmh": <Stethoscope className="w-6 h-6 text-emerald-600 bg-emerald-100 rounded-full p-1" />,
    "meds": <Pill className="w-6 h-6 text-purple-600 bg-purple-100 rounded-full p-1" />,
    "allergies": <AlertCircle className="w-6 h-6 text-orange-500 bg-orange-100 rounded-full p-1" />,
    "social": <Users className="w-6 h-6 text-pink-500 bg-pink-100 rounded-full p-1" />,
    "hpi": <ClipboardList className="w-6 h-6 text-cyan-600 bg-cyan-100 rounded-full p-1" />,
    "physical-exam": <HeartPulse className="w-6 h-6 text-red-500 bg-red-100 rounded-full p-1" />,
    "ventilation": <Wind className="w-6 h-6 text-sky-500 bg-sky-100 rounded-full p-1" />,
    "labs": <TestTube className="w-6 h-6 text-yellow-600 bg-yellow-100 rounded-full p-1" />,
    "imagery": <Image className="w-6 h-6 text-indigo-500 bg-indigo-100 rounded-full p-1" />,
    "impression": <Brain className="w-6 h-6 text-gray-700 bg-gray-100 rounded-full p-1" />,
    "custom-note": <Edit3 className="w-6 h-6 text-orange-600 bg-orange-100 rounded-full p-1" />,
  };

  const SectionWrapper = ({ title, sectionKey, controls, children }: { title: string; sectionKey: string; controls?: React.ReactNode; children: React.ReactNode }) => (
    <div className="medical-section-wrapper">
      <div className="medical-card-header flex items-center justify-between">
        <h2 className="medical-section-title flex items-center gap-2">
          {sectionIcons[sectionKey]}
          {title}
        </h2>
        {controls && <div className="flex gap-2">{controls}</div>}
      </div>
      <div className="medical-section-content">
        {children}
      </div>
    </div>
  );

  const clearAllPmhEntries = () => {
    setPmhText('');
  };

  const pmhControls = (
    <button
      onClick={clearAllPmhEntries}
      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
    >
      {language === 'fr' ? 'Effacer' : 'Clear'}
    </button>
  );

  const renderMainContent = () => {
    const sectionTitle: Record<string, string> = {
      "note-type": "Note Type",
      "hpi": "History of Present Illness (HPI)",
      "ros": "Review of Systems (ROS)",
      "pmh": "Past Medical History (PMH)",
      "meds": "Medications",
      "labs": "Laboratory Results",
      "allergies-social": "Allergies & Social History",
      "imagery": "Imagery",
      "impression": "Impression",
      "ventilation": "Ventilation Parameters",
      "custom": language === 'fr' ? 'Note Personnalisée' : 'Custom Note'
    };

    switch (selectedSubOption) {
      case "note-type":
        return (
          <SectionWrapper title={sectionTitle["note-type"]} sectionKey="note-type">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  className={`max-w-xs w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    noteType === "admission"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setNoteType("admission")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900">Admission</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-normal text-wrap">For new patient admissions.</p>
                </div>
                <div
                  className={`max-w-xs w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    noteType === "progress"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setNoteType("progress")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Progress</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-normal text-wrap">For daily or interval progress updates.</p>
                </div>
                <div
                  className={`max-w-xs w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    noteType === "consultation"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => setNoteType("consultation")}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">Consultation</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-normal text-wrap">For specialist or consult notes.</p>
                </div>
                <div
                  className={`max-w-xs w-full p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    noteType === "custom"
                      ? "border-orange-500 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => { setNoteType("custom"); setSelectedSubOption("custom"); }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Edit3 className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-gray-900">{language === 'fr' ? 'Personnalisé' : 'Custom'}</span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-normal text-wrap">{language === 'fr' ? 'Note libre avec phrases-points.' : 'Free-form note with dot phrases.'}</p>
                </div>
              </div>
              {noteType === "progress" && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Progress Type</h4>
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
                        <span className="font-medium text-gray-900">General</span>
                      </div>
                      <p className="text-sm text-gray-500 ml-5 whitespace-normal text-wrap">Standard progress note.</p>
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
                        <span className="font-medium text-gray-900">ICU</span>
                      </div>
                      <p className="text-sm text-gray-500 ml-5 whitespace-normal text-wrap">ICU-specific progress note.</p>
                    </div>
                  </div>
                </div>
              )}
              {noteType === "admission" && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Admission Type</h4>
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
                        <span className="font-medium text-gray-900">General</span>
                      </div>
                      <p className="text-sm text-gray-500 ml-5 whitespace-normal text-wrap">Standard admission note.</p>
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
                        <span className="font-medium text-gray-900">ICU</span>
                      </div>
                      <p className="text-sm text-gray-500 ml-5 whitespace-normal text-wrap">ICU-specific admission note.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {noteType && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Template Selection</h4>
                  <div className="space-y-3">
                    <div
                      className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                        selectedTemplate === null
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleTemplateSelection(null)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${selectedTemplate === null ? "bg-blue-500" : "bg-gray-300"}`} />
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="font-medium text-gray-900">Standard Note</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 ml-6 whitespace-normal text-wrap">Use the default medical note format with all sections</p>
                    </div>

                    {loadingTemplates && (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">Loading templates...</span>
                        </div>
                      </div>
                    )}

                    {templateError && (
                      <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">{templateError}</span>
                        </div>
                      </div>
                    )}

                    {!loadingTemplates && availableTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                          selectedTemplate?.id === template.id
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => handleTemplateSelection(template)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            selectedTemplate?.id === template.id ? "bg-purple-500" : "bg-gray-300"
                          }`} />
                          <div className="flex items-center space-x-2">
                            <ClipboardList className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-gray-900">{template.name}</span>
                            {template.specialty && (
                              <Badge variant="outline" className="text-xs">
                                {template.specialty}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {template.description && (
                          <p className="text-sm text-gray-500 ml-6 mt-1 whitespace-normal text-wrap">{template.description}</p>
                        )}
                        <div className="flex items-center space-x-4 ml-6 mt-2 text-xs text-gray-400">
                          <span>Category: {template.category}</span>
                          {template.isFavorite && (
                            <span className="flex items-center space-x-1">
                              <span className="text-yellow-500">★</span>
                              <span>Favorite</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                    {!loadingTemplates && !templateError && availableTemplates.length === 0 && (
                      <div className="p-3 border border-dashed rounded-lg bg-gray-50">
                        <div className="text-center">
                          <ClipboardList className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1 whitespace-normal text-wrap">No templates available for this note type</p>
                          <p className="text-xs text-gray-500 whitespace-normal text-wrap">Create templates in Smart Functions → Templates</p>
                        </div>
                      </div>
                    )}

                    {!loadingTemplates && availableTemplates.length > 0 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            toast({
                              title: "Template Manager",
                              description: "Go to Smart Functions → Templates to manage all templates",
                            });
                          }}
                        >
                          Browse All Templates
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </SectionWrapper>
        );
      case "hpi":
        return (
          <SectionWrapper title={sectionTitle["hpi"]} sectionKey="hpi">
            <HpiSection
              selectedSymptoms={selectedSymptoms}
              setSelectedSymptoms={handleSetSelectedSymptoms}
            />
          </SectionWrapper>
        );
      case "ros":
        return (
          <SectionWrapper title={sectionTitle["ros"]} sectionKey="ros">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 whitespace-normal text-wrap">Review of systems examination.</p>
            </div>
          </SectionWrapper>
        );
      case "pmh":
        return (
          <SectionWrapper title={sectionTitle["pmh"]} sectionKey="pmh" controls={pmhControls}>
            <SmartPMHSection
              value={pmhText}
              onChange={setPmhText}
              defaultContent={getSectionDefaultContent("pmh")}
            />
          </SectionWrapper>
        );
      case "meds":
        return (
          <SectionWrapper title={sectionTitle["meds"]} sectionKey="meds">
            <MedicationSection medications={medications} onMedicationsChange={setMedications} />
          </SectionWrapper>
        );
      case "labs":
        return (
          <SectionWrapper title={sectionTitle["labs"]} sectionKey="labs">
            <div className="space-y-6">
              <ImprovedLabInterface
                processedLabs={processedLabValues}
                onLabsChange={setProcessedLabValues}
                onLabAdd={handleManualLabAdd}
                selectedLabs={Array.from(selectedLabTests)}
                onLabRemove={handleLabRemove}
                onLabValuesExtracted={handleLabValuesExtracted}
                selectedPanel={selectedPanel}
                setSelectedPanel={setSelectedPanel}
              />
              
              <div className="bg-gray-50 border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {language === 'fr' ? 'Extraction d\'image' : 'Image Extraction'}
                </h4>
                <LabImageUpload onLabValuesExtracted={handleLabValuesExtracted} />
              </div>

              {processedLabValues.length > 0 && (
                <div className="medical-card">
                  <div className="medical-card-header">
                    <div className="flex items-center space-x-2">
                      <TestTube className="w-5 h-5" />
                      <span className="medical-section-title">{language === 'fr' ? 'Valeurs de laboratoire' : 'Laboratory Values'}</span>
                      <span className="medical-badge">{processedLabValues.length}</span>
                    </div>
                  </div>
                  <div className="medical-card-content">
                    <LabValuesDisplay processedLabs={processedLabValues} onLabsChange={setProcessedLabValues} />
                  </div>
                </div>
              )}
            </div>
          </SectionWrapper>
        );
      case "allergies-social":
        return (
          <SectionWrapper title={sectionTitle["allergies-social"]} sectionKey="allergies">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 h-full">
              <AllergiesSection
                allergies={allergies || { hasAllergies: false, allergiesList: [] }}
                onAllergiesChange={setAllergies}
                onConfirm={handleAllergiesConfirm}
              />
              <SocialHistorySection
                socialHistory={socialHistory || {
                  smoking: { status: false, details: "" },
                  alcohol: { status: false, details: "" },
                  drugs: { status: false, details: "" }
                }}
                onSocialHistoryChange={setSocialHistory}
                onConfirm={handleSocialHistoryConfirm}
              />
            </div>
          </SectionWrapper>
        );

      case "imagery": {
        const systemIcons: Record<string, React.ReactNode> = {
          neuro: <Brain className="w-5 h-5 text-indigo-600 bg-indigo-100 rounded-full p-1" />,
          cardiac: <HeartPulse className="w-5 h-5 text-rose-600 bg-rose-100 rounded-full p-1" />,
          chest: <Activity className="w-5 h-5 text-cyan-600 bg-cyan-100 rounded-full p-1" />,
          abdomen: <Apple className="w-5 h-5 text-yellow-600 bg-yellow-100 rounded-full p-1" />,
          pelvis: <Shield className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-1" />,
          spine: <Bone className="w-5 h-5 text-orange-600 bg-orange-100 rounded-full p-1" />,
          limb: <Activity className="w-5 h-5 text-blue-600 bg-blue-100 rounded-full p-1" />,
        };

        const handleAddStudy = () => {
          if (!expandedSystem || !selectedModality) return;
          setImageryStudies([
            ...imageryStudies,
            { system: expandedSystem, modality: selectedModality, result: resultInput }
          ]);
          setExpandedSystem(null);
          setSelectedModality("");
          setResultInput("");
        };

        return (
          <SectionWrapper title={sectionTitle["imagery"]} sectionKey="imagery">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2 whitespace-normal text-wrap">Select the system, exam type, and enter the result for each imaging study. All entries will be included in your note.</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
                {imagerySystems.map(sys => (
                  <div
                    key={sys.key}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border shadow cursor-pointer transition-all hover:bg-blue-50 ${expandedSystem === sys.key ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                    onClick={() => {
                      setExpandedSystem(expandedSystem === sys.key ? null : sys.key);
                      setSelectedModality("");
                      setResultInput("");
                    }}
                  >
                    {systemIcons[sys.key]}
                    <span className="mt-2 text-sm font-medium text-gray-900 whitespace-normal text-wrap">{sys.label}</span>
                  </div>
                ))}
              </div>
              {expandedSystem && (
                <div className="bg-gray-50 border rounded-xl p-4 flex flex-col gap-2 max-w-xl mx-auto">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {imagerySystems.find(s => s.key === expandedSystem)?.modalities.map(mod => (
                      <button
                        key={mod}
                        className={`px-3 py-1 rounded-full border text-sm font-medium transition-all ${selectedModality === mod ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                        onClick={() => setSelectedModality(mod)}
                        type="button"
                      >
                        {mod}
                      </button>
                    ))}
                  </div>
                  {selectedModality && (
                    <div className="flex gap-2 items-end">
                      <input
                        className="border rounded px-2 py-1 text-sm flex-1 whitespace-normal text-wrap"
                        type="text"
                        placeholder="Type result or impression..."
                        value={resultInput}
                        onChange={e => setResultInput(e.target.value)}
                      />
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
                        onClick={handleAddStudy}
                        disabled={!resultInput.trim()}
                        type="button"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(imageryStudies) && imageryStudies.map((study: { system: string; modality: string; result: string }, idx: number) => (
                  <div key={idx} className="bg-gray-50 border rounded-lg p-3 flex flex-col gap-1 relative">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {systemIcons[study.system]}
                      <span className="text-gray-700 whitespace-normal text-wrap">{imagerySystems.find(s => s.key === study.system)?.label}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-700 whitespace-normal text-wrap">{study.modality}</span>
                    </div>
                    <div className="text-xs text-gray-600 whitespace-normal text-wrap">{study.result || <span className="italic text-gray-400">No result entered</span>}</div>
                    <button
                      className="absolute top-2 right-2 text-xs text-red-500 hover:text-red-700"
                      onClick={() => handleRemoveStudy(idx)}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {imageryStudies.length === 0 && (
                  <div className="text-xs text-gray-400 italic">No imaging studies added yet.</div>
                )}
              </div>
            </div>
          </SectionWrapper>
        );
      }
      case "impression": 
        return (
          <SectionWrapper title={sectionTitle["impression"]} sectionKey="impression">
            <SmartImpressionSection 
              value={impressionText} 
              onChange={setImpressionText}
              defaultContent={getSectionDefaultContent("impression")}
            />
          </SectionWrapper>
        );
      case "custom":
        return (
          <SectionWrapper title={sectionTitle["custom"]} sectionKey="custom-note">
            <div className="flex flex-col h-full flex-1">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Edit3 className="w-6 h-6 text-orange-600" />
                  <h1 className="text-xl font-semibold text-gray-900">
                    {language === 'fr' ? 'Note Personnalisée' : 'Custom Note'}
                  </h1>
                </div>
                <Button
                  onClick={() => setNoteType(null)}
                  variant="outline"
                  size="sm"
                >
                  {language === 'fr' ? 'Retour' : 'Back'}
                </Button>
              </div>
              <div className="flex-1 flex flex-col rounded-lg border border-gray-200 shadow-sm">
                <DotPhraseTextarea
                  value={customNoteText}
                  onChange={setCustomNoteText}
                  placeholder={language === 'fr' 
                    ? 'Commencez à taper votre note... Utilisez /phrase pour les phrases-points.'
                    : 'Start typing your note... Use /phrase for dot phrases.'}
                  className="flex-1 w-full h-full resize-none border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-sm p-4 bg-gray-50"
                  rows={25}
                />
              </div>
            </div>
          </SectionWrapper>
        );
      default:
        if (selectedMenu === "dot-phrases") {
          return (
            <div className="medical-section-wrapper">
              <div className="medical-card-header">
                <h2 className="medical-section-title flex items-center gap-2">
                  <ClipboardList className="w-6 h-6 text-blue-500 bg-blue-100 rounded-full p-1" />
                  Dot Phrases
                </h2>
              </div>
              <div className="medical-section-content">
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 whitespace-normal text-wrap">Dot phrases functionality will be implemented here.</p>
                </div>
              </div>
            </div>
          );
        }
        return null;
    }
  };

  const getNoteData = () => {
    const noteData: Record<string, string> = {};
    
    try {
      if (noteType) {
        noteData['note-type'] = `Note Type: ${noteType.charAt(0).toUpperCase() + noteType.slice(1)}`;
      }
      
      if (pmhText && pmhText.trim()) {
        noteData['pmh'] = pmhText;
      }
      
      if (medications && Array.isArray(medications.homeMedications) && Array.isArray(medications.hospitalMedications)) {
        const allMeds = [...medications.homeMedications, ...medications.hospitalMedications];
        if (allMeds.length > 0) {
          noteData['meds'] = formatMedicationsForNote(allMeds);
        }
      }
      
      const currentAllergies = allergiesRef.current;
      if (currentAllergies && currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
        noteData['allergies-social'] = `Allergies: ${currentAllergies.allergiesList.join(', ')}`;
      }
      
      if (chiefComplaint || hpiText) {
        const hpiContent = [
          chiefComplaint?.customComplaint?.trim() || '',
          hpiText?.trim() || ''
        ].filter(Boolean).join('\n');
        if (hpiContent) {
          noteData['hpi'] = hpiContent;
        }
      }
      
      if (selectedPeSystems && selectedPeSystems.size > 0) {
        const peEntries = Array.from(selectedPeSystems).map(system => {
          const findings = physicalExamOptions[system as keyof typeof physicalExamOptions] || 'Normal';
          return `${system}: ${findings}`;
        });
        noteData['physical-exam'] = peEntries.join("\n");
      }
      
      if (processedLabValues && Array.isArray(processedLabValues) && processedLabValues.length > 0) {
        noteData['labs'] = formatLabValuesForNote(processedLabValues);
      }
      
      if (imageryStudies && Array.isArray(imageryStudies) && imageryStudies.length > 0) {
        const imageryText = imageryStudies.map(study => 
          `${study.system} ${study.modality}: ${study.result}`
        ).join('\n');
        noteData['imagery'] = imageryText;
      }
      
      if (impressionText && impressionText.trim()) {
        noteData['impression'] = impressionText;
      }
      
      if (selectedSymptoms && Object.keys(selectedSymptoms).length > 0) {
        const rosEntries = Object.entries(selectedSymptoms)
          .filter(([, symptoms]) => symptoms && symptoms.size > 0)
          .map(([system, symptoms]) => {
            const symptomList = Array.from(symptoms);
            return `${system}: ${symptomList.join(', ')}`;
          });
        if (rosEntries.length > 0) {
          noteData['ros'] = rosEntries.join('\n');
        }
      }
      
    } catch (error) {
      console.error('Error generating note data:', error);
    }
    
    return noteData;
  };

  const handleNoteBlur = useCallback(() => {
    const labSectionMatch = note.match(/LABORATORY RESULTS:\n([\s\S]*?)(\n\w+:|$)/i);
    if (!labSectionMatch) return;
    const labLines = labSectionMatch[1].split('\n').map(l => l.trim()).filter(Boolean);
    const newLabs: LabValue[] = [];
    labLines.forEach(line => {
      const match = line.match(/^(\w[\w\s\-\/]+)\s+([\d\.]+)(?:\s*\(([^)]+)\))?/);
      if (match) {
        const testName = match[1].trim();
        const mainValue = match[2];
        const trended = match[3] ? match[3].split(',').map(v => v.trim()) : [];
        newLabs.push({
          testName,
          value: mainValue,
          unit: '',
          category: '',
          timestamp: new Date().toISOString(),
          referenceRange: '',
        });
        trended.forEach(val => {
          newLabs.push({
            testName,
            value: val,
            unit: '',
            category: '',
            timestamp: new Date().toISOString(),
            referenceRange: '',
          });
        });
      }
    });
    if (newLabs.length > 0) {
      const processedLabs = newLabs.map(lab => ({
        testName: lab.testName,
        category: lab.category,
        mostRecent: lab,
        trending: [],
        showTrending: false,
        trendCount: 0,
        showInNote: true
      }));
      setProcessedLabValues(processedLabs);
    }
  }, [note, setProcessedLabValues]);

  const renderLivePreview = () => {
    const safeNoteData = {
      'note-type': noteType || '',
      'pmh': pmhText || '',
      'meds': medications ? formatMedicationsForNote([...medications.homeMedications, ...medications.hospitalMedications]) : '',
      'allergies-social': (() => {
        try {
          const currentAllergies = allergiesRef.current;
          const currentSocialHistory = socialHistoryRef.current;
          const allergiesText = currentAllergies?.hasAllergies 
            ? 'Allergies: ' + (currentAllergies.allergiesList || []).join(', ') 
            : 'No known allergies';
          const socialText = [
            currentSocialHistory?.smoking?.status 
              ? `Smoking: ${currentSocialHistory.smoking.details || 'Yes'}` 
              : 'Non-smoker',
            currentSocialHistory?.alcohol?.status 
              ? `Alcohol: ${currentSocialHistory.alcohol.details || 'Yes'}` 
              : 'No alcohol use',
            currentSocialHistory?.drugs?.status 
              ? `Drugs: ${currentSocialHistory.drugs.details || 'Yes'}` 
              : 'No drug use'
          ].join('\n');
          return `${allergiesText}\n\nSocial History:\n${socialText}`;
        } catch (error) {
          console.error('Error formatting allergies/social data:', error);
          return 'No known allergies\n\nSocial History:\nNon-smoker\nNo alcohol use\nNo drug use';
        }
      })(),
      'hpi': hpiText || '',
      'physical-exam': selectedPeSystems && selectedPeSystems.size > 0 ? Array.from(selectedPeSystems).map(system => `${system}: ${physicalExamOptions[system as keyof typeof physicalExamOptions] || 'Normal'}`).join('\n') : '',
      'labs': processedLabValues && processedLabValues.length > 0 ? formatLabValuesForNote(processedLabValues) : '',
      'imagery': imageryStudies && imageryStudies.length > 0 ? imageryStudies.map(study => `${study.system} ${study.modality}: ${study.result}`).join('\n') : '',
      'impression': impressionText || ''
    };

    return (
      <TemplateAwareLivePreview
        noteData={safeNoteData}
        note={note || ''}
        onNoteChange={handleNoteChange}
        onCopyNote={copyToClipboard}
        onResetNote={isManuallyEdited ? resetToGenerated : undefined}
        documentedSystems={documentedSystems || 0}
        totalSystems={totalSystems || 0}
        generatedNote={note || ''}
        className="h-full"
        onBlur={handleNoteBlur}
      />
    );
  };

  // Scroll preservation additions
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);

  const handleSetSelectedSymptoms = useCallback((updater: (prev: Record<string, Set<SymptomObject>>) => Record<string, Set<SymptomObject>>) => {
    if (contentRef.current) {
      setScrollPosition(contentRef.current.scrollTop);
    }
    setSelectedSymptoms(updater);
  }, []);

  useLayoutEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = scrollPosition;
    }
  }, [selectedSymptoms, scrollPosition]);

  

  return (
    <MainLayout
      selectedMenu={selectedMenu}
      setSelectedMenu={setSelectedMenu}
      selectedSubOption={selectedSubOption}
      setSelectedSubOption={setSelectedSubOption}
      livePreview={renderLivePreview()}
      isICU={
        (noteType === "admission" && admissionType === "icu") ||
        (noteType === "progress" && progressType === "icu")
      }
      hasLivePreview={renderLivePreview() !== null}
    >
      <div className="flex flex-1 h-full min-h-[600px] bg-gray-50">
        <div className="flex-1 min-w-0 flex flex-col p-0">
          <div className="w-full h-full min-h-[600px] flex flex-col rounded-none shadow-none bg-white border-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 text-base text-gray-800" ref={contentRef}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedSubOption}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {renderMainContent() || (
                    <div className="text-center text-gray-400 py-12 whitespace-normal text-wrap">
                      Please select a section from the sidebar to begin.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="hidden lg:block w-px bg-gray-200 h-full mx-0" />
      </div>
    </MainLayout>
  );
}

export default ReviewOfSystems;