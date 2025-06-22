import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Plus, X, ChevronDown, ChevronUp, Expand, Minimize, Trash2, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FocusStableInput } from './FocusStableInput';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
import { v4 as uuidv4 } from 'uuid';
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

export interface PMHEntry {
  id: string;
  mainCondition: string;
  subEntries: string[];
}

export interface PMHData {
  entries: PMHEntry[];
}

interface ImprovedPMHSectionProps {
  data: PMHData;
  onChange: (data: PMHData) => void;
}

function DraggablePMHEntry({ entry, children }: { entry: PMHEntry; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id });
  
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className="relative"
    >
      <div {...attributes} {...listeners} className="absolute left-2 top-4 cursor-grab hover:cursor-grabbing z-10">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      <div className="pl-8">{children}</div>
    </div>
  );
}

export function ImprovedPMHSection({ data, onChange }: ImprovedPMHSectionProps) {
  const { language } = useLanguage();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [focusedMainEntry, setFocusedMainEntry] = useState<string | null>(null);
  const { preserveScrollPosition, restoreScrollPosition, setContainer } = useScrollPreservation();

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
      setExpandedEntries(new Set(initialEntries.map(e => e.id)));
    }
  }, [data.entries.length, onChange]);



  const updateMainCondition = useCallback((entryId: string, value: string) => {
    preserveScrollPosition();
    
    const updatedEntries = data.entries.map(entry =>
      entry.id === entryId ? { ...entry, mainCondition: value } : entry
    );

    // Remove auto-expand from typing - only expand via focus

    // Add new entry if last entry is being filled
    const lastEntry = updatedEntries[updatedEntries.length - 1];
    if (lastEntry && lastEntry.id === entryId && value.trim() && lastEntry.mainCondition === '') {
      const newEntry: PMHEntry = {
        id: uuidv4(),
        mainCondition: '',
        subEntries: ['', '', '']
      };
      updatedEntries.push(newEntry);
    }

    onChange({ entries: updatedEntries });
    restoreScrollPosition();
  }, [data.entries, expandedEntries, onChange, preserveScrollPosition, restoreScrollPosition]);

  const updateSubEntry = useCallback((entryId: string, subIndex: number, value: string) => {
    preserveScrollPosition();
    
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId) {
        const newSubEntries = [...entry.subEntries];
        newSubEntries[subIndex] = value;
        
        // Add new sub-entry if typing in the last one
        if (subIndex === newSubEntries.length - 1 && value.trim()) {
          newSubEntries.push('');
        }
        
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });

    onChange({ entries: updatedEntries });
    restoreScrollPosition();
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);

  const addNewEntry = useCallback(() => {
    preserveScrollPosition();
    
    const newEntry: PMHEntry = {
      id: uuidv4(),
      mainCondition: '',
      subEntries: ['', '', '']
    };
    
    const newEntries = [...data.entries, newEntry];
    onChange({ entries: newEntries });
    
    // Expand the new entry
    setExpandedEntries(prev => new Set([...prev, newEntry.id]));
    restoreScrollPosition();
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);

  const deleteEntry = useCallback((entryId: string) => {
    preserveScrollPosition();
    
    let updatedEntries = data.entries.filter(entry => entry.id !== entryId);
    
    // Ensure minimum of 3 entries
    while (updatedEntries.length < 3) {
      updatedEntries.push({
        id: uuidv4(),
        mainCondition: '',
        subEntries: ['', '', '']
      });
    }
    
    onChange({ entries: updatedEntries });
    
    // Remove from expanded entries
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(entryId);
      return newSet;
    });
    
    restoreScrollPosition();
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);

  const removeSubEntry = useCallback((entryId: string, subIndex: number) => {
    preserveScrollPosition();
    
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId && entry.subEntries.length > 3) {
        return {
          ...entry,
          subEntries: entry.subEntries.filter((_, index) => index !== subIndex)
        };
      }
      return entry;
    });
    
    onChange({ entries: updatedEntries });
    restoreScrollPosition();
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);

  const toggleEntry = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  const toggleAllEntries = useCallback(() => {
    if (allExpanded) {
      setExpandedEntries(new Set());
    } else {
      const allIds = new Set(data.entries.filter(e => e.mainCondition.trim()).map(entry => entry.id));
      setExpandedEntries(allIds);
    }
    setAllExpanded(!allExpanded);
  }, [allExpanded, data.entries]);

  const clearAllEntries = useCallback(() => {
    const clearedEntries: PMHEntry[] = [
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
    ];
    onChange({ entries: clearedEntries });
    setExpandedEntries(new Set(clearedEntries.map(e => e.id)));
  }, [onChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      preserveScrollPosition();
      
      const oldIndex = data.entries.findIndex(e => e.id === active.id);
      const newIndex = data.entries.findIndex(e => e.id === over?.id);
      const newEntries = arrayMove(data.entries, oldIndex, newIndex);
      
      onChange({ entries: newEntries });
      restoreScrollPosition();
    }
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);



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
              ({data.entries.filter(entry => entry.mainCondition.trim()).length})
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
      
      <CardContent className="p-6 space-y-4" ref={setContainer}>
        <Button onClick={addNewEntry} variant="outline" className="w-full">
          <Plus className="w-4 h-4 mr-2" /> 
          {language === 'fr' ? 'Ajouter un antécédent' : 'Add Medical History'}
        </Button>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={data.entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.entries.map((entry, entryIndex) => (
                <DraggablePMHEntry key={entry.id} entry={entry}>
                  <div
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      entry.mainCondition.trim() 
                        ? 'border-indigo-200 bg-indigo-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        entry.mainCondition.trim() 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {entryIndex + 1}
                      </div>
                      <FocusStableInput
                        value={entry.mainCondition}
                        onChange={(value) => updateMainCondition(entry.id, value)}
                        placeholder={language === 'fr' ? 'Entrer l\'antécédent médical principal...' : 'Enter main medical condition...'}
                        className="flex-1 font-medium px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                      <div className="flex items-center space-x-1">
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
                      </div>
                    </div>

                    {expandedEntries.has(entry.id) && (
                      <div className="ml-11 space-y-2">
                        <Label className="text-sm text-indigo-700 font-medium">
                          {language === 'fr' ? 'Détails supplémentaires:' : 'Additional details:'}
                        </Label>
                        {entry.subEntries.map((subEntry, subIndex) => (
                          <div key={`${entry.id}-${subIndex}`} className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full flex-shrink-0 mt-2"></div>
                            <FocusStableInput
                              value={subEntry}
                              onChange={(value) => updateSubEntry(entry.id, subIndex, value)}
                              placeholder={language === 'fr' ? 'Ajouter des détails...' : 'Add details...'}
                              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                </DraggablePMHEntry>
              ))}
            </div>
          </SortableContext>
        </DndContext>

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