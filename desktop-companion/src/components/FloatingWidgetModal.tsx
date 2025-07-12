import React, { useState, useEffect } from 'react'
import { widgetRegistry } from '../lib/widgetRegistry'
import { WidgetInstance } from '../types/widgets'

interface FloatingWidgetModalProps {
  widgetRequest: {
    expansionId: string
    widgetType: string
    widgetId: string
    position: { x: number; y: number }
  } | null
  onComplete: (expansionId: string, widgetData: Record<string, any>) => void
  onCancel: (expansionId: string) => void
}

export function FloatingWidgetModal({ 
  widgetRequest, 
  onComplete, 
  onCancel 
}: FloatingWidgetModalProps) {
  const [widgetInstance, setWidgetInstance] = useState<WidgetInstance | null>(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!widgetRequest) {
      setWidgetInstance(null)
      return
    }

    // Create widget instance
    const instance = widgetRegistry.createWidget(widgetRequest.widgetType)
    if (!instance) {
      console.error(`Failed to create widget of type: ${widgetRequest.widgetType}`)
      onCancel(widgetRequest.expansionId)
      return
    }

    // Set up data change handler
    instance.onDataChange = (data: Record<string, any>) => {
      setWidgetInstance(prev => prev ? { ...prev, data } : null)
    }

    setWidgetInstance(instance)

    // Calculate optimal position for modal
    const modalWidth = 500
    const modalHeight = 400
    let x = widgetRequest.position.x
    let y = widgetRequest.position.y + 30 // Offset below cursor

    // Ensure modal stays within screen bounds
    if (x + modalWidth > window.screen.width) {
      x = window.screen.width - modalWidth - 20
    }
    if (y + modalHeight > window.screen.height) {
      y = widgetRequest.position.y - modalHeight - 10 // Show above cursor instead
    }

    setPosition({ x, y })
  }, [widgetRequest, onCancel])

  useEffect(() => {
    if (!widgetRequest) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCancel(widgetRequest.expansionId)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [widgetRequest, onCancel])

  const handleComplete = () => {
    if (widgetInstance && widgetRequest) {
      onComplete(widgetRequest.expansionId, widgetInstance.data)
    }
  }

  const handleCancel = () => {
    if (widgetRequest) {
      onCancel(widgetRequest.expansionId)
    }
  }

  if (!widgetRequest || !widgetInstance) {
    return null
  }

  const widget = widgetRegistry.get(widgetRequest.widgetType)
  if (!widget) {
    return null
  }

  const WidgetComponent = widget.component

  const modalStyle = {
    position: 'fixed' as const,
    left: position.x,
    top: position.y,
    zIndex: 10000,
    width: '500px',
    maxHeight: '600px'
  }

  return (
    <div style={modalStyle} className="animate-slide-up">
      <div className="glass-morphism rounded-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-3 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">
                {widget.config.label}
              </h3>
              <p className="text-sm text-gray-600">
                {widget.config.description}
              </p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Widget Content */}
        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          <WidgetComponent
            id={widgetInstance.id}
            type={widgetInstance.type}
            data={widgetInstance.data}
            config={widgetInstance.config}
            onDataChange={widgetInstance.onDataChange}
            mode="interactive"
            isReadOnly={false}
          />
        </div>

        {/* Footer */}
        <div className="bg-white/90 backdrop-blur-sm px-4 py-3 border-t border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Press Esc to cancel
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleComplete}
                className="px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Insert
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-gray-50/80 backdrop-blur-sm px-4 py-2 border-t border-gray-200/50">
          <div className="text-xs text-gray-600 mb-1">Preview:</div>
          <div className="text-xs text-gray-800 font-mono bg-white/50 rounded px-2 py-1 max-h-20 overflow-y-auto">
            {widgetRegistry.generateText(widgetRequest.widgetType, widgetInstance.data)}
          </div>
        </div>
      </div>
    </div>
  )
}