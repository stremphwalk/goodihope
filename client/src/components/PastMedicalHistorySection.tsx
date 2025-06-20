import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, ChevronDown, ChevronUp, Trash2, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SubEntry {
  id: string;
  value: string;
}

interface PMHEntry {
  id: string;
  value: string;
  subEntries: SubEntry[];
  collapsed: boolean;
}

function DraggableHandle() {
  return (
    <span className="drag-handle cursor-grab text-gray-400 hover:text-gray-700 mr-2 mt-2">
      <GripVertical size={18} />
    </span>
  );
}

function SubDraggableHandle() {
  return (
    <span className="sub-drag-handle cursor-grab text-gray-300 hover:text-gray-600 mr-1 mt-2">
      <GripVertical size={14} />
    </span>
  );
}

// Fix: Add explicit type for SubEntryInput props
interface SubEntryInputProps {
  subEntry: SubEntry;
  onChange: (val: string) => void;
  onDelete: () => void;
}

function SubEntryInput({ subEntry, onChange, onDelete }: SubEntryInputProps) {
  const { attributes, listeners, setNodeRef } = useSortable({ id: subEntry.id });
  return (
    <div ref={setNodeRef} className="flex items-start mb-2 sub-sortable-item group">
      <SubDraggableHandle {...listeners} {...attributes} />
      <div className="flex items-center flex-grow">
        <span className="text-gray-500 mt-2 mr-2">-</span>
        <input
          type="text"
          className="sub-input w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition bg-white"
          placeholder="Add detail..."
          value={subEntry.value}
          onChange={e => onChange(e.target.value)}
        />
        <button
          type="button"
          className="delete-btn ml-2 p-1 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition opacity-60 group-hover:opacity-100"
          title="Delete Detail"
          onClick={onDelete}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function MainEntry({ entry, index, onChange, onDelete, onToggleCollapse, onSubChange, onAddSub, onDeleteSub }: any) {
  const { attributes, listeners, setNodeRef } = useSortable({ id: entry.id });
  return (
    <div ref={setNodeRef} className={`main-input-container relative mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm${entry.collapsed ? ' is-collapsed' : ''}`}> 
      <div className="flex items-start">
        <DraggableHandle {...listeners} {...attributes} />
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div className="flex items-start flex-grow">
              <span className="item-number text-gray-500 font-semibold mt-2 mr-2">{index + 1}.</span>
              <input
                type="text"
                className="main-input w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder={`Condition ${index + 1}`}
                value={entry.value}
                onChange={e => onChange(e.target.value)}
                onKeyUp={e => {
                  if (e.key === 'Enter' && index === entry.index) onAddSub();
                }}
              />
            </div>
            <div className="flex items-center self-start ml-2">
              <button
                type="button"
                className="collapse-toggle p-1 rounded-full hover:bg-gray-200 transition"
                title="Toggle Sub-points"
                onClick={onToggleCollapse}
              >
                {entry.collapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </button>
              <button
                type="button"
                className="delete-btn p-1 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-600 transition opacity-60 hover:opacity-100"
                title="Delete Condition"
                onClick={onDelete}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
          {/* Sub-entries */}
          <div className={`sub-input-container mt-2${entry.collapsed ? ' hidden' : ''}`}> 
            <DndContext sensors={entry.sensors} collisionDetection={closestCenter} onDragEnd={entry.onSubDragEnd}>
              <SortableContext items={entry.subEntries.map((s: SubEntry) => s.id)} strategy={verticalListSortingStrategy}>
                {entry.subEntries.map((sub: SubEntry, subIdx: number) => (
                  <SubEntryInput
                    key={sub.id}
                    subEntry={sub}
                    onChange={(val: string) => onSubChange(subIdx, val)}
                    onDelete={() => onDeleteSub(subIdx)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            <Button variant="ghost" size="sm" className="mt-2" onClick={onAddSub}>
              <Plus size={16} className="mr-1" /> Add Detail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateNote(entries: PMHEntry[]): string {
  let formatted = '';
  entries.forEach((entry, idx) => {
    if (entry.value.trim()) {
      formatted += `${idx + 1}. ${entry.value.trim()}\n`;
      entry.subEntries.forEach(sub => {
        if (sub.value.trim()) {
          formatted += `     - ${sub.value.trim()}\n`;
        }
      });
    }
  });
  return formatted.trim() || 'Your formatted note will appear here as you type.';
}

// Accept props for controlled PMH data and callbacks
interface PastMedicalHistorySectionProps {
  data: PMHData;
  onChange: (data: PMHData) => void;
  expandedEntries?: Set<string>;
  setExpandedEntries?: (set: Set<string>) => void;
  allExpanded?: boolean;
  setAllExpanded?: (val: boolean) => void;
}

export function PastMedicalHistorySection({
  data,
  onChange,
  expandedEntries,
  setExpandedEntries,
  allExpanded,
  setAllExpanded
}: PastMedicalHistorySectionProps) {
  const [entries, setEntries] = useState<PMHEntry[]>([
    { id: crypto.randomUUID(), value: '', subEntries: [{ id: crypto.randomUUID(), value: '' }], collapsed: false },
    { id: crypto.randomUUID(), value: '', subEntries: [{ id: crypto.randomUUID(), value: '' }], collapsed: false },
    { id: crypto.randomUUID(), value: '', subEntries: [{ id: crypto.randomUUID(), value: '' }], collapsed: false },
  ]);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [notePreview, setNotePreview] = useState('');

  // Sub-drag state
  const subSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Sync generated note to Note Preview and sync data to parent
  useEffect(() => {
    const pmhText = generateNote(entries);
    setNotePreview(`PAST MEDICAL HISTORY:\n${pmhText ? pmhText : ''}`);
    
    // Sync internal PMH entries to parent component data structure
    const parentData: PMHData = {
      entries: entries.map(entry => ({
        id: entry.id,
        mainCondition: entry.value,
        subEntries: entry.subEntries.map(sub => sub.value)
      }))
    };
    onChange(parentData);
  }, [entries, onChange]);

  // Drag and drop for main entries
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setEntries(prev => arrayMove(prev, prev.findIndex(e => e.id === active.id), prev.findIndex(e => e.id === over.id)));
    }
  };

  // Sub-drag and drop for sub-entries
  const handleSubDragEnd = (entryIdx: number) => (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setEntries(prev => {
        const newEntries = [...prev];
        const subEntries = arrayMove(
          newEntries[entryIdx].subEntries,
          newEntries[entryIdx].subEntries.findIndex(s => s.id === active.id),
          newEntries[entryIdx].subEntries.findIndex(s => s.id === over.id)
        );
        newEntries[entryIdx] = { ...newEntries[entryIdx], subEntries };
        return newEntries;
      });
    }
  };

  // Add, update, delete main entries
  const addEntry = () => setEntries(prev => ([...prev, { id: crypto.randomUUID(), value: '', subEntries: [{ id: crypto.randomUUID(), value: '' }], collapsed: false }]));
  const updateEntry = (idx: number, value: string) => setEntries(prev => {
    const newEntries = [...prev];
    newEntries[idx].value = value;
    // Auto-add new entry if last is filled
    if (idx === prev.length - 1 && value.trim()) {
      newEntries.push({ id: crypto.randomUUID(), value: '', subEntries: [{ id: crypto.randomUUID(), value: '' }], collapsed: false });
    }
    return newEntries;
  });
  const deleteEntry = (idx: number) => setEntries(prev => prev.filter((_, i) => i !== idx));
  const toggleCollapse = (idx: number) => setEntries(prev => prev.map((e, i) => i === idx ? { ...e, collapsed: !e.collapsed } : e));

  // Add, update, delete sub-entries
  const addSubEntry = (entryIdx: number) => setEntries(prev => {
    const newEntries = [...prev];
    newEntries[entryIdx].subEntries.push({ id: crypto.randomUUID(), value: '' });
    return newEntries;
  });
  const updateSubEntry = (entryIdx: number, subIdx: number, value: string) => setEntries(prev => {
    const newEntries = [...prev];
    newEntries[entryIdx].subEntries[subIdx].value = value;
    // Auto-add new sub-entry if last is filled
    if (subIdx === newEntries[entryIdx].subEntries.length - 1 && value.trim()) {
      newEntries[entryIdx].subEntries.push({ id: crypto.randomUUID(), value: '' });
    }
    return newEntries;
  });
  const deleteSubEntry = (entryIdx: number, subIdx: number) => setEntries(prev => {
    const newEntries = [...prev];
    newEntries[entryIdx].subEntries = newEntries[entryIdx].subEntries.filter((_, i) => i !== subIdx);
    return newEntries;
  });

  // Collapse/Expand all
  const handleToggleAll = () => {
    setAllCollapsed(c => !c);
    setEntries(prev => prev.map(e => ({ ...e, collapsed: !allCollapsed })));
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="w-full"> {/* Remove grid, use full width */}
        {/* Input Section */}
        <div className="bg-white p-6 rounded-xl shadow-md w-full"> {/* Ensure full width */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-800">Past Medical History</h2>
            <Button variant="ghost" size="icon" onClick={handleToggleAll} title={allCollapsed ? 'Expand All' : 'Collapse All'}>
              {allCollapsed ? <ChevronDown size={22} /> : <ChevronUp size={22} />}
            </Button>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={entries.map(e => e.id)} strategy={verticalListSortingStrategy}>
              {entries.map((entry, idx) => (
                <MainEntry
                  key={entry.id}
                  entry={{ ...entry, sensors: subSensors, onSubDragEnd: handleSubDragEnd(idx) }}
                  index={idx}
                  onChange={(val: string) => updateEntry(idx, val)}
                  onDelete={() => deleteEntry(idx)}
                  onToggleCollapse={() => toggleCollapse(idx)}
                  onSubChange={(subIdx: number, val: string) => updateSubEntry(idx, subIdx, val)}
                  onAddSub={() => addSubEntry(idx)}
                  onDeleteSub={(subIdx: number) => deleteSubEntry(idx, subIdx)}
                />
              ))}
            </SortableContext>
          </DndContext>
          <Button variant="outline" size="sm" className="mt-4 w-full" onClick={addEntry}>
            <Plus size={18} className="mr-1" /> Add Condition
          </Button>
        </div>
      </div>
    </div>
  );
}

// Export PMHData type for use in other files
export type PMHData = {
  entries: Array<{
    id: string;
    mainCondition: string;
    subEntries: string[];
  }>;
};
