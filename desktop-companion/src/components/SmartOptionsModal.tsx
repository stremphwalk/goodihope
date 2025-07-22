import { useState, useEffect } from 'react'

interface SmartOption {
  id: string
  options: string[]
  selectedIndex: number
  position: { x: number; y: number }
}

interface SmartOptionsModalProps {
  option: SmartOption | null
  onSelect: (optionId: string, selectedValue: string) => void
  onCancel: () => void
}

export function SmartOptionsModal({ option, onSelect, onCancel }: SmartOptionsModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (option) {
      setSelectedIndex(option.selectedIndex || 0)
    }
  }, [option])

  useEffect(() => {
    if (!option) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => (prev + 1) % option.options.length)
          break
        
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => prev === 0 ? option.options.length - 1 : prev - 1)
          break
        
        case 'Enter':
        case 'Tab':
          event.preventDefault()
          onSelect(option.id, option.options[selectedIndex])
          break
        
        case 'Escape':
          event.preventDefault()
          onCancel()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [option, selectedIndex, onSelect, onCancel])

  if (!option) return null

  const modalStyle = {
    position: 'fixed' as const,
    left: option.position.x,
    top: option.position.y + 25, // Offset below the text
    zIndex: 10000,
  }

  return (
    <div style={modalStyle} className="animate-slide-up">
      <div className="glass-morphism rounded-lg shadow-xl border border-white/20 min-w-48 max-w-xs">
        <div className="p-2">
          <div className="text-xs text-gray-600 mb-2 px-2 font-medium">
            Choose Option
          </div>
          
          <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
            {option.options.map((optionText, index) => (
              <div
                key={index}
                className={`suggestion-item p-2 rounded-md cursor-pointer text-sm ${
                  index === selectedIndex ? 'selected bg-blue-100' : 'hover:bg-gray-50'
                }`}
                onClick={() => onSelect(option.id, optionText)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1 text-gray-800">{optionText}</span>
                  {index === selectedIndex && (
                    <span className="text-blue-500 text-xs font-medium ml-2">↵</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-2 px-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
            ↑↓ Navigate • Enter/Tab Select • Esc Cancel
          </div>
        </div>
      </div>
    </div>
  )
}