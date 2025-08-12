import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Copy, 
  RotateCcw, 
  FileText
} from 'lucide-react';
import { SmartTextEditor } from '@/components/SmartTextEditor';
import { useAuth } from '@/contexts/AuthContext';
import { useNoteState } from '@/contexts/NoteStateContext';

interface SimpleLivePreviewProps {
  note: string;
  onNoteChange: (note: string) => void;
  onCopyNote: () => void;
  onResetNote?: () => void;
  className?: string;
  onBlur?: () => void;
}

export function SimpleLivePreview({
  note,
  onNoteChange,
  onCopyNote,
  onResetNote,
  className = "",
  onBlur
}: SimpleLivePreviewProps) {
  const wordCount = note.trim() ? note.trim().split(/\s+/).length : 0;
  const auth = useAuth();
  const noteState = useNoteState();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const caretKey = `arinote_caret_${auth.user?.id || 'anonymous'}`;

  // Restore caret on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(caretKey);
      if (saved && textareaRef.current) {
        const { start, end } = JSON.parse(saved) as { start: number; end: number };
        const length = note.length;
        const safeStart = Math.min(Math.max(0, start), length);
        const safeEnd = Math.min(Math.max(0, end), length);
        textareaRef.current.selectionStart = safeStart;
        textareaRef.current.selectionEnd = safeEnd;
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist caret on changes and before unload
  useEffect(() => {
    const persistCaret = () => {
      if (!textareaRef.current) return;
      try {
        const payload = JSON.stringify({ start: textareaRef.current.selectionStart, end: textareaRef.current.selectionEnd });
        sessionStorage.setItem(caretKey, payload);
      } catch {}
    };
    const onBlurHandler = () => {
      persistCaret();
      // ensure save on blur
      noteState.saveNow();
    };
    const onBeforeUnload = () => persistCaret();

    const el = textareaRef.current;
    if (el) {
      el.addEventListener('blur', onBlurHandler);
      el.addEventListener('keyup', persistCaret);
      el.addEventListener('mouseup', persistCaret);
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      if (el) {
        el.removeEventListener('blur', onBlurHandler);
        el.removeEventListener('keyup', persistCaret);
        el.removeEventListener('mouseup', persistCaret);
      }
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [caretKey, noteState]);

  // Debug to verify our changes are loading
  useEffect(() => {
    console.log('🎨 NEW SimpleLivePreview loaded with glass design!', { className, hasGlass: true });
  }, [className]);

  return (
    <div className={`w-full max-w-none h-full flex flex-col ${className} relative overflow-hidden`}>
      {/* Stunning Background with Animated Glass Layers */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/40 to-blue-50/60 backdrop-blur-3xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/3 via-transparent to-purple-500/3"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(59,130,246,0.08),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(139,92,246,0.06),transparent_50%)]"></div>
      </div>

      {/* Main Glass Container - Edge to Edge */}
      <div className="relative w-full flex-1 flex flex-col">
        {/* Floating Header - Ultra Modern Glass */}
        <div className="relative z-10 bg-white/20 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/[0.03]">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl border border-white/20 shadow-inner">
                <FileText className="w-5 h-5 text-blue-600/80" />
              </div>
              <div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent tracking-tight">
                  Live Preview
                </h1>
                <p className="text-xs text-gray-500/80 font-medium mt-0.5">Professional Medical Documentation</p>
              </div>
            </div>
            
            {/* Status Indicator */}
            <div className="flex items-center gap-3 bg-white/30 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-400/40"></div>
                <span className="text-xs font-medium text-gray-700 tracking-wide">Smart phrases active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar - Floating Glass Design */}
        <div className="relative z-10 bg-gradient-to-r from-white/10 via-white/20 to-white/10 backdrop-blur-xl border-b border-white/10">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={onCopyNote}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2.5 h-8 px-4 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-black/5"
              >
                <Copy className="w-4 h-4" />
                Copy Note
              </Button>
              {onResetNote && (
                <Button
                  onClick={onResetNote}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2.5 h-8 px-4 text-sm font-medium text-gray-700 hover:text-gray-900 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/20 rounded-lg transition-all duration-200 ease-out hover:scale-105 hover:shadow-lg hover:shadow-black/5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
            
            {/* Word Count & Status */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-medium">{wordCount}</span>
                <span className="text-gray-500">words</span>
              </div>
              <div className="w-px h-4 bg-gray-300/50"></div>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${noteState.lastSaved ? 'bg-emerald-400 shadow-emerald-400/40 shadow-md' : 'bg-amber-400 shadow-amber-400/40 shadow-md'}`}></div>
                <span className="text-gray-600 font-medium text-xs tracking-wide">
                  {noteState.lastSaved ? 'Auto-saved' : 'Unsaved changes'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Area - Pure Glass Editor with Edge-to-Edge Design */}
        <div className="flex-1 relative overflow-y-auto" style={{ minHeight: 'calc(100vh - 16rem)' }}>
          {/* Subtle content background with glass effect */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/10 pointer-events-none"></div>
          
          <SmartTextEditor
            value={note}
            onChange={onNoteChange}
            placeholder="Your generated medical note will appear here. Start typing or use smart phrases with /phrase + space..."
            className="w-full min-h-full resize-none border-0 focus:ring-0 focus:outline-0 px-8 py-8 leading-8 bg-transparent text-gray-900 text-base selection:bg-blue-200/40 placeholder:text-gray-400/80 placeholder:font-normal font-sans tracking-wide relative z-10"
            onBlur={() => {
              noteState.saveNow();
              if (onBlur) onBlur();
            }}
            onRef={(ref) => { textareaRef.current = ref.current; }}
          />

          {/* Subtle content overlay for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none z-20"></div>
        </div>

        {/* Floating Status Bar - Minimal Glass Design */}
        <div className="absolute bottom-4 left-6 right-6 bg-white/30 backdrop-blur-xl border border-white/20 rounded-xl px-4 py-3 shadow-2xl shadow-black/[0.08] z-20">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="font-medium text-gray-700">Medical Note Document</span>
              <div className="w-px h-4 bg-gray-300/50"></div>
              <span className="text-gray-500 font-mono text-xs">UTF-8</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-xs text-gray-500 bg-white/40 px-2 py-1 rounded-md border border-white/20">
                Type /phrase + space for smart completion
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}