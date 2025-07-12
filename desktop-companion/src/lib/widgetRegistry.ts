import { WidgetComponent, WidgetInstance, WidgetRegistryInterface } from '../types/widgets'

class WidgetRegistryManager implements WidgetRegistryInterface {
  private widgets = new Map<string, WidgetComponent>()

  register(type: string, widget: WidgetComponent): void {
    this.widgets.set(type, widget)
  }

  get(type: string): WidgetComponent | undefined {
    return this.widgets.get(type)
  }

  list(): string[] {
    return Array.from(this.widgets.keys())
  }

  createWidget(type: string, initialData?: Record<string, any>): WidgetInstance | null {
    const widget = this.widgets.get(type)
    if (!widget) {
      console.warn(`Widget type "${type}" not found`)
      return null
    }

    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      id,
      type,
      data: { ...widget.config.defaultData, ...(initialData || {}) },
      config: {},
      onDataChange: (data: Record<string, any>) => {
        // Default handler - will be overridden by parent component
        console.log(`Widget ${id} data changed:`, data)
      },
      mode: 'interactive',
      isReadOnly: false
    }
  }

  generateText(type: string, data: Record<string, any>, config?: Record<string, any>): string {
    const widget = this.widgets.get(type)
    if (!widget) {
      return `[Unknown widget: ${type}]`
    }

    try {
      return widget.generateText(data, config)
    } catch (error) {
      console.error(`Error generating text for widget ${type}:`, error)
      return `[Error rendering ${type} widget]`
    }
  }

  validateData(type: string, data: Record<string, any>): boolean {
    const widget = this.widgets.get(type)
    if (!widget || !widget.validateData) {
      return true // Default to valid if no validator
    }

    try {
      return widget.validateData(data)
    } catch (error) {
      console.error(`Error validating data for widget ${type}:`, error)
      return false
    }
  }

  parseWidgetSyntax(text: string): Array<{ 
    type: string
    id: string
    fullMatch: string
    startIndex: number
    endIndex: number 
  }> {
    const widgetRegex = /\[\[WIDGET:([^:\]]+):([^:\]]+)\]\]/g
    const widgets: Array<{ 
      type: string
      id: string
      fullMatch: string
      startIndex: number
      endIndex: number 
    }> = []
    
    let match
    while ((match = widgetRegex.exec(text)) !== null) {
      widgets.push({
        type: match[1],
        id: match[2],
        fullMatch: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length
      })
    }
    
    return widgets
  }

  // Helper method to check if text contains widgets
  hasWidgets(text: string): boolean {
    return /\[\[WIDGET:[^:\]]+:[^:\]]+\]\]/.test(text)
  }

  // Helper method to replace widget syntax with generated text
  renderWidgetsAsText(text: string, widgetData: Map<string, Record<string, any>>): string {
    const widgets = this.parseWidgetSyntax(text)
    let result = text
    
    // Process widgets in reverse order to maintain correct indices
    widgets.reverse().forEach(widget => {
      const data = widgetData.get(widget.id)
      if (data) {
        const generatedText = this.generateText(widget.type, data)
        result = result.substring(0, widget.startIndex) + generatedText + result.substring(widget.endIndex)
      }
    })
    
    return result
  }

  // Get widget statistics
  getStats() {
    return {
      totalWidgets: this.widgets.size,
      availableTypes: Array.from(this.widgets.keys()),
      registeredWidgets: Array.from(this.widgets.entries()).map(([type, widget]) => ({
        type,
        label: widget.config.label,
        description: widget.config.description,
        version: widget.config.version || '1.0.0'
      }))
    }
  }
}

// Export singleton instance
export const widgetRegistry = new WidgetRegistryManager()

// Export types for external use
export type { WidgetRegistryInterface } from '../types/widgets'