export const MAX_LINE_LENGTH = 75; // Set to 75 to ensure we stay under the 79 character limit

/**
 * Wraps text to a maximum line length while preserving word boundaries and indentation
 * @param text The text to wrap
 * @param firstLineIndent The number of spaces to indent the first line
 * @param continuationIndent The number of spaces to indent continuation lines
 * @returns The wrapped text
 */
export function wrapText(
  text: string,
  firstLineIndent: string | number = 0,
  continuationIndent: string | number = 0
): string {
  if (!text) return '';

  const maxLen = MAX_LINE_LENGTH;
  const firstIndentStr = typeof firstLineIndent === 'number' ? ' '.repeat(firstLineIndent) : firstLineIndent;
  const contIndentStr = typeof continuationIndent === 'number' ? ' '.repeat(continuationIndent) : continuationIndent;

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = firstIndentStr;
  let currentLen = firstIndentStr.length;
  let isFirstLine = true;

  words.forEach((word) => {
    // Determine available length for this line
    const indentStr = isFirstLine ? firstIndentStr : contIndentStr;
    const availableLen = maxLen - indentStr.length;

    // If the word itself is longer than the available length, break it up
    while (word.length > availableLen) {
      if (currentLine.trim().length > 0) {
        lines.push(currentLine);
        currentLine = indentStr;
        currentLen = currentLine.length;
        isFirstLine = false;
      }
      lines.push(indentStr + word.slice(0, availableLen));
      word = word.slice(availableLen);
      isFirstLine = false;
    }

    // If adding this word would exceed the line length, start a new line
    if (currentLen + (currentLine.trim().length > 0 ? 1 : 0) + word.length > maxLen) {
      lines.push(currentLine);
      currentLine = contIndentStr + word;
      currentLen = currentLine.length;
      isFirstLine = false;
    } else {
      currentLine += (currentLine.trim().length > 0 ? ' ' : '') + word;
      currentLen = currentLine.length;
    }
  });

  if (currentLine.trim().length > 0) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

/**
 * Formats a section of text with proper wrapping and indentation
 * @param header The section header
 * @param content The section content
 * @param indent The number of spaces to indent continuation lines
 * @returns The formatted section text
 */
export function formatSection(header: string, content: string, indent: number = 0): string {
  if (!content) return `${header}:\n`;
  
  const wrappedContent = wrapText(content, indent);
  return `${header}:\n${wrappedContent}`;
}

/**
 * Formats a list of items with proper wrapping and indentation
 * @param items The list of items to format
 * @param indent The number of spaces to indent continuation lines
 * @returns The formatted list text
 */
export function formatList(items: string[], indent: number = 0): string {
  if (!items.length) return '';
  
  return items
    .map(item => wrapText(item, indent))
    .join('\n');
} 