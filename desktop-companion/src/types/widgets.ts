import { ReactNode } from 'react'

export interface WidgetInstance {
  id: string
  type: string
  data: Record<string, any>
  config: Record<string, any>
  onDataChange: (data: Record<string, any>) => void
  mode?: 'interactive' | 'text'
  isReadOnly?: boolean
}

export interface WidgetConfig {
  label: string
  icon?: ReactNode
  description: string
  defaultData: Record<string, any>
  version?: string
  category?: string
  tags?: string[]
}

export interface WidgetComponent {
  component: React.ComponentType<WidgetInstance>
  config: WidgetConfig
  generateText: (data: Record<string, any>, config?: Record<string, any>) => string
  validateData?: (data: Record<string, any>) => boolean
  migrateData?: (data: Record<string, any>, fromVersion: string, toVersion: string) => Record<string, any>
}

export interface WidgetRegistryInterface {
  register(type: string, widget: WidgetComponent): void
  get(type: string): WidgetComponent | undefined
  list(): string[]
  createWidget(type: string, initialData?: Record<string, any>): WidgetInstance | null
  generateText(type: string, data: Record<string, any>, config?: Record<string, any>): string
  validateData(type: string, data: Record<string, any>): boolean
  parseWidgetSyntax(text: string): Array<{ type: string; id: string; fullMatch: string; startIndex: number; endIndex: number }>
}

// Medication-specific types
export interface Medication {
  id: string
  name: string
  dosage?: string
  frequency?: string
  route?: string
  instructions?: string
  startDate?: string
  endDate?: string
  prescriber?: string
  indication?: string
}

export interface MedicationData {
  homeMedications: Medication[]
  hospitalMedications: Medication[]
}

// Allergy-specific types
export interface Allergy {
  id: string
  name: string
  reaction?: string
  severity?: 'Mild' | 'Moderate' | 'Severe' | 'Unknown'
  type?: 'Drug' | 'Food' | 'Environmental' | 'Other'
  notes?: string
}

export interface AllergyData {
  allergies: Allergy[]
  nkda: boolean
}

// PMH-specific types
export interface PMHEntry {
  id: string
  condition: string
  year?: string
  notes?: string
  resolved?: boolean
}

export interface PMHData {
  entries: PMHEntry[]
}

// Impression-specific types
export interface ImpressionEntry {
  id: string
  diagnosis: string
  isPrimary?: boolean
  icd10?: string
  notes?: string
  certainty?: 'Confirmed' | 'Probable' | 'Possible' | 'Rule out'
}

export interface ImpressionData {
  entries: ImpressionEntry[]
}