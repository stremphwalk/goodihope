import React from 'react';
import { SmartTextEntry } from './SmartTextEntry';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartImpressionSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function SmartImpressionSection({ value, onChange }: SmartImpressionSectionProps) {
  const { language } = useLanguage();

  const placeholder = language === 'fr' 
    ? `Diabète de type 2 mal contrôlé
- Ajuster les médicaments
- Counseling sur le mode de vie

Hypertension non contrôlée
- Augmenter les antihypertenseurs

Tapez: dm, htn, uti pour des modèles
Tab à la fin: ajouter sous-point
Tab au début: convertir en sous-point`
    : `Diabetes mellitus type 2, poorly controlled
- Adjust medications
- Lifestyle counseling

Hypertension, uncontrolled
- Increase antihypertensive

Type: dm, htn, uti for templates
Tab at end: add sub-point
Tab at start: convert to sub-point`;

  return (
    <SmartTextEntry
      title={language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    />
  );
}