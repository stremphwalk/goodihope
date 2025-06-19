import React, { useState, useEffect, useCallback, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { wrapText } from '@/lib/textFormatting';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Memoized input component to prevent unnecessary re-renders
const StableInput = memo(function StableInput({
  value,
  onChange,
  onBlur,
  onKeyDown,
  placeholder,
  className
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <Input
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={className}
    />
  );
});

// Draggable wrapper for main entries
function DraggableMainEntry({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="relative"
      {...attributes}
    >
      <div {...listeners} className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab pr-2 z-10">
        <GripVertical className="text-gray-400" />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

// Draggable wrapper for sub entries
function DraggableSubEntry({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="relative"
      {...attributes}
    >
      <div {...listeners} className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab pr-2 z-10">
        <GripVertical className="text-gray-400" />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

export function PastMedicalHistorySection({ 
  data, 
  onChange, 
  expandedEntries, 
  setExpandedEntries, 
  allExpanded, 
  setAllExpanded 
}: PastMedicalHistorySectionProps) {
  const { language } = useLanguage();
  const sensors = useSensors(useSensor(PointerSensor));

  // Initialize with empty entries if needed
  useEffect(() => {
    if (data.entries.length === 0) {
      const initialEntries: PMHEntry[] = [
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      ];
      onChange({ entries: initialEntries });
      setExpandedEntries(new Set([initialEntries[0].id]));
    }
  }, [data.entries.length, onChange, setExpandedEntries]);

  // Stable handlers using functional updates
  const handleMainConditionChange = useCallback((entryId: string) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange(prevData => ({
        entries: prevData.entries.map(entry =>
          entry.id === entryId ? { ...entry, mainCondition: value } : entry
        )
      }));
    };
  }, [onChange]);

  const handleSubEntryChange = useCallback((entryId: string, subIndex: number) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      onChange(prevData => ({
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
    };
  }, [onChange]);

  const handleMainConditionBlur = useCallback((entryId: string) => {
    return () => {
      const entryIndex = data.entries.findIndex(entry => entry.id === entryId);
      const entry = data.entries[entryIndex];
      
      // Add new entry if this is the last entry and it's filled
      if (entryIndex === data.entries.length - 1 && entry.mainCondition.trim()) {
        const newId = uuidv4();
        onChange(prevData => ({
          entries: [...prevData.entries, { id: newId, mainCondition: '', subEntries: ['', '', ''] }]
        }));
        setExpandedEntries(new Set([newId]));
      }
    };
  }, [data.entries, onChange, setExpandedEntries]);

  const handleMainConditionKeyDown = useCallback((entryId: string) => {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleMainConditionBlur(entryId)();
      }
    };
  }, [handleMainConditionBlur]);

  const removeSubEntry = useCallback((entryId: string, subIndex: number) => {
    onChange(prevData => ({
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
  }, [onChange]);

  const deleteEntry = useCallback((entryId: string) => {
    onChange(prevData => {
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
    setExpandedEntries(prev => {
      const newExpanded = new Set(prev);
      newExpanded.delete(entryId);
      return newExpanded;
    });
  }, [onChange, setExpandedEntries]);

  const toggleEntry = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(entryId)) {
        newExpanded.delete(entryId);
      } else {
        newExpanded.add(entryId);
      }
      return newExpanded;
    });
  }, [setExpandedEntries]);

  const handleMainDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      onChange(prevData => {
        const oldIndex = prevData.entries.findIndex(e => e.id === active.id);
        const newIndex = prevData.entries.findIndex(e => e.id === over?.id);
        return { entries: arrayMove(prevData.entries, oldIndex, newIndex) };
      });
    }
  }, [onChange]);

  const handleSubDragEnd = useCallback((entryId: string) => {
    return (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id) {
        onChange(prevData => ({
          entries: prevData.entries.map(entry => {
            if (entry.id === entryId) {
              const oldIndex = entry.subEntries.findIndex((_, i) => `${entryId}-sub-${i}` === active.id);
              const newIndex = entry.subEntries.findIndex((_, i) => `${entryId}-sub-${i}` === over?.id);
              return { ...entry, subEntries: arrayMove(entry.subEntries, oldIndex, newIndex) };
            }
            return entry;
          })
        }));
      }
    };
  }, [onChange]);

  const generatePMHText = useCallback(() => {
    const filledEntries = data.entries.filter(entry => entry.mainCondition.trim());
    
    if (filledEntries.length === 0) {
      return language === 'fr' 
        ? "ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]"
        : "PAST MEDICAL HISTORY:\n[Enter past medical history]";
    }
    
    let pmhText = language === 'fr' ? "ANTÉCÉDENTS MÉDICAUX :\n" : "PAST MEDICAL HISTORY:\n";
    
    filledEntries.forEach((entry, index) => {
      const mainCondition = wrapText(entry.mainCondition);
      pmhText += `${index + 1}. ${mainCondition}\n`;
      
      const filledSubEntries = entry.subEntries.filter(sub => sub.trim());
      filledSubEntries.forEach(subEntry => {
        const wrappedSubEntry = wrapText(subEntry, "     - ", "       ");
        pmhText += `${wrappedSubEntry}\n`;
      });
    });
    
    return pmhText.trim();
  }, [data.entries, language]);

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMainDragEnd}>
        <SortableContext items={data.entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {data.entries.map((entry, entryIndex) => (
              <DraggableMainEntry key={entry.id} id={entry.id}>
                <div
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
                    <StableInput
                      value={entry.mainCondition}
                      onChange={handleMainConditionChange(entry.id)}
                      onBlur={handleMainConditionBlur(entry.id)}
                      onKeyDown={handleMainConditionKeyDown(entry.id)}
                      placeholder={language === 'fr' ? 'Entrer la condition principale...' : 'Enter main condition...'}
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
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd(entry.id)}>
                      <SortableContext items={entry.subEntries.map((_, i) => `${entry.id}-sub-${i}`)} strategy={verticalListSortingStrategy}>
                        <div className="ml-11 space-y-2">
                          <Label className="text-sm text-indigo-700 font-medium">
                            {language === 'fr' ? 'Détails supplémentaires:' : 'Additional details:'}
                          </Label>
                          {entry.subEntries.map((subEntry, subIndex) => (
                            <DraggableSubEntry key={`${entry.id}-sub-${subIndex}`} id={`${entry.id}-sub-${subIndex}`}>
                              <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-2"></div>
                                <StableInput
                                  value={subEntry}
                                  onChange={handleSubEntryChange(entry.id, subIndex)}
                                  placeholder={language === 'fr' ? 'Entrer un détail...' : 'Enter detail...'}
                                  className="flex-1"
                                />
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
                            </DraggableSubEntry>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </DraggableMainEntry>
            ))}
          </div>
        </SortableContext>
      </DndContext>

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