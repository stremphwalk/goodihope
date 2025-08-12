import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { dotPhrases } from '@/lib/dotPhrases';
import type { CustomDotPhrase } from '@/components/DotPhraseManager';
import { useDotPhrases } from '@/hooks/useDotPhrases';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalculationModal } from './CalculationModal';
import getCaretCoordinates from 'textarea-caret';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartTextEditorProps {
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

// Regex to match smart options like [[option1|option2|option3]]
const SMART_OPTION_RE = /\[\[([^\]]+?)\]\]/g;

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

// Helper to parse smart options and generate pill HTML
function parseSmartOptions(text: string) {
  const regex = /\[\[([^\]]+?)\]\]/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text))) {
    const options = match[1].split('|');
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      fullMatch: match[0],
      options: options.map(opt => opt.trim()),
      rawOptions: match[1]
    });
  }
  return matches;
}

// Helper to convert smart options to inline pills
function renderSmartOptionsAsPills(line: string, lineIdx: number) {
  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\u00A0/g, "&nbsp;");

  const smartMatches = parseSmartOptions(line);
  console.log('🔍 Processing line', lineIdx, 'with', smartMatches.length, 'smart matches:', smartMatches);
  
  if (smartMatches.length === 0) {
    return escape(line);
  }
  
  // Process matches from end to beginning to avoid offset issues
  let result = line;
  for (let i = smartMatches.length - 1; i >= 0; i--) {
    const match = smartMatches[i];
    const matchIdx = i;
    
    // Generate pill HTML for each option
    const pillsHtml = match.options.map((option, optIdx) => 
      `<span class="smart-pill" 
             data-line="${lineIdx}" 
             data-match="${matchIdx}"
             data-option="${optIdx}"
             data-option-text="${option.replace(/"/g, '&quot;')}"
             title="Click to select: ${option.replace(/"/g, '&quot;')}">${escape(option)}</span>`
    ).join(' ');
    
    console.log('💊 Generated pills HTML for match', i, ':', pillsHtml);
    
    // Replace [[option1|option2]] with individual pills
    const before = result.slice(0, match.start);
    const after = result.slice(match.end);
    result = before + pillsHtml + after;
  }
  
  // Escape the non-pill parts
  result = result.replace(/([^<>]+)(?=<|$)/g, (match) => {
    return match.includes('class="smart-pill"') ? match : escape(match);
  });
  
  console.log('📝 Final line result:', result);
  return result;
}

export function SmartTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  rows = 4,
  disabled = false,
  onRef,
  isCreationMode = false,
  onBlur,
  onKeyDown
}: SmartTextEditorProps) {
  const [activeToken, setActiveToken] = useState<{
    start: number;
    end: number;
    options: string[];
    rect?: DOMRect;
  } | null>(null);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentSlashPhrase, setCurrentSlashPhrase] = useState<{
    phrase: string;
    start: number;
    end: number;
  } | null>(null);
  const [caretCoordinates, setCaretCoordinates] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState<any>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const auth = useAuth();
  const { language } = useLanguage();
  const { data: customDotPhrases = [] } = useDotPhrases();

  // Combine built-in and custom dot phrases
  const allDotPhrases = useMemo(() => {
    const custom = customDotPhrases.reduce((acc: Record<string, string>, phrase: CustomDotPhrase) => {
      acc[phrase.trigger] = phrase.content;
      return acc;
    }, {} as Record<string, string>);
    return { ...dotPhrases, ...custom };
  }, [customDotPhrases]);

  // Split text into lines and mark which lines contain smart options
  const lines = useMemo(() => {
    return value.split(/\n/).map((line, idx) => {
      const smartMatches = parseSmartOptions(line);
      return { 
        idx, 
        text: line, 
        smartMatches,
        hasSmart: smartMatches.length > 0 
      };
    });
  }, [value]);

  // Build HTML for mirror with per-line highlighting and clickable smart pills
  const mirrorHtml = useMemo(() => {
    const escape = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\u00A0/g, "&nbsp;");

    return lines
      .map((line) => {
        if (!line.hasSmart) {
          return `<div class="line"><span class="x">${escape(line.text) || "&nbsp;"}</span></div>`;
        }
        
        // Use the pill rendering system (apply escape AFTER pill generation)
        const pillHtml = renderSmartOptionsAsPills(line.text, line.idx);
         return `<div class="line highlight"><span class="x">${pillHtml || "&nbsp;"}</span></div>`;
      })
      .join("");
  }, [lines]);

  // Position popup near the clicked smart token
  useEffect(() => {
    if (!activeToken || !mirrorRef.current || !wrapperRef.current) return;
    const tokenEls = mirrorRef.current.querySelectorAll(
      ".smart-token.active"
    );
    const el = tokenEls[0] as HTMLElement | undefined;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const rootRect = wrapperRef.current.getBoundingClientRect();
    setActiveToken((prev) => (prev ? { ...prev, rect: new DOMRect(rect.x, rect.y - 8, rect.width, rect.height) } : prev));
  }, [activeToken?.start, mirrorHtml]);

  // Click handling in the mirror for smart pills
  const onMirrorClick: React.MouseEventHandler = (e) => {
    const target = e.target as HTMLElement;
    console.log('🖱️ Mirror clicked:', target, 'classes:', Array.from(target.classList));
    
    if (!target.classList.contains("smart-pill")) {
      textareaRef.current?.focus();
      return;
    }

    handlePillElementSelection(target);
  };

  function handlePillElementSelection(target: HTMLElement) {
    console.log('💊 Smart pill clicked!');

    const lineIdx = Number(target.getAttribute("data-line"));
    const matchIdx = Number(target.getAttribute("data-match"));
    const optionText = target.getAttribute("data-option-text");
    
    console.log('📍 Pill details:', {
      lineIdx,
      matchIdx,
      optionText,
      line: lines[lineIdx]?.text
    });

    if (!optionText || lineIdx === undefined || matchIdx === undefined) {
      console.log('❌ Missing pill data');
      return;
    }

    const line = lines[lineIdx];
    if (!line || !line.smartMatches[matchIdx]) {
      console.log('❌ Missing line or match data');
      return;
    }

    const match = line.smartMatches[matchIdx];
    
    // Calculate absolute position in full text
    const absoluteStart = lines.slice(0, lineIdx).reduce((acc, l) => acc + l.text.length + 1, 0) + match.start;
    const absoluteEnd = absoluteStart + match.fullMatch.length;
    
    // Replace the smart option with selected text
    const before = value.slice(0, absoluteStart);
    const after = value.slice(absoluteEnd);
    const newValue = before + optionText + after;
    
    console.log('🔄 Replacing smart option:', {
      before: before.length,
      after: after.length,
      option: optionText,
      oldMatch: match.fullMatch,
      newLength: newValue.length
    });
    
    onChange(newValue);
    console.log('✅ Smart pill replaced successfully');
  }

  // Replace the active token with selected option
  const chooseOption = (opt: string) => {
    console.log('🎯 Option chosen:', opt, 'activeToken:', activeToken);
    if (!activeToken) return;
    
    const before = value.slice(0, activeToken.start);
    const after = value.slice(activeToken.end);
    const next = before + opt + after;
    
    console.log('🔄 Replacing smart option:', {
      before: before.length,
      after: after.length,
      option: opt,
      newLength: next.length
    });
    
    onChange(next);
    setActiveToken(null);
    
    // Remove active class from mirror
    mirrorRef.current?.querySelectorAll(".smart-token.active").forEach((el) =>
      el.classList.remove("active")
    );
    
    console.log('✅ Smart option replaced successfully');
  };

  // Handle dot phrase expansion with slash syntax
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (onKeyDown) {
      onKeyDown(e);
    }

    const textarea = e.currentTarget;
    const cursor = textarea.selectionStart;
    
    if (e.key === ' ' || e.key === 'Tab') {
      const slashPhrase = getSlashPhraseAtCursor(value, cursor);
      console.log('Dot phrase debug:', {
        key: e.key,
        cursor,
        slashPhrase,
        valueAtCursor: value.slice(Math.max(0, cursor - 20), cursor + 5),
        allDotPhrases: Object.keys(allDotPhrases),
        hasPhrase: slashPhrase ? (allDotPhrases as any)[slashPhrase.phrase] : null
      });
      if (slashPhrase && (allDotPhrases as any)[slashPhrase.phrase]) {
        console.log('✅ EXPANDING phrase:', slashPhrase.phrase, 'to:', (allDotPhrases as any)[slashPhrase.phrase]);
        e.preventDefault();
        const beforeSlash = value.slice(0, slashPhrase.start);
        const afterCursor = value.slice(cursor);
        let expansion = (allDotPhrases as any)[slashPhrase.phrase];
        
        // Handle special cases
        if (slashPhrase.phrase === '/calc') {
          setShowCalculationModal(true);
          return;
        }
        
        if (slashPhrase.phrase === '/date') {
          setShowDatePicker(true);
          return;
        }
        
        // Handle widgets - simplified for now
        if (expansion.includes('WIDGET:')) {
          // For now, just insert the expansion as-is
          // Future enhancement: proper widget handling
        }
        
        const newValue = beforeSlash + expansion + afterCursor;
        onChange(newValue);
        
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursor = beforeSlash.length + expansion.length;
            textareaRef.current.selectionStart = newCursor;
            textareaRef.current.selectionEnd = newCursor;
            textareaRef.current.focus();
          }
        }, 0);
      }
    }
    
    // Handle slash phrase suggestions
    if (e.key === '/' && cursor >= 0) {
      console.log('Slash key pressed, showing suggestions');
      setTimeout(() => {
        const coords = getCaretCoordinates(textarea, cursor + 1);
        console.log('Caret coordinates:', coords);
        // Adjust coordinates for the container padding and scrolling
        setCaretCoordinates({ 
          top: coords.top + 12, // Account for padding
          left: coords.left + 12 // Account for padding
        });
        setCurrentSlashPhrase({ phrase: '/', start: cursor, end: cursor + 1 });
        setShowSuggestions(true);
        console.log('Suggestions should be showing now');
      }, 0);
    } else if (showSuggestions) {
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursor = textareaRef.current.selectionStart;
          const slashPhrase = getSlashPhraseAtCursor(value, newCursor);
          if (slashPhrase) {
            setCurrentSlashPhrase(slashPhrase);
            const coords = getCaretCoordinates(textareaRef.current, newCursor);
            // Adjust coordinates for the container padding and scrolling
            setCaretCoordinates({ 
              top: coords.top + 12, // Account for padding
              left: coords.left + 12 // Account for padding
            });
          } else {
            setShowSuggestions(false);
            setCurrentSlashPhrase(null);
          }
        }
      }, 0);
    }
  }, [value, onChange, allDotPhrases, showSuggestions, onKeyDown]);

  // Get filtered suggestions based on current slash phrase
  const suggestions = useMemo(() => {
    if (!currentSlashPhrase || !showSuggestions) return [];
    const filtered = Object.keys(allDotPhrases).filter(key =>
      key.toLowerCase().includes(currentSlashPhrase.phrase.toLowerCase())
    ).slice(0, 8);
    console.log('Suggestions computed:', {
      currentSlashPhrase,
      showSuggestions,
      allKeys: Object.keys(allDotPhrases),
      filtered
    });
    return filtered;
  }, [currentSlashPhrase, showSuggestions, allDotPhrases]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    console.log('🎯 Suggestion clicked:', suggestion);
    console.log('Current state:', {
      currentSlashPhrase,
      value: value.length,
      suggestion,
      expansion: (allDotPhrases as any)[suggestion]
    });
    
    if (!currentSlashPhrase) {
      console.log('❌ No current slash phrase, returning');
      return;
    }
    
    const before = value.slice(0, currentSlashPhrase.start);
    const after = value.slice(currentSlashPhrase.end);
    let expansion = (allDotPhrases as any)[suggestion];
    
    console.log('🔧 Building new value:', {
      before: before.length,
      after: after.length,
      expansion: expansion?.length,
      currentSlashPhrase
    });
    
    // Handle special cases
    if (suggestion === '/calc') {
      setShowSuggestions(false);
      setShowCalculationModal(true);
      return;
    }
    
    if (suggestion === '/date') {
      setShowSuggestions(false);
      setShowDatePicker(true);
      return;
    }
    
    // Handle widgets - simplified for now
    if (expansion.includes('WIDGET:')) {
      // For now, just insert the expansion as-is
      // Future enhancement: proper widget handling
    }
    
    const newValue = before + expansion + after;
    console.log('📝 Calling onChange with new value length:', newValue.length);
    onChange(newValue);
    setShowSuggestions(false);
    setCurrentSlashPhrase(null);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursor = before.length + expansion.length;
        console.log('🎯 Setting cursor to position:', newCursor);
        textareaRef.current.selectionStart = newCursor;
        textareaRef.current.selectionEnd = newCursor;
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Ensure copying is always plain text
  const onCopy: React.ClipboardEventHandler<HTMLTextAreaElement> = (e) => {
    e.preventDefault();
    e.clipboardData.setData("text/plain", value);
  };

  // Handle copy button click
  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  // Fixed height - no autosize to allow proper scrolling
  useEffect(() => {
    const ta = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!ta || !mirror) return;
    
    // Check if we should use CSS-driven height instead of JS-driven height
    const hasExplicitHeight = className?.includes('min-h-') || className?.includes('h-full') || className?.includes('h-screen');
    
    if (hasExplicitHeight) {
      // Let CSS control the height completely
      ta.style.height = '';
      mirror.style.height = '';
      ta.style.minHeight = '';
      mirror.style.minHeight = '';
    } else {
      // Use JS-controlled height for compatibility with existing usage
      const lineHeight = 1.35; // matches the CSS line-height
      const fontSize = 14; // matches the CSS font-size
      const padding = 20; // 10px top + 10px bottom
      const fixedHeight = Math.max(rows * fontSize * lineHeight + padding, 200);
      
      ta.style.height = `${fixedHeight}px`;
      mirror.style.height = `${fixedHeight}px`;
    }
  }, [rows, className]);

  // Forward ref if provided
  useEffect(() => {
    if (onRef && textareaRef.current) {
      onRef(textareaRef);
    }
  }, [onRef]);

  return (
    <>
      <div
        ref={wrapperRef}
        className={`relative rounded-xl shadow-sm border border-slate-200 bg-white flex flex-col ${className}`}
      >
        {/* Top bar for context info */}
        <div className="flex-shrink-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_1px_rgba(16,185,129,0.6)]" />
            <span className="text-slate-600">
              Smart phrases active • Type <code className="px-1 py-0.5 bg-slate-100 rounded">/phrase</code> + space
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyClick}
            className="h-6 px-2 text-slate-600 hover:text-slate-800"
            title="Copy plain text"
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>

        {/* Content wrapper for scrolling */}
                 <div 
           className="relative flex-1 overflow-hidden"
           onMouseDown={(e) => {
             // Temporarily disable textarea pointer events to detect pills beneath
             const ta = textareaRef.current;
             if (!ta) return;
             const prev = ta.style.pointerEvents;
             ta.style.pointerEvents = 'none';
             const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
             // Restore immediately
             ta.style.pointerEvents = prev;

             if (el && el.classList && el.classList.contains('smart-pill')) {
               e.preventDefault();
               e.stopPropagation();
               handlePillElementSelection(el);
             }
           }}
         >
          {/* Mirror layer (shows styled text) */}
                    <pre
             ref={mirrorRef}
             className="mirror relative whitespace-pre-wrap break-words select-none h-full overflow-auto"
             style={{
               fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
               fontSize: '14px',
               lineHeight: '1.35',
               padding: '10px',
               color: '#334155',
               margin: 0,
               zIndex: 10,
               pointerEvents: 'auto'
             }}
             onClick={onMirrorClick}
             onMouseDown={(e) => {
               const target = e.target as HTMLElement;
               if (target.classList.contains('smart-pill')) {
                 e.preventDefault();
               }
             }}
             dangerouslySetInnerHTML={{ __html: mirrorHtml }}
           />

          {/* Textarea layer (actual editable text) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onCopy={onCopy}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              setShowSuggestions(false);
              if (onBlur) onBlur();
            }}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            spellCheck={false}
                         className="editor absolute inset-0 w-full h-full resize-none outline-none bg-transparent text-transparent overflow-auto"
             style={{
               fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
               fontSize: '14px',
               lineHeight: '1.35',
               padding: '10px',
               caretColor: '#334155',
               margin: 0,
               zIndex: 20
             }}
          />
        </div>


        {/* Dot phrase suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="fixed z-[9999] bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg shadow-2xl max-h-48 overflow-y-auto"
            style={{
              left: Math.max(8, caretCoordinates.left + (wrapperRef.current?.getBoundingClientRect().left || 0)) + "px",
              top: Math.max(8, caretCoordinates.top + (wrapperRef.current?.getBoundingClientRect().top || 0) + 20) + "px",
              minWidth: "200px",
            }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent blur
                  console.log('🖱️ Mouse down on suggestion:', suggestion);
                  handleSuggestionClick(suggestion);
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🖱️ Click on suggestion:', suggestion);
                  handleSuggestionClick(suggestion);
                }}
              >
                <span className="font-mono text-blue-600">{suggestion}</span>
                <div className="text-xs text-slate-500 mt-1 truncate">
                  {((allDotPhrases as any)[suggestion] || '').substring(0, 60)}...
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <DatePicker
              selected={new Date()}
              onChange={(date) => {
                if (date && currentSlashPhrase) {
                  const before = value.slice(0, currentSlashPhrase.start);
                  const after = value.slice(currentSlashPhrase.end);
                  const formattedDate = date.toLocaleDateString();
                  onChange(before + formattedDate + after);
                }
                setShowDatePicker(false);
              }}
              inline
            />
            <button
              onClick={() => setShowDatePicker(false)}
              className="mt-2 px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calculation Modal */}
      {showCalculationModal && (
        <CalculationModal
          isOpen={showCalculationModal}
          onClose={() => setShowCalculationModal(false)}
          onResult={() => setShowCalculationModal(false)}
        />
      )}

      {/* Widget Modal - simplified for now */}
      {showWidgetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <p>Widget functionality coming soon!</p>
            <button
              onClick={() => setShowWidgetModal(null)}
              className="mt-2 px-4 py-2 bg-gray-200 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Styles */}
             <style>{`
                   .mirror { position: relative; z-index: 10; pointer-events: auto; }
          .editor { z-index: 20; }
          .line { position: relative; padding: 0; margin: 0; border-radius: 0.5rem; }
          .line .x { display: inline; padding: 0 0.125rem; }
          .line.highlight {
            background: linear-gradient(90deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06));
            box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.04) inset, 0 4px 12px rgba(16,185,129,0.06);
            border-left: 4px solid rgba(16,185,129,0.4);
            padding-left: 0.25rem;
            margin: 0.05rem 0;
          }
         .line.highlight::after {
           content: "";
           position: absolute; 
           inset: 0; 
           pointer-events: none;
           background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.4) 20%, transparent 40%);
           opacity: 0.12; 
           transform: translateX(-150%);
           animation: shimmer 3s ease-in-out infinite;
           border-radius: inherit;
         }
         @keyframes shimmer { 
           0% { transform: translateX(-150%); } 
           60% { transform: translateX(150%);} 
           100% { transform: translateX(150%);} 
         }
 
         .smart-pill { 
           display: inline-block;
           padding: 0.25rem 0.5rem;
           margin: 0.125rem;
           border-radius: 0.5rem;
           font-size: 0.875rem;
           font-weight: 500;
           cursor: pointer;
           transition: all 0.2s ease;
           border: 2px solid rgba(59,130,246,0.3);
           background: linear-gradient(135deg, rgba(59,130,246,0.1), rgba(99,102,241,0.1));
           color: #1e40af;
           position: relative;
           pointer-events: auto;
           z-index: 1;
         }
         .smart-pill:hover {
           border-color: rgba(59,130,246,0.5);
           background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
           transform: translateY(-1px);
           box-shadow: 0 4px 8px rgba(59,130,246,0.15);
         }
         .smart-pill:active {
           transform: translateY(0);
           box-shadow: 0 2px 4px rgba(59,130,246,0.2);
         }
       `}</style>
    </>
  );
}