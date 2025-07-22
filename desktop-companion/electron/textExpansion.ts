import { clipboard, BrowserWindow } from 'electron'
import robot from 'robotjs';

export interface DotPhrase {
  trigger: string
  content: string
  description?: string
  category?: string
}

export interface SmartOptionSelection {
  optionId: string
  selectedValue: string
}

export class TextExpansionEngine {
  private enabled = true
  private pendingExpansions = new Map<string, {
    phrase: DotPhrase
    resolve: (success: boolean) => void
    reject: (error: Error) => void
  }>()

  constructor() {
    // Initialize text expansion engine
  }

  async expandPhrase(phraseData: DotPhrase): Promise<boolean> {
    if (!this.enabled) return false

    try {
      console.log('Expanding phrase:', phraseData.trigger)
      
      // Process the phrase content (handle template variables like [[DATE]], etc.)
      const processedContent = await this.processTemplateVariables(phraseData.content)
      
      // Copy to clipboard
      clipboard.writeText(processedContent)
      
      // Simulate paste operation
      await this.simulatePaste()
      
      return true
    } catch (error) {
      console.error('Error expanding phrase:', error)
      return false
    }
  }

  private async processTemplateVariables(content: string): Promise<string> {
    let processed = content
    
    // Handle [[DATE]] variable
    if (processed.includes('[[DATE]]')) {
      const currentDate = new Date().toLocaleDateString()
      processed = processed.replace(/\[\[DATE\]\]/g, currentDate)
    }
    
    // Handle [[TIME]] variable
    if (processed.includes('[[TIME]]')) {
      const currentTime = new Date().toLocaleTimeString()
      processed = processed.replace(/\[\[TIME\]\]/g, currentTime)
    }
    
    // Handle [[CALC]] - for now, just replace with placeholder
    if (processed.includes('[[CALC]]')) {
      processed = processed.replace(/\[\[CALC\]\]/g, '[Calculation]')
    }
    
    // Handle choice variables like [[Option1|Option2|Option3]]
    const choicePattern = /\[\[([^\]]+)\]\]/g
    let match
    while ((match = choicePattern.exec(processed)) !== null) {
      const choices = match[1].split('|')
      if (choices.length > 1) {
        // For now, select the first option. In a full implementation, 
        // this would show a selection UI
        processed = processed.replace(match[0], choices[0])
      }
    }
    
    return processed
  }

  private async simulatePaste(): Promise<void> {
    const modifier = process.platform === 'darwin' ? 'command' : 'control';
    robot.keyTap('v', [modifier]);
  }

  async expandPhraseWithSmartOptions(phraseData: DotPhrase): Promise<boolean> {
    if (!this.enabled) return false

    try {
      // Check if phrase has interactive smart options
      if (this.hasInteractiveSmartOptions(phraseData.content)) {
        return await this.handleInteractiveExpansion(phraseData)
      } else {
        // Direct expansion for simple phrases
        return await this.performDirectExpansion(phraseData)
      }
    } catch (error) {
      console.error('Failed to expand phrase:', error)
      return false
    }
  }

  private async handleInteractiveExpansion(phraseData: DotPhrase): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const expansionId = `expansion-${Date.now()}`
      
      // Store pending expansion
      this.pendingExpansions.set(expansionId, {
        phrase: phraseData,
        resolve,
        reject
      })

      // Send to renderer process to handle smart options UI
      const focusedWindow = BrowserWindow.getFocusedWindow()
      if (focusedWindow) {
        focusedWindow.webContents.send('show-smart-options', {
          expansionId,
          content: phraseData.content,
          phrase: phraseData
        })
      } else {
        reject(new Error('No focused window available'))
      }

      // Set timeout to prevent hanging
      setTimeout(() => {
        if (this.pendingExpansions.has(expansionId)) {
          this.pendingExpansions.delete(expansionId)
          reject(new Error('Smart options selection timeout'))
        }
      }, 30000) // 30 second timeout
    })
  }

  async completeSmartOptionsExpansion(
    expansionId: string, 
    selections: SmartOptionSelection[]
  ): Promise<void> {
    const pending = this.pendingExpansions.get(expansionId)
    if (!pending) {
      throw new Error('No pending expansion found')
    }

    try {
      // Apply smart option selections
      const processedContent = this.applySmartSelections(pending.phrase.content, selections)
      
      // Perform the actual text insertion
      const success = await this.insertText(processedContent)
      
      // Resolve the promise
      pending.resolve(success)
    } catch (error) {
      pending.reject(error as Error)
    } finally {
      this.pendingExpansions.delete(expansionId)
    }
  }

  cancelSmartOptionsExpansion(expansionId: string): void {
    const pending = this.pendingExpansions.get(expansionId)
    if (pending) {
      pending.resolve(false) // Resolve with false to indicate cancellation
      this.pendingExpansions.delete(expansionId)
    }
  }

  private async performDirectExpansion(phraseData: DotPhrase): Promise<boolean> {
    // Process simple smart options and special functions
    const processedContent = this.processStaticSmartOptions(phraseData.content)
    return await this.insertText(processedContent)
  }

  private async insertText(content: string): Promise<boolean> {
    try {
      // Use clipboard to insert text
      const originalClipboard = clipboard.readText()
      
      clipboard.writeText(content)
      
      // Simulate paste operation
      await this.simulatePaste()
      
      // Restore original clipboard after a short delay
      setTimeout(() => {
        clipboard.writeText(originalClipboard)
      }, 100)
      
      return true
    } catch (error) {
      console.error('Failed to insert text:', error)
      return false
    }
  }

  private hasInteractiveSmartOptions(content: string): boolean {
    // Check for interactive smart options [[option1|option2]]
    const smartOptionRegex = /\[\[([^\]]+?)\]\]/g
    let match
    
    while ((match = smartOptionRegex.exec(content)) !== null) {
      const optionsString = match[1]
      
      // Skip special functions
      if (optionsString === 'DATE' || optionsString === 'CALC') {
        continue
      }
      
      // Skip widget syntax
      if (optionsString.startsWith('WIDGET:')) {
        continue
      }
      
      const options = optionsString.split('|').map((opt: string) => opt.trim())
      if (options.length > 1) {
        return true
      }
    }
    
    // Check for widget syntax [[WIDGET:type:id]]
    const widgetRegex = /\[\[WIDGET:([^:\]]+):([^:\]]+)\]\]/
    if (widgetRegex.test(content)) {
      return true
    }
    
    // Check for special functions that need user interaction
    if (content.includes('[[DATE]]') || content.includes('[[CALC]]')) {
      return true
    }
    
    return false
  }

  private processStaticSmartOptions(content: string): string {
    let processed = content

    // Handle [[DATE]] - replace with current date
    processed = processed.replace(/\[\[DATE\]\]/g, () => {
      return new Date().toLocaleDateString()
    })

    // Handle [[CALC]] - for now, replace with placeholder
    processed = processed.replace(/\[\[CALC\]\]/g, '[Calculator]')

    // Handle widget syntax - leave as placeholder for now
    // Widgets should be handled by the interactive expansion flow
    processed = processed.replace(/\[\[WIDGET:([^:\]]+):([^:\]]+)\]\]/g, (match, type, id) => {
      return `[${type.charAt(0).toUpperCase() + type.slice(1)} Widget]`
    })

    // Handle simple single options (no choices, no widgets)
    processed = processed.replace(/\[\[([^\]|:]+?)\]\]/g, (match, option) => {
      // Skip if it looks like a widget or special function
      if (option === 'DATE' || option === 'CALC' || option.startsWith('WIDGET:')) {
        return match
      }
      return option.trim()
    })

    return processed
  }

  private applySmartSelections(
    content: string, 
    selections: SmartOptionSelection[]
  ): string {
    let processed = content
    const selectionMap = new Map(selections.map(s => [s.optionId, s.selectedValue]))

    // Handle special function replacements first
    const dateSelection = selectionMap.get('special-function-date')
    if (dateSelection) {
      processed = processed.replace(/\[\[DATE\]\]/g, dateSelection)
    }

    const calcSelection = selectionMap.get('special-function-calc')
    if (calcSelection) {
      processed = processed.replace(/\[\[CALC\]\]/g, calcSelection)
    }

    // Replace smart options with selected values
    let optionIndex = 0
    processed = processed.replace(/\[\[([^\]]+?)\]\]/g, (match, optionsString) => {
      // Skip special functions (already handled above)
      if (optionsString === 'DATE' || optionsString === 'CALC') {
        return match // Leave unchanged if not replaced above
      }

      // Skip widget syntax
      if (optionsString.startsWith('WIDGET:')) {
        return match // Will be handled by widget system
      }

      const options = optionsString.split('|').map((opt: string) => opt.trim())
      if (options.length > 1) {
        const optionId = `smart-option-${optionIndex++}`
        const selectedValue = selectionMap.get(optionId) || options[0]
        return selectedValue
      }

      return optionsString.trim()
    })

    return processed
  }


  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  isEnabled(): boolean {
    return this.enabled
  }
}