// Import all widget registrations to register them with the widget registry
import './medicationWidgetRegistration';
import './allergiesWidgetRegistration';
import './pmhWidgetRegistration';
import './impressionWidgetRegistration';

// Export components for use elsewhere
export { MedicationWidget } from './MedicationWidget';
export { AllergiesWidget } from './AllergiesWidget';
export { PMHWidget } from './PMHWidget';
export { ImpressionWidget } from './ImpressionWidget';
export { WidgetWrapper } from '../WidgetWrapper';