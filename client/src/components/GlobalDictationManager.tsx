// @ts-nocheck
/**
 * GlobalDictationManager Component
 * Manages global dictation functionality with Alt/Option key detection
 * and cursor-positioned microphone popup
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DictationPopup } from './DictationPopup';
import { useMedicalTranscription } from '@/contexts/MedicalTranscriptionContext';
import useSonioxTranscription, { TRANSCRIPTION_STATES } from '@/hooks/useSonioxTranscription';
import { 
  getCurrentCursorPosition, 
  insertTextAtCursor, 
  canReceiveTextInput,
  CursorPosition 
} from '@/lib/cursorUtils';
import { AudioLevelAnalyzer, createAudioAnalyzer, getOptimizedMicrophoneStream } from '@/lib/audioAnalysis';

interface GlobalDictationState {
  isVisible: boolean;
  position: { x: number; y: number };
  isKeyHeld: boolean;
  holdStartTime: number;
  targetElement: HTMLElement | null;
  cursorPosition: CursorPosition | null;
}

const HOLD_DELAY = 1000; // 1 second delay before showing popup
const SUPPORTED_KEYS = ['AltLeft', 'AltRight']; // Alt keys (Option on Mac)

export function GlobalDictationManager() {
  const { isGloballyEnabled, createTranscription } = useMedicalTranscription();
  
  // Global dictation state
  const [dictationState, setDictationState] = useState<GlobalDictationState>({
    isVisible: false,
    position: { x: 0, y: 0 },
    isKeyHeld: false,
    holdStartTime: 0,
    targetElement: null,
    cursorPosition: null
  });
  
  const [audioLevel, setAudioLevel] = useState(0);
  const [demoMode, setDemoMode] = useState(false);
  
  // Refs
  const holdTimerRef = useRef<number | null>(null);
  const audioAnalyzerRef = useRef<AudioLevelAnalyzer | null>(null);
  const transcriptionInstanceRef = useRef<any>(null);
  const activeKeysRef = useRef<Set<string>>(new Set());
  
  /**
   * Hide dictation popup
   */
  const hideDictationPopup = useCallback(async () => {
    // Stop transcription through ref to avoid circular dependency
    if (transcriptionInstanceRef.current && transcriptionInstanceRef.current.isRecording) {
      try {
        await transcriptionInstanceRef.current.stopRecording();
      } catch (error) {
        console.warn('Error stopping transcription:', error);
      }
    }
    
    // Stop audio analyzer
    if (audioAnalyzerRef.current) {
      audioAnalyzerRef.current.stopAnalysis();
    }
    
    setDictationState(prev => ({
      ...prev,
      isVisible: false,
      targetElement: null,
      cursorPosition: null
    }));
    
    setAudioLevel(0);
  }, []);

  /**
   * Handle transcription result
   */
  const handleTranscriptionResult = useCallback((result) => {
    if (!result || !result.text) return;
    
    // Insert text at cursor position
    const insertResult = insertTextAtCursor(result.text);
    
    if (insertResult.success) {
      // Hide popup after successful insertion
      hideDictationPopup();
    } else {
      console.warn('Failed to insert transcribed text:', insertResult.error);
    }
  }, [hideDictationPopup]);
  
  /**
   * Handle transcription error
   */
  const handleTranscriptionError = useCallback((error) => {
    console.warn('Global dictation error:', error);
    // Keep popup visible for error display
  }, []);
  
  // Create transcription instance when needed
  const transcriptionSession = useMemo(() => {
    if (!dictationState.isVisible) return null;
    
    return createTranscription({
      section: 'general', // Could be enhanced to detect context
      onResult: handleTranscriptionResult,
      onError: handleTranscriptionError
    });
  }, [dictationState.isVisible, handleTranscriptionResult, handleTranscriptionError]);
  
  // Create transcription hook
  const transcription = useSonioxTranscription({
    section: transcriptionSession?.transcriptionOptions.section,
    onTranscriptionResult: transcriptionSession?.transcriptionOptions.onTranscriptionResult,
    onError: transcriptionSession?.transcriptionOptions.onError,
    config: {
      maxDuration: 60000, // 1 minute max for global dictation
      minConfidence: 0.6,
      enableVAD: true
    }
  });
  
  // Store transcription instance in ref for access in callbacks
  useEffect(() => {
    transcriptionInstanceRef.current = transcription;
  }, [transcription]);
  
  /**
   * Show dictation popup at cursor position
   */
  const showDictationPopup = useCallback(async () => {
    const cursorPos = getCurrentCursorPosition();
    
    if (!cursorPos || !canReceiveTextInput(cursorPos.element)) {
      return false;
    }
    
    // Setup audio analyzer
    if (!audioAnalyzerRef.current) {
      audioAnalyzerRef.current = createAudioAnalyzer();
      audioAnalyzerRef.current.setLevelUpdateCallback((data) => {
        setAudioLevel(data.volume);
      });
    }
    
    // Get microphone stream for audio analysis or use demo mode
    try {
      const stream = await getOptimizedMicrophoneStream();
      if (stream && audioAnalyzerRef.current) {
        await audioAnalyzerRef.current.startAnalysis(stream);
      }
    } catch (error) {
      console.warn('Microphone access failed, enabling demo mode:', error);
      setDemoMode(true);
      // Simulate audio levels for demo
      const demoInterval = setInterval(() => {
        setAudioLevel(Math.random() * 60 + 20);
      }, 100);
      
      // Simulate transcription result after 3 seconds
      setTimeout(() => {
        clearInterval(demoInterval);
        setAudioLevel(0);
        
        // Simulate a transcription result
        handleTranscriptionResult({
          text: "This is a demo transcription result. The microphone popup is working!",
          confidence: 0.95,
          language: 'en',
          timestamp: Date.now()
        });
      }, 3000);
    }
    
    setDictationState(prev => ({
      ...prev,
      isVisible: true,
      position: { x: cursorPos.x, y: cursorPos.y },
      targetElement: cursorPos.element,
      cursorPosition: cursorPos
    }));
    
    // Start transcription
    setTimeout(async () => {
      if (transcriptionInstanceRef.current && transcriptionInstanceRef.current.startRecording) {
        try {
          await transcriptionInstanceRef.current.startRecording();
        } catch (error) {
          console.error('Failed to start global dictation:', error);
        }
      }
    }, 100);
    
    return true;
  }, []);
  
  
  /**
   * Handle key down events
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isGloballyEnabled) return;
    
    const { code } = event;
    
    // Check if it's a supported key
    if (!SUPPORTED_KEYS.includes(code)) return;
    
    // Prevent default Alt key behavior (like opening menu)
    event.preventDefault();
    
    // Track active keys
    activeKeysRef.current.add(code);
    
    // If already holding or popup is visible, ignore
    if (dictationState.isKeyHeld || dictationState.isVisible) return;
    
    // Check if we're in a text input context
    const activeElement = document.activeElement as HTMLElement;
    if (!activeElement || !canReceiveTextInput(activeElement)) return;
    
    // Start hold timer
    const startTime = Date.now();
    
    setDictationState(prev => ({
      ...prev,
      isKeyHeld: true,
      holdStartTime: startTime
    }));
    
    holdTimerRef.current = window.setTimeout(async () => {
      // Check if key is still held
      if (activeKeysRef.current.has(code)) {
        const success = await showDictationPopup();
        if (!success) {
          // Reset state if failed to show popup
          setDictationState(prev => ({
            ...prev,
            isKeyHeld: false
          }));
        }
      }
    }, HOLD_DELAY);
  }, [isGloballyEnabled, dictationState.isKeyHeld, dictationState.isVisible, showDictationPopup]);
  
  /**
   * Handle key up events
   */
  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const { code } = event;
    
    if (!SUPPORTED_KEYS.includes(code)) return;
    
    // Remove from active keys
    activeKeysRef.current.delete(code);
    
    // Clear hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    // If popup is visible and no more supported keys are held, hide it
    if (dictationState.isVisible && activeKeysRef.current.size === 0) {
      hideDictationPopup();
    }
    
    // Reset hold state
    setDictationState(prev => ({
      ...prev,
      isKeyHeld: false
    }));
  }, [dictationState.isVisible, hideDictationPopup]);
  
  /**
   * Handle window blur (hide popup if window loses focus)
   */
  const handleWindowBlur = useCallback(() => {
    if (dictationState.isVisible) {
      hideDictationPopup();
    }
    
    // Clear all state
    activeKeysRef.current.clear();
    setDictationState(prev => ({
      ...prev,
      isKeyHeld: false
    }));
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, [dictationState.isVisible, hideDictationPopup]);
  
  /**
   * Handle escape key to cancel dictation
   */
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && dictationState.isVisible) {
      event.preventDefault();
      hideDictationPopup();
    }
  }, [dictationState.isVisible, hideDictationPopup]);
  
  // Setup global event listeners
  useEffect(() => {
    if (!isGloballyEnabled) return;
    
    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('blur', handleWindowBlur);
    
    return () => {
      // Remove event listeners
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isGloballyEnabled, handleKeyDown, handleKeyUp, handleEscapeKey, handleWindowBlur]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      
      if (audioAnalyzerRef.current) {
        audioAnalyzerRef.current.dispose();
      }
    };
  }, []);
  
  // Don't render if not globally enabled
  if (!isGloballyEnabled) return null;
  
  return (
    <DictationPopup
      isVisible={dictationState.isVisible}
      position={dictationState.position}
      transcriptionState={transcription?.state || TRANSCRIPTION_STATES.IDLE}
      isRecording={transcription?.isRecording || false}
      volume={audioLevel}
      confidence={transcription?.confidence || 0}
      currentTranscript={transcription?.currentTranscript || ''}
      onClose={hideDictationPopup}
    />
  );
}

export default GlobalDictationManager;