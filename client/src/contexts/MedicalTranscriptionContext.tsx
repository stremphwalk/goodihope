// @ts-nocheck
/**
 * MedicalTranscriptionContext
 * Global context for managing medical transcription across the application
 * Integrates with existing LanguageContext and provides section-aware transcription
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { detectMedicalSection, getTranscriptionTips } from '@/lib/transcriptionUtils';
import useSonioxTranscription, { TRANSCRIPTION_STATES } from '@/hooks/useSonioxTranscription';

// Transcription preferences
const DEFAULT_PREFERENCES = {
  confidence: 0.7,
  autoInsert: true,
  showOverlay: true,
  enableKeyboardShortcuts: true,
  medicalOptimization: true,
  voiceActivityDetection: true,
  maxDuration: 30000, // 30 seconds
  autoFinalize: true
};

// Create context
const MedicalTranscriptionContext = createContext(null);

/**
 * Medical Transcription Provider Component
 * Manages global transcription state and provides context to child components
 */
export function MedicalTranscriptionProvider({ children }) {
  const { language, t } = useLanguage();
  
  // Global transcription state
  const [isGloballyEnabled, setIsGloballyEnabled] = useState(true);
  const [currentSection, setCurrentSection] = useState('general');
  const [activeTranscriptionId, setActiveTranscriptionId] = useState(null);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [transcriptionHistory, setTranscriptionHistory] = useState([]);
  const [lastError, setLastError] = useState(null);
  
  // Session management
  const [sessions, setSessions] = useState(new Map());
  const sessionCounterRef = useRef(0);
  
  // Keyboard shortcut state
  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(true);
  const activeKeysRef = useRef(new Set());

  // Current active transcription instance
  const [activeTranscription, setActiveTranscription] = useState(null);

  // Create a new transcription session
  const createTranscriptionSession = useCallback((options = {}) => {
    const sessionId = `transcription_${++sessionCounterRef.current}`;
    const section = options.section || detectMedicalSection(options.componentName, window.location.pathname);
    
    const session = {
      id: sessionId,
      section,
      createdAt: Date.now(),
      isActive: false,
      results: [],
      ...options
    };
    
    setSessions(prev => new Map(prev).set(sessionId, session));
    return sessionId;
  }, []);

  // Update session
  const updateSession = useCallback((sessionId, updates) => {
    setSessions(prev => {
      const newSessions = new Map(prev);
      const session = newSessions.get(sessionId);
      if (session) {
        newSessions.set(sessionId, { ...session, ...updates });
      }
      return newSessions;
    });
  }, []);

  // Remove session
  const removeSession = useCallback((sessionId) => {
    setSessions(prev => {
      const newSessions = new Map(prev);
      newSessions.delete(sessionId);
      return newSessions;
    });
    
    if (activeTranscriptionId === sessionId) {
      setActiveTranscriptionId(null);
      setActiveTranscription(null);
    }
  }, [activeTranscriptionId]);

  // Handle transcription result
  const handleTranscriptionResult = useCallback((sessionId, result) => {
    // Update session with result
    updateSession(sessionId, {
      results: [...(sessions.get(sessionId)?.results || []), result],
      lastResult: result,
      lastUpdated: Date.now()
    });
    
    // Add to global history
    setTranscriptionHistory(prev => [...prev, {
      sessionId,
      result,
      timestamp: Date.now(),
      section: sessions.get(sessionId)?.section || currentSection
    }].slice(-100)); // Keep last 100 results
    
    // Clear any previous errors
    setLastError(null);
  }, [sessions, updateSession, currentSection]);

  // Handle transcription error
  const handleTranscriptionError = useCallback((sessionId, error) => {
    updateSession(sessionId, {
      lastError: error,
      lastUpdated: Date.now()
    });
    
    setLastError({
      sessionId,
      error,
      timestamp: Date.now()
    });
  }, [updateSession]);

  // Create transcription instance with context
  const createTranscription = useCallback((options = {}) => {
    const sessionId = createTranscriptionSession(options);
    const session = sessions.get(sessionId);
    
    const transcriptionOptions = {
      section: session?.section || currentSection,
      config: {
        ...DEFAULT_PREFERENCES,
        ...preferences,
        ...options.config
      },
      onTranscriptionResult: (result) => {
        handleTranscriptionResult(sessionId, result);
        options.onResult?.(result, sessionId);
      },
      onError: (error) => {
        handleTranscriptionError(sessionId, error);
        options.onError?.(error, sessionId);
      }
    };

    // Note: We can't call useSonioxTranscription here as it violates Rules of Hooks
    // Instead, we'll return the sessionId and options, and handle transcription creation elsewhere
    return {
      sessionId,
      transcriptionOptions
    };
  }, [createTranscriptionSession, sessions, currentSection, preferences, handleTranscriptionResult, handleTranscriptionError]);

  // Set active transcription
  const setActiveSession = useCallback((sessionId, transcription = null) => {
    // Deactivate previous session
    if (activeTranscriptionId && activeTranscriptionId !== sessionId) {
      updateSession(activeTranscriptionId, { isActive: false });
      if (activeTranscription && activeTranscription.isRecording) {
        activeTranscription.stopRecording().catch(console.error);
      }
    }
    
    setActiveTranscriptionId(sessionId);
    setActiveTranscription(transcription);
    
    if (sessionId) {
      updateSession(sessionId, { isActive: true });
      const session = sessions.get(sessionId);
      if (session?.section !== currentSection) {
        setCurrentSection(session.section);
      }
    }
  }, [activeTranscriptionId, activeTranscription, updateSession, sessions, currentSection]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
    
    // Persist preferences to localStorage
    try {
      localStorage.setItem('medicalTranscriptionPreferences', JSON.stringify({
        ...preferences,
        ...newPreferences
      }));
    } catch (error) {
      console.warn('Failed to save transcription preferences:', error);
    }
  }, [preferences]);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('medicalTranscriptionPreferences');
      if (saved) {
        const parsedPreferences = JSON.parse(saved);
        setPreferences(prev => ({
          ...prev,
          ...parsedPreferences
        }));
      }
    } catch (error) {
      console.warn('Failed to load transcription preferences:', error);
    }
  }, []);

  // Global keyboard shortcuts
  const handleGlobalKeyDown = useCallback((event) => {
    if (!keyboardShortcutsEnabled || !isGloballyEnabled) return;
    
    const { key, code } = event;
    activeKeysRef.current.add(code);
    
    // Space key to toggle recording (if not in an input field)
    if (key === ' ' && !['INPUT', 'TEXTAREA'].includes(event.target.tagName)) {
      const isModifierPressed = event.ctrlKey || event.metaKey || event.altKey;
      
      if (!isModifierPressed && activeTranscription) {
        event.preventDefault();
        event.stopPropagation();
        activeTranscription.toggleRecording().catch(console.error);
      }
    }
    
    // Escape to cancel recording
    if (key === 'Escape' && activeTranscription && activeTranscription.isRecording) {
      event.preventDefault();
      activeTranscription.cancelRecording().catch(console.error);
    }
    
    // Ctrl/Cmd + Shift + M to toggle global transcription
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'M') {
      event.preventDefault();
      setIsGloballyEnabled(prev => !prev);
    }
  }, [keyboardShortcutsEnabled, isGloballyEnabled, activeTranscription]);

  const handleGlobalKeyUp = useCallback((event) => {
    activeKeysRef.current.delete(event.code);
  }, []);

  // Set up global keyboard listeners
  useEffect(() => {
    if (keyboardShortcutsEnabled) {
      document.addEventListener('keydown', handleGlobalKeyDown);
      document.addEventListener('keyup', handleGlobalKeyUp);
      
      return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
        document.removeEventListener('keyup', handleGlobalKeyUp);
      };
    }
  }, [keyboardShortcutsEnabled, handleGlobalKeyDown, handleGlobalKeyUp]);

  // Get tips based on current section and language
  const getCurrentTips = useCallback(() => {
    return getTranscriptionTips(currentSection, language);
  }, [currentSection, language]);

  // Get session statistics
  const getSessionStats = useCallback(() => {
    const activeSessions = Array.from(sessions.values()).filter(s => s.isActive).length;
    const totalSessions = sessions.size;
    const totalResults = transcriptionHistory.length;
    const errorRate = transcriptionHistory.filter(h => h.result.confidence < preferences.confidence).length / Math.max(totalResults, 1);
    
    return {
      activeSessions,
      totalSessions,
      totalResults,
      errorRate,
      averageConfidence: totalResults > 0 
        ? transcriptionHistory.reduce((sum, h) => sum + h.result.confidence, 0) / totalResults 
        : 0
    };
  }, [sessions, transcriptionHistory, preferences.confidence]);

  // Clear history
  const clearHistory = useCallback(() => {
    setTranscriptionHistory([]);
    setLastError(null);
  }, []);

  // Get translated text for UI
  const getText = useCallback((key, fallback = key) => {
    const translations = {
      en: {
        'transcription.enabled': 'Voice transcription enabled',
        'transcription.disabled': 'Voice transcription disabled',
        'transcription.recording': 'Recording...',
        'transcription.processing': 'Processing...',
        'transcription.error': 'Transcription error',
        'transcription.success': 'Transcription complete',
        'transcription.tips': 'Transcription tips',
        'transcription.shortcuts': 'Keyboard shortcuts'
      },
      fr: {
        'transcription.enabled': 'Transcription vocale activée',
        'transcription.disabled': 'Transcription vocale désactivée',
        'transcription.recording': 'Enregistrement...',
        'transcription.processing': 'Traitement...',
        'transcription.error': 'Erreur de transcription',
        'transcription.success': 'Transcription terminée',
        'transcription.tips': 'Conseils de transcription',
        'transcription.shortcuts': 'Raccourcis clavier'
      }
    };
    
    return translations[language]?.[key] || t(key) || fallback;
  }, [language, t]);

  // Context value
  const contextValue = {
    // State
    isGloballyEnabled,
    currentSection,
    activeTranscriptionId,
    activeTranscription,
    preferences,
    transcriptionHistory,
    lastError,
    sessions: Array.from(sessions.values()),
    
    // Actions
    setIsGloballyEnabled,
    setCurrentSection,
    createTranscriptionSession,
    createTranscription,
    updateSession,
    removeSession,
    setActiveSession,
    updatePreferences,
    clearHistory,
    
    // Utilities
    getCurrentTips,
    getSessionStats,
    getText,
    
    // Keyboard shortcuts
    keyboardShortcutsEnabled,
    setKeyboardShortcutsEnabled,
    
    // Constants
    STATES: TRANSCRIPTION_STATES,
    DEFAULT_PREFERENCES
  };

  return (
    <MedicalTranscriptionContext.Provider value={contextValue}>
      {children}
    </MedicalTranscriptionContext.Provider>
  );
}

/**
 * Hook to use medical transcription context
 * @returns {Object} Transcription context value
 */
export function useMedicalTranscription() {
  const context = useContext(MedicalTranscriptionContext);
  if (!context) {
    throw new Error('useMedicalTranscription must be used within a MedicalTranscriptionProvider');
  }
  return context;
}

/**
 * Higher-order component to provide transcription context
 * @param {React.Component} WrappedComponent
 * @returns {React.Component} Component with transcription context
 */
export function withMedicalTranscription(WrappedComponent) {
  return function WithMedicalTranscriptionComponent(props) {
    return (
      <MedicalTranscriptionProvider>
        <WrappedComponent {...props} />
      </MedicalTranscriptionProvider>
    );
  };
}

export default MedicalTranscriptionContext;