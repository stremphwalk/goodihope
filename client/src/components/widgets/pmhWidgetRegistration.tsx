import { PMHWidget } from './PMHWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { History } from 'lucide-react';

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
      // Apply proper formatting to handle tab functionality and blank lines
      const lines = pmhData.formattedText.split('\n');
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