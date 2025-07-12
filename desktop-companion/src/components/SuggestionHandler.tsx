import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { deferExpensiveOperation } from '../lib/startupOptimizer'

interface Suggestion {
  trigger: string
  content: string
  description?: string
  category?: string
  type: 'built-in' | 'custom'
  score?: number
  matchedOn?: string
}

// Type declarations for window.suggestionAPI
declare global {
  interface Window {
    suggestionAPI?: {
      onUpdateSuggestions: (callback: (suggestions: any[]) => void) => void
      onShowDotPhraseWindow: (callback: (data: any) => void) => void
      selectSuggestion: (suggestion: any) => Promise<boolean>
      closeSuggestions: () => Promise<void>
      removeAllListeners: (channel: string) => void
    }
  }
}

export function SuggestionHandler() {
  console.log('🎬 [REACT] SuggestionHandler component rendered')
  
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [allSuggestions, setAllSuggestions] = useState<Suggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Real-time search filtering
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions(allSuggestions)
      setSelectedIndex(0)
      return
    }

    const filtered = allSuggestions.filter(suggestion => 
      suggestion.trigger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      suggestion.category?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => {
      // Prioritize trigger matches
      const aStartsWithQuery = a.trigger.toLowerCase().startsWith(searchQuery.toLowerCase())
      const bStartsWithQuery = b.trigger.toLowerCase().startsWith(searchQuery.toLowerCase())
      
      if (aStartsWithQuery && !bStartsWithQuery) return -1
      if (!aStartsWithQuery && bStartsWithQuery) return 1
      
      return a.trigger.localeCompare(b.trigger)
    })

    setSuggestions(filtered)
    setSelectedIndex(0)
  }, [searchQuery, allSuggestions])

  useEffect(() => {
    console.log('🔄 [REACT] SuggestionHandler useEffect called')
    console.log('🌐 [REACT] Current URL:', window.location.href)
    console.log('📍 [REACT] Current pathname:', window.location.pathname)
    
    // This component will handle the suggestion window logic
    // when running in the suggestion window context
    
    const urlParams = new URLSearchParams(window.location.search)
    const isInSuggestionWindow = urlParams.get('window') === 'suggestion'
    
    if (isInSuggestionWindow) {
      console.log('✅ [REACT] We are in the suggestion window, setting up...')
      // Force visibility for testing
      setIsVisible(true)
      setupSuggestionWindow()
    } else {
      console.log('❌ [REACT] Not in suggestion window context (URL param missing)')
    }
  }, [])

  const setupSuggestionWindow = useCallback(() => {
    // Load dot phrases when window is shown
    const handleShowDotPhraseWindow = useCallback(async (data: any) => {
      console.log('🔥 [REACT] handleShowDotPhraseWindow called with:', data)
      setIsLoading(true)
      setIsVisible(true)
      setSearchQuery('')
      
      try {
        // Load built-in phrases first for immediate feedback
        console.log('📚 [REACT] Loading built-in phrases...')
        const builtInPhrases = [
          { trigger: '/dm2', content: 'DM2\n- Traitement actuel :\n- A1c :\n- RAC :', description: 'Diabetes Mellitus Type 2 template', category: 'endocrine', type: 'built-in' as const },
          { trigger: '/plan', content: 'The patient will be started on [[Tazocin|Ceftriaxone|Meropenem]] for [[5 days|7 days|10 days]].', description: 'Treatment plan with options', category: 'general', type: 'built-in' as const },
          { trigger: '/date', content: '[[DATE]]', description: 'Insert current date', category: 'general', type: 'built-in' as const },
          { trigger: '/calc', content: '[[CALC]]', description: 'Open calculation modal', category: 'general', type: 'built-in' as const },
          { trigger: '/chest', content: 'Chest: [[Clear to auscultation bilaterally|Decreased air entry|Wheeze noted|Crackles noted]]', description: 'Chest examination findings', category: 'respiratory', type: 'built-in' as const },
          { trigger: '/heart', content: 'Heart: [[Regular rate and rhythm|Irregular rhythm|Murmur noted|S3 gallop]], no murmurs', description: 'Cardiac examination findings', category: 'cardiac', type: 'built-in' as const },
          { trigger: '/neuro', content: 'Neurological: [[Alert and oriented x3|Confused|Lethargic]], [[normal reflexes|hyperreflexic|hyporeflexic]]', description: 'Neurological examination', category: 'neurological', type: 'built-in' as const },
          { trigger: '/allergies', content: 'Allergies: [[NKDA|Penicillin|Sulfa|Other - see chart]]', description: 'Allergy information', category: 'general', type: 'built-in' as const }
        ]
        
        console.log('✅ [REACT] Built-in phrases loaded:', builtInPhrases.length)
        setAllSuggestions(builtInPhrases)
        setSuggestions(builtInPhrases)
      } catch (error) {
        console.error('❌ [REACT] Error loading dot phrases:', error)
      } finally {
        setIsLoading(false)
      }
    }, [])

    // Optimized suggestion update handler with deferred processing
    const handleSuggestionUpdate = useCallback(async (event: any, newSuggestions: Suggestion[]) => {
      // Defer expensive suggestion processing for better performance
      await deferExpensiveOperation(() => {
        setAllSuggestions(newSuggestions)
        setSuggestions(newSuggestions)
        setSelectedIndex(0)
        setIsVisible(newSuggestions.length > 0)
      }, 10) // Small delay to prevent blocking
    }, [])

    // Set up IPC listeners
    console.log('🔌 [REACT] Setting up IPC listeners...')
    if (window.suggestionAPI) {
      console.log('✅ [REACT] suggestionAPI is available')
      window.suggestionAPI.onUpdateSuggestions((suggestions: any) => {
        console.log('📥 [REACT] Received update-suggestions:', suggestions)
        handleSuggestionUpdate(null, suggestions)
      })
      window.suggestionAPI.onShowDotPhraseWindow((data: any) => {
        console.log('📥 [REACT] Received show-dot-phrase-window:', data)
        handleShowDotPhraseWindow(data)
      })
    } else {
      console.error('❌ [REACT] suggestionAPI is not available!')
    }

    // Optimized keyboard navigation with reduced re-renders
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
      if (!isVisible) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          if (suggestions.length > 0) {
            setSelectedIndex(prev => (prev + 1) % suggestions.length)
          }
          break
        
        case 'ArrowUp':
          event.preventDefault()
          if (suggestions.length > 0) {
            setSelectedIndex(prev => prev === 0 ? suggestions.length - 1 : prev - 1)
          }
          break
        
        case 'Enter':
        case 'Tab':
          event.preventDefault()
          if (suggestions[selectedIndex]) {
            selectSuggestion(suggestions[selectedIndex])
          }
          break
        
        case 'Escape':
          event.preventDefault()
          closeSuggestions()
          break
          
        case 'Backspace':
          if (searchQuery.length > 0) {
            event.preventDefault()
            setSearchQuery(prev => prev.slice(0, -1))
          } else {
            closeSuggestions()
          }
          break
          
        default:
          // Handle typing for search
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            event.preventDefault()
            setSearchQuery(prev => prev + event.key)
          }
          break
      }
    }, [isVisible, suggestions.length, selectedIndex, searchQuery])

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (window.suggestionAPI) {
        window.suggestionAPI.removeAllListeners('update-suggestions')
        window.suggestionAPI.removeAllListeners('show-dot-phrase-window')
      }
    }
  }, [isVisible, suggestions.length, selectedIndex])

  const selectSuggestion = useCallback(async (suggestion: Suggestion) => {
    try {
      setIsLoading(true)
      
      // Send expansion request to main process
      if (window.suggestionAPI) {
        const success = await window.suggestionAPI.selectSuggestion(suggestion)
        if (success) {
          console.log('Phrase expanded successfully:', suggestion.trigger)
        } else {
          console.error('Failed to expand phrase:', suggestion.trigger)
        }
      }
      
      closeSuggestions()
    } catch (error) {
      console.error('Error selecting suggestion:', error)
      closeSuggestions()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const closeSuggestions = useCallback(() => {
    setIsVisible(false)
    setSuggestions([])
    setSearchQuery('')
    if (window.suggestionAPI) {
      window.suggestionAPI.closeSuggestions()
    }
  }, [])

  // Memoized suggestion items for better performance
  const memoizedSuggestions = useMemo(() => {
    return suggestions.map((suggestion, index) => (
      <div
        key={`${suggestion.trigger}-${index}`}
        className={`suggestion-item p-3 rounded-md cursor-pointer ${
          index === selectedIndex ? 'selected' : ''
        }`}
        onClick={() => selectSuggestion(suggestion)}
        onMouseEnter={() => setSelectedIndex(index)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-medium text-blue-600">
                {suggestion.trigger}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                suggestion.type === 'built-in' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {suggestion.type === 'built-in' ? 'Built-in' : 'Custom'}
              </span>
              {suggestion.category && (
                <span className="text-xs text-gray-500">
                  {suggestion.category}
                </span>
              )}
            </div>
            
            {suggestion.description && (
              <div className="text-sm text-gray-600 mt-1">
                {suggestion.description}
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1 truncate">
              {suggestion.content.substring(0, 60)}
              {suggestion.content.length > 60 && '...'}
            </div>
          </div>
          
          {index === selectedIndex && (
            <div className="text-blue-500 text-sm font-medium">
              {isLoading ? '⏳' : '↵'}
            </div>
          )}
        </div>
      </div>
    ))
  }, [suggestions, selectedIndex, selectSuggestion])

  // Component only renders when called from suggestion window context
  
  // For debugging: always show something if we're in suggestion window mode
  const urlParams = new URLSearchParams(window.location.search)
  const isInSuggestionWindow = urlParams.get('window') === 'suggestion'
  
  if (isInSuggestionWindow && !isVisible) {
    return (
      <div className="fixed inset-0 bg-red-500 opacity-50 flex items-center justify-center">
        <div className="text-white text-lg">🔧 Suggestion Window Debug Mode</div>
      </div>
    )
  }

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-transparent suggestion-window">
      <div className="glass-morphism rounded-xl shadow-2xl border border-white/30 max-w-lg backdrop-blur-xl">
        <div className="p-4">
          {/* Header with search input */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700">Dot Phrases</span>
              {isLoading && (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            
            {/* Search Input Visual */}
            <div className="relative">
              <div className="w-full px-4 py-2 bg-white/70 backdrop-blur-sm border border-white/50 rounded-lg text-sm font-mono">
                <span className="text-blue-600">/</span>
                <span className="text-gray-800">{searchQuery}</span>
                <span className="animate-pulse">|</span>
              </div>
              <div className="absolute right-3 top-2.5 text-xs text-gray-400">
                {suggestions.length} results
              </div>
            </div>
          </div>
          
          {/* Suggestions List */}
          <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 text-sm">Loading dot phrases...</div>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500 text-sm">
                  {searchQuery ? 'No phrases found' : 'Start typing to search'}
                </div>
              </div>
            ) : (
              memoizedSuggestions
            )}
          </div>
          
          {/* Footer */}
          <div className="mt-3 px-2 text-xs text-gray-500 border-t border-white/30 pt-3 flex justify-between">
            <span>↑↓ Navigate • Enter Select • Esc Close</span>
            <span className="text-blue-500">Cmd+/</span>
          </div>
        </div>
      </div>
    </div>
  )
}