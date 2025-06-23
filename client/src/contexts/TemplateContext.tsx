import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Template } from '@shared/schema';
import { TemplateContent } from '@/lib/sectionLibrary';

interface TemplateContextValue {
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
  isTemplateActive: boolean;
  getTemplateContent: () => TemplateContent | null;
  clearTemplate: () => void;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(undefined);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  // Check if template is active and has valid content
  const isTemplateActive = selectedTemplate !== null && 
    selectedTemplate.content !== null && 
    selectedTemplate.content !== undefined;

  // Get template content safely
  const getTemplateContent = (): TemplateContent | null => {
    if (!selectedTemplate?.content) return null;
    
    try {
      // If content is already parsed, return it
      if (typeof selectedTemplate.content === 'object') {
        return selectedTemplate.content as TemplateContent;
      }
      
      // If content is string, parse it
      if (typeof selectedTemplate.content === 'string') {
        return JSON.parse(selectedTemplate.content) as TemplateContent;
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing template content:', error);
      return null;
    }
  };

  // Clear template selection
  const clearTemplate = () => {
    setSelectedTemplate(null);
  };

  // Log template changes for debugging
  useEffect(() => {
    if (selectedTemplate) {
      console.log('Template selected:', selectedTemplate.name);
    } else {
      console.log('Template cleared');
    }
  }, [selectedTemplate]);

  const value: TemplateContextValue = {
    selectedTemplate,
    setSelectedTemplate,
    isTemplateActive,
    getTemplateContent,
    clearTemplate,
  };

  return (
    <TemplateContext.Provider value={value}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
}