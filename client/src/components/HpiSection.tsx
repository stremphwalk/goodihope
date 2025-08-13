import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { rosSymptomOptions } from '@/constants/rosSymptomOptions';
import { generateHpiParagraph, type SelectedSymptom } from '@/utils/symptomTextUtils';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Edit3 } from 'lucide-react';
import { usePersistedState } from '@/hooks/usePersistedState';

export interface HpiSectionProps {
  selectedSymptoms: Record<string, Set<SelectedSymptom>>;
  setSelectedSymptoms: (updater: (prev: Record<string, Set<SelectedSymptom>>) => Record<string, Set<SelectedSymptom>>) => void;
}

export function HpiSection({ selectedSymptoms, setSelectedSymptoms }: HpiSectionProps) {
  const { language } = useLanguage();
  const { value: hpiText, setValue: setHpiText } = usePersistedState<string>('medical_hpi_text', '');
  
  // Debug logging
  console.log('HpiSection rendering with language:', language);
  console.log('HpiSection selectedSymptoms:', selectedSymptoms);
  
  // Local state for the new symptom form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSymptomSystem, setNewSymptomSystem] = useState<string>('');
  const [newSymptomKey, setNewSymptomKey] = useState<string>('');
  const [newSymptomSeverity, setNewSymptomSeverity] = useState<string>('');
  const [newSymptomNote, setNewSymptomNote] = useState<string>('');
  const [isNegative, setIsNegative] = useState(false);

  // Handler: Add a new symptom to the selection
  const handleAddSymptom = () => {
    if (!newSymptomSystem || !newSymptomKey) return;
    
    const symptomData: SelectedSymptom = {
      key: newSymptomKey,
      present: !isNegative,
      severity: (newSymptomSeverity.trim() as 'mild' | 'moderate' | 'severe') || undefined,
      note: newSymptomNote.trim() || undefined
    };
    
    setSelectedSymptoms(prev => {
      const updated = { ...prev };
      if (!updated[newSymptomSystem]) {
        updated[newSymptomSystem] = new Set();
      }
      // Remove any existing entry with same key
      const systemSet = new Set(updated[newSymptomSystem]);
      systemSet.forEach(item => {
        if (item.key === newSymptomKey) systemSet.delete(item);
      });
      systemSet.add(symptomData);
      updated[newSymptomSystem] = systemSet;
      return updated;
    });
    
    // Reset form
    setNewSymptomSystem('');
    setNewSymptomKey('');
    setNewSymptomSeverity('');
    setNewSymptomNote('');
    setIsNegative(false);
    setShowAddForm(false);
  };

  // Handler: Remove a symptom from selection
  const handleRemoveSymptom = (system: string, symptomKey: string) => {
    setSelectedSymptoms(prev => {
      const updated = { ...prev };
      if (updated[system]) {
        const systemSet = new Set(Array.from(updated[system]).filter(item => item.key !== symptomKey));
        if (systemSet.size === 0) {
          delete updated[system];
        } else {
          updated[system] = systemSet;
        }
      }
      return updated;
    });
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

  // Collect symptoms for display
  const allSymptoms: { system: string; symptom: SelectedSymptom }[] = [];
  Object.entries(selectedSymptoms).forEach(([system, symSet]) => {
    symSet.forEach(sym => {
      allSymptoms.push({ system, symptom: sym });
    });
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 relative">
      {/* DEBUG: New HPI Section Marker */}
      <div className="bg-green-500 text-white p-2 text-center font-bold">
        NEW HPI SECTION LOADED - REDESIGN WORKING!
      </div>
      
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
            ? 'Ajoutez les symptômes pertinents et générez le paragraphe HMA.'
            : 'Add relevant symptoms and generate the HPI paragraph.'
          }
        </p>
      </div>

      {/* Main content area */}
      <div className="bg-white/90 border border-gray-200 rounded-xl p-4 shadow-sm">
        {/* Symptom list */}
        <div className="space-y-3">
          {allSymptoms.length > 0 ? (
            allSymptoms.map(({ system, symptom }) => {
              const systemObj = (rosSymptomOptions as any)[system];
              const symInfo = systemObj?.symptoms.find((s: any) => s.key === symptom.key);
              const symLabel = symInfo ? (language === 'fr' ? symInfo.fr : symInfo.en) : symptom.key;
              const systemLabel = systemObj ? (language === 'fr' ? systemObj.label.fr : systemObj.label.en) : system;
              
              return (
                <div key={`${system}-${symptom.key}`} className="flex items-start justify-between bg-gray-50 border rounded-lg p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800">{symLabel}</span>
                      {symptom.present ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                          {language === 'fr' ? 'Présent' : 'Present'}
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                          {language === 'fr' ? 'Absent' : 'Absent'}
                        </span>
                      )}
                    </div>
                    {symptom.severity && (
                      <span className="text-sm text-gray-600">
                        {language === 'fr' ? 'Sévérité' : 'Severity'}: {symptom.severity}
                      </span>
                    )}
                    {symptom.note && (
                      <div className="text-sm text-gray-600 mt-1">{symptom.note}</div>
                    )}
                    <span className="text-xs text-gray-500">{systemLabel}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveSymptom(system, symptom.key)} 
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              {language === 'fr' ? 'Aucun symptôme ajouté.' : 'No symptoms added yet.'}
            </p>
          )}
        </div>

        {/* Add symptom form */}
        {showAddForm ? (
          <div className="border-t pt-4 mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select 
                value={newSymptomSystem} 
                onChange={e => {
                  setNewSymptomSystem(e.target.value);
                  setNewSymptomKey('');
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{language === 'fr' ? 'Choisir un système...' : 'Choose system...'}</option>
                {Object.entries(rosSymptomOptions).map(([key, val]) => (
                  <option key={key} value={key}>
                    {language === 'fr' ? val.label.fr : val.label.en}
                  </option>
                ))}
              </select>
              
              <select 
                value={newSymptomKey} 
                onChange={e => setNewSymptomKey(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!newSymptomSystem}
              >
                <option value="">{language === 'fr' ? 'Choisir un symptôme...' : 'Choose symptom...'}</option>
                {newSymptomSystem && (rosSymptomOptions as any)[newSymptomSystem]?.symptoms.map((sym: any) => (
                  <option key={sym.key} value={sym.key}>
                    {language === 'fr' ? sym.fr : sym.en}
                  </option>
                ))}
              </select>
            </div>
            
            {newSymptomKey && (
              <>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      checked={isNegative}
                      onChange={e => setIsNegative(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    {language === 'fr' ? 'Marquer comme absent (négatif pertinent)' : 'Mark as absent (pertinent negative)'}
                  </label>
                </div>
                
                {!isNegative && (
                  <select
                    value={newSymptomSeverity}
                    onChange={e => setNewSymptomSeverity(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'fr' ? 'Sévérité (optionnel)' : 'Severity (optional)'}</option>
                    <option value="mild">{language === 'fr' ? 'Léger' : 'Mild'}</option>
                    <option value="moderate">{language === 'fr' ? 'Modéré' : 'Moderate'}</option>
                    <option value="severe">{language === 'fr' ? 'Sévère' : 'Severe'}</option>
                  </select>
                )}
                
                <input 
                  type="text" 
                  value={newSymptomNote} 
                  onChange={e => setNewSymptomNote(e.target.value)}
                  placeholder={language === 'fr' ? 'Détails supplémentaires (optionnel)' : 'Additional details (optional)'}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
            
            <div className="flex gap-2">
              <Button
                onClick={handleAddSymptom}
                disabled={!newSymptomKey}
                size="sm"
              >
                <Plus className="w-4 h-4" />
                {language === 'fr' ? 'Ajouter' : 'Add'}
              </Button>
              <Button
                onClick={() => {
                  setShowAddForm(false);
                  setNewSymptomSystem('');
                  setNewSymptomKey('');
                  setNewSymptomSeverity('');
                  setNewSymptomNote('');
                  setIsNegative(false);
                }}
                variant="outline"
                size="sm"
              >
                {language === 'fr' ? 'Annuler' : 'Cancel'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-t pt-4 mt-4">
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              {language === 'fr' ? 'Ajouter un symptôme' : 'Add Symptom'}
            </Button>
          </div>
        )}
      </div>

      {/* Generate button */}
      <div className="text-center">
        <Button 
          onClick={handleGenerateHpi}
          disabled={allSymptoms.length === 0}
        >
          {language === 'fr' ? 'Générer HMA' : 'Generate HPI'}
        </Button>
      </div>
    </div>
  );
}

export default HpiSection;