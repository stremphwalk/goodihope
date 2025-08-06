import { LabValue } from './labUtils';
import { categorizeLabTest } from './labCategorizer';
import { getCanonicalLabName } from './labCanonical';

export interface ParsedLabData {
  [labName: string]: {
    mainValue: string;
    recentHistory: string[];
    fullHistory: string[];
    formatted: string;
  };
}

export class LabDataParser {
  private parsedData: ParsedLabData = {};

  /**
   * Parse the entire laboratory data string and return organized results.
   * 
   * Format: Lab_Name: Main_Value (Recent_Value1, Recent_Value2, Recent_Value3)
   */
  parseLabString(labData: string): ParsedLabData {
    if (!labData || typeof labData !== 'string') {
      console.warn('Invalid lab data provided to parseLabString:', labData);
      return {};
    }

    try {
      // Split by lab entries with enhanced pattern for special characters and medical notation
      // Supports: lab names with hyphens, plus/minus signs, numbers, accented characters
      const labPattern = /([A-Za-z0-9\s\u00C0-\u017F\-\+\/]+?):\s*([^()]+?)(\([^)]*\))?(?=\s+[A-Za-z0-9\s\u00C0-\u017F\-\+\/]+?:|$)/g;
      const matches = Array.from(labData.trim().matchAll(labPattern));
      
      if (matches.length === 0) {
        console.warn('No lab entries found in the provided data');
        return {};
      }
      
      const parsedLabs: ParsedLabData = {};
      
      for (const match of matches) {
        try {
          const rawLabName = match[1]?.trim();
          const canonicalName = getCanonicalLabName(rawLabName || '');
          if (!canonicalName) {
            // Skip labs not in our canonical list
            continue;
          }

          // Prevent duplicates arising from synonyms (e.g. "Na" vs "Sodium")
          if (parsedLabs[canonicalName]) {
            continue;
          }

          const mainValues = match[2]?.trim();
          const historicalValues = match[3] ? match[3].slice(1, -1) : ''; // Remove parentheses
          
          if (!mainValues) {
            console.warn('Skipping invalid lab entry:', match[0]);
            continue;
          }
          
          // Extract the main (most recent) value
          const mainValue = this.extractMainValue(mainValues);
          
          if (!mainValue) {
            console.warn('No main value found for lab:', canonicalName);
            continue;
          }
          
          // Extract historical values
          const historicalList = this.extractHistoricalValues(historicalValues);
          
          // Get the three most recent historical values
          const recentThree = historicalList.slice(0, 3);
          
          parsedLabs[canonicalName] = {
            mainValue,
            recentHistory: recentThree,
            fullHistory: historicalList,
            formatted: this.formatLabEntry(canonicalName, mainValue, recentThree)
          };
        } catch (entryError) {
          console.error('Error processing lab entry:', match[0], entryError);
          continue;
        }
      }
      
      this.parsedData = parsedLabs;
      return parsedLabs;
    } catch (error) {
      console.error('Error parsing lab string:', error);
      return {};
    }
  }

  /**
   * Extract the main (most recent) value from the main values string.
   */
  private extractMainValue(mainValuesStr: string): string {
    if (!mainValuesStr || typeof mainValuesStr !== 'string') {
      return '';
    }
    
    try {
      // Handle cases where there might be multiple values before parentheses
      const trimmed = mainValuesStr.trim();
      const values = trimmed.split(/\s+/);
      const mainValue = values[0] || '';
      
      // Validate that we have a meaningful value
      if (mainValue.length === 0 || mainValue === ':' || mainValue === '(' || mainValue === ')') {
        return '';
      }
      
      return mainValue;
    } catch (error) {
      console.warn('Error extracting main value from:', mainValuesStr, error);
      return '';
    }
  }

  /**
   * Extract and clean historical values from the parentheses content.
   */
  private extractHistoricalValues(historicalStr: string): string[] {
    if (!historicalStr || typeof historicalStr !== 'string') {
      return [];
    }
    
    try {
      // Split by spaces and clean up
      const values: string[] = [];
      const parts = historicalStr.split(/\s+/);
      
      for (const part of parts) {
        const trimmed = part.trim();
        // Skip empty strings and invalid values
        if (trimmed && trimmed !== '(' && trimmed !== ')' && trimmed !== ':') {
          values.push(trimmed);
        }
      }
      
      // Limit to reasonable number of historical values to prevent memory issues
      return values.slice(0, 10);
    } catch (error) {
      console.warn('Error extracting historical values from:', historicalStr, error);
      return [];
    }
  }

  /**
   * Format a lab entry according to the specified format.
   */
  private formatLabEntry(labName: string, mainValue: string, recentThree: string[]): string {
    if (recentThree.length > 0) {
      const recentStr = recentThree.join(', ');
      return `${labName} ${mainValue} (${recentStr})`;
    } else {
      return `${labName} ${mainValue}`;
    }
  }

  /**
   * Return all parsed labs in the specified format.
   */
  getFormattedOutput(): string {
    if (Object.keys(this.parsedData).length === 0) {
      return 'No data parsed. Please run parseLabString() first.';
    }
    
    const formattedLines: string[] = [];
    for (const [, labInfo] of Object.entries(this.parsedData)) {
      formattedLines.push(labInfo.formatted);
    }
    
    return formattedLines.join('\n');
  }

  /**
   * Get information for a specific lab.
   */
  getLabInfo(labName: string): ParsedLabData[string] | undefined {
    return this.parsedData[labName];
  }

  /**
   * Get list of all parsed lab names.
   */
  getAllLabNames(): string[] {
    return Object.keys(this.parsedData);
  }

  /**
   * Search for labs matching a pattern.
   */
  searchLabs(pattern: string): ParsedLabData {
    const results: ParsedLabData = {};
    const patternLower = pattern.toLowerCase();
    
    for (const [labName, labInfo] of Object.entries(this.parsedData)) {
      if (labName.toLowerCase().includes(patternLower)) {
        results[labName] = labInfo;
      }
    }
    
    return results;
  }

  /**
   * Convert parsed lab data to LabValue format for integration with existing system
   */
  toLabValues(): LabValue[] {
    const labValues: LabValue[] = [];
    const currentTime = new Date();
    
    for (const [labName, labInfo] of Object.entries(this.parsedData)) {
      // Use intelligent categorization instead of hardcoded 'Imported'
      const category = categorizeLabTest(labName);
      
      // Add main value (most recent)
      labValues.push({
        testName: labName,
        value: labInfo.mainValue,
        unit: '', // Could be enhanced to extract units from the data
        category: category,
        timestamp: currentTime.toISOString(),
        referenceRange: ''
      });

      // Add historical values if they exist
      labInfo.recentHistory.forEach((value, index) => {
        // Create timestamps going backwards in time (1 minute intervals for sorting)
        const historicalTime = new Date(currentTime.getTime() - (index + 1) * 60000);
        labValues.push({
          testName: labName,
          value: value,
          unit: '',
          category: category, // Use the same categorization for historical values
          timestamp: historicalTime.toISOString(),
          referenceRange: ''
        });
      });
    }
    
    return labValues;
  }
}

/**
 * Utility function to parse lab text and return LabValue array
 * This is the main entry point for external components
 */
export function parseLabText(labText: string): LabValue[] {
  if (!labText || typeof labText !== 'string') {
    console.warn('Invalid lab text provided to parseLabText:', labText);
    return [];
  }

  try {
    const parser = new LabDataParser();
    const parsedData = parser.parseLabString(labText);
    
    // Check if parsing was successful
    if (Object.keys(parsedData).length === 0) {
      console.warn('No labs were successfully parsed from the provided text');
      return [];
    }
    
    const labValues = parser.toLabValues();
    
    if (labValues.length === 0) {
      console.warn('No valid lab values could be extracted from parsed data');
      return [];
    }
    
    console.log(`Successfully parsed ${labValues.length} lab values from ${Object.keys(parsedData).length} unique tests`);
    return labValues;
  } catch (error) {
    console.error('Error in parseLabText:', error);
    return [];
  }
}