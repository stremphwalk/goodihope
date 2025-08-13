import React, { useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from "react";
import { ChipBar } from "./ChipBar";
import { parsePMH } from "@/lib/pmh/parse";
import { renderPMH } from "@/lib/pmh/render";
import { getCurrentLineInfo, getTokenRange, replaceRange, clamp } from "@/lib/pmh/caret";
import { SYNONYMS } from "@/lib/pmh/dictionary";
import type { PMHItem, PMHPreferences } from "@/types/pmh";

interface PMHEditorProps {
  initialValue?: string;
  onChange?: (raw: string, items: PMHItem[], rendered: string) => void;
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
  preferences = {},
  className = ""
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [value, setValue] = useState(initialValue);
  const [showPreview, setShowPreview] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<string[]>([]);
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteRange, setAutocompleteRange] = useState<{ start: number; end: number } | null>(null);

  const prefs: PMHPreferences = {
    indentSpaces: 4,
    mergeDuplicates: false,
    autoCapitalizeTitles: false,
    ...preferences
  };

  const items = useMemo(() => parsePMH(value), [value]);
  const rendered = useMemo(() => renderPMH(items, prefs.indentSpaces), [items, prefs.indentSpaces]);

  const debounceRef = useRef<NodeJS.Timeout>();
  const handleChange = useCallback((newValue: string) => {
    setValue(newValue);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newItems = parsePMH(newValue);
      const newRendered = renderPMH(newItems, prefs.indentSpaces);
      onChange?.(newValue, newItems, newRendered);
    }, 300);
  }, [onChange, prefs.indentSpaces]);

  const hideAutocomplete = useCallback(() => {
    setShowAutocomplete(false);
    setAutocompleteItems([]);
    setAutocompleteIndex(0);
    setAutocompleteRange(null);
  }, []);

  const showAutocompleteForWord = useCallback((word: string, start: number, end: number) => {
    const matches = Object.keys(SYNONYMS).filter(k => 
      k.toLowerCase().startsWith(word.toLowerCase())
    );
    
    if (matches.length > 0) {
      setAutocompleteItems(matches);
      setAutocompleteIndex(0);
      setAutocompleteRange({ start, end });
      setShowAutocomplete(true);
    } else {
      hideAutocomplete();
    }
  }, [hideAutocomplete]);

  const applyAutocomplete = useCallback((item: string) => {
    if (!autocompleteRange || !textareaRef.current) return;
    
    const expansion = SYNONYMS[item] || item;
    const newValue = replaceRange(value, autocompleteRange.start, autocompleteRange.end, expansion);
    const newCursor = autocompleteRange.start + expansion.length;
    
    handleChange(newValue);
    hideAutocomplete();
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursor, newCursor);
    }, 0);
  }, [value, autocompleteRange, handleChange, hideAutocomplete]);

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
      const isIndentedLine = /^\s+/.test(line);
      const indent = isIndentedLine ? "    " : "";
      const newValue = replaceRange(value, cursor, cursor, `\n${indent}`);
      const newCursor = cursor + 1 + indent.length;
      
      handleChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
      }, 0);
      return;
    }

    if (e.key === "Tab") {
      e.preventDefault();
      const isLineStart = column === 0 || /^\s*$/.test(line.slice(0, column));
      
      if (isLineStart) {
        const newValue = replaceRange(value, cursor, cursor, "    ");
        const newCursor = cursor + 4;
        handleChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newCursor, newCursor);
        }, 0);
      } else {
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
          const newValue = replaceRange(value, globalStart, globalEnd, expansion);
          const newCursor = globalStart + expansion.length + 1;
          
          handleChange(newValue + " ");
          setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(newCursor, newCursor);
          }, 0);
          return;
        }
      }
    }
  }, [value, showAutocomplete, autocompleteItems, autocompleteIndex, applyAutocomplete, hideAutocomplete, handleChange, showAutocompleteForWord]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    handleChange(newValue);
    hideAutocomplete();
  }, [handleChange, hideAutocomplete]);

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
    handleChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursor, newCursor);
    }, 0);
  }, [value, handleChange]);

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(rendered);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [rendered]);

  useImperativeHandle(ref, () => ({
    insertExternalText: (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const cursor = textarea.selectionStart;
      const newValue = replaceRange(value, cursor, cursor, text);
      const newCursor = cursor + text.length;
      
      handleChange(newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
      }, 0);
    },
    focus: () => {
      textareaRef.current?.focus();
    }
  }), [value, handleChange]);

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
          placeholder="Enter past medical history items...
Tab at line start to indent
Tab on word for autocomplete
Enter for new line with smart indent"
          className="w-full h-48 p-3 border rounded-lg font-mono text-sm resize-vertical focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Autocomplete */}
        {showAutocomplete && autocompleteItems.length > 0 && (
          <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
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

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          {showPreview ? "Hide" : "Show"} Preview
        </button>
        <button
          onClick={copyToClipboard}
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
        >
          Copy EHR Format
        </button>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">EHR Preview:</div>
          <pre className="p-3 bg-gray-50 border rounded text-sm whitespace-pre-wrap">
            {rendered || "No items entered"}
          </pre>
        </div>
      )}
    </div>
  );
});

PMHEditor.displayName = "PMHEditor";

export { PMHEditor };