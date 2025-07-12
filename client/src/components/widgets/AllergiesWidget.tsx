import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, X, Shield, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { WidgetInstance } from '@/types/widgets';

interface AllergiesData {
  hasAllergies: boolean;
  allergiesList: string[];
}

interface AllergiesWidgetProps extends Omit<WidgetInstance, 'data' | 'onDataChange'> {
  data: AllergiesData;
  onDataChange: (data: AllergiesData) => void;
}

const commonAllergies = [
  'Penicillin', 'Sulfa', 'Latex', 'Shellfish', 'Nuts', 'Eggs', 
  'Dairy', 'Aspirin', 'Iodine', 'Codeine', 'Morphine', 'NSAIDs'
];

export const AllergiesWidget: React.FC<AllergiesWidgetProps> = ({
  data,
  onDataChange,
  mode = 'interactive',
  isReadOnly = false
}) => {
  const [newAllergy, setNewAllergy] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();

  // Initialize with default data structure if empty
  const allergies: AllergiesData = data?.hasAllergies !== undefined ? data : {
    hasAllergies: false,
    allergiesList: []
  };

  const filteredCommonAllergies = commonAllergies.filter(allergy =>
    allergy.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !allergies.allergiesList.includes(allergy)
  );

  const addAllergy = (allergyName: string) => {
    if (allergyName.trim() && !allergies.allergiesList.includes(allergyName.trim())) {
      onDataChange({
        hasAllergies: true,
        allergiesList: [...allergies.allergiesList, allergyName.trim()]
      });
      setNewAllergy('');
      setSearchTerm('');
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    const newList = allergies.allergiesList.filter(allergy => allergy !== allergyToRemove);
    onDataChange({
      hasAllergies: newList.length > 0,
      allergiesList: newList
    });
  };

  const toggleHasAllergies = () => {
    if (isReadOnly) return;
    onDataChange({
      hasAllergies: !allergies.hasAllergies,
      allergiesList: allergies.hasAllergies ? [] : allergies.allergiesList
    });
  };

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded border">
        <div className="text-sm whitespace-pre-wrap">
          {allergies.hasAllergies && allergies.allergiesList.length > 0 
            ? `Allergies: ${allergies.allergiesList.join(', ')}`
            : 'No Known Allergies (NKA)'
          }
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-100 rounded-full">
            <AlertCircle className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 text-sm">
              {language === 'fr' ? 'Allergies du Patient' : 'Patient Allergies'}
            </h4>
            <p className="text-xs text-gray-600">
              {language === 'fr' ? 'Gérer les allergies connues' : 'Manage known allergies'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-700">
            {allergies.hasAllergies 
              ? (language === 'fr' ? 'A des allergies' : 'Has allergies')
              : (language === 'fr' ? 'Aucune allergie' : 'No allergies')
            }
          </span>
          <button
            onClick={toggleHasAllergies}
            disabled={isReadOnly}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
              allergies.hasAllergies ? 'bg-orange-500' : 'bg-gray-300'
            } ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                allergies.hasAllergies ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {allergies.hasAllergies && (
        <>
          {/* Quick Add Common Allergies */}
          {!isReadOnly && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Search className="w-3 h-3 text-gray-400" />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher allergies communes...' : 'Search common allergies...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 h-8 text-sm"
                />
              </div>
              
              {(searchTerm || filteredCommonAllergies.length > 0) && (
                <div className="flex flex-wrap gap-1">
                  {filteredCommonAllergies.slice(0, 6).map(allergy => (
                    <button
                      key={allergy}
                      onClick={() => addAllergy(allergy)}
                      className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                    >
                      <Plus className="w-2 h-2 inline mr-1" />
                      {allergy}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Allergy Input */}
          {!isReadOnly && (
            <div className="flex gap-2">
              <Input
                defaultValue={newAllergy}
                onBlur={(e) => setNewAllergy(e.target.value)}
                placeholder={language === 'fr' ? 'Ajouter allergie personnalisée...' : 'Add custom allergy...'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value;
                    addAllergy(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }}
                className="flex-1 h-8 text-sm"
              />
              <Button
                onClick={() => addAllergy(newAllergy)}
                disabled={!newAllergy.trim()}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 h-8 px-2"
              >
                <Plus className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Current Allergies List */}
          {allergies.allergiesList.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-red-500" />
                <span className="font-medium text-gray-900 text-sm">
                  {language === 'fr' ? 'Allergies Actuelles' : 'Current Allergies'}
                </span>
                <Badge variant="secondary" className="text-xs">{allergies.allergiesList.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {allergies.allergiesList.map((allergy, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-900 text-sm">{allergy}</span>
                    </div>
                    {!isReadOnly && (
                      <button
                        onClick={() => removeAllergy(allergy)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!allergies.hasAllergies && (
        <div className="text-center py-4">
          <div className="p-2 bg-green-100 rounded-full w-fit mx-auto mb-2">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-green-700 font-medium text-sm">
            {language === 'fr' ? 'Aucune allergie connue' : 'No Known Allergies'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {language === 'fr' ? 'Le patient n\'a pas d\'allergies documentées' : 'Patient has no documented allergies'}
          </p>
        </div>
      )}
    </div>
  );
};