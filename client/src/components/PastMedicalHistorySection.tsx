import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Plus, X, ChevronDown, ChevronUp, Expand, Minimize, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Initialize with 3 empty entries if no data exists
  useEffect(() => {
    if (data.entries.length === 0) {
      const initialEntries: PMHEntry[] = [
        { id: '1', mainCondition: '', subEntries: ['', '', ''] },
        { id: '2', mainCondition: '', subEntries: ['', '', ''] },
        { id: '3', mainCondition: '', subEntries: ['', '', ''] },
      ];
      onChange({ entries: initialEntries });
      // Initially expand the first entry
      setExpandedEntries(new Set(['1']));
    }
  }, [data.entries.length, onChange]);

  const updateMainCondition = (entryId: string, value: string) => {
    const updatedEntries = data.entries.map(entry => 
      entry.id === entryId ? { ...entry, mainCondition: value } : entry
    );
    
    // Add new entry if the last entry's main condition is filled
    const lastEntry = updatedEntries[updatedEntries.length - 1];
    if (lastEntry && lastEntry.mainCondition.trim() && entryId === lastEntry.id) {
      const newId = (updatedEntries.length + 1).toString();
      updatedEntries.push({
        id: newId,
        mainCondition: '',
        subEntries: ['', '', '']
      });
      
      // Auto-expand the new entry and collapse the previous one
      setExpandedEntries(new Set([newId]));
    } else if (value.trim()) {
      // If user is filling an existing entry, expand it and collapse others
      setExpandedEntries(new Set([entryId]));
    }
    
    onChange({ entries: updatedEntries });
  };

  const updateSubEntry = (entryId: string, subIndex: number, value: string) => {
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId) {
        const newSubEntries = [...entry.subEntries];
        newSubEntries[subIndex] = value;
        
        // Add new sub-entry if the last one is filled
        if (subIndex === newSubEntries.length - 1 && value.trim()) {
          newSubEntries.push('');
        }
        
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });
    
    onChange({ entries: updatedEntries });
  };

  const removeSubEntry = (entryId: string, subIndex: number) => {
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId && entry.subEntries.length > 3) {
        const newSubEntries = entry.subEntries.filter((_, index) => index !== subIndex);
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });
    
    onChange({ entries: updatedEntries });
  };

  const clearAllEntries = () => {
    const clearedEntries: PMHEntry[] = [
      { id: '1', mainCondition: '', subEntries: ['', '', ''] },
      { id: '2', mainCondition: '', subEntries: ['', '', ''] },
      { id: '3', mainCondition: '', subEntries: ['', '', ''] },
    ];
    onChange({ entries: clearedEntries });
    setExpandedEntries(new Set(['1']));
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
      setAllExpanded(false);
    } else {
      const allIds = new Set(data.entries.map(entry => entry.id));
      setExpandedEntries(allIds);
      setAllExpanded(true);
    }
  };

  const deleteEntry = (entryId: string) => {
    const updatedEntries = data.entries.filter(entry => entry.id !== entryId);
    
    // If we have fewer than 3 entries after deletion, ensure we have at least 3 empty ones
    const finalEntries = [...updatedEntries];
    while (finalEntries.length < 3) {
      const newId = (Math.max(...finalEntries.map(e => parseInt(e.id) || 0), 0) + 1).toString();
      finalEntries.push({
        id: newId,
        mainCondition: '',
        subEntries: ['', '', '']
      });
    }
    
    onChange({ entries: finalEntries });
    
    // Remove from expanded entries if it was expanded
    const newExpanded = new Set(expandedEntries);
    newExpanded.delete(entryId);
    setExpandedEntries(newExpanded);
  };

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="text-white w-5 h-5" />
            <h3 className="text-lg font-semibold text-white">
              {language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
            </h3>
            <span className="text-white/80 text-sm">
              ({data.entries.filter(entry => entry.mainCondition.trim()).length})
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAllEntries}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors flex items-center space-x-1"
            >
              {allExpanded ? <Minimize className="w-3 h-3" /> : <Expand className="w-3 h-3" />}
              <span>{allExpanded ? (language === 'fr' ? 'Réduire tout' : 'Collapse All') : (language === 'fr' ? 'Développer tout' : 'Expand All')}</span>
            </button>
            <button
              onClick={clearAllEntries}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition-colors"
            >
              {language === 'fr' ? 'Effacer' : 'Clear'}
            </button>
          </div>
        </div>
      </div>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-4">
          {data.entries.map((entry, entryIndex) => (
            <div
              key={entry.id}
              className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                entry.mainCondition.trim() 
                  ? 'border-indigo-200 bg-indigo-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              {/* Entry Number and Main Condition */}
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
                  onChange={(e) => updateMainCondition(entry.id, e.target.value)}
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

              {/* Sub-entries */}
              {entry.mainCondition.trim() && expandedEntries.has(entry.id) && (
                <div className="ml-11 space-y-2">
                  <Label className="text-sm text-indigo-700 font-medium">
                    {language === 'fr' ? 'Détails supplémentaires:' : 'Additional details:'}
                  </Label>
                  {entry.subEntries.map((subEntry, subIndex) => (
                    <div key={subIndex} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-2"></div>
                      <Input
                        placeholder={language === 'fr' ? 'Ajouter des détails...' : 'Add details...'}
                        value={subEntry}
                        onChange={(e) => updateSubEntry(entry.id, subIndex, e.target.value)}
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

        {/* Instructions */}
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