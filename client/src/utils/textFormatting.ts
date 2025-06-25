/**
 * Utility function to format smart text with auto-numbering and indentation
 * This function converts raw text into properly formatted medical note content
 */
export function formatSmartText(text: string): string {
  if (!text) return '';
  
  const lines = text.split('\n');
  const formatted: string[] = [];
  let conditionCount = 0;

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      conditionCount++;
      const condition = line.replace('#', '').trim();
      formatted.push(`${conditionCount}. ${condition}`);
    } else if (line.startsWith('-')) {
      const detail = line.replace('-', '').trim();
      formatted.push(`     - ${detail}`);
    } else {
      // Only auto-format as numbered condition if line doesn't already start with a number
      if (!/^\d+\./.test(line)) {
        conditionCount++;
        formatted.push(`${conditionCount}. ${line}`);
      } else {
        // Line already has a number, just add it as-is and track the count
        const match = line.match(/^(\d+)\./);
        if (match) {
          const num = parseInt(match[1]);
          if (num > conditionCount) {
            conditionCount = num;
          }
        }
        formatted.push(line);
      }
    }
  }

  return formatted.join('\n');
}