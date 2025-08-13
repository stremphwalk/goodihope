import { rosSymptomOptions } from '@/constants/rosSymptomOptions';

// Define the shape of a selected symptom
export interface SelectedSymptom {
  key: string;
  present: boolean;
  severity?: 'mild' | 'moderate' | 'severe';
  note?: string;
}

/**
 * Generate HPI narrative paragraph from structured symptom data
 */
export function generateHpiParagraph(
  selectedSymptoms: Record<string, Set<SelectedSymptom>>,
  language: 'en' | 'fr'
): string {
  const positiveSymptoms: { system: string; symptom: SelectedSymptom }[] = [];
  const negativeSymptoms: { system: string; symptom: SelectedSymptom }[] = [];

  // Collect positive and negative symptoms from all systems
  Object.entries(selectedSymptoms).forEach(([system, symSet]) => {
    symSet.forEach(sym => {
      if (sym.present) {
        positiveSymptoms.push({ system, symptom: sym });
      } else {
        negativeSymptoms.push({ system, symptom: sym });
      }
    });
  });

  // If no symptoms selected, return empty
  if (positiveSymptoms.length === 0 && negativeSymptoms.length === 0) {
    return language === 'fr' ? "[Entrer l'HMA]" : "[Enter HPI]";
  }

  const sentences: string[] = [];

  // Build positive symptom sentences
  if (positiveSymptoms.length > 0) {
    const positiveDescriptions: string[] = [];
    
    positiveSymptoms.forEach(({ system, symptom }) => {
      const systemObj = (rosSymptomOptions as any)[system];
      const symInfo = systemObj?.symptoms.find((s: any) => s.key === symptom.key);
      const symLabel = symInfo ? (language === 'fr' ? symInfo.fr : symInfo.en) : symptom.key;
      
      let description = symLabel;
      
      // Add severity if present
      if (symptom.severity) {
        const severityText = language === 'fr' 
          ? (symptom.severity === 'mild' ? 'léger' : symptom.severity === 'moderate' ? 'modéré' : 'sévère')
          : symptom.severity;
        description = language === 'fr' 
          ? `${symLabel} ${severityText}`
          : `${severityText} ${symLabel.toLowerCase()}`;
      }
      
      // Add note if present
      if (symptom.note) {
        description += ` (${symptom.note})`;
      }
      
      positiveDescriptions.push(description);
    });

    // Construct positive symptom sentence
    if (language === 'fr') {
      const prefix = "Le patient présente";
      sentences.push(`${prefix} ${positiveDescriptions.join(', ')}.`);
    } else {
      const prefix = "The patient reports";
      sentences.push(`${prefix} ${positiveDescriptions.join(', ')}.`);
    }
  }

  // Build negative symptom sentences (pertinent negatives)
  if (negativeSymptoms.length > 0) {
    const negativeDescriptions: string[] = [];
    
    negativeSymptoms.forEach(({ system, symptom }) => {
      const systemObj = (rosSymptomOptions as any)[system];
      const symInfo = systemObj?.symptoms.find((s: any) => s.key === symptom.key);
      const symLabel = symInfo ? (language === 'fr' ? symInfo.fr : symInfo.en) : symptom.key;
      
      negativeDescriptions.push(symLabel.toLowerCase());
    });

    // Construct negative symptom sentence
    if (language === 'fr') {
      sentences.push(`Nie ${negativeDescriptions.join(', ')}.`);
    } else {
      sentences.push(`Denies ${negativeDescriptions.join(', ')}.`);
    }
  }

  return sentences.join(' ');
}

/**
 * Generate ROS narrative paragraph from structured symptom data
 */
export function generateRosParagraph(
  selectedSymptoms: Record<string, Set<SelectedSymptom>>,
  language: 'en' | 'fr'
): string {
  const systemSentences: string[] = [];
  const documentedSystems = new Set<string>();
  
  // Process each system in rosSymptomOptions order
  Object.keys(rosSymptomOptions).forEach(systemKey => {
    const symSet = selectedSymptoms[systemKey];
    if (!symSet || symSet.size === 0) return;
    
    const positives: SelectedSymptom[] = [];
    const negatives: SelectedSymptom[] = [];
    
    symSet.forEach(sym => {
      if (sym.present) {
        positives.push(sym);
      } else {
        negatives.push(sym);
      }
    });
    
    // Skip if no symptoms marked for this system
    if (positives.length === 0 && negatives.length === 0) return;
    
    documentedSystems.add(systemKey);
    const systemObj = (rosSymptomOptions as any)[systemKey];
    
    // Build sentence for this system
    const parts: string[] = [];
    
    // Add positives first
    if (positives.length > 0) {
      const positiveLabels = positives.map(sym => {
        const symInfo = systemObj?.symptoms.find((s: any) => s.key === sym.key);
        const label = symInfo ? (language === 'fr' ? symInfo.fr : symInfo.en) : sym.key;
        return label.toLowerCase();
      });
      
      if (language === 'fr') {
        parts.push(`signale ${positiveLabels.join(', ')}`);
      } else {
        parts.push(`reports ${positiveLabels.join(', ')}`);
      }
    }
    
    // Add negatives
    if (negatives.length > 0) {
      const negativeLabels = negatives.map(sym => {
        const symInfo = systemObj?.symptoms.find((s: any) => s.key === sym.key);
        const label = symInfo ? (language === 'fr' ? symInfo.fr : symInfo.en) : sym.key;
        return label.toLowerCase();
      });
      
      if (language === 'fr') {
        const negPart = negativeLabels.map(l => `pas de ${l}`).join(', ');
        parts.push(negPart);
      } else {
        const negPart = negativeLabels.map(l => `no ${l}`).join(', ');
        parts.push(negPart);
      }
    }
    
    // Combine parts and capitalize first letter
    if (parts.length > 0) {
      let sentence = parts.join('; ');
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
      if (!sentence.endsWith('.')) sentence += '.';
      systemSentences.push(sentence);
    }
  });
  
  // Add summary for undocumented systems
  if (systemSentences.length > 0) {
    const allSystemsNegative = language === 'fr' 
      ? "Tous les autres systèmes révisés sont négatifs."
      : "All other systems reviewed and negative.";
    systemSentences.push(allSystemsNegative);
  }
  
  return systemSentences.join(' ');
}

/**
 * Helper function to get symptom label in the appropriate language
 */
export function getSymptomLabel(
  systemKey: string,
  symptomKey: string,
  language: 'en' | 'fr'
): string {
  const systemObj = (rosSymptomOptions as any)[systemKey];
  const symInfo = systemObj?.symptoms.find((s: any) => s.key === symptomKey);
  return symInfo ? (language === 'fr' ? symInfo.fr : symInfo.en) : symptomKey.replace(/_/g, ' ');
}

/**
 * Helper function to get system label in the appropriate language
 */
export function getSystemLabel(
  systemKey: string,
  language: 'en' | 'fr'
): string {
  const systemObj = (rosSymptomOptions as any)[systemKey];
  return systemObj ? (language === 'fr' ? systemObj.label.fr : systemObj.label.en) : systemKey;
}