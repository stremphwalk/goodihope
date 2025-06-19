import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Pill, Plus, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Medication {
  id: string;
  brandName: string;
  genericName: string;
  strength?: string;
  dosageForm?: string;
}

interface MedicationAutoCompleteProps {
  onMedicationAdd: (medicationName: string, isCustom?: boolean) => void;
  selectedMedications: string[];
  onMedicationRemove: (medicationName: string) => void;
  placeholder?: string;
}

export function MedicationAutoComplete({ onMedicationAdd, selectedMedications, onMedicationRemove, placeholder }: MedicationAutoCompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Medication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { t, language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Search for medications when search term changes
  useEffect(() => {
    const searchMedications = async () => {
      if (searchTerm.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        // Call our medication search API
        const response = await fetch(`/api/medications/search?q=${encodeURIComponent(searchTerm)}&limit=10`);
        if (response.ok) {
          const medications = await response.json();
          setSuggestions(medications);
          setShowSuggestions(true);
        } else {
          // Fallback if API is not available
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error('Error searching medications:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchMedications, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMedicationSelect = (medication: Medication) => {
    // Use the brand name from the selected medication
    const medicationName = medication.brandName;
    
    // Check if medication is already selected
    const isAlreadySelected = selectedMedications.includes(medicationName);
    
    if (!isAlreadySelected && medicationName) {
      onMedicationAdd(medicationName, false); // Database medication
      setSearchTerm('');
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter' && searchTerm.trim()) {
      e.preventDefault();
      
      // Check if medication is already selected
      const isAlreadySelected = selectedMedications.includes(searchTerm.trim());
      
      if (!isAlreadySelected) {
        onMedicationAdd(searchTerm.trim(), true); // Mark as custom
        setSearchTerm('');
        setSuggestions([]);
        setShowSuggestions(false);
        inputRef.current?.focus();
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder || (language === 'fr' ? 'Rechercher un médicament...' : 'Search for medication...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
            className="pl-10"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((medication, index) => (
              <button
                key={`${medication.id}-${index}`}
                onClick={() => handleMedicationSelect(medication)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <Pill className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {medication.brandName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {language === 'fr' ? 'Générique: ' : 'Generic: '}{medication.genericName}
                    </div>
                    {medication.strength && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {medication.strength} {medication.dosageForm}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && !isLoading && (
          <div
            ref={suggestionsRef}
            className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-4 text-center text-gray-500 dark:text-gray-400"
          >
            {language === 'fr' ? 'Aucun médicament trouvé' : 'No medications found'}
          </div>
        )}
      </div>


    </div>
  );
}