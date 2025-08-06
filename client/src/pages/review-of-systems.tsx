import { MainLayout } from "../components/MainLayout";
import React, { useState, useRef, useCallback, useEffect, useLayoutEffect, useMemo } from "react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useNoteState } from "@/contexts/NoteStateContext";
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
import { LabTextPaste } from "@/components/LabTextPaste";
import { LabSettingsPopover } from "@/components/LabSettingsPopover";
import { LabValuesDisplay, LabValuesDisplayHandle } from "@/components/LabValuesDisplay";
import { EnhancedLabEntry } from "@/components/EnhancedLabEntry";
import { processLabValues, formatLabValuesForNote, type LabValue, type ProcessedLabValue } from "@/lib/labUtils";
import { loadLabSettings, getPanelDefaultSelections } from "@/lib/labSettings";
import { categorizeLabTest } from "@/lib/labCategorizer";
import * as DiffMatchPatch from 'diff-match-patch';
import { DotPhraseTextarea } from '@/components/DotPhraseTextarea';
import { useGlobalScrollPreservation } from '@/hooks/useGlobalScrollPreservation';
import HpiSection from '@/components/HpiSection';
import { TemplateAwareLivePreview } from '@/components/TemplateAwareLivePreview';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useDebounceCallback } from '@/hooks/useDebounce';

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

function ReviewOfSystems({ selectedMenu, setSelectedMenu, selectedSubOption, setSelectedSubOption }: SidebarStateProps) {
  // Get centralized note state management
  const noteState = useNoteState();
  
  // Global scroll preservation to survive page re-renders
  const { preserveBeforeUpdate } = useGlobalScrollPreservation('review-of-systems');

  // Wrapper to preserve scroll before any lab state updates that cause re-renders
  const setProcessedLabValuesWithScrollPreservation = useCallback((labs: ProcessedLabValue[] | ((prev: ProcessedLabValue[]) => ProcessedLabValue[])) => {
    preserveBeforeUpdate();
    if (typeof labs === 'function') {
      setProcessedLabValues(labs);
    } else {
      setProcessedLabValues(labs);
    }
  }, [preserveBeforeUpdate]);

  // Note state with diff-patch-merge tracking
  // Use persistent storage for main note content
  const note = noteState.getFormData('note') || '';
  const setNote = (value: string) => noteState.setFormData('note', value);
  
  const initialGeneratedText = noteState.getFormData('initialGeneratedText') || '';
  const setInitialGeneratedText = (value: string) => noteState.setFormData('initialGeneratedText', value);
  
  const currentText = noteState.getFormData('currentText') || '';
  const setCurrentText = (value: string) => noteState.setFormData('currentText', value);
  const dmp = useRef(new DiffMatchPatch.diff_match_patch());
  
  // Use persistent note type from context
  const noteType = noteState.noteType as NoteType;
  const setNoteTypeState = noteState.setNoteType;
  
  // Use persistent storage for custom note text
  const customNoteText = noteState.getFormData('customNoteText') || '';
  const setCustomNoteText = (value: string) => noteState.setFormData('customNoteText', value);
  // Use persistent storage for admission and progress types
  const admissionType = (noteState.getFormData('admissionType') as NoteSubtype) || 'general';
  const setAdmissionType = (value: NoteSubtype) => noteState.setFormData('admissionType', value);
  
  const progressType = (noteState.getFormData('progressType') as NoteSubtype) || 'general';
  const setProgressType = (value: NoteSubtype) => noteState.setFormData('progressType', value);
  
  // Template state management
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const isTemplateActive = selectedTemplate !== null;
  
  // Template-related state
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);
  
  // Lab settings state
  const [labSettings, setLabSettings] = useState(() => loadLabSettings());
  // Control visibility of the Lab Settings modal so it remains open across re-renders
  const [isLabSettingsOpen, setLabSettingsOpen] = useState(false);
  // Persistent tab state for lab settings modal
  const [labSettingsActiveTab, setLabSettingsActiveTab] = useState('panels');
  // Persistent panel state for lab order settings within the "Tests & Order" tab
  const [labSettingsPanelSelection, setLabSettingsPanelSelection] = useState('CBC');
  
  // Stable callback for settings changes to prevent component remounting
  const handleLabSettingsChange = useCallback((settings: any) => {
    console.log('🏠 Main page: Lab settings updated:', settings);
    setLabSettings(settings);
  }, []);
  
  // Stable callback for modal open state changes
  const handleLabSettingsOpenChange = useCallback((open: boolean) => {
    console.log('🏠 Main page: Lab settings modal open state changed to:', open);
    setLabSettingsOpen(open);
  }, []);
  
  // Stable callback for tab state changes
  const handleLabSettingsTabChange = useCallback((tab: string) => {
    console.log('🏠 Main page: Lab settings tab changed to:', tab);
    setLabSettingsActiveTab(tab);
  }, []);
  
  // Stable callback for panel state changes
  const handleLabSettingsPanelChange = useCallback((panel: string) => {
    console.log('🏠 Main page: Lab settings panel changed to:', panel);
    setLabSettingsPanelSelection(panel);
  }, []);
  
  // Debug component re-renders
  useEffect(() => {
    console.log('🏠 Main page: Component rendered/updated, isLabSettingsOpen:', isLabSettingsOpen);
  });
  
  // Memoized LabSettingsPopover to prevent re-creation on every render
  const memoizedLabSettingsPopover = useMemo(() => (
    <LabSettingsPopover 
      onSettingsChange={handleLabSettingsChange}
      isOpenExternal={isLabSettingsOpen}
      setIsOpenExternal={handleLabSettingsOpenChange}
      activeTabExternal={labSettingsActiveTab}
      setActiveTabExternal={handleLabSettingsTabChange}
      selectedPanelExternal={labSettingsPanelSelection}
      setSelectedPanelExternal={handleLabSettingsPanelChange}
    />
  ), [handleLabSettingsChange, isLabSettingsOpen, handleLabSettingsOpenChange, labSettingsActiveTab, handleLabSettingsTabChange, labSettingsPanelSelection, handleLabSettingsPanelChange]);
  
  // ROS state
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  interface SymptomObject {
    key: string;
    severity?: 'mild' | 'moderate' | 'severe';
    note?: string;
  }
  // Persisted HPI symptom selections so they survive sub-menu switches and re-renders
  const {
    value: selectedSymptoms,
    setValue: setSelectedSymptoms,
  } = usePersistedState<Record<string, Set<SymptomObject>>>(
    'medical_selected_symptoms',
    {},
    undefined,
    undefined,
    true // Enable sessionStorage backup for tab reloads
  );
  const [selectedPeSystems, setSelectedPeSystems] = useState<Set<string>>(new Set());
  
  // ICU intubation
  const [intubationValues, setIntubationValues] = useState<Record<string, { current: string; past: string[] }>>({});
  
  // Use persistent state for medications and allergies
  const { 
    value: medications, 
    setValue: setMedications 
  } = usePersistedState<MedicationData>(
    'medical_medications',
    { homeMedications: [], hospitalMedications: [] }
  );
  
  const { 
    value: allergies, 
    setValue: setAllergies 
  } = usePersistedState<AllergiesData>(
    'medical_allergies',
    { hasAllergies: false, allergiesList: [] }
  );
  
  const [newAllergy, setNewAllergy] = useState("");
  
  const { 
    value: socialHistory, 
    setValue: setSocialHistory 
  } = usePersistedState<SocialHistoryData>(
    'medical_social_history',
    {
      smoking: { status: false, details: "" },
      alcohol: { status: false, details: "" },
      drugs: { status: false, details: "" }
    }
  );

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
  
  // Use persistent state for form data
  const { 
    value: chiefComplaint, 
    setValue: setChiefComplaint 
  } = usePersistedState<ChiefComplaintData>(
    'medical_chief_complaint',
    {
      selectedTemplate: "",
      customComplaint: "",
      presentingSymptoms: "",
      onsetDuration: "",
      associatedSymptoms: "",
      aggravatingFactors: "",
      relievingFactors: "",
      previousTreatment: ""
    }
  );

  const { 
    value: hpiText, 
    setValue: setHpiText 
  } = usePersistedState<string>('medical_hpi_text', "");

  const { 
    value: pmhText, 
    setValue: setPmhText 
  } = usePersistedState<string>('medical_pmh_text', '');
  
  // State for live editing of PMH to prevent re-renders on every keystroke
  const [typingPmhText, setTypingPmhText] = useState(pmhText);
  
  // Sync live editing state if the persisted value changes
  useEffect(() => {
    setTypingPmhText(pmhText);
  }, [pmhText]);

  const { 
    value: impressionText, 
    setValue: setImpressionText 
  } = usePersistedState<string>('medical_impression_text', '');

  // Create debounced callbacks to prevent focus interruption
  const debouncedSetImpressionText = useDebounceCallback((value: string) => {
    setImpressionText(value);
  }, 500); // 500ms delay for live preview updates

  const debouncedSetCustomNoteText = useDebounceCallback((value: string) => {
    setCustomNoteText(value);
  }, 500); // 500ms delay for live preview updates

  // Use persistent state for lab values to prevent data loss when switching sections
  const { 
    value: processedLabValues, 
    setValue: setProcessedLabValues 
  } = usePersistedState<ProcessedLabValue[]>(
    'medical_processed_lab_values',
    [],
    undefined,
    undefined,
    true // Enable session backup for tab persistence
  );

  // Use persistent state for raw lab values to maintain complete lab state
  const { 
    value: labValues, 
    setValue: setLabValues 
  } = usePersistedState<LabValue[]>(
    'medical_lab_values',
    [],
    undefined,
    undefined,
    true // Enable session backup for tab persistence
  );
  
  // Use persistent state for pending lab changes to prevent data loss
  const { 
    value: pendingLabChanges, 
    setValue: setPendingLabChanges 
  } = usePersistedState<ProcessedLabValue[]>(
    'medical_pending_lab_changes',
    [],
    undefined,
    undefined,
    true // Enable session backup for tab persistence
  );
  
  // Use persistent state for pending changes flag to maintain status across section switches
  const { 
    value: hasPendingLabChanges, 
    setValue: setHasPendingLabChanges 
  } = usePersistedState<boolean>(
    'medical_has_pending_lab_changes',
    false,
    undefined,
    undefined,
    true // Enable session backup for tab persistence
  );
  // Use persistent state for selected lab tests to maintain user's selections
  const { 
    value: selectedLabTests, 
    setValue: setSelectedLabTests 
  } = usePersistedState<Set<string>>(
    'medical_selected_lab_tests',
    new Set(),
    undefined,
    undefined,
    true // Enable session backup for tab persistence
  );
  
  // Use persistent state for selected lab panel to maintain user's last selection
  const { 
    value: selectedPanel, 
    setValue: setSelectedPanel 
  } = usePersistedState<string>(
    'medical_selected_lab_panel',
    'bmp',
    undefined,
    undefined,
    true // Enable session backup for tab persistence
  );
  
  const [activeTab, setActiveTab] = useState("note-type");
  
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Debounced handler to prevent rapid-fire updates
  const debouncedSetPendingChanges = useDebounceCallback((labs: ProcessedLabValue[]) => {
    const safeCopy = labs.map(lab => ({ ...lab }));
    setPendingLabChanges(safeCopy);
    setHasPendingLabChanges(safeCopy.length > 0);
    console.debug('Deferred lab change applied (debounced):', safeCopy.length, 'labs in pending state');
  }, 100); // 100ms debounce

  // Handle deferred lab changes (updates pending changes without updating the note)
  const handleDeferredLabChange = useCallback((updatedLabs: ProcessedLabValue[]) => {
    if (!Array.isArray(updatedLabs)) {
      console.error('Invalid labs provided to handleDeferredLabChange:', updatedLabs);
      return;
    }
    
    // Use debounced update to prevent race conditions
    debouncedSetPendingChanges(updatedLabs);
  }, [debouncedSetPendingChanges]);

  // Ref to access pending labs inside LabValuesDisplay without re-rendering
  const labRef = useRef<LabValuesDisplayHandle>(null);
  // Helper toggled on the first local edit so we can show the floating chips
  const markPendingLabChanges = useCallback(() => {
    if (!hasPendingLabChanges) {
      const labs = labRef.current?.getPendingLabs() ?? [];
      setPendingLabChanges([...labs]);
      setHasPendingLabChanges(true);
    }
  }, [hasPendingLabChanges]);

  // Confirm all pending lab changes and update the live note
  const handleConfirmLabChanges = useCallback(() => {
    if (!hasPendingLabChanges) return;
    const newLabs = labRef.current?.getPendingLabs() ?? processedLabValues;
    preserveBeforeUpdate();
    setProcessedLabValues([...newLabs]);
    setPendingLabChanges([...newLabs]);
    setHasPendingLabChanges(false);
    console.debug('Lab changes confirmed:', newLabs.length, 'labs applied to live note');
  }, [hasPendingLabChanges, preserveBeforeUpdate, processedLabValues]);

  // Discard pending changes and revert to current state
  const handleDiscardLabChanges = useCallback(() => {
    if (!hasPendingLabChanges) return;
    labRef.current?.reset();
    setPendingLabChanges([...processedLabValues]);
    setHasPendingLabChanges(false);
    console.debug('Pending lab changes discarded, reverted to live note state');
  }, [hasPendingLabChanges, processedLabValues]);

  // Cleanup effect for component unmount - prevent memory leaks
  useEffect(() => {
    return () => {
      // Clear any pending timeouts, intervals, or async operations
      console.debug('ReviewOfSystems component unmounting, cleaning up lab states');
      // Note: State cleanup happens automatically, but we log for debugging
    };
  }, []);

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

  // Define sectionIcons inside the component
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

  // Define SectionWrapper inside the component
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

  // Define clearAllPmhEntries inside the component
  const clearAllPmhEntries = () => {
    setPmhText('');
  };

  // Define pmhControls inside the component
  const pmhControls = (
    <button
      onClick={clearAllPmhEntries}
      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors"
    >
      {language === 'fr' ? 'Effacer' : 'Clear'}
    </button>
  );

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
      
      // Validate that data is an array before calling .map()
      if (!Array.isArray(data)) {
        console.error('Template API response is not an array:', data);
        setAvailableTemplates([]);
        return;
      }
      
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
    
    // Process the new lab values - these are manually selected so they should show in note
    const processed = processLabValues(newLabValues, labSettings).map(lab => ({
      ...lab,
      showInNote: true, // Manually added labs should always show in note
      showTrending: lab.trending && lab.trending.length > 0, // Enable trending if data available
      trendCount: lab.trending && lab.trending.length > 0 ? Math.min(2, lab.trending.length) : 0
    }));
    
    setPendingLabChanges(prev => {
      const combined = [...prev, ...processed];
      console.debug('Manual lab values added to pending:', processed.length, 'new labs,', combined.length, 'total pending');
      return combined;
    });
    setHasPendingLabChanges(true);
    
    // Keep the old labValues update for legacy compatibility
    setLabValues(prev => [...prev, ...newLabValues]);
  }, [labSettings]);

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
      const processed = processLabValues(labValues, labSettings);
      setProcessedLabValuesWithScrollPreservation(processed);
    } else {
      setProcessedLabValuesWithScrollPreservation([]);
    }
  }, [labValues, setProcessedLabValuesWithScrollPreservation]);

  // Initialize pending changes whenever processedLabValues changes (but not when confirming)
  useEffect(() => {
    if (!hasPendingLabChanges && Array.isArray(processedLabValues)) {
      try {
        // Deep copy with validation
        const validLabs = processedLabValues.filter(lab => 
          lab && typeof lab === 'object' && lab.testName && lab.category
        );
        const safeCopy = validLabs.map(lab => ({ ...lab }));
        setPendingLabChanges(safeCopy);
        console.debug('Pending changes synced with processed labs:', safeCopy.length, 'valid labs');
      } catch (error) {
        console.error('Error syncing pending changes:', error);
        setPendingLabChanges([]);
      }
    }
  }, [processedLabValues, hasPendingLabChanges]);

  const handleCompleteReset = useCallback(() => {
    setNoteTypeState('');
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
    // Reset lab states with proper cleanup
    try {
      setLabValues([]);
      setProcessedLabValuesWithScrollPreservation([]);
      setPendingLabChanges([]);
      setHasPendingLabChanges(false);
      setSelectedLabTests(new Set());
      console.debug('Lab states reset successfully');
    } catch (error) {
      console.error('Error during lab states reset:', error);
      // Force reset to empty states
      setLabValues([]);
      setProcessedLabValues([]);
      setPendingLabChanges([]);
      setHasPendingLabChanges(false);
      setSelectedLabTests(new Set());
    }
    
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
    if (!Array.isArray(newLabValues)) {
      console.warn('Invalid lab values extracted:', newLabValues);
      return;
    }
    
    preserveBeforeUpdate();
    
    // Process the new lab values and add to pending changes (deferred)
    if (newLabValues.length > 0) {
      const processed = processLabValues(newLabValues, labSettings);
      
      // Add to pending changes without affecting the live note
      setPendingLabChanges(prev => {
        const combined = [...prev, ...processed];
        console.debug('Lab values extracted and added to pending:', processed.length, 'new labs,', combined.length, 'total pending');
        return combined;
      });
      setHasPendingLabChanges(true);
    }
    
    // Keep the old labValues update for legacy compatibility
    setLabValues(newLabValues);
  }, [preserveBeforeUpdate]);

  useEffect(() => {
    if (labValues && labValues.length > 0) {
      const processed = processLabValues(labValues, labSettings);
      setProcessedLabValuesWithScrollPreservation(processed);
    } else {
      setProcessedLabValuesWithScrollPreservation([]);
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
        
        case 'home-meds': {
          if (language === 'fr') {
            if (medications.homeMedications.length > 0) {
              const organizedHomeMeds = formatMedicationsForNote(medications.homeMedications, 'fr');
              return `MÉDICAMENTS À DOMICILE :\n${organizedHomeMeds}`;
            } else {
              return `MÉDICAMENTS À DOMICILE :\n[Aucun médicament à domicile]`;
            }
          } else {
            if (medications.homeMedications.length > 0) {
              const organizedHomeMeds = formatMedicationsForNote(medications.homeMedications, 'en');
              return `HOME MEDICATIONS:\n${organizedHomeMeds}`;
            } else {
              return `HOME MEDICATIONS:\n[No home medications]`;
            }
          }
        }
        
        case 'hospital-meds': {
          if (language === 'fr') {
            if (medications.hospitalMedications.length > 0) {
              const organizedHospitalMeds = formatMedicationsForNote(medications.hospitalMedications, 'fr');
              return `MÉDICAMENTS HOSPITALIERS :\n${organizedHospitalMeds}`;
            } else {
              return `MÉDICAMENTS HOSPITALIERS :\n[Aucun médicament hospitalier]`;
            }
          } else {
            if (medications.hospitalMedications.length > 0) {
              const organizedHospitalMeds = formatMedicationsForNote(medications.hospitalMedications, 'en');
              return `HOSPITAL MEDICATIONS:\n${organizedHospitalMeds}`;
            } else {
              return `HOSPITAL MEDICATIONS:\n[No hospital medications]`;
            }
          }
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
          
          const labText = formatLabValuesForNote(processedLabValues, labSettings);
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
    
    const labText = formatLabValuesForNote(processedLabValues, labSettings);
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
          sections.push(`MOTIF D'ADMISSION :\n${chiefComplaint.customComplaint || '[Entrer le motif d\'admission]'}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`CHIEF COMPLAINT:\n${chiefComplaint.customComplaint || '[Enter chief complaint]'}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      } else {
        if (language === 'fr') {
          sections.push(`MOTIF D'ADMISSION :\n${chiefComplaint.customComplaint || '[Entrer le motif d\'admission]'}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`CHIEF COMPLAINT:\n${chiefComplaint.customComplaint || '[Enter chief complaint]'}\n\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      }
    } else if (noteType === "progress") {
      if (isICU) {
        if (language === 'fr') {
          sections.push(`NOTE D'ÉVOLUTION :\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`PROGRESS NOTE:\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateIntubationText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      } else {
        if (language === 'fr') {
          sections.push(`NOTE D'ÉVOLUTION :\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        } else {
          sections.push(`PROGRESS NOTE:\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
        }
      }
    } else if (noteType === "consultation") {
      if (language === 'fr') {
        sections.push(`NOTE DE CONSULTATION :\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
      } else {
        sections.push(`CONSULTATION NOTE:\n${generatePMHText()}\n\n${generateAllergiesText()}\n\n${generateSocialHistoryText()}\n\n${generateMedicationsText()}\n\n${generateHPIText()}\n\n${generatePhysicalExamText()}\n\n${generateLabValuesText()}\n\n${generateImageryText()}\n\n${generateImpressionText()}`);
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

  // On blur, commit the live typing text to the main state to trigger a note update.
  const handlePMHBlur = useCallback((updatedText?: string) => {
    if (updatedText !== undefined) {
      setPmhText(updatedText);
    } else {
      setPmhText(typingPmhText);
    }
  }, [typingPmhText, setPmhText]);
  
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
  if ((noteType as string) === "custom") {
    return (
      <SectionWrapper title={language === 'fr' ? 'Note Personnalisée' : 'Custom Note'} sectionKey="note-type">
        <div className="flex flex-col h-full flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Edit3 className="w-6 h-6 text-orange-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                {language === 'fr' ? 'Note Personnalisée' : 'Custom Note'}
              </h1>
            </div>
            <Button
              onClick={() => setNoteTypeState('')}
              variant="outline"
              size="sm"
            >
              {language === 'fr' ? 'Retour' : 'Back'}
            </Button>
          </div>
          <div className="flex-1 flex flex-col rounded-lg border border-gray-200 shadow-sm">
            <DotPhraseTextarea
              value={customNoteText}
              onChange={debouncedSetCustomNoteText}
              placeholder={language === 'fr' ? 'Commencez à taper votre note personnalisée...' : 'Start typing your custom note...'}
              rows={25}
              className="flex-1 w-full h-full resize-none border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-sm p-4 bg-gray-50"
            />
          </div>
        </div>
      </SectionWrapper>
    );
  }
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
                  onClick={() => setNoteTypeState("admission")}
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
                  onClick={() => setNoteTypeState("progress")}
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
                  onClick={() => setNoteTypeState("consultation")}
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
                  onClick={() => { setNoteTypeState("custom"); }}
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
              value={typingPmhText}
              onChange={setTypingPmhText}
              onBlur={handlePMHBlur}
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
              {/* Text Paste - Primary lab entry method */}
              <div className="medical-card">
                <div className="medical-card-header">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span className="medical-section-title">{language === 'fr' ? 'Collage de texte de laboratoire' : 'Laboratory Text Paste'}</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {language === 'fr' ? 'Principal' : 'Primary'}
                      </Badge>
                    </div>
                    {memoizedLabSettingsPopover}
                  </div>
                </div>
                <div className="medical-card-content">
                  <LabTextPaste onLabValuesExtracted={handleLabValuesExtracted} />
                </div>
              </div>

              {/* Quick Lab Entry - Secondary method */}
              <div className="medical-card">
                <div className="medical-card-header">
                  <div className="flex items-center space-x-2">
                    <TestTube className="w-5 h-5" />
                    <span className="medical-section-title">{language === 'fr' ? 'Entrée rapide de laboratoire' : 'Quick Lab Entry'}</span>
                  </div>
                </div>
                <div className="medical-card-content">
                  <EnhancedLabEntry 
                    onLabAdd={handleManualLabAdd}
                    selectedLabs={Array.from(selectedLabTests)}
                    selectedPanel={selectedPanel}
                    setSelectedPanel={setSelectedPanel}
                    pendingLabEntries={{}}
                    setPendingLabEntries={() => {}}
                  />
                </div>
              </div>

              {/* Lab Values Display with Deferred Updates */}
              {((Array.isArray(processedLabValues) && processedLabValues.length > 0) || 
                (Array.isArray(pendingLabChanges) && pendingLabChanges.length > 0)) && (
                <div className="medical-card relative">
                  <div className="medical-card-header">
                    <div className="flex items-center space-x-2">
                      <TestTube className="w-5 h-5" />
                      <span className="medical-section-title">{language === 'fr' ? 'Valeurs de laboratoire' : 'Laboratory Values'}</span>
                      <span className="medical-badge">{hasPendingLabChanges ? pendingLabChanges.length : processedLabValues.length}</span>
                      {hasPendingLabChanges && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          {language === 'fr' ? 'Modifications en attente' : 'Pending Changes'}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="medical-card-content pb-16">
                    <LabValuesDisplay
                      ref={labRef}
                      processedLabs={processedLabValues}
                      onFirstChange={markPendingLabChanges}
                    />
                  </div>
                  
                  {/* Floating Action Chips */}
                  {hasPendingLabChanges && (
                    <div className="sticky bottom-0 flex justify-end gap-2 pr-4 pb-4">
                      <Button 
                        onClick={handleDiscardLabChanges}
                        variant="outline"
                        className="bg-white hover:bg-gray-50 text-gray-700 border-gray-300 px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {language === 'fr' ? 'Annuler' : 'Discard'}
                      </Button>
                      <Button 
                        onClick={handleConfirmLabChanges}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        {language === 'fr' ? 'Confirmer les modifications' : 'Confirm Changes'}
                      </Button>
                    </div>
                  )}
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
              onChange={debouncedSetImpressionText} // Use debounced callback to prevent focus loss
              onBlur={() => {}} // Handle immediate save on blur through SmartTextEntry
              defaultContent={getSectionDefaultContent("impression")}
            />
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
      
      // HPI must follow immediately after the hospital medications section
      if (chiefComplaint || hpiText) {
        const hpiContent = [
          chiefComplaint?.customComplaint?.trim() || '',
          hpiText?.trim() || ''
        ].filter(Boolean).join('\n');
        if (hpiContent) {
          noteData['hpi'] = hpiContent;
        }
      }
      
      const currentAllergies = allergiesRef.current;
      if (currentAllergies && currentAllergies.hasAllergies && Array.isArray(currentAllergies.allergiesList) && currentAllergies.allergiesList.length > 0) {
        noteData['allergies-social'] = `Allergies: ${currentAllergies.allergiesList.join(', ')}`;
      }
      
      if (selectedPeSystems && selectedPeSystems.size > 0) {
        const peEntries = Array.from(selectedPeSystems).map(system => {
          const findings = physicalExamOptions[system as keyof typeof physicalExamOptions] || 'Normal';
          return `${system}: ${findings}`;
        });
        noteData['physical-exam'] = peEntries.join("\n");
      }
      
      if (processedLabValues && Array.isArray(processedLabValues) && processedLabValues.length > 0) {
        noteData['labs'] = formatLabValuesForNote(processedLabValues, labSettings);
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
        // Add the most recent value with current timestamp
        const currentTime = new Date();
        newLabs.push({
          testName,
          value: mainValue,
          unit: '',
          category: '',
          timestamp: currentTime.toISOString(),
          referenceRange: '',
        });
        
        // Add trending values with progressively older timestamps
        trended.forEach((val, index) => {
          // Create timestamps that are progressively older (1 day, 2 days, etc.)
          const olderDate = new Date(currentTime);
          olderDate.setDate(currentTime.getDate() - (index + 1));
          
          newLabs.push({
            testName,
            value: val,
            unit: '',
            category: '',
            timestamp: olderDate.toISOString(),
            referenceRange: '',
          });
        });
      }
    });
    if (newLabs && Array.isArray(newLabs) && newLabs.length > 0) {
      try {
        const processedLabs = newLabs
          .filter(lab => {
            // Filter out invalid lab entries
            if (!lab || typeof lab !== 'object') {
              console.warn('Invalid lab object:', lab);
              return false;
            }
            
            if (!lab.testName || typeof lab.testName !== 'string' || lab.testName.trim().length === 0) {
              console.warn('Invalid lab test name:', lab.testName);
              return false;
            }
            
            return true;
          })
          .map(lab => {
            try {
              // Safely determine the lab category for visibility check
              let labCategory = 'General'; // Default fallback
              
              if (lab.category && typeof lab.category === 'string' && lab.category.trim().length > 0) {
                labCategory = lab.category.trim();
              } else if (lab.testName && typeof lab.testName === 'string') {
                try {
                  const categorizedResult = categorizeLabTest(lab.testName);
                  labCategory = categorizedResult || 'General';
                } catch (categorizationError) {
                  console.warn('Error categorizing lab test:', lab.testName, categorizationError);
                  labCategory = 'General';
                }
              }
              
              // Check if this lab should be included in the note based on user default selections
              // ALL labs will be visible in the display, but some may be "crossed out"
              let shouldShowInNote = true; // Default to showing
              
              if (labSettings && typeof labSettings === 'object') {
                try {
                  const panelDefaultSelections = getPanelDefaultSelections(labSettings, labCategory);
                  if (Array.isArray(panelDefaultSelections) && panelDefaultSelections.length > 0) {
                    // If user has configured default selections for this panel,
                    // only show labs that are in their selection list
                    shouldShowInNote = panelDefaultSelections.some(selectedName => 
                      selectedName && typeof selectedName === 'string' &&
                      lab.testName && typeof lab.testName === 'string' &&
                      selectedName.toLowerCase().trim() === lab.testName.toLowerCase().trim()
                    );
                  }
                  // If no default selections configured (length === 0), show all labs
                } catch (settingsError) {
                  console.warn('Error checking lab visibility settings:', settingsError);
                  shouldShowInNote = true; // Default to showing if settings check fails
                }
              }
              
              return {
                testName: lab.testName ? lab.testName.toString().trim() : 'Unknown Test',
                category: labCategory,
                mostRecent: lab,
                trending: [],
                allTrendingValues: [], // No historical data in this context
                showTrending: shouldShowInNote, // Enable trending based on user settings
                trendCount: shouldShowInNote ? 2 : 0, // Default to 2 trending values if showing in note
                maxTrendCount: 0, // No historical data available
                showInNote: shouldShowInNote
              };
            } catch (labProcessingError) {
              console.error('Error processing individual lab:', lab, labProcessingError);
              // Return a safe fallback lab object
              return {
                testName: lab.testName ? lab.testName.toString().trim() : 'Unknown Test',
                category: 'General',
                mostRecent: lab,
                trending: [],
                allTrendingValues: [], // No historical data in this context
                showTrending: false,
                trendCount: 0,
                maxTrendCount: 0, // No historical data available
                showInNote: true
              };
            }
          });
          
        if (processedLabs.length > 0) {
          setProcessedLabValuesWithScrollPreservation(processedLabs);
        } else {
          console.warn('No valid labs to process after filtering');
        }
      } catch (overallError) {
        console.error('Error processing lab array:', overallError);
        // Don't crash the app - continue with empty lab list
      }
    }
  }, [note, setProcessedLabValuesWithScrollPreservation, labSettings]);

  const renderLivePreview = () => {
    const safeNoteData = {
      'note-type': noteType || '',
      'pmh': pmhText || '',
      'meds': medications ? formatMedicationsForNote([...medications.homeMedications, ...medications.hospitalMedications]) : '',
      'hpi': hpiText || '',
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
      'physical-exam': selectedPeSystems && selectedPeSystems.size > 0 ? Array.from(selectedPeSystems).map(system => `${system}: ${physicalExamOptions[system as keyof typeof physicalExamOptions] || 'Normal'}`).join('\n') : '',
      'labs': processedLabValues && processedLabValues.length > 0 ? formatLabValuesForNote(processedLabValues, labSettings) : '',
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

  useEffect(() => {
    if (!hasPendingLabChanges) {
      try { localStorage.removeItem('draft_labs'); } catch {}
    }
  }, [hasPendingLabChanges]);

  useEffect(() => {
    if (!hasPendingLabChanges) {
      try { localStorage.removeItem('draft_labs'); } catch {}
    }
  }, [hasPendingLabChanges, preserveBeforeUpdate, processedLabValues]);

  useEffect(() => {
    if (!hasPendingLabChanges) {
      try { localStorage.removeItem('draft_labs'); } catch {}
    }
  }, [hasPendingLabChanges, processedLabValues]);

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
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                {renderMainContent() || (
                  <div className="text-center text-gray-400 py-12 whitespace-normal text-wrap">
                    Please select a section from the sidebar to begin.
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block w-px bg-gray-200 h-full mx-0" />
      </div>
    </MainLayout>
  );
}

export default ReviewOfSystems;