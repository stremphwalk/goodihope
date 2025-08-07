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
import { useLanguage } from '@/contexts/LanguageContext';
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
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
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

// Helper function to calculate optimal scroll position for smart options
function calculateOptimalScrollPosition(
  textarea: HTMLTextAreaElement,
  smartOptions: any[],
  activeIdx: number | null = null
): { scrollTop: number; scrollLeft: number } {
  if (!smartOptions.length || activeIdx === null || activeIdx >= smartOptions.length) {
    return { scrollTop: textarea.scrollTop, scrollLeft: textarea.scrollLeft };
  }

  const activeOption = smartOptions[activeIdx];
  if (!activeOption) {
    return { scrollTop: textarea.scrollTop, scrollLeft: textarea.scrollLeft };
  }

  try {
    const coordinates = getCaretCoordinates(textarea, activeOption.start);
    
    const computedStyle = window.getComputedStyle(textarea);
    let lineHeight = parseInt(computedStyle.lineHeight);
    if (isNaN(lineHeight) || lineHeight < 1 || computedStyle.lineHeight === 'normal') {
      const fontSize = parseInt(computedStyle.fontSize) || 16;
      lineHeight = Math.ceil(fontSize * 1.2);
    }
    lineHeight = Math.max(lineHeight, 16);
    
    const padding = 20;
    const popupHeight = 120; // Estimated popup height
    
    const optionTop = coordinates.top;
    const optionBottom = optionTop + lineHeight;
    const popupBottom = optionBottom + popupHeight;
    
    const viewportTop = textarea.scrollTop;
    const viewportBottom = viewportTop + textarea.clientHeight;
    
    let newScrollTop = textarea.scrollTop;
    let newScrollLeft = textarea.scrollLeft;
    
    // Ensure the smart option line is visible with space below for popup
    if (popupBottom > viewportBottom - padding) {
      // Need to scroll down to fit popup below the line
      newScrollTop = Math.max(0, optionTop - (textarea.clientHeight - popupHeight - padding));
    } else if (optionTop < viewportTop + padding) {
      // Need to scroll up to show the line
      newScrollTop = Math.max(0, optionTop - padding);
    }
    
    const optionLeft = coordinates.left;
    const viewportLeft = textarea.scrollLeft;
    const viewportRight = viewportLeft + textarea.clientWidth;
    
    if (optionLeft < viewportLeft + padding) {
      newScrollLeft = Math.max(0, optionLeft - padding);
    } else if (optionLeft > viewportRight - padding) {
      newScrollLeft = optionLeft - textarea.clientWidth + padding;
    }
    
    return { scrollTop: newScrollTop, scrollLeft: newScrollLeft };
  } catch (error) {
    return { scrollTop: textarea.scrollTop, scrollLeft: textarea.scrollLeft };
  }
}

// Helper function to calculate geometry for smart phrase highlighting
function calculateSmartPhraseGeometry(
  textarea: HTMLTextAreaElement,
  smartOption: any
): { top: number; left: number; width: number; height: number } | null {
  try {
    if (!textarea || !smartOption || 
        typeof smartOption.start !== 'number' || 
        typeof smartOption.end !== 'number' ||
        smartOption.start < 0 || 
        smartOption.end > textarea.value.length ||
        smartOption.start >= smartOption.end) {
      return null;
    }

    const startCoords = getCaretCoordinates(textarea, smartOption.start);
    const endCoords = getCaretCoordinates(textarea, smartOption.end);
    
    const computedStyle = window.getComputedStyle(textarea);
    const paddingTop = parseInt(computedStyle.paddingTop) || 0;
    const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
    
    let lineHeight = parseInt(computedStyle.lineHeight);
    if (isNaN(lineHeight) || lineHeight < 1 || computedStyle.lineHeight === 'normal') {
      const fontSize = parseInt(computedStyle.fontSize) || 16;
      const fontFamily = computedStyle.fontFamily || '';
      let ratio = 1.2;
      if (fontFamily.includes('monospace') || fontFamily.includes('Courier')) {
        ratio = 1.15;
      } else if (fontFamily.includes('serif')) {
        ratio = 1.3;
      }
      lineHeight = Math.ceil(fontSize * ratio);
    }
    
    lineHeight = Math.max(lineHeight, 12);
    
    const width = endCoords.left - startCoords.left;
    
    const maxTop = textarea.scrollHeight - lineHeight;
    const clampedTop = Math.max(0, Math.min(startCoords.top, maxTop));
    
    return {
      top: clampedTop,
      left: startCoords.left + paddingLeft,
      width: Math.max(0, width),
      height: lineHeight
    };
  } catch (error) {
    return null;
  }
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
  onKeyDown: externalOnKeyDown,
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
  const [phraseHighlight, setPhraseHighlight] = useState<{top: number; left: number; width: number; height: number; text: string} | null>(null);
  
  const pendingCursorPosRef = useRef<number | null>(null);
  const shouldRestoreCaretRef = useRef<boolean>(false);
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
  const { language } = useLanguage();
  const previousValueRef = useRef<string>(value);

  useEffect(() => {
    if (onRef) {
      onRef(textareaRef);
    }
  }, [onRef]);

  const getCombinedDotPhrases = (): Record<string, string> => {
    const combined: Record<string, string> = { ...(dotPhrases as Record<string, string>) };
    customPhrases.forEach(phrase => {
      combined[phrase.trigger] = phrase.content;
    });
    return combined;
  };

  useEffect(() => {
    if (isCreationMode) {
      setSmartOptions([]);
      setActiveSmartIdx(null);
      return;
    }
    
    const options = parseSmartOptions(value);
    setSmartOptions(options);
    
    try {
      const widgetMatches = parseWidgetSyntax(value);
      const newWidgets = new Map<string, WidgetInstance>();
      
      widgetMatches.forEach(match => {
        try {
          const existingWidget = widgets.get(match.id);
          if (existingWidget) {
            newWidgets.set(match.id, existingWidget);
          } else {
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
      
      if (newWidgets.size !== widgets.size || 
          Array.from(newWidgets.keys()).some(id => !widgets.has(id))) {
        setWidgets(newWidgets);
      }
    } catch (error) {
      console.warn('Error parsing widget syntax:', error);
    }
    
    if (options.length > 0 && activeSmartIdx === null && !isCreationMode) {
      const hasOnlySmartFunctions = value.trim().match(/^\[\[.*\]\]$/) || 
                                   justExpandedToSmartOption.current;
      if (hasOnlySmartFunctions && !isCreationMode) {
        setActiveSmartIdx(0);
      }
    }
    
  }, [value, activeSmartIdx, isCreationMode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    pendingCursorPosRef.current = cursor;
    shouldRestoreCaretRef.current = true;
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const clampedPos = Math.max(0, Math.min(newValue.length, cursor));
        textareaRef.current.selectionStart = clampedPos;
        textareaRef.current.selectionEnd = clampedPos;
      }
    });
    setCurrentPosition(cursor);
    onChange(newValue);

    if (!isCreationMode) {
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
    } else {
      setShowSuggestions(false);
      setCurrentDot(null);
    }
  }, [onChange, value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (externalOnKeyDown) {
      externalOnKeyDown(e);
    }
    
    const cursor = e.currentTarget.selectionStart;
    setCurrentPosition(cursor);

    const lastFiveChars = value.substring(Math.max(0, cursor - 5), cursor);
    if (lastFiveChars === '/calc' && (e.key === 'Enter' || e.key === 'Tab')) {
      e.preventDefault();
      e.stopPropagation();
      
      setShowSuggestions(false);
      setCurrentDot(null);
      setSuggestions([]);
      
      const beforeCalc = value.substring(0, cursor - 5);
      const afterCalc = value.substring(cursor);
      const cleanValue = beforeCalc + afterCalc;
      onChange(cleanValue);
      
      setIsCalculationModalOpen(true);
      return;
    }

    if (showSuggestions && suggestions.length > 0 && !isCreationMode) {
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
          setShowSuggestions(false);
          setCurrentDot(null);
          setSuggestions([]);
          
          const beforeCalc = value.substring(0, cursor - 5);
          const afterCalc = value.substring(cursor);
          const cleanValue = beforeCalc + afterCalc;
          onChange(cleanValue);
          
          setIsCalculationModalOpen(true);
        } else {
          expandDotPhrase(selectedPhrase);
        }
      }
      return;
    }

    if (smartOptions.length > 0 && activeSmartIdx !== null && !isCreationMode) {
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
        setPhraseHighlight(null);
        return;
      }
    }
    
    if (e.key === 'Enter' && !showSuggestions && (smartOptions.length === 0 || activeSmartIdx === null)) {
      return;
    }
  }, [value, onChange, showSuggestions, suggestions, selectedSuggestion, smartOptions, activeSmartIdx, isCreationMode, externalOnKeyDown]);

  const expandDotPhrase = (dotKey: string) => {
    if (!currentDot) return;
    const combinedPhrases = getCombinedDotPhrases();
    const phrase = combinedPhrases[dotKey];
    if (!phrase) return;
    
    const before = value.slice(0, currentDot.start);
    const after = value.slice(currentDot.end);
    const expanded = before + phrase + after;
    
    let smartOpts: any[] = [];
    if (!isCreationMode) {
      smartOpts = parseSmartOptions(expanded);
      if (smartOpts.length > 0) {
        justExpandedToSmartOption.current = true;
      }
    }
    
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    onChange(expanded);
    setShowSuggestions(false);
    setCurrentDot(null);
    setSuggestions([]);
    setSelectedSuggestion(0);
    
    if (textareaRef.current) {
      let pos = (before + phrase).length;
      if (!isCreationMode && expanded.trim() === phrase.trim() && smartOpts.length === 1 && smartOpts[0].start === 0) {
        pos = 0;
      }
      textareaRef.current.focus();
      textareaRef.current.selectionStart = pos;
      textareaRef.current.selectionEnd = pos;
      
      let scrollPosition = { scrollTop: currentScrollTop, scrollLeft: currentScrollLeft };
      if (!isCreationMode && smartOpts.length > 0) {
        scrollPosition = calculateOptimalScrollPosition(textareaRef.current, smartOpts, 0);
      }
      
      textareaRef.current.scrollTop = scrollPosition.scrollTop;
      textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
      
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.scrollTop = scrollPosition.scrollTop;
          textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
        }
      });
    }
  };

  const handleSmartOptionSelect = (idx: number, optIdx: number) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    
    if (opt.isWidget && opt.widgetType) {
      setActiveWidgetModal({
        type: opt.widgetType,
        position: opt.start
      });
      setActiveSmartIdx(null);
      setPhraseHighlight(null);
      return;
    }
    
    const before = value.slice(0, opt.start);
    const after = value.slice(opt.end);
    const selected = opt.options[optIdx];
    
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    const newValue = before + selected + after;
    onChange(newValue);
    setPhraseHighlight(null);
    
    setShowSuggestions(false);
    setCurrentDot(null);
    setSuggestions([]);
    setSelectedSuggestion(0);
    
    if (textareaRef.current) {
      textareaRef.current.focus();
      
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const newOptions = parseSmartOptions(newValue);
          let scrollPosition = { scrollTop: currentScrollTop, scrollLeft: currentScrollLeft };
          
          if (newOptions.length > 0) {
            setActiveSmartIdx(0);
            scrollPosition = calculateOptimalScrollPosition(textareaRef.current, newOptions, 0);
            textareaRef.current.scrollTop = scrollPosition.scrollTop;
            textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
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

  const generateTextOutput = () => {
    let output = value;
    const widgetMatches = parseWidgetSyntax(value);
    
    widgetMatches.forEach(match => {
      const widget = widgets.get(match.id);
      if (widget) {
        const text = widgetRegistry.generateText(match.type, widget.data);
        output = output.replace(match.match, text);
      }
    });
    
    return output;
  };

  const handleCustomOptionSelect = (idx: number, customText: string) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = value.slice(0, opt.start);
    const after = value.slice(opt.end);
    
    const currentScrollTop = textareaRef.current?.scrollTop || 0;
    const currentScrollLeft = textareaRef.current?.scrollLeft || 0;
    
    const newValue = before + customText + after;
    onChange(newValue);
    setPhraseHighlight(null);
    
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

  const handleCancelOption = (idx: number) => {
    if (smartOptions.length === 0) return;
    const opt = smartOptions[idx];
    const before = value.slice(0, opt.start);
    const after = value.slice(opt.end);
    const newValue = before + after;
    onChange(newValue);
    setPhraseHighlight(null);
    
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

  const handleDropdownClick = (idx: number) => {
    setActiveSmartIdx(idx);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleSuggestionClick = (idx: number) => {
    const selectedPhrase = suggestions[idx];
    if (selectedPhrase === '/calc') {
      setShowSuggestions(false);
      setCurrentDot(null);
      setSuggestions([]);
      
      const beforeCalc = value.substring(0, currentPosition - 5);
      const afterCalc = value.substring(currentPosition);
      const cleanValue = beforeCalc + afterCalc;
      onChange(cleanValue);
      
      setIsCalculationModalOpen(true);
    } else {
      expandDotPhrase(selectedPhrase);
    }
  };

  const handleCalculationResult = useCallback((result: CalculationResult) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const beforeText = value.substring(0, currentPosition - 5);
    const afterText = value.substring(currentPosition);
    const resultValue = typeof result.value === 'number' ? result.value.toString() : result.value;
    const newValue = `${beforeText}${result.name}: ${resultValue} ${result.unit}${afterText}`;
    
    onChange(newValue);
    textarea.focus();
    
    const newPosition = beforeText.length + result.name.length + resultValue.length + result.unit.length + 3;
    setTimeout(() => {
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
    }, 0);
  }, [value, currentPosition, onChange]);

  const handleWidgetResult = useCallback((widgetData: Record<string, any>) => {
    if (!activeWidgetModal || !textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const widgetText = widgetRegistry.generateText(activeWidgetModal.type, widgetData, { language });
    
    const beforeWidget = value.substring(0, activeWidgetModal.position);
    const afterWidget = value.substring(activeWidgetModal.position);
    
    const widgetPlaceholderEnd = afterWidget.indexOf(']]') + 2;
    const afterWidgetClean = afterWidget.substring(widgetPlaceholderEnd);
    
    const newValue = beforeWidget + widgetText + afterWidgetClean;
    onChange(newValue);
    
    setActiveWidgetModal(null);
    textarea.focus();
    
    const newPosition = beforeWidget.length + widgetText.length;
    setTimeout(() => {
      textarea.selectionStart = newPosition;
      textarea.selectionEnd = newPosition;
      
      const remainingSmartOptions = parseSmartOptions(newValue);
      if (remainingSmartOptions.length > 0) {
        setSmartOptions(remainingSmartOptions);
        setActiveSmartIdx(0);
      }
    }, 0);
  }, [activeWidgetModal, value, onChange, language]);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const cursor = e.currentTarget.selectionStart;
    setCurrentPosition(cursor);
  };

  useEffect(() => {
    if (!isCalculationModalOpen) {
      setShowSuggestions(false);
      setCurrentDot(null);
      setSuggestions([]);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [isCalculationModalOpen]);

  const handleBlur = () => {
    setTimeout(() => {
      const shouldPreserveSuggestions = isCreationMode && (showSuggestions || currentDot);
      
      if (!dropdownMouseDownRef.current && !(activeSmartIdx !== null && smartOptions[activeSmartIdx] && smartOptions[activeSmartIdx].options?.includes('DATE') && calendarIsOpen)) {
        setActiveSmartIdx(null);
        setPhraseHighlight(null);
        
        if (!shouldPreserveSuggestions) {
          setShowSuggestions(false);
          setCurrentDot(null);
        }
      }
      dropdownMouseDownRef.current = false;
    }, 50);
  };

  // Helper function to calculate safe dropdown position
  const calculateDropdownPosition = (textarea: HTMLTextAreaElement, option: any) => {
    try {
      const caret = getCaretCoordinates(textarea, option.start);
      const rect = textarea.getBoundingClientRect();
      
      const computedStyle = window.getComputedStyle(textarea);
      let lineHeight = parseInt(computedStyle.lineHeight);
      if (isNaN(lineHeight) || lineHeight < 1 || computedStyle.lineHeight === 'normal') {
        const fontSize = parseInt(computedStyle.fontSize) || 16;
        lineHeight = Math.ceil(fontSize * 1.2);
      }
      lineHeight = Math.max(lineHeight, 16);
      
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingLeft = parseInt(computedStyle.paddingLeft) || 0;
      
      // Position popup below the line of text
      const baseTop = rect.top + caret.top - textarea.scrollTop + lineHeight + paddingTop + 4;
      const baseLeft = rect.left + caret.left - textarea.scrollLeft + paddingLeft;
      
      // Ensure popup stays within viewport bounds
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const popupWidth = 300; // Estimated popup width
      const popupHeight = 150; // Estimated popup height
      
      let safeTop = baseTop;
      let safeLeft = baseLeft;
      
      // Check if popup would go off the right edge
      if (baseLeft + popupWidth > viewportWidth - 20) {
        safeLeft = viewportWidth - popupWidth - 20;
      }
      
      // Check if popup would go off the left edge
      if (safeLeft < 20) {
        safeLeft = 20;
      }
      
      // Check if popup would go off the bottom edge
      if (baseTop + popupHeight > viewportHeight - 20) {
        // Position above the text line instead
        safeTop = rect.top + caret.top - textarea.scrollTop + paddingTop - popupHeight - 4;
      }
      
      // Check if popup would go off the top edge
      if (safeTop < 20) {
        safeTop = 20;
      }
      
      return { top: safeTop, left: safeLeft };
    } catch (error) {
      // Fallback to basic positioning
      const rect = textarea.getBoundingClientRect();
      return {
        top: rect.top + 30,
        left: rect.left + 10
      };
    }
  };

  useEffect(() => {
    if (activeSmartIdx !== null && textareaRef.current && smartOptions[activeSmartIdx]) {
      const opt = smartOptions[activeSmartIdx];
      const newPos = calculateDropdownPosition(textareaRef.current, opt);
      setDropdownPos(newPos);
    }
  }, [activeSmartIdx, smartOptions, value]);

  useEffect(() => {
    if (
      activeSmartIdx !== null &&
      smartOptions[activeSmartIdx] &&
      smartOptions[activeSmartIdx].options[0] === 'DATE'
    ) {
      setDateObj(null);
    }
  }, [activeSmartIdx, smartOptions]);

  useEffect(() => {
    if (justExpandedToSmartOption.current && smartOptions.length > 0 && !isCreationMode) {
      setActiveSmartIdx(0);
      justExpandedToSmartOption.current = false;
      
      if (textareaRef.current) {
        const scrollPosition = calculateOptimalScrollPosition(textareaRef.current, smartOptions, 0);
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.scrollTop = scrollPosition.scrollTop;
            textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
          }
        });
      }
    }
  }, [smartOptions, isCreationMode]);

  // Auto-scroll when smart option becomes active
  useEffect(() => {
    if (activeSmartIdx !== null && textareaRef.current && smartOptions[activeSmartIdx] && !isCreationMode) {
      const scrollPosition = calculateOptimalScrollPosition(textareaRef.current, smartOptions, activeSmartIdx);
      
      // Only scroll if position actually needs to change
      if (Math.abs(textareaRef.current.scrollTop - scrollPosition.scrollTop) > 5 || 
          Math.abs(textareaRef.current.scrollLeft - scrollPosition.scrollLeft) > 5) {
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.scrollTop = scrollPosition.scrollTop;
            textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
          }
        });
      }
    }
  }, [activeSmartIdx, smartOptions, isCreationMode]);

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
        const newIdx = (activeSmartIdx - 1 + smartOptions.length) % smartOptions.length;
        setActiveSmartIdx(newIdx);
        
        // Scroll to ensure new option is visible
        if (textareaRef.current) {
          const scrollPosition = calculateOptimalScrollPosition(textareaRef.current, smartOptions, newIdx);
          textareaRef.current.scrollTop = scrollPosition.scrollTop;
          textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const newIdx = (activeSmartIdx + 1) % smartOptions.length;
        setActiveSmartIdx(newIdx);
        
        // Scroll to ensure new option is visible
        if (textareaRef.current) {
          const scrollPosition = calculateOptimalScrollPosition(textareaRef.current, smartOptions, newIdx);
          textareaRef.current.scrollTop = scrollPosition.scrollTop;
          textareaRef.current.scrollLeft = scrollPosition.scrollLeft;
        }
      } else if (e.key === 'ArrowDown' && !isDate) {
        e.preventDefault();
        updateSmartOptionsIdx(activeSmartIdx, (selIdx + 1) % numOptions);
      } else if (e.key === 'ArrowUp' && !isDate) {
        e.preventDefault();
        updateSmartOptionsIdx(activeSmartIdx, (selIdx - 1 + numOptions) % numOptions);
      } else if ((e.key === 'Enter' || e.key === 'Tab') && !isCreationMode) {
        e.preventDefault();
        handleSmartOptionSelect(activeSmartIdx, selIdx);
      } else if (e.key === 'Escape') {
        setActiveSmartIdx(null);
        setCustomInputFocused(false);
        setPhraseHighlight(null);
      }
    };
    window.addEventListener('keydown', handleDropdownKeyDown);
    return () => window.removeEventListener('keydown', handleDropdownKeyDown);
  }, [activeSmartIdx, smartOptions, customInputFocused, customInput, isCreationMode]);

  function updateSmartOptionsIdx(idx: number, sel: number) {
    setSmartOptions(prev => prev.map((o, i) => i === idx ? { ...o, selectedIdx: sel } : o));
  }

  useEffect(() => {
    if (justExpandedToSmartOption.current && smartOptions.length > 0 && !isCreationMode) {
      setActiveSmartIdx(0);
      justExpandedToSmartOption.current = false;
    }
  }, [smartOptions, isCreationMode]);

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

  useEffect(() => {
    if (!textareaRef.current || isCreationMode || activeSmartIdx === null || !smartOptions[activeSmartIdx]) {
      setPhraseHighlight(null);
      return;
    }

    const smartOption = smartOptions[activeSmartIdx];
    if (!smartOption || typeof smartOption.start !== 'number' || typeof smartOption.end !== 'number') {
      setPhraseHighlight(null);
      return;
    }

    const geometry = calculateSmartPhraseGeometry(textareaRef.current, smartOption);
    if (geometry) {
      const text = value.slice(smartOption.start, smartOption.end);
      setPhraseHighlight({ ...geometry, text });
    } else {
      setPhraseHighlight(null);
    }
  }, [activeSmartIdx, smartOptions, isCreationMode, value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || isCreationMode) return;

    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      
      scrollTimeout = setTimeout(() => {
        if (activeSmartIdx !== null && smartOptions[activeSmartIdx]) {
          const geometry = calculateSmartPhraseGeometry(textarea, smartOptions[activeSmartIdx]);
          if (geometry) {
            const text = value.slice(smartOptions[activeSmartIdx].start, smartOptions[activeSmartIdx].end);
            setPhraseHighlight({ ...geometry, text });
          } else {
            setPhraseHighlight(null);
          }
        }
      }, 10);
    };

    const handleResize = () => {
      if (activeSmartIdx !== null && smartOptions[activeSmartIdx]) {
        const geometry = calculateSmartPhraseGeometry(textarea, smartOptions[activeSmartIdx]);
        if (geometry) {
          const text = value.slice(smartOptions[activeSmartIdx].start, smartOptions[activeSmartIdx].end);
          setPhraseHighlight({ ...geometry, text });
        } else {
          setPhraseHighlight(null);
        }
      }
    };

    textarea.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (textarea) {
        textarea.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [activeSmartIdx, smartOptions, isCreationMode, value]);

  useEffect(() => {
    return () => {
      setPhraseHighlight(null);
    };
  }, []);

  const handleTextareaClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (isCreationMode) return;
    
    const textarea = e.currentTarget;
    const cursor = textarea.selectionStart;
    
    if (!isCreationMode) {
      smartOptions.forEach((option, index) => {
        if (cursor >= option.start && cursor <= option.end) {
          setActiveSmartIdx(index);
        }
      });
    }

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
        setPhraseHighlight(null);
        break;
      }
    }
  };

  const renderTextarea = () => (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onBlur={handleBlur}
        onClick={handleTextareaClick}
        placeholder={placeholder}
        className={`px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 relative z-10 bg-transparent ${className}`}
        rows={rows}
        style={{
          resize: 'vertical',
        }}
      />
      {phraseHighlight && (
        <>
          {/* Main highlight background */}
          <div
            className="absolute pointer-events-none rounded-sm"
            style={{
              top: `${phraseHighlight.top}px`,
              left: `${phraseHighlight.left - 2}px`,
              width: `${phraseHighlight.width + 4}px`,
              height: `${phraseHighlight.height}px`,
              background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(236, 72, 153, 0.15) 100%)',
              zIndex: 5
            }}
            role="presentation"
            aria-hidden="true"
          />
          {/* Animated border */}
          <div
            className="absolute pointer-events-none rounded-sm animate-pulse"
            style={{
              top: `${phraseHighlight.top - 1}px`,
              left: `${phraseHighlight.left - 3}px`,
              width: `${phraseHighlight.width + 6}px`,
              height: `${phraseHighlight.height + 2}px`,
              border: '2px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '4px',
              zIndex: 4
            }}
            role="presentation"
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );

  useLayoutEffect(() => {
    if (previousValueRef.current === value) return;
    previousValueRef.current = value;

    if (!shouldRestoreCaretRef.current) return;

    if (showSuggestions || activeSmartIdx !== null || calendarIsOpen) {
      shouldRestoreCaretRef.current = false;
      return;
    }

    if (textareaRef.current && pendingCursorPosRef.current !== null) {
      const pos = pendingCursorPosRef.current;
      const clampedPos = Math.max(0, Math.min(value.length, pos));
      textareaRef.current.selectionStart = clampedPos;
      textareaRef.current.selectionEnd = clampedPos;
    }

    shouldRestoreCaretRef.current = false;
  }, [value, showSuggestions, activeSmartIdx, calendarIsOpen]);

  return (
    <div className="relative">
      {renderTextarea()}
      
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
      
      {activeSmartIdx !== null && smartOptions[activeSmartIdx] && smartOptions[activeSmartIdx].options.includes('DATE') && !isCreationMode && (
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
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
            <div className="text-xs text-gray-600 text-center font-medium">
              Smart Option {activeSmartIdx + 1}/{smartOptions.length}
            </div>
          </div>
          {(activeSmartIdx !== null && smartOptions[activeSmartIdx]?.options?.includes('DATE')) && (
            <div className="p-3">
              <div className="text-sm font-medium text-gray-700 mb-2">Select Date:</div>
              <DatePicker
                selected={dateObj}
                onChange={(date) => {
                  setDateObj(date);
                  if (date && activeSmartIdx !== null) {
                    const formattedDate = date.toLocaleDateString();
                    const before = value.slice(0, smartOptions[activeSmartIdx].start);
                    const after = value.slice(smartOptions[activeSmartIdx].end);
                    const newValue = before + formattedDate + after;
                    onChange(newValue);
                    setPhraseHighlight(null);
                    
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

      {activeSmartIdx !== null && smartOptions[activeSmartIdx] && !smartOptions[activeSmartIdx].options.includes('DATE') && !isCreationMode && (() => {
        const opt = smartOptions[activeSmartIdx];
        
        const calculateSafePosition = () => {
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;
          
          const popupWidth = 350;
          const popupHeight = 80;
          
          let safeLeft = dropdownPos.left;
          if (dropdownPos.left + popupWidth > viewportWidth - 20) {
            safeLeft = viewportWidth - popupWidth - 20;
          }
          if (safeLeft < 20) {
            safeLeft = 20;
          }
          
          let safeTop = dropdownPos.top;
          if (dropdownPos.top + popupHeight > viewportHeight - 20) {
            safeTop = viewportHeight - popupHeight - 20;
          }
          if (safeTop < 20) {
            safeTop = 20;
          }
          
          return { top: safeTop, left: safeLeft };
        };
        
        const safePos = calculateSafePosition();
        
        return (
          <div
            className="fixed z-50 bg-white border border-blue-200 rounded-lg shadow-lg px-3 py-2"
            style={{
              top: safePos.top,
              left: safePos.left,
              minWidth: 200,
              maxWidth: 400,
            }}
            onPointerDown={() => { dropdownMouseDownRef.current = true; }}
            onPointerUp={() => { dropdownMouseDownRef.current = false; }}
            onMouseDown={() => { dropdownMouseDownRef.current = true; }}
            onMouseUp={() => { dropdownMouseDownRef.current = false; }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 font-medium">
                Smart Option {activeSmartIdx + 1}/{smartOptions.length}
              </span>
              <div className="flex items-center gap-1">
                {smartOptions.length > 1 && (
                  <>
                    <button
                      className="px-1 py-0.5 text-xs rounded bg-gray-100 hover:bg-gray-200"
                      onMouseDown={e => {
                        e.preventDefault();
                        const newIdx = (activeSmartIdx - 1 + smartOptions.length) % smartOptions.length;
                        setActiveSmartIdx(newIdx);
                        
                        // Auto-scroll will be handled by the useEffect
                      }}
                      title="Previous option"
                    >
                      ←
                    </button>
                    <button
                      className="px-1 py-0.5 text-xs rounded bg-gray-100 hover:bg-gray-200"
                      onMouseDown={e => {
                        e.preventDefault();
                        const newIdx = (activeSmartIdx + 1) % smartOptions.length;
                        setActiveSmartIdx(newIdx);
                        
                        // Auto-scroll will be handled by the useEffect
                      }}
                      title="Next option"
                    >
                      →
                    </button>
                  </>
                )}
                <button
                  className="px-1 py-0.5 text-xs rounded bg-red-100 hover:bg-red-200 text-red-600"
                  onMouseDown={e => {
                    e.preventDefault();
                    handleCancelOption(activeSmartIdx);
                  }}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
            
            {opt.isWidget ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {opt.widgetType?.charAt(0).toUpperCase()}{opt.widgetType?.slice(1)} Widget
                </span>
                <button
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  onMouseDown={e => {
                    e.preventDefault();
                    setActiveWidgetModal({ type: opt.widgetType!, position: opt.start });
                    setActiveSmartIdx(null);
                    setPhraseHighlight(null);
                  }}
                >
                  Open
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {opt.options.map((option: string, idx: number) => (
                    <button
                      key={option + idx}
                      className={`px-2 py-1 rounded text-xs font-mono border ${
                        opt.selectedIdx === idx 
                          ? 'bg-green-100 border-green-400 text-green-800' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-green-50'
                      }`}
                      onMouseDown={e => {
                        e.preventDefault();
                        handleSmartOptionSelect(activeSmartIdx, idx);
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    ref={customInputRef}
                    type="text"
                    className="flex-1 border px-2 py-1 rounded text-xs"
                    placeholder="Other..."
                    value={customInput}
                    onChange={e => setCustomInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customInput.trim()) {
                        e.preventDefault();
                        handleCustomOptionSelect(activeSmartIdx, customInput.trim());
                        setCustomInput("");
                      }
                    }}
                  />
                  <button
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
                    disabled={!customInput.trim()}
                    onMouseDown={e => {
                      e.preventDefault();
                      if (customInput.trim()) {
                        handleCustomOptionSelect(activeSmartIdx, customInput.trim());
                        setCustomInput("");
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
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