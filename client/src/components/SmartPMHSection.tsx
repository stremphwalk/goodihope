import React, { useEffect, useRef } from 'react';
import { SmartTextEntry } from './SmartTextEntry';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartPMHSectionProps {
  value: string;
  onChange: (value: string) => void;
  defaultContent?: string | null; // Template default content
}

export function SmartPMHSection({ value, onChange, defaultContent }: SmartPMHSectionProps) {
  const { language } = useLanguage();
  const onChangeRef = useRef(onChange);
  
  // Keep onChange ref updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Populate default content when component mounts and no value exists
  useEffect(() => {
    // Guard against invalid inputs
    if (!defaultContent || typeof defaultContent !== 'string') {
      return;
    }

    // Only populate if value is empty or only whitespace
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return;
    }

    try {
      // Clean up the default content by removing instruction lines
      const cleanedContent = defaultContent
        .split('\n')
        .filter(line => {
          const lowerLine = line.toLowerCase().trim();
          // More specific filter for instruction lines
          return !lowerLine.startsWith('instructions:') && 
                 !lowerLine.startsWith('instruction:') &&
                 !lowerLine.includes('new line = auto-numbered') &&
                 !lowerLine.includes('tab = add sub-point');
        })
        .join('\n')
        .trim();

      // Only call onChange if we have meaningful content
      if (cleanedContent.length > 0) {
        onChangeRef.current(cleanedContent);
      }
    } catch (error) {
      console.error('Error processing default content in SmartPMHSection:', error);
    }
  }, [defaultContent, value]);

  const placeholder = language === 'fr' 
    ? `Diabète de type 2
- Bien contrôlé sous metformine
- Dernière HbA1c 7.2%

Hypertension artérielle  
- Bien contrôlée
- Sous lisinopril 10mg par jour

Tapez: dm, htn, cad pour des modèles
Tab à la fin: ajouter sous-point
Tab au début: convertir en sous-point`
    : `Diabetes mellitus type 2
- Well controlled on metformin
- Last HbA1c 7.2%

Hypertension
- Well controlled  
- On lisinopril 10mg daily

Type: dm, htn, cad for templates
Tab at end: add sub-point
Tab at start: convert to sub-point`;

  return (
    <SmartTextEntry
      title={language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}