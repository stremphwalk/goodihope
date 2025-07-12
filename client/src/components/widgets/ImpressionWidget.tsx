import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, X, Target, Edit3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartTextEntry } from '../SmartTextEntry';
import { WidgetInstance } from '@/types/widgets';

interface ImpressionData {
  items: string[];
  formattedText: string;
}

interface ImpressionWidgetProps extends Omit<WidgetInstance, 'data' | 'onDataChange'> {
  data: ImpressionData;
  onDataChange: (data: ImpressionData) => void;
}

const commonImpressions = [
  'Acute upper respiratory infection',
  'Hypertension, uncontrolled',
  'Type 2 diabetes mellitus, well controlled',
  'Anxiety disorder',
  'Depression, stable',
  'Acute bronchitis',
  'Gastroesophageal reflux disease',
  'Osteoarthritis, knee',
  'Urinary tract infection',
  'Migraine headache',
  'Chronic back pain',
  'Insomnia',
  'Allergic rhinitis',
  'Dyslipidemia',
  'Chronic fatigue'
];

export const ImpressionWidget: React.FC<ImpressionWidgetProps> = ({
  data,
  onDataChange,
  mode = 'interactive',
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();

  // Initialize with default data structure if empty
  const impressionData: ImpressionData = data?.items ? data : {
    items: [],
    formattedText: ''
  };

  // Update formatted text when items change
  useEffect(() => {
    if (impressionData.items.length > 0) {
      const formatted = impressionData.items.map((item, index) => `${index + 1}. ${item}`).join('\n');
      if (formatted !== impressionData.formattedText) {
        onDataChange({
          ...impressionData,
          formattedText: formatted
        });
      }
    }
  }, [impressionData.items.length]);

  const filteredCommonItems = commonImpressions.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const insertDiagnosis = (diagnosis: string) => {
    const currentText = impressionData.formattedText || '';
    const newText = currentText ? currentText + '\n' + diagnosis : diagnosis;
    
    // Parse the text into items for consistency
    const items = newText
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
    
    onDataChange({
      items,
      formattedText: newText
    });
    setSearchTerm('');
  };

  const handleTextChange = (text: string) => {
    // Store the raw text from SmartTextEntry
    // The formatting will be applied when generating the final output
    onDataChange({
      items: [],
      formattedText: text
    });
  };

  // Generate properly formatted text for output
  const generateFormattedText = (text: string): string => {
    if (!text) return '';
    
    const lines = text.split('\n');
    const formatted: string[] = [];
    let conditionCount = 0;

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        conditionCount++;
        const condition = line.replace('#', '').trim();
        if (conditionCount > 1) formatted.push("");
        formatted.push(`${conditionCount}. ${condition}`);
      } else if (line.startsWith('-')) {
        const detail = line.replace('-', '').trim();
        formatted.push(`     - ${detail}`);
      } else if (line.startsWith('--')) {
        const subDetail = line.replace('--', '').trim();
        formatted.push(`       - ${subDetail}`);
      } else if (/^\d+\./.test(line)) {
        const match = line.match(/^(\d+)\./);
        if (match) {
          const num = parseInt(match[1]);
          if (num > conditionCount) {
            conditionCount = num;
            if (conditionCount > 1) formatted.push("");
          }
        }
        formatted.push(line);
      } else if (line.match(/^\s+/)) {
        formatted.push(line);
      } else {
        conditionCount++;
        if (conditionCount > 1) formatted.push("");
        formatted.push(`${conditionCount}. ${line}`);
      }
    }

    return formatted.join('\n');
  };

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded border">
        <div className="text-sm whitespace-pre-wrap">
          {generateFormattedText(impressionData.formattedText) || 'No clinical impression documented'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-full">
            <Target className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">
              {language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
            </h4>
            <p className="text-xs text-gray-600">
              {language === 'fr' ? 'Évaluation et diagnostic' : 'Assessment and diagnosis'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {language === 'fr' ? 'Édition libre' : 'Free text editing'}
          </Badge>
        </div>
      </div>

      {/* Quick Add Common Items */}
      {!isReadOnly && (
        <div className="space-y-2">
          <Input
            placeholder={language === 'fr' ? 'Rechercher diagnostics communs...' : 'Search common diagnoses...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
          
          {(searchTerm || filteredCommonItems.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {filteredCommonItems.slice(0, 8).map(item => (
                <button
                  key={item}
                  onClick={() => insertDiagnosis(item)}
                  className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors border border-green-200"
                >
                  <Plus className="w-2 h-2 inline mr-1" />
                  {item}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Text Entry */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-3 h-3 text-green-500" />
          <span className="font-medium text-gray-900 text-sm">
            {language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
          </span>
        </div>
        <SmartTextEntry
          title={language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
          placeholder={language === 'fr' ? 'Diabète de type 2 mal contrôlé\n- Ajuster les médicaments\n- Counseling sur le mode de vie\n\nHypertension non contrôlée\n- Augmenter les antihypertenseurs\n\nTapez: dm, htn, uti pour des modèles\nEntrée: nouvelle ligne\nTab: ajouter sous-point' : 'Diabetes mellitus type 2, poorly controlled\n- Adjust medications\n- Lifestyle counseling\n\nHypertension, uncontrolled\n- Increase antihypertensive\n\nType: dm, htn, uti for templates\nEnter: new line\nTab: add sub-point'}
          value={impressionData.formattedText}
          onChange={handleTextChange}
        />
      </div>
    </div>
  );
};