import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, X, History, Edit3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SmartTextEntry } from '../SmartTextEntry';
import { WidgetInstance } from '@/types/widgets';
import { formatStructuredMedicalText } from '@/lib/textFormatting';

interface PMHData {
  formattedText: string;
}

interface PMHWidgetProps extends Omit<WidgetInstance, 'data' | 'onDataChange'> {
  data: PMHData;
  onDataChange: (data: PMHData) => void;
}

const commonPMHItems = [
  'Hypertension', 'Diabetes Mellitus Type 2', 'Dyslipidemia', 'COPD', 'Asthma',
  'Coronary Artery Disease', 'Atrial Fibrillation', 'Heart Failure', 'Stroke',
  'Depression', 'Anxiety', 'Osteoarthritis', 'Hypothyroidism', 'GERD',
  'Chronic Kidney Disease', 'Osteoporosis', 'BPH', 'Migraine'
];

export const PMHWidget: React.FC<PMHWidgetProps> = ({
  data = { formattedText: '' },
  onDataChange,
  mode = 'interactive',
  isReadOnly = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();

  

  

  const filteredCommonItems = commonPMHItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const insertCondition = (condition: string) => {    onDataChange({ formattedText: `${data.formattedText || ''}
${condition}`.trim() });    setSearchTerm('');  };

  const handleTextChange = (text: string) => {
    onDataChange({ formattedText: text });
  };

  

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded border">
        <div className="text-sm whitespace-pre-wrap">
        {formatStructuredMedicalText(data.formattedText) || 'No past medical history documented'}
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-full">
            <History className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">
              {language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
            </h4>
            <p className="text-xs text-gray-600">
              {language === 'fr' ? 'Historique médical du patient' : 'Patient medical history'}
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
            placeholder={language === 'fr' ? 'Rechercher conditions communes...' : 'Search common conditions...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 text-sm"
          />
          
          {(searchTerm || filteredCommonItems.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {filteredCommonItems.slice(0, 8).map(item => (
                <button
                  key={item}
                  onClick={() => insertCondition(item)}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors border border-blue-200"
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
          <FileText className="w-3 h-3 text-blue-500" />
          <span className="font-medium text-gray-900 text-sm">
            {language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
          </span>
        </div>
        <SmartTextEntry
          title={language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
          placeholder={language === 'fr' ? 'Diabète de type 2\n- Bien contrôlé sous metformine\n- Dernière HbA1c 7.2%\n\nHypertension artérielle\n- Bien contrôlée\n- Sous lisinopril 10mg par jour\n\nTapez: dm, htn, cad pour des modèles\nEntrée: nouvelle ligne\nTab: ajouter sous-point' : 'Diabetes mellitus type 2\n- Well controlled on metformin\n- Last HbA1c 7.2%\n\nHypertension\n- Well controlled\n- On lisinopril 10mg daily\n\nType: dm, htn, cad for templates\nEnter: new line\nTab: add sub-point'}
          value={data.formattedText}
          onChange={handleTextChange}
        />
      </div>
    </div>
  );
};