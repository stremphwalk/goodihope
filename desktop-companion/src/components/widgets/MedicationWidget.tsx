import { useState } from 'react'
import { WidgetInstance, MedicationData, Medication } from '../../types/widgets'

export function MedicationWidget({ 
  data, 
  onDataChange, 
  mode = 'interactive',
  isReadOnly = false 
}: WidgetInstance) {
  const medicationData = data as MedicationData
  const [activeTab, setActiveTab] = useState<'home' | 'hospital'>('home')

  const addMedication = (type: 'home' | 'hospital') => {
    const newMedication: Medication = {
      id: `med-${Date.now()}`,
      name: '',
      dosage: '',
      frequency: ''
    }

    const updatedData = {
      ...medicationData,
      [`${type}Medications`]: [
        ...medicationData[`${type}Medications` as keyof MedicationData],
        newMedication
      ]
    }
    
    onDataChange(updatedData)
  }

  const updateMedication = (type: 'home' | 'hospital', medId: string, updates: Partial<Medication>) => {
    const medications = medicationData[`${type}Medications` as keyof MedicationData] as Medication[]
    const updatedMedications = medications.map(med => 
      med.id === medId ? { ...med, ...updates } : med
    )

    const updatedData = {
      ...medicationData,
      [`${type}Medications`]: updatedMedications
    }
    
    onDataChange(updatedData)
  }

  const removeMedication = (type: 'home' | 'hospital', medId: string) => {
    const medications = medicationData[`${type}Medications` as keyof MedicationData] as Medication[]
    const updatedMedications = medications.filter(med => med.id !== medId)

    const updatedData = {
      ...medicationData,
      [`${type}Medications`]: updatedMedications
    }
    
    onDataChange(updatedData)
  }

  if (mode === 'text') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Medications</h3>
        
        {medicationData.homeMedications.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Home Medications:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {medicationData.homeMedications.map(med => (
                <li key={med.id} className="text-gray-600">
                  {med.name} {med.dosage && `${med.dosage}`} {med.frequency && `(${med.frequency})`}
                </li>
              ))}
            </ul>
          </div>
        )}

        {medicationData.hospitalMedications.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Hospital Medications:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {medicationData.hospitalMedications.map(med => (
                <li key={med.id} className="text-gray-600">
                  {med.name} {med.dosage && `${med.dosage}`} {med.frequency && `(${med.frequency})`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">Medications</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'home' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('hospital')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              activeTab === 'hospital' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Hospital
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {medicationData[`${activeTab}Medications` as keyof MedicationData].map((med: Medication) => (
          <div key={med.id} className="border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Medication Name
                </label>
                <input
                  type="text"
                  value={med.name}
                  onChange={(e) => updateMedication(activeTab, med.id, { name: e.target.value })}
                  placeholder="e.g., Metformin"
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={med.dosage || ''}
                  onChange={(e) => updateMedication(activeTab, med.id, { dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={med.frequency || ''}
                  onChange={(e) => updateMedication(activeTab, med.id, { frequency: e.target.value })}
                  placeholder="e.g., BID"
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                {!isReadOnly && (
                  <button
                    onClick={() => removeMedication(activeTab, med.id)}
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
            onClick={() => addMedication(activeTab)}
            className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            + Add {activeTab === 'home' ? 'Home' : 'Hospital'} Medication
          </button>
        )}
      </div>
    </div>
  )
}