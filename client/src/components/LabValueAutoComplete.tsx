import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Search, FlaskConical, Plus, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LabValue } from '@/lib/labUtils';

interface LabTest {
  id: string;
  testName: string;
  category: string;
  unit?: string;
  referenceRange?: string;
}

interface LabValueAutoCompleteProps {
  onLabAdd: (labValue: LabValue) => void;
  selectedLabs: string[];
  onLabRemove: (testName: string) => void;
  placeholder?: string;
}

export function LabValueAutoComplete({ onLabAdd, selectedLabs, onLabRemove, placeholder }: LabValueAutoCompleteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [suggestions, setSuggestions] = useState<LabTest[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const { language } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Common lab tests database
  const commonLabTests: LabTest[] = [
    // CBC
    { id: 'hemoglobin', testName: 'Hemoglobin', category: 'CBC', unit: 'g/dL', referenceRange: '12-16' },
    { id: 'hematocrit', testName: 'Hematocrit', category: 'CBC', unit: '%', referenceRange: '36-46' },
    { id: 'wbc', testName: 'WBC', category: 'CBC', unit: '10³/μL', referenceRange: '4.5-11.0' },
    { id: 'rbc', testName: 'RBC', category: 'CBC', unit: '10⁶/μL', referenceRange: '4.2-5.4' },
    { id: 'platelets', testName: 'Platelets', category: 'CBC', unit: '10³/μL', referenceRange: '150-450' },
    
    // Chemistry
    { id: 'glucose', testName: 'Glucose', category: 'Chemistry', unit: 'mg/dL', referenceRange: '70-100' },
    { id: 'sodium', testName: 'Sodium', category: 'Chemistry', unit: 'mEq/L', referenceRange: '136-145' },
    { id: 'potassium', testName: 'Potassium', category: 'Chemistry', unit: 'mEq/L', referenceRange: '3.5-5.1' },
    { id: 'chloride', testName: 'Chloride', category: 'Chemistry', unit: 'mEq/L', referenceRange: '98-107' },
    { id: 'bun', testName: 'BUN', category: 'Chemistry', unit: 'mg/dL', referenceRange: '7-20' },
    { id: 'creatinine', testName: 'Creatinine', category: 'Chemistry', unit: 'mg/dL', referenceRange: '0.6-1.2' },
    
    // Liver Function Tests
    { id: 'alt', testName: 'ALT', category: 'LFT', unit: 'U/L', referenceRange: '7-56' },
    { id: 'ast', testName: 'AST', category: 'LFT', unit: 'U/L', referenceRange: '10-40' },
    { id: 'bilirubin', testName: 'Total Bilirubin', category: 'LFT', unit: 'mg/dL', referenceRange: '0.3-1.2' },
    { id: 'albumin', testName: 'Albumin', category: 'LFT', unit: 'g/dL', referenceRange: '3.5-5.0' },
    
    // Coagulation
    { id: 'pt', testName: 'PT', category: 'Coagulation', unit: 'sec', referenceRange: '11-13' },
    { id: 'ptt', testName: 'PTT', category: 'Coagulation', unit: 'sec', referenceRange: '25-35' },
    { id: 'inr', testName: 'INR', category: 'Coagulation', unit: '', referenceRange: '0.8-1.1' },
    
    // Lipids
    { id: 'cholesterol', testName: 'Total Cholesterol', category: 'Lipids', unit: 'mg/dL', referenceRange: '<200' },
    { id: 'hdl', testName: 'HDL', category: 'Lipids', unit: 'mg/dL', referenceRange: '>40' },
    { id: 'ldl', testName: 'LDL', category: 'Lipids', unit: 'mg/dL', referenceRange: '<100' },
    { id: 'triglycerides', testName: 'Triglycerides', category: 'Lipids', unit: 'mg/dL', referenceRange: '<150' },
    
    // Endocrinology
    { id: 'tsh', testName: 'TSH', category: 'Endocrinology', unit: 'mIU/L', referenceRange: '0.4-4.0' },
    { id: 'hba1c', testName: 'HbA1c', category: 'Endocrinology', unit: '%', referenceRange: '<5.7' },
    
    // Other
    { id: 'crp', testName: 'CRP', category: 'CRP', unit: 'mg/L', referenceRange: '<3.0' },
    { id: 'esr', testName: 'ESR', category: 'General', unit: 'mm/hr', referenceRange: '<20' }
  ];

  // Search for lab tests when search term changes
  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filteredTests = commonLabTests.filter(test => 
      test.testName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      test.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    setSuggestions(filteredTests);
    setShowSuggestions(filteredTests.length > 0);
    setSelectedIndex(-1);
  }, [searchTerm]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(target) &&
        inputRef.current &&
        !inputRef.current.contains(target) &&
        (!valueRef.current || !valueRef.current.contains(target)) &&
        (!unitRef.current || !unitRef.current.contains(target)) &&
        (!dateRef.current || !dateRef.current.contains(target))
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTestSelect = (test: LabTest) => {
    setSelectedTest(test);
    setSearchTerm(test.testName);
    // Only set unit if user hasn't entered one
    if (!unit.trim()) {
      setUnit(test.unit || '');
    }
    setShowSuggestions(false);
    
    // Focus on value input after selection
    setTimeout(() => {
      valueRef.current?.focus();
    }, 100);
  };

  const handleAddLab = () => {
    if (!selectedTest || !value.trim()) {
      return;
    }

    // Check if lab is already selected
    const isAlreadySelected = selectedLabs.some(labName => 
      labName.toLowerCase() === selectedTest.testName.toLowerCase()
    );
    
    if (isAlreadySelected) {
      // Could show toast notification here
      console.warn(`Lab test '${selectedTest.testName}' is already added`);
      return;
    }

    // Generate timestamp - use custom date if provided, otherwise current date
    let timestamp: string;
    if (customDate) {
      // Convert YYYY-MM-DD to YYMMDD
      const parts = customDate.split('-');
      if (parts.length === 3) {
        timestamp = parts[0].slice(-2) + parts[1] + parts[2];
      } else {
        timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
      }
    } else {
      timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '').slice(2);
    }

    const newLabValue: LabValue = {
      testName: selectedTest.testName,
      value: value.trim(),
      unit: unit.trim() || selectedTest.unit || '',
      referenceRange: selectedTest.referenceRange,
      category: selectedTest.category,
      timestamp: timestamp
    };
    
    onLabAdd(newLabValue);
    
    // Reset form
    setSearchTerm('');
    setValue('');
    setUnit('');
    setCustomDate('');
    setSelectedTest(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleTestSelect(suggestions[selectedIndex]);
      } else if (searchTerm.trim() && !selectedTest) {
        // Create custom test
        const customTest: LabTest = {
          id: searchTerm.toLowerCase().replace(/\s+/g, '_'),
          testName: searchTerm.trim(),
          category: 'General',
          unit: '',
          referenceRange: ''
        };
        handleTestSelect(customTest);
      }
    }
  };

  const handleValueKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddLab();
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
            placeholder={placeholder || (language === 'fr' ? 'Rechercher un test de laboratoire...' : 'Search for lab test...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => searchTerm.length >= 2 && setShowSuggestions(true)}
            className="pl-10"
          />
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((test, index) => (
              <button
                key={`${test.id}-${index}`}
                onClick={() => handleTestSelect(test)}
                className={`w-full px-4 py-3 text-left border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition-colors ${
                  selectedIndex === index
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <FlaskConical className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {test.testName}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      {language === 'fr' ? 'Catégorie: ' : 'Category: '}{test.category}
                    </div>
                    {test.unit && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {language === 'fr' ? 'Unité: ' : 'Unit: '}{test.unit}
                        {test.referenceRange && ` • ${language === 'fr' ? 'Référence: ' : 'Reference: '}${test.referenceRange}`}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && suggestions.length === 0 && searchTerm.length >= 2 && (
          <div
            ref={suggestionsRef}
            className="absolute z-[100] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-4 text-center text-gray-500 dark:text-gray-400"
          >
            {language === 'fr' ? 'Aucun test trouvé' : 'No tests found'}
          </div>
        )}
      </div>

      {/* Value input section - shown when test is selected */}
      {selectedTest && (
        <Card>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <FlaskConical className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{selectedTest.testName}</span>
                <span className="text-sm text-gray-500">({selectedTest.category})</span>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'fr' ? 'Valeur' : 'Value'} <span className="text-red-500">*</span>
                  </label>
                  <Input
                    ref={valueRef}
                    type="text"
                    placeholder={language === 'fr' ? 'Entrer la valeur...' : 'Enter value...'}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleValueKeyDown}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'fr' ? 'Unité' : 'Unit'}
                  </label>
                  <Input
                    ref={unitRef}
                    type="text"
                    placeholder={language === 'fr' ? 'Unité...' : 'Unit...'}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    onKeyDown={handleValueKeyDown}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    {language === 'fr' ? 'Date' : 'Date'}
                  </label>
                  <Input
                    ref={dateRef}
                    type="date"
                    placeholder={language === 'fr' ? 'Date...' : 'Date...'}
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    onKeyDown={handleValueKeyDown}
                  />
                </div>
              </div>

              {selectedTest.referenceRange && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'fr' ? 'Valeurs de référence: ' : 'Reference range: '}{selectedTest.referenceRange}
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={handleAddLab}
                  disabled={!value.trim()}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'Ajouter' : 'Add Lab'}
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => {
                    setSelectedTest(null);
                    setSearchTerm('');
                    setValue('');
                    setUnit('');
                    setCustomDate('');
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}