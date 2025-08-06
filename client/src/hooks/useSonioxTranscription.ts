// @ts-nocheck
/**
 * useSonioxTranscription Hook
 * Core hook for managing Soniox real-time transcription with medical context
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { RecordTranscribe } from '@soniox/speech-to-text-web';
import { 
  createMedicalContext, 
  processMedicalText, 
  calculateMedicalConfidence,
  validateTranscription,
  detectMedicalSection 
} from '@/lib/transcriptionUtils';
import { useLanguage } from '@/contexts/LanguageContext';

// Transcription states
export const TRANSCRIPTION_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
  RECONNECTING: 'reconnecting'
};

// Default configuration
const DEFAULT_CONFIG = {
  model: 'stt-rt-preview',
  minConfidence: 0.7,
  maxDuration: 30000, // 30 seconds max per session
  reconnectAttempts: 3,
  reconnectDelay: 1000,
  enableVAD: true, // Voice Activity Detection
  autoFinalize: true,
  medicalOptimization: true
};

/**
 * Main transcription hook
 * @param {Object} options - Configuration options
 * @param {string} options.section - Medical section for context (hpi, physical-exam, etc.)
 * @param {string} options.apiKey - Soniox API key (if not using server proxy)
 * @param {Function} options.onTranscriptionResult - Callback for transcription results
 * @param {Function} options.onError - Error callback
 * @param {Object} options.config - Override default configuration
 */
export function useSonioxTranscription(options = {}) {
  const {
    section = 'general',
    apiKey,
    onTranscriptionResult,
    onError,
    config = {}
  } = options;

  const { language } = useLanguage();
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // State management
  const [state, setState] = useState(TRANSCRIPTION_STATES.IDLE);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Refs for managing instances and cleanup
  const recordTranscribeRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const durationTimerRef = useRef(null);
  const volumeMeterRef = useRef(null);
  const currentTokensRef = useRef([]);

  // Create medical context based on section and language
  const getMedicalContextConfig = useCallback(() => {
    const detectedSection = section || detectMedicalSection('', window.location.pathname);
    return createMedicalContext(detectedSection, language);
  }, [section, language]);

  // Initialize RecordTranscribe instance
  const initializeTranscription = useCallback(async () => {
    if (recordTranscribeRef.current) {
      return recordTranscribeRef.current;
    }

    try {
      setState(TRANSCRIPTION_STATES.CONNECTING);
      
      // Get API key from server if not provided directly
      let effectiveApiKey = apiKey;
      if (!effectiveApiKey) {
        try {
          console.log('Requesting transcription token from server...');
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const response = await fetch('/api/transcription/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId })
          });
          
          console.log(`Token request response status: ${response.status}`);
          
          if (response.ok) {
            const data = await response.json();
            effectiveApiKey = data.token;
            console.log('✅ Transcription token received from server');
          } else {
            const errorText = await response.text();
            console.error(`Token request failed: ${response.status} - ${errorText}`);
            throw new Error(`Failed to get transcription token: ${response.status}`);
          }
        } catch (tokenError) {
          console.error('Token request error:', tokenError);
          console.warn('Failed to get server token, checking environment variables...');
          
          // In production, we should always use server tokens for security
          // But as a fallback, check if there's a client-side key (not recommended)
          if (process.env.NODE_ENV === 'development' && window.SONIOX_API_KEY) {
            effectiveApiKey = window.SONIOX_API_KEY;
            console.warn('⚠️ Using client-side API key (development only)');
          } else {
            throw new Error('No transcription API key available. Please check server configuration.');
          }
        }
      }

      const medicalContext = getMedicalContextConfig();
      
      // Validate API key before creating instance
      if (!effectiveApiKey || effectiveApiKey.trim() === '') {
        throw new Error('No valid API key available for transcription service');
      }

      console.log('Creating Soniox RecordTranscribe instance...');
      
      let recordTranscribe;
      try {
        recordTranscribe = new RecordTranscribe({
          apiKey: effectiveApiKey,
          model: finalConfig.model || 'stt-rt-preview',
          languageHints: [language || 'en'],
          context: medicalContext.context || [],
          enableVAD: finalConfig.enableVAD,
          
          // Callback for partial results (real-time)
          onPartialResult: (result) => {
          if (result && result.tokens) {
            currentTokensRef.current = result.tokens;
            const text = result.tokens.map(token => token.text).join('');
            const processedText = processMedicalText(text, language);
            const confidenceScore = calculateMedicalConfidence(result.tokens, section);
            
            setCurrentTranscript(processedText);
            setConfidence(confidenceScore);
            setState(TRANSCRIPTION_STATES.LISTENING);
          }
        },

        // Callback for final results
        onFinalResult: (result) => {
          if (result && result.tokens) {
            const text = result.tokens.map(token => token.text).join('');
            const processedText = processMedicalText(text, language);
            const confidenceScore = calculateMedicalConfidence(result.tokens, section);
            
            setFinalTranscript(processedText);
            setConfidence(confidenceScore);
            
            // Validate transcription
            const validation = validateTranscription(processedText, confidenceScore, {
              minConfidence: finalConfig.minConfidence,
              minLength: 3,
              maxLength: 1000
            });

            if (validation.isValid) {
              setState(TRANSCRIPTION_STATES.SUCCESS);
              onTranscriptionResult?.({
                text: validation.processedText,
                confidence: confidenceScore,
                tokens: result.tokens,
                language,
                section,
                timestamp: Date.now()
              });
            } else {
              setState(TRANSCRIPTION_STATES.ERROR);
              setError({
                type: 'validation_failed',
                message: validation.issues.join(', '),
                details: validation
              });
              onError?.({
                type: 'validation_failed',
                message: validation.issues.join(', '),
                details: validation
              });
            }
          }
        },

        // Error handling
        onError: (error) => {
          console.error('Soniox transcription error:', error);
          setState(TRANSCRIPTION_STATES.ERROR);
          setError({
            type: 'transcription_error',
            message: error.message || 'Transcription failed',
            details: error
          });
          onError?.(error);
          
          // Attempt reconnection for certain error types
          if (shouldReconnect(error) && reconnectAttemptsRef.current < finalConfig.reconnectAttempts) {
            scheduleReconnect();
          }
        },

        // Connection status
        onConnect: () => {
          console.log('Soniox connection established');
          reconnectAttemptsRef.current = 0;
          setState(TRANSCRIPTION_STATES.IDLE);
        },

        onDisconnect: () => {
          console.log('Soniox connection closed');
          if (state === TRANSCRIPTION_STATES.LISTENING) {
            // Unexpected disconnection during recording
            setState(TRANSCRIPTION_STATES.RECONNECTING);
            scheduleReconnect();
          }
        }
      });
      
      // Validate the created instance
      if (!recordTranscribe) {
        throw new Error('Failed to create RecordTranscribe instance');
      }
      
      if (typeof recordTranscribe.start !== 'function') {
        throw new Error('RecordTranscribe instance missing required methods');
      }
      
      console.log('✅ Soniox RecordTranscribe instance created successfully');
      
      } catch (constructorError) {
        console.error('Failed to create RecordTranscribe instance:', constructorError);
        throw new Error(`Transcription service initialization failed: ${constructorError.message}`);
      }

      recordTranscribeRef.current = recordTranscribe;
      return recordTranscribe;

    } catch (error) {
      console.error('Failed to initialize transcription:', error);
      setState(TRANSCRIPTION_STATES.ERROR);
      setError({
        type: 'initialization_failed',
        message: error.message || 'Failed to initialize transcription',
        details: error
      });
      onError?.(error);
      throw error;
    }
  }, [apiKey, language, section, finalConfig, getMedicalContextConfig, onTranscriptionResult, onError, state]);

  // Determine if we should attempt reconnection
  const shouldReconnect = useCallback((error) => {
    const reconnectableErrors = [
      'network_error',
      'connection_lost',
      'websocket_error',
      'timeout'
    ];
    return reconnectableErrors.some(type => 
      error.message?.toLowerCase().includes(type) ||
      error.type?.toLowerCase().includes(type)
    );
  }, []);

  // Schedule reconnection attempt
  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= finalConfig.reconnectAttempts) {
      setState(TRANSCRIPTION_STATES.ERROR);
      setError({
        type: 'max_reconnect_attempts',
        message: 'Maximum reconnection attempts reached',
        details: { attempts: reconnectAttemptsRef.current }
      });
      return;
    }

    setState(TRANSCRIPTION_STATES.RECONNECTING);
    reconnectAttemptsRef.current++;

    setTimeout(async () => {
      try {
        // Clean up old instance
        if (recordTranscribeRef.current) {
          await stopRecording();
          recordTranscribeRef.current = null;
        }
        
        // Initialize new instance
        await initializeTranscription();
      } catch (error) {
        console.error('Reconnection failed:', error);
        scheduleReconnect();
      }
    }, finalConfig.reconnectDelay * reconnectAttemptsRef.current);
  }, [finalConfig.reconnectAttempts, finalConfig.reconnectDelay, initializeTranscription]);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      if (isRecording) return false;

      // Check network connectivity
      if (!isOnline) {
        throw new Error('No internet connection available for transcription');
      }

      // Check if microphone API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Voice input is not supported in this browser. Try Chrome, Firefox, or Safari.');
      }

      // Check microphone permission with direct getUserMedia test
      try {
        // Directly test getUserMedia - more reliable than permissions API
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        
        // Stop the stream immediately since we just needed permission
        stream.getTracks().forEach(track => track.stop());
        console.log('✅ Microphone access confirmed for transcription');
        
      } catch (mediaError: any) {
        let errorMessage = 'Microphone access failed';
        
        if (mediaError.name === 'NotAllowedError') {
          errorMessage = 'Please click "Allow" when prompted for microphone access, then try again.';
        } else if (mediaError.name === 'NotFoundError') {
          errorMessage = 'No microphone found on this device. Please connect a microphone and try again.';
        } else if (mediaError.name === 'NotSupportedError') {
          errorMessage = 'Voice input is not supported in this browser. Try using Chrome, Firefox, or Safari.';
        } else if (mediaError.name === 'NotReadableError') {
          errorMessage = 'Microphone is being used by another application. Please close other apps and try again.';
        } else if (mediaError.name === 'SecurityError') {
          errorMessage = 'For security reasons, microphone access requires HTTPS. Please use a secure connection.';
        } else if (mediaError.message) {
          errorMessage = mediaError.message;
        }
        
        console.error('Microphone access error:', mediaError);
        throw new Error(errorMessage);
      }

      // Reset state
      setCurrentTranscript('');
      setFinalTranscript('');
      setConfidence(0);
      setError(null);
      setDuration(0);
      currentTokensRef.current = [];

      // Initialize if needed
      const recordTranscribe = await initializeTranscription();
      
      // Ensure the instance is properly initialized before starting
      if (!recordTranscribe) {
        throw new Error('Failed to initialize transcription service');
      }
      
      // Validate that the RecordTranscribe instance has required methods
      if (typeof recordTranscribe.start !== 'function') {
        throw new Error('Transcription service not properly initialized - missing start method');
      }
      
      // Start recording with additional error handling
      try {
        await recordTranscribe.start();
        setIsRecording(true);
        setState(TRANSCRIPTION_STATES.LISTENING);
      } catch (startError) {
        console.error('Failed to start Soniox recording:', startError);
        
        // Try to reinitialize and start again
        recordTranscribeRef.current = null;
        const newInstance = await initializeTranscription();
        if (newInstance && typeof newInstance.start === 'function') {
          await newInstance.start();
          setIsRecording(true);
          setState(TRANSCRIPTION_STATES.LISTENING);
        } else {
          throw new Error('Unable to initialize Soniox recording service. Please check your internet connection and try again.');
        }
      }

      // Start duration timer
      const startTime = Date.now();
      durationTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setDuration(elapsed);
        
        // Auto-stop at max duration
        if (elapsed >= finalConfig.maxDuration) {
          stopRecording().catch(console.error);
        }
      }, 100);

      // Start volume monitoring (if available)
      startVolumeMonitoring();

      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      setState(TRANSCRIPTION_STATES.ERROR);
      setError({
        type: 'start_failed',
        message: error.message || 'Failed to start recording',
        details: error
      });
      onError?.(error);
      return false;
    }
  }, [isRecording, initializeTranscription, finalConfig.maxDuration, onError]);

  // Stop recording
  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording || !recordTranscribeRef.current) return false;

      setState(TRANSCRIPTION_STATES.PROCESSING);
      
      // Stop recording
      await recordTranscribeRef.current.stop();
      setIsRecording(false);

      // Clear timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      stopVolumeMonitoring();

      return true;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setState(TRANSCRIPTION_STATES.ERROR);
      setError({
        type: 'stop_failed',
        message: error.message || 'Failed to stop recording',
        details: error
      });
      onError?.(error);
      return false;
    }
  }, [isRecording, onError]);

  // Cancel recording
  const cancelRecording = useCallback(async () => {
    try {
      if (!isRecording || !recordTranscribeRef.current) return false;

      // Cancel recording
      await recordTranscribeRef.current.cancel();
      setIsRecording(false);
      setState(TRANSCRIPTION_STATES.IDLE);

      // Reset state
      setCurrentTranscript('');
      setFinalTranscript('');
      setConfidence(0);
      setError(null);
      setDuration(0);

      // Clear timers
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      
      stopVolumeMonitoring();

      return true;
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      onError?.(error);
      return false;
    }
  }, [isRecording, onError]);

  // Volume monitoring
  const startVolumeMonitoring = useCallback(() => {
    // This would require access to the audio stream
    // Implementation depends on browser capabilities
    // For now, we'll simulate volume levels
    volumeMeterRef.current = setInterval(() => {
      if (isRecording) {
        // Simulate volume levels (in real implementation, get from audio stream)
        setVolume(Math.random() * 100);
      }
    }, 100);
  }, [isRecording]);

  const stopVolumeMonitoring = useCallback(() => {
    if (volumeMeterRef.current) {
      clearInterval(volumeMeterRef.current);
      volumeMeterRef.current = null;
    }
    setVolume(0);
  }, []);

  // Toggle recording
  const toggleRecording = useCallback(async () => {
    if (isRecording) {
      return await stopRecording();
    } else {
      return await startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Reset to initial state
  const reset = useCallback(async () => {
    await cancelRecording();
    setError(null);
    setState(TRANSCRIPTION_STATES.IDLE);
    reconnectAttemptsRef.current = 0;
  }, [cancelRecording]);

  // Network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (volumeMeterRef.current) {
        clearInterval(volumeMeterRef.current);
      }
      if (recordTranscribeRef.current) {
        recordTranscribeRef.current.cancel().catch(console.error);
      }
    };
  }, []);

  // Return hook interface
  return {
    // State
    state,
    isRecording,
    currentTranscript,
    finalTranscript,
    confidence,
    error,
    duration,
    volume,
    isOnline,
    
    // Actions
    startRecording,
    stopRecording,
    cancelRecording,
    toggleRecording,
    reset,
    
    // Utilities
    isConnected: state !== TRANSCRIPTION_STATES.ERROR && recordTranscribeRef.current !== null,
    isProcessing: state === TRANSCRIPTION_STATES.PROCESSING,
    canRecord: state === TRANSCRIPTION_STATES.IDLE || state === TRANSCRIPTION_STATES.SUCCESS,
    
    // Configuration
    config: finalConfig,
    
    // Constants
    STATES: TRANSCRIPTION_STATES
  };
}

export default useSonioxTranscription;