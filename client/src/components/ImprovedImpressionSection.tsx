import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { FileText, Plus, X, ChevronDown, ChevronUp, Expand, Minimize, Trash2, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { FocusStableInput } from './FocusStableInput';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
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

export interface ImpressionEntry {
  id: string;
  mainImpression: string;
  subEntries: string[];
}

export interface ImpressionData {
  entries: ImpressionEntry[];
}

interface ImprovedImpressionSectionProps {
  data: ImpressionData;
  onChange: (data: ImpressionData) => void;
}

function DraggableImpressionEntry({ entry, children }: { entry: ImpressionEntry; children: React.ReactNode }) {
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
    >
      <div {...attributes} {...listeners} className="absolute left-0 top-2 cursor-grab hover:cursor-grabbing z-10">
        <GripVertical className="w-3 h-3 text-gray-400" />
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

export function ImprovedImpressionSection({ data, onChange }: ImprovedImpressionSectionProps) {
  const { language } = useLanguage();
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);
  const [focusedMainEntry, setFocusedMainEntry] = useState<string | null>(null);
  const { preserveScrollPosition, restoreScrollPosition, setContainer } = useScrollPreservation();

  const sensors = useSensors(useSensor(PointerSensor));

  // Initialize with empty entries if needed
  useEffect(() => {
    if (data.entries.length === 0) {
      const initialEntries: ImpressionEntry[] = [
        { id: '1', mainImpression: '', subEntries: ['', '', ''] },
        { id: '2', mainImpression: '', subEntries: ['', '', ''] },
        { id: '3', mainImpression: '', subEntries: ['', '', ''] },
      ];
      onChange({ entries: initialEntries });
      setExpandedEntries(new Set(['1', '2', '3']));
    }
  }, [data.entries.length, onChange]);



  const updateMainImpression = useCallback((entryId: string, value: string) => {
    preserveScrollPosition();
    
    const updatedEntries = data.entries.map(entry => 
      entry.id === entryId ? { ...entry, mainImpression: value } : entry
    );
    
    // Remove auto-expand from typing - only expand via focus
    
    // Add new entry if the last entry's main impression is filled
    const lastEntry = updatedEntries[updatedEntries.length - 1];
    if (lastEntry && lastEntry.mainImpression.trim() && entryId === lastEntry.id) {
      const newId = (updatedEntries.length + 1).toString();
      updatedEntries.push({
        id: newId,
        mainImpression: '',
        subEntries: ['', '', '']
      });
      
      // Expand the new entry
      setExpandedEntries(prev => new Set([...prev, newId]));
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
        
        // Add new sub-entry if the last one is filled
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

  const removeSubEntry = useCallback((entryId: string, subIndex: number) => {
    preserveScrollPosition();
    
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
    restoreScrollPosition();
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);

  const clearAllEntries = useCallback(() => {
    const clearedEntries: ImpressionEntry[] = [
      { id: '1', mainImpression: '', subEntries: ['', '', ''] },
      { id: '2', mainImpression: '', subEntries: ['', '', ''] },
      { id: '3', mainImpression: '', subEntries: ['', '', ''] },
    ];
    onChange({ entries: clearedEntries });
    setExpandedEntries(new Set(['1', '2', '3']));
  }, [onChange]);

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
      setAllExpanded(false);
    } else {
      const allIds = new Set(data.entries.map(entry => entry.id));
      setExpandedEntries(allIds);
      setAllExpanded(true);
    }
  }, [allExpanded, data.entries]);

  const deleteEntry = useCallback((entryId: string) => {
    preserveScrollPosition();
    
    const updatedEntries = data.entries.filter(entry => entry.id !== entryId);
    
    // If we have fewer than 3 entries after deletion, ensure we have at least 3 empty ones
    const finalEntries = [...updatedEntries];
    while (finalEntries.length < 3) {
      const newId = (Math.max(...finalEntries.map(e => parseInt(e.id) || 0), 0) + 1).toString();
      finalEntries.push({
        id: newId,
        mainImpression: '',
        subEntries: ['', '', '']
      });
    }
    
    onChange({ entries: finalEntries });
    
    // Remove from expanded entries if it was expanded
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(entryId);
      return newSet;
    });
    
    restoreScrollPosition();
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);

  // Main entry drag end
  const handleMainDragEnd = useCallback((event: DragEndEvent) => {
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

  // Sub-entry drag end
  const handleSubDragEnd = useCallback((entryId: string) => (event: DragEndEvent) => {
    const entry = data.entries.find(e => e.id === entryId);
    if (!entry) return;
    
    const { active, over } = event;
    if (active.id !== over?.id) {
      preserveScrollPosition();
      
      const oldIndex = entry.subEntries.findIndex((_, i) => `${entryId}-sub-${i}` === active.id);
      const newIndex = entry.subEntries.findIndex((_, i) => `${entryId}-sub-${i}` === over?.id);
      const newSubEntries = arrayMove(entry.subEntries, oldIndex, newIndex);
      const newEntries = data.entries.map(e => e.id === entryId ? { ...e, subEntries: newSubEntries } : e);
      
      onChange({ entries: newEntries });
      restoreScrollPosition();
    }
  }, [data.entries, onChange, preserveScrollPosition, restoreScrollPosition]);



  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="text-white w-5 h-5" />
            <h3 className="text-lg font-semibold text-white">
              {language === 'fr' ? 'Impression Clinique' : 'Clinical Impression'}
            </h3>
            <span className="text-white/80 text-sm">
              ({data.entries.filter(entry => entry.mainImpression.trim()).length})
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
      
      <div className="p-6 space-y-4 flex-1 overflow-y-auto min-h-0" ref={setContainer}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMainDragEnd}>
          <SortableContext items={data.entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {data.entries.map((entry, entryIndex) => (
                <DraggableImpressionEntry key={entry.id} entry={entry}>
                  <div
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      entry.mainImpression.trim() 
                        ? 'border-orange-200 bg-orange-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Entry Number and Main Impression */}
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        entry.mainImpression.trim() 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-400 text-white'
                      }`}>
                        {entryIndex + 1}
                      </div>
                      <FocusStableInput
                        value={entry.mainImpression}
                        onChange={(value) => updateMainImpression(entry.id, value)}
                        placeholder={language === 'fr' ? 'Entrer l\'impression clinique principale...' : 'Enter main clinical impression...'}
                        className="flex-1 font-medium px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEntry(entry.id)}
                          className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800"
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

                    {/* Sub-entries */}
                    {expandedEntries.has(entry.id) && (
                      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSubDragEnd(entry.id)}>
                        <SortableContext items={entry.subEntries.map((_, i) => `${entry.id}-sub-${i}`)} strategy={verticalListSortingStrategy}>
                          <div className="ml-11 space-y-2">
                            <Label className="text-sm text-orange-700 font-medium">
                              {language === 'fr' ? 'Détails supplémentaires:' : 'Additional details:'}
                            </Label>
                            {entry.subEntries.map((subEntry, subIndex) => (
                              <DraggableSubEntry key={`${entry.id}-sub-${subIndex}`} id={`${entry.id}-sub-${subIndex}`}>
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-orange-400 rounded-full flex-shrink-0 mt-2"></div>
                                  <FocusStableInput
                                    value={subEntry}
                                    onChange={(value) => updateSubEntry(entry.id, subIndex, value)}
                                    placeholder={language === 'fr' ? 'Ajouter des détails...' : 'Add details...'}
                                    className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeSubEntry(entry.id, subIndex)}
                                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
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
                </DraggableImpressionEntry>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}