export interface SmartOption {
  id: string
  placeholder: string
  options: string[]
  startIndex: number
  endIndex: number
}

export interface ParsedContent {
  text: string
  smartOptions: SmartOption[]
}

export class SmartOptionsParser {
  /**
   * Parse content and extract smart options [[option1|option2|option3]]
   */
  static parseContent(content: string): ParsedContent {
    const smartOptions: SmartOption[] = []
    let processedText = content
    let offset = 0

    // Regex to match [[option1|option2|option3]] patterns
    const smartOptionRegex = /\[\[([^\]]+?)\]\]/g
    let match

    while ((match = smartOptionRegex.exec(content)) !== null) {
      const fullMatch = match[0]
      const optionsString = match[1]
      const options = optionsString.split('|').map(opt => opt.trim())
      
      if (options.length > 1) {
        const smartOption: SmartOption = {
          id: `smart-option-${smartOptions.length}`,
          placeholder: fullMatch,
          options,
          startIndex: match.index - offset,
          endIndex: match.index + fullMatch.length - offset
        }
        
        smartOptions.push(smartOption)
        
        // Replace the smart option with a placeholder in the text
        const placeholder = `{${smartOption.id}}`
        processedText = processedText.replace(fullMatch, placeholder)
        
        // Adjust offset for future matches
        offset += fullMatch.length - placeholder.length
      }
    }

    return {
      text: processedText,
      smartOptions
    }
  }

  /**
   * Replace smart option placeholders with selected values
   */
  static applySelections(
    parsedContent: ParsedContent, 
    selections: Record<string, string>
  ): string {
    let result = parsedContent.text

    // Replace each smart option placeholder with the selected value
    parsedContent.smartOptions.forEach(option => {
      const placeholder = `{${option.id}}`
      const selectedValue = selections[option.id] || option.options[0] // Default to first option
      result = result.replace(placeholder, selectedValue)
    })

    return result
  }

  /**
   * Handle special smart functions like [[DATE]] and [[CALC]]
   */
  static processSpecialFunctions(content: string): string {
    let processedContent = content

    // Handle [[DATE]] - replace with current date
    processedContent = processedContent.replace(/\[\[DATE\]\]/g, () => {
      return new Date().toLocaleDateString()
    })

    // Handle [[CALC]] - this will trigger calculator modal
    // For now, we'll leave it as a placeholder that triggers the calculator
    processedContent = processedContent.replace(/\[\[CALC\]\]/g, '{CALC_TRIGGER}')

    return processedContent
  }

  /**
   * Check if content has any smart options that need user interaction
   */
  static hasInteractiveOptions(content: string): boolean {
    const smartOptionRegex = /\[\[([^\]]+?)\]\]/g
    let match
    
    while ((match = smartOptionRegex.exec(content)) !== null) {
      const optionsString = match[1]
      
      // Skip special functions
      if (optionsString === 'DATE' || optionsString === 'CALC') {
        continue
      }
      
      const options = optionsString.split('|').map(opt => opt.trim())
      if (options.length > 1) {
        return true
      }
    }
    
    return false
  }

  /**
   * Get the first unresolved smart option from content
   */
  static getFirstInteractiveOption(content: string): SmartOption | null {
    const parsed = this.parseContent(content)
    
    if (parsed.smartOptions.length > 0) {
      const firstOption = parsed.smartOptions[0]
      return {
        ...firstOption,
        // Add position information for modal placement
        startIndex: firstOption.startIndex,
        endIndex: firstOption.endIndex
      }
    }
    
    return null
  }

  /**
   * Validate and sanitize smart option values
   */
  static sanitizeOption(option: string): string {
    return option.trim().replace(/[<>]/g, '') // Basic sanitization
  }
}

// Export types for use in other components