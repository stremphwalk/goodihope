/**
 * SmartTextEntryWithTranscription Component
 * Enhanced SmartTextEntry with integrated medical transcription support
 * Maintains all existing functionality while adding voice input capabilities
 */

// @ts-nocheck
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMedicalTranscription } from '@/contexts/MedicalTranscriptionContext';
import { useSonioxTranscription } from '@/hooks/useSonioxTranscription';
import TranscriptionButton from './TranscriptionButton';
import TranscriptionOverlay from './TranscriptionOverlay';
import { SmartTextEntry } from './SmartTextEntry';
import TranscriptionErrorBoundary from './TranscriptionErrorBoundary';
import { formatTranscriptionForInsertion, detectMedicalSection } from '@/lib/transcriptionUtils';
import { cn } from '@/lib/utils';

interface SmartTextEntryWithTranscriptionProps {
  title: string;
  placeholder: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: (value?: string) => void;
  templates?: { [key: string]: string };
  persistenceKey?: string;
  updateOnBlurOnly?: boolean;
  section?: string; // Medical section for context-aware transcription
  enableTranscription?: boolean;
  transcriptionPosition?: 'inline' | 'overlay' | 'both';
  showTranscriptionOverlay?: boolean;
  transcriptionConfig?: object;
  className?: string;
  disabled?: boolean;
}

export function SmartTextEntryWithTranscription({
  title,
  placeholder,
  value,
  onChange,
  onBlur,
  templates,
  persistenceKey,
  updateOnBlurOnly = false,
  section,
  enableTranscription = true,
  transcriptionPosition = 'both',
  showTranscriptionOverlay = false,
  transcriptionConfig = {},
  className,
  disabled = false,
  ...props
}: SmartTextEntryWithTranscriptionProps) {
  const { language } = useLanguage();
  const { isGloballyEnabled } = useMedicalTranscription();
  
  // Local state for transcription
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(showTranscriptionOverlay);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Determine section for medical context
  const medicalSection = section || detectMedicalSection(title, window.location.pathname);
  
  // Handle transcription result
  const handleTranscriptionResult = useCallback((result) => {
    const { text, confidence } = result;
    
    if (text && textareaRef.current) {
      const currentValue = value || '';
      const cursorPosition = textareaRef.current.selectionStart || 0;
      
      const { text: newText, cursorPosition: newCursor } = formatTranscriptionForInsertion(
        currentValue,
        text,
        cursorPosition
      );
      
      // Update the value using the onChange callback
      if (onChange) {
        onChange(newText);
      }
      
      // Focus and position cursor
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursor, newCursor);
        }
      }, 0);
    }
    
    // Hide overlay after successful transcription
    if (showOverlay) {
      setTimeout(() => setShowOverlay(false), 2000);
    }
  }, [value, onChange, showOverlay]);
  
  // Handle transcription error
  const handleTranscriptionError = useCallback((error) => {
    console.error('Transcription error in SmartTextEntry:', error);
    setIsTranscribing(false);
  }, []);
  
  // Use the transcription hook directly
  const transcriptionInstance = useSonioxTranscription({
    section: medicalSection,
    onResult: handleTranscriptionResult,
    onError: handleTranscriptionError,
    config: transcriptionConfig
  });
  
  // Handle transcription button click
  const handleTranscriptionToggle = useCallback(() => {
    if (!transcriptionInstance) return;
    
    if (transcriptionInstance.isRecording) {
      transcriptionInstance.stopRecording();
      setIsTranscribing(false);
      setShowOverlay(false);
    } else if (transcriptionInstance.canRecord) {
      transcriptionInstance.startRecording();
      setIsTranscribing(true);
      if (transcriptionPosition === 'overlay' || transcriptionPosition === 'both') {
        setShowOverlay(true);
      }
    }
  }, [transcriptionInstance, transcriptionPosition]);
  
  // Handle overlay accept
  const handleOverlayAccept = useCallback((text, metadata) => {
    handleTranscriptionResult({ text, ...metadata });
    setShowOverlay(false);
  }, [handleTranscriptionResult]);
  
  // Handle overlay reject
  const handleOverlayReject = useCallback(() => {
    if (transcriptionInstance && transcriptionInstance.isRecording) {
      transcriptionInstance.cancelRecording();
    }
    setIsTranscribing(false);
    setShowOverlay(false);
  }, [transcriptionInstance]);
  
  // Handle overlay close
  const handleOverlayClose = useCallback(() => {
    setShowOverlay(false);
    if (transcriptionInstance && transcriptionInstance.isRecording) {
      transcriptionInstance.cancelRecording();
    }
    setIsTranscribing(false);
  }, [transcriptionInstance]);
  
  // Get textarea ref for text insertion
  const getTextareaRef = useCallback(() => {
    return textareaRef.current;
  }, []);
  
  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Enhanced SmartTextEntry with ref access */}
      <SmartTextEntry
        title={title}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        templates={templates}
        persistenceKey={persistenceKey}
        updateOnBlurOnly={updateOnBlurOnly}
        disabled={disabled}
        {...props}
      />
      
      {/* Transcription Controls */}
      {enableTranscription && isGloballyEnabled && !disabled && (
        <TranscriptionErrorBoundary fallbackMessage="Voice input is temporarily unavailable. You can continue typing manually.">
          <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Inline transcription button */}
            {(transcriptionPosition === 'inline' || transcriptionPosition === 'both') && (
              <TranscriptionButton
                size="sm"
                section={medicalSection}
                onTranscriptionResult={handleTranscriptionResult}
                onTextInsert={(text) => handleTranscriptionResult({ text })}
                config={transcriptionConfig}
                className="h-8"
              />
            )}
            
            {/* Transcription status */}
            {isTranscribing && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording...
              </div>
            )}
            
            {/* Show overlay button */}
            {transcriptionInstance && (transcriptionPosition === 'overlay' || transcriptionPosition === 'both') && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowOverlay(!showOverlay)}
                className="h-8 px-3 text-xs"
              >
                {showOverlay ? 'Hide' : 'Show'} Voice Input
              </Button>
            )}
          </div>
          
          {/* Existing controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Characters: {(value || '').length}</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => onChange?.('')}
              className="h-6 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
          </div>
        </TranscriptionErrorBoundary>
      )}
      
      {/* Transcription Overlay */}
      {showOverlay && transcriptionInstance && (
        <TranscriptionOverlay
          transcription={transcriptionInstance}
          onAccept={handleOverlayAccept}
          onReject={handleOverlayReject}
          onClose={handleOverlayClose}
          isVisible={showOverlay}
          position="center"
          showConfidence={true}
          allowEditing={true}
          showLanguageSwitch={true}
        />
      )}
      
      {/* Transcription tips (if actively transcribing) */}
      {isTranscribing && !showOverlay && (
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
          <div className="font-medium mb-1">Voice Input Active:</div>
          <div>Speak clearly and use medical terminology. Press Space to stop recording.</div>
        </div>
      )}
    </div>
  );
}

/**
 * Higher-order component to wrap any SmartTextEntry with transcription
 */
export function withTranscription<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  transcriptionOptions: Partial<SmartTextEntryWithTranscriptionProps> = {}
) {
  return function WithTranscriptionComponent(props: T) {
    return (
      <SmartTextEntryWithTranscription
        {...transcriptionOptions}
        {...(props as any)}
      />
    );
  };
}

/**
 * Pre-configured variants for common use cases
 */

// HPI Section with transcription
export function HpiSmartTextEntry(props: Omit<SmartTextEntryWithTranscriptionProps, 'section'>) {
  return (
    <SmartTextEntryWithTranscription
      section="hpi"
      transcriptionPosition="both"
      enableTranscription={true}
      {...props}
    />
  );
}

// Physical Exam with transcription
export function PhysicalExamSmartTextEntry(props: Omit<SmartTextEntryWithTranscriptionProps, 'section'>) {
  return (
    <SmartTextEntryWithTranscription
      section="physical-exam"
      transcriptionPosition="both"
      enableTranscription={true}
      {...props}
    />
  );
}

// Assessment/Impression with transcription
export function ImpressionSmartTextEntry(props: Omit<SmartTextEntryWithTranscriptionProps, 'section'>) {
  return (
    <SmartTextEntryWithTranscription
      section="impression"
      transcriptionPosition="both"
      enableTranscription={true}
      {...props}
    />
  );
}

// Past Medical History with transcription
export function PMHSmartTextEntry(props: Omit<SmartTextEntryWithTranscriptionProps, 'section'>) {
  return (
    <SmartTextEntryWithTranscription
      section="past-medical-history"
      transcriptionPosition="both"
      enableTranscription={true}
      {...props}
    />
  );
}

// Medications with transcription
export function MedicationSmartTextEntry(props: Omit<SmartTextEntryWithTranscriptionProps, 'section'>) {
  return (
    <SmartTextEntryWithTranscription
      section="medications"
      transcriptionPosition="both"
      enableTranscription={true}
      {...props}
    />
  );
}

export default SmartTextEntryWithTranscription;