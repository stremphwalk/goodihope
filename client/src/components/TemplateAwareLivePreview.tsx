import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, User, AlertCircle, Sparkles, Copy, RotateCcw, Eye, Edit3 } from 'lucide-react';
import { useTemplate } from '@/contexts/TemplateContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSectionById } from '@/lib/sectionLibrary';
import { DotPhraseTextarea } from '@/components/DotPhraseTextarea';

interface TemplateAwareLivePreviewProps {
  noteData?: Record<string, any>;
  className?: string;
  note?: string;
  onNoteChange?: (note: string) => void;
  onCopyNote?: () => void;
  onResetNote?: () => void;
  documentedSystems?: number;
  totalSystems?: number;
  generatedNote?: string;
}

export function TemplateAwareLivePreview({ 
  noteData = {}, 
  className = '',
  note = '',
  onNoteChange,
  onCopyNote,
  onResetNote,
  documentedSystems = 0,
  totalSystems = 0,
  generatedNote = ''
}: TemplateAwareLivePreviewProps) {
  const [isFormattedView, setIsFormattedView] = useState(true);
  const templateContext = useTemplate();
  const languageContext = useLanguage();
  
  // Defensive checks for context availability
  const { selectedTemplate, isTemplateActive, getTemplateContent } = templateContext || {
    selectedTemplate: null,
    isTemplateActive: false,
    getTemplateContent: () => null
  };
  
  const { language } = languageContext || { language: 'en' };

  const formatDate = () => {
    try {
      return new Date().toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return new Date().toISOString().split('T')[0]; // Fallback to simple date
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'patient-info': 'bg-blue-100 text-blue-800',
      'history': 'bg-green-100 text-green-800',
      'examination': 'bg-orange-100 text-orange-800',
      'results': 'bg-purple-100 text-purple-800',
      'assessment': 'bg-red-100 text-red-800',
      'plan': 'bg-indigo-100 text-indigo-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const renderTemplatePreview = () => {
    try {
      const templateContent = getTemplateContent();
      if (!templateContent) return null;

      const { sections, metadata } = templateContent;
      if (!sections || !Array.isArray(sections)) return null;
      
      const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
      const enabledSections = sortedSections.filter(section => 
        section && section.isEnabled !== false && section.sectionId
      );

    return (
      <div className="space-y-2">
        {/* Template Header - More Compact */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-purple-800 text-sm whitespace-nowrap">
            {(metadata?.name && metadata.name.trim()) || 'Template'}
          </span>
          {metadata?.category && metadata.category.trim() && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs whitespace-nowrap">
              {metadata.category.length > 15 ? `${metadata.category.substring(0, 12)}...` : metadata.category}
            </Badge>
          )}
          {metadata?.specialty && metadata.specialty.trim() && (
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs whitespace-nowrap">
              {metadata.specialty.length > 15 ? `${metadata.specialty.substring(0, 12)}...` : metadata.specialty}
            </Badge>
          )}
          <Badge variant="secondary" className="bg-purple-100 text-purple-800 text-xs whitespace-nowrap">
            {enabledSections.length} {enabledSections.length === 1 ? 'section' : 'sections'}
          </Badge>
        </div>

        {/* Template Sections - More Compact */}
        <div className="flex flex-wrap gap-1">
          {enabledSections.length === 0 ? (
            <div className="text-xs text-gray-500 italic">
              {language === 'fr' ? 'Aucune section activée' : 'No sections enabled'}
            </div>
          ) : (
            enabledSections.map((section, index) => {
              // Safety check for section structure
              if (!section || !section.sectionId) {
                return (
                  <div key={index} className="flex items-center gap-1 px-1 py-0.5 bg-red-100 rounded text-xs border border-red-200">
                    <span className="text-red-600">
                      {language === 'fr' ? 'Section invalide' : 'Invalid section'}
                    </span>
                  </div>
                );
              }
              
              const sectionDef = getSectionById(section.sectionId);
              if (!sectionDef) {
                return (
                  <div key={section.id || index} className="flex items-center gap-1 px-1 py-0.5 bg-red-100 rounded text-xs border border-red-200">
                    <span className="text-red-600">
                      {language === 'fr' ? 'Introuvable' : 'Not found'}: {section.sectionId}
                    </span>
                  </div>
                );
              }

              const Icon = sectionDef.icon;
              const userContent = noteData[section.sectionId] || '';
              const defaultContent = section.customContent || sectionDef.defaultContent || '';
              const hasContent = Boolean(userContent || defaultContent);

              return (
                <div key={section.id || `${section.sectionId}-${index}`} className="flex items-center gap-1 px-1.5 py-0.5 bg-white rounded text-xs border border-purple-200">
                  <span className="flex items-center justify-center w-3 h-3 bg-purple-500 text-white text-xs font-bold rounded-full leading-none">
                    {index + 1}
                  </span>
                  {Icon && <Icon className="w-2.5 h-2.5 text-purple-600" />}
                  <span className="font-medium text-gray-900 text-xs">{sectionDef.name}</span>
                  {hasContent && (
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title={language === 'fr' ? 'Contenu disponible' : 'Content available'} />
                  )}
                  {sectionDef.isRequired && (
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full" title={language === 'fr' ? 'Requis' : 'Required'} />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
    } catch (error) {
      console.error('Error rendering template preview:', error);
      return (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-xs">
          <span className="text-red-600">
            {language === 'fr' 
              ? 'Erreur lors du rendu du modèle' 
              : 'Error rendering template preview'
            }
          </span>
        </div>
      );
    }
  };

  const renderFormattedNote = () => {
    if (!note || !note.trim()) {
      return (
        <div className="p-8 text-center text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">
            {language === 'fr' ? 'Note vide' : 'Empty Note'}
          </h3>
          <p className="text-sm">
            {language === 'fr' ? 'Votre note apparaîtra ici' : 'Your note will appear here'}
          </p>
        </div>
      );
    }

    // Parse the note content to identify section headers
    const lines = note.split('\n');
    const sections: Array<{type: 'header' | 'content', text: string, level?: number}> = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Enhanced header detection logic
      const isHeader = (
        // Standard format: ends with : and is in uppercase
        (trimmed.endsWith(':') && trimmed === trimmed.toUpperCase() && trimmed.length > 3) ||
        // Common medical note headers (case insensitive match for known headers)
        /^(REASON FOR ADMISSION|MOTIF D['']ADMISSION|PAST MEDICAL HISTORY|ANTÉCÉDENTS MÉDICAUX|ALLERGIES|SOCIAL HISTORY|HABITUDES DE VIE|MEDICATIONS|MÉDICAMENTS|HISTORY OF PRESENTING ILLNESS|HISTOIRE DE LA MALADIE ACTUELLE|REVIEW OF SYSTEMS|REVUE DES SYSTÈMES|PHYSICAL EXAMINATION|EXAMEN PHYSIQUE|LABORATORY RESULTS|RÉSULTATS DE LABORATOIRE|IMAGING|IMAGERIE|CLINICAL IMPRESSION|IMPRESSION CLINIQUE|PLAN|NOTE TYPE|TYPE DE NOTE|CONSULTATION|ÉVOLUTION|PROGRESS NOTE|NOTE D['']ÉVOLUTION|MÉDICAMENTS À DOMICILE|HOME MEDICATIONS|MÉDICAMENTS HOSPITALIERS|HOSPITAL MEDICATIONS)\s*:?\s*$/i.test(trimmed) ||
        // Headers that contain common medical abbreviations in all caps
        /^(PMH|HPI|ROS|PE|LAB|LABS)\s*:?\s*$/i.test(trimmed)
      );
      
      if (isHeader) {
        // Ensure header ends with colon for consistent formatting
        const headerText = trimmed.endsWith(':') ? trimmed : trimmed + ':';
        sections.push({type: 'header', text: headerText});
      } else if (trimmed.length > 0) {
        sections.push({type: 'content', text: line});
      } else {
        // Empty line
        sections.push({type: 'content', text: ''});
      }
    }

    return (
      <div className="space-y-4 p-4">
        {sections.map((section, index) => {
          if (section.type === 'header') {
            return (
              <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                <h4 className="font-bold text-lg text-purple-800 bg-purple-50 px-3 py-2 rounded">
                  {section.text}
                </h4>
              </div>
            );
          } else {
            return (
              <div key={index} className="ml-8">
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {section.text}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  const renderDefaultPreview = () => {
    const defaultSections = [
      'note-type', 'pmh', 'meds', 'allergies-social', 'hpi', 
      'physical-exam', 'labs', 'imagery', 'impression'
    ];

    return (
      <div className="space-y-4">
        {/* Default Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                {language === 'fr' ? 'Note Médicale' : 'Medical Note'}
              </h3>
              <p className="text-blue-100 text-sm">
                {language === 'fr' ? 'Structure par défaut' : 'Default Structure'}
              </p>
            </div>
          </div>
        </div>

        {/* Default Sections */}
        <div className="space-y-3">
          {defaultSections.map((sectionKey, index) => {
            const sectionDef = getSectionById(sectionKey);
            if (!sectionDef) return null;

            const Icon = sectionDef.icon;
            const content = noteData[sectionKey] || '';

            return (
              <div key={sectionKey} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                    {index + 1}
                  </span>
                  <Icon className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">{sectionDef.name}</h4>
                  <Badge variant="outline" className={getCategoryColor(sectionDef.category)}>
                    {sectionDef.category}
                  </Badge>
                </div>
                
                {content ? (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm">
                    <div className="text-gray-700 whitespace-pre-wrap">{content}</div>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded border text-sm text-gray-500 italic">
                    {language === 'fr' 
                      ? 'Section en attente de contenu' 
                      : 'Section awaiting content'
                    }
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const hasGeneratedNote = Boolean(generatedNote && generatedNote.trim() && generatedNote !== note);

  return (
    <div className={`h-full flex flex-col bg-white border border-gray-200 rounded ${className}`}>
      {/* Header with actions */}
      <div className="border-b bg-gray-50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium whitespace-nowrap">
              {language === 'fr' ? 'Éditeur de Note' : 'Note Editor'}
            </span>
            {isTemplateActive && (
              <div className="flex items-center gap-1">
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="text-purple-600 font-medium text-sm whitespace-nowrap">
                  {language === 'fr' ? 'Modèle actif' : 'Template Active'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {isTemplateActive && (
              <Button
                onClick={() => setIsFormattedView(!isFormattedView)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                {isFormattedView ? (
                  <>
                    <Edit3 className="w-4 h-4" />
                    {language === 'fr' ? 'Éditer' : 'Edit'}
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    {language === 'fr' ? 'Aperçu' : 'Preview'}
                  </>
                )}
              </Button>
            )}
            {onCopyNote && (
              <Button
                onClick={() => {
                  try {
                    onCopyNote();
                  } catch (error) {
                    console.error('Error copying note:', error);
                  }
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                {language === 'fr' ? 'Copier' : 'Copy'}
              </Button>
            )}
            {hasGeneratedNote && onResetNote && (
              <Button
                onClick={() => {
                  try {
                    onResetNote();
                  } catch (error) {
                    console.error('Error resetting note:', error);
                  }
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                {language === 'fr' ? 'Réinitialiser' : 'Reset'}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{formatDate()}</span>
          </div>
          <div className="whitespace-nowrap">
            {(note || '').length} chars • {documentedSystems || 0}/{totalSystems || 0} systems
          </div>
        </div>
      </div>

      {/* Template Structure Preview (if active) - Compact */}
      {isTemplateActive && (
        <div className="border-b bg-purple-50 p-2">
          <div className="text-xs font-medium text-purple-800 mb-1">
            {language === 'fr' ? 'Structure du modèle:' : 'Template Structure:'}
          </div>
          {renderTemplatePreview()}
        </div>
      )}

      {/* Main Note Editor */}
      <div className="flex-1 overflow-auto">
        {isTemplateActive && isFormattedView ? (
          // When template is active and in formatted view, show formatted note with section headers
          <div className="h-full">
            {renderFormattedNote()}
          </div>
        ) : (
          // When no template is active or in edit mode, show editable textarea
          <DotPhraseTextarea
            value={note || ''}
            onChange={(value) => {
              try {
                if (onNoteChange) {
                  onNoteChange(value);
                }
              } catch (error) {
                console.error('Error handling note change:', error);
              }
            }}
            placeholder={language === 'fr' ? 'Votre note clinique apparaîtra ici...' : 'Your clinical note will appear here...'}
            className="w-full h-full resize-none border-0 rounded-none focus:ring-0 focus:border-0 p-4 text-sm font-mono leading-relaxed"
          />
        )}
      </div>

      {/* Help Text */}
      <div className="border-t p-3 bg-gray-50 text-xs text-gray-600">
        {isTemplateActive ? (
          isFormattedView ? (
            language === 'fr' 
              ? 'Vue formatée avec en-têtes de sections. Cliquez sur "Éditer" pour modifier le contenu.'
              : 'Formatted view with section headers. Click "Edit" to modify content.'
          ) : (
            language === 'fr' 
              ? 'Mode édition. Cliquez sur "Aperçu" pour voir les en-têtes de sections formatées.'
              : 'Edit mode. Click "Preview" to see formatted section headers.'
          )
        ) : (
          language === 'fr'
            ? 'Cette note utilise la structure par défaut. Sélectionnez un modèle dans Templates > Sélectionner un modèle pour personnaliser.'
            : 'This note uses the default structure. Select a template in Templates > Select Template to customize.'
        )}
      </div>
    </div>
  );
}