// @ts-nocheck
/**
 * Cursor Position Detection Utilities
 * Advanced DOM utilities for detecting text cursor position in any input type
 */

export interface CursorPosition {
  x: number;
  y: number;
  element: HTMLElement;
  selectionStart: number;
  selectionEnd: number;
}

export interface TextInsertionResult {
  success: boolean;
  insertedAt: number;
  element: HTMLElement;
  error?: string;
}

/**
 * Get the current cursor position in the focused element
 */
export function getCurrentCursorPosition(): CursorPosition | null {
  const activeElement = document.activeElement as HTMLElement;
  
  if (!activeElement) return null;
  
  // Handle different input types
  if (isTextInput(activeElement)) {
    return getInputCursorPosition(activeElement as HTMLInputElement | HTMLTextAreaElement);
  } else if (isContentEditable(activeElement)) {
    return getContentEditableCursorPosition(activeElement);
  }
  
  return null;
}

/**
 * Check if element is a text input (input or textarea)
 */
export function isTextInput(element: HTMLElement): boolean {
  if (!element) return false;
  
  const tagName = element.tagName.toLowerCase();
  
  if (tagName === 'textarea') return true;
  
  if (tagName === 'input') {
    const type = (element as HTMLInputElement).type.toLowerCase();
    const textInputTypes = [
      'text', 'search', 'url', 'tel', 'email', 'password', 
      'number', 'date', 'datetime-local', 'month', 'time', 'week'
    ];
    return textInputTypes.includes(type);
  }
  
  return false;
}

/**
 * Check if element is content editable
 */
export function isContentEditable(element: HTMLElement): boolean {
  if (!element) return false;
  
  return element.contentEditable === 'true' || 
         element.isContentEditable ||
         element.getAttribute('contenteditable') === 'true';
}

/**
 * Get cursor position for input and textarea elements
 */
export function getInputCursorPosition(element: HTMLInputElement | HTMLTextAreaElement): CursorPosition | null {
  if (!element) return null;
  
  try {
    const selectionStart = element.selectionStart || 0;
    const selectionEnd = element.selectionEnd || 0;
    
    // Create a temporary element to measure text dimensions
    const measureElement = createMeasurementElement(element);
    
    // Get text before cursor
    const textBeforeCursor = element.value.substring(0, selectionStart);
    measureElement.textContent = textBeforeCursor;
    
    // Calculate position
    const rect = element.getBoundingClientRect();
    const computedStyle = window.getComputedStyle(element);
    
    // Get scroll positions
    const scrollLeft = element.scrollLeft || 0;
    const scrollTop = element.scrollTop || 0;
    
    // Calculate cursor coordinates
    const paddingLeft = parseInt(computedStyle.paddingLeft, 10) || 0;
    const paddingTop = parseInt(computedStyle.paddingTop, 10) || 0;
    const fontSize = parseInt(computedStyle.fontSize, 10) || 16;
    const lineHeight = parseInt(computedStyle.lineHeight, 10) || fontSize * 1.2;
    
    // For single line inputs
    if (element.tagName.toLowerCase() === 'input') {
      const textWidth = getTextWidth(textBeforeCursor, computedStyle);
      
      const x = rect.left + paddingLeft + textWidth - scrollLeft;
      const y = rect.top + paddingTop + (lineHeight / 2);
      
      // Clean up measurement element
      measureElement.remove();
      
      return {
        x: Math.round(x),
        y: Math.round(y),
        element,
        selectionStart,
        selectionEnd
      };
    }
    
    // For textarea - calculate line and column
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines.length - 1;
    const currentColumn = lines[currentLine].length;
    
    const textWidth = getTextWidth(lines[currentLine], computedStyle);
    
    const x = rect.left + paddingLeft + textWidth - scrollLeft;
    const y = rect.top + paddingTop + (currentLine * lineHeight) + (lineHeight / 2) - scrollTop;
    
    // Clean up measurement element
    measureElement.remove();
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      element,
      selectionStart,
      selectionEnd
    };
    
  } catch (error) {
    console.warn('Error getting input cursor position:', error);
    return null;
  }
}

/**
 * Get cursor position for contentEditable elements
 */
export function getContentEditableCursorPosition(element: HTMLElement): CursorPosition | null {
  if (!element) return null;
  
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    
    // Create a temporary span at cursor position
    const tempSpan = document.createElement('span');
    tempSpan.style.position = 'absolute';
    tempSpan.style.visibility = 'hidden';
    tempSpan.textContent = '|';
    
    // Insert temp element at cursor
    range.insertNode(tempSpan);
    
    // Get position
    const rect = tempSpan.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top + (rect.height / 2);
    
    // Get selection info
    const selectionStart = getSelectionOffset(element, range.startContainer, range.startOffset);
    const selectionEnd = getSelectionOffset(element, range.endContainer, range.endOffset);
    
    // Clean up
    tempSpan.remove();
    
    return {
      x: Math.round(x),
      y: Math.round(y),
      element,
      selectionStart,
      selectionEnd
    };
    
  } catch (error) {
    console.warn('Error getting contentEditable cursor position:', error);
    return null;
  }
}

/**
 * Insert text at current cursor position
 */
export function insertTextAtCursor(text: string): TextInsertionResult {
  const cursorPos = getCurrentCursorPosition();
  
  if (!cursorPos) {
    return {
      success: false,
      insertedAt: -1,
      element: document.body,
      error: 'No active text input found'
    };
  }
  
  const { element, selectionStart, selectionEnd } = cursorPos;
  
  try {
    if (isTextInput(element)) {
      return insertTextIntoInput(element as HTMLInputElement | HTMLTextAreaElement, text, selectionStart, selectionEnd);
    } else if (isContentEditable(element)) {
      return insertTextIntoContentEditable(element, text);
    }
    
    return {
      success: false,
      insertedAt: -1,
      element,
      error: 'Element type not supported for text insertion'
    };
  } catch (error) {
    return {
      success: false,
      insertedAt: -1,
      element,
      error: `Insertion failed: ${error.message}`
    };
  }
}

/**
 * Insert text into input/textarea elements
 */
function insertTextIntoInput(
  element: HTMLInputElement | HTMLTextAreaElement, 
  text: string, 
  selectionStart: number, 
  selectionEnd: number
): TextInsertionResult {
  const currentValue = element.value;
  const newValue = currentValue.substring(0, selectionStart) + text + currentValue.substring(selectionEnd);
  
  element.value = newValue;
  
  // Set cursor position after inserted text
  const newCursorPos = selectionStart + text.length;
  element.setSelectionRange(newCursorPos, newCursorPos);
  
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Focus element to ensure cursor visibility
  element.focus();
  
  return {
    success: true,
    insertedAt: selectionStart,
    element
  };
}

/**
 * Insert text into contentEditable elements
 */
function insertTextIntoContentEditable(element: HTMLElement, text: string): TextInsertionResult {
  const selection = window.getSelection();
  if (!selection) {
    return {
      success: false,
      insertedAt: -1,
      element,
      error: 'No selection available'
    };
  }
  
  const range = selection.getRangeAt(0);
  range.deleteContents();
  
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  
  // Move cursor after inserted text
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Trigger input event
  element.dispatchEvent(new Event('input', { bubbles: true }));
  
  // Focus element
  element.focus();
  
  return {
    success: true,
    insertedAt: 0, // Would need more complex calculation for exact position
    element
  };
}

/**
 * Create a measurement element with same styling as target
 */
function createMeasurementElement(targetElement: HTMLElement): HTMLElement {
  const measureElement = document.createElement('div');
  const computedStyle = window.getComputedStyle(targetElement);
  
  // Copy relevant styles
  const stylesToCopy = [
    'font-family', 'font-size', 'font-weight', 'font-style',
    'letter-spacing', 'text-transform', 'word-spacing'
  ];
  
  stylesToCopy.forEach(property => {
    measureElement.style[property] = computedStyle[property];
  });
  
  // Position off-screen
  measureElement.style.position = 'absolute';
  measureElement.style.left = '-9999px';
  measureElement.style.top = '-9999px';
  measureElement.style.visibility = 'hidden';
  measureElement.style.whiteSpace = 'pre';
  
  document.body.appendChild(measureElement);
  return measureElement;
}

/**
 * Get text width using canvas measurement (more accurate)
 */
function getTextWidth(text: string, style: CSSStyleDeclaration): number {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) return text.length * 8; // Fallback estimate
  
  // Set font properties
  const fontSize = style.fontSize || '16px';
  const fontFamily = style.fontFamily || 'sans-serif';
  const fontWeight = style.fontWeight || 'normal';
  const fontStyle = style.fontStyle || 'normal';
  
  context.font = `${fontStyle} ${fontWeight} ${fontSize} ${fontFamily}`;
  
  return context.measureText(text).width;
}

/**
 * Get selection offset within contentEditable element
 */
function getSelectionOffset(root: HTMLElement, container: Node, offset: number): number {
  let selectionOffset = 0;
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let currentNode;
  while (currentNode = walker.nextNode()) {
    if (currentNode === container) {
      return selectionOffset + offset;
    }
    selectionOffset += (currentNode as Text).textContent?.length || 0;
  }
  
  return selectionOffset;
}

/**
 * Check if an element can receive text input
 */
export function canReceiveTextInput(element: HTMLElement): boolean {
  if (!element) return false;
  
  // Check if element is disabled or readonly
  if ('disabled' in element && (element as any).disabled) return false;
  if ('readOnly' in element && (element as any).readOnly) return false;
  
  return isTextInput(element) || isContentEditable(element);
}

/**
 * Find the nearest text input ancestor or descendant
 */
export function findNearestTextInput(element: HTMLElement): HTMLElement | null {
  if (!element) return null;
  
  // Check current element
  if (canReceiveTextInput(element)) return element;
  
  // Check ancestors
  let parent = element.parentElement;
  while (parent) {
    if (canReceiveTextInput(parent)) return parent;
    parent = parent.parentElement;
  }
  
  // Check descendants
  const textInputs = element.querySelectorAll('input, textarea, [contenteditable="true"]');
  for (const input of textInputs) {
    if (canReceiveTextInput(input as HTMLElement)) {
      return input as HTMLElement;
    }
  }
  
  return null;
}