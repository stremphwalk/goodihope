// Import all widget registrations to register them with the widget registry
import './medicationWidgetRegistration';
import './allergiesWidgetRegistration';
import './pmhWidgetRegistration';
import './impressionWidgetRegistration';
import './prednisoneWeanWidgetRegistration';

// Export components for use elsewhere
export { MedicationWidget } from './MedicationWidget';
export { AllergiesWidget } from './AllergiesWidget';
export { PMHWidget } from './PMHWidget';
export { ImpressionWidget } from './ImpressionWidget';
export { PrednisoneWeanWidget } from './PrednisoneWeanWidget';
export { WidgetWrapper } from '../WidgetWrapper';