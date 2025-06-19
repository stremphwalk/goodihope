export type UnitSystem = 'US' | 'SI';

export interface CalculationInput {
  id: string;
  label: string;
  type: 'number' | 'select' | 'boolean';
  unit?: string;
  options?: string[];
  min?: number;
  max?: number;
  required?: boolean;
}

export interface Calculation {
  id: string;
  name: string;
  category: string;
  specialty: string;
  description: string;
  inputs: CalculationInput[];
  formula: (inputs: Record<string, any>) => number | Record<string, any>;
  interpretation?: (result: any) => string;
  references?: string[];
  unit: string;
}

export interface CalculationResult {
  name: string;
  value: number;
  unit: string;
}

export interface CalculationCategory {
  id: string;
  name: string;
  icon: string;
  specialty: string;
}

export interface UserPreferences {
  unitSystem: UnitSystem;
  favorites: string[];
  recentCalculations: string[];
} 