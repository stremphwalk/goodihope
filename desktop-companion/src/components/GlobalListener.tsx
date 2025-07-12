import React, { useEffect, useState } from 'react'
import { useDotPhrases } from '../hooks/useDotPhrases'
import Fuse from 'fuse.js'

export function GlobalListener() {
  const { dotPhrases, builtInPhrases } = useDotPhrases()
  const [currentPhrase, setCurrentPhrase] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])

  // Combine all available phrases
  const allPhrases = React.useMemo(() => {
    const combined = [
      ...builtInPhrases.map(phrase => ({
        ...phrase,
        type: 'built-in'
      })),
      ...(dotPhrases || []).map(phrase => ({
        ...phrase,
        type: 'custom'
      }))
    ]
    return combined
  }, [dotPhrases, builtInPhrases])

  // Set up fuzzy search
  const fuse = React.useMemo(() => {
    return new Fuse(allPhrases, {
      keys: ['trigger', 'description', 'content'],
      threshold: 0.3,
      includeScore: true,
    })
  }, [allPhrases])

  useEffect(() => {
    if (!window.electronAPI) return

    // Listen for slash phrase detection from the main process
    window.electronAPI.onSlashPhraseDetected((data: any) => {
      const { phrase, position } = data
      setCurrentPhrase(phrase)
      
      if (phrase.length > 1) {
        // Search for matching phrases
        const searchResults = fuse.search(phrase.substring(1)) // Remove the '/' prefix
        const topResults = searchResults.slice(0, 8).map(result => ({
          ...result.item,
          score: result.score,
          matchedOn: result.matches?.[0]?.key || 'trigger'
        }))
        
        setSuggestions(topResults)
        
        if (topResults.length > 0) {
          // Show suggestion window
          window.electronAPI.showSuggestion(topResults, position)
        } else {
          window.electronAPI.hideSuggestion()
        }
      } else {
        setSuggestions([])
        window.electronAPI.hideSuggestion()
      }
    })

    // Listen for text changes
    window.electronAPI.onTextChange((data: any) => {
      const { text } = data
      
      // If the text doesn't contain a slash phrase, hide suggestions
      if (!text.includes('/') || !text.match(/\/[a-zA-Z0-9_]*$/)) {
        setSuggestions([])
        window.electronAPI.hideSuggestion()
        setCurrentPhrase('')
      }
    })

    return () => {
      window.electronAPI.removeAllListeners('slash-phrase-detected')
      window.electronAPI.removeAllListeners('text-change')
    }
  }, [fuse])

  // This component doesn't render anything visible in the main window
  // It just handles the global text detection logic
  return (
    <div className="hidden">
      <div className="text-xs text-gray-500 p-2">
        Global listener active - Current phrase: {currentPhrase}
        {suggestions.length > 0 && (
          <div className="mt-1">
            Found {suggestions.length} suggestions
          </div>
        )}
      </div>
    </div>
  )
}