import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
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
  onChange: (data: PMHData | ((prevData: PMHData) => PMHData)) => void;
  expandedEntries: Set<string>;
  setExpandedEntries: (entries: Set<string>) => void;
  allExpanded: boolean;
  setAllExpanded: (val: boolean) => void;
}

// Memoized input component to prevent re-renders
const StableInput = React.memo(({ 
  value, 
  onChange, 
  onBlur, 
  onKeyDown, 
  placeholder, 
  className,
  inputRef 
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}) => {
  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
});

StableInput.displayName = 'StableInput';

export function PastMedicalHistorySection({ 
  data, 
  onChange, 
  expandedEntries, 
  setExpandedEntries, 
  allExpanded, 
  setAllExpanded 
}: PastMedicalHistorySectionProps) {
  const { language } = useLanguage();
  const [localData, setLocalData] = useState(data);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local data with parent data only when not typing
  useEffect(() => {
    if (!isTyping) {
      setLocalData(data);
    }
  }, [data, isTyping]);

  // Initialize with empty entries if needed
  useEffect(() => {
    if (localData.entries.length === 0) {
      const initialEntries: PMHEntry[] = [
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      ];
      setLocalData({ entries: initialEntries });
      onChange({ entries: initialEntries });
      setExpandedEntries(new Set([initialEntries[0].id]));
    }
  }, [localData.entries.length, onChange, setExpandedEntries]);

  // Update parent data when typing stops
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        if (JSON.stringify(localData) !== JSON.stringify(data)) {
          onChange(localData);
        }
      }, 500);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [localData, data, onChange, isTyping]);

  // Stable handlers with useCallback
  const updateMainCondition = useCallback((entryId: string, value: string) => {
    setIsTyping(true);
    setLocalData(prevData => ({
      entries: prevData.entries.map(entry =>
        entry.id === entryId ? { ...entry, mainCondition: value } : entry
      )
    }));
  }, []);

  const updateSubEntry = useCallback((entryId: string, subIndex: number, value: string) => {
    setIsTyping(true);
    setLocalData(prevData => ({
      entries: prevData.entries.map(entry => {
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
      })
    }));
  }, []);

  const handleMainConditionBlur = useCallback((entryId: string) => {
    const entryIndex = localData.entries.findIndex(entry => entry.id === entryId);
    const entry = localData.entries[entryIndex];
    
    // Add new entry if this is the last entry and it's filled
    if (entryIndex === localData.entries.length - 1 && entry.mainCondition.trim()) {
      const newId = uuidv4();
      setLocalData(prevData => ({
        entries: [...prevData.entries, { id: newId, mainCondition: '', subEntries: ['', '', ''] }]
      }));
      setExpandedEntries(new Set([newId]));
    }
  }, [localData.entries, setExpandedEntries]);

  const removeSubEntry = useCallback((entryId: string, subIndex: number) => {
    setLocalData(prevData => ({
      entries: prevData.entries.map(entry => {
        if (entry.id === entryId) {
          const newSubEntries = entry.subEntries.filter((_, index) => index !== subIndex);
          // Ensure we always have at least 3 empty entries
          while (newSubEntries.length < 3) {
            newSubEntries.push('');
          }
          return { ...entry, subEntries: newSubEntries };
        }
        return entry;
      })
    }));
  }, []);

  const deleteEntry = useCallback((entryId: string) => {
    setLocalData(prevData => {
      const updatedEntries = prevData.entries.filter(entry => entry.id !== entryId);
      
      // Ensure we have at least 3 entries
      const finalEntries = [...updatedEntries];
      while (finalEntries.length < 3) {
        finalEntries.push({
          id: uuidv4(),
          mainCondition: '',
          subEntries: ['', '', '']
        });
      }
      
      return { entries: finalEntries };
    });
    
    // Remove from expanded entries
    const newExpanded = new Set(expandedEntries);
    newExpanded.delete(entryId);
    setExpandedEntries(newExpanded);
  }, [setExpandedEntries, expandedEntries]);

  const toggleEntry = useCallback((entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  }, [setExpandedEntries, expandedEntries]);

  const addNewEntry = useCallback(() => {
    const newId = uuidv4();
    setLocalData(prevData => ({
      entries: [...prevData.entries, { id: newId, mainCondition: '', subEntries: ['', '', ''] }]
    }));
    setExpandedEntries(new Set([newId]));
  }, [setExpandedEntries]);

  const moveEntryUp = useCallback((entryId: string) => {
    setLocalData(prevData => {
      const index = prevData.entries.findIndex(e => e.id === entryId);
      if (index > 0) {
        const newEntries = [...prevData.entries];
        [newEntries[index - 1], newEntries[index]] = [newEntries[index], newEntries[index - 1]];
        return { entries: newEntries };
      }
      return prevData;
    });
  }, []);

  const moveEntryDown = useCallback((entryId: string) => {
    setLocalData(prevData => {
      const index = prevData.entries.findIndex(e => e.id === entryId);
      if (index < prevData.entries.length - 1) {
        const newEntries = [...prevData.entries];
        [newEntries[index], newEntries[index + 1]] = [newEntries[index + 1], newEntries[index]];
        return { entries: newEntries };
      }
      return prevData;
    });
  }, []);

  const toggleAllEntries = useCallback(() => {
    if (allExpanded) {
      setExpandedEntries(new Set());
      setAllExpanded(false);
    } else {
      const allIds = localData.entries.filter(e => e.mainCondition.trim()).map(e => e.id);
      setExpandedEntries(new Set(allIds));
      setAllExpanded(true);
    }
  }, [allExpanded, localData.entries, setExpandedEntries, setAllExpanded]);

  // Memoize the entries to prevent unnecessary re-renders
  const memoizedEntries = useMemo(() => {
    return localData.entries.map((entry, entryIndex) => {
      // Create stable handlers for this specific entry
      const handleMainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateMainCondition(entry.id, e.target.value);
      };
      
      const handleMainBlur = () => {
        handleMainConditionBlur(entry.id);
      };
      
      const handleMainKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleMainConditionBlur(entry.id);
        }
      };

      return (
        <div
          key={entry.id}
          className={`p-4 border-2 rounded-lg transition-all duration-200 ${
            entry.mainCondition.trim() 
              ? 'border-indigo-200 bg-indigo-50' 
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          {/* Entry Number and Main Condition */}
          <div className="flex items-start space-x-3 mb-3">
            <div className="flex flex-col items-center space-y-1 mt-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                entry.mainCondition.trim() 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-400 text-white'
              }`}>
                {entryIndex + 1}
              </div>
              {/* Simple reorder buttons */}
              {entry.mainCondition.trim() && (
                <div className="flex flex-col space-y-0.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveEntryUp(entry.id)}
                    disabled={entryIndex === 0}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveEntryDown(entry.id)}
                    disabled={entryIndex === localData.entries.length - 1}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-700"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex-1">
              <StableInput
                value={entry.mainCondition}
                onChange={handleMainChange}
                onBlur={handleMainBlur}
                onKeyDown={handleMainKeyDown}
                placeholder={language === 'fr' ? 'Entrer la condition principale...' : 'Enter main condition...'}
                className="font-medium"
              />
            </div>
            
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
            <div className="ml-11 space-y-3">
              <Label className="text-sm text-indigo-700 font-medium">
                {language === 'fr' ? 'Détails supplémentaires:' : 'Additional details:'}
              </Label>
              <div className="space-y-2">
                {entry.subEntries.map((subEntry, subIndex) => {
                  // Create stable handler for this specific sub-entry
                  const handleSubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
                    updateSubEntry(entry.id, subIndex, e.target.value);
                  };

                  return (
                    <div key={`${entry.id}-${subIndex}`} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-2"></div>
                      <div className="flex-1">
                        <StableInput
                          value={subEntry}
                          onChange={handleSubChange}
                          placeholder={language === 'fr' ? 'Entrer un détail...' : 'Enter detail...'}
                          className="w-full"
                        />
                      </div>
                      {subEntry.trim() && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubEntry(entry.id, subIndex)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      );
    });
  }, [localData.entries, expandedEntries, language, updateMainCondition, updateSubEntry, handleMainConditionBlur, removeSubEntry, deleteEntry, toggleEntry, moveEntryUp, moveEntryDown]);

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          {language === 'fr' ? 'Antécédents Médicaux' : 'Past Medical History'}
        </h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAllEntries}
            className="text-sm"
          >
            {allExpanded 
              ? (language === 'fr' ? 'Réduire tout' : 'Collapse All')
              : (language === 'fr' ? 'Étendre tout' : 'Expand All')
            }
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={addNewEntry}
            className="text-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            {language === 'fr' ? 'Ajouter' : 'Add Entry'}
          </Button>
        </div>
      </div>

      {/* Entries */}
      <div className="space-y-4">
        {memoizedEntries}
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
    </div>
  );
}
