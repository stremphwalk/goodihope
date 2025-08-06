import { widgetRegistry } from '@/lib/widgetRegistry';
import { PrednisoneWeanWidget, generatePrednisoneWeanText } from './PrednisoneWeanWidget';
import { WidgetComponent } from '@/types/widgets';

const prednisoneWeanWidget: WidgetComponent = {
  Component: PrednisoneWeanWidget,
  generateText: (data, config) => {
    const language = config?.language || 'en';
    return generatePrednisoneWeanText(data, language);
  },
  validateData: (data) => {
    if (!data.startingDose || data.startingDose <= 0) return false;
    if (data.targetDose < 0) return false;
    if (data.startingDose <= data.targetDose) return false;
    return true;
  },
  config: {
    name: 'Prednisone Weaning Protocol',
    description: 'Generate a customizable prednisone tapering schedule',
    icon: 'TrendingDown',
    category: 'medications',
    defaultData: {
      startingDose: 60,
      targetDose: 0,
      steps: [],
      useCustomSteps: false
    },
    version: '1.0.0'
  }
};

// Register the widget
widgetRegistry.register('prednisone-wean', prednisoneWeanWidget);