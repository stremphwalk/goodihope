import React, { useState } from 'react';
import { ImpressionSmartTextEntry } from './SmartTextEntryWithTranscription';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const COMMON_IMPRESSIONS = [
  'Sepsis',
  'Pneumonia',
  'CHF exacerbation',
  'COPD exacerbation',
  'Acute kidney injury',
  'Upper GI bleed',
  'DKA',
  'Atrial fibrillation with RVR',
  'STEMI',
  'NSTEMI',
];

interface SmartImpressionSectionProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  defaultContent?: string | null; // Template default content
}

export function SmartImpressionSection({ value, onChange, onBlur, defaultContent }: SmartImpressionSectionProps) {
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

  const [search, setSearch] = useState('');
  const [isInserting, setIsInserting] = useState(false);

  const handleInsert = (text: string) => {
    if (isInserting) return; // Prevent rapid clicks
    setIsInserting(true);
    // Always work with the live value inside the textarea (may be ahead of the prop when updateOnBlurOnly is true)
    const ta = document.querySelector('textarea[data-persistence-key="impression-section"]') as HTMLTextAreaElement | null;
    const currentValue = ta ? ta.value : (value || '');
    
    // Find the appropriate insertion point:
    // If there's existing text, append after the last non-empty line
    let insertionPoint = currentValue.length;
    let insertVal: string;
    
    if (currentValue.trim()) {
      // Find the last character that's not whitespace
      const trimmed = currentValue.trimEnd();
      insertionPoint = trimmed.length;
      
      // If the last character isn't a newline, add one
      const needsNewline = trimmed.length > 0 && !trimmed.endsWith('\n');
      insertVal = currentValue.slice(0, insertionPoint) + 
                  (needsNewline ? '\n' : '') + 
                  text + 
                  currentValue.slice(insertionPoint);
    } else {
      // Empty textarea, just insert the text
      insertVal = text;
    }

    // Update via parent onChange – this works with SmartTextEntry's state management
    onChange(insertVal);

    // Simply focus and position cursor without blur/focus cycle
    setTimeout(() => {
      if (ta) {
        ta.focus();
        const newCursorPos = ta.value.length;
        ta.setSelectionRange(newCursorPos, newCursorPos);
      }
      setIsInserting(false);
    }, 0);
  };

  const filtered = COMMON_IMPRESSIONS.filter(i => i.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <Input
        value={search}
        onChange={e=>setSearch(e.target.value)}
        placeholder={language==='fr'?'Rechercher impressions...':'Search impressions...'}
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
        {filtered.map(i => (
          <Button
            key={i}
            size="sm"
            variant="secondary"
            className="px-2 text-xs"
            onClick={() => handleInsert(i)}
            disabled={isInserting}
          >
            {`+ ${i}`}
          </Button>
        ))}
      </div>
      <ImpressionSmartTextEntry
        title={language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        updateOnBlurOnly
        persistenceKey="impression-section"
      />
    </div>
  );
}