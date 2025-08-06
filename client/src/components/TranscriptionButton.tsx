// @ts-nocheck
/**
 * TranscriptionButton Component
 * Universal microphone button for medical transcription across all sections
 * Provides visual feedback, keyboard shortcuts, and accessibility features
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Mic, 
  MicOff, 
  Square, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMedicalTranscription } from '@/contexts/MedicalTranscriptionContext';
import useSonioxTranscription, { TRANSCRIPTION_STATES } from '@/hooks/useSonioxTranscription';
import { formatTranscriptionForInsertion } from '@/lib/transcriptionUtils';
import { debugMicrophoneAccess } from '@/lib/microphoneDebug';

/**
 * TranscriptionButton Component
 * @param {Object} props
 * @param {string} props.section - Medical section identifier
 * @param {Function} props.onTranscriptionResult - Callback for transcription results
 * @param {Function} props.onTextInsert - Callback to insert text into target field
 * @param {string} props.targetFieldId - ID of the target text field
 * @param {Object} props.insertionOptions - Options for text insertion
 * @param {string} props.size - Button size (sm, md, lg)
 * @param {string} props.variant - Button variant
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.showTooltip - Whether to show tooltip
 * @param {boolean} props.showVolumeIndicator - Whether to show volume indicator
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.config - Transcription configuration overrides
 */
export function TranscriptionButton({
  section = 'general',
  onTranscriptionResult,
  onTextInsert,
  targetFieldId,
  insertionOptions = {},
  size = 'md',
  variant = 'outline',
  disabled = false,
  showTooltip = true,
  showVolumeIndicator = true,
  className,
  config = {},
  ...props
}) {
  const {
    isGloballyEnabled,
    getCurrentTips,
    getText,
    createTranscription,
    setActiveSession,
    preferences
  } = useMedicalTranscription();

  // Local state
  const [sessionId, setSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const transcriptionRef = useRef(null);

  // Create transcription instance
  const transcription = useSonioxTranscription({
    section,
    config: { ...preferences, ...config },
    onTranscriptionResult: handleTranscriptionResult,
    onError: handleTranscriptionError
  });

  const {
    state,
    isRecording,
    currentTranscript,
    finalTranscript,
    confidence,
    error,
    duration,
    volume,
    startRecording,
    stopRecording,
    cancelRecording,
    toggleRecording,
    reset,
    canRecord
  } = transcription;

  // Handle transcription result
  async function handleTranscriptionResult(result) {
    onTranscriptionResult?.(result);
    
    if (preferences.autoInsert && onTextInsert) {
      try {
        await insertTextIntoTarget(result.text);
      } catch (error) {
        console.error('Failed to auto-insert transcription:', error);
      }
    }
  }

  // Handle transcription error
  function handleTranscriptionError(error) {
    console.error('Transcription error:', error);
    // Error handling is managed by the hook and context
  }

  // Insert text into target field
  const insertTextIntoTarget = useCallback(async (text) => {
    if (!text) return;

    if (onTextInsert) {
      // Use provided callback
      onTextInsert(text, { sessionId, section, confidence });
    } else if (targetFieldId) {
      // Find target element and insert text
      const targetElement = document.getElementById(targetFieldId);
      if (targetElement) {
        const currentValue = targetElement.value || '';
        const cursorPosition = targetElement.selectionStart || 0;
        
        const { text: newText, cursorPosition: newCursor } = formatTranscriptionForInsertion(
          currentValue,
          text,
          cursorPosition
        );
        
        // Update the field
        targetElement.value = newText;
        targetElement.focus();
        targetElement.setSelectionRange(newCursor, newCursor);
        
        // Trigger change event
        const event = new Event('input', { bubbles: true });
        targetElement.dispatchEvent(event);
      }
    }
  }, [onTextInsert, targetFieldId, sessionId, section, confidence]);

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      // Check if media devices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('Media devices not supported');
        setHasPermission(false);
        return false;
      }

      console.log('Testing microphone access...');
      
      // Directly test getUserMedia instead of checking permissions API
      // This is more reliable as the permissions API can be stale
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // Stop all tracks immediately
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Microphone track stopped');
      });
      
      console.log('✅ Microphone permission verified and working');
      setHasPermission(true);
      return true;
    } catch (error: any) {
      console.error('❌ Microphone access error:', error);
      
      // Provide specific error messages with solutions
      let errorMsg = 'Microphone access failed';
      if (error.name === 'NotAllowedError') {
        errorMsg = 'Microphone access denied. Please:\n1. Click the 🔒 lock icon in your address bar\n2. Set "Microphone" to "Allow"\n3. Refresh the page and try again';
        
        // Only show alert on first failure, not on repeated attempts
        if (!hasPermission) {
          console.warn('🎤 Microphone Access Issue:\n\nTo use voice input:\n1. Click the 🔒 lock icon in your address bar\n2. Set "Microphone" to "Allow"\n3. Refresh the page and try again\n\nThis enables AI-powered medical transcription!');
        }
      } else if (error.name === 'NotFoundError') {
        errorMsg = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = 'Your browser does not support microphone access. Please use Chrome, Firefox, or Safari.';
      }
      
      console.warn(errorMsg);
      setHasPermission(false);
      return false;
    }
  }, [hasPermission]);

  // Initialize component
  useEffect(() => {
    checkMicrophonePermission();
  }, [checkMicrophonePermission]);

  // Handle button click
  const handleButtonClick = useCallback(async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isGloballyEnabled || disabled) return;

    if (!hasPermission) {
      // Run debug in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Running microphone debug...');
        const debugResult = await debugMicrophoneAccess();
        console.log('Debug result:', debugResult);
      }
      
      const granted = await checkMicrophonePermission();
      if (!granted) return;
    }

    try {
      if (isRecording) {
        await stopRecording();
      } else if (canRecord) {
        // Set as active session
        if (sessionId) {
          setActiveSession(sessionId, transcription);
        }
        await startRecording();
      }
    } catch (error) {
      console.error('Failed to toggle recording:', error);
    }
  }, [
    isGloballyEnabled,
    disabled,
    hasPermission,
    isRecording,
    canRecord,
    sessionId,
    transcription,
    setActiveSession,
    startRecording,
    stopRecording,
    checkMicrophonePermission
  ]);

  // Handle right-click for settings
  const handleRightClick = useCallback((event) => {
    event.preventDefault();
    setShowSettings(prev => !prev);
  }, []);

  // Get button icon based on state
  const getButtonIcon = useCallback(() => {
    const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
    
    switch (state) {
      case TRANSCRIPTION_STATES.CONNECTING:
      case TRANSCRIPTION_STATES.PROCESSING:
        return <Loader2 size={iconSize} className="animate-spin" />;
      
      case TRANSCRIPTION_STATES.LISTENING:
        return <Square size={iconSize} className="text-red-500" />;
      
      case TRANSCRIPTION_STATES.SUCCESS:
        return <CheckCircle size={iconSize} className="text-green-500" />;
      
      case TRANSCRIPTION_STATES.ERROR:
        return <AlertCircle size={iconSize} className="text-red-500" />;
      
      case TRANSCRIPTION_STATES.RECONNECTING:
        return <Loader2 size={iconSize} className="animate-spin text-yellow-500" />;
      
      default:
        return hasPermission === false ? 
          <MicOff size={iconSize} className="text-red-400" /> : 
          <Mic size={iconSize} className="text-blue-600" />;
    }
  }, [state, size, hasPermission]);

  // Get button color scheme based on state
  const getButtonColorClass = useCallback(() => {
    if (!isGloballyEnabled || disabled) {
      return 'opacity-50 cursor-not-allowed';
    }
    
    switch (state) {
      case TRANSCRIPTION_STATES.LISTENING:
        return 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200 animate-pulse';
      
      case TRANSCRIPTION_STATES.SUCCESS:
        return 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200';
      
      case TRANSCRIPTION_STATES.ERROR:
        return 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200';
      
      case TRANSCRIPTION_STATES.CONNECTING:
      case TRANSCRIPTION_STATES.PROCESSING:
        return 'bg-blue-100 border-blue-300 text-blue-700';
      
      case TRANSCRIPTION_STATES.RECONNECTING:
        return 'bg-yellow-100 border-yellow-300 text-yellow-700';
      
      default:
        return hasPermission === false ? 
          'bg-gray-100 border-gray-300 text-gray-400' : 
          'hover:bg-gray-50';
    }
  }, [isGloballyEnabled, disabled, state, hasPermission]);

  // Get tooltip text
  const getTooltipText = useCallback(() => {
    if (!isGloballyEnabled) {
      return getText('transcription.disabled');
    }
    
    if (hasPermission === false) {
      return 'Microphone access denied. Click the 🔒 lock icon in address bar to enable microphone access, then refresh the page.';
    }
    
    switch (state) {
      case TRANSCRIPTION_STATES.LISTENING:
        return `${getText('transcription.recording')} (${Math.round(duration / 1000)}s)`;
      
      case TRANSCRIPTION_STATES.PROCESSING:
        return getText('transcription.processing');
      
      case TRANSCRIPTION_STATES.SUCCESS:
        return `${getText('transcription.success')} (${Math.round(confidence * 100)}%)`;
      
      case TRANSCRIPTION_STATES.ERROR:
        return `${getText('transcription.error')}: ${error?.message || 'Unknown error'}`;
      
      case TRANSCRIPTION_STATES.CONNECTING:
        return 'Connecting...';
      
      case TRANSCRIPTION_STATES.RECONNECTING:
        return 'Reconnecting...';
      
      default:
        return `Click to start voice transcription (Space) • Right-click for settings`;
    }
  }, [isGloballyEnabled, hasPermission, state, duration, confidence, error, getText]);

  // Volume indicator
  const VolumeIndicator = useCallback(() => {
    if (!showVolumeIndicator || !isRecording) return null;
    
    const volumeLevel = Math.min(volume, 100);
    const volumeHeight = Math.max(volumeLevel / 100 * 20, 2);
    
    return (
      <div className="absolute -top-1 -right-1 w-3 h-6 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute bottom-0 left-0 right-0 bg-green-500 transition-all duration-100"
          style={{ height: `${volumeHeight}px` }}
        />
      </div>
    );
  }, [showVolumeIndicator, isRecording, volume]);

  // Don't render if globally disabled and no override
  if (!isGloballyEnabled && !props.forceShow) {
    return null;
  }

  const button = (
    <div className="relative">
      <Button
        size={size}
        variant={variant}
        onClick={handleButtonClick}
        onContextMenu={handleRightClick}
        // Keep button clickable even when permission is currently denied so the user can retry granting access
        disabled={disabled || !isGloballyEnabled}
        className={cn(
          getButtonColorClass(),
          'relative transition-all duration-200',
          className
        )}
        aria-label={getTooltipText()}
        title={showTooltip ? '' : getTooltipText()} // Use title if tooltip disabled
        {...props}
      >
        {getButtonIcon()}
        <VolumeIndicator />
      </Button>
      
      {/* Current transcript preview (if recording) */}
      {isRecording && currentTranscript && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-black/80 text-white text-xs rounded max-w-xs z-50">
          {currentTranscript}
        </div>
      )}
    </div>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <div className="max-w-sm">
            <p>{getTooltipText()}</p>
            {canRecord && (
              <div className="mt-1 text-xs opacity-75">
                Space: Start/Stop • Esc: Cancel • Right-click: Settings
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Compact version of TranscriptionButton for inline use
 */
export function TranscriptionButtonCompact(props) {
  return (
    <TranscriptionButton
      size="sm"
      variant="ghost"
      showTooltip={false}
      showVolumeIndicator={false}
      className="h-6 w-6 p-1"
      {...props}
    />
  );
}

/**
 * Large version of TranscriptionButton for primary use
 */
export function TranscriptionButtonLarge(props) {
  return (
    <TranscriptionButton
      size="lg"
      variant="default"
      showTooltip={true}
      showVolumeIndicator={true}
      className="h-12 w-12"
      {...props}
    />
  );
}

export default TranscriptionButton;