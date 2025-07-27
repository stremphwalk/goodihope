import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { usePersistedState } from '@/hooks/usePersistedState';

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
}

const NoteStateContext = createContext<NoteStateContextType | undefined>(undefined);

interface NoteStateProviderProps {
  children: ReactNode;
}

export function NoteStateProvider({ children }: NoteStateProviderProps) {
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

  // Form data storage - using in-memory only for privacy
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
    setValue: setLivePreviewContent,
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

  const setFormData = useCallback((sectionKey: string, data: any) => {
    setFormDataInternal(prevData => ({
      ...prevData,
      [sectionKey]: data
    }));
  }, [setFormDataInternal]);

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
  }, [setFormDataInternal, clearFormDataInternal]);

  // Live preview section update
  const updateLivePreviewSection = useCallback((sectionKey: string, content: string) => {
    // This would need more sophisticated logic to update specific sections
    // For now, we'll just set the entire content
    setLivePreviewContent(content);
  }, [setLivePreviewContent]);

  // Reset all note state
  const resetNoteState = useCallback(() => {
    clearNoteType();
    clearSelectedSections();
    clearFormDataInternal();
    clearLivePreview();
  }, [clearNoteType, clearSelectedSections, clearFormDataInternal, clearLivePreview]);

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
    getAllPersistedKeys
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
    getAllPersistedKeys
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