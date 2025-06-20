import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  // Initialize with 3 empty entries if data is empty
  const [entries, setEntries] = useState(() => {
    if (data.entries.length === 0) {
      return [
        { id: '1', mainCondition: '', subEntries: ['', '', ''] },
        { id: '2', mainCondition: '', subEntries: ['', '', ''] },
        { id: '3', mainCondition: '', subEntries: ['', '', ''] }
      ];
    }
    return data.entries;
  });

  // Stable update parent function that doesn't trigger re-renders
  const updateParent = useCallback((newEntries: typeof entries) => {
    onChange({ entries: newEntries });
  }, []);

  // Simple direct handlers without useCallback to prevent re-renders
  const handleMainConditionChange = (index: number, value: string) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], mainCondition: value };
      onChange({ entries: newEntries });
      return newEntries;
    });
  };

  const handleSubEntryChange = (entryIndex: number, subIndex: number, value: string) => {
    setEntries(prev => {
      const newEntries = [...prev];
      const newSubEntries = [...newEntries[entryIndex].subEntries];
      newSubEntries[subIndex] = value;
      newEntries[entryIndex] = { ...newEntries[entryIndex], subEntries: newSubEntries };
      onChange({ entries: newEntries });
      return newEntries;
    });
  };

  const addMainEntry = () => {
    setEntries(prev => {
      const newEntries = [...prev, {
        id: Date.now().toString(),
        mainCondition: '',
        subEntries: ['', '', '']
      }];
      onChange({ entries: newEntries });
      return newEntries;
    });
  };

  const addSubEntry = (entryIndex: number) => {
    setEntries(prev => {
      const newEntries = [...prev];
      newEntries[entryIndex] = {
        ...newEntries[entryIndex],
        subEntries: [...newEntries[entryIndex].subEntries, '']
      };
      onChange({ entries: newEntries });
      return newEntries;
    });
  };

  const removeMainEntry = (index: number) => {
    if (entries.length > 1) {
      setEntries(prev => {
        const newEntries = prev.filter((_, i) => i !== index);
        onChange({ entries: newEntries });
        return newEntries;
      });
    }
  };

  const removeSubEntry = (entryIndex: number, subIndex: number) => {
    setEntries(prev => {
      const newEntries = [...prev];
      if (newEntries[entryIndex].subEntries.length > 1) {
        newEntries[entryIndex] = {
          ...newEntries[entryIndex],
          subEntries: newEntries[entryIndex].subEntries.filter((_, i) => i !== subIndex)
        };
        onChange({ entries: newEntries });
      }
      return newEntries;
    });
  };

  return (
    <div className="space-y-4">
      {entries.map((entry, entryIndex) => (
        <div key={entry.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start gap-2 mb-3">
            <span className="text-gray-600 font-semibold mt-2 min-w-[20px]">
              {entryIndex + 1}.
            </span>
            <input
              type="text"
              value={entry.mainCondition}
              onChange={(e) => handleMainConditionChange(entryIndex, e.target.value)}
              placeholder={`Main condition ${entryIndex + 1}`}
              className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => removeMainEntry(entryIndex)}
              disabled={entries.length <= 1}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          
          <div className="ml-6 space-y-2">
            {entry.subEntries.map((subEntry, subIndex) => (
              <div key={subIndex} className="flex items-center gap-2">
                <span className="text-gray-500 min-w-[10px]">-</span>
                <input
                  type="text"
                  value={subEntry}
                  onChange={(e) => handleSubEntryChange(entryIndex, subIndex, e.target.value)}
                  placeholder={`Detail ${subIndex + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSubEntry(entryIndex, subIndex)}
                  disabled={entry.subEntries.length <= 1}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addSubEntry(entryIndex)}
              className="ml-3 text-blue-600 hover:text-blue-700"
            >
              <Plus size={14} className="mr-1" />
              Add Detail
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
        <Plus size={16} className="mr-2" />
        Add Condition
      </Button>
    </div>
  );
}