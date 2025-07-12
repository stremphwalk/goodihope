import { widgetRegistry } from './widgetRegistry'
import { MedicationWidget } from '../components/widgets/MedicationWidget'
import { AllergiesWidget } from '../components/widgets/AllergiesWidget'
import { PMHWidget } from '../components/widgets/PMHWidget'
import { MedicationData, AllergyData, PMHData } from '../types/widgets'

// Register Medication Widget
widgetRegistry.register('medication', {
  component: MedicationWidget,
  config: {
    label: 'Medications',
    description: 'Interactive medication management',
    defaultData: {
      homeMedications: [],
      hospitalMedications: []
    } as MedicationData,
    version: '1.0.0',
    category: 'clinical',
    tags: ['medication', 'pharmacy', 'treatment']
  },
  generateText: (data: MedicationData) => {
    const sections: string[] = []
    
    if (data.homeMedications && data.homeMedications.length > 0) {
      sections.push('Home Medications:')
      data.homeMedications.forEach(med => {
        let line = `- ${med.name}`
        if (med.dosage) line += ` ${med.dosage}`
        if (med.frequency) line += ` (${med.frequency})`
        sections.push(line)
      })
    }
    
    if (data.hospitalMedications && data.hospitalMedications.length > 0) {
      if (sections.length > 0) sections.push('')
      sections.push('Hospital Medications:')
      data.hospitalMedications.forEach(med => {
        let line = `- ${med.name}`
        if (med.dosage) line += ` ${med.dosage}`
        if (med.frequency) line += ` (${med.frequency})`
        sections.push(line)
      })
    }
    
    return sections.length > 0 ? sections.join('\n') : 'No medications recorded'
  },
  validateData: (data: any): boolean => {
    return (
      typeof data === 'object' &&
      Array.isArray(data.homeMedications) &&
      Array.isArray(data.hospitalMedications)
    )
  }
})

// Register Allergies Widget
widgetRegistry.register('allergies', {
  component: AllergiesWidget,
  config: {
    label: 'Allergies',
    description: 'Patient allergy management',
    defaultData: {
      allergies: [],
      nkda: false
    } as AllergyData,
    version: '1.0.0',
    category: 'clinical',
    tags: ['allergy', 'safety', 'reactions']
  },
  generateText: (data: AllergyData) => {
    if (data.nkda) {
      return 'Allergies: No known drug allergies (NKDA)'
    }
    
    if (data.allergies && data.allergies.length > 0) {
      const allergyStrings = data.allergies.map(allergy => {
        let text = allergy.name
        if (allergy.reaction) text += ` - ${allergy.reaction}`
        if (allergy.severity && allergy.severity !== 'Unknown') text += ` (${allergy.severity})`
        return text
      })
      return `Allergies:\n${allergyStrings.map(a => `- ${a}`).join('\n')}`
    }
    
    return 'Allergies: None recorded'
  },
  validateData: (data: any): boolean => {
    return (
      typeof data === 'object' &&
      Array.isArray(data.allergies) &&
      typeof data.nkda === 'boolean'
    )
  }
})

// Register PMH Widget
widgetRegistry.register('pmh', {
  component: PMHWidget,
  config: {
    label: 'Past Medical History',
    description: 'Patient medical history management',
    defaultData: {
      entries: []
    } as PMHData,
    version: '1.0.0',
    category: 'clinical',
    tags: ['history', 'medical', 'background']
  },
  generateText: (data: PMHData) => {
    if (data.entries && data.entries.length > 0) {
      const entryStrings = data.entries.map(entry => {
        let text = entry.condition
        if (entry.year) text += ` (${entry.year})`
        if (entry.resolved) text += ' - Resolved'
        if (entry.notes) text += ` - ${entry.notes}`
        return text
      })
      return `Past Medical History:\n${entryStrings.map(e => `- ${e}`).join('\n')}`
    }
    
    return 'Past Medical History: None significant'
  },
  validateData: (data: any): boolean => {
    return (
      typeof data === 'object' &&
      Array.isArray(data.entries)
    )
  }
})

// Initialize widgets on import
export function initializeWidgets() {
  console.log('Widgets initialized:', widgetRegistry.getStats())
}

// Auto-initialize when module is imported
initializeWidgets()