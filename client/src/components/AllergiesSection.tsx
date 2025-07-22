import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Plus, X, Shield, Search, Undo2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export function AllergiesSection({ allergies: initialAllergies, onAllergiesChange, onConfirm }: AllergiesSectionProps) {
  const [localAllergies, setLocalAllergies] = useState<AllergiesData>(initialAllergies || { hasAllergies: false, allergiesList: [] });
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');
  const [lastRemoved, setLastRemoved] = useState<string | null>(null);
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalAllergies(initialAllergies || { hasAllergies: false, allergiesList: [] });
  }, [initialAllergies]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const filteredCommon = commonAllergies.filter(a => 
    a.toLowerCase().includes(debouncedValue.toLowerCase()) && !localAllergies.allergiesList.includes(a)
  );

  const addAllergy = (allergyName: string) => {
    const trimmed = allergyName.trim();
    if (!trimmed || localAllergies.allergiesList.includes(trimmed) || localAllergies.allergiesList.length >= 20) {
      if (localAllergies.allergiesList.length >= 20) toast.error(language === 'fr' ? 'Limite de 20 allergies atteinte' : 'Max 20 allergies');
      else if (localAllergies.allergiesList.includes(trimmed)) toast.error(language === 'fr' ? 'Allergie déjà ajoutée' : 'Allergy already added');
      else toast.error(language === 'fr' ? 'Entrez une allergie valide' : 'Enter a valid allergy');
      return;
    }
    const newList = [...localAllergies.allergiesList, trimmed];
    setLocalAllergies({ hasAllergies: true, allergiesList: newList });
    setInputValue('');
    toast.success(language === 'fr' ? 'Allergie ajoutée' : 'Allergy added');
    inputRef.current?.focus();
  };

  const removeAllergy = (allergyToRemove: string) => {
    const newList = localAllergies.allergiesList.filter(a => a !== allergyToRemove);
    setLastRemoved(allergyToRemove);
    setLocalAllergies({ hasAllergies: newList.length > 0, allergiesList: newList });
    toast.success(language === 'fr' ? 'Allergie supprimée (undo disponible)' : 'Allergy removed (undo available)', { duration: 5000 });
  };

  const undoRemove = () => {
    if (lastRemoved) {
      addAllergy(lastRemoved);
      setLastRemoved(null);
      toast.success(language === 'fr' ? 'Suppression annulée' : 'Undo successful');
    }
  };

  const toggleHasAllergies = () => {
    if (localAllergies.hasAllergies && localAllergies.allergiesList.length > 0) {
      if (!confirm(language === 'fr' ? 'Cela supprimera toutes les allergies. Confirmer ?' : 'This will clear all allergies. Confirm?')) return;
    }
    setLocalAllergies({ hasAllergies: !localAllergies.hasAllergies, allergiesList: [] });
    setLastRemoved(null);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addAllergy(inputValue);
    }
  };

  const handleConfirm = () => {
    onAllergiesChange(localAllergies);
    setTimeout(() => {
      onConfirm?.();
    }, 0);
  };

  return (
    <TooltipProvider>
      <div 
        className="space-y-4 p-4 bg-white rounded-xl shadow-sm border border-orange-100 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-full">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{language === 'fr' ? 'Allergies du Patient' : 'Patient Allergies'}</h3>
              <p className="text-sm text-gray-500">{language === 'fr' ? 'Gérez les allergies connues' : 'Manage known allergies'}</p>
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <button
                onClick={toggleHasAllergies}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  localAllergies.hasAllergies ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localAllergies.hasAllergies ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>{localAllergies.hasAllergies ? (language === 'fr' ? 'Désactiver' : 'Disable') : (language === 'fr' ? 'Activer' : 'Enable')}</TooltipContent>
          </Tooltip>
        </div>

        {localAllergies.hasAllergies ? (
          <div className="space-y-4 flex-grow">
            {/* Search with Autocomplete */}
            <div className="relative">
              <Popover open={debouncedValue.length > 0 && filteredCommon.length > 0}>
                <PopoverTrigger asChild>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      ref={inputRef}
                      placeholder={language === 'fr' ? 'Rechercher ou ajouter allergie...' : 'Search or add allergy...'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="pl-9 pr-10"
                      maxLength={50}
                    />
                    <Button 
                      onClick={() => addAllergy(inputValue)}
                      disabled={!inputValue.trim()}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-orange-500 hover:bg-orange-600 p-1 h-7 w-7"
                      size="icon"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0 border-orange-200 shadow-lg bg-orange-50 rounded-md">
                  <div className="max-h-48 overflow-y-auto divide-y divide-orange-100">
                    {filteredCommon.map((a) => (
                      <button
                        key={a}
                        onClick={() => addAllergy(a)}
                        className="w-full px-4 py-2 text-left hover:bg-orange-100 transition-colors text-sm text-orange-700"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Current Allergies */}
            <div className="space-y-2 flex-grow">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="font-medium text-gray-900">{language === 'fr' ? 'Allergies Actuelles' : 'Current Allergies'}</span>
                <Badge variant="secondary">{localAllergies.allergiesList.length}/20</Badge>
                {lastRemoved && (
                  <Button variant="ghost" size="sm" onClick={undoRemove} className="ml-auto text-xs text-blue-600">
                    <Undo2 className="w-3 h-3 mr-1" /> Undo
                  </Button>
                )}
              </div>
              <AnimatePresence>
                {localAllergies.allergiesList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {localAllergies.allergiesList.map((a, i) => (
                      <motion.div
                        key={a}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                          <span className="text-sm text-red-900 truncate max-w-[150px]">{a}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeAllergy(a)} className="h-6 w-6">
                          <X className="w-4 h-4 text-red-500" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">{language === 'fr' ? 'Aucune allergie ajoutée pour le moment' : 'No allergies added yet'}</p>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div 
            className="text-center py-6 bg-green-50 rounded-lg flex-grow flex flex-col justify-center"
          >
            <Shield className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="font-medium text-green-700">{language === 'fr' ? 'Aucune Allergie Connue' : 'No Known Allergies'}</p>
            <p className="text-sm text-gray-500">{language === 'fr' ? 'Activez pour ajouter des allergies' : 'Toggle on to add allergies'}</p>
          </div>
        )}

        {/* Confirm Button */}
        {onConfirm && (
          <Button
            onClick={handleConfirm}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {language === 'fr' ? "Confirmer les Allergies" : 'Confirm Allergies'}
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}