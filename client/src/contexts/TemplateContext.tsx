import React, { createContext, useContext, useState, useEffect } from 'react';
import { type Template } from '@shared/schema';
import { TemplateContent, getSectionById } from '@/lib/sectionLibrary';

interface TemplateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface TemplateContextValue {
  selectedTemplate: Template | null;
  setSelectedTemplate: (template: Template | null) => void;
  isTemplateActive: boolean;
  getTemplateContent: () => TemplateContent | null;
  clearTemplate: () => void;
  validateTemplate: (template: Template) => TemplateValidationResult;
  getValidationResult: () => TemplateValidationResult | null;
}

const TemplateContext = createContext<TemplateContextValue | undefined>(undefined);

export function TemplateProvider({ children }: { children: React.ReactNode }) {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [validationResult, setValidationResult] = useState<TemplateValidationResult | null>(null);

  // Validate template structure and sections
  const validateTemplate = (template: Template): TemplateValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check if template has content
      if (!template.content) {
        errors.push('Template has no content');
        return { isValid: false, errors, warnings };
      }

      // Parse template content
      let templateContent: TemplateContent;
      try {
        if (typeof template.content === 'string') {
          templateContent = JSON.parse(template.content);
        } else {
          templateContent = template.content as TemplateContent;
        }
      } catch (parseError) {
        errors.push('Template content is not valid JSON');
        return { isValid: false, errors, warnings };
      }

      // Validate template structure
      if (!templateContent.sections || !Array.isArray(templateContent.sections)) {
        errors.push('Template sections is not an array');
      }

      if (!templateContent.metadata) {
        errors.push('Template metadata is missing');
      } else {
        if (!templateContent.metadata.name || !templateContent.metadata.name.trim()) {
          warnings.push('Template name is empty');
        }
        if (!templateContent.metadata.category) {
          warnings.push('Template category is missing');
        }
      }

      // Validate sections
      if (templateContent.sections) {
        const sectionIds = new Set<string>();
        
        templateContent.sections.forEach((section, index) => {
          // Check required fields
          if (!section.sectionId) {
            errors.push(`Section ${index + 1} is missing sectionId`);
          } else {
            // Check for duplicate section IDs
            if (sectionIds.has(section.sectionId)) {
              warnings.push(`Duplicate section ID: ${section.sectionId}`);
            }
            sectionIds.add(section.sectionId);

            // Validate section exists in library
            const sectionDef = getSectionById(section.sectionId);
            if (!sectionDef) {
              warnings.push(`Unknown section ID: ${section.sectionId}`);
            }
          }

          if (typeof section.order !== 'number') {
            warnings.push(`Section ${section.sectionId || index + 1} has invalid order`);
          }

          if (typeof section.isEnabled !== 'boolean') {
            warnings.push(`Section ${section.sectionId || index + 1} has invalid isEnabled value`);
          }
        });

        // Check for enabled sections
        const enabledSections = templateContent.sections.filter(s => s.isEnabled !== false);
        if (enabledSections.length === 0) {
          warnings.push('Template has no enabled sections');
        }

        // Check section ordering
        const orders = enabledSections.map(s => s.order || 0);
        const sortedOrders = [...orders].sort((a, b) => a - b);
        if (JSON.stringify(orders) !== JSON.stringify(sortedOrders)) {
          warnings.push('Section ordering may be inconsistent');
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, errors, warnings };
    }
  };

  // Check if template is active and valid
  const isTemplateActive = selectedTemplate !== null && 
    selectedTemplate.content !== null && 
    selectedTemplate.content !== undefined &&
    (validationResult?.isValid ?? true); // Allow if not validated yet

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

  // Enhanced template setter with validation
  const setSelectedTemplateWithValidation = (template: Template | null) => {
    if (template) {
      const validation = validateTemplate(template);
      setValidationResult(validation);
      
      if (validation.errors.length > 0) {
        console.warn('Template has validation errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.warn('Template has validation warnings:', validation.warnings);
      }
    } else {
      setValidationResult(null);
    }
    
    setSelectedTemplate(template);
  };

  // Clear template selection
  const clearTemplate = () => {
    setSelectedTemplate(null);
    setValidationResult(null);
  };

  // Get current validation result
  const getValidationResult = () => validationResult;

  // Log template changes and validation for debugging
  useEffect(() => {
    if (selectedTemplate) {
      console.log('Template selected:', selectedTemplate.name);
      if (validationResult) {
        console.log('Validation result:', validationResult);
      }
    } else {
      console.log('Template cleared');
    }
  }, [selectedTemplate, validationResult]);

  const value: TemplateContextValue = {
    selectedTemplate,
    setSelectedTemplate: setSelectedTemplateWithValidation,
    isTemplateActive,
    getTemplateContent,
    clearTemplate,
    validateTemplate,
    getValidationResult,
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