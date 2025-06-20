import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

export interface PMHData {
  entries: Array<{
    id: string;
    mainCondition: string;
    subEntries: string[];
  }>;
}

interface SimplePMHSectionProps {
  data: PMHData;
  onChange: (data: PMHData) => void;
}

export function SimplePMHSection({ data, onChange }: SimplePMHSectionProps) {
  // Initialize with 3 empty entries if no data exists
  useEffect(() => {
    if (data.entries.length === 0) {
      const initialEntries = [
        { id: '1', mainCondition: '', subEntries: ['', '', ''] },
        { id: '2', mainCondition: '', subEntries: ['', '', ''] },
        { id: '3', mainCondition: '', subEntries: ['', '', ''] },
      ];
      onChange({ entries: initialEntries });
    }
  }, [data.entries.length, onChange]);

  const updateMainCondition = (entryId: string, value: string) => {
    const updatedEntries = data.entries.map(entry => 
      entry.id === entryId ? { ...entry, mainCondition: value } : entry
    );
    onChange({ entries: updatedEntries });
  };

  const updateSubEntry = (entryId: string, subIndex: number, value: string) => {
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId) {
        const newSubEntries = [...entry.subEntries];
        newSubEntries[subIndex] = value;
        return { ...entry, subEntries: newSubEntries };
      }
      return entry;
    });
    onChange({ entries: updatedEntries });
  };

  const addMainEntry = () => {
    const newEntries = [...data.entries, {
      id: Date.now().toString(),
      mainCondition: '',
      subEntries: ['', '', '']
    }];
    onChange({ entries: newEntries });
  };

  const addSubEntry = (entryId: string) => {
    const updatedEntries = data.entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          subEntries: [...entry.subEntries, '']
        };
      }
      return entry;
    });
    onChange({ entries: updatedEntries });
  };

  const removeMainEntry = (entryId: string) => {
    if (data.entries.length > 1) {
      const updatedEntries = data.entries.filter(entry => entry.id !== entryId);
      onChange({ entries: updatedEntries });
    }
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

  return (
    <div className="space-y-4">
      {data.entries.map((entry, entryIndex) => (
        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-gray-600 font-semibold mt-2 min-w-[20px]">
              {entryIndex + 1}.
            </span>
            <Input
              value={entry.mainCondition}
              onChange={(e) => updateMainCondition(entry.id, e.target.value)}
              placeholder={`Main condition ${entryIndex + 1}`}
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeMainEntry(entry.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Sub-entries */}
          <div className="ml-6 space-y-2">
            {entry.subEntries.map((subEntry, subIndex) => (
              <div key={subIndex} className="flex items-center gap-2">
                <span className="text-gray-500 min-w-[10px]">-</span>
                <Input
                  value={subEntry}
                  onChange={(e) => updateSubEntry(entry.id, subIndex, e.target.value)}
                  placeholder={`Detail ${subIndex + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {entry.subEntries.length > 3 && subIndex >= 3 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSubEntry(entry.id, subIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => addSubEntry(entry.id)}
              className="text-blue-600 hover:text-blue-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add detail
            </Button>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={addMainEntry}
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Main Condition
      </Button>
    </div>
  );
}