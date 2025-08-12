import { 
  FileText, 
  Stethoscope, 
  Pill, 
  Users, 
  ClipboardList, 
  HeartPulse, 
  TestTube, 
  Image, 
  Brain,
  Wind,
  AlertCircle,
  Calendar,
  Activity
} from 'lucide-react';

export interface SectionDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'patient-info' | 'history' | 'examination' | 'results' | 'assessment' | 'plan';
  component: string; // Component name to render
  defaultContent?: string | any; // Default content structure - preferably string for PMH/Impressions
  isRequired?: boolean;
  isExpandable?: boolean;
  hasSmartOptions?: boolean;
}

export const SECTION_LIBRARY: SectionDefinition[] = [
  // Patient Information
  {
    id: 'note-type',
    name: 'Note Type',
    description: 'Type of medical note (admission, progress, discharge, etc.)',
    icon: FileText,
    category: 'patient-info',
    component: 'NoteTypeSection',
    isRequired: true,
    hasSmartOptions: true
  },
  
  // History Sections
  {
    id: 'pmh',
    name: 'Past Medical History',
    description: 'Patient\'s medical history with expandable entries',
    icon: Stethoscope,
    category: 'history',
    component: 'PastMedicalHistorySection',
    isExpandable: true,
    hasSmartOptions: true,
    defaultContent: `Diabetes mellitus type 2
- Well controlled on metformin
- Last HbA1c 7.2%

Hypertension
- Well controlled  
- On lisinopril 10mg daily

Instructions: New line = auto-numbered, Tab = add sub-point`
  },
  
  {
    id: 'meds',
    name: 'Medications',
    description: 'Home and hospital medications with auto-complete',
    icon: Pill,
    category: 'history',
    component: 'MedicationSection',
    hasSmartOptions: true
  },
  
  {
    id: 'allergies-social',
    name: 'Allergies & Social History',
    description: 'Allergies, social history, and patient demographics',
    icon: Users,
    category: 'history',
    component: 'AllergiesSocialSection',
    hasSmartOptions: true
  },
  
  {
    id: 'hpi',
    name: 'History of Present Illness',
    description: 'Structured history of current problem',
    icon: ClipboardList,
    category: 'history',
    component: 'HpiSection',
    isRequired: true,
    hasSmartOptions: true
  },
  
  // Examination Sections
  {
    id: 'physical-exam',
    name: 'Physical Examination',
    description: 'Comprehensive physical examination by body system',
    icon: HeartPulse,
    category: 'examination',
    component: 'PhysicalExamSection',
    isExpandable: true,
    hasSmartOptions: true
  },
  
  {
    id: 'ventilation',
    name: 'Ventilation',
    description: 'Ventilator settings and respiratory parameters',
    icon: Wind,
    category: 'examination',
    component: 'VentilationSection',
    hasSmartOptions: true
  },
  
  // Results Sections
  {
    id: 'labs',
    name: 'Laboratory Results',
    description: 'Lab values with image upload capability',
    icon: TestTube,
    category: 'results',
    component: 'LabResultsSection',
    hasSmartOptions: true
  },
  
  {
    id: 'imagery',
    name: 'Imaging Studies',
    description: 'Radiology and other imaging results',
    icon: Image,
    category: 'results',
    component: 'ImagingSection',
    hasSmartOptions: true
  },
  
  // Assessment & Plan
  {
    id: 'impression',
    name: 'Impression/Assessment',
    description: 'Clinical impression and differential diagnosis',
    icon: Brain,
    category: 'assessment',
    component: 'ImpressionSection',
    isRequired: true,
    hasSmartOptions: true,
    defaultContent: `Diabetes mellitus type 2, poorly controlled
- Adjust medications
- Lifestyle counseling

Hypertension, uncontrolled
- Increase antihypertensive

Instructions: New line = auto-numbered, Tab = add sub-point`
  },
  
  {
    id: 'plan',
    name: 'Treatment Plan',
    description: 'Treatment plan and follow-up recommendations',
    icon: Activity,
    category: 'plan',
    component: 'PlanSection',
    isRequired: true,
    hasSmartOptions: true
  }
];

// Helper functions
export const getSectionById = (id: string): SectionDefinition | undefined => {
  return SECTION_LIBRARY.find(section => section.id === id);
};

export const getSectionsByCategory = (category: SectionDefinition['category']): SectionDefinition[] => {
  return SECTION_LIBRARY.filter(section => section.category === category);
};

export const getRequiredSections = (): SectionDefinition[] => {
  return SECTION_LIBRARY.filter(section => section.isRequired);
};

export const getExpandableSections = (): SectionDefinition[] => {
  return SECTION_LIBRARY.filter(section => section.isExpandable);
};

// Template content structure
export interface TemplateSection {
  id: string;
  sectionId: string;
  order: number;
  isEnabled: boolean;
  customContent?: any;
  smartOptions?: string[];
}

export interface TemplateContent {
  sections: TemplateSection[];
  metadata: {
    name: string;
    description?: string;
    category: string;
    specialty?: string;
    compatibleNoteTypes?: string[];
    compatibleSubtypes?: string[];
  };
}

// Default template content
export const createDefaultTemplateContent = (): TemplateContent => ({
  sections: [
    {
      id: 'note-type-1',
      sectionId: 'note-type',
      order: 1,
      isEnabled: true
    },
    {
      id: 'hpi-1',
      sectionId: 'hpi',
      order: 2,
      isEnabled: true
    },
    {
      id: 'impression-1',
      sectionId: 'impression',
      order: 3,
      isEnabled: true
    }
  ],
  metadata: {
    name: '',
    description: '',
    category: 'admission',
    specialty: '',
    compatibleNoteTypes: ['admission'],
    compatibleSubtypes: ['general']
  }
}); 