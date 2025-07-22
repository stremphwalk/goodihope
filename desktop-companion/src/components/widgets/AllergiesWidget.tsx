import { WidgetInstance, AllergyData, Allergy } from '../../types/widgets'

export function AllergiesWidget({ 
  data, 
  onDataChange, 
  mode = 'interactive',
  isReadOnly = false 
}: WidgetInstance) {
  const allergyData = data as AllergyData

  const addAllergy = () => {
    const newAllergy: Allergy = {
      id: `allergy-${Date.now()}`,
      name: '',
      reaction: '',
      severity: 'Unknown'
    }

    const updatedData = {
      ...allergyData,
      allergies: [...allergyData.allergies, newAllergy],
      nkda: false // Clear NKDA when adding allergy
    }
    
    onDataChange(updatedData)
  }

  const updateAllergy = (allergyId: string, updates: Partial<Allergy>) => {
    const updatedAllergies = allergyData.allergies.map(allergy => 
      allergy.id === allergyId ? { ...allergy, ...updates } : allergy
    )

    const updatedData = {
      ...allergyData,
      allergies: updatedAllergies
    }
    
    onDataChange(updatedData)
  }

  const removeAllergy = (allergyId: string) => {
    const updatedAllergies = allergyData.allergies.filter(allergy => allergy.id !== allergyId)

    const updatedData = {
      ...allergyData,
      allergies: updatedAllergies
    }
    
    onDataChange(updatedData)
  }

  const toggleNKDA = () => {
    const updatedData = {
      ...allergyData,
      nkda: !allergyData.nkda,
      allergies: !allergyData.nkda ? [] : allergyData.allergies // Clear allergies when setting NKDA
    }
    
    onDataChange(updatedData)
  }

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Allergies</h3>
        
        {allergyData.nkda ? (
          <p className="text-sm text-gray-600">No known drug allergies (NKDA)</p>
        ) : allergyData.allergies.length > 0 ? (
          <ul className="list-disc list-inside space-y-1 text-sm">
            {allergyData.allergies.map(allergy => (
              <li key={allergy.id} className="text-gray-600">
                {allergy.name}
                {allergy.reaction && ` - ${allergy.reaction}`}
                {allergy.severity && allergy.severity !== 'Unknown' && ` (${allergy.severity})`}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No allergies recorded</p>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Allergies</h3>
        {!isReadOnly && (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={allergyData.nkda}
              onChange={toggleNKDA}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">NKDA</span>
          </label>
        )}
      </div>

      {!allergyData.nkda && (
        <div className="space-y-3">
          {allergyData.allergies.map((allergy) => (
            <div key={allergy.id} className="border border-gray-200 rounded-lg p-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Allergen
                  </label>
                  <input
                    type="text"
                    value={allergy.name}
                    onChange={(e) => updateAllergy(allergy.id, { name: e.target.value })}
                    placeholder="e.g., Penicillin"
                    disabled={isReadOnly}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reaction
                  </label>
                  <input
                    type="text"
                    value={allergy.reaction || ''}
                    onChange={(e) => updateAllergy(allergy.id, { reaction: e.target.value })}
                    placeholder="e.g., Rash"
                    disabled={isReadOnly}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Severity
                  </label>
                  <select
                    value={allergy.severity || 'Unknown'}
                    onChange={(e) => updateAllergy(allergy.id, { severity: e.target.value as Allergy['severity'] })}
                    disabled={isReadOnly}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Unknown">Unknown</option>
                    <option value="Mild">Mild</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Severe">Severe</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  {!isReadOnly && (
                    <button
                      onClick={() => removeAllergy(allergy.id)}
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
              onClick={addAllergy}
              className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Allergy
            </button>
          )}
        </div>
      )}

      {allergyData.nkda && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No known drug allergies recorded</p>
        </div>
      )}
    </div>
  )
}