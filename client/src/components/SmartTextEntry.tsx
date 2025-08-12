import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { dotPhrases } from '@/lib/dotPhrases';
import { useAuth } from '@/contexts/AuthContext';
import { useDotPhrases } from '@/hooks/useDotPhrases';
import type { CustomDotPhrase } from '@/components/DotPhraseManager';
import getCaretCoordinates from 'textarea-caret';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useDebounceCallback } from '@/hooks/useDebounce';

interface SmartTextEntryProps {
  title: string;
  placeholder: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: (value?: string) => void;
  templates?: { [key: string]: string };
  persistenceKey?: string; // Unique key for state persistence across unmounts
  /**
   * When true, parent onChange will only be invoked on blur to avoid
   * excessive re-renders (e.g. keeps textarea focus during long typing).
   * Defaults to false to preserve existing live-update behaviour.
   */
  updateOnBlurOnly?: boolean;
  disabled?: boolean;
}

const commonConditions = {
  'dm': 'Diabetes mellitus\n- Type 2\n- Well controlled\n- Last HbA1c [value]%',
  'htn': 'Hypertension\n- Well controlled\n- On [medication]',
  'cad': 'Coronary artery disease\n- Stable\n- On optimal medical therapy',
  'copd': 'COPD\n- Stable\n- On bronchodilators',
  'ckd': 'Chronic kidney disease\n- Stage [stage]\n- Baseline creatinine [value]'
};

// Helper to find slash phrase at cursor
function getSlashPhraseAtCursor(text: string, cursor: number) {
  const before = text.slice(0, cursor);
  const match = before.match(/\/[a-zA-Z0-9_]*$/);
  if (!match) return null;
  return {
    phrase: match[0],
    start: before.length - match[0].length,
    end: cursor
  };
}

// Helper to parse smart options
function parseSmartOptions(text: string) {
  const regex = /\[\[([^\]]+?)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text))) {
    const options = match[1].split('|');
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      options,
      selectedIdx: 0
    });
  }
  return matches;
}

export function SmartTextEntry({
  title,
  placeholder,
  value,
  onChange: parentOnChange,
  onBlur,
  templates,
  persistenceKey,
  updateOnBlurOnly = false,
  disabled = false,
}: SmartTextEntryProps) {
  const { language } = useLanguage();
  const auth = useAuth();
  const { data: customPhrases = [], isLoading } = useDotPhrases();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use persisted state if persistence key is provided, otherwise use regular state
  const persistedState = usePersistedState(
    persistenceKey || `smart-text-entry-${title}`,
    value || '',
    undefined, // Don't pass parent value to prevent sync issues
    parentOnChange,
    false // Disable session backup to prevent unwanted restoration
  );
  
  const localValue = persistedState.value;
  const setLocalValue = persistedState.setValue;
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const userExplicitlyDeletedRef = useRef(false); // Track when user intentionally clears content
  const lastParentValue = useRef(value);
  
  // Only sync from parent when it's a meaningful change (template load, reset, etc.)
  // Not when it's just the same value coming back from our own blur
  useEffect(() => {
    if (value !== lastParentValue.current && value !== localValue) {
      // Only sync if this is a significant change (not empty to empty)
      const isSignificantChange = value.trim() !== '' || lastParentValue.current.trim() !== '';
      if (isSignificantChange && !isFocused) {
        setLocalValue(value);
      }
    }
    lastParentValue.current = value;
  }, [value, localValue, isFocused, setLocalValue]);
  
  // Dot phrase state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentDot, setCurrentDot] = useState<{ phrase: string, start: number, end: number } | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [smartOptions, setSmartOptions] = useState<any[]>([]);
  const [activeSmartIdx, setActiveSmartIdx] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [customInput, setCustomInput] = useState<string>("");
  const [customInputFocused, setCustomInputFocused] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dropdownMouseDownRef = useRef(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [calendarIsOpen, setCalendarIsOpen] = useState(false);
  const justExpandedToSmartOption = useRef(false);

  // DISABLED: Automatic sync was causing text regeneration issues
  // The persisted state hook handles initial values correctly
  // Manual sync only happens via explicit user actions (buttons, blur, etc.)
  // This prevents unwanted text restoration when user deletes content

  // Create combined dot phrases object - memoized to prevent re-creation
  const getCombinedDotPhrases = useCallback((): Record<string, string> => {
    const combined: Record<string, string> = { ...(dotPhrases as Record<string, string>) };
    customPhrases.forEach(phrase => {
      combined[phrase.trigger] = phrase.content;
    });
    return combined;
  }, [customPhrases]);

  // Update smart options when value changes - optimized
  useEffect(() => {
    const options = parseSmartOptions(localValue);
    
    // Only update if options actually changed
    if (JSON.stringify(options) !== JSON.stringify(smartOptions)) {
      setSmartOptions(options);
      
      // Auto-activate first smart option only in specific cases
      if (options.length > 0 && activeSmartIdx === null && !isFocused) {
        const hasOnlySmartFunctions = (localValue || '').trim().match(/^\[\[.*\]\]$/) || 
                                     justExpandedToSmartOption.current;
        if (hasOnlySmartFunctions) {
          setActiveSmartIdx(0);
        }
      }
    }
  }, [localValue, isFocused, activeSmartIdx]);


  

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
        // Sub-point - preserve as indented with dash
        const detail = line.replace('-', '').trim();
        formatted.push(`     - ${detail}`);
      } else if (line.startsWith('--')) {
        // Sub-sub-detail (deeper indentation)
        const subDetail = line.replace('--', '').trim();
        formatted.push(`       - ${subDetail}`);
      } else {
        // Only auto-format as numbered condition if line doesn't already start with a number
        // and doesn't start with whitespace (preserving indented content)
        if (!/^\d+\./.test(line)) {
          if (line.match(/^\s+/)) {
            // Line starts with whitespace, preserve as-is (likely a sub-point or indented content)
            formatted.push(line);
          } else {
            // Auto-format as numbered condition
            conditionCount++;
            formatted.push(`${conditionCount}. ${line}`);
          }
        } else {
          // Line already has a number, just add it as-is
          formatted.push(line);
        }
      }
    }

    return formatted.join('\n');
  }, []);


  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setHasUserEdited(true);
  }, []);

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

      // Handle dot phrase suggestions
      if (showSuggestions && suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedSuggestion(s => (s + 1) % suggestions.length);
          return;
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedSuggestion(s => (s - 1 + suggestions.length) % suggestions.length);
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setShowSuggestions(false);
          setCurrentDot(null);
          return;
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          const selectedPhrase = suggestions[selectedSuggestion];
          expandDotPhrase(selectedPhrase);
          return;
        }
      }

      // Handle smart options navigation
      if (smartOptions.length > 0 && activeSmartIdx !== null) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          const opt = smartOptions[activeSmartIdx];
          // Only cycle within options if it's not a date
          if (opt.options[0] !== 'DATE') {
            opt.selectedIdx = (opt.selectedIdx - 1 + opt.options.length) % opt.options.length;
            setSmartOptions([...smartOptions]);
          }
          return;
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const opt = smartOptions[activeSmartIdx];
          // Only cycle within options if it's not a date
          if (opt.options[0] !== 'DATE') {
            opt.selectedIdx = (opt.selectedIdx + 1) % opt.options.length;
            setSmartOptions([...smartOptions]);
          }
          return;
        } else if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault();
          setActiveSmartIdx((activeSmartIdx - 1 + smartOptions.length) % smartOptions.length);
          return;
        } else if (e.key === 'Tab' && !e.shiftKey) {
          e.preventDefault();
          setActiveSmartIdx((activeSmartIdx + 1) % smartOptions.length);
          return;
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleSmartOptionSelect(activeSmartIdx, smartOptions[activeSmartIdx].selectedIdx);
          return;
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setActiveSmartIdx(null);
          return;
        }
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
        if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
        
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
        if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
        
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
        if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
        
        setTimeout(() => {
          const newPosition = newLines.slice(0, currentLineIndex + 2).join('\n').length;
          textarea.focus();
          textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
      } else {
        // Add new sub-point line at end
        const newValue = currentValue + '\n- ';
        setLocalValue(newValue);
        if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(newValue.length, newValue.length);
        }, 0);
      }
    }
    } catch (error) {
      console.error('Error in handleKeyDown:', error);
    }
  }, [localValue, showSuggestions, suggestions, selectedSuggestion, smartOptions, activeSmartIdx, parentOnChange, updateOnBlurOnly]);

  // Debounced callback for parent updates to reduce excessive calls
  const debouncedParentUpdate = useDebounceCallback((newValue: string) => {
    if (!updateOnBlurOnly && parentOnChange && newValue !== value) {
      parentOnChange(newValue);
    }
  }, 300); // 300ms debounce

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const previousValue = localValue || '';
    
    setHasUserEdited(true);
    
    // Detect if user explicitly deleted all content (Ctrl+A -> Delete/Backspace)
    if (previousValue.trim().length > 0 && newValue.trim().length === 0) {
      userExplicitlyDeletedRef.current = true;
    } else if (newValue.trim().length > 0) {
      userExplicitlyDeletedRef.current = false;
    }
    
    setLocalValue(newValue);
    
    // For immediate updates (non-blur mode), update parent immediately
    // For blur-only mode, use debounced update to reduce re-renders
    if (!updateOnBlurOnly && parentOnChange) {
      parentOnChange(newValue);
    } else {
      debouncedParentUpdate(newValue);
    }

    // Dot phrase detection (simplified)
    const cursor = e.target.selectionStart;
    const slash = getSlashPhraseAtCursor(newValue, cursor);
    if (slash) {
      const combinedPhrases = getCombinedDotPhrases();
      const matches = Object.keys(combinedPhrases).filter(k => 
        k.toLowerCase().startsWith(slash.phrase.toLowerCase())
      );
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
      setCurrentDot(slash);
      setSelectedSuggestion(0);
    } else {
      setShowSuggestions(false);
      setCurrentDot(null);
    }

    // Auto-convert dash to sub-point (simplified)
    const textarea = textareaRef.current;
    if (textarea && newValue.endsWith('-')) {
      const lines = newValue.split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine === '-' && lines.length > 1) {
        const newLines = [...lines];
        newLines[newLines.length - 1] = '- ';
        const finalValue = newLines.join('\n');
        setLocalValue(finalValue);
        if (!updateOnBlurOnly && parentOnChange) parentOnChange(finalValue);
        
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(finalValue.length, finalValue.length);
        }, 0);
      }
    }
  }, [parentOnChange, updateOnBlurOnly, value]);

  const insertTemplate = useCallback((template: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart } = textarea;
    const currentValue = localValue || '';
    const beforeCursor = currentValue.substring(0, selectionStart);
    const afterCursor = currentValue.substring(selectionStart);
    
    const newValue = beforeCursor + template + afterCursor;
    setLocalValue(newValue);
    setHasUserEdited(true);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + template.length, selectionStart + template.length);
    }, 0);
  }, [localValue, parentOnChange, updateOnBlurOnly]);

  const addCondition = useCallback(() => {
    const newValue = (localValue || '') + ((localValue || '') ? '\n' : '') + '# ';
    setLocalValue(newValue);
    setHasUserEdited(true);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  }, [localValue, parentOnChange, updateOnBlurOnly]);

  const addDetail = useCallback(() => {
    const newValue = (localValue || '') + ((localValue || '') ? '\n' : '') + '- ';
    setLocalValue(newValue);
    setHasUserEdited(true);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  }, [localValue, parentOnChange, updateOnBlurOnly]);

  // Expand dot phrase in textarea
  const expandDotPhrase = useCallback((dotKey: string) => {
    if (!currentDot) return;
    const combinedPhrases = getCombinedDotPhrases();
    const phrase = combinedPhrases[dotKey];
    if (!phrase) return;
    
          const before = (localValue || '').slice(0, currentDot.start);
      const after = (localValue || '').slice(currentDot.end);
    const expanded = before + phrase + after;
    
    // Check if the expanded value contains a smart option
    const smartOpts = parseSmartOptions(expanded);
    if (smartOpts.length > 0) {
      justExpandedToSmartOption.current = true;
    }
    
    // Preserve scroll position
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    setLocalValue(expanded);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(expanded);
    setShowSuggestions(false);
    setCurrentDot(null);
    setSuggestions([]);
    setSelectedSuggestion(0);
    
    // Move cursor after inserted phrase and restore scroll position
    if (textareaRef.current) {
      let pos = (before + phrase).length;
      // If the result is only a single smart option, put cursor at start
      if (expanded.trim() === phrase.trim() && smartOpts.length === 1 && smartOpts[0].start === 0) {
        pos = 0;
      }
      textareaRef.current.focus();
      textareaRef.current.selectionStart = pos;
      textareaRef.current.selectionEnd = pos;
      textareaRef.current.scrollTop = currentScrollTop;
      textareaRef.current.scrollLeft = currentScrollLeft;
      
      // Force scroll position to stick
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = currentScrollTop;
          textareaRef.current.scrollLeft = currentScrollLeft;
        }
      });
    }
  }, [currentDot, localValue, parentOnChange, updateOnBlurOnly, getCombinedDotPhrases]);

  // Handle smart option selection
  const handleSmartOptionSelect = (idx: number, optIdx: number) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = (localValue || '').slice(0, opt.start);
    const after = (localValue || '').slice(opt.end);
    const selected = opt.options[optIdx];
    
    // Preserve scroll position
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    // Replace the [[...]] with the selected option
    const newValue = before + selected + after;
    setLocalValue(newValue);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
    
    // Restore scroll position and handle cursor
    if (textareaRef.current) {
      textareaRef.current.scrollTop = currentScrollTop;
      textareaRef.current.scrollLeft = currentScrollLeft;
      textareaRef.current.focus();
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = currentScrollTop;
          textareaRef.current.scrollLeft = currentScrollLeft;
          
          const newOptions = parseSmartOptions(newValue);
          if (newOptions.length > 0) {
            setActiveSmartIdx(0);
          } else {
            setActiveSmartIdx(null);
            const endPos = newValue.length;
            textareaRef.current.selectionStart = endPos;
            textareaRef.current.selectionEnd = endPos;
          }
        }
      }, 0);
    }
  };

  // Handle custom option selection
  const handleCustomOptionSelect = (idx: number, customText: string) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = (localValue || '').slice(0, opt.start);
    const after = (localValue || '').slice(opt.end);
    
    // Preserve scroll position
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    // Replace the [[...]] with the custom text
    const newValue = before + customText + after;
    setLocalValue(newValue);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
    
    // Restore scroll position and handle next options
    if (textareaRef.current) {
      textareaRef.current.scrollTop = currentScrollTop;
      textareaRef.current.scrollLeft = currentScrollLeft;
      textareaRef.current.focus();
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = currentScrollTop;
          textareaRef.current.scrollLeft = currentScrollLeft;
          
          const newOptions = parseSmartOptions(newValue);
          if (newOptions.length > 0) {
            setActiveSmartIdx(0);
          } else {
            setActiveSmartIdx(null);
            const endPos = newValue.length;
            textareaRef.current.selectionStart = endPos;
            textareaRef.current.selectionEnd = endPos;
          }
        }
      }, 0);
    }
  };

  // Handle cancel option (remove the smart option)
  const handleCancelOption = (idx: number) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = (localValue || '').slice(0, opt.start);
    const after = (localValue || '').slice(opt.end);
    // Remove the smart option
    const newValue = before + after;
    setLocalValue(newValue);
    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
    
    setTimeout(() => {
      const updatedOptions = parseSmartOptions(newValue);
      if (updatedOptions.length > 0) {
        const nextIdx = idx < updatedOptions.length ? idx : updatedOptions.length - 1;
        setActiveSmartIdx(nextIdx);
      } else {
        setActiveSmartIdx(null);
      }
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = before.length;
        textareaRef.current.selectionEnd = before.length;
      }
    }, 0);
  };

  // Handle clicking on smart options in the text
  const handleSmartOptionClick = (idx: number) => {
    setActiveSmartIdx(idx);
  };

  // Update dropdown position when smart option is active
  useEffect(() => {
    if (activeSmartIdx !== null && textareaRef.current && smartOptions[activeSmartIdx]) {
      try {
        const opt = smartOptions[activeSmartIdx];
        const caret = getCaretCoordinates(textareaRef.current, opt.start);
        const rect = textareaRef.current.getBoundingClientRect();
        const newPos = {
          top: rect.top + caret.top - textareaRef.current.scrollTop + 28,
          left: rect.left + caret.left - textareaRef.current.scrollLeft + 8
        };
        
        // Only update if position actually changed
        if (newPos.top !== dropdownPos.top || newPos.left !== dropdownPos.left) {
          setDropdownPos(newPos);
        }
      } catch (error) {
        console.warn('Error calculating dropdown position:', error);
      }
    }
  }, [activeSmartIdx, smartOptions]);

  // Reset date object for DATE options
  useEffect(() => {
    if (
      activeSmartIdx !== null &&
      smartOptions[activeSmartIdx] &&
      smartOptions[activeSmartIdx].options[0] === 'DATE'
    ) {
      setDateObj(null);
    }
  }, [activeSmartIdx, smartOptions]);

  // Handle blur to prevent closing dropdown during interaction
  const handleTextareaBlur = useCallback(() => {
    // Don't process blur if user is interacting with dropdown
    if (dropdownMouseDownRef.current) {
      return;
    }
    
    setIsFocused(false);
    
    // Update parent only if updateOnBlurOnly is true or value changed
    // This prevents unnecessary updates that cause feedback loops
    if (updateOnBlurOnly && parentOnChange) {
      parentOnChange(localValue);
    }
    
    // Only close dropdowns if not interacting with them
    setTimeout(() => {
      if (!dropdownMouseDownRef.current && !calendarIsOpen) {
        setActiveSmartIdx(null);
        setShowSuggestions(false);
        setCurrentDot(null);
      }
      dropdownMouseDownRef.current = false;
    }, 100);
    
    // Sync to parent - always preserves user's current value including deletions
    persistedState.syncToParent();
    onBlur?.(localValue);
  }, [persistedState, onBlur, calendarIsOpen, parentOnChange, localValue, updateOnBlurOnly]);

  // Auto-activate smart options when expanded
  useEffect(() => {
    if (justExpandedToSmartOption.current && smartOptions.length > 0) {
      setActiveSmartIdx(0);
      justExpandedToSmartOption.current = false;
    }
  }, [smartOptions]);

  // Auto-open dropdown for single smart option covering whole textarea
  useEffect(() => {
    if (
      smartOptions.length === 1 &&
      smartOptions[0].start === 0 &&
      smartOptions[0].end === (localValue || '').length &&
      (localValue || '').trim().startsWith('[[') &&
      (localValue || '').trim().endsWith(']]')
    ) {
      if (activeSmartIdx !== 0) setActiveSmartIdx(0);
      if (smartOptions[0].options[0] === 'DATE') {
        setCalendarIsOpen(true);
      }
    }
  }, [localValue, smartOptions]);

  // Helper function to update smart options selection
  function updateSmartOptionsIdx(idx: number, sel: number) {
    setSmartOptions(prev => prev.map((o, i) => i === idx ? { ...o, selectedIdx: sel } : o));
  }

  // Enhanced keyboard navigation for dropdown - simplified
  useEffect(() => {
    if (activeSmartIdx === null || !smartOptions[activeSmartIdx]) return;
    
    const handleDropdownKeyDown = (e: KeyboardEvent) => {
      // Only handle if we're in an active dropdown context
      if (activeSmartIdx === null || !document.activeElement || 
          (!textareaRef.current?.contains(document.activeElement) && 
           !customInputRef.current?.contains(document.activeElement))) return;
           
      const opts = smartOptions[activeSmartIdx].options;
      const numOptions = opts.length;
      const isDate = opts[0] === 'DATE';
      let selIdx = smartOptions[activeSmartIdx].selectedIdx ?? 0;
      
      if (e.key === 'ArrowDown' && !isDate) {
        e.preventDefault();
        if (customInputFocused) {
          setCustomInputFocused(false);
          updateSmartOptionsIdx(activeSmartIdx, 0);
        } else if (selIdx < numOptions - 1) {
          updateSmartOptionsIdx(activeSmartIdx, selIdx + 1);
        } else {
          setCustomInputFocused(true);
        }
      } else if (e.key === 'ArrowUp' && !isDate) {
        e.preventDefault();
        if (customInputFocused) {
          setCustomInputFocused(false);
          updateSmartOptionsIdx(activeSmartIdx, numOptions - 1);
        } else if (selIdx > 0) {
          updateSmartOptionsIdx(activeSmartIdx, selIdx - 1);
        } else {
          setCustomInputFocused(true);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (customInputFocused) {
          if (customInput.trim()) {
            handleCustomOptionSelect(activeSmartIdx, customInput.trim());
            setCustomInput("");
            setCustomInputFocused(false);
          }
        } else {
          handleSmartOptionSelect(activeSmartIdx, selIdx);
        }
      } else if (e.key === 'Escape') {
        setActiveSmartIdx(null);
        setCustomInputFocused(false);
      }
    };
    
    document.addEventListener('keydown', handleDropdownKeyDown);
    return () => document.removeEventListener('keydown', handleDropdownKeyDown);
  }, [activeSmartIdx, smartOptions, customInputFocused, customInput]);

  // Handle click to activate smart functions
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursor = textarea.selectionStart;
    
    // Check if click is inside a smart function
    smartOptions.forEach((option, index) => {
      if (cursor >= option.start && cursor <= option.end) {
        setActiveSmartIdx(index);
      }
    });
  };

  return (
    <div className="w-full max-w-none relative">
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleTextareaBlur}
        onKeyDown={handleKeyDown}
        onClick={handleTextareaClick}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full h-64 p-4 bg-gray-50 border-0 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        {...(persistenceKey ? { 'data-persistence-key': persistenceKey } : {})}
        style={{ fontFamily: 'ui-monospace, monospace' }}
      />
      
      {/* Dot phrase suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-48"
          onMouseDown={(e) => { 
            dropdownMouseDownRef.current = true; 
            e.preventDefault(); 
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                index === selectedSuggestion ? 'bg-blue-100' : ''
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                dropdownMouseDownRef.current = true;
                expandDotPhrase(suggestion);
              }}
            >
              <div className="font-mono text-sm">{suggestion}</div>
              <div className="text-xs text-gray-500 truncate">
                {getCombinedDotPhrases()[suggestion]?.split('\n')[0] || ''}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Smart Options Dropdown */}
      {activeSmartIdx !== null && smartOptions[activeSmartIdx] && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-48"
          style={{
            top: dropdownPos.top,
            left: dropdownPos.left,
          }}
          onMouseDown={(e) => { 
            dropdownMouseDownRef.current = true; 
            e.preventDefault(); 
          }}
        >
          {/* Smart Options Counter */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <div className="text-xs text-gray-600 text-center font-medium">
              {smartOptions.length - activeSmartIdx}/{smartOptions.length} remaining
              {smartOptions[activeSmartIdx]?.options[0] === 'DATE' ? ' (Date Picker)' : 
               smartOptions[activeSmartIdx]?.options[0]?.startsWith('WIDGET:') ? ' (Widget)' : 
               smartOptions[activeSmartIdx]?.options[0]?.startsWith('CALC:') ? ' (Calculator)' : 
               ' (Options)'}
            </div>
          </div>
          {/* Date Picker for DATE options */}
          {activeSmartIdx !== null && smartOptions[activeSmartIdx]?.options?.includes('DATE') && (
            <div className="p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Select Date:</div>
              <DatePicker
                selected={dateObj}
                onChange={(date) => {
                  setDateObj(date);
                  if (date && activeSmartIdx !== null) {
                    const formattedDate = date.toLocaleDateString();
                    
                    // Replace the DATE placeholder with the actual date
                    const before = (localValue || '').slice(0, smartOptions[activeSmartIdx].start);
                    const after = (localValue || '').slice(smartOptions[activeSmartIdx].end);
                    const newValue = before + formattedDate + after;
                    
                    // Update the value first
                    setLocalValue(newValue);
                    
                    // Call onChange if provided
                    if (!updateOnBlurOnly && parentOnChange) parentOnChange(newValue);
                    
                    // Move to next smart option or close
                    setTimeout(() => {
                      const newOptions = parseSmartOptions(newValue);
                      if (newOptions.length > 0) {
                        setActiveSmartIdx(0);
                      } else {
                        setActiveSmartIdx(null);
                      }
                    }, 0);
                  }
                }}
                inline
                onCalendarOpen={() => setCalendarIsOpen(true)}
                onCalendarClose={() => setCalendarIsOpen(false)}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select date"
                className="w-full"
              />
            </div>
          )}

          {/* Regular Options Dropdown */}
          {activeSmartIdx !== null && smartOptions[activeSmartIdx] && !smartOptions[activeSmartIdx]?.options?.includes('DATE') && (
            <>
              {/* Options List */}
              {smartOptions[activeSmartIdx].options.map((option: string, optIdx: number) => (
                <div
                  key={optIdx}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    optIdx === smartOptions[activeSmartIdx].selectedIdx ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleSmartOptionSelect(activeSmartIdx, optIdx)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <div className="text-sm">{option}</div>
                </div>
              ))}

              {/* Custom Input Option */}
              <div className="border-t border-gray-200 p-2">
                <div className="text-xs text-gray-600 mb-1">Or enter custom:</div>
                <input
                  ref={customInputRef}
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onFocus={() => setCustomInputFocused(true)}
                  onBlur={() => setCustomInputFocused(false)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      e.preventDefault();
                      handleCustomOptionSelect(activeSmartIdx, customInput.trim());
                      setCustomInput("");
                      setCustomInputFocused(false);
                    }
                  }}
                  placeholder="Type custom option..."
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Cancel Option */}
              <div className="border-t border-gray-200">
                <button
                  onClick={() => handleCancelOption(activeSmartIdx)}
                  className="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500 flex items-center justify-between">
        <div className="flex gap-4">
          <span>💡 New line: Auto-numbered</span>
          <span>Tab at end: Add sub-point</span>
          <span>Tab at start: Convert to sub-point</span>
          <span>Templates: dm, htn, cad</span>
          <span>Dot phrases: /dm, /htn, /copd</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Characters: {(localValue || '').length}</span>
          <Button size="sm" variant="ghost" onClick={() => { 
            persistedState.clearPersistedState();
            setHasUserEdited(false);
            userExplicitlyDeletedRef.current = true; // Mark as explicitly cleared
          }} className="h-6 px-2 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}