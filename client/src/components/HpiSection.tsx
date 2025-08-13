import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { rosSymptomOptions } from '@/constants/rosSymptomOptions';
import { generateHpiParagraph, type SelectedSymptom } from '@/utils/symptomTextUtils';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MinusCircle, RotateCcw } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';

export interface HpiSectionProps {
  selectedSymptoms: Record<string, Set<SelectedSymptom>>;
  setSelectedSymptoms: (updater: (prev: Record<string, Set<SelectedSymptom>>) => Record<string, Set<SelectedSymptom>>) => void;
}

export function HpiSection({ selectedSymptoms, setSelectedSymptoms }: HpiSectionProps) {
  const { language } = useLanguage();
  const { value: hpiText, setValue: setHpiText } = usePersistedState<string>('medical_hpi_text', '');
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set());

  // Toggle symptom state: null -> present -> absent -> null
  const toggleSymptom = (systemKey: string, symptomKey: string) => {
    setSelectedSymptoms(prev => {
      const updated = { ...prev };
      if (!updated[systemKey]) {
        updated[systemKey] = new Set();
      }
      
      const systemSet = new Set(updated[systemKey]);
      const existing = Array.from(systemSet).find(item => item.key === symptomKey);
      
      // Remove existing entry
      if (existing) {
        systemSet.delete(existing);
      }
      
      // Determine new state based on current state
      if (!existing) {
        // null -> present
        systemSet.add({ key: symptomKey, present: true });
      } else if (existing.present) {
        // present -> absent (pertinent negative)
        systemSet.add({ key: symptomKey, present: false });
      }
      // absent -> null (no add, just removal above)
      
      // Clean up empty sets
      if (systemSet.size === 0) {
        delete updated[systemKey];
      } else {
        updated[systemKey] = systemSet;
      }
      
      return updated;
    });
  };

  // Get current state of a symptom
  const getSymptomState = (systemKey: string, symptomKey: string): 'present' | 'absent' | null => {
    const symSet = selectedSymptoms[systemKey];
    if (!symSet) return null;
    const symObj = Array.from(symSet).find(item => item.key === symptomKey);
    if (!symObj) return null;
    return symObj.present ? 'present' : 'absent';
  };

  // Clear all selections
  const clearAll = () => {
    setSelectedSymptoms(() => ({}));
  };

  // Handler: Generate HPI text
  const handleGenerateHpi = () => {
    const hpiParagraph = generateHpiParagraph(selectedSymptoms, language);
    setHpiText(hpiParagraph);
  };

  // Effect: Regenerate HPI text on language change if already generated
  useEffect(() => {
    if (hpiText && Object.keys(selectedSymptoms).length > 0) {
      const regeneratedText = generateHpiParagraph(selectedSymptoms, language);
      setHpiText(regeneratedText);
    }
  }, [language]);

  // Toggle system expansion
  const toggleSystemExpansion = (systemKey: string) => {
    setExpandedSystems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(systemKey)) {
        newSet.delete(systemKey);
      } else {
        newSet.add(systemKey);
      }
      return newSet;
    });
  };

  // Check if system has any selections
  const systemHasSelections = (systemKey: string): boolean => {
    const symSet = selectedSymptoms[systemKey];
    return symSet ? symSet.size > 0 : false;
  };

  // Count selections in system
  const getSystemSelectionCount = (systemKey: string): { positive: number; negative: number } => {
    const symSet = selectedSymptoms[systemKey];
    if (!symSet) return { positive: 0, negative: 0 };
    
    let positive = 0;
    let negative = 0;
    symSet.forEach(sym => {
      if (sym.present) positive++;
      else negative++;
    });
    
    return { positive, negative };
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">
            {language === 'fr' ? 'Histoire de la Maladie Actuelle' : 'History of Present Illness'}
          </h2>
        </div>
        <p className="text-sm text-gray-600 max-w-lg mx-auto">
          {language === 'fr' 
            ? 'Cliquez sur les symptômes pour les marquer comme présents ou absents.'
            : 'Click symptoms to mark them as present or absent.'
          }
        </p>
      </div>

      {/* Quick actions */}
      <div className="flex justify-center gap-2">
        <Button
          onClick={clearAll}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="w-4 h-4" />
          {language === 'fr' ? 'Réinitialiser' : 'Clear All'}
        </Button>
      </div>

      {/* Systems and symptoms */}
      <div className="bg-white/90 border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {Object.entries(rosSymptomOptions).map(([systemKey, systemData], index) => {
          const isExpanded = expandedSystems.has(systemKey) || systemHasSelections(systemKey);
          const { positive, negative } = getSystemSelectionCount(systemKey);
          
          return (
            <div key={systemKey} className={index > 0 ? 'border-t' : ''}>
              {/* System header */}
              <div 
                className="px-4 py-3 bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleSystemExpansion(systemKey)}
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-800">
                    {language === 'fr' ? systemData.label.fr : systemData.label.en}
                  </h3>
                  {(positive > 0 || negative > 0) && (
                    <div className="flex gap-2">
                      {positive > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {positive} {language === 'fr' ? 'présent' : 'present'}
                        </span>
                      )}
                      {negative > 0 && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          {negative} {language === 'fr' ? 'pertinent négatif' : 'pertinent negative'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              
              {/* Symptoms list */}
              {isExpanded && (
                <div className="px-4 py-3 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {systemData.symptoms.map((symptom: any) => {
                      const state = getSymptomState(systemKey, symptom.key);
                      
                      return (
                        <div 
                          key={symptom.key} 
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-sm text-gray-700 flex-1">
                            {language === 'fr' ? symptom.fr : symptom.en}
                          </span>
                          <button
                            onClick={() => toggleSymptom(systemKey, symptom.key)}
                            className={`p-1 rounded-lg transition-colors ${
                              state === 'present' 
                                ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                : state === 'absent' 
                                ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            {state === 'present' ? (
                              <CheckCircle className="w-5 h-5" />
                            ) : state === 'absent' ? (
                              <XCircle className="w-5 h-5" />
                            ) : (
                              <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Generate button */}
      <div className="text-center">
        <Button 
          onClick={handleGenerateHpi}
          disabled={Object.keys(selectedSymptoms).length === 0}
        >
          {language === 'fr' ? 'Générer HMA' : 'Generate HPI'}
        </Button>
      </div>
    </div>
  );
}

export default HpiSection;