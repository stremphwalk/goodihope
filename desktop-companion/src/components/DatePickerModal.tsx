import { useState, useEffect } from 'react'

interface DatePickerModalProps {
  isVisible: boolean
  position: { x: number; y: number }
  onDateSelect: (date: string) => void
  onCancel: () => void
}

export function DatePickerModal({ 
  isVisible, 
  position, 
  onDateSelect, 
  onCancel 
}: DatePickerModalProps) {
  const [selectedDate, setSelectedDate] = useState('')
  const [dateFormat, setDateFormat] = useState<'short' | 'long' | 'iso'>('short')

  useEffect(() => {
    if (isVisible) {
      // Set default to today's date
      const today = new Date()
      const isoString = today.toISOString().split('T')[0] // YYYY-MM-DD format
      setSelectedDate(isoString)
    }
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          handleConfirm()
          break
        
        case 'Escape':
          event.preventDefault()
          onCancel()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, selectedDate, dateFormat])

  const formatDate = (dateString: string, format: 'short' | 'long' | 'iso'): string => {
    if (!dateString) return ''
    
    const date = new Date(dateString)
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString() // e.g., 12/25/2023
      case 'long':
        return date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }) // e.g., Monday, December 25, 2023
      case 'iso':
        return dateString // e.g., 2023-12-25
      default:
        return date.toLocaleDateString()
    }
  }

  const handleConfirm = () => {
    if (selectedDate) {
      const formattedDate = formatDate(selectedDate, dateFormat)
      onDateSelect(formattedDate)
    }
  }

  const getQuickDateOption = (days: number): string => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  if (!isVisible) return null

  const modalStyle = {
    position: 'fixed' as const,
    left: position.x,
    top: position.y + 25,
    zIndex: 10000,
  }

  return (
    <div style={modalStyle} className="animate-slide-up">
      <div className="glass-morphism rounded-lg shadow-xl border border-white/20 w-80">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Select Date</h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Date Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Quick Date Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Options
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedDate(getQuickDateOption(0))}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setSelectedDate(getQuickDateOption(1))}
                className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
              >
                Tomorrow
              </button>
              <button
                onClick={() => setSelectedDate(getQuickDateOption(7))}
                className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
              >
                +1 Week
              </button>
              <button
                onClick={() => setSelectedDate(getQuickDateOption(30))}
                className="px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded hover:bg-gray-100 transition-colors"
              >
                +1 Month
              </button>
            </div>
          </div>

          {/* Format Options */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="short"
                  checked={dateFormat === 'short'}
                  onChange={(e) => setDateFormat(e.target.value as 'short')}
                  className="mr-2"
                />
                <span className="text-sm">Short: {formatDate(selectedDate, 'short')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="long"
                  checked={dateFormat === 'long'}
                  onChange={(e) => setDateFormat(e.target.value as 'long')}
                  className="mr-2"
                />
                <span className="text-sm">Long: {formatDate(selectedDate, 'long')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="iso"
                  checked={dateFormat === 'iso'}
                  onChange={(e) => setDateFormat(e.target.value as 'iso')}
                  className="mr-2"
                />
                <span className="text-sm">ISO: {formatDate(selectedDate, 'iso')}</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              Enter to confirm • Esc to cancel
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selectedDate}
                className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Insert Date
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}