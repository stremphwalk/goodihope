export function replaceRange(s: string, start: number, end: number, replacement: string) {
  return s.slice(0, start) + replacement + s.slice(end);
}

export function getCurrentLineInfo(text: string, cursor: number) {
  const prev = text.lastIndexOf("\n", cursor - 1);
  const next = text.indexOf("\n", cursor);
  const start = prev === -1 ? 0 : prev + 1;
  const end = next === -1 ? text.length : next;
  return { start, end, line: text.slice(start, end), column: cursor - start };
}

export function getTokenRange(line: string, column: number): [number, number] | null {
  if (!line) return null;
  const isWord = (ch: string) => /[\p{L}\p{N}_\-]/u.test(ch);
  let l = column - 1;
  while (l >= 0 && isWord(line[l])) l--;
  let r = column;
  while (r < line.length && isWord(line[r])) r++;
  return r - (l + 1) > 0 ? [l + 1, r] : null;
}

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const repeatSpaces = (n: number) => Array(Math.max(0, n)).fill(" ").join("");

// Line analysis utilities for PMH editor
export function getLineType(line: string): 'diagnosis' | 'context' | 'empty' {
  const trimmed = line.trim();
  if (!trimmed) return 'empty';
  
  // Context lines start with indent and hyphen
  if (/^\s+[-•]/.test(line)) return 'context';
  
  // Everything else is a diagnosis
  return 'diagnosis';
}

export function getIndentLevel(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

export function isDiagnosisLine(line: string): boolean {
  return getLineType(line) === 'diagnosis' && line.trim().length > 0;
}

export function isContextLine(line: string): boolean {
  return getLineType(line) === 'context';
}

export function hasContentAfterCursor(line: string, column: number): boolean {
  return line.slice(column).trim().length > 0;
}