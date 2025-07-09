import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { dotPhrases } from '@/lib/dotPhrases';
import type { CustomDotPhrase } from '@/components/DotPhraseManager';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalculationModal } from './CalculationModal';
import { CalculationResult } from './CalculationModal';
import getCaretCoordinates from 'textarea-caret';
import { useAuth } from 'react-oidc-context';
import { useDotPhrases } from '@/hooks/useDotPhrases';

interface DotPhraseTextareaProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
  onRef?: (ref: React.RefObject<HTMLTextAreaElement>) => void;
  isCreationMode?: boolean;
  onBlur?: () => void;
}

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

export const DotPhraseTextarea: React.FC<DotPhraseTextareaProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 4,
  disabled = false,
  onRef,
  isCreationMode = false,
  onBlur,
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentDot, setCurrentDot] = useState<{ phrase: string, start: number, end: number } | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [smartOptions, setSmartOptions] = useState<any[]>([]);
  const [activeSmartIdx, setActiveSmartIdx] = useState<number | null>(null);
  const { data: customPhrases = [] } = useDotPhrases();
  const [isCalculationModalOpen, setIsCalculationModalOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dateValue, setDateValue] = useState<string>("");
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [customInput, setCustomInput] = useState<string>("");
  const [customInputFocused, setCustomInputFocused] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dropdownMouseDownRef = useRef(false);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateObj, setDateObj] = useState<Date | null>(null);
  const justExpandedToSmartOption = useRef(false);
  const [calendarIsOpen, setCalendarIsOpen] = useState(false);
  const auth = useAuth();

  // Expose textarea ref to parent
  useEffect(() => {
    if (onRef) {
      onRef(textareaRef);
    }
  }, [onRef]);


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
    const options = parseSmartOptions(value);
    setSmartOptions(options);
    
    // Auto-activate first smart option if we have smart functions (but not in creation mode)
    if (options.length > 0 && activeSmartIdx === null && !isCreationMode) {
      // Check if this looks like a template or dot phrase expansion
      const hasOnlySmartFunctions = value.trim().match(/^\[\[.*\]\]$/) || 
                                   justExpandedToSmartOption.current;
      if (hasOnlySmartFunctions) {
        setActiveSmartIdx(0);
      }
    }
  }, [value, activeSmartIdx, isCreationMode]);

  // Handle typing in textarea
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    setCurrentPosition(cursor);
    onChange(newValue);

    // Slash phrase detection
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
  }, [onChange]);

  // Handle keydown for autocomplete and smart options
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const cursor = e.currentTarget.selectionStart;
    setCurrentPosition(cursor);

    // Check for /calc command + Enter or Tab
    const lastFiveChars = value.substring(Math.max(0, cursor - 5), cursor);
    if (lastFiveChars === '/calc' && (e.key === 'Enter' || e.key === 'Tab')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Clear any existing state
      setShowSuggestions(false);
      setCurrentDot(null);
      setSuggestions([]);
      
      // Remove the /calc text
      const beforeCalc = value.substring(0, cursor - 5);
      const afterCalc = value.substring(cursor);
      const cleanValue = beforeCalc + afterCalc;
      onChange(cleanValue);
      
      // Open the modal
      setIsCalculationModalOpen(true);
      return;
    }

    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(s => (s + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(s => (s - 1 + suggestions.length) % suggestions.length);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const selectedPhrase = suggestions[selectedSuggestion];
        if (selectedPhrase === '/calc') {
          // Handle calculation modal
          setShowSuggestions(false);
          setCurrentDot(null);
          setSuggestions([]);
          
          // Remove the /calc text
          const beforeCalc = value.substring(0, cursor - 5);
          const afterCalc = value.substring(cursor);
          const cleanValue = beforeCalc + afterCalc;
          onChange(cleanValue);
          
          // Open the modal
          setIsCalculationModalOpen(true);
        } else {
          expandDotPhrase(selectedPhrase);
        }
      }
      return;
    }

    // Smart phrase dropdown navigation (but not in creation mode)
    if (!isCreationMode && smartOptions.length > 0 && activeSmartIdx !== null) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const opt = smartOptions[activeSmartIdx];
        opt.selectedIdx = (opt.selectedIdx - 1 + opt.options.length) % opt.options.length;
        setSmartOptions([...smartOptions]);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const opt = smartOptions[activeSmartIdx];
        opt.selectedIdx = (opt.selectedIdx + 1) % opt.options.length;
        setSmartOptions([...smartOptions]);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        handleSmartOptionSelect(activeSmartIdx, smartOptions[activeSmartIdx].selectedIdx);
      } else if (e.key === 'Escape') {
        setActiveSmartIdx(null);
      }
      return;
    }
    
    // Allow normal Enter behavior when no suggestions or smart options are active
    if (e.key === 'Enter' && !showSuggestions && (smartOptions.length === 0 || activeSmartIdx === null)) {
      // Let the default Enter behavior happen (create new line)
      return;
    }
  }, [value, onChange, showSuggestions, suggestions, selectedSuggestion, smartOptions, activeSmartIdx, isCreationMode]);

  // Expand dot phrase in textarea
  const expandDotPhrase = (dotKey: string) => {
    if (!currentDot) return;
    const combinedPhrases = getCombinedDotPhrases();
    const phrase = combinedPhrases[dotKey];
    if (!phrase) return;
    
    const before = value.slice(0, currentDot.start);
    const after = value.slice(currentDot.end);
    const expanded = before + phrase + after;
    
    // Check if the expanded value contains a smart option (but don't activate in creation mode)  
    const smartOpts = parseSmartOptions(expanded);
    if (smartOpts.length > 0 && !isCreationMode) {
      justExpandedToSmartOption.current = true;
    }
    
    // Preserve scroll position and cursor information
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    onChange(expanded);
    setShowSuggestions(false);
    setCurrentDot(null);
    setSuggestions([]);
    setSelectedSuggestion(0);
    
    // Move cursor after inserted phrase and restore scroll position immediately
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
    const before = value.slice(0, opt.start);
    const after = value.slice(opt.end);
    const selected = opt.options[optIdx];
    
    // Preserve scroll position and cursor information
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    // Replace the [[...]] with the selected option
    const newValue = before + selected + after;
    onChange(newValue);
    
    // Immediately restore scroll position and handle cursor positioning
    if (textareaRef.current) {
      textareaRef.current.scrollTop = currentScrollTop;
      textareaRef.current.scrollLeft = currentScrollLeft;
      textareaRef.current.focus();
      
      // Force scroll position to stick
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = currentScrollTop;
          textareaRef.current.scrollLeft = currentScrollLeft;
          
          const newOptions = parseSmartOptions(newValue);
          if (newOptions.length > 0) {
            // More options available, activate the next one
            setActiveSmartIdx(0);
          } else {
            // No more options, place cursor at the end of all inserted text
            setActiveSmartIdx(null);
            const endPos = newValue.length;
            textareaRef.current.selectionStart = endPos;
            textareaRef.current.selectionEnd = endPos;
          }
        }
      });
    }
  };

  // Handle custom option input
  const handleCustomOptionSelect = (idx: number, customText: string) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = value.slice(0, opt.start);
    const after = value.slice(opt.end);
    
    // Preserve scroll position
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    // Replace the [[...]] with the custom text
    const newValue = before + customText + after;
    onChange(newValue);
    
    // Restore scroll position and handle next options
    if (textareaRef.current) {
      textareaRef.current.scrollTop = currentScrollTop;
      textareaRef.current.scrollLeft = currentScrollLeft;
      textareaRef.current.focus();
      
      requestAnimationFrame(() => {
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
      });
    }
  };

  // Handle cancel option (delete entire expanded phrase)
  const handleCancelOption = (idx: number) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = value.slice(0, opt.start);
    const after = value.slice(opt.end);
    // Remove only this smart option
    const newValue = before + after;
    onChange(newValue);
    // After update, activate the next smart option if any
    setTimeout(() => {
      const updatedOptions = parseSmartOptions(newValue);
      if (updatedOptions.length > 0) {
        // Try to activate the next one, or previous if last was deleted
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

  // Handle click on dropdown
  const handleDropdownClick = (idx: number) => {
    setActiveSmartIdx(idx);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (idx: number) => {
    const selectedPhrase = suggestions[idx];
    if (selectedPhrase === '/calc') {
      // Handle calculation modal
      setShowSuggestions(false);
      setCurrentDot(null);
      setSuggestions([]);
      
      // Remove the /calc text
      const beforeCalc = value.substring(0, currentPosition - 5);
      const afterCalc = value.substring(currentPosition);
      const cleanValue = beforeCalc + afterCalc;
      onChange(cleanValue);
      
      // Open the modal
      setIsCalculationModalOpen(true);
    } else {
      expandDotPhrase(selectedPhrase);
    }
  };

  // Handle calculation result
  const handleCalculationResult = useCallback((result: CalculationResult) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const beforeText = value.substring(0, currentPosition - 5); // Remove "/calc"
    const afterText = value.substring(currentPosition);
    const resultValue = typeof result.value === 'number' ? result.value.toString() : result.value;
    const newValue = `${beforeText}${result.name}: ${resultValue} ${result.unit}${afterText}`;
    
    onChange(newValue);
    textarea.focus();
    
    // Set cursor position after the inserted result
    const newPosition = beforeText.length + result.name.length + resultValue.length + result.unit.length + 3; // +3 for ": " and space
    setTimeout(() => {
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
    }, 0);
  }, [value, currentPosition, onChange]);

  // Handle cursor position changes
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const cursor = e.currentTarget.selectionStart;
    setCurrentPosition(cursor);
  };

  // Ensure state is reset after calculation modal closes
  useEffect(() => {
    if (!isCalculationModalOpen) {
      setShowSuggestions(false);
      setCurrentDot(null);
      setSuggestions([]);
      // Refocus textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isCalculationModalOpen]);

  useEffect(() => {
    if (!isCreationMode && activeSmartIdx !== null && textareaRef.current && smartOptions[activeSmartIdx]) {
      const opt = smartOptions[activeSmartIdx];
      const caret = getCaretCoordinates(textareaRef.current, opt.start);
      const rect = textareaRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top + caret.top - textareaRef.current.scrollTop + 28, // 28px below caret
        left: rect.left + caret.left - textareaRef.current.scrollLeft + 8
      });
    }
  }, [activeSmartIdx, smartOptions, value, isCreationMode]);

  // Open the date picker automatically and robustly when the dropdown appears for a DATE smart option (but not in creation mode)
  useEffect(() => {
    if (
      !isCreationMode &&
      activeSmartIdx !== null &&
      smartOptions[activeSmartIdx] &&
      smartOptions[activeSmartIdx].options[0] === 'DATE'
    ) {
      setDatePickerOpen(true);
      setDateObj(null);
      setDateValue("");
    } else {
      setDatePickerOpen(false);
    }
  }, [activeSmartIdx, smartOptions, isCreationMode]);

  // Prevent blur from closing dropdown when interacting with date picker
  const handleBlur = () => {
    setTimeout(() => {
      if (isCreationMode || (!dropdownMouseDownRef.current && !(activeSmartIdx !== null && smartOptions[activeSmartIdx] && smartOptions[activeSmartIdx].options[0] === 'DATE' && (datePickerOpen || calendarIsOpen)))) {
        setActiveSmartIdx(null);
        setShowSuggestions(false);
      }
      dropdownMouseDownRef.current = false;
      if (onBlur) onBlur();
    }, 50);
  };

  // Handle keyboard navigation in dropdown
  useEffect(() => {
    if (isCreationMode || activeSmartIdx === null || !smartOptions[activeSmartIdx]) return;
    const handleDropdownKeyDown = (e: KeyboardEvent) => {
      if (activeSmartIdx === null) return;
      const opts = smartOptions[activeSmartIdx].options;
      const numOptions = opts.length;
      const isDate = opts[0] === 'DATE';
      if (isDate) return; // Let date picker handle its own keys
      let selIdx = smartOptions[activeSmartIdx].selectedIdx ?? 0;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (customInputFocused) {
          // wrap to first option
          setCustomInputFocused(false);
          updateSmartOptionsIdx(activeSmartIdx, 0);
        } else if (selIdx < numOptions - 1) {
          updateSmartOptionsIdx(activeSmartIdx, selIdx + 1);
        } else {
          // move to custom input
          setCustomInputFocused(true);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (customInputFocused) {
          // move to last option
          setCustomInputFocused(false);
          updateSmartOptionsIdx(activeSmartIdx, numOptions - 1);
        } else if (selIdx > 0) {
          updateSmartOptionsIdx(activeSmartIdx, selIdx - 1);
        } else {
          // move to custom input
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
  }, [activeSmartIdx, smartOptions, customInputFocused, customInput, isCreationMode]);

  function updateSmartOptionsIdx(idx: number, sel: number) {
    setSmartOptions(prev => prev.map((o, i) => i === idx ? { ...o, selectedIdx: sel } : o));
  }

  // After smartOptions update, if justExpandedToSmartOption is true, set activeSmartIdx (but not in creation mode)
  useEffect(() => {
    if (justExpandedToSmartOption.current && smartOptions.length > 0 && !isCreationMode) {
      setActiveSmartIdx(0);
      justExpandedToSmartOption.current = false;
    }
  }, [smartOptions, isCreationMode]);

  // Always open dropdown/calendar for a single smart option covering the whole textarea (but not in creation mode)
  useEffect(() => {
    if (
      !isCreationMode &&
      smartOptions.length === 1 &&
      smartOptions[0].start === 0 &&
      smartOptions[0].end === value.length &&
      value.trim().startsWith('[[') &&
      value.trim().endsWith(']]')
    ) {
      if (activeSmartIdx !== 0) setActiveSmartIdx(0);
      if (smartOptions[0].options[0] === 'DATE') {
        setDatePickerOpen(true);
        setCalendarIsOpen(true);
      }
    }
  }, [value, smartOptions, isCreationMode]);

  // Handle click to activate smart functions (but not in creation mode)
  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (isCreationMode) return; // Don't activate smart functions in creation mode
    
    const textarea = e.currentTarget;
    const cursor = textarea.selectionStart;
    
    // Check if click is inside a smart function
    smartOptions.forEach((option, index) => {
      if (cursor >= option.start && cursor <= option.end) {
        setActiveSmartIdx(index);
      }
    });
  };

  // Always render the textarea, but overlay smart options when needed
  const renderTextarea = () => (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onSelect={handleSelect}
      onBlur={handleBlur}
      onClick={handleTextareaClick}
      placeholder={placeholder}
      className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
      rows={rows}
      style={{
        resize: 'vertical',
      }}
    />
  );

  return (
    <div className="relative">
      {renderTextarea()}
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto min-w-48"
          onPointerDown={() => { dropdownMouseDownRef.current = true; }}
          onPointerUp={() => { dropdownMouseDownRef.current = false; }}
          onMouseDown={() => { dropdownMouseDownRef.current = true; }}
          onMouseUp={() => { dropdownMouseDownRef.current = false; }}
        >
          {suggestions.map((s, idx) => {
            const isCustom = customPhrases.some(p => p.trigger === s);
            const customPhrase = customPhrases.find(p => p.trigger === s);
            const combinedPhrases = getCombinedDotPhrases();
            const content = combinedPhrases[s] || '';
            const preview = content.split('\n')[0] || '';
            
            return (
              <div
                key={s + idx}
                className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                  idx === selectedSuggestion ? 'bg-blue-100' : ''
                }`}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSuggestionClick(idx);
                }}
                onPointerDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onMouseDown={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="font-mono text-sm">{s}</div>
                <div className="text-xs text-gray-500 truncate">
                  {customPhrase?.description || preview}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Smart Options Dropdown */}
      {!isCreationMode && activeSmartIdx !== null && smartOptions[activeSmartIdx] && (
        <div
          className="fixed z-30 bg-white/90 border border-blue-200 rounded shadow-lg p-1 text-sm"
          style={{ minWidth: 120, maxWidth: 220, top: dropdownPos.top, left: dropdownPos.left }}
          onMouseDown={() => { dropdownMouseDownRef.current = true; }}
        >
          {/* Pointer triangle */}
          <div
            style={{
              position: 'absolute',
              top: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderBottom: '8px solid #bfdbfe', // blue-200
              zIndex: 31,
            }}
          />
          {/* Dropdown content */}
          {smartOptions[activeSmartIdx].options[0] === 'DATE' ? (
            <div className="flex flex-col items-start gap-1">
              <label className="text-xs text-gray-500 mb-1">Select date:</label>
              <DatePicker
                selected={dateObj}
                onChange={date => {
                  setDateObj(date);
                  setDateValue(date ? date.toISOString().slice(0, 10) : "");
                  setDatePickerOpen(false);
                  setCalendarIsOpen(false);
                  if (date) {
                    handleCustomOptionSelect(activeSmartIdx, date.toISOString().slice(0, 10));
                    setDateValue("");
                  }
                }}
                onCalendarClose={() => setCalendarIsOpen(false)}
                onCalendarOpen={() => setCalendarIsOpen(true)}
                open={datePickerOpen}
                onFocus={() => { setDatePickerOpen(true); setCalendarIsOpen(true); }}
                dateFormat="yyyy-MM-dd"
                className="border px-2 py-1 rounded text-sm"
                autoFocus
                placeholderText="YYYY-MM-DD"
                todayButton="Today"
                showPopperArrow={false}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                    handleCustomOptionSelect(activeSmartIdx, dateStr);
                    setDateValue("");
                    setDatePickerOpen(false);
                    setCalendarIsOpen(false);
                  } else if (e.key === 'Escape') {
                    setActiveSmartIdx(null);
                    setDateValue("");
                    setDatePickerOpen(false);
                    setCalendarIsOpen(false);
                  }
                }}
              />
              <div className="flex gap-2 mt-1">
                <button
                  className="text-xs text-blue-700 hover:underline"
                  onMouseDown={e => {
                    e.preventDefault();
                    const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                    handleCustomOptionSelect(activeSmartIdx, dateStr);
                    setDateValue("");
                    setDatePickerOpen(false);
                    setCalendarIsOpen(false);
                  }}
                >
                  Insert
                </button>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleCancelOption(activeSmartIdx);
                    setDateValue("");
                    setDatePickerOpen(false);
                    setCalendarIsOpen(false);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <>
              {smartOptions[activeSmartIdx].options.map((opt: string, idx: number) => (
                <div
                  key={opt + idx}
                  className={`px-2 py-1 rounded cursor-pointer hover:bg-blue-50 ${smartOptions[activeSmartIdx].selectedIdx === idx ? 'bg-blue-100 text-blue-800' : ''}`}
                  style={{ fontSize: '0.97em' }}
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSmartOptionSelect(activeSmartIdx, idx);
                  }}
                >
                  {opt}
                </div>
              ))}
              {/* Custom input option */}
              <div className="flex items-center gap-1 mt-2">
                <input
                  ref={customInputRef}
                  type="text"
                  className={`border px-2 py-1 rounded text-sm flex-1 ${customInputFocused ? 'ring-2 ring-blue-400' : ''}`}
                  placeholder="Other..."
                  value={customInput}
                  onFocus={() => setCustomInputFocused(true)}
                  onBlur={() => setCustomInputFocused(false)}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customInput.trim()) {
                      e.preventDefault();
                      handleCustomOptionSelect(activeSmartIdx, customInput.trim());
                      setCustomInput("");
                      setCustomInputFocused(false);
                    }
                  }}
                />
                <button
                  className="text-xs text-blue-700 hover:underline"
                  disabled={!customInput.trim()}
                  onMouseDown={e => {
                    e.preventDefault();
                    if (customInput.trim()) {
                      handleCustomOptionSelect(activeSmartIdx, customInput.trim());
                      setCustomInput("");
                      setCustomInputFocused(false);
                    }
                  }}
                >
                  Insert
                </button>
              </div>
              <div className="mt-1 flex gap-2">
                <button
                  className="text-xs text-red-600 hover:underline"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleCancelOption(activeSmartIdx);
                  }}
                >
                  Remove
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <CalculationModal
        isOpen={isCalculationModalOpen}
        onClose={() => setIsCalculationModalOpen(false)}
        onResult={handleCalculationResult}
      />

    </div>
  );
};
