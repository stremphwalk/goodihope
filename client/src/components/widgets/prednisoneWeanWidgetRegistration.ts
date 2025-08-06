import { widgetRegistry } from '@/lib/widgetRegistry';
import { PrednisoneWeanWidget, generatePrednisoneWeanText } from './PrednisoneWeanWidget';
import { WidgetComponent } from '@/types/widgets';

interface PrednisoneWeanData {
  startingDose: number;
  targetDose: number;
  steps: Array<{ dose: number; duration: number; unit: 'days' | 'weeks' }>;
  useCustomSteps: boolean;
}

const prednisoneWeanWidget: WidgetComponent = {
  component: PrednisoneWeanWidget as any,
  generateText: (data: Record<string, any>, config?: Record<string, any>) => {
    const language = config?.language || 'en';
    return generatePrednisoneWeanText(data as PrednisoneWeanData, language as 'en' | 'fr');
  },
  validateData: (data) => {
    if (!data.startingDose || data.startingDose <= 0) return false;
    if (data.targetDose < 0) return false;
    if (data.startingDose <= data.targetDose) return false;
    return true;
  },
  config: {
    label: 'Prednisone Weaning Protocol',
    description: 'Generate a customizable prednisone tapering schedule',
    icon: 'TrendingDown' as any,
    defaultData: {
      startingDose: 60,
      targetDose: 0,
      steps: [],
      useCustomSteps: false
    }
  }
};

// Register the widget
widgetRegistry.register('prednisone-wean', prednisoneWeanWidget);