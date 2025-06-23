import React, { useState, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Plus, GripVertical, Eye, EyeOff, Settings, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  SECTION_LIBRARY, 
  SectionDefinition, 
  TemplateSection, 
  TemplateContent,
  createDefaultTemplateContent,
  getSectionsByCategory
} from '@/lib/sectionLibrary';
import { type NoteType, type NoteSubtype } from '@shared/schema';
import { NotePreview } from './NotePreview';

interface TemplateBuilderProps {
  content: TemplateContent;
  onChange: (content: TemplateContent) => void;
  onClose: () => void;
  onSave?: (content: TemplateContent) => Promise<void>;
}

export function TemplateBuilder({ content, onChange, onClose, onSave }: TemplateBuilderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [configPanelOpen, setConfigPanelOpen] = useState(false);
  
  // Template configuration state
  const [templateName, setTemplateName] = useState(content.metadata.name || '');
  const [templateDescription, setTemplateDescription] = useState(content.metadata.description || '');
  const [templateCategory, setTemplateCategory] = useState(content.metadata.category || 'admission');
  const [templateSpecialty, setTemplateSpecialty] = useState(content.metadata.specialty || '');
  const [compatibleNoteTypes, setCompatibleNoteTypes] = useState<NoteType[]>(
    (content.metadata as any).compatibleNoteTypes || ['admission']
  );
  const [compatibleSubtypes, setCompatibleSubtypes] = useState<NoteSubtype[]>(
    (content.metadata as any).compatibleSubtypes || ['general']
  );

  // Internal Medicine specialties
  const internalMedicineSpecialties = [
    { value: '', label: 'Select Specialty' },
    { value: 'internal-medicine', label: 'Internal Medicine (General)' },
    { value: 'cardiology', label: 'Cardiology' },
    { value: 'gastroenterology', label: 'Gastroenterology' },
    { value: 'nephrology', label: 'Nephrology' },
    { value: 'endocrinology', label: 'Endocrinology' },
    { value: 'pulmonology', label: 'Pulmonology' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'oncology', label: 'Oncology' },
    { value: 'rheumatology', label: 'Rheumatology' },
    { value: 'infectious-disease', label: 'Infectious Disease' },
    { value: 'critical-care', label: 'Critical Care' },
    { value: 'geriatrics', label: 'Geriatrics' }
  ];
  
  // Section default content state
  const [sectionDefaults, setSectionDefaults] = useState<Record<string, string>>(() => {
    // Initialize with existing defaults or empty
    const defaults: Record<string, string> = {};
    if (Array.isArray(content.sections)) {
      content.sections.forEach(section => {
        defaults[section.sectionId] = section.customContent || '';
      });
    }
    return defaults;
  });

  const categories = [
    { id: 'all', name: 'All Sections' },
    { id: 'patient-info', name: 'Patient Info' },
    { id: 'history', name: 'History' },
    { id: 'examination', name: 'Examination' },
    { id: 'results', name: 'Results' },
    { id: 'assessment', name: 'Assessment' },
    { id: 'plan', name: 'Plan' }
  ];

  // Filter sections based on category and search
  const filteredSections = SECTION_LIBRARY.filter(section => {
    const matchesCategory = selectedCategory === 'all' || section.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle drag and drop
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Reordering within the same list
    if (source.droppableId === destination.droppableId) {
      if (!Array.isArray(content.sections)) return;
      const newSections = Array.from(content.sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);

      // Update order numbers
      const updatedSections = newSections.map((section, index) => ({
        ...section,
        order: index + 1
      }));

      onChange({
        ...content,
        sections: updatedSections
      });
    }
  };

  // Add section to template
  const addSection = (sectionDef: SectionDefinition) => {
    // Check if section already exists
    const existingSection = content.sections.find(s => s.sectionId === sectionDef.id);
    if (existingSection) {
      return; // Don't add duplicate sections
    }

    const newSection: TemplateSection = {
      id: `${sectionDef.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sectionId: sectionDef.id,
      order: content.sections.length + 1,
      isEnabled: true
    };

    // Initialize section default content
    setSectionDefaults(prev => ({
      ...prev,
      [sectionDef.id]: sectionDef.defaultContent || ''
    }));

    onChange({
      ...content,
      sections: [...content.sections, newSection]
    });
  };

  // Remove section from template
  const removeSection = (sectionId: string) => {
    const sectionToRemove = content.sections.find(s => s.id === sectionId);
    const newSections = content.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({
        ...section,
        order: index + 1
      }));

    // Remove from section defaults
    if (sectionToRemove) {
      setSectionDefaults(prev => {
        const newDefaults = { ...prev };
        delete newDefaults[sectionToRemove.sectionId];
        return newDefaults;
      });
    }

    onChange({
      ...content,
      sections: newSections
    });
  };

  // Toggle section visibility
  const toggleSection = (sectionId: string) => {
    const newSections = content.sections.map(section =>
      section.id === sectionId 
        ? { ...section, isEnabled: !section.isEnabled }
        : section
    );

    onChange({
      ...content,
      sections: newSections
    });
  };

  // Get section definition for a template section
  const getSectionDefinition = (sectionId: string): SectionDefinition | undefined => {
    return SECTION_LIBRARY.find(section => section.id === sectionId);
  };

  // Update section default content
  const updateSectionDefault = (sectionId: string, content: string) => {
    setSectionDefaults(prev => ({
      ...prev,
      [sectionId]: content
    }));
  };

  // Update template metadata including section defaults
  const updateTemplateMetadata = () => {
    // Update sections with custom content
    const updatedSections = Array.isArray(content.sections) 
      ? content.sections.map(section => ({
          ...section,
          customContent: sectionDefaults[section.sectionId] || ''
        }))
      : [];

    const updatedContent: TemplateContent = {
      ...content,
      sections: updatedSections,
      metadata: {
        ...content.metadata,
        name: templateName,
        description: templateDescription,
        category: templateCategory,
        specialty: templateSpecialty,
        compatibleNoteTypes: compatibleNoteTypes,
        compatibleSubtypes: compatibleSubtypes,
      }
    };
    onChange(updatedContent);
  };

  // Toggle note type selection
  const toggleNoteType = (noteType: NoteType) => {
    setCompatibleNoteTypes(prev => {
      if (prev.includes(noteType)) {
        const filtered = prev.filter(type => type !== noteType);
        // Ensure at least one note type is always selected
        return filtered.length > 0 ? filtered : prev;
      } else {
        return [...prev, noteType];
      }
    });
  };

  // Toggle subtype selection
  const toggleSubtype = (subtype: NoteSubtype) => {
    setCompatibleSubtypes(prev => {
      if (prev.includes(subtype)) {
        const filtered = prev.filter(type => type !== subtype);
        // Ensure at least one subtype is always selected
        return filtered.length > 0 ? filtered : prev;
      } else {
        return [...prev, subtype];
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b">
          <div className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-2xl font-bold">Template Builder</h2>
              <p className="text-gray-600">Drag and drop sections to build your template</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-2"
              >
                {previewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              <Button 
                onClick={async () => {
                  if (!templateName.trim()) {
                    alert('Please enter a template name before saving.');
                    return;
                  }

                  if (content.sections.length === 0) {
                    alert('Please add at least one section to your template.');
                    return;
                  }

                  const updatedContent = {
                    ...content,
                    sections: content.sections.map(section => ({
                      ...section,
                      customContent: sectionDefaults[section.sectionId] || ''
                    })),
                    metadata: {
                      ...content.metadata,
                      name: templateName.trim(),
                      description: templateDescription.trim() || undefined,
                      category: templateCategory,
                      specialty: templateSpecialty || undefined,
                      compatibleNoteTypes: compatibleNoteTypes.length > 0 ? compatibleNoteTypes : ['admission'],
                      compatibleSubtypes: compatibleSubtypes.length > 0 ? compatibleSubtypes : ['general'],
                    }
                  };
                  
                  onChange(updatedContent);
                  
                  if (onSave) {
                    try {
                      await onSave(updatedContent);
                      onClose();
                    } catch (error) {
                      console.error('Failed to save template:', error);
                      alert('Failed to save template. Please try again.');
                    }
                  } else {
                    onClose();
                  }
                }}
                disabled={!templateName.trim() || content.sections.length === 0}
              >
                {onSave ? 'Save Template' : 'Done'}
              </Button>
            </div>
          </div>
          
          {/* Compact Configuration Panel - Collapsible */}
          <div className="border-t">
            <button
              onClick={() => setConfigPanelOpen(!configPanelOpen)}
              className="w-full px-6 py-3 bg-gray-50 hover:bg-gray-100 border-b flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="font-medium text-gray-800">Template Configuration</span>
                <Badge variant="outline" className="text-xs">
                  {templateName || 'Untitled'}
                </Badge>
              </div>
              <div className={`transition-transform ${configPanelOpen ? 'rotate-180' : ''}`}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>
            
            {configPanelOpen && (
              <div className="bg-gray-50 border-b">
                <div className="p-4 space-y-4">
                  {/* Compact Essential Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Template Name *</label>
                      <input
                        type="text"
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="admission">Admission</option>
                        <option value="discharge">Discharge</option>
                        <option value="progress">Progress</option>
                        <option value="consultation">Consultation</option>
                        <option value="procedure">Procedure</option>
                        <option value="emergency">Emergency</option>
                        <option value="follow-up">Follow-up</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Specialty</label>
                      <select
                        value={templateSpecialty}
                        onChange={(e) => setTemplateSpecialty(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {internalMedicineSpecialties.map(specialty => (
                          <option key={specialty.value} value={specialty.value}>
                            {specialty.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={templateDescription}
                      onChange={(e) => setTemplateDescription(e.target.value)}
                      placeholder="Brief description..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>

                  {/* Compact Compatibility Settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <h4 className="text-xs font-medium text-gray-800 mb-2">Note Types</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['admission', 'progress', 'consultation'] as NoteType[]).map(noteType => (
                          <label key={noteType} className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={compatibleNoteTypes.includes(noteType)}
                              onChange={() => toggleNoteType(noteType)}
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="capitalize">{noteType}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <h4 className="text-xs font-medium text-gray-800 mb-2">Settings</h4>
                      <div className="flex flex-wrap gap-2">
                        {(['general', 'icu'] as NoteSubtype[]).map(subtype => (
                          <label key={subtype} className="flex items-center gap-1 text-xs cursor-pointer">
                            <input
                              type="checkbox"
                              checked={compatibleSubtypes.includes(subtype)}
                              onChange={() => toggleSubtype(subtype)}
                              className="w-3 h-3 text-blue-600 border-gray-300 rounded"
                            />
                            <span className="capitalize">{subtype === 'icu' ? 'ICU' : subtype}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={updateTemplateMetadata}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      Update Configuration
                    </Button>
                    <Button
                      onClick={() => setConfigPanelOpen(false)}
                      variant="outline"
                      size="sm"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {previewMode ? (
            /* Preview Mode - Show full preview */
            <div className="flex-1 p-4 overflow-y-auto">
              <NotePreview 
                key={`preview-${JSON.stringify(sectionDefaults)}`}
                templateContent={{
                  ...content,
                  sections: content.sections.map(section => ({
                    ...section,
                    customContent: sectionDefaults[section.sectionId] || section.customContent || ''
                  })),
                  metadata: {
                    ...content.metadata,
                    name: templateName,
                    description: templateDescription,
                    category: templateCategory,
                    specialty: templateSpecialty
                  }
                }} />
            </div>
          ) : (
            /* Edit Mode - Show builder interface */
            <>
              {/* Section Library */}
              <div className="w-1/3 border-r bg-gray-50 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Section Library</h3>
              
              {/* Search */}
              <input
                type="text"
                placeholder="Search sections..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />

              {/* Category Filter */}
              <div className="flex flex-wrap gap-1 mb-4">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-2 py-1 text-xs rounded ${
                      selectedCategory === category.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Available Sections */}
            <div className="space-y-2">
              {filteredSections.map(section => {
                const isInTemplate = content.sections.some(s => s.sectionId === section.id);
                return (
                  <Card
                    key={section.id}
                    className={`cursor-pointer transition-all ${
                      isInTemplate 
                        ? 'opacity-50 bg-gray-100' 
                        : 'hover:shadow-md hover:border-blue-300'
                    }`}
                    onClick={() => !isInTemplate && addSection(section)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <section.icon className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{section.name}</h4>
                          <p className="text-xs text-gray-600">{section.description}</p>
                        </div>
                        {isInTemplate && (
                          <Badge variant="secondary" className="text-xs">Added</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>

            {/* Template Canvas */}
            <div className="flex-1 p-4 overflow-y-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Template Sections</h3>
              <p className="text-sm text-gray-600">
                {content.sections.length} sections • Drag to reorder
              </p>
            </div>

            {content.sections.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No sections added yet</p>
                <p className="text-sm">Select sections from the library to build your template</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="template-sections">
                  {(provided: DroppableProvided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-3"
                    >
                      {content.sections.map((section, index) => {
                        const sectionDef = getSectionDefinition(section.sectionId);
                        if (!sectionDef) return null;

                        return (
                          <Draggable
                            key={section.id}
                            draggableId={section.id}
                            index={index}
                          >
                            {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`transition-all ${
                                  snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                                }`}
                              >
                                <Card className={`border-2 ${
                                  section.isEnabled 
                                    ? 'border-blue-200 bg-blue-50' 
                                    : 'border-gray-200 bg-gray-50'
                                }`}>
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div
                                        {...provided.dragHandleProps}
                                        className="cursor-grab hover:cursor-grabbing"
                                      >
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                      </div>
                                      
                                      <sectionDef.icon className="w-5 h-5 text-blue-600" />
                                      
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-medium">{sectionDef.name}</h4>
                                          <Badge variant="outline" className="text-xs">
                                            {sectionDef.category}
                                          </Badge>
                                          {sectionDef.isRequired && (
                                            <Badge variant="destructive" className="text-xs">
                                              Required
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">
                                          {sectionDef.description}
                                        </p>
                                        
                                        {/* Section Content Editor */}
                                        <div className="mt-3">
                                          <label className="block text-xs font-medium text-gray-700 mb-1">
                                            Default Content for {sectionDef.name}
                                          </label>
                                          <textarea
                                            value={sectionDefaults[section.sectionId] || ''}
                                            onChange={(e) => updateSectionDefault(section.sectionId, e.target.value)}
                                            placeholder={`Enter default content for ${sectionDef.name}...`}
                                            className="w-full h-20 px-2 py-1 text-xs border border-gray-300 rounded resize-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                            maxLength={1000}
                                          />
                                          <p className="text-xs text-gray-500 mt-1">
                                            This content will pre-populate when users select this template
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleSection(section.id)}
                                          className="h-8 w-8 p-0"
                                        >
                                          {section.isEnabled ? (
                                            <Eye className="w-4 h-4" />
                                          ) : (
                                            <EyeOff className="w-4 h-4" />
                                          )}
                                        </Button>
                                        
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeSection(section.id)}
                                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              )}
            </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
} 