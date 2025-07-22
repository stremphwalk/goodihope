import { ImpressionWidget } from './ImpressionWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { Target } from 'lucide-react';
import { formatStructuredMedicalText } from '@/lib/textFormatting';

interface ImpressionData {
  items: string[];
  formattedText: string;
}

// Register the impression widget
widgetRegistry.register('impression', {
  component: ImpressionWidget as any,
  config: {
    label: 'Clinical Impression',
    icon: <Target className="h-4 w-4" />,
    description: 'Structured clinical impression and assessment formatting',
    defaultData: {
      items: [],
      formattedText: ''
    }
  },
  generateText: (data: Record<string, any>) => {
    const impressionData = data as ImpressionData;
    if (impressionData.formattedText) {
      return formatStructuredMedicalText(impressionData.formattedText);
    }
    if (impressionData.items && impressionData.items.length > 0) {
      return impressionData.items.map((item, index) => `${index + 1}. ${item}`).join('\n');
    }
    return 'No clinical impression documented';
  },
  validateData: (data: Record<string, any>) => {
    return data && 
           Array.isArray(data.items) && 
           typeof data.formattedText === 'string';
  }
});