import React, { useState, useEffect } from 'react'
import { FloatingWidgetModal } from './FloatingWidgetModal'
import { widgetRegistry } from '../lib/widgetRegistry'

interface WidgetRequest {
  expansionId: string
  widgetType: string
  widgetId: string
  position: { x: number; y: number }
}

export function WidgetManager() {
  const [currentRequest, setCurrentRequest] = useState<WidgetRequest | null>(null)

  useEffect(() => {
    if (!window.electronAPI) return

    // Listen for widget requests from main process
    const handleWidgetRequest = (data: {
      expansionId: string
      content: string
      phrase: any
    }) => {
      handleWidgetExpansion(data)
    }

    // For now, we'll listen to the same smart options event and check for widgets
    window.electronAPI.onShowSmartOptions(handleWidgetRequest)

    return () => {
      window.electronAPI.removeAllListeners('show-smart-options')
    }
  }, [])

  const handleWidgetExpansion = async (data: {
    expansionId: string
    content: string
    phrase: any
  }) => {
    // Parse content for widget syntax
    const widgets = widgetRegistry.parseWidgetSyntax(data.content)
    
    if (widgets.length === 0) {
      // No widgets found, let smart options handle it
      return
    }

    // For now, handle the first widget found
    const firstWidget = widgets[0]
    
    // Get current cursor position
    const position = await window.electronAPI.getCursorPosition()

    setCurrentRequest({
      expansionId: data.expansionId,
      widgetType: firstWidget.type,
      widgetId: firstWidget.id,
      position
    })
  }

  const handleWidgetComplete = (expansionId: string, widgetData: Record<string, any>) => {
    if (!currentRequest) return

    // Generate text from widget data
    const generatedText = widgetRegistry.generateText(currentRequest.widgetType, widgetData)
    
    // For now, we'll use the same completion mechanism as smart options
    // In a more sophisticated implementation, we'd have a separate widget completion handler
    const selections = [{
      optionId: `widget-${currentRequest.widgetType}-${currentRequest.widgetId}`,
      selectedValue: generatedText
    }]

    window.electronAPI.completeSmartOptions(expansionId, selections)
    setCurrentRequest(null)
  }

  const handleWidgetCancel = (expansionId: string) => {
    window.electronAPI.cancelSmartOptions(expansionId)
    setCurrentRequest(null)
  }

  return (
    <>
      <FloatingWidgetModal
        widgetRequest={currentRequest}
        onComplete={handleWidgetComplete}
        onCancel={handleWidgetCancel}
      />
      
      {/* Widget availability indicator */}
      <div className="fixed bottom-4 left-4 z-40">
        <div className="glass-morphism rounded-lg p-3 text-sm max-w-xs">
          <div className="text-gray-600 mb-1 font-medium">Available Widgets</div>
          <div className="space-y-1">
            {widgetRegistry.list().map(type => {
              const widget = widgetRegistry.get(type)
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span className="text-gray-700">
                    {widget?.config.label || type}
                  </span>
                  <span className="text-gray-500 text-xs">
                    [[WIDGET:{type}:id]]
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Use widget syntax in dot phrases to trigger interactive widgets
          </div>
        </div>
      </div>
    </>
  )
}