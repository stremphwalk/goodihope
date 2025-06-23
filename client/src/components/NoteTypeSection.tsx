import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Stethoscope, User, Clock, Activity, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NoteTypeSectionProps {
  value?: string;
  onChange: (value: string) => void;
  customContent?: string;
  onCustomContentChange?: (content: string) => void;
}

export function NoteTypeSection({ 
  value, 
  onChange, 
  customContent, 
  onCustomContentChange 
}: NoteTypeSectionProps) {
  const { language } = useLanguage();

  const noteTypes = [
    {
      id: 'admission',
      name: language === 'fr' ? 'Note d\'Admission' : 'Admission Note',
      description: language === 'fr' ? 'Note complète d\'admission hospitalière' : 'Complete hospital admission note',
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      id: 'progress',
      name: language === 'fr' ? 'Note de Progression' : 'Progress Note', 
      description: language === 'fr' ? 'Suivi quotidien du patient' : 'Daily patient follow-up',
      icon: Clock,
      color: 'bg-green-500'
    },
    {
      id: 'discharge',
      name: language === 'fr' ? 'Note de Sortie' : 'Discharge Note',
      description: language === 'fr' ? 'Note de sortie d\'hospitalisation' : 'Hospital discharge note',
      icon: User,
      color: 'bg-purple-500'
    },
    {
      id: 'consultation',
      name: language === 'fr' ? 'Note de Consultation' : 'Consultation Note',
      description: language === 'fr' ? 'Consultation spécialisée' : 'Specialist consultation',
      icon: Stethoscope,
      color: 'bg-orange-500'
    },
    {
      id: 'procedure',
      name: language === 'fr' ? 'Note de Procédure' : 'Procedure Note',
      description: language === 'fr' ? 'Documentation de procédure médicale' : 'Medical procedure documentation',
      icon: Activity,
      color: 'bg-red-500'
    },
    {
      id: 'emergency',
      name: language === 'fr' ? 'Note d\'Urgence' : 'Emergency Note',
      description: language === 'fr' ? 'Évaluation d\'urgence' : 'Emergency department evaluation',
      icon: AlertCircle,
      color: 'bg-red-600'
    },
    {
      id: 'follow-up',
      name: language === 'fr' ? 'Note de Suivi' : 'Follow-up Note',
      description: language === 'fr' ? 'Visite de suivi ambulatoire' : 'Outpatient follow-up visit',
      icon: Clock,
      color: 'bg-indigo-500'
    }
  ];

  const selectedType = noteTypes.find(type => type.id === value);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {language === 'fr' ? 'Type de Note' : 'Note Type'}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === 'fr' 
            ? 'Sélectionnez le type de note médicale approprié' 
            : 'Select the appropriate medical note type'
          }
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Note Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {noteTypes.map(type => {
            const Icon = type.icon;
            const isSelected = value === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => onChange(type.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${type.color} text-white flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm mb-1">
                      {type.name}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
                {isSelected && (
                  <div className="mt-2">
                    <Badge variant="default" className="text-xs">
                      {language === 'fr' ? 'Sélectionné' : 'Selected'}
                    </Badge>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Type Display */}
        {selectedType && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${selectedType.color} text-white`}>
                <selectedType.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedType.name}</h4>
                <p className="text-sm text-gray-600">{selectedType.description}</p>
              </div>
            </div>
          </div>
        )}

        {/* Custom Content for Template Builder */}
        {onCustomContentChange && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Contenu personnalisé (optionnel)' : 'Custom Content (Optional)'}
            </label>
            <textarea
              value={customContent || ''}
              onChange={(e) => onCustomContentChange(e.target.value)}
              placeholder={language === 'fr' 
                ? 'Ajoutez du contenu personnalisé pour cette section...' 
                : 'Add custom content for this section...'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <p className="text-xs text-gray-500">
              {language === 'fr'
                ? 'Ce contenu apparaîtra dans le modèle en plus du type de note sélectionné'
                : 'This content will appear in the template in addition to the selected note type'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}