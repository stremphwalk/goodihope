import React, { useState } from 'react';
import { SmartTextEntry } from './SmartTextEntry';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COMMON_PMH_CONDITIONS = [
  'Hypertension',
  'Diabetes mellitus type 2',
  'Coronary artery disease',
  'Chronic kidney disease',
  'Heart failure',
  'Asthma',
  'COPD',
  'Hyperlipidemia',
  'Atrial fibrillation',
  'Stroke/TIA',
];

interface SmartPMHSectionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: (value?: string) => void;
  defaultContent?: string | null; // Template default content
}

export function SmartPMHSection({ value, onChange, onBlur, defaultContent }: SmartPMHSectionProps) {
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

  const [search, setSearch] = useState('');

  const handleInsert = (text: string) => {
    const ta = document.querySelector('textarea[data-persistence-key="pmh-section"]') as HTMLTextAreaElement | null;
    if (!ta) return;

    // Build new textarea value
    const current = ta.value.trim();
    const insertVal = (current ? ta.value + '\n' : '') + text;

    // Update DOM & fire React input event
    ta.value = insertVal;
    const evt = new Event('input', { bubbles: true });
    ta.dispatchEvent(evt);

    // Immediate parent state update
    onChange(insertVal);

    // Focus and position cursor without problematic blur/focus cycle
    setTimeout(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = ta.value.length;
    }, 0);
  };

  const filtered = COMMON_PMH_CONDITIONS.filter(c => c.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={language==='fr' ? 'Rechercher conditions...' : 'Search conditions...'}
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
        {filtered.map(cond => (
          <Button
            key={cond}
            size="sm"
            variant="secondary"
            className="px-2 text-xs"
            onClick={() => handleInsert(cond)}
          >
            {`+ ${cond}`}
          </Button>
        ))}
      </div>
      <SmartTextEntry
        title={language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        updateOnBlurOnly
        persistenceKey="pmh-section"
      />
    </div>
  );
}