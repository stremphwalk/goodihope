import { PMHWidget } from './PMHWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { History } from 'lucide-react';
import { formatStructuredMedicalText } from '@/lib/textFormatting';

interface PMHData {
  items: string[];
  formattedText: string;
}

// Register the PMH widget
widgetRegistry.register('pmh', {
  component: PMHWidget as any,
  config: {
    label: 'Past Medical History',
    icon: <History className="h-4 w-4" />,
    description: 'Structured past medical history with formatting support',
    defaultData: {
      items: [],
      formattedText: ''
    }
  },
  generateText: (data: Record<string, any>) => {
    const pmhData = data as PMHData;
    if (pmhData.formattedText) {
      return formatStructuredMedicalText(pmhData.formattedText);
    }
    if (pmhData.items && pmhData.items.length > 0) {
      return pmhData.items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    }
    return 'No past medical history documented';
  },
  validateData: (data: Record<string, any>) => {
    return data && 
           Array.isArray(data.items) && 
           typeof data.formattedText === 'string';
  }
});