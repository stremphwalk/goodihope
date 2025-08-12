import React, { useRef, useState, useCallback, useImperativeHandle, forwardRef } from "react";
import { ChipBar } from "./ChipBar";
import { parsePMH } from "@/lib/pmh/parse";
import { renderPMH } from "@/lib/pmh/render";
import { getCurrentLineInfo, getTokenRange, replaceRange, clamp, getLineType, hasContentAfterCursor, getIndentLevel } from "@/lib/pmh/caret";
import { SYNONYMS } from "@/lib/pmh/dictionary";
import type { PMHItem, PMHPreferences } from "@/types/pmh";

interface PMHEditorProps {
  initialValue?: string;
  onChange?: (raw: string, items: PMHItem[], rendered: string) => void;
  onBlur?: () => void;
  preferences?: Partial<PMHPreferences>;
  className?: string;
}

export interface PMHEditorRef {
  insertExternalText: (text: string) => void;
  focus: () => void;
}

const PMHEditor = forwardRef<PMHEditorRef, PMHEditorProps>(({
  initialValue = "",
  onChange,
  onBlur,
  preferences = {},
  className = ""
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteRange, setAutocompleteRange] = useState<{ start: number; end: number } | null>(null);
  const [autocompletePosition, setAutocompletePosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  
  // Store parsed items separately to avoid recalculation on every render
  const [parsedItems, setParsedItems] = useState<PMHItem[]>(() => parsePMH(initialValue));

  const prefs: PMHPreferences = {
    indentSpaces: 4,
    mergeDuplicates: false,
    autoCapitalizeTitles: false,
    ...preferences
  };

  // Parse and render only on blur or explicit updates
  const updateParsedContent = useCallback(() => {
    const newItems = parsePMH(value);
    const newRendered = renderPMH(newItems, prefs.indentSpaces);
    setParsedItems(newItems);
    onChange?.(value, newItems, newRendered);
  }, [value, onChange, prefs.indentSpaces]);

  const hideAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setAutocompleteItems([]);
    setAutocompleteIndex(0);
    setAutocompleteRange(null);
  }, []);

  const calculateCursorPosition = useCallback((start: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return { top: 0, left: 0 };

    // Create temporary span to measure text width
    const textBeforeCursor = value.substring(0, start);
    const lines = textBeforeCursor.split('\n');
    const currentLine = lines[lines.length - 1];
    
    // Use computed styles to get accurate measurements
    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = computedStyle.fontSize;
    const fontFamily = computedStyle.fontFamily;
    const lineHeight = parseFloat(computedStyle.lineHeight) || parseFloat(fontSize) * 1.2;
    
    // Create temporary element to measure text width
    const measurer = document.createElement('span');
    measurer.style.position = 'absolute';
    measurer.style.left = '-9999px';
    measurer.style.fontSize = fontSize;
    measurer.style.fontFamily = fontFamily;
    measurer.style.whiteSpace = 'pre';
    measurer.textContent = currentLine;
    document.body.appendChild(measurer);
    
    const textWidth = measurer.getBoundingClientRect().width;
    document.body.removeChild(measurer);
    
    // Calculate position relative to textarea
    const rect = textarea.getBoundingClientRect();
    const padding = 12; // p-3 = 12px
    
    const top = (lines.length - 1) * lineHeight + lineHeight + padding;
    const left = textWidth + padding;
    
    return { top, left };
  }, [value]);

  const showAutocompleteForWord = useCallback((word: string, start: number, end: number) => {
    const matches = Object.keys(SYNONYMS).filter(k => 
      k.toLowerCase().startsWith(word.toLowerCase())
    );
    
    if (matches.length > 0) {
      setAutocompleteItems(matches);
      setAutocompleteIndex(0);
      setAutocompleteRange({ start, end });
      setAutocompletePosition(calculateCursorPosition(start));
      setShowAutocomplete(true);
    } else {
      hideAutocomplete();
    }
  }, [hideAutocomplete, calculateCursorPosition]);

  const applyAutocomplete = useCallback((item: string) => {
    if (!autocompleteRange || !textareaRef.current) return;
    
    const expansion = SYNONYMS[item] || item;
    const newValue = replaceRange(value, autocompleteRange.start, autocompleteRange.end, expansion);
    const newCursor = autocompleteRange.start + expansion.length;
    
    setValue(newValue);
    hideAutocomplete();
    
    // Keep focus without setTimeout
    textareaRef.current?.setSelectionRange(newCursor, newCursor);
  }, [value, autocompleteRange, hideAutocomplete]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursor = textarea.selectionStart;
    const { line, column, start: lineStart } = getCurrentLineInfo(value, cursor);

    if (showAutocomplete) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocompleteIndex(prev => clamp(prev + 1, 0, autocompleteItems.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocompleteIndex(prev => clamp(prev - 1, 0, autocompleteItems.length - 1));
        return;
      }
      if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        applyAutocomplete(autocompleteItems[autocompleteIndex]);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hideAutocomplete();
        return;
      }
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const lineType = getLineType(line);
      
      let insertion = "\n";
      
      if (lineType === 'context') {
        // In context line: create new diagnosis line (no indent)
        insertion = "\n";
      } else if (lineType === 'diagnosis' && line.trim().length > 0) {
        // In diagnosis line: maintain same level (no indent for next diagnosis)
        insertion = "\n";
      } else {
        // Empty line or other cases: no special handling
        insertion = "\n";
      }
      
      const newValue = replaceRange(value, cursor, cursor, insertion);
      const newCursor = cursor + insertion.length;
      
      setValue(newValue);
      // Directly set selection without setTimeout to avoid focus loss
      textarea.setSelectionRange(newCursor, newCursor);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const isLineStart = column === 0 || /^\s*$/.test(line.slice(0, column));
      const lineType = getLineType(line);
      const atEndOfLine = !hasContentAfterCursor(line, column);
      
      if (isLineStart) {
        // Tab at start: create context point with hyphen
        const insertion = "    - ";
        const newValue = replaceRange(value, cursor, cursor, insertion);
        const newCursor = cursor + insertion.length;
        setValue(newValue);
        // Directly set selection without setTimeout
        textarea.setSelectionRange(newCursor, newCursor);
      } else if (lineType === 'diagnosis' && atEndOfLine) {
        // Tab at end of diagnosis line: create indented context point underneath
        const insertion = "\n    - ";
        const newValue = replaceRange(value, cursor, cursor, insertion);
        const newCursor = cursor + insertion.length;
        setValue(newValue);
        // Directly set selection without setTimeout
        textarea.setSelectionRange(newCursor, newCursor);
      } else if (lineType === 'context' && atEndOfLine) {
        // Tab at end of context line: create another context point at same level
        const currentIndent = getIndentLevel(line);
        const spaces = " ".repeat(currentIndent);
        const insertion = `\n${spaces}- `;
        const newValue = replaceRange(value, cursor, cursor, insertion);
        const newCursor = cursor + insertion.length;
        setValue(newValue);
        // Directly set selection without setTimeout
        textarea.setSelectionRange(newCursor, newCursor);
      } else {
        // Tab on word: show autocomplete
        const tokenRange = getTokenRange(line, column);
        if (tokenRange) {
          const [tokenStart, tokenEnd] = tokenRange;
          const word = line.slice(tokenStart, tokenEnd);
          const globalStart = lineStart + tokenStart;
          const globalEnd = lineStart + tokenEnd;
          showAutocompleteForWord(word, globalStart, globalEnd);
        }
      }
      return;
    }

    if (e.key === " ") {
      const tokenRange = getTokenRange(line, column);
      if (tokenRange) {
        const [tokenStart, tokenEnd] = tokenRange;
        const word = line.slice(tokenStart, tokenEnd);
        if (SYNONYMS[word.toLowerCase()]) {
          const expansion = SYNONYMS[word.toLowerCase()];
          const globalStart = lineStart + tokenStart;
          const globalEnd = lineStart + tokenEnd;
          const newValue = replaceRange(value, globalStart, globalEnd, expansion + " ");
          const newCursor = globalStart + expansion.length + 1;
          
          setValue(newValue);
          // Directly set selection without setTimeout
          textarea.setSelectionRange(newCursor, newCursor);
          return;
        }
      }
    }
  }, [value, showAutocomplete, autocompleteItems, autocompleteIndex, applyAutocomplete, hideAutocomplete, showAutocompleteForWord]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    hideAutocomplete();
  }, [hideAutocomplete]);

  const insertChip = useCallback((label: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursor = textarea.selectionStart;
    const { line, column, start: lineStart } = getCurrentLineInfo(value, cursor);
    const isLineEmpty = line.trim() === "";
    const isAtLineStart = column === 0 || /^\s*$/.test(line.slice(0, column));

    let insertion = label;
    let newCursor = cursor + label.length;

    if (isLineEmpty || isAtLineStart) {
      insertion = label;
    } else {
      insertion = `\n${label}`;
      newCursor = cursor + 1 + label.length;
    }

    const newValue = replaceRange(value, cursor, cursor, insertion);
    setValue(newValue);

    // Keep focus without setTimeout
    textarea.setSelectionRange(newCursor, newCursor);
  }, [value]);


  useImperativeHandle(ref, () => ({
    insertExternalText: (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const newValue = replaceRange(value, cursor, cursor, text);
      const newCursor = cursor + text.length;
      
      setValue(newValue);
      // Keep focus without setTimeout
      textarea.setSelectionRange(newCursor, newCursor);
    },
    focus: () => {
      textareaRef.current?.focus();
    }
  }), [value]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Chips */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-gray-700">Quick Insert:</div>
        <ChipBar onInsert={insertChip} />
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            // Always update parsed content on blur to ensure live preview updates
            updateParsedContent();
            onBlur?.();
          }}
          placeholder="Enter past medical history items...
Tab at start: add context point (- )
Tab at end of diagnosis: create context underneath
Tab at end of context: add another context
Tab on word: autocomplete
Enter in context: new diagnosis line"
          className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Autocomplete */}
        {showAutocomplete && autocompleteItems.length > 0 && (
          <div 
            className="absolute z-10 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-64"
            style={{
              top: `${autocompletePosition.top}px`,
              left: `${autocompletePosition.left}px`
            }}
          >
            {autocompleteItems.map((item, idx) => (
              <div
                key={item}
                className={`px-3 py-2 cursor-pointer text-sm ${
                  idx === autocompleteIndex ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
                }`}
                onClick={() => applyAutocomplete(item)}
              >
                <div className="font-medium">{item}</div>
                <div className="text-xs text-gray-500">{SYNONYMS[item]}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
});

PMHEditor.displayName = "PMHEditor";

export { PMHEditor };