/**
 * Medical note formatting utilities
 * Ensures consistent formatting across all note types and templates
 */

export interface NoteFormattingOptions {
  sectionSeparator?: string;
  headerStyle?: 'uppercase' | 'title' | 'sentence';
  indentationStyle?: 'spaces' | 'tabs';
  lineSpacing?: 'single' | 'double';
  preserveEmptyLines?: boolean;
  maxLineLength?: number;
}

export const DEFAULT_NOTE_FORMATTING: NoteFormattingOptions = {
  sectionSeparator: '\n\n',
  headerStyle: 'uppercase',
  indentationStyle: 'spaces',
  lineSpacing: 'single',
  preserveEmptyLines: false,
  maxLineLength: 0 // No line wrapping by default
};

/**
 * Format a complete medical note with consistent styling
 */
export function formatMedicalNote(
  sections: string[], 
  options: NoteFormattingOptions = DEFAULT_NOTE_FORMATTING
): string {
  const opts = { ...DEFAULT_NOTE_FORMATTING, ...options };
  
  // Filter out empty sections
  const validSections = sections
    .filter(section => section && section.trim())
    .map(section => formatNoteSection(section, opts));
  
  if (validSections.length === 0) {
    return '';
  }
  
  // Join sections with consistent separator
  let formattedNote = validSections.join(opts.sectionSeparator);
  
  // Apply line spacing
  if (opts.lineSpacing === 'double') {
    formattedNote = formattedNote.replace(/\n/g, '\n\n');
  }
  
  // Remove excessive empty lines unless preserving them
  if (!opts.preserveEmptyLines) {
    formattedNote = formattedNote.replace(/\n\s*\n\s*\n/g, '\n\n');
  }
  
  // Ensure note ends with single newline
  formattedNote = formattedNote.trim() + '\n';
  
  return formattedNote;
}

/**
 * Format an individual note section
 */
export function formatNoteSection(
  section: string, 
  options: NoteFormattingOptions = DEFAULT_NOTE_FORMATTING
): string {
  if (!section || !section.trim()) {
    return '';
  }
  
  const lines = section.split('\n');
  const formattedLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if this is a header line (contains a colon and is uppercase-ish)
    if (isHeaderLine(line)) {
      formattedLines.push(formatHeaderLine(line, options.headerStyle));
    } else {
      // Regular content line
      let formattedLine = line;
      
      // Apply indentation style
      if (options.indentationStyle === 'spaces') {
        formattedLine = formattedLine.replace(/\t/g, '    ');
      } else if (options.indentationStyle === 'tabs') {
        formattedLine = formattedLine.replace(/    /g, '\t');
      }
      
      // Apply line length limit if specified
      if (options.maxLineLength && options.maxLineLength > 0) {
        formattedLine = wrapLine(formattedLine, options.maxLineLength);
      }
      
      formattedLines.push(formattedLine);
    }
  }
  
  return formattedLines.join('\n');
}

/**
 * Check if a line is a section header
 */
function isHeaderLine(line: string): boolean {
  const trimmed = line.trim();
  return (
    trimmed.includes(':') && 
    trimmed.indexOf(':') < trimmed.length - 1 && // Colon not at end
    (trimmed.toUpperCase() === trimmed || // All uppercase
     /^[A-Z][A-Z\s&-]+:/.test(trimmed)) // Starts with capital, mostly capitals
  );
}

/**
 * Format a header line according to style preference
 */
function formatHeaderLine(line: string, style: 'uppercase' | 'title' | 'sentence' = 'uppercase'): string {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) return line;
  
  const header = line.substring(0, colonIndex);
  const content = line.substring(colonIndex);
  
  let formattedHeader = header.trim();
  
  switch (style) {
    case 'uppercase':
      formattedHeader = formattedHeader.toUpperCase();
      break;
    case 'title':
      formattedHeader = toTitleCase(formattedHeader);
      break;
    case 'sentence':
      formattedHeader = formattedHeader.charAt(0).toUpperCase() + 
        formattedHeader.slice(1).toLowerCase();
      break;
  }
  
  return formattedHeader + content;
}

/**
 * Convert text to title case
 */
function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
}

/**
 * Wrap long lines at word boundaries
 */
function wrapLine(line: string, maxLength: number): string {
  if (line.length <= maxLength) return line;
  
  const words = line.split(' ');
  const wrappedLines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxLength) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    wrappedLines.push(currentLine);
  }
  
  return wrappedLines.join('\n');
}

/**
 * Validate note formatting for medical standards
 */
export function validateNoteFormatting(note: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for basic structure
  if (!note || !note.trim()) {
    issues.push('Note is empty');
    return { isValid: false, issues, suggestions };
  }
  
  // Check for section headers
  const hasHeaders = /[A-Z][A-Z\s&-]+:/g.test(note);
  if (!hasHeaders) {
    suggestions.push('Consider adding section headers for better organization');
  }
  
  // Check for excessive empty lines
  const excessiveEmptyLines = /\n\s*\n\s*\n\s*\n/.test(note);
  if (excessiveEmptyLines) {
    suggestions.push('Consider reducing excessive empty lines');
  }
  
  // Check for inconsistent indentation
  const hasSpaceIndent = note.includes('    ');
  const hasTabIndent = note.includes('\t');
  if (hasSpaceIndent && hasTabIndent) {
    suggestions.push('Use consistent indentation (either spaces or tabs)');
  }
  
  // Check for very long lines (>120 chars)
  const lines = note.split('\n');
  const longLines = lines.filter(line => line.length > 120);
  if (longLines.length > 0) {
    suggestions.push(`Consider breaking ${longLines.length} long lines for better readability`);
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

/**
 * Apply medical note formatting standards
 */
export function applyMedicalStandards(note: string): string {
  return formatMedicalNote([note], {
    sectionSeparator: '\n\n',
    headerStyle: 'uppercase',
    indentationStyle: 'spaces',
    lineSpacing: 'single',
    preserveEmptyLines: false
  });
}