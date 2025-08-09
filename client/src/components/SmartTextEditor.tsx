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
      fullMatch: match[0],
      options: options.map(opt => opt.trim()),
      rawOptions: match[1]
    });
  }
  return matches;
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
      const tokens: { start: number; end: number; value: string; options: string[] }[] = [];
      let m: RegExpExecArray | null;
      const re = new RegExp(SMART_OPTION_RE);
      while ((m = re.exec(line))) {
        const options = m[1].split('|').map(opt => opt.trim());
        tokens.push({ 
          start: m.index, 
          end: m.index + m[0].length, 
          value: m[0],
          options
        });
      }
      return { idx, text: line, tokens, hasSmart: tokens.length > 0 };
    });
  }, [value]);

  // Build HTML for mirror with per-line highlighting and clickable smart tokens
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
          return `<div class="line">${escape(line.text) || "&nbsp;"}</div>`;
        }
        // Insert spans for tokens
        let out = "";
        let pos = 0;
        line.tokens.forEach((t, i) => {
          const before = line.text.slice(pos, t.start);
          out += escape(before);
          out += `<span class="smart-token" data-line="${line.idx}" data-token-idx="${i}">${escape(
            line.text.slice(t.start, t.end)
          )}</span>`;
          pos = t.end;
        });
        out += escape(line.text.slice(pos));
        return `<div class="line highlight">${out || "&nbsp;"}</div>`;
      })
      .join("\n");
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

  // Click handling in the mirror for smart tokens
  const onMirrorClick: React.MouseEventHandler = (e) => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains("smart-token")) return;

    // Remove previous active classes
    mirrorRef.current?.querySelectorAll(".smart-token.active").forEach((el) =>
      el.classList.remove("active")
    );

    target.classList.add("active");

    // Compute token absolute start/end within full text
    const lineIdx = Number(target.getAttribute("data-line"));
    const tokenIdx = Number(target.getAttribute("data-token-idx"));
    const line = lines[lineIdx];
    const token = line.tokens[tokenIdx];

    const absoluteStart =
      lines.slice(0, lineIdx).reduce((acc, l) => acc + l.text.length + 1, 0) +
      token.start;
    const absoluteEnd = absoluteStart + token.value.length;

    setActiveToken({ 
      start: absoluteStart, 
      end: absoluteEnd, 
      options: token.options 
    });
  };

  // Replace the active token with selected option
  const chooseOption = (opt: string) => {
    if (!activeToken) return;
    const before = value.slice(0, activeToken.start);
    const after = value.slice(activeToken.end);
    const next = before + opt + after;
    onChange(next);
    setActiveToken(null);
    
    // Remove active class from mirror
    mirrorRef.current?.querySelectorAll(".smart-token.active").forEach((el) =>
      el.classList.remove("active")
    );
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
      if (slashPhrase && (allDotPhrases as any)[slashPhrase.phrase]) {
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
      setTimeout(() => {
        const coords = getCaretCoordinates(textarea, cursor + 1);
        setCaretCoordinates({ top: coords.top, left: coords.left });
        setCurrentSlashPhrase({ phrase: '/', start: cursor, end: cursor + 1 });
        setShowSuggestions(true);
      }, 0);
    } else if (showSuggestions) {
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursor = textareaRef.current.selectionStart;
          const slashPhrase = getSlashPhraseAtCursor(value, newCursor);
          if (slashPhrase) {
            setCurrentSlashPhrase(slashPhrase);
            const coords = getCaretCoordinates(textareaRef.current, newCursor);
            setCaretCoordinates({ top: coords.top, left: coords.left });
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
    return Object.keys(allDotPhrases).filter(key =>
      key.toLowerCase().includes(currentSlashPhrase.phrase.toLowerCase())
    ).slice(0, 8);
  }, [currentSlashPhrase, showSuggestions, allDotPhrases]);

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    if (!currentSlashPhrase) return;
    
    const before = value.slice(0, currentSlashPhrase.start);
    const after = value.slice(currentSlashPhrase.end);
    let expansion = (allDotPhrases as any)[suggestion];
    
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
    onChange(newValue);
    setShowSuggestions(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursor = before.length + expansion.length;
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

  // Autosize textarea to content height
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.max(ta.scrollHeight, rows * 24) + "px";
  }, [value, rows]);

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
        className={`relative rounded-xl shadow-sm overflow-hidden border border-slate-200 bg-white ${className}`}
      >
        {/* Top bar for context info */}
        <div className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 bg-white/90 border-b border-slate-200 px-3 py-1.5 flex items-center justify-between text-xs">
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

        {/* Mirror layer (shows styled text) */}
        <pre
          ref={mirrorRef}
          className="mirror pointer-events-auto relative p-3 text-slate-900 text-sm leading-5 whitespace-pre-wrap break-words select-none"
          onClick={onMirrorClick}
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
          className="editor absolute inset-0 w-full h-full resize-none outline-none p-3 pt-10 bg-transparent text-transparent caret-slate-900 leading-5 text-sm font-normal"
        />

        {/* Popup for smart option selection */}
        {activeToken?.rect && (
          <div
            className="absolute z-30"
            style={{
              left: Math.max(8, (activeToken.rect.x - (wrapperRef.current?.getBoundingClientRect().x || 0))) + "px",
              top: Math.max(8, (activeToken.rect.y - (wrapperRef.current?.getBoundingClientRect().y || 0)) - 40) + "px",
            }}
          >
            <div className="rounded-xl shadow-xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-3 py-2 text-xs text-slate-600 border-b border-slate-100">Choose an option</div>
              <div className="p-2 flex flex-wrap gap-2 max-w-md">
                {activeToken.options.map((opt) => (
                  <button
                    key={opt}
                    className="text-sm px-2.5 py-1.5 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-colors"
                    onClick={() => chooseOption(opt)}
                  >
                    {opt}
                  </button>
                ))}
                <button
                  className="ml-auto text-xs px-2 py-1 rounded-md text-slate-600 hover:text-slate-800"
                  onClick={() => setActiveToken(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dot phrase suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute z-30 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
            style={{
              left: Math.max(8, caretCoordinates.left) + "px",
              top: Math.max(8, caretCoordinates.top + 20) + "px",
              minWidth: "200px",
            }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                className="w-full text-left px-3 py-2 hover:bg-slate-50 text-sm border-b border-slate-100 last:border-b-0"
                onClick={() => handleSuggestionClick(suggestion)}
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
        .mirror { position: relative; z-index: 10; }
        .editor { z-index: 20; }
        .line { position: relative; padding-inline: 0.125rem; border-radius: 0.5rem; }
        .line.highlight {
          background: linear-gradient(90deg, rgba(16,185,129,0.08), rgba(59,130,246,0.06));
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.04) inset, 0 4px 12px rgba(16,185,129,0.06);
          border-left: 4px solid rgba(16,185,129,0.4);
          padding-left: 0.375rem;
          margin: 0.125rem 0;
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

        .smart-token { 
          position: relative; 
          display: inline-block; 
          padding: 0.125rem 0.25rem; 
          border-radius: 0.375rem; 
          margin: 0 0.125rem;
        }
        .smart-token::before {
          content: ""; 
          position: absolute; 
          inset: -1px; 
          border-radius: 0.5rem; 
          z-index: -1;
          background: linear-gradient(90deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.15);
        }
        .smart-token:hover { 
          cursor: pointer; 
        }
        .smart-token:hover::before {
          background: linear-gradient(90deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3));
        }
        .smart-token.active::before { 
          background: linear-gradient(90deg, rgba(59,130,246,0.4), rgba(99,102,241,0.4));
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
      `}</style>
    </>
  );
}