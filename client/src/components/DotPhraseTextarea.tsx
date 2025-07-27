import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { dotPhrases } from '@/lib/dotPhrases';
import type { CustomDotPhrase } from '@/components/DotPhraseManager';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalculationModal } from './CalculationModal';
import { CalculationResult } from './CalculationModal';
import { WidgetModal } from './WidgetModal';
import getCaretCoordinates from 'textarea-caret';
import { useAuth } from '@/contexts/AuthContext';
import { useDotPhrases } from '@/hooks/useDotPhrases';
import { widgetRegistry, parseWidgetSyntax } from '@/lib/widgetRegistry';
import { WidgetWrapper } from './WidgetWrapper';
import { WidgetInstance } from '@/types/widgets';
import '@/lib/registerWidgets';

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
    
    // Check if this is a widget option (starts with WIDGET:)
    const isWidget = options.length === 1 && options[0].startsWith('WIDGET:');
    
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      options: isWidget ? ['Open Widget'] : options,
      selectedIdx: 0,
      isWidget,
      widgetType: isWidget ? options[0].split(':')[1] : null
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
  const [widgets, setWidgets] = useState<Map<string, WidgetInstance>>(new Map());
  const [activeWidgetModal, setActiveWidgetModal] = useState<{type: string, position: number} | null>(null);
  const [currentPosition, setCurrentPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number}>({top: 0, left: 0});
  const [customInput, setCustomInput] = useState<string>("");
  const [customInputFocused, setCustomInputFocused] = useState(false);
  const customInputRef = useRef<HTMLInputElement>(null);
  const dropdownMouseDownRef = useRef(false);
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

  // Update smart options and widgets when value changes
  useEffect(() => {
    const options = parseSmartOptions(value);
    setSmartOptions(options);
    
    // Parse widgets with error handling
    try {
      const widgetMatches = parseWidgetSyntax(value);
      const newWidgets = new Map<string, WidgetInstance>();
      
      widgetMatches.forEach(match => {
        try {
          const existingWidget = widgets.get(match.id);
          if (existingWidget) {
            newWidgets.set(match.id, existingWidget);
          } else {
            // Create new widget instance
            const widget = widgetRegistry.createWidget(match.type);
            if (widget) {
              widget.id = match.id;
              widget.onDataChange = (data) => handleWidgetDataChange(match.id, data);
              newWidgets.set(match.id, widget);
            }
          }
        } catch (error) {
          console.warn(`Failed to process widget ${match.id} of type ${match.type}:`, error);
        }
      });
      
      // Only update widgets if the map has actually changed
      if (newWidgets.size !== widgets.size || 
          Array.from(newWidgets.keys()).some(id => !widgets.has(id))) {
        setWidgets(newWidgets);
      }
    } catch (error) {
      console.warn('Error parsing widget syntax:', error);
    }
    
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
    
    // Check if this is a widget option
    if (opt.isWidget && opt.widgetType) {
      // Open widget modal instead of replacing text
      setActiveWidgetModal({
        type: opt.widgetType,
        position: opt.start
      });
      setActiveSmartIdx(null);
      return;
    }
    
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

  // Handle widget data changes
  const handleWidgetDataChange = (widgetId: string, newData: Record<string, any>) => {
    setWidgets(prev => {
      const newWidgets = new Map(prev);
      const widget = newWidgets.get(widgetId);
      if (widget) {
        widget.data = newData;
        widget.onDataChange = (data) => handleWidgetDataChange(widgetId, data);
        newWidgets.set(widgetId, widget);
      }
      return newWidgets;
    });
  };

  // Generate text output including widgets
  const generateTextOutput = () => {
    let output = value;
    const widgetMatches = parseWidgetSyntax(value);
    
    // Replace widget syntax with text from widgets
    widgetMatches.forEach(match => {
      const widget = widgets.get(match.id);
      if (widget) {
        const text = widgetRegistry.generateText(match.type, widget.data);
        output = output.replace(match.match, text);
      }
    });
    
    return output;
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

  // Handle widget result
  const handleWidgetResult = useCallback((widgetData: Record<string, any>) => {
    if (!activeWidgetModal || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const widgetText = widgetRegistry.generateText(activeWidgetModal.type, widgetData);
    
    // Find the widget placeholder in the text
    const beforeWidget = value.substring(0, activeWidgetModal.position);
    const afterWidget = value.substring(activeWidgetModal.position);
    
    // Remove the [[WIDGET:type]] placeholder and insert the generated text
    const widgetPlaceholderEnd = afterWidget.indexOf(']]') + 2;
    const afterWidgetClean = afterWidget.substring(widgetPlaceholderEnd);
    
    const newValue = beforeWidget + widgetText + afterWidgetClean;
    onChange(newValue);
    
    // Close modal and focus textarea
    setActiveWidgetModal(null);
    textarea.focus();
    
    // Set cursor position after the inserted text
    const newPosition = beforeWidget.length + widgetText.length;
    setTimeout(() => {
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
      
      // Check for remaining smart options and auto-show popup
      const remainingSmartOptions = parseSmartOptions(newValue);
      if (remainingSmartOptions.length > 0) {
        setSmartOptions(remainingSmartOptions);
        setActiveSmartIdx(0);
      }
    }, 0);
  }, [activeWidgetModal, value, onChange]);

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

  // Handle blur to prevent closing dropdown during interaction
  const handleBlur = () => {
    setTimeout(() => {
      if (!dropdownMouseDownRef.current && !(activeSmartIdx !== null && smartOptions[activeSmartIdx] && smartOptions[activeSmartIdx].options?.includes('DATE') && calendarIsOpen)) {
        setActiveSmartIdx(null);
        setShowSuggestions(false);
        setCurrentDot(null);
      }
      dropdownMouseDownRef.current = false;
    }, 50);
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
  }, [activeSmartIdx, smartOptions, value]);

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
      smartOptions[0].end === value.length &&
      value.trim().startsWith('[[') &&
      value.trim().endsWith(']]')
    ) {
      if (activeSmartIdx !== 0) setActiveSmartIdx(0);
      if (smartOptions[0].options[0] === 'DATE') {
        setCalendarIsOpen(true);
      }
    }
  }, [value, smartOptions]);

  // Enhanced keyboard navigation for dropdown
  useEffect(() => {
    if (activeSmartIdx === null || !smartOptions[activeSmartIdx]) return;
    const handleDropdownKeyDown = (e: KeyboardEvent) => {
      if (activeSmartIdx === null) return;
      const opts = smartOptions[activeSmartIdx].options;
      const numOptions = opts.length;
      const isDate = opts[0] === 'DATE';
      let selIdx = smartOptions[activeSmartIdx].selectedIdx ?? 0;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        // Move to previous smart option with looping
        setActiveSmartIdx((activeSmartIdx - 1 + smartOptions.length) % smartOptions.length);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Move to next smart option with looping
        setActiveSmartIdx((activeSmartIdx + 1) % smartOptions.length);
      } else if (e.key === 'ArrowDown' && !isDate) {
        e.preventDefault();
        // Cycle to next option within the current smart option (skip for dates)
        updateSmartOptionsIdx(activeSmartIdx, (selIdx + 1) % numOptions);
      } else if (e.key === 'ArrowUp' && !isDate) {
        e.preventDefault();
        // Cycle to previous option within the current smart option (skip for dates)
        updateSmartOptionsIdx(activeSmartIdx, (selIdx - 1 + numOptions) % numOptions);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        handleSmartOptionSelect(activeSmartIdx, selIdx);
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

    // Check if click is inside a widget placeholder
    const widgetRegex = /\[\[WIDGET:([a-zA-Z0-9_-]+):([a-zA-Z0-9_-]+)\]\]/g;
    let match;
    while ((match = widgetRegex.exec(value))) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (cursor >= start && cursor <= end) {
        setActiveWidgetModal({
          type: match[1],
          position: start
        });
        setActiveSmartIdx(null);
        break;
      }
    }
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
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                index === selectedSuggestion ? 'bg-blue-100' : ''
              }`}
              onPointerDown={(e) => {
                e.preventDefault();
                dropdownMouseDownRef.current = true;
                handleSuggestionClick(index);
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
          {/* Smart Options Counter */}
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <div className="text-xs text-gray-600 text-center font-medium">
              Smart Option {activeSmartIdx + 1}/{smartOptions.length}
            </div>
          </div>
          {/* Date Picker for DATE options */}
          {(activeSmartIdx !== null && smartOptions[activeSmartIdx]?.options?.includes('DATE')) && (
            <div className="p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Select Date:</div>
              <DatePicker
                selected={dateObj}
                onChange={(date) => {
                  setDateObj(date);
                  if (date && activeSmartIdx !== null) {
                    const formattedDate = date.toLocaleDateString();
                    // Replace the DATE placeholder with the actual date
                    const before = value.slice(0, smartOptions[activeSmartIdx].start);
                    const after = value.slice(smartOptions[activeSmartIdx].end);
                    const newValue = before + formattedDate + after;
                    onChange(newValue);
                    
                    // Close the smart options dropdown
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
              <div className="flex gap-2 mt-1">
                <button
                  className="text-xs text-blue-700 hover:underline"
                  onMouseDown={e => {
                    e.preventDefault();
                    const dateStr = dateObj ? dateObj.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
                    handleCustomOptionSelect(activeSmartIdx, dateStr);
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
                    setCalendarIsOpen(false);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
          
          {smartOptions[activeSmartIdx].options[0] !== 'DATE' && smartOptions[activeSmartIdx].isWidget && (
            <div className="flex flex-col items-center gap-2 p-2">
              <div className="text-xs text-gray-600 text-center">
                {smartOptions[activeSmartIdx].widgetType?.charAt(0).toUpperCase() + smartOptions[activeSmartIdx].widgetType?.slice(1)} Widget
              </div>
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onMouseDown={e => {
                  e.preventDefault();
                  handleSmartOptionSelect(activeSmartIdx, 0);
                }}
              >
                Open Widget
              </button>
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
          )}
          
          {smartOptions[activeSmartIdx].options[0] !== 'DATE' && !smartOptions[activeSmartIdx].isWidget && (
            <>
              {/* Arrow buttons for cycling options */}
              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  className="px-2 py-1 text-lg rounded bg-gray-100 hover:bg-gray-200"
                  onMouseDown={e => {
                    e.preventDefault();
                    const selIdx = smartOptions[activeSmartIdx].selectedIdx ?? 0;
                    const numOptions = smartOptions[activeSmartIdx].options.length;
                    const prevIdx = (selIdx - 1 + numOptions) % numOptions;
                    updateSmartOptionsIdx(activeSmartIdx, prevIdx);
                  }}
                  aria-label="Previous option"
                >
                  &#8592;
                </button>
                <span className="text-xs text-gray-500">
                  {((smartOptions[activeSmartIdx].selectedIdx ?? 0) + 1)} / {smartOptions[activeSmartIdx].options.length}
                </span>
                <button
                  className="px-2 py-1 text-lg rounded bg-gray-100 hover:bg-gray-200"
                  onMouseDown={e => {
                    e.preventDefault();
                    const selIdx = smartOptions[activeSmartIdx].selectedIdx ?? 0;
                    const numOptions = smartOptions[activeSmartIdx].options.length;
                    const nextIdx = (selIdx + 1) % numOptions;
                    updateSmartOptionsIdx(activeSmartIdx, nextIdx);
                  }}
                  aria-label="Next option"
                >
                  &#8594;
                </button>
              </div>
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

      {/* Inline Smart Option Selector Popup */}
      {activeSmartIdx !== null && smartOptions[activeSmartIdx] && (() => {
        const opt = smartOptions[activeSmartIdx];
        // Only show for any smart option (multi, widget, date)
        const caretTop = dropdownPos.top - 48; // 48px above caret
        const caretLeft = dropdownPos.left;
        return (
          <div
            className="fixed z-50 bg-white border border-blue-200 rounded shadow-lg px-2 py-1 flex items-center gap-2"
            style={{
              top: caretTop,
              left: caretLeft,
              minWidth: 120,
              maxWidth: 320,
              pointerEvents: 'auto',
            }}
          >
            {opt.options.map((option: string, idx: number) => {
              // Widget option
              if (opt.isWidget || option.startsWith('WIDGET:')) {
                const widgetType = opt.widgetType || option.split(':')[1];
                return (
                  <button
                    key={option + idx}
                    className={`px-2 py-1 rounded border text-xs font-mono ${opt.selectedIdx === idx ? 'bg-purple-100 border-purple-400 text-purple-800' : 'bg-gray-50 border-gray-200 text-gray-700'} hover:bg-purple-50`}
                    onMouseDown={e => {
                      e.preventDefault();
                      setActiveWidgetModal({ type: widgetType, position: opt.start });
                      setActiveSmartIdx(null);
                    }}
                  >
                    {widgetType.charAt(0).toUpperCase() + widgetType.slice(1)} Widget
                  </button>
                );
              }
              // Date picker option
              if (option === 'DATE') {
                return (
                  <button
                    key={option + idx}
                    className={`px-2 py-1 rounded border text-xs font-mono ${opt.selectedIdx === idx ? 'bg-blue-100 border-blue-400 text-blue-800' : 'bg-gray-50 border-gray-200 text-gray-700'} hover:bg-blue-50`}
                    onMouseDown={e => {
                      e.preventDefault();
                      setActiveSmartIdx(activeSmartIdx);
                      updateSmartOptionsIdx(activeSmartIdx, idx);
                    }}
                  >
                    📅 Date
                  </button>
                );
              }
              // Regular option
              return (
                <button
                  key={option + idx}
                  className={`px-2 py-1 rounded border text-xs font-mono ${opt.selectedIdx === idx ? 'bg-green-100 border-green-400 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'} hover:bg-green-50`}
                  onMouseDown={e => {
                    e.preventDefault();
                    handleSmartOptionSelect(activeSmartIdx, idx);
                  }}
                >
                  {option}
                </button>
              );
            })}
            <span className="text-xs text-gray-500 ml-2">
              {((opt.selectedIdx ?? 0) + 1)} / {opt.options.length}
            </span>
          </div>
        );
      })()}


      <CalculationModal
        isOpen={isCalculationModalOpen}
        onClose={() => setIsCalculationModalOpen(false)}
        onResult={handleCalculationResult}
      />

      <WidgetModal
        isOpen={activeWidgetModal !== null}
        widgetType={activeWidgetModal?.type || ''}
        onClose={() => {
          setActiveWidgetModal(null);
          // Check for remaining smart options when widget is closed without selection
          setTimeout(() => {
            const remainingSmartOptions = parseSmartOptions(value);
            if (remainingSmartOptions.length > 0) {
              setSmartOptions(remainingSmartOptions);
              setActiveSmartIdx(0);
            }
          }, 100);
        }}
        onResult={handleWidgetResult}
      />
    </div>
  );
};
