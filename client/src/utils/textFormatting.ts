/**
 * Utility function to format smart text with auto-numbering and indentation
 * This function converts raw text into properly formatted medical note content
 */
export function formatSmartText(text: string, options: {
  sectionType?: 'pmh' | 'impression' | 'plan' | 'hpi' | 'physical-exam' | 'default';
  removeInstructions?: boolean;
  preserveFormatting?: boolean;
} = {}): string {
  if (!text) return '';
  
  const { sectionType = 'default', removeInstructions = true, preserveFormatting = false } = options;
  
  const lines = text.split('\n');
  const formatted: string[] = [];
  let conditionCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // Remove instruction lines from template defaults
    if (removeInstructions) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith('instructions:') || 
          lowerLine.startsWith('instruction:') ||
          lowerLine.includes('new line = auto-numbered') ||
          lowerLine.includes('tab = add sub-point') ||
          lowerLine.includes('new line =') ||
          lowerLine.includes('tab =')) {
        continue;
      }
    }

    // Handle different formatting markers
    if (line.startsWith('#')) {
      conditionCount++;
      const condition = line.replace('#', '').trim();
      formatted.push(`${conditionCount}. ${condition}`);
    } else if (line.startsWith('--')) {
      // Sub-sub-detail (deeper indentation)
      const subDetail = line.replace('--', '').trim();
      formatted.push(`       - ${subDetail}`);
    } else if (line.startsWith('-')) {
      // Sub-detail
      const detail = line.replace('-', '').trim();
      formatted.push(`     - ${detail}`);
    } else {
      // Handle section-specific formatting
      if (preserveFormatting && /^\d+\./.test(line)) {
        // Line already has a number, preserve it and track count
        const match = line.match(/^(\d+)\./);
        if (match) {
          const num = parseInt(match[1]);
          if (num > conditionCount) {
            conditionCount = num;
          }
        }
        formatted.push(line);
      } else if (!preserveFormatting || !/^\d+\./.test(line)) {
        // Auto-format as numbered condition
        conditionCount++;
        formatted.push(`${conditionCount}. ${line}`);
      } else {
        formatted.push(line);
      }
    }
  }

  return formatted.join('\n');
}

/**
 * Format text specifically for medical assessment/impression sections
 */
export function formatImpressionText(text: string): string {
  return formatSmartText(text, {
    sectionType: 'impression',
    removeInstructions: true,
    preserveFormatting: false
  });
}

/**
 * Format text specifically for past medical history sections
 */
export function formatPMHText(text: string): string {
  return formatSmartText(text, {
    sectionType: 'pmh',
    removeInstructions: true,
    preserveFormatting: false
  });
}

/**
 * Format text for plan sections with proper numbering
 */
export function formatPlanText(text: string): string {
  return formatSmartText(text, {
    sectionType: 'plan',
    removeInstructions: true,
    preserveFormatting: false
  });
}

/**
 * Format text for HPI sections with basic formatting
 */
export function formatHPIText(text: string): string {
  if (!text) return '';
  
  // For HPI, we generally want to preserve paragraph structure
  // but can clean up obvious formatting issues
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .join('\n');
}

/**
 * Determine if a section should use smart text formatting
 */
export function shouldFormatSection(sectionId: string): boolean {
  const formattableSections = ['pmh', 'impression', 'plan', 'physical-exam'];
  return formattableSections.includes(sectionId);
}