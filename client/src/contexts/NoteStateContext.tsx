import React, { createContext, useContext, ReactNode, useMemo, useCallback, useEffect, useRef } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';
import { useAuth } from '@/contexts/AuthContext';

interface NoteState {
  noteType: string;
  selectedSections: string[];
  formData: Record<string, any>;
  livePreviewContent: string;
}

interface NoteStateContextType {
  // Note type management
  noteType: string;
  setNoteType: (type: string) => void;
  selectedSections: string[];
  setSelectedSections: (sections: string[]) => void;
  
  // Form data management
  getFormData: (sectionKey: string) => any;
  setFormData: (sectionKey: string, data: any) => void;
  clearFormData: (sectionKey?: string) => void;
  
  // Live preview management
  livePreviewContent: string;
  setLivePreviewContent: (content: string) => void;
  updateLivePreviewSection: (sectionKey: string, content: string) => void;
  
  // Reset functionality
  resetNoteState: () => void;
  
  // Debug helpers
  getAllPersistedKeys: () => string[];

  // Persistence / lifecycle
  isDirty: boolean;
  lastSaved: number | null;
  saveNow: () => void;
}

const NoteStateContext = createContext<NoteStateContextType | undefined>(undefined);

interface NoteStateProviderProps {
  children: ReactNode;
}

export function NoteStateProvider({ children }: NoteStateProviderProps) {
  const auth = useAuth();
  const userId = auth.user?.id || 'anonymous';
  const storageKey = `arinote_state_${userId}`;
  const tabIdRef = useRef<string>(`${Date.now()}_${Math.random().toString(36).slice(2)}`);

  // Dirty tracking
  const [isDirty, setIsDirtyInternal] = React.useState<boolean>(false);
  const [lastSaved, setLastSaved] = React.useState<number | null>(null);

  // Note type and sections with session backup enabled for tab persistence
  const {
    value: noteType,
    setValue: setNoteType,
    clearPersistedState: clearNoteType,
    getAllPersistedKeys
  } = usePersistedState<string>(
    'medical_note_type',
    '',
    undefined,
    undefined,
    true // Enable session backup
  );

  const {
    value: selectedSections,
    setValue: setSelectedSections,
    clearPersistedState: clearSelectedSections
  } = usePersistedState<string[]>(
    'medical_note_sections',
    [],
    undefined,
    undefined,
    true // Enable session backup
  );

  // Form data storage - using in-memory only for privacy (we will handle critical persistence separately)
  const {
    value: formData,
    setValue: setFormDataInternal,
    clearPersistedState: clearFormDataInternal
  } = usePersistedState<Record<string, any>>(
    'medical_note_form_data',
    {},
    undefined,
    undefined,
    false // No session backup for form data for privacy
  );

  // Live preview content
  const {
    value: livePreviewContent,
    setValue: setLivePreviewContentInternal,
    clearPersistedState: clearLivePreview
  } = usePersistedState<string>(
    'medical_note_live_preview',
    '',
    undefined,
    undefined,
    false // No session backup for live preview
  );

  // Form data management functions
  const getFormData = useCallback((sectionKey: string) => {
    return formData[sectionKey] || '';
  }, [formData]);

  const markDirty = useCallback(() => setIsDirtyInternal(true), []);

  const setFormData = useCallback((sectionKey: string, data: any) => {
    setFormDataInternal(prevData => ({
      ...prevData,
      [sectionKey]: data
    }));
    markDirty();
  }, [setFormDataInternal, markDirty]);

  const clearFormData = useCallback((sectionKey?: string) => {
    if (sectionKey) {
      setFormDataInternal(prevData => {
        const newData = { ...prevData };
        delete newData[sectionKey];
        return newData;
      });
    } else {
      clearFormDataInternal();
    }
    markDirty();
  }, [setFormDataInternal, clearFormDataInternal, markDirty]);

  // Live preview section update
  const updateLivePreviewSection = useCallback((sectionKey: string, content: string) => {
    setLivePreviewContentInternal(content);
    markDirty();
  }, [setLivePreviewContentInternal, markDirty]);

  const setLivePreviewContent = useCallback((content: string) => {
    setLivePreviewContentInternal(content);
    markDirty();
  }, [setLivePreviewContentInternal, markDirty]);

  // Reset all note state
  const resetNoteState = useCallback(() => {
    clearNoteType();
    clearSelectedSections();
    clearFormDataInternal();
    clearLivePreview();
    setIsDirtyInternal(false);
    setLastSaved(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  }, [clearNoteType, clearSelectedSections, clearFormDataInternal, clearLivePreview, storageKey]);

  // Auto-save (debounced) to localStorage with timestamps
  const saveTimeoutRef = useRef<number | null>(null);
  const pendingSaveRef = useRef<boolean>(false);

  const performSave = useCallback(() => {
    try {
      const payload = {
        noteType,
        selectedSections,
        formData,
        livePreviewContent,
        lastSaved: Date.now(),
        tabId: tabIdRef.current,
        version: 1
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastSaved(payload.lastSaved);
      setIsDirtyInternal(false);
      pendingSaveRef.current = false;
    } catch (error) {
      // Swallow errors (e.g., storage full), but keep dirty so user is warned
      console.warn('Auto-save failed:', error);
    }
  }, [noteType, selectedSections, formData, livePreviewContent, storageKey]);

  const scheduleSave = useCallback((delayMs: number = 600) => {
    pendingSaveRef.current = true;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    // Use window.setTimeout to get numeric ID compatible with clearTimeout typing
    saveTimeoutRef.current = window.setTimeout(() => {
      performSave();
      saveTimeoutRef.current = null;
    }, delayMs);
  }, [performSave]);

  const saveNow = useCallback(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    performSave();
  }, [performSave]);

  // Debounce saves on changes
  useEffect(() => {
    if (isDirty) {
      scheduleSave(800);
    }
  }, [isDirty, formData, livePreviewContent, noteType, selectedSections, scheduleSave]);

  // Restore from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        noteType?: string;
        selectedSections?: string[];
        formData?: Record<string, any>;
        livePreviewContent?: string;
        lastSaved?: number;
      };

      // Only restore if our current content is empty/minimal
      const currentNote = (formData && typeof formData['note'] === 'string') ? formData['note'] : '';
      const savedNote = (saved && saved.formData && typeof saved.formData['note'] === 'string') ? saved.formData['note'] : '';

      if ((!currentNote || currentNote.trim().length === 0) && savedNote && savedNote.trim().length > 0) {
        // Apply saved snapshot
        if (saved.noteType !== undefined) setNoteType(saved.noteType);
        if (saved.selectedSections !== undefined) setSelectedSections(saved.selectedSections);
        if (saved.formData !== undefined) setFormDataInternal(saved.formData);
        if (saved.livePreviewContent !== undefined) setLivePreviewContentInternal(saved.livePreviewContent);
        if (typeof saved.lastSaved === 'number') setLastSaved(saved.lastSaved);
        setIsDirtyInternal(false);
      }
    } catch (error) {
      console.warn('Failed to restore from localStorage:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Multi-tab coordination: react to storage events
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== storageKey || !e.newValue) return;
      try {
        const remote = JSON.parse(e.newValue) as { lastSaved?: number; formData?: Record<string, any>; noteType?: string; selectedSections?: string[]; livePreviewContent?: string; tabId?: string };
        // If remote change is newer and we are not dirty, adopt it
        if (typeof remote.lastSaved === 'number' && (!lastSaved || remote.lastSaved > lastSaved)) {
          if (!isDirty) {
            if (remote.noteType !== undefined) setNoteType(remote.noteType);
            if (remote.selectedSections !== undefined) setSelectedSections(remote.selectedSections);
            if (remote.formData !== undefined) setFormDataInternal(remote.formData);
            if (remote.livePreviewContent !== undefined) setLivePreviewContentInternal(remote.livePreviewContent);
            setLastSaved(remote.lastSaved);
          }
          // If dirty, prefer local changes; we'll save later
        }
      } catch (err) {
        console.warn('Failed to parse storage event data:', err);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [isDirty, lastSaved, setFormDataInternal, setLivePreviewContentInternal, setNoteType, setSelectedSections, storageKey]);

  // Save on blur/visibility change
  useEffect(() => {
    const handleBlur = () => {
      if (isDirty || pendingSaveRef.current) saveNow();
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && (isDirty || pendingSaveRef.current)) {
        saveNow();
      }
    };
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isDirty, saveNow]);

  // Warn on unload if dirty
  useEffect(() => {
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [isDirty]);

  // Memoize the context value to prevent unnecessary re-renders
  const value: NoteStateContextType = useMemo(() => ({
    noteType,
    setNoteType,
    selectedSections,
    setSelectedSections,
    getFormData,
    setFormData,
    clearFormData,
    livePreviewContent,
    setLivePreviewContent,
    updateLivePreviewSection,
    resetNoteState,
    getAllPersistedKeys,
    isDirty,
    lastSaved,
    saveNow
  }), [
    noteType,
    setNoteType,
    selectedSections,
    setSelectedSections,
    getFormData,
    setFormData,
    clearFormData,
    livePreviewContent,
    setLivePreviewContent,
    updateLivePreviewSection,
    resetNoteState,
    getAllPersistedKeys,
    isDirty,
    lastSaved,
    saveNow
  ]);

  return (
    <NoteStateContext.Provider value={value}>
      {children}
    </NoteStateContext.Provider>
  );
}

export function useNoteState() {
  const context = useContext(NoteStateContext);
  if (context === undefined) {
    throw new Error('useNoteState must be used within a NoteStateProvider');
  }
  return context;
}

// Export types for external use
export type { NoteState, NoteStateContextType };