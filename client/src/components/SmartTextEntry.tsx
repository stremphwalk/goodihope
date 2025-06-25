import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';

import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface SmartTextEntryProps {
  title: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  templates?: { [key: string]: string };
}

const commonConditions = {
  'dm': 'Diabetes mellitus\n- Type 2\n- Well controlled\n- Last HbA1c [value]%',
  'htn': 'Hypertension\n- Well controlled\n- On [medication]',
  'cad': 'Coronary artery disease\n- Stable\n- On optimal medical therapy',
  'copd': 'COPD\n- Stable\n- On bronchodilators',
  'ckd': 'Chronic kidney disease\n- Stage [stage]\n- Baseline creatinine [value]'
};

export function SmartTextEntry({ title, placeholder, value, onChange, templates }: SmartTextEntryProps) {
  const { language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value);

  // Sync external value changes, but preserve local changes when focused
  useEffect(() => {
    // Always sync if the component is not focused to ensure template defaults are applied
    if (document.activeElement !== textareaRef.current) {
      setLocalValue(value);
    }
    // If focused and local value is empty, still allow external value updates (for template defaults)
    else if (document.activeElement === textareaRef.current && (!localValue || localValue.trim() === '')) {
      setLocalValue(value);
    }
  }, [value, localValue]);

  const formatText = useCallback((text: string): string => {
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
      } else if (line.startsWith('--')) {
        const subDetail = line.replace('--', '').trim();
        formatted.push(`       - ${subDetail}`);
      } else {
        // Auto-format as condition if no prefix
        conditionCount++;
        formatted.push(`${conditionCount}. ${line}`);
      }
    }

    return formatted.join('\n');
  }, []);



  const handleBlur = () => {
    onChange(localValue);
  };

  // Only propagate changes immediately for template defaults when not focused
  useEffect(() => {
    // Only call onChange immediately if:
    // 1. Component is not focused (to avoid focus loss)
    // 2. Local value is empty/whitespace (for template defaults)
    // 3. External value has meaningful content (template is providing default)
    if (document.activeElement !== textareaRef.current && 
        (!localValue || localValue.trim() === '') && 
        value && value.trim() !== '') {
      onChange(value);
    }
  }, [value, localValue, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    try {
      const { selectionStart } = textarea;
      const currentValue = localValue || '';
      
      // Validate selection position
      if (selectionStart < 0 || selectionStart > currentValue.length) {
        console.warn('Invalid selection position:', selectionStart);
        return;
      }

      const lines = currentValue.split('\n');
      const currentLineIndex = currentValue.substring(0, selectionStart).split('\n').length - 1;
      
      // Validate line index
      if (currentLineIndex < 0 || currentLineIndex >= lines.length) {
        console.warn('Invalid line index:', currentLineIndex);
        return;
      }
      
      const currentLine = lines[currentLineIndex] || '';
      const lineStart = currentValue.lastIndexOf('\n', selectionStart - 1) + 1;
      const cursorPositionInLine = selectionStart - lineStart;

    // Tab: Transform current line to sub-point or add new sub-point
    if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault();
      
      // If at start of line, transform current line to sub-point
      if (cursorPositionInLine === 0 && currentLine.trim()) {
        const newLine = '- ' + currentLine;
        const newLines = [...lines];
        newLines[currentLineIndex] = newLine;
        const newValue = newLines.join('\n');
        setLocalValue(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(selectionStart + 2, selectionStart + 2);
        }, 0);
      } else if (cursorPositionInLine === currentLine.length && currentLine.trim() && !currentLine.startsWith('-')) {
        // If at end of main diagnosis line, add sub-point directly underneath
        const newLines = [...lines];
        newLines.splice(currentLineIndex + 1, 0, '- ');
        const newValue = newLines.join('\n');
        setLocalValue(newValue);
        setTimeout(() => {
          const newPosition = newLines.slice(0, currentLineIndex + 2).join('\n').length;
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else if (currentLine.startsWith('-') && cursorPositionInLine === currentLine.length) {
        // If at end of sub-point line, add another sub-point for same main diagnosis
        const newLines = [...lines];
        newLines.splice(currentLineIndex + 1, 0, '- ');
        const newValue = newLines.join('\n');
        setLocalValue(newValue);
        setTimeout(() => {
          const newPosition = newLines.slice(0, currentLineIndex + 2).join('\n').length;
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else {
        // Add new sub-point line at end
        const newValue = currentValue + '\n- ';
        setLocalValue(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newValue.length, newValue.length);
        }, 0);
      }
    }
    } catch (error) {
      console.error('Error in handleKeyDown:', error);
    }
  }, [localValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newValue = e.target.value;
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Check if user typed a dash at end of line
      const { selectionStart } = textarea;
      const lines = newValue.split('\n');
      const currentLineIndex = newValue.substring(0, selectionStart).split('\n').length - 1;
      
      // Validate bounds
      if (currentLineIndex < 0 || currentLineIndex >= lines.length) {
        setLocalValue(newValue);
        return;
      }
      
      const currentLine = lines[currentLineIndex] || '';
    
    // If line ends with dash, convert to sub-point on next line
    if (currentLine.endsWith('-') && !currentLine.startsWith('-')) {
      const lineWithoutDash = currentLine.slice(0, -1).trim();
      const newLines = [...lines];
      newLines[currentLineIndex] = lineWithoutDash;
      newLines.splice(currentLineIndex + 1, 0, '- ');
      const finalValue = newLines.join('\n');
      setLocalValue(finalValue);
      
      setTimeout(() => {
        const newPosition = newLines.slice(0, currentLineIndex + 2).join('\n').length;
        textarea.focus();
        textarea.setSelectionRange(newPosition, newPosition);
      }, 0);
      return;
    }
    
    setLocalValue(newValue);
    } catch (error) {
      console.error('Error in handleChange:', error);
      // Fallback to just setting the value without special processing
      setLocalValue(e.target.value);
    }
  };

  const insertTemplate = useCallback((template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart } = textarea;
    const currentValue = localValue;
    const beforeCursor = currentValue.substring(0, selectionStart);
    const afterCursor = currentValue.substring(selectionStart);
    
    const newValue = beforeCursor + template + afterCursor;
    setLocalValue(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + template.length, selectionStart + template.length);
    }, 0);
  }, [localValue]);

  const addCondition = useCallback(() => {
    const newValue = localValue + (localValue ? '\n' : '') + '# ';
    setLocalValue(newValue);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  }, [localValue]);

  const addDetail = useCallback(() => {
    const newValue = localValue + (localValue ? '\n' : '') + '- ';
    setLocalValue(newValue);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  }, [localValue]);



  return (
    <div className="w-full max-w-none">
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full h-64 p-4 bg-gray-50 border-0 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-sm transition-colors"
        style={{ fontFamily: 'ui-monospace, monospace' }}
      />
      
      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex gap-4">
          <span>💡 New line: Auto-numbered</span>
          <span>Tab at end: Add sub-point</span>
          <span>Tab at start: Convert to sub-point</span>
          <span>Templates: dm, htn, cad</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Characters: {localValue.length}</span>
          <Button size="sm" variant="ghost" onClick={() => { setLocalValue(''); onChange(''); }} className="h-6 px-2 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}