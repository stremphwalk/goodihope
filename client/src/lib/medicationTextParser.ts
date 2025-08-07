import { createMedication, type SelectedMedication } from './medicationUtils';

export interface ParsedMedicationData {
  name: string;
  dosage: string;
  frequency: string;
  route?: string;
  isIV: boolean;
}

export class MedicationTextParser {
  private readonly frequencyMap = new Map([
    ['une fois par jour', 'DIE'],
    ['une fois', 'DIE'],
    ['deux fois par jour', 'BID'],
    ['deux fois', 'BID'],
    ['deux (2) fois', 'BID'],
    ['trois fois par jour', 'TID'],
    ['trois fois', 'TID'],
    ['trois (3) fois', 'TID'],
    ['quatre fois par jour', 'QID'],
    ['quatre fois', 'QID'],
    ['quatre (4) fois', 'QID'],
    ['cinq fois par jour', '5x daily'],
    ['cinq fois', '5x daily'],
    ['six fois par jour', '6x daily'],
    ['six fois', '6x daily'],
  ]);

  /**
   * Parse the medication text and return structured medication data
   */
  parseMedicationText(medicationText: string): ParsedMedicationData[] {
    if (!medicationText || typeof medicationText !== 'string') {
      console.warn('Invalid medication text provided');
      return [];
    }

    const lines = medicationText.trim().split('\n').filter(line => line.trim());
    const parsedMedications: ParsedMedicationData[] = [];

    for (const line of lines) {
      try {
        const parsedMed = this.parseMedicationLine(line);
        if (parsedMed) {
          parsedMedications.push(parsedMed);
        }
      } catch (error) {
        console.warn('Error parsing medication line:', line, error);
        continue;
      }
    }

    return parsedMedications;
  }

  /**
   * Determine if a medication line should be skipped (future-dated or scheduled)
   */
  private shouldSkipMedication(line: string): boolean {
    const lowerLine = line.toLowerCase();
    
    // Skip medications with "commencer" (to start) indicating future start date
    if (lowerLine.includes('commencer')) {
      return true;
    }
    
    // Skip medications with "par défaut à)" pattern specifically (incomplete/scheduled)
    if (lowerLine.includes('par défaut à)')) {
      return true;
    }
    
    // The key distinction: medications that are currently prescribed but have scheduled times
    // should NOT be filtered. Only filter if there are explicit future start indicators.
    
    return false;
  }

  /**
   * Parse a single medication line
   * Format: Date Time GenericName [BrandName] Dosage Route Frequency Instructions
   */
  private parseMedicationLine(line: string): ParsedMedicationData | null {
    const trimmedLine = line.trim();
    if (!trimmedLine) return null;

    // Check if this medication should be skipped (future-dated or scheduled)
    if (this.shouldSkipMedication(trimmedLine)) {
      return null;
    }

    // Remove date/time at the beginning (format: YY-MM-DD HHMM or YYYY-MM-DD HHMM)
    const withoutDateTime = trimmedLine.replace(/^\d{1,2}-\d{2}-\d{2}\s+\d{4}\s+/, '');
    if (!withoutDateTime) return null;

    // Extract medication name and remainder by finding the first dosage pattern
    // Look for patterns like "40 mg", "5 000 Unités", "x 1 co", "app cr", etc.
    const dosagePatterns = [
      // Pattern for thousands with space: "5 000 Unités"
      /\s+(\d+\s\d{3})\s+(Unités?|mg|g|mcg|bouffée\(s\)|gtte\(s\)|mEq)/i,
      // Pattern for regular dosages: "40 mg", "12 mcg"
      /\s+(\d+(?:[,\.]\d+)?(?:-\d+(?:[,\.]\d+)?)?)\s*(mg|g|mcg|Unités?|bouffée\(s\)|gtte\(s\)|mEq)/i,
      // Pattern for "x 1 co" format
      /\s+(x\s+\d+)\s*(co|caps)/i,
      // Pattern for topical applications: "app cr"
      /\s+(app)\s+(cr|topique)/i,
    ];

    let splitIndex = -1;
    for (const pattern of dosagePatterns) {
      const match = withoutDateTime.match(pattern);
      if (match && match.index !== undefined) {
        splitIndex = match.index;
        break;
      }
    }

    if (splitIndex === -1) {
      // Fallback: split at first number if no specific dosage pattern found
      const numberMatch = withoutDateTime.match(/\s+(\d)/);
      if (numberMatch && numberMatch.index !== undefined) {
        splitIndex = numberMatch.index;
      } else {
        return null;
      }
    }

    const fullMedicationPart = withoutDateTime.substring(0, splitIndex).trim();
    const remainder = withoutDateTime.substring(splitIndex).trim();
    
    // Extract the generic name by removing all bracketed parts
    // Handle cases like "Polyethylene Glycol [MiraLax/Lax-A-Day][PEG 3350]"
    let genericName = fullMedicationPart.replace(/\s*\[[^\]]*\]/g, '').trim();
    
    if (!genericName) return null;

    // Check for IV medication
    const isIV = remainder.includes('"IV"') || remainder.includes(' IV ') || 
                remainder.includes(' IV') || remainder.toLowerCase().includes('intraveineuse');

    // Extract dosage and route information
    const dosageInfo = this.extractDosageInfo(remainder);
    if (!dosageInfo.dosage) return null;

    // Extract frequency information
    const frequency = this.extractFrequency(remainder);

    return {
      name: this.cleanMedicationName(genericName),
      dosage: dosageInfo.dosage,
      frequency: frequency,
      route: dosageInfo.route,
      isIV: isIV
    };
  }

  /**
   * Extract dosage information from the medication line
   */
  private extractDosageInfo(text: string): { dosage: string; route?: string } {
    // Common patterns for dosage extraction (order matters - more specific patterns first)
    const patterns = [
      // Pattern for multiplication: "81 mg 4 co" (dose then multiplier)
      /(\d+(?:[,\.]\d+)?)\s*(mg|g|mcg|Unités?|bouffée\(s\)|gtte\(s\))\s+(\d+)\s*co/i,
      // Pattern for ranges like "0,5-1 mg" or "1-2 mg" (MUST be before thousands separator)
      /(\d+(?:[,\.]\d+)?-\d+(?:[,\.]\d+)?)\s*(mg|g|mcg|Unités?|bouffée\(s\)|gtte\(s\))/i,
      // Pattern: "1 000 mg" (with space as thousands separator)
      /(\d+(?:\s\d{3})*)\s*(mg|g|mcg|Unités?|bouffée\(s\)|gtte\(s\))/i,
      // Pattern: "500 mg co PO" or "500 mg IV" 
      /(\d+(?:\.\d+)?)\s*(mg|g|mcg|Unités?|bouffée\(s\)|gtte\(s\))/i,
      // Pattern for percentage-based medications
      /(\d+(?:\.\d+)?)\s*%/i,
    ];

    let dosage = '';

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        let baseDoseStr = match[1];
        const unit = match[2] || '%';
        let multiplier = 1;
        
        // Check if this is a multiplication pattern (pattern index 0)
        if (match[3]) {
          multiplier = parseInt(match[3]);
        }
        
        // Handle French decimal separator (comma to dot)
        if (baseDoseStr.includes(',')) {
          baseDoseStr = baseDoseStr.replace(',', '.');
        }
        // Handle space-separated thousands (e.g., "1 000" -> "1000")
        if (baseDoseStr.includes(' ') && !baseDoseStr.includes('-')) {
          baseDoseStr = baseDoseStr.replace(/\s/g, '');
        }

        // For ranges like "0.5-1", preserve the range format
        if (baseDoseStr.includes('-')) {
          dosage = `${baseDoseStr} ${unit}`;
        } else if (multiplier > 1) {
          // Calculate total dosage for multiplication
          const baseDose = parseFloat(baseDoseStr);
          const totalDose = baseDose * multiplier;
          dosage = `${totalDose} ${unit}`;
        } else {
          // Single dose
          dosage = `${baseDoseStr} ${unit}`;
        }
        break;
      }
    }

    // Extract route if present (mainly for IV)
    let route = '';
    if (text.includes('IV') || text.includes('"IV"')) {
      route = 'IV';
    }

    return { dosage, route };
  }

  /**
   * Extract frequency from medication text
   */
  private extractFrequency(text: string): string {
    const lowercaseText = text.toLowerCase();
    
    // Check for specific frequency patterns
    for (const [frenchFreq, standardFreq] of this.frequencyMap.entries()) {
      if (lowercaseText.includes(frenchFreq.toLowerCase())) {
        return standardFreq;
      }
    }

    // Special patterns for "au besoin" (as needed)
    if (lowercaseText.includes('au besoin')) {
      if (lowercaseText.includes('toutes les 4 heures')) return 'Q4H PRN';
      if (lowercaseText.includes('toutes les 6 heures')) return 'Q6H PRN';
      if (lowercaseText.includes('toutes les 8 heures')) return 'Q8H PRN';
      if (lowercaseText.includes('toutes les 12 heures')) return 'Q12H PRN';
      return 'PRN';
    }

    // Special patterns for scheduled intervals
    if (lowercaseText.includes('toutes les 4 heures')) return 'Q4H';
    if (lowercaseText.includes('toutes les 6 heures')) return 'Q6H';
    if (lowercaseText.includes('toutes les 8 heures')) return 'Q8H';
    if (lowercaseText.includes('toutes les 12 heures')) return 'Q12H';

    // Weekly patterns
    if (lowercaseText.includes('lundi mercredi vendredi')) return 'Mon Wed Fri';
    if (lowercaseText.includes('tous les lundi')) return 'Weekly Mon';
    if (lowercaseText.includes('tous les mardi')) return 'Weekly Tue';
    if (lowercaseText.includes('tous les mercredi')) return 'Weekly Wed';
    if (lowercaseText.includes('tous les jeudi')) return 'Weekly Thu';
    if (lowercaseText.includes('tous les vendredi')) return 'Weekly Fri';

    // Default frequency if nothing specific found
    return 'PRN';
  }

  /**
   * Clean medication name by removing extra whitespace and formatting
   */
  private cleanMedicationName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Convert parsed medication data to SelectedMedication objects
   */
  createMedicationsFromParsed(parsedMeds: ParsedMedicationData[]): SelectedMedication[] {
    return parsedMeds.map(med => {
      const medication = createMedication(med.name, false);
      
      // Set dosage with IV indication if applicable
      let dosage = med.dosage;
      if (med.isIV && !dosage.includes('IV')) {
        dosage = `${dosage} IV`;
      }
      
      return {
        ...medication,
        dosage: dosage,
        frequency: med.frequency
      };
    });
  }
}

/**
 * Remove duplicate medications based on name, dosage, and frequency
 */
function deduplicateMedications(medications: SelectedMedication[]): SelectedMedication[] {
  const seen = new Set<string>();
  const unique: SelectedMedication[] = [];
  
  for (const med of medications) {
    const key = `${med.name}-${med.dosage}-${med.frequency}`.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(med);
    }
  }
  
  return unique;
}

/**
 * Main parsing function to be used by components
 */
export function parseMedicationText(medicationText: string): SelectedMedication[] {
  const parser = new MedicationTextParser();
  const parsedData = parser.parseMedicationText(medicationText);
  const medications = parser.createMedicationsFromParsed(parsedData);
  
  // Deduplicate in case the input text has duplicate entries
  return deduplicateMedications(medications);
}