import { MainLayout } from "../components/MainLayout";
import React, { useState, useRef, useCallback, useEffect } from "react";
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
import { useTemplate } from "@/contexts/TemplateContext";
import { SmartPMHSection } from "@/components/SmartPMHSection";
import { SmartImpressionSection } from "@/components/SmartImpressionSection";
import { MedicationSection } from "@/components/MedicationSectionNew";
import { ChiefComplaintSection, type ChiefComplaintData } from "@/components/ChiefComplaintSection";
import { type MedicationData, formatMedicationsForNote } from "@/lib/medicationUtils";
import { LabImageUpload } from "@/components/LabImageUpload";
import { LabValuesDisplay } from "@/components/LabValuesDisplay";
import { processLabValues, formatLabValuesForNote, type LabValue, type ProcessedLabValue } from "@/lib/labUtils";
import * as DiffMatchPatch from 'diff-match-patch';
import { DotPhraseTextarea } from '@/components/DotPhraseTextarea';
import HpiSection from '@/components/HpiSection';
import { TemplateAwareLivePreview } from '@/components/TemplateAwareLivePreview';
import { type Template, type NoteType, type NoteSubtype } from '@shared/schema';
import { type TemplateContent } from '@/lib/sectionLibrary';

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

import { formatSmartText } from '@/utils/textFormatting';

function ReviewOfSystems() {
  // Note state with diff-patch-merge tracking
  const [note, setNote] = useState("");
  const [initialGeneratedText, setInitialGeneratedText] = useState("");
  const [selectedSubOption, setSelectedSubOption] = useState("note-type");
  const [currentText, setCurrentText] = useState("");
  const dmp = useRef(new DiffMatchPatch.diff_match_patch());
  
  const [noteType, setNoteType] = useState<"admission" | "progress" | "consultation" | null>(null);
  const [admissionType, setAdmissionType] = useState<"general" | "icu">("general");
  const [progressType, setProgressType] = useState<"general" | "icu">("general");
  
  // Template context
  const { selectedTemplate, setSelectedTemplate, isTemplateActive } = useTemplate();
  
  // Template-related state (keeping local for loading/error states)
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  // New ROS symptom-level selection state
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<Record<string, Set<string>>>({}); // systemKey -> Set of symptom keys

  const [selectedPeSystems, setSelectedPeSystems] = useState<Set<string>>(new Set());
  
  // ICU intubation parameters
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
  
  // Use refs to store current values for note generation without triggering re-renders
  const allergiesRef = useRef(allergies);
  const socialHistoryRef = useRef(socialHistory);
  
  // Update refs when values change - ensure refs are always current
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

  // HPI/HMA state
  const [hpiText, setHpiText] = useState<string>("");

  const [pmhText, setPmhText] = useState<string>('');
  const [impressionText, setImpressionText] = useState<string>('');

  const [labValues, setLabValues] = useState<LabValue[]>([]);
  const [processedLabValues, setProcessedLabValues] = useState<ProcessedLabValue[]>([]);
  const [selectedLabTests, setSelectedLabTests] = useState<Set<string>>(new Set());
  
  // Active tab state for keyboard navigation
  const [activeTab, setActiveTab] = useState("note-type");
  
  // Reset confirmation dialog state
  const [showResetDialog, setShowResetDialog] = useState(false);

  const { toast } = useToast();
  const { language, setLanguage, t } = useLanguage();
  const auth = useAuth();

  // Sidebar navigation state
  const [selectedMenu, setSelectedMenu] = useState("medical-notes");

  // Imagery section state (move to top-level)
  const imagerySystems = [
    { key: "neuro", label: "Neuro", modalities: ["CT Scan", "MRI", "Angio Scan"] },
    { key: "cardiac", label: "Cardiac", modalities: ["Echo", "CT Angio", "MRI"] },
    { key: "chest", label: "Chest", modalities: ["X-Ray", "CT Scan", "Ultrasound"] },
    { key: "abdomen", label: "Abdomen", modalities: ["Ultrasound", "CT Scan", "MRI"] },
    { key: "pelvis", label: "Pelvis", modalities: ["Ultrasound", "CT Scan", "MRI"] },
    { key: "spine", label: "Spine", modalities: ["X-Ray", "CT Scan", "MRI"] },
    { key: "limb", label: "Limb", modalities: ["X-Ray", "CT Scan", "MRI"] },
  ];
  const [imageryStudies, setImageryStudies] = React.useState<{ system: string; modality: string; result: string }[]>([]);
  const [newSystem, setNewSystem] = React.useState("");
  const [newModality, setNewModality] = React.useState("");
  const [newResult, setNewResult] = React.useState("");
  
  // UI state for imagery section - moved to top level to avoid conditional hooks
  const [expandedSystem, setExpandedSystem] = React.useState<string | null>(null);
  const [selectedModality, setSelectedModality] = React.useState<string>("");
  const [resultInput, setResultInput] = React.useState<string>("");

  // Template API functions
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
      // Add filtering parameters for template compatibility
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
      
      // Filter templates based on compatibility
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

  // Get default content for a section from selected template
  const getSectionDefaultContent = useCallback((sectionId: string): string => {
    if (!selectedTemplate || !selectedTemplate.content) return '';
    
    try {
      let templateContent: TemplateContent;
      
      // Handle object content
      if (typeof selectedTemplate.content === 'object' && selectedTemplate.content !== null) {
        templateContent = selectedTemplate.content as TemplateContent;
      } 
      // Handle string content
      else if (typeof selectedTemplate.content === 'string' && selectedTemplate.content.trim()) {
        const parsed = JSON.parse(selectedTemplate.content);
        // Validate parsed content has expected structure
        if (!parsed || typeof parsed !== 'object') {
          console.warn('Invalid template content structure:', parsed);
          return '';
        }
        templateContent = parsed as TemplateContent;
      } 
      // Handle other types
      else {
        console.warn('Unsupported template content type:', typeof selectedTemplate.content);
        return '';
      }
      
      // Validate templateContent structure
      if (!templateContent || !Array.isArray(templateContent.sections)) {
        console.warn('Template content missing sections array:', templateContent);
        return '';
      }
      
      // Find the section in the template
      const section = templateContent.sections.find(s => s && s.sectionId === sectionId);
      const content = section?.customContent;
      
      // Return content if it's a string, empty string otherwise
      return typeof content === 'string' ? content : '';
    } catch (error) {
      console.error('Error accessing section defaults for sectionId:', sectionId, error);
      return '';
    }
  }, [selectedTemplate]);

  // Track template usage
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
      // Don't throw error as this is not critical for functionality
    }
  }, [auth.user?.id_token, getApiHeaders, noteType, admissionType, progressType]);

  // Handle template selection with usage tracking
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

  // Comprehensive reset function
  const handleCompleteReset = useCallback(() => {
    // Reset all note type selections
    setNoteType(null);
    setAdmissionType("general");
    setProgressType("general");
    
    // Reset all form data
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
    setSelectedSymptoms({} as Record<string, Set<string>>);
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
    
    // Reset text fields
    setCurrentText("");
    setInitialGeneratedText("");
    
    // Return to note type selection tab
    setActiveTab("note-type");
    
    // Close the dialog
    setShowResetDialog(false);
    
    // Show confirmation toast
    toast({
      title: language === 'fr' ? 'Réinitialisation complète' : 'Complete Reset',
      description: language === 'fr' ? 'Toutes les données ont été effacées' : 'All data has been cleared',
    });
  }, [language, toast]);

  // Define tab order for keyboard navigation
  const getTabOrder = useCallback(() => {
    const baseTabs = ["note-type", "pmh", "allergies-social", "hpi", "meds", "ros"];
    const icuTabs = ((noteType === "admission" && admissionType === "icu") || (noteType === "progress" && progressType === "icu")) 
      ? ["ventilation"] : [];
    const endTabs = ["impression", "labs", "imagery"];
    return [...baseTabs, ...icuTabs, ...endTabs];
  }, [noteType, admissionType, progressType]);
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Calculate documented systems
  const documentedSystems = Object.keys(selectedSymptoms).length + selectedPeSystems.size;
  const totalSystems = Object.keys(rosOptions).length + Object.keys(physicalExamOptions).length;

  // --- PASTE THIS CORRECTED CODE IN ITS PLACE ---

  // Handle lab values extraction
  const handleLabValuesExtracted = useCallback((newLabValues: LabValue[]) => {
    // This is the fix: It REPLACES the old data with the new data
    setLabValues(newLabValues);
  }, []);

  // Update processed lab values when labValues changes
  useEffect(() => {
    if (labValues && labValues.length > 0) {
      const processed = processLabValues(labValues);
      setProcessedLabValues(processed);
    } else {
      // This makes sure the display clears if there are no labs
      setProcessedLabValues([]);
    }
  }, [labValues]);

  // --- END OF CORRECTED CODE ---
  // Generate text from current options
  const generateTextFromOptions = useCallback(() => {
    if (noteType === null) {
      return language === 'fr' 
        ? 'Sélectionnez un type de note (Admission, Évolution ou Consultation) pour commencer à générer votre note clinique.'
        : 'Select a note type (Admission, Progress, or Consultation) to start generating your clinical note.';
    }

    // Check if template is active and get template content
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

    // If template is active, use template-based generation
    if (templateContent && templateContent.sections && Array.isArray(templateContent.sections)) {
      try {
        return generateTemplateBasedNote(templateContent);
      } catch (error) {
        console.error('Template-based generation failed, falling back to default:', error);
        // Fall through to default generation
      }
    }

    // Fallback to default note generation
    return generateDefaultNote();
  }, [noteType, selectedTemplate, language, medications, selectedPeSystems, intubationValues, processedLabValues, pmhText, impressionText, chiefComplaint, hpiText, selectedSymptoms, admissionType, progressType]);

  // Template-based note generation
  const generateTemplateBasedNote = useCallback((templateContent: any) => {
    try {
      const sections: string[] = [];
      
      // Validate template content structure
      if (!templateContent || !Array.isArray(templateContent.sections)) {
        console.error('Invalid template content structure');
        throw new Error('Invalid template content structure');
      }

      const enabledSections = templateContent.sections
        .filter((section: any) => section && section.sectionId && section.isEnabled !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      enabledSections.forEach((templateSection: any) => {
        try {
          const sectionContent = generateSectionContent(templateSection.sectionId, templateSection.customContent);
          if (sectionContent && sectionContent.trim()) {
            sections.push(sectionContent);
          }
        } catch (error) {
          console.error(`Error generating section content for ${templateSection.sectionId}:`, error);
          // Continue with other sections instead of failing completely
        }
      });

      return sections.filter(section => section && section.trim()).join('\n\n');
    } catch (error) {
      console.error('Error in generateTemplateBasedNote:', error);
      // Return a simple fallback without circular dependency
      return language === 'fr' ? 
        'Erreur lors de la génération de la note avec le modèle. Veuillez réessayer.' :
        'Error generating note with template. Please try again.';
    }
  }, [language, medications, selectedPeSystems, intubationValues, processedLabValues, pmhText, impressionText, chiefComplaint, hpiText, selectedSymptoms, noteType, admissionType, progressType]);

  // Generate content for a specific section with template custom content
  // Helper function to get section header (moved outside for reuse)
  const getSectionHeader = useCallback((sectionId: string): string => {
    const headers: Record<string, { en: string; fr: string }> = {
      'note-type': { en: 'NOTE TYPE', fr: 'TYPE DE NOTE' },
      'pmh': { en: 'PAST MEDICAL HISTORY', fr: 'ANTÉCÉDENTS MÉDICAUX' },
      'allergies-social': { en: 'ALLERGIES & SOCIAL HISTORY', fr: 'ALLERGIES & HISTOIRE SOCIALE' },
      'meds': { en: 'MEDICATIONS', fr: 'MÉDICAMENTS' },
      'hpi': { en: 'HISTORY OF PRESENT ILLNESS', fr: 'HISTOIRE DE LA MALADIE ACTUELLE' },
      'physical-exam': { en: 'PHYSICAL EXAMINATION', fr: 'EXAMEN PHYSIQUE' },
      'labs': { en: 'LABORATORY RESULTS', fr: 'RÉSULTATS DE LABORATOIRE' },
      'imagery': { en: 'IMAGING', fr: 'IMAGERIE' },
      'impression': { en: 'CLINICAL IMPRESSION', fr: 'IMPRESSION CLINIQUE' },
      'ventilation': { en: 'VENTILATION PARAMETERS', fr: 'PARAMÈTRES DE VENTILATION' },
      'plan': { en: 'PLAN', fr: 'PLAN' }
    };
    
    const header = headers[sectionId];
    if (!header) return sectionId.toUpperCase();
    return language === 'fr' ? header.fr : header.en;
  }, [language]);

  // Generate plain section content without formatting
  const generatePlainSectionContent = useCallback((sectionId: string, customContent?: string): string => {
    try {
      // If custom content is provided, use it without header
      if (customContent && customContent.trim()) {
        return customContent;
      }
      
      // Generate content based on section type WITHOUT headers and WITHOUT smart text formatting
      switch (sectionId) {
        case 'note-type': {
          return noteType ? noteType.toUpperCase() : '[Enter note type]';
        }
        
        case 'pmh': {
          let contentToFormat = pmhText;
          if (!pmhText.trim() && customContent && customContent.trim()) {
            contentToFormat = customContent;
          } else if (pmhText.trim() && customContent && customContent.trim()) {
            // Combine if needed, as before
            // ...
          }
          if (!contentToFormat.trim()) {
            return language === 'fr' ? '[Entrer les antécédents médicaux]' : '[Enter past medical history]';
          }
          // Return plain content without formatting
          return contentToFormat;
        }
        
        case 'ventilation': {
          // Generate intubation parameters text
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
          return language === 'fr' ? '[Entrer le plan de traitement]' : '[Enter treatment plan]';
        }
        
        case 'allergies-social': {
          // Generate allergies text
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

          // Generate social history text
          let socialText = language === 'fr' ? "HISTOIRE SOCIALE :\n" : "SOCIAL HISTORY:\n";
          const socialItems = [];
          
          // Always include smoking status
          const currentSocialHistory = socialHistoryRef.current;
          if (!currentSocialHistory) {
            socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
            socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
            socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
          } else {
            // Smoking status
            if (currentSocialHistory.smoking?.status) {
              socialItems.push(language === 'fr' 
                ? `Tabagisme: ${currentSocialHistory.smoking.details || ''}`
                : `Smoking: ${currentSocialHistory.smoking.details || ''}`);
            } else {
              socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
            }
            
            // Alcohol status
            if (currentSocialHistory.alcohol?.status) {
              socialItems.push(language === 'fr' 
                ? `Alcool: ${currentSocialHistory.alcohol.details || ''}`
                : `Alcohol: ${currentSocialHistory.alcohol.details || ''}`);
            } else {
              socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
            }
            
            // Drugs status
            if (currentSocialHistory.drugs?.status) {
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
          
          // Generate ROS text
          let rosText = '';
          if (Object.keys(selectedSymptoms).length > 0) {
            const rosSentences = Object.entries(selectedSymptoms).map(([system, symptoms]: [string, Set<string>]) => {
              const symptomList = Array.from(symptoms);
              if (symptomList.length === 0) return '';
              const systemObj = (rosSymptomOptions as Record<string, {symptoms: {key: string, en: string, fr: string}[]} >)[system];
              const getLabel = (key: string) => {
                const found = systemObj?.symptoms.find((s: {key: string}) => s.key === key);
                if (!found) return key.replace(/_/g, ' ');
                return language === 'fr' ? found.fr : found.en;
              };
              let sentence = '';
              if (language === 'fr') {
                sentence = symptomList.map(symptom => `pas de ${getLabel(symptom)}`).join(', ');
              } else {
                sentence = symptomList.map(symptom => `no ${getLabel(symptom).charAt(0).toLowerCase() + getLabel(symptom).slice(1)}`).join(', ');
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
          
          // Add ROS if available
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
          let contentToFormat = impressionText;
          if (!impressionText.trim() && customContent && customContent.trim()) {
            contentToFormat = customContent;
          } else if (impressionText.trim() && customContent && customContent.trim()) {
            // Prefer user data over custom template content
            contentToFormat = impressionText;
          }
          if (!contentToFormat.trim()) {
            return language === 'fr' ? '[Entrer les impressions cliniques]' : '[Enter clinical impressions]';
          }
          // Return plain content without formatting (formatting will be applied later)
          return contentToFormat;
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

  // Two-pass section content generation with headers and formatting
  const generateSectionContent = useCallback((sectionId: string, customContent?: string) => {
    try {
      // Pass 1: Generate plain content
      const plainContent = generatePlainSectionContent(sectionId, customContent);
      
      // Pass 2: Add header and apply formatting
      const header = getSectionHeader(sectionId);
      
      // Apply smart text formatting only to sections that need it
      const needsFormatting = ['pmh', 'impression'].includes(sectionId);
      const formattedContent = needsFormatting ? formatSmartText(plainContent) : plainContent;
      
      
      return `${header}:\n${formattedContent}`;
    } catch (error) {
      console.error(`Error generating content for section ${sectionId}:`, error);
      const header = getSectionHeader(sectionId);
      return `${header}:\n[Error: ${sectionId}]`;
    }
  }, [generatePlainSectionContent, getSectionHeader]);

  // Default note generation (existing logic)
  const generateDefaultNote = useCallback(() => {
    let generatedText = "";
    
    // Generate allergies text
    const generateAllergiesText = () => {
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
    };

    // Generate past medical history text
    const generatePMHText = () => {
      if (!pmhText.trim()) {
        return language === 'fr' 
          ? "ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]"
          : "PAST MEDICAL HISTORY:\n[Enter past medical history]";
      }
      
      // Format the smart text entry input
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
    };

    // Generate impression text
    const generateImpressionText = () => {
      if (!impressionText.trim()) {
        return language === 'fr' 
          ? "IMPRESSION CLINIQUE :\n[Entrer les impressions cliniques]"
          : "CLINICAL IMPRESSION:\n[Enter clinical impressions]";
      }
      
      // Format the smart text entry input
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
    };

    // Generate social history text
    const generateSocialHistoryText = () => {
      let socialText = language === 'fr' ? "HISTOIRE SOCIALE :\n" : "SOCIAL HISTORY:\n";
      const socialItems = [];
      const currentSocialHistory = socialHistoryRef.current;
      
      if (!currentSocialHistory) {
        socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
        socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
        socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
      } else {
        // Always include smoking status
        if (currentSocialHistory.smoking?.status) {
        socialItems.push(language === 'fr' 
          ? `Tabagisme: ${currentSocialHistory.smoking.details}`
          : `Smoking: ${currentSocialHistory.smoking.details}`);
      } else {
        socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
      }
      
        // Always include alcohol status
        if (currentSocialHistory.alcohol?.status) {
          socialItems.push(language === 'fr' 
            ? `Alcool: ${currentSocialHistory.alcohol.details || ''}`
            : `Alcohol: ${currentSocialHistory.alcohol.details || ''}`);
        } else {
          socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
        }
        
        // Always include drugs status
        if (currentSocialHistory.drugs?.status) {
          socialItems.push(language === 'fr' 
            ? `Drogues: ${currentSocialHistory.drugs.details || ''}`
            : `Drugs: ${currentSocialHistory.drugs.details || ''}`);
        } else {
          socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
        }
      }
      
      socialText += socialItems.join('\n');
      return socialText.trim();
    };

    // Generate medications text
    const generateMedicationsText = () => {
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
    };

    // Generate ROS text
    const generateRosText = () => {
      if (Object.keys(selectedSymptoms).length === 0) return "";
      // Each system gets its own sentence. Sentence case for first word, period at end.
      const rosSentences = Object.entries(selectedSymptoms).map(([system, symptoms]: [string, Set<string>]) => {
        const symptomList = Array.from(symptoms);
        if (symptomList.length === 0) return '';
        const systemObj = (rosSymptomOptions as Record<string, {symptoms: {key: string, en: string, fr: string}[]} >)[system];
        const getLabel = (key: string) => {
          const found = systemObj?.symptoms.find((s: {key: string}) => s.key === key);
          if (!found) return key.replace(/_/g, ' ');
          return language === 'fr' ? found.fr : found.en;
        };
        let sentence = '';
        if (language === 'fr') {
          sentence = symptomList.map(symptom => `pas de ${getLabel(symptom)}`).join(', ');
        } else {
          sentence = symptomList.map(symptom => `no ${getLabel(symptom).charAt(0).toLowerCase() + getLabel(symptom).slice(1)}`).join(', ');
        }
        // Sentence case: only first letter capitalized
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        // Ensure sentence ends with a period
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
    };

    // Generate Physical Exam text
    const generatePhysicalExamText = () => {
      if (selectedPeSystems.size === 0) return "";
      
      const peEntries = Array.from(selectedPeSystems).map(system => {
        const findings = physicalExamOptions[system as keyof typeof physicalExamOptions];
        return language === 'fr' ? findings : `${system}: ${findings}`;
      });
      
      return language === 'fr' 
        ? `EXAMEN PHYSIQUE :\n${peEntries.join("\n")}`
        : `PHYSICAL EXAMINATION:\n${peEntries.join("\n")}`;
    };

    // Generate intubation parameters text for ICU notes (without header)
    const generateIntubationText = () => {
      if (Object.keys(intubationValues).length === 0) return "";
      
      let intubationText = "";
      Object.entries(intubationValues).forEach(([param, data]) => {
        if (data.current) {
          intubationText += `${param}: ${data.current}\n`;
        }
      });
      return intubationText.trim();
    };

    // Generate lab values text
    const generateLabValuesText = () => {
      if (processedLabValues.length === 0) return "";
      
      const labText = formatLabValuesForNote(processedLabValues);
      return labText ? (language === 'fr' ? `RÉSULTATS DE LABORATOIRE:\n${labText}` : `LABORATORY RESULTS:\n${labText}`) : "";
    };

    // Build note based on type and subtype
    const sections: string[] = [];
    const isICU = (noteType === "admission" && admissionType === "icu") || (noteType === "progress" && progressType === "icu");
    
    if (noteType === "admission") {
      if (isICU) {
        // ICU Admission Note Template - Same as general but with systems instead of lab/imaging
        if (language === 'fr') {
          sections.push(`MOTIF D'ADMISSION :\n[Entrer le motif d'admission]`);
          sections.push(generatePMHText());
          sections.push(generateAllergiesText());
          sections.push(generateSocialHistoryText());
          sections.push(generateMedicationsText());
          let hpiWithRosFr = hpiText || "[Entrer l'HMA]";
          const rosText = generateRosText();
          if (rosText) hpiWithRosFr = hpiWithRosFr.trim().endsWith('.') ? hpiWithRosFr + ' ' + rosText : hpiWithRosFr + '. ' + rosText;
          sections.push(`HISTOIRE DE LA MALADIE ACTUELLE :
${hpiWithRosFr}`); // ROS now integrated into HPI section; no separate ROS section.;
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          // ICU Systems sections instead of lab/imaging
          sections.push(`NEURO :\n[État neurologique]`);
          sections.push(`HÉMODYNAMIQUE :\n[État cardiovasculaire]`);
          
          // RESPIRATOIRE section with integrated ventilation parameters
          const intubationText = generateIntubationText();
          const respiratoryContent = intubationText ? 
            `RESPIRATOIRE :\n[État respiratoire]\n\nParamètres de ventilation:\n${intubationText}` : 
            `RESPIRATOIRE :\n[État respiratoire]`;
          sections.push(respiratoryContent);
          
          sections.push(`GASTRO-INTESTINAL :\n[État gastro-intestinal]`);
          sections.push(`NÉPHRO-MÉTABOLIQUE :\n[État rénal et métabolique]`);
          sections.push(`HÉMATO-INFECTIEUX :\n[État hématologique et infectieux]`);
          
          sections.push(generateImpressionText());
          sections.push(`PLAN :\n[Entrer le plan de traitement]`);
        } else {
          sections.push(`REASON FOR ADMISSION:\n[Enter reason for admission]`);
          sections.push(generatePMHText());
          sections.push(generateAllergiesText());
          sections.push(generateSocialHistoryText());
          sections.push(generateMedicationsText());
          let hpiWithRos = hpiText || "[Enter HPI]";
          const rosText = generateRosText();
          if (rosText) hpiWithRos = hpiWithRos.trim().endsWith('.') ? hpiWithRos + ' ' + rosText : hpiWithRos + '. ' + rosText;
          sections.push(`HISTORY OF PRESENTING ILLNESS:
${hpiWithRos}`); // ROS now integrated into HPI section; no separate ROS section.
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          // ICU Systems sections instead of lab/imaging
          sections.push(`NEURO:\n[Neurological status]`);
          sections.push(`HEMODYNAMIC:\n[Cardiovascular status]`);
          
          // RESPIRATORY section with integrated ventilation parameters
          const intubationText = generateIntubationText();
          const respiratoryContent = intubationText ? 
            `RESPIRATORY:\n[Respiratory status]\n\nVentilation parameters:\n${intubationText}` : 
            `RESPIRATORY:\n[Respiratory status]`;
          sections.push(respiratoryContent);
          
          sections.push(`GASTROINTESTINAL:\n[Gastrointestinal status]`);
          sections.push(`NEPHRO-METABOLIC:\n[Renal and metabolic status]`);
          sections.push(`HEMATO-INFECTIOUS:\n[Hematologic and infectious status]`);
          
          sections.push(generateImpressionText());
          sections.push(`PLAN:\n[Enter treatment plan]`);
        }
      } else {
        // General Admission Note Template
        if (language === 'fr') {
          sections.push(`MOTIF D'ADMISSION :\n[Entrer le motif d'admission]`);
          sections.push(generatePMHText());
          sections.push(generateAllergiesText());
          sections.push(generateSocialHistoryText());
          sections.push(generateMedicationsText());
          sections.push(`HISTOIRE DE LA MALADIE ACTUELLE :\n${hpiText || "[Entrer l'HMA]"}`);
          
          const rosText = generateRosText();
          if (rosText) sections.push(rosText);
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          const labText = generateLabValuesText();
          sections.push(labText || `RÉSULTATS DE LABORATOIRE :\n[Entrer les résultats de laboratoire]`);
          sections.push(`IMAGERIE :\n[Entrer les résultats d'imagerie]`);
          sections.push(generateImpressionText());
          sections.push(`PLAN :\n[Entrer le plan de traitement]`);
        } else {
          sections.push(`REASON FOR ADMISSION:\n[Enter reason for admission]`);
          sections.push(generatePMHText());
          sections.push(generateAllergiesText());
          sections.push(generateSocialHistoryText());
          sections.push(generateMedicationsText());
          sections.push(`HISTORY OF PRESENTING ILLNESS:\n${hpiText || "[Enter HPI]"}`);
          
          const rosText = generateRosText();
          if (rosText) sections.push(rosText);
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          const labText = generateLabValuesText();
          sections.push(labText || `LABORATORY RESULTS:\n[Enter laboratory results]`);
          sections.push(`IMAGING:\n[Enter imaging results]`);
          sections.push(generateImpressionText());
          sections.push(`PLAN:\n[Enter treatment plan]`);
        }
      }
    } else if (noteType === "progress") {
      if (isICU) {
        // ICU Progress Note Template - Same as general but with systems instead of lab/imaging
        if (language === 'fr') {
          sections.push(`HISTOIRE DE LA MALADIE ACTUELLE:\n${hpiText || "[Entrer le statut actuel et l'historique de l'intervalle]"}`);
          
          const rosText = generateRosText();
          if (rosText) sections.push(rosText);
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          // ICU Systems sections instead of lab/imaging
          sections.push(`NEURO :\n[État neurologique]`);
          sections.push(`HÉMODYNAMIQUE :\n[État cardiovasculaire]`);
          
          // RESPIRATOIRE section with integrated ventilation parameters
          const intubationTextFr = generateIntubationText();
          const respiratoryContentFr = intubationTextFr ? 
            `RESPIRATOIRE :\n[État respiratoire]\n\nParamètres de ventilation:\n${intubationTextFr}` : 
            `RESPIRATOIRE :\n[État respiratoire]`;
          sections.push(respiratoryContentFr);
          
          sections.push(`GASTRO-INTESTINAL :\n[État gastro-intestinal]`);
          sections.push(`NÉPHRO-MÉTABOLIQUE :\n[État rénal et métabolique]`);
          sections.push(`HÉMATO-INFECTIEUX :\n[État hématologique et infectieux]`);
          
          sections.push(`ÉVALUATION ET PLAN:\n[Entrer l'évaluation et le plan]`);
        } else {
          sections.push(`HISTORY OF PRESENTING ILLNESS:\n${hpiText || "[Enter current status and interval history]"}`);
          
          const rosText = generateRosText();
          if (rosText) sections.push(rosText);
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          // ICU Systems sections instead of lab/imaging
          sections.push(`NEURO:\n[Neurological status]`);
          sections.push(`HEMODYNAMIC:\n[Cardiovascular status]`);
          
          // RESPIRATORY section with integrated ventilation parameters
          const intubationTextEn = generateIntubationText();
          const respiratoryContentEn = intubationTextEn ? 
            `RESPIRATORY:\n[Respiratory status]\n\nVentilation parameters:\n${intubationTextEn}` : 
            `RESPIRATORY:\n[Respiratory status]`;
          sections.push(respiratoryContentEn);
          
          sections.push(`GASTROINTESTINAL:\n[Gastrointestinal status]`);
          sections.push(`NEPHRO-METABOLIC:\n[Renal and metabolic status]`);
          sections.push(`HEMATO-INFECTIOUS:\n[Hematologic and infectious status]`);
          
          sections.push(`ASSESSMENT AND PLAN:\n[Enter assessment and plan]`);
        }
      } else {
        // General Progress Note Template
        if (language === 'fr') {
          sections.push(`HISTOIRE DE LA MALADIE ACTUELLE:\n${hpiText || "[Entrer le statut actuel et l'historique de l'intervalle]"}`);
          
          const rosText = generateRosText();
          if (rosText) sections.push(rosText);
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          const labText = generateLabValuesText();
          if (labText) {
            sections.push(labText);
          } else {
            sections.push(`RÉSULTATS DE LABORATOIRE:\n[Entrer les résultats de laboratoire]`);
          }
          sections.push(`IMAGERIE:\n[Entrer les résultats d'imagerie]`);
          sections.push(`ÉVALUATION ET PLAN:\n[Entrer l'évaluation et le plan]`);
        } else {
          sections.push(`HISTORY OF PRESENTING ILLNESS:\n${hpiText || "[Enter current status and interval history]"}`);
          
          const rosText = generateRosText();
          if (rosText) sections.push(rosText);
          
          const peText = generatePhysicalExamText();
          if (peText) sections.push(peText);
          
          const labText = generateLabValuesText();
          if (labText) {
            sections.push(labText);
          } else {
            sections.push(`LABORATORY RESULTS:\n[Enter laboratory results]`);
          }
          sections.push(`IMAGING:\n[Enter imaging results]`);
          sections.push(`ASSESSMENT AND PLAN:\n[Enter assessment and plan]`);
        }
      }
    } else if (noteType === "consultation") {
      sections.push(`CONSULTATION NOTE:\n[Consultation sections to be defined]`);
    }

    return sections.filter(section => section.trim()).join('\n\n');
  }, [noteType, admissionType, progressType, language, medications, selectedPeSystems, intubationValues, processedLabValues, pmhText, impressionText, chiefComplaint, hpiText, selectedSymptoms]);

  // Additional helper functions for template sections
  const generateAllergiesSocialText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    // Generate allergies text
    const generateAllergiesText = () => {
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
    };

    // Generate social history text
    const generateSocialHistoryText = () => {
      let socialText = language === 'fr' ? "HISTOIRE SOCIALE :\n" : "SOCIAL HISTORY:\n";
      const socialItems = [];
      const currentSocialHistory = socialHistoryRef.current;
      
      if (!currentSocialHistory) {
        socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
        socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
        socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
      } else {
        // Always include smoking status
        if (currentSocialHistory.smoking?.status) {
        socialItems.push(language === 'fr' 
          ? `Tabagisme: ${currentSocialHistory.smoking.details}`
          : `Smoking: ${currentSocialHistory.smoking.details}`);
      } else {
        socialItems.push(language === 'fr' ? "Non-fumeur" : "No smoking");
      }
      
        // Always include alcohol status
        if (currentSocialHistory.alcohol?.status) {
          socialItems.push(language === 'fr' 
            ? `Alcool: ${currentSocialHistory.alcohol.details || ''}`
            : `Alcohol: ${currentSocialHistory.alcohol.details || ''}`);
        } else {
          socialItems.push(language === 'fr' ? "Pas d'alcool" : "No alcohol");
        }
        
        // Always include drugs status
        if (currentSocialHistory.drugs?.status) {
          socialItems.push(language === 'fr' 
            ? `Drogues: ${currentSocialHistory.drugs.details || ''}`
            : `Drugs: ${currentSocialHistory.drugs.details || ''}`);
        } else {
          socialItems.push(language === 'fr' ? "Pas de drogues" : "No drugs");
        }
      }
      
      socialText += socialItems.join('\n');
      return socialText.trim();
    };
    
    const allergiesText = generateAllergiesText();
    const socialText = generateSocialHistoryText();
    return `${allergiesText}\n\n${socialText}`;
  }, [language]);

  const generateHPIText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    const header = language === 'fr' ? "HISTOIRE DE LA MALADIE ACTUELLE :" : "HISTORY OF PRESENT ILLNESS:";
    const content = hpiText || (language === 'fr' ? "[Entrer l'HMA]" : "[Enter HPI]");
    
    // Generate ROS text
    const generateRosText = () => {
      if (Object.keys(selectedSymptoms).length === 0) return "";
      // Each system gets its own sentence. Sentence case for first word, period at end.
      const rosSentences = Object.entries(selectedSymptoms).map(([system, symptoms]: [string, Set<string>]) => {
        const symptomList = Array.from(symptoms);
        if (symptomList.length === 0) return '';
        const systemObj = (rosSymptomOptions as Record<string, {symptoms: {key: string, en: string, fr: string}[]} >)[system];
        const getLabel = (key: string) => {
          const found = systemObj?.symptoms.find((s: {key: string}) => s.key === key);
          if (!found) return key.replace(/_/g, ' ');
          return language === 'fr' ? found.fr : found.en;
        };
        let sentence = '';
        if (language === 'fr') {
          sentence = symptomList.map(symptom => `pas de ${getLabel(symptom)}`).join(', ');
        } else {
          sentence = symptomList.map(symptom => `no ${getLabel(symptom).charAt(0).toLowerCase() + getLabel(symptom).slice(1)}`).join(', ');
        }
        // Sentence case: only first letter capitalized
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        // Ensure sentence ends with a period
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
    };
    
    // Add ROS if available
    const rosText = generateRosText();
    const fullContent = rosText ? 
      (content.trim().endsWith('.') ? `${content} ${rosText}` : `${content}. ${rosText}`) : 
      content;
    
    return `${header}\n${fullContent}`;
  }, [hpiText, selectedSymptoms, language]);

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
  }, [imageryStudies, language]);

  const generateVentilationText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    const header = language === 'fr' ? "PARAMÈTRES DE VENTILATION :" : "VENTILATION PARAMETERS:";
    
    // Generate intubation parameters text
    const generateIntubationText = () => {
      if (Object.keys(intubationValues).length === 0) return "";
      
      let intubationText = "";
      Object.entries(intubationValues).forEach(([param, data]) => {
        if (data.current) {
          intubationText += `${param}: ${data.current}\n`;
        }
      });
      return intubationText.trim();
    };
    
    const intubationText = generateIntubationText();
    
    return intubationText ? `${header}\n${intubationText}` : "";
  }, [intubationValues, language]);

  const generatePlanText = useCallback((customContent?: string) => {
    if (customContent && customContent.trim()) {
      return customContent;
    }
    
    return language === 'fr' ? "PLAN :\n[Entrer le plan de traitement]" : "PLAN:\n[Enter treatment plan]";
  }, [language]);

  // Handle option changes with diff-patch-merge
  const handleOptionChange = useCallback(() => {
    const newGeneratedText = generateTextFromOptions();
    
    if (initialGeneratedText === "") {
      // First generation
      setInitialGeneratedText(newGeneratedText);
      setCurrentText(newGeneratedText);
      setNote(newGeneratedText);
    } else {
      // Apply diff-patch-merge
      const diff = dmp.current.diff_main(initialGeneratedText, currentText);
      dmp.current.diff_cleanupSemantic(diff);
      const patch = dmp.current.patch_make(diff);
      const [patchedText] = dmp.current.patch_apply(patch, newGeneratedText);
      
      setCurrentText(patchedText);
      setInitialGeneratedText(newGeneratedText);
      setNote(patchedText);
    }
  }, [generateTextFromOptions, initialGeneratedText, currentText]);

  // Handle manual text changes
  const handleNoteChange = (newText: string) => {
    setCurrentText(newText);
    setNote(newText);
  };

  // Reset to generated text
  const resetToGenerated = () => {
    const newGeneratedText = generateTextFromOptions();
    setInitialGeneratedText(newGeneratedText);
    setCurrentText(newGeneratedText);
    setNote(newGeneratedText);
  };

  // Toggle functions (PE only)
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

  // ROS system-level select all removed. Use symptom-level logic instead.
  const selectAllPeSystems = () => {
    setSelectedPeSystems(new Set(Object.keys(physicalExamOptions)));
  };

  // Allergy functions
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

  // Copy to clipboard
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

  // Load templates when note type or subtype changes
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

  // Update note when options change
  useEffect(() => {
    handleOptionChange();
  }, [handleOptionChange]);



  // Additional effect to ensure medication changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [medications]);

  // Additional effect to ensure lab value changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [processedLabValues]);

  // Additional effect to ensure PMH changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [pmhText]);

  // Update note on blur for allergies and social history to prevent focus issues
  const timeoutRef = useRef<NodeJS.Timeout[]>([]);
  
  const handleAllergiesBlur = useCallback(() => {
    try {
      handleOptionChange();
    } catch (error) {
      console.error('Error in handleAllergiesBlur:', error);
    }
  }, [handleOptionChange]);

  const handleSocialHistoryBlur = useCallback(() => {
    try {
      handleOptionChange();
    } catch (error) {
      console.error('Error in handleSocialHistoryBlur:', error);
    }
  }, [handleOptionChange]);
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutRef.current = [];
    };
  }, []);

  // Additional effect to ensure ROS and HPI changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [selectedSystem, selectedSymptoms, hpiText]);

  // Additional effect to ensure note type and subtype changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [noteType, admissionType, progressType]);

  // Additional effect to ensure chief complaint changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [chiefComplaint]);

  // Additional effect to ensure physical exam changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [selectedPeSystems]);

  // Additional effect to ensure ventilation parameters trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [intubationValues]);

  // Additional effect to ensure impression changes trigger note updates
  useEffect(() => {
    handleOptionChange();
  }, [impressionText]);

  // Template state persistence
  useEffect(() => {
    // Load saved template selection on component mount
    const savedTemplateId = localStorage.getItem('selectedTemplateId');
    if (savedTemplateId && availableTemplates.length > 0) {
      const savedTemplate = availableTemplates.find(t => t.id.toString() === savedTemplateId);
      if (savedTemplate) {
        setSelectedTemplate(savedTemplate);
      }
    }
  }, [availableTemplates]);

  // Save selected template to localStorage
  useEffect(() => {
    if (selectedTemplate) {
      localStorage.setItem('selectedTemplateId', selectedTemplate.id.toString());
    } else {
      localStorage.removeItem('selectedTemplateId');
    }
  }, [selectedTemplate]);

  // Update note when template changes
  useEffect(() => {
    handleOptionChange();
  }, [selectedTemplate, handleOptionChange]);

  // Keyboard navigation for tabs
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle arrow keys when not typing in input fields
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
        return;
      }
      
      // Don't handle navigation if we're in the allergies-social section
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

  // Detect if text was manually edited
  const isManuallyEdited = currentText !== initialGeneratedText && initialGeneratedText !== "";

  // Add a mapping of subOption keys to their icons (matching MainLayout)
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
  };

  // In SectionWrapper, allow rendering of controls in the header
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

  // Clear PMH function for the new simple component
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

  // Render the main content based on selectedSubOption
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
      "ventilation": "Ventilation Parameters"
    };

    switch (selectedSubOption) {
      case "note-type":
        return (
          <SectionWrapper title={sectionTitle["note-type"]} sectionKey="note-type">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <p className="text-sm text-gray-600">For new patient admissions.</p>
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
                  <p className="text-sm text-gray-600">For daily or interval progress updates.</p>
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
                  <p className="text-sm text-gray-600">For specialist or consult notes.</p>
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
                      <p className="text-sm text-gray-500 ml-5">Standard progress note.</p>
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
                      <p className="text-sm text-gray-500 ml-5">ICU-specific progress note.</p>
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
                      <p className="text-sm text-gray-500 ml-5">Standard admission note.</p>
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
                      <p className="text-sm text-gray-500 ml-5">ICU-specific admission note.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Template Selection Section */}
              {noteType && (
                <div className="border-t pt-4 mt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Template Selection</h4>
                  <div className="space-y-3">
                    {/* Standard Note Option */}
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
                      <p className="text-sm text-gray-500 ml-6">Use the default medical note format with all sections</p>
                    </div>

                    {/* Loading State */}
                    {loadingTemplates && (
                      <div className="p-3 border rounded-lg bg-gray-50">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-600">Loading templates...</span>
                        </div>
                      </div>
                    )}

                    {/* Template Error */}
                    {templateError && (
                      <div className="p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm text-red-600">{templateError}</span>
                        </div>
                      </div>
                    )}

                    {/* Available Templates */}
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
                          <p className="text-sm text-gray-500 ml-6 mt-1">{template.description}</p>
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

                    {/* No Templates Message */}
                    {!loadingTemplates && !templateError && availableTemplates.length === 0 && (
                      <div className="p-3 border border-dashed rounded-lg bg-gray-50">
                        <div className="text-center">
                          <ClipboardList className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-1">No templates available for this note type</p>
                          <p className="text-xs text-gray-500">Create templates in Smart Functions → Templates</p>
                        </div>
                      </div>
                    )}

                    {/* Browse All Templates Link */}
                    {!loadingTemplates && availableTemplates.length > 0 && (
                      <div className="text-center pt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            // This would typically navigate to template manager
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
              setSelectedSymptoms={setSelectedSymptoms}
            />
          </SectionWrapper>
        );
      case "ros":
        return (
          <SectionWrapper title={sectionTitle["ros"]} sectionKey="ros">
            {/* Review of Systems UI will go here */}
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Review of systems examination.</p>
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
            <div className="space-y-4">
              <LabImageUpload onLabValuesExtracted={handleLabValuesExtracted} />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Allergies Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-orange-500" />
                  {language === 'fr' ? 'Allergies' : 'Allergies'}
                </h4>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-gray-600">{language === 'fr' ? 'Patient a des allergies' : 'Patient has allergies'}</span>
                  <button
                    onClick={() => {
                      setAllergies({
                        hasAllergies: !allergies.hasAllergies,
                        allergiesList: allergies.hasAllergies ? [] : allergies.allergiesList
                      });
                      // Trigger note update immediately for toggle actions
                      const timeout = setTimeout(handleAllergiesBlur, 0);
                      timeoutRef.current.push(timeout);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                      allergies.hasAllergies ? 'bg-orange-500' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        allergies.hasAllergies ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                    placeholder={language === 'fr' ? 'Ajouter une allergie...' : 'Add allergy...'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newAllergy.trim()) {
                        if (!allergies.allergiesList.includes(newAllergy.trim())) {
                          setAllergies(prev => ({
                            hasAllergies: true,
                            allergiesList: [...prev.allergiesList, newAllergy.trim()]
                          }));
                        }
                        setNewAllergy('');
                        handleAllergiesBlur();
                      }
                    }}
                    onBlur={handleAllergiesBlur}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => {
                      if (newAllergy.trim() && !allergies.allergiesList.includes(newAllergy.trim())) {
                        setAllergies(prev => ({
                          hasAllergies: true,
                          allergiesList: [...prev.allergiesList, newAllergy.trim()]
                        }));
                        setNewAllergy('');
                      }
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {allergies.hasAllergies && allergies.allergiesList.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {allergies.allergiesList.map((allergy, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center gap-1">
                        {allergy}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-600"
                          onClick={() => setAllergies(prev => ({
                            hasAllergies: true,
                            allergiesList: prev.allergiesList.filter((_, i) => i !== index)
                          }))}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Social History Section */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-500" />
                  {language === 'fr' ? 'Histoire Sociale' : 'Social History'}
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{language === 'fr' ? 'Tabagisme' : 'Smoking'}</span>
                    <button
                      onClick={() => {
                        setSocialHistory(prev => ({ ...prev, smoking: { status: !prev.smoking.status, details: prev.smoking.status ? '' : prev.smoking.details } }));
                        const timeout = setTimeout(handleSocialHistoryBlur, 0);
                        timeoutRef.current.push(timeout);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                        socialHistory.smoking.status ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          socialHistory.smoking.status ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {socialHistory.smoking.status && (
                    <Input
                      placeholder={language === 'fr' ? 'Détails du tabagisme...' : 'Smoking details...'}
                      value={socialHistory.smoking.details}
                      onChange={(e) => setSocialHistory(prev => ({ ...prev, smoking: { ...prev.smoking, details: e.target.value } }))}
                      onBlur={handleSocialHistoryBlur}
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{language === 'fr' ? 'Alcool' : 'Alcohol'}</span>
                    <button
                      onClick={() => {
                        setSocialHistory(prev => ({ ...prev, alcohol: { status: !prev.alcohol.status, details: prev.alcohol.status ? '' : prev.alcohol.details } }));
                        const timeout = setTimeout(handleSocialHistoryBlur, 0);
                        timeoutRef.current.push(timeout);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                        socialHistory.alcohol.status ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          socialHistory.alcohol.status ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {socialHistory.alcohol.status && (
                    <Input
                      placeholder={language === 'fr' ? 'Détails de l\'alcool...' : 'Alcohol details...'}
                      value={socialHistory.alcohol.details}
                      onChange={(e) => setSocialHistory(prev => ({ ...prev, alcohol: { ...prev.alcohol, details: e.target.value } }))}
                      onBlur={handleSocialHistoryBlur}
                    />
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{language === 'fr' ? 'Drogues' : 'Drugs'}</span>
                    <button
                      onClick={() => {
                        setSocialHistory(prev => ({ ...prev, drugs: { status: !prev.drugs.status, details: prev.drugs.status ? '' : prev.drugs.details } }));
                        const timeout = setTimeout(handleSocialHistoryBlur, 0);
                        timeoutRef.current.push(timeout);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
                        socialHistory.drugs.status ? 'bg-pink-500' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          socialHistory.drugs.status ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                  {socialHistory.drugs.status && (
                    <Input
                      placeholder={language === 'fr' ? 'Détails des drogues...' : 'Drug details...'}
                      value={socialHistory.drugs.details}
                      onChange={(e) => setSocialHistory(prev => ({ ...prev, drugs: { ...prev.drugs, details: e.target.value } }))}
                      onBlur={handleSocialHistoryBlur}
                    />
                  )}
                </div>
              </div>
            </div>
          </SectionWrapper>
        );

      case "imagery": {
        // --- Icons for systems ---
        const systemIcons: Record<string, React.ReactNode> = {
          neuro: <Brain className="w-5 h-5 text-indigo-600 bg-indigo-100 rounded-full p-1" />,
          cardiac: <HeartPulse className="w-5 h-5 text-rose-600 bg-rose-100 rounded-full p-1" />,
          chest: <Activity className="w-5 h-5 text-cyan-600 bg-cyan-100 rounded-full p-1" />,
          abdomen: <Apple className="w-5 h-5 text-yellow-600 bg-yellow-100 rounded-full p-1" />,
          pelvis: <Shield className="w-5 h-5 text-emerald-600 bg-emerald-100 rounded-full p-1" />,
          spine: <Bone className="w-5 h-5 text-orange-600 bg-orange-100 rounded-full p-1" />,
          limb: <Activity className="w-5 h-5 text-blue-600 bg-blue-100 rounded-full p-1" />,
        };
        // UI state is now defined at component top level

        // --- Add study handler ---
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
        // --- Remove study handler (already defined above) ---

        return (
          <SectionWrapper title={sectionTitle["imagery"]} sectionKey="imagery">
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-2">Select the system, exam type, and enter the result for each imaging study. All entries will be included in your note.</div>
              {/* Organ system cards */}
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
                    <span className="mt-2 text-sm font-medium text-gray-900">{sys.label}</span>
                  </div>
                ))}
              </div>
              {/* Modalities and result input for expanded system */}
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
                        className="border rounded px-2 py-1 text-sm flex-1"
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
              {/* List of added studies */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.isArray(imageryStudies) && imageryStudies.map((study: { system: string; modality: string; result: string }, idx: number) => (
                  <div key={idx} className="bg-gray-50 border rounded-lg p-3 flex flex-col gap-1 relative">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {systemIcons[study.system]}
                      <span className="text-gray-700">{imagerySystems.find(s => s.key === study.system)?.label}</span>
                      <span className="text-gray-400">/</span>
                      <span className="text-gray-700">{study.modality}</span>
                    </div>
                    <div className="text-xs text-gray-600">{study.result || <span className="italic text-gray-400">No result entered</span>}</div>
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
      } // <-- This fixes your syntax error!
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
      case "ventilation":
        return (
          <SectionWrapper title={sectionTitle["ventilation"]} sectionKey="ventilation">
            {/* Ventilation Parameters UI will go here */}
            <div className="space-y-4">
              <p className="text-sm text-gray-600">Configure ventilation parameters for ICU notes.</p>
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
                  <p className="text-sm text-gray-600">Dot phrases functionality will be implemented here.</p>
                </div>
              </div>
            </div>
          );
        }
        return null;
    }
  };

  // Collect all note data for template preview
  const getNoteData = () => {
    const noteData: Record<string, string> = {};
    
    try {
      // Note type section
      if (noteType) {
        noteData['note-type'] = `Note Type: ${noteType.charAt(0).toUpperCase() + noteType.slice(1)}`;
      }
      
      // PMH section
      if (pmhText && pmhText.trim()) {
        noteData['pmh'] = pmhText;
      }
      
      // Medications section
      if (medications && Array.isArray(medications.homeMedications) && Array.isArray(medications.hospitalMedications)) {
        const allMeds = [...medications.homeMedications, ...medications.hospitalMedications];
        if (allMeds.length > 0) {
          noteData['meds'] = formatMedicationsForNote(allMeds);
        }
      }
      
      // Allergies section  
      const currentAllergies = allergiesRef.current;
      if (currentAllergies && currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
        noteData['allergies-social'] = `Allergies: ${currentAllergies.allergiesList.join(', ')}`;
      }
      
      // HPI section
      if (chiefComplaint || hpiText) {
        const hpiContent = [
          chiefComplaint?.customComplaint?.trim() || '',
          hpiText?.trim() || ''
        ].filter(Boolean).join('\n');
        if (hpiContent) {
          noteData['hpi'] = hpiContent;
        }
      }
      
      // Physical exam
      if (selectedPeSystems && selectedPeSystems.size > 0) {
        const peEntries = Array.from(selectedPeSystems).map(system => {
          const findings = physicalExamOptions[system as keyof typeof physicalExamOptions] || 'Normal';
          return `${system}: ${findings}`;
        });
        noteData['physical-exam'] = peEntries.join("\n");
      }
      
      // Labs
      if (processedLabValues && Array.isArray(processedLabValues) && processedLabValues.length > 0) {
        noteData['labs'] = formatLabValuesForNote(processedLabValues);
      }
      
      // Imagery studies
      if (imageryStudies && Array.isArray(imageryStudies) && imageryStudies.length > 0) {
        const imageryText = imageryStudies.map(study => 
          `${study.system} ${study.modality}: ${study.result}`
        ).join('\n');
        noteData['imagery'] = imageryText;
      }
      
      // Impression
      if (impressionText && impressionText.trim()) {
        noteData['impression'] = impressionText;
      }
      
      // ROS section
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

  // Render the live preview panel content with template awareness
  const renderLivePreview = () => {
    // Safely format note data with fallbacks
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
      />
    );
  };

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
    >
      <div className="flex flex-1 h-full min-h-[600px] bg-gray-50">
        <div className="flex-1 min-w-0 flex flex-col p-0">
          <div className="w-full h-full min-h-[600px] flex flex-col rounded-none shadow-none bg-white border-0">
            <div className="flex-1 overflow-y-auto px-6 py-4 text-base text-gray-800">
              {renderMainContent() || (
                <div className="text-center text-gray-400 py-12">
                  Please select a section from the sidebar to begin.
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Divider for desktop */}
        <div className="hidden lg:block w-px bg-gray-200 h-full mx-0" />
      </div>
    </MainLayout>
  );
}

export default ReviewOfSystems;