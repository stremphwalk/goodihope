import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { dotPhrases } from '@/lib/dotPhrases';
import { useAuth } from 'react-oidc-context';
import type { CustomDotPhrase } from '@/components/DotPhraseManager';
import getCaretCoordinates from 'textarea-caret';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SmartTextEntryProps {
  title: string;
  placeholder: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  templates?: { [key: string]: string };
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

export function SmartTextEntry({ title, placeholder, value, onChange, onBlur, templates }: SmartTextEntryProps) {
  const { language } = useLanguage();
  const auth = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState(value || '');
  const [hasUserEdited, setHasUserEdited] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  
  // Dot phrase state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentDot, setCurrentDot] = useState<{ phrase: string, start: number, end: number } | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [smartOptions, setSmartOptions] = useState<any[]>([]);
  const [activeSmartIdx, setActiveSmartIdx] = useState<number | null>(null);
  const [customPhrases, setCustomPhrases] = useState<CustomDotPhrase[]>([]);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [customInput, setCustomInput] = useState<string>("");
  const [customInputFocused, setCustomInputFocused] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dropdownMouseDownRef = useRef(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const [calendarIsOpen, setCalendarIsOpen] = useState(false);
  const justExpandedToSmartOption = useRef(false);

  // Fetch custom dot phrases
  useEffect(() => {
    const fetchCustomPhrases = async () => {
      if (!auth.isAuthenticated || !auth.user?.id_token) {
        setCustomPhrases([]);
        return;
      }

      try {
        const response = await fetch('/api/dot-phrases', {
          headers: {
            'Authorization': `Bearer ${auth.user.id_token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setCustomPhrases(data);
        } else {
          console.error('Failed to fetch custom dot phrases');
          setCustomPhrases([]);
        }
      } catch (error) {
        console.error('Error fetching custom dot phrases:', error);
        setCustomPhrases([]);
      }
    };

    fetchCustomPhrases();
  }, [auth.isAuthenticated, auth.user]);

  // Create combined dot phrases object
  const getCombinedDotPhrases = (): Record<string, string> => {
    const combined: Record<string, string> = { ...(dotPhrases as Record<string, string>) };
    customPhrases.forEach(phrase => {
      combined[phrase.trigger] = phrase.content;
    });
    return combined;
  };

  // Update smart options when value changes
  useEffect(() => {
    const options = parseSmartOptions(localValue);
    setSmartOptions(options);
    
    // Auto-activate first smart option if we have smart functions and user isn't actively editing
    if (options.length > 0 && !isFocused && activeSmartIdx === null) {
      // Check if this looks like a template or dot phrase expansion
      const hasOnlySmartFunctions = (localValue || '').trim().match(/^\[\[.*\]\]$/) || 
                                   justExpandedToSmartOption.current ||
                                   // Also activate if we just loaded content with smart functions
                                   (!hasUserEdited && options.length > 0);
      if (hasOnlySmartFunctions) {
        setActiveSmartIdx(0);
      }
    }
  }, [localValue, isFocused, activeSmartIdx, hasUserEdited]);

  // Only sync external value when not focused and user hasn't edited
  useEffect(() => {
    if (!isFocused && !hasUserEdited) {
      setLocalValue(value || '');
    }
  }, [value, isFocused, hasUserEdited]);

  // Detect when a new template is applied (significant value change when not focused)
  useEffect(() => {
    if (!isFocused && value !== localValue && (value || '').trim() !== '' && (localValue || '').trim() === '') {
      // This looks like a template being applied to an empty field
      setLocalValue(value || '');
      setHasUserEdited(false); // Reset so template can work
    }
  }, [value, localValue, isFocused]);

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

  const handleBlur = () => {
    setIsFocused(false);
    if (onChange) {
      onChange(localValue || ''); // Only propagate raw value on blur
    }
    onBlur?.(); // Call additional blur handler if provided
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Mark that user has started editing this field
    setHasUserEdited(true);
  };

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
          opt.selectedIdx = (opt.selectedIdx - 1 + opt.options.length) % opt.options.length;
          setSmartOptions([...smartOptions]);
          return;
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          const opt = smartOptions[activeSmartIdx];
          opt.selectedIdx = (opt.selectedIdx + 1) % opt.options.length;
          setSmartOptions([...smartOptions]);
          return;
        } else if (e.key === 'Enter' || e.key === 'Tab') {
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
  }, [localValue, showSuggestions, suggestions, selectedSuggestion, smartOptions, activeSmartIdx]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newValue = e.target.value;
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Mark that user has edited this field
      setHasUserEdited(true);

      // Dot phrase detection
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
    const currentValue = localValue || '';
    const beforeCursor = currentValue.substring(0, selectionStart);
    const afterCursor = currentValue.substring(selectionStart);
    
    const newValue = beforeCursor + template + afterCursor;
    setLocalValue(newValue);
    setHasUserEdited(true);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + template.length, selectionStart + template.length);
    }, 0);
  }, [localValue]);

  const addCondition = useCallback(() => {
    const newValue = (localValue || '') + ((localValue || '') ? '\n' : '') + '# ';
    setLocalValue(newValue);
    setHasUserEdited(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  }, [localValue]);

  const addDetail = useCallback(() => {
    const newValue = (localValue || '') + ((localValue || '') ? '\n' : '') + '- ';
    setLocalValue(newValue);
    setHasUserEdited(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newValue.length, newValue.length);
    }, 0);
  }, [localValue]);

  // Expand dot phrase in textarea
  const expandDotPhrase = (dotKey: string) => {
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
  };

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
      const opt = smartOptions[activeSmartIdx];
      const caret = getCaretCoordinates(textareaRef.current, opt.start);
      const rect = textareaRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top + caret.top - textareaRef.current.scrollTop + 28,
        left: rect.left + caret.left - textareaRef.current.scrollLeft + 8
      });
    }
  }, [activeSmartIdx, smartOptions, localValue]);

  // Open date picker for DATE options
  useEffect(() => {
    if (
      activeSmartIdx !== null &&
      smartOptions[activeSmartIdx] &&
      smartOptions[activeSmartIdx].options[0] === 'DATE'
    ) {
      setDatePickerOpen(true);
      setDateObj(null);
    } else {
      setDatePickerOpen(false);
    }
  }, [activeSmartIdx, smartOptions]);

  // Handle blur to prevent closing dropdown during interaction
  const handleTextareaBlur = () => {
    setIsFocused(false);
    if (onChange) {
      onChange(localValue || '');
    }
    onBlur?.();
    
    setTimeout(() => {
      if (!dropdownMouseDownRef.current && !(activeSmartIdx !== null && smartOptions[activeSmartIdx] && smartOptions[activeSmartIdx].options[0] === 'DATE' && (datePickerOpen || calendarIsOpen))) {
        setActiveSmartIdx(null);
        setShowSuggestions(false);
        setCurrentDot(null);
      }
      dropdownMouseDownRef.current = false;
    }, 50);
  };

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
        setDatePickerOpen(true);
        setCalendarIsOpen(true);
      }
    }
  }, [localValue, smartOptions]);

  // Helper function to update smart options selection
  function updateSmartOptionsIdx(idx: number, sel: number) {
    setSmartOptions(prev => prev.map((o, i) => i === idx ? { ...o, selectedIdx: sel } : o));
  }

  // Enhanced keyboard navigation for dropdown
  useEffect(() => {
    if (activeSmartIdx === null || !smartOptions[activeSmartIdx]) return;
    const handleDropdownKeyDown = (e: KeyboardEvent) => {
      if (activeSmartIdx === null) return;
      const opts = smartOptions[activeSmartIdx].options;
      const numOptions = opts.length;
      const isDate = opts[0] === 'DATE';
      if (isDate) return;
      let selIdx = smartOptions[activeSmartIdx].selectedIdx ?? 0;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (customInputFocused) {
          setCustomInputFocused(false);
          updateSmartOptionsIdx(activeSmartIdx, 0);
        } else if (selIdx < numOptions - 1) {
          updateSmartOptionsIdx(activeSmartIdx, selIdx + 1);
        } else {
          setCustomInputFocused(true);
        }
      } else if (e.key === 'ArrowUp') {
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
    window.addEventListener('keydown', handleDropdownKeyDown);
    return () => window.removeEventListener('keydown', handleDropdownKeyDown);
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
        className="w-full h-64 p-4 bg-gray-50 border-0 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:bg-white font-mono text-sm transition-colors"
        style={{ fontFamily: 'ui-monospace, monospace' }}
      />
      
      {/* Dot phrase suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-48"
          onPointerDown={() => { dropdownMouseDownRef.current = true; }}
          onMouseDown={() => { dropdownMouseDownRef.current = true; }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                index === selectedSuggestion ? 'bg-blue-100' : ''
              }`}
              onPointerDown={(e) => {
                e.preventDefault();
                dropdownMouseDownRef.current = true;
                expandDotPhrase(suggestion);
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                dropdownMouseDownRef.current = true;
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
          onPointerDown={() => { dropdownMouseDownRef.current = true; }}
          onPointerUp={() => { dropdownMouseDownRef.current = false; }}
          onMouseDown={() => { dropdownMouseDownRef.current = true; }}
          onMouseUp={() => { dropdownMouseDownRef.current = false; }}
        >
          {/* Date Picker for DATE options */}
          {smartOptions[activeSmartIdx].options[0] === 'DATE' && (
            <div className="p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Select Date:</div>
              <DatePicker
                selected={dateObj}
                onChange={(date) => {
                  setDateObj(date);
                  if (date) {
                    const formattedDate = date.toLocaleDateString();
                    handleSmartOptionSelect(activeSmartIdx, 0);
                    // Replace the DATE placeholder with the actual date
                    const before = (localValue || '').slice(0, smartOptions[activeSmartIdx].start);
                    const after = (localValue || '').slice(smartOptions[activeSmartIdx].end);
                    const newValue = before + formattedDate + after;
                    setLocalValue(newValue);
                  }
                }}
                inline
                open={datePickerOpen}
                onCalendarOpen={() => setCalendarIsOpen(true)}
                onCalendarClose={() => setCalendarIsOpen(false)}
                dateFormat="MM/dd/yyyy"
                placeholderText="Select date"
                className="w-full"
              />
            </div>
          )}

          {/* Regular Options Dropdown */}
          {smartOptions[activeSmartIdx].options[0] !== 'DATE' && (
            <>
              {/* Options List */}
              {smartOptions[activeSmartIdx].options.map((option: string, optIdx: number) => (
                <div
                  key={optIdx}
                  className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                    optIdx === smartOptions[activeSmartIdx].selectedIdx ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => handleSmartOptionSelect(activeSmartIdx, optIdx)}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
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
            setLocalValue(''); 
            setHasUserEdited(false); 
            if (onChange) {
              onChange(''); 
            }
          }} className="h-6 px-2 text-xs">
            <RotateCcw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}