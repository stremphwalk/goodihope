import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, X, Shield, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AllergiesData {
  hasAllergies: boolean;
  allergiesList: string[];
}

interface AllergiesSectionProps {
  allergies: AllergiesData;
  onAllergiesChange: (allergies: AllergiesData) => void;
  onConfirm?: () => void;
}

const commonAllergies = [
  'Penicillin', 'Sulfa', 'Latex', 'Shellfish', 'Nuts', 'Eggs', 
  'Dairy', 'Aspirin', 'Iodine', 'Codeine', 'Morphine', 'NSAIDs'
];

export function AllergiesSection({ allergies, onAllergiesChange, onConfirm }: AllergiesSectionProps) {
  const [newAllergy, setNewAllergy] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { language } = useLanguage();

  const filteredCommonAllergies = commonAllergies.filter(allergy =>
    allergy.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !allergies.allergiesList.includes(allergy)
  );

  const addAllergy = (allergyName: string) => {
    if (allergyName.trim() && !allergies.allergiesList.includes(allergyName.trim())) {
      onAllergiesChange({
        hasAllergies: true,
        allergiesList: [...allergies.allergiesList, allergyName.trim()]
      });
      setNewAllergy('');
      setSearchTerm('');
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    const newList = allergies.allergiesList.filter(allergy => allergy !== allergyToRemove);
    onAllergiesChange({
      hasAllergies: newList.length > 0,
      allergiesList: newList
    });
  };

  const toggleHasAllergies = () => {
    onAllergiesChange({
      hasAllergies: !allergies.hasAllergies,
      allergiesList: allergies.hasAllergies ? [] : allergies.allergiesList
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Toggle */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-full">
            <AlertCircle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {language === 'fr' ? 'Allergies du Patient' : 'Patient Allergies'}
            </h3>
            <p className="text-sm text-gray-600">
              {language === 'fr' ? 'Gérer les allergies connues' : 'Manage known allergies'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">
            {allergies.hasAllergies 
              ? (language === 'fr' ? 'A des allergies' : 'Has allergies')
              : (language === 'fr' ? 'Aucune allergie' : 'No allergies')
            }
          </span>
          <button
            onClick={toggleHasAllergies}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
              allergies.hasAllergies ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                allergies.hasAllergies ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {allergies.hasAllergies && (
        <>
          {/* Quick Add Common Allergies */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder={language === 'fr' ? 'Rechercher allergies communes...' : 'Search common allergies...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            
            {(searchTerm || filteredCommonAllergies.length > 0) && (
              <div className="flex flex-wrap gap-2">
                {filteredCommonAllergies.slice(0, 8).map(allergy => (
                  <button
                    key={allergy}
                    onClick={() => addAllergy(allergy)}
                    className="px-3 py-1.5 text-sm bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors border border-orange-200"
                  >
                    <Plus className="w-3 h-3 inline mr-1" />
                    {allergy}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Allergy Input */}
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
              className="flex-1"
            />
            <Button
              onClick={() => addAllergy(newAllergy)}
              disabled={!newAllergy.trim()}
              size="sm"
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Current Allergies List */}
          {allergies.allergiesList.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="font-medium text-gray-900">
                  {language === 'fr' ? 'Allergies Actuelles' : 'Current Allergies'}
                </span>
                <Badge variant="secondary">{allergies.allergiesList.length}</Badge>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allergies.allergiesList.map((allergy, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium text-red-900">{allergy}</span>
                    </div>
                    <button
                      onClick={() => removeAllergy(allergy)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Button */}
          {onConfirm && (
            <Button
              onClick={onConfirm}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              {language === 'fr' ? 'Confirmer les Allergies' : 'Confirm Allergies'}
            </Button>
          )}
        </>
      )}

      {!allergies.hasAllergies && (
        <div className="text-center py-8">
          <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-green-700 font-medium">
            {language === 'fr' ? 'Aucune allergie connue' : 'No Known Allergies'}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'fr' ? 'Le patient n\'a pas d\'allergies documentées' : 'Patient has no documented allergies'}
          </p>
        </div>
      )}
    </div>
  );
}