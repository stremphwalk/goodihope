import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Plus, X, ChevronDown, ChevronUp, Expand, Minimize, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { v4 as uuidv4 } from 'uuid';

export interface PMHEntry {
  id: string;
  mainCondition: string;
  subEntries: string[];
}

export interface PMHData {
  entries: PMHEntry[];
}

interface PastMedicalHistorySectionProps {
  data: PMHData;
  onChange: (data: PMHData) => void;
}

export function PastMedicalHistorySection({ data, onChange }: PastMedicalHistorySectionProps) {
  const { language } = useLanguage();
  const [localEntries, setLocalEntries] = useState<PMHEntry[]>(data.entries);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Sync with parent prop `data`
  useEffect(() => {
    setLocalEntries(data.entries);
  }, [data.entries]);

  // Initialize with 3 empty entries if no data exists
  useEffect(() => {
    if (data.entries && data.entries.length === 0) {
      const initialEntries: PMHEntry[] = [
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      ];
      onChange({ entries: initialEntries });
      setExpandedEntries(new Set([initialEntries[0].id]));
    }
  }, [data.entries, onChange]);

  const handleMainConditionChange = (entryId: string, value: string) => {
    setLocalEntries(prev => 
      prev.map(entry =>
        entry.id === entryId ? { ...entry, mainCondition: value } : entry
      )
    );
  };

  const handleSubEntryChange = (entryId: string, subIndex: number, value: string) => {
    setLocalEntries(prev =>
      prev.map(entry => {
        if (entry.id === entryId) {
          const newSubEntries = [...entry.subEntries];
          newSubEntries[subIndex] = value;
          
          if (subIndex === newSubEntries.length - 1 && value.trim()) {
            newSubEntries.push('');
          }
          
          return { ...entry, subEntries: newSubEntries };
        }
        return entry;
      })
    );
  };

  const syncChanges = (updatedEntries: PMHEntry[]) => {
    if (JSON.stringify(updatedEntries) !== JSON.stringify(data.entries)) {
      onChange({ entries: updatedEntries });
    }
  };

  const handleFocusLeaveEntry = (entry: PMHEntry, entryIndex: number) => {
    let finalEntries = [...localEntries];

    if (entryIndex === finalEntries.length - 1 && entry.mainCondition.trim()) {
        const newId = uuidv4();
        finalEntries.push({ id: newId, mainCondition: '', subEntries: ['', '', ''] });
        setExpandedEntries(new Set([newId]));
    }
    syncChanges(finalEntries);
  };

  const addNewEntry = () => {
    const newId = uuidv4();
    const newEntries = [...localEntries, { id: newId, mainCondition: '', subEntries: ['', '', ''] }];
    setLocalEntries(newEntries);
    onChange({ entries: newEntries });
    setExpandedEntries(new Set([newId]));
  };

  const clearAllEntries = () => {
    const clearedEntries: PMHEntry[] = [
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
    ];
    setLocalEntries(clearedEntries);
    onChange({ entries: clearedEntries });
    setExpandedEntries(new Set([clearedEntries[0].id]));
  };

  const toggleEntry = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const toggleAllEntries = () => {
    if (allExpanded) {
      setExpandedEntries(new Set());
    } else {
      const allIds = new Set(localEntries.filter(e => e.mainCondition.trim()).map(entry => entry.id));
      setExpandedEntries(allIds);
    }
    setAllExpanded(!allExpanded);
  };

  const deleteEntry = (entryId: string) => {
    let updatedEntries = localEntries.filter(entry => entry.id !== entryId);
    
    while (updatedEntries.length < 3) {
      updatedEntries.push({ id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] });
    }
    
    setLocalEntries(updatedEntries);
    onChange({ entries: updatedEntries });
    
    const newExpanded = new Set(expandedEntries);
    newExpanded.delete(entryId);
    setExpandedEntries(newExpanded);
  };

  const removeSubEntry = (entryId: string, subIndex: number) => {
    const updatedEntries = localEntries.map(entry => {
      if (entry.id === entryId && entry.subEntries.length > 3) {
        const newSubEntries = entry.subEntries.filter((_, index) => index !== subIndex);
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });
    
    setLocalEntries(updatedEntries);
    onChange({ entries: updatedEntries });
  };

  return (
    <Card className="overflow-hidden border-2 border-gray-200">
       <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="text-white w-5 h-5" />
            <h3 className="text-lg font-semibold text-white">
              {language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
            </h3>
            <span className="text-white/80 text-sm">
              ({localEntries.filter(entry => entry.mainCondition.trim()).length})
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAllEntries}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
            >
              {allExpanded ? <Minimize className="w-3 h-3" /> : <Expand className="w-3 h-3" />}
              <span>{allExpanded ? (language === 'fr' ? 'Réduire' : 'Collapse') : (language === 'fr' ? 'Étendre' : 'Expand')}</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllEntries}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        
        <Button onClick={addNewEntry} variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" /> {language === 'fr' ? 'Ajouter un antécédent' : 'Add Medical History'}
        </Button>

        <div className="space-y-4">
          {localEntries.map((entry, entryIndex) => (
            <div
              key={entry.id}
              className={`pmh-entry-container p-4 border-2 rounded-lg transition-all duration-200 ${
                entry.mainCondition.trim() 
                  ? 'border-indigo-200 bg-indigo-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    handleFocusLeaveEntry(entry, entryIndex);
                }
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  entry.mainCondition.trim() 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-400 text-white'
                }`}>
                  {entryIndex + 1}
                </div>
                <Input
                  placeholder={language === 'fr' ? 'Entrer l\'antécédent médical principal...' : 'Enter main medical condition...'}
                  value={entry.mainCondition}
                  onChange={(e) => handleMainConditionChange(entry.id, e.target.value)}
                  onClick={() => {
                    if (!expandedEntries.has(entry.id)) {
                      setExpandedEntries(new Set([entry.id]));
                    }
                  }}
                  className="flex-1 font-medium"
                />
                <div className="flex items-center space-x-1">
                  {entry.mainCondition.trim() && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEntry(entry.id)}
                        className="h-8 w-8 p-0 text-indigo-600 hover:text-indigo-800"
                      >
                        {expandedEntries.has(entry.id) ? 
                          <ChevronUp className="w-4 h-4" /> : 
                          <ChevronDown className="w-4 h-4" />
                        }
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {entry.mainCondition.trim() && expandedEntries.has(entry.id) && (
                <div className="ml-11 space-y-2">
                  <Label className="text-sm text-indigo-700 font-medium">
                    {language === 'fr' ? 'Détails supplémentaires:' : 'Additional details:'}
                  </Label>
                  {entry.subEntries.map((subEntry, subIndex) => (
                    <div key={`${entry.id}-${subIndex}`} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-2"></div>
                      <Input
                        placeholder={language === 'fr' ? 'Ajouter des détails...' : 'Add details...'}
                        value={subEntry}
                        onChange={(e) => handleSubEntryChange(entry.id, subIndex, e.target.value)}
                        className="flex-1 text-sm"
                      />
                      {entry.subEntries.length > 3 && subIndex >= 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubEntry(entry.id, subIndex)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>{language === 'fr' ? 'Instructions:' : 'Instructions:'}</strong>{' '}
            {language === 'fr' 
              ? 'Entrez les conditions médicales principales dans les boîtes numérotées. Ajoutez des détails dans les sous-entrées en retrait. De nouvelles boîtes apparaîtront automatiquement selon vos besoins.'
              : 'Enter main medical conditions in numbered boxes. Add details in indented sub-entries. New boxes will appear automatically as needed.'
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
