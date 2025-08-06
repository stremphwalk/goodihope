import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, Plus, X, Target, Edit3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImpressionSmartTextEntry } from '../SmartTextEntryWithTranscription';
import { WidgetInstance } from '@/types/widgets';
import { formatStructuredMedicalText } from '@/lib/textFormatting';

interface ImpressionData {
  formattedText: string;
}

interface ImpressionWidgetProps extends Omit<WidgetInstance, 'data' | 'onDataChange'> {
  data: ImpressionData;
  onDataChange: (data: ImpressionData) => void;
}

export const ImpressionWidget: React.FC<ImpressionWidgetProps> = ({
  data = { formattedText: '' },
  onDataChange,
  mode = 'interactive',
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();

  // List of common diagnoses
  const commonItems = [
    'Diabetes mellitus',
    'Hypertension',
    'Hyperlipidemia',
    'Coronary artery disease',
    'Chronic kidney disease',
    'Asthma',
    'COPD',
    'Heart failure',
    'Atrial fibrillation',
    'Obesity',
    'Hypothyroidism',
    'Depression',
    'Anxiety',
    'Osteoarthritis',
    'Rheumatoid arthritis',
    'UTI',
    'Pneumonia',
    'COVID-19',
    'Anemia',
    'Cancer',
    'Stroke',
    'Migraine',
    'Gout',
    'GERD',
    'Peptic ulcer disease',
    'Liver disease',
    'Epilepsy',
    'Dementia',
    'Parkinson\'s disease',
    'Other'
  ];

  // Filtered list based on searchTerm
  const filteredCommonItems = commonItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const insertDiagnosis = (diagnosis: string) => {
    onDataChange({ formattedText: `${data.formattedText || ''}\n${diagnosis}` });
    setSearchTerm('');
  };

  const handleTextChange = (text: string) => {
    onDataChange({ formattedText: text });
  };


  

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded border">
        <div className="text-sm whitespace-pre-wrap">
        {formatStructuredMedicalText(data.formattedText) || 'No clinical impression documented'}
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
        <ImpressionSmartTextEntry
          title={language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
          placeholder={language === 'fr' ? 'Diabète de type 2 mal contrôlé\n- Ajuster les médicaments\n- Counseling sur le mode de vie\n\nHypertension non contrôlée\n- Augmenter les antihypertenseurs\n\nTapez: dm, htn, uti pour des modèles\nEntrée: nouvelle ligne\nTab: ajouter sous-point' : 'Diabetes mellitus type 2, poorly controlled\n- Adjust medications\n- Lifestyle counseling\n\nHypertension, uncontrolled\n- Increase antihypertensive\n\nType: dm, htn, uti for templates\nEnter: new line\nTab: add sub-point'}
          value={data.formattedText}
          onChange={handleTextChange}
        />
      </div>
    </div>
  );
};