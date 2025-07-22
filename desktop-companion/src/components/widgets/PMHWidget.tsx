import { WidgetInstance, PMHData, PMHEntry } from '../../types/widgets'

export function PMHWidget({ 
  data, 
  onDataChange, 
  mode = 'interactive',
  isReadOnly = false 
}: WidgetInstance) {
  const pmhData = data as PMHData

  const addEntry = () => {
    const newEntry: PMHEntry = {
      id: `pmh-${Date.now()}`,
      condition: '',
      year: '',
      resolved: false
    }

    const updatedData = {
      ...pmhData,
      entries: [...pmhData.entries, newEntry]
    }
    
    onDataChange(updatedData)
  }

  const updateEntry = (entryId: string, updates: Partial<PMHEntry>) => {
    const updatedEntries = pmhData.entries.map(entry => 
      entry.id === entryId ? { ...entry, ...updates } : entry
    )

    const updatedData = {
      ...pmhData,
      entries: updatedEntries
    }
    
    onDataChange(updatedData)
  }

  const removeEntry = (entryId: string) => {
    const updatedEntries = pmhData.entries.filter(entry => entry.id !== entryId)

    const updatedData = {
      ...pmhData,
      entries: updatedEntries
    }
    
    onDataChange(updatedData)
  }

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Past Medical History</h3>
        
        {pmhData.entries.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm">
            {pmhData.entries.map(entry => (
              <li key={entry.id} className="text-gray-600">
                {entry.condition}
                {entry.year && ` (${entry.year})`}
                {entry.resolved && ' - Resolved'}
                {entry.notes && ` - ${entry.notes}`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No past medical history recorded</p>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Past Medical History</h3>
      </div>

      <div className="space-y-3">
        {pmhData.entries.map((entry) => (
          <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <input
                  type="text"
                  value={entry.condition}
                  onChange={(e) => updateEntry(entry.id, { condition: e.target.value })}
                  placeholder="e.g., Hypertension"
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Year
                </label>
                <input
                  type="text"
                  value={entry.year || ''}
                  onChange={(e) => updateEntry(entry.id, { year: e.target.value })}
                  placeholder="e.g., 2020"
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={entry.resolved || false}
                    onChange={(e) => updateEntry(entry.id, { resolved: e.target.checked })}
                    disabled={isReadOnly}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Resolved</span>
                </label>
              </div>
              
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={entry.notes || ''}
                  onChange={(e) => updateEntry(entry.id, { notes: e.target.value })}
                  placeholder="Additional notes..."
                  disabled={isReadOnly}
                  rows={2}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="col-span-2 flex justify-end">
                {!isReadOnly && (
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {!isReadOnly && (
          <button
            onClick={addEntry}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + Add Medical History Entry
          </button>
        )}
      </div>
    </div>
  )
}