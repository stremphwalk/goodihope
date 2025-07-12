import { ImpressionWidget } from './ImpressionWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { Target } from 'lucide-react';

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
      // Apply proper formatting to handle tab functionality and blank lines
      const lines = impressionData.formattedText.split('\n');
      const formatted: string[] = [];
      let conditionCount = 0;

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('#')) {
          conditionCount++;
          const condition = line.replace('#', '').trim();
          if (conditionCount > 1) formatted.push("");
          formatted.push(`${conditionCount}. ${condition}`);
        } else if (line.startsWith('-')) {
          const detail = line.replace('-', '').trim();
          formatted.push(`     - ${detail}`);
        } else if (line.startsWith('--')) {
          const subDetail = line.replace('--', '').trim();
          formatted.push(`       - ${subDetail}`);
        } else if (/^\d+\./.test(line)) {
          const match = line.match(/^(\d+)\./);
          if (match) {
            const num = parseInt(match[1]);
            if (num > conditionCount) {
              conditionCount = num;
              if (conditionCount > 1) formatted.push("");
            }
          }
          formatted.push(line);
        } else if (line.match(/^\s+/)) {
          formatted.push(line);
        } else {
          conditionCount++;
          if (conditionCount > 1) formatted.push("");
          formatted.push(`${conditionCount}. ${line}`);
        }
      }
      
      return formatted.join('\n');
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