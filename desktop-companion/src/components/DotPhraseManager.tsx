import React, { useState } from 'react'
import { useDotPhrases, type DotPhrase } from '../hooks/useDotPhrases'
import { useAuth } from './AuthProvider'

export function DotPhraseManager() {
  const { 
    dotPhrases, 
    builtInPhrases, 
    createDotPhrase, 
    updateDotPhrase, 
    deleteDotPhrase,
    isLoading,
    isCreating,
    isUpdating,
    isDeleting
  } = useDotPhrases()
  
  const { signOut } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [editingPhrase, setEditingPhrase] = useState<DotPhrase | null>(null)

  const categories = ['all', 'general', 'cardiac', 'respiratory', 'neurological', 'endocrine', 'custom']

  const filteredPhrases = React.useMemo(() => {
    const allPhrases = [
      ...builtInPhrases,
      ...dotPhrases.map(p => ({ ...p, type: 'custom' as const }))
    ]

    return allPhrases.filter(phrase => {
      const matchesCategory = selectedCategory === 'all' || 
        phrase.category === selectedCategory ||
        (selectedCategory === 'custom' && 'type' in phrase && phrase.type === 'custom')
      
      const matchesSearch = !searchTerm || 
        phrase.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phrase.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        phrase.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesCategory && matchesSearch
    })
  }, [builtInPhrases, dotPhrases, selectedCategory, searchTerm])

  const handleCreateNew = () => {
    setIsCreatingNew(true)
    setEditingPhrase({
      trigger: '',
      content: '',
      description: '',
      category: 'general'
    })
  }

  const handleSave = (phraseData: Omit<DotPhrase, 'id'>) => {
    if (editingPhrase?.id) {
      updateDotPhrase({ ...phraseData, id: editingPhrase.id })
    } else {
      createDotPhrase(phraseData)
    }
    setIsCreatingNew(false)
    setEditingPhrase(null)
  }

  const handleCancel = () => {
    setIsCreatingNew(false)
    setEditingPhrase(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Dot Phrase Manager</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCreateNew}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + New Phrase
          </button>
          <button
            onClick={signOut}
            className="text-gray-600 hover:text-gray-800 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search phrases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {/* Create/Edit Form */}
      {(isCreatingNew || editingPhrase) && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPhrase?.id ? 'Edit Phrase' : 'Create New Phrase'}
          </h3>
          <PhraseForm
            phrase={editingPhrase}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isCreating || isUpdating}
          />
        </div>
      )}

      {/* Phrases List */}
      <div className="space-y-4">
        {filteredPhrases.map((phrase, index) => (
          <div
            key={`${phrase.trigger}-${index}`}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-lg font-medium text-blue-600">
                    {phrase.trigger}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ('type' in phrase) && phrase.type === 'custom' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {('type' in phrase) && phrase.type === 'custom' ? 'Custom' : 'Built-in'}
                  </span>
                  {phrase.category && (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {phrase.category}
                    </span>
                  )}
                </div>
                
                {phrase.description && (
                  <p className="text-gray-600 mb-2">{phrase.description}</p>
                )}
                
                <div className="bg-gray-100 rounded p-3 font-mono text-sm">
                  {phrase.content}
                </div>
              </div>
              
              {('type' in phrase) && phrase.type === 'custom' && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setEditingPhrase(phrase as DotPhrase)}
                    className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => ('id' in phrase) && typeof phrase.id === 'number' && deleteDotPhrase(phrase.id)}
                    disabled={isDeleting}
                    className="text-red-600 hover:text-red-800 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredPhrases.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No phrases found matching your criteria.
        </div>
      )}
    </div>
  )
}

interface PhraseFormProps {
  phrase: DotPhrase | null
  onSave: (phrase: Omit<DotPhrase, 'id'>) => void
  onCancel: () => void
  isLoading: boolean
}

function PhraseForm({ phrase, onSave, onCancel, isLoading }: PhraseFormProps) {
  const [formData, setFormData] = useState({
    trigger: phrase?.trigger || '',
    content: phrase?.content || '',
    description: phrase?.description || '',
    category: phrase?.category || 'general'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.trigger && formData.content) {
      onSave(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trigger (e.g., /chest)
          </label>
          <input
            type="text"
            value={formData.trigger}
            onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
            placeholder="/example"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="general">General</option>
            <option value="cardiac">Cardiac</option>
            <option value="respiratory">Respiratory</option>
            <option value="neurological">Neurological</option>
            <option value="endocrine">Endocrine</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (optional)
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of this phrase"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content
        </label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Enter your phrase content. Use [[option1|option2]] for smart options."
          required
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-1">
          Use [[option1|option2]] for smart options, [[DATE]] for dates, [[CALC]] for calculations
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading || !formData.trigger || !formData.content}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}