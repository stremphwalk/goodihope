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

interface TemplateBuilderProps {
  content: TemplateContent;
  onChange: (content: TemplateContent) => void;
  onClose: () => void;
}

export function TemplateBuilder({ content, onChange, onClose }: TemplateBuilderProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

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
    const newSection: TemplateSection = {
      id: `${sectionDef.id}-${Date.now()}`,
      sectionId: sectionDef.id,
      order: content.sections.length + 1,
      isEnabled: true
    };

    onChange({
      ...content,
      sections: [...content.sections, newSection]
    });
  };

  // Remove section from template
  const removeSection = (sectionId: string) => {
    const newSections = content.sections
      .filter(section => section.id !== sectionId)
      .map((section, index) => ({
        ...section,
        order: index + 1
      }));

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
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
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
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
        </div>
      </div>
    </div>
  );
} 