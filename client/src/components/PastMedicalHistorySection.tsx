import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Plus, X, ChevronDown, ChevronUp, Expand, Minimize, Trash2, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { wrapText, formatSection, formatList } from '@/lib/textFormatting';
// dnd-kit imports
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
  onChange: (data: PMHData) => void;
  expandedEntries: Set<string>;
  setExpandedEntries: (entries: Set<string>) => void;
  allExpanded: boolean;
  setAllExpanded: (val: boolean) => void;
}

interface MemoizedInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  className?: string;
  onClick?: () => void;
}

const MemoizedInput = memo(({ value, onChange, placeholder, className, onClick, onBlur, onKeyDown }: MemoizedInputProps & { onBlur?: () => void; onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void }) => {
  return (
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      onClick={onClick}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
    />
  );
}, (prevProps, nextProps) => {
  // Only re-render if value or placeholder actually changed
  return prevProps.value === nextProps.value && 
         prevProps.placeholder === nextProps.placeholder &&
         prevProps.className === nextProps.className;
});

MemoizedInput.displayName = 'MemoizedInput';

function DraggablePMHEntry({ entry, entryIndex, children, id }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      className="relative"
    >
      <div {...listeners} className="absolute left-0 top-0 bottom-0 flex items-center cursor-grab pl-1 pr-2 z-10">
        <GripVertical className="text-gray-400" />
      </div>
      <div className="pl-7">{children}</div>
    </div>
  );
}

function DraggableSubEntry({ id, children }: any) {
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

export function PastMedicalHistorySection({ data, onChange, expandedEntries, setExpandedEntries, allExpanded, setAllExpanded }: PastMedicalHistorySectionProps) {
  const { language } = useLanguage();

  // dnd-kit sensors
  const sensors = useSensors(useSensor(PointerSensor));

  // Initialize with 3 empty entries if no data exists
  useEffect(() => {
    if (data.entries.length === 0) {
      const initialEntries: PMHEntry[] = [
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
        { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      ];
      onChange({ entries: initialEntries });
      // Initially expand the first entry
      setExpandedEntries(new Set(['1']));
    }
  }, [data.entries.length, onChange]);

  const updateMainCondition = useCallback((entryId: string, value: string) => {
    const updatedEntries = data.entries.map(entry => 
      entry.id === entryId ? { ...entry, mainCondition: value } : entry
    );
    onChange({ entries: updatedEntries });
  }, [data.entries, onChange]);

  const handleMainConditionBlur = (entryId: string) => {
    // Only add a new entry if this is the last entry and it's filled
    const entryIndex = data.entries.findIndex(entry => entry.id === entryId);
    if (entryIndex === data.entries.length - 1 && data.entries[entryIndex].mainCondition.trim()) {
      const newId = uuidv4();
      const updatedEntries = [
        ...data.entries,
        { id: newId, mainCondition: '', subEntries: ['', '', ''] }
      ];
      onChange({ entries: updatedEntries });
      setExpandedEntries(new Set([newId]));
    }
  };

  const updateSubEntry = useCallback((entryId: string, subIndex: number, value: string) => {
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId) {
        const newSubEntries = [...entry.subEntries];
        newSubEntries[subIndex] = value;
        
        // If this entry is empty and there are non-empty entries below it, reorder
        if (!value.trim()) {
          const nonEmptyEntries = newSubEntries.filter((entry, idx) => idx > subIndex && entry.trim());
          if (nonEmptyEntries.length > 0) {
            // Remove this empty entry
            newSubEntries.splice(subIndex, 1);
            // Add it back at the end
            newSubEntries.push('');
          }
        }
        
        // Add new sub-entry if the last one is filled
        if (subIndex === newSubEntries.length - 1 && value.trim()) {
          newSubEntries.push('');
        }
        
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });
    
    onChange({ entries: updatedEntries });
  }, [data.entries, onChange]);

  const removeSubEntry = (entryId: string, subIndex: number) => {
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId) {
        const newSubEntries = entry.subEntries.filter((_, index) => index !== subIndex);
        // Ensure we always have at least 3 empty entries
        while (newSubEntries.length < 3) {
          newSubEntries.push('');
        }
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });
    
    onChange({ entries: updatedEntries });
  };

  const clearAllEntries = () => {
    const clearedEntries: PMHEntry[] = [
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
      { id: uuidv4(), mainCondition: '', subEntries: ['', '', ''] },
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
      const newId = uuidv4();
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

  // Main entry drag end
  const handleMainDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = data.entries.findIndex(e => e.id === active.id);
      const newIndex = data.entries.findIndex(e => e.id === over?.id);
      const newEntries = arrayMove(data.entries, oldIndex, newIndex);
      onChange({ entries: newEntries });
    }
  };

  // Sub-entry drag end
  const handleSubDragEnd = (entryId: string) => (event: DragEndEvent) => {
    const entry = data.entries.find(e => e.id === entryId);
    if (!entry) return;
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = entry.subEntries.findIndex((_, i) => `${entryId}-sub-${i}` === active.id);
      const newIndex = entry.subEntries.findIndex((_, i) => `${entryId}-sub-${i}` === over?.id);
      const newSubEntries = arrayMove(entry.subEntries, oldIndex, newIndex);
      const newEntries = data.entries.map(e => e.id === entryId ? { ...e, subEntries: newSubEntries } : e);
      onChange({ entries: newEntries });
    }
  };

  const generatePMHText = () => {
    const filledEntries = data.entries.filter(entry => entry.mainCondition.trim());
    
    if (filledEntries.length === 0) {
      return language === 'fr' 
        ? "ANTÉCÉDENTS MÉDICAUX :\n[Entrer les antécédents médicaux]"
        : "PAST MEDICAL HISTORY:\n[Enter past medical history]";
    }
    
    let pmhText = language === 'fr' ? "ANTÉCÉDENTS MÉDICAUX :\n" : "PAST MEDICAL HISTORY:\n";
    
    filledEntries.forEach((entry, index) => {
      // Format main condition with proper wrapping
      const mainCondition = wrapText(entry.mainCondition);
      pmhText += `${index + 1}. ${mainCondition}\n`;
      
      // Format sub-entries with proper indentation and wrapping
      const filledSubEntries = entry.subEntries.filter(sub => sub.trim());
      filledSubEntries.forEach(subEntry => {
        // 5 spaces + dash for first line, 7 spaces for continuation
        const wrappedSubEntry = wrapText(subEntry, "     - ", "       ");
        pmhText += `${wrappedSubEntry}\n`;
      });
    });
    
    return pmhText.trim();
  };

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMainDragEnd}>
        <SortableContext items={data.entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {data.entries.map((entry, entryIndex) => (
              <DraggablePMHEntry key={entry.id} id={entry.id} entry={entry} entryIndex={entryIndex}>
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
                    <MemoizedInput
                      value={entry.mainCondition}
                      onChange={(e) => updateMainCondition(entry.id, e.target.value)}
                      placeholder={language === 'fr' ? 'Entrer la condition principale...' : 'Enter main condition...'}
                      onClick={() => {
                        if (!expandedEntries.has(entry.id)) {
                          setExpandedEntries(new Set([entry.id]));
                        }
                      }}
                      className="flex-1 font-medium"
                      onBlur={() => handleMainConditionBlur(entry.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleMainConditionBlur(entry.id);
                        }
                      }}
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
                                <MemoizedInput
                                  value={subEntry}
                                  onChange={(e) => updateSubEntry(entry.id, subIndex, e.target.value)}
                                  placeholder={language === 'fr' ? 'Entrer un détail...' : 'Enter detail...'}
                                  className="flex-1"
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeSubEntry(entry.id, subIndex)}
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </DraggableSubEntry>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </DraggablePMHEntry>
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