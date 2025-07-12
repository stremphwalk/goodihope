import { MedicationWidget } from './MedicationWidget';
import { widgetRegistry } from '@/lib/widgetRegistry';
import { formatMedicationsForNote, type MedicationData } from '@/lib/medicationUtils';
import { Pill } from 'lucide-react';

// Register the medication widget
widgetRegistry.register('medication', {
  component: MedicationWidget as any,
  config: {
    label: 'Medications',
    icon: <Pill className="h-4 w-4" />,
    description: 'Interactive medication management with home and hospital medications',
    defaultData: {
      homeMedications: [],
      hospitalMedications: []
    }
  },
  generateText: (data: Record<string, any>) => {
    const medData = data as MedicationData;
    let output = '';
    
    if (medData.homeMedications && medData.homeMedications.length > 0) {
      output += 'Home Medications:\n';
      medData.homeMedications.forEach((med, index) => {
        const dosage = med.dosage ? ` ${med.dosage}` : '';
        const frequency = med.frequency ? ` ${med.frequency}` : '';
        const discontinued = med.isDiscontinued ? ' (D/C)' : '';
        output += `${index + 1}. ${med.name}${dosage}${frequency}${discontinued}\n`;
      });
      output += '\n';
    }
    
    if (medData.hospitalMedications && medData.hospitalMedications.length > 0) {
      output += 'Hospital Medications:\n';
      medData.hospitalMedications.forEach((med, index) => {
        const dosage = med.dosage ? ` ${med.dosage}` : '';
        const frequency = med.frequency ? ` ${med.frequency}` : '';
        const discontinued = med.isDiscontinued ? ' (D/C)' : '';
        output += `${index + 1}. ${med.name}${dosage}${frequency}${discontinued}\n`;
      });
    }
    
    return output.trim() || 'No medications documented';
  },
  validateData: (data: Record<string, any>) => {
    return data && 
           Array.isArray(data.homeMedications) && 
           Array.isArray(data.hospitalMedications);
  }
});