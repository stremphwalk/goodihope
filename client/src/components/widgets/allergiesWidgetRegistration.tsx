import { AllergiesWidget } from './AllergiesWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { AlertCircle } from 'lucide-react';

interface AllergiesData {
  hasAllergies: boolean;
  allergiesList: string[];
}

// Register the allergies widget
widgetRegistry.register('allergies', {
  component: AllergiesWidget as any,
  config: {
    label: 'Allergies',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Patient allergy management with common and custom allergies',
    defaultData: {
      hasAllergies: false,
      allergiesList: []
    }
  },
  generateText: (data: Record<string, any>) => {
    const allergiesData = data as AllergiesData;
    if (allergiesData.hasAllergies && allergiesData.allergiesList.length > 0) {
      return `Allergies: ${allergiesData.allergiesList.join(', ')}`;
    }
    return 'No Known Allergies (NKA)';
  },
  validateData: (data: Record<string, any>) => {
    return data && 
           typeof data.hasAllergies === 'boolean' && 
           Array.isArray(data.allergiesList) &&
           data.allergiesList.every(allergy => typeof allergy === 'string' && allergy.trim() !== '');
  }
});