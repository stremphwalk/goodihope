import React from 'react';
import { SmartTextEntry } from './SmartTextEntry';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartPMHSectionProps {
  value: string;
  onChange: (value: string) => void;
}

export function SmartPMHSection({ value, onChange }: SmartPMHSectionProps) {
  const { language } = useLanguage();

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