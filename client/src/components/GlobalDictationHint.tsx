// @ts-nocheck
/**
 * GlobalDictationHint Component
 * Shows a subtle hint to users about the global dictation feature
 */

import React, { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMedicalTranscription } from '@/contexts/MedicalTranscriptionContext';

interface GlobalDictationHintProps {
  className?: string;
}

export function GlobalDictationHint({ className }: GlobalDictationHintProps) {
  const { isGloballyEnabled } = useMedicalTranscription();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if hint should be shown
  useEffect(() => {
    if (!isGloballyEnabled) return;

    // Check if user has previously dismissed the hint
    const dismissed = localStorage.getItem('globalDictationHintDismissed');
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show hint after a delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isGloballyEnabled]);

  // Auto-hide hint after some time
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('globalDictationHintDismissed', 'true');
  };

  if (!isGloballyEnabled || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div 
      className={cn(
        'fixed bottom-6 right-6 z-40 max-w-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-4 transition-all duration-300',
        'animate-in slide-in-from-bottom-5 fade-in',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 p-1 bg-white/20 rounded-full">
          <Mic className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">
            Global Dictation Available
          </h4>
          <p className="text-sm text-white/90 leading-relaxed">
            Hold <kbd className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-mono">Alt</kbd> for 1 second anywhere to start voice dictation
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Progress indicator showing auto-dismiss */}
      <div className="mt-3 w-full bg-white/20 rounded-full h-1">
        <div 
          className="bg-white h-1 rounded-full transition-all duration-[8000ms] ease-linear"
          style={{ width: '100%', animation: 'shrink-width 8s linear' }}
        />
      </div>
      
      <style>
        {`
          @keyframes shrink-width {
            from { width: 100%; }
            to { width: 0%; }
          }
        `}
      </style>
    </div>
  );
}

export default GlobalDictationHint;