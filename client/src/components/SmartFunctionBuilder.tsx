import React, { useState, useEffect } from 'react';
import { Plus, X, GripVertical, Calendar, Hash, List, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface SmartFunction {
  id: string;
  type: 'multi-option' | 'date' | 'calculation';
  options?: string[];
  position: number;
}

interface SmartFunctionBuilderProps {
  onInsert: (content: string) => void;
  className?: string;
}

export function SmartFunctionBuilder({ onInsert, className = '' }: SmartFunctionBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeBuilder, setActiveBuilder] = useState<'multi-option' | 'date' | 'calculation' | null>(null);
  const [multiOptions, setMultiOptions] = useState<string[]>(['']);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Multi-option builder functions
  const addOption = () => {
    setMultiOptions([...multiOptions, '']);
  };

  const removeOption = (index: number) => {
    if (multiOptions.length > 1) {
      setMultiOptions(multiOptions.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...multiOptions];
    newOptions[index] = value;
    setMultiOptions(newOptions);
  };

  // Drag and drop functions
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOptions = [...multiOptions];
    const draggedItem = newOptions[draggedIndex];
    
    // Remove dragged item
    newOptions.splice(draggedIndex, 1);
    
    // Insert at new position
    newOptions.splice(dropIndex, 0, draggedItem);
    
    setMultiOptions(newOptions);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const insertMultiOption = () => {
    const validOptions = multiOptions.filter(opt => opt.trim() !== '');
    if (validOptions.length >= 2) {
      const syntax = `[[${validOptions.join('|')}]]`;
      onInsert(syntax);
      // Reset builder
      setMultiOptions(['']);
      setActiveBuilder(null);
    }
  };

  const insertDate = () => {
    onInsert('[[DATE]]');
    setActiveBuilder(null);
  };

  const insertCalculation = () => {
    onInsert('/calc');
    setActiveBuilder(null);
  };

  // Medical template suggestions organized by specialty
  const medicalTemplatesBySpecialty = {
    'General': {
      'Yes/No': ['Yes', 'No'],
      'Present/Absent': ['Present', 'Absent'],
      'Normal/Abnormal': ['Normal', 'Abnormal'],
      'Pain Scale': ['0/10', '1/10', '2/10', '3/10', '4/10', '5/10', '6/10', '7/10', '8/10', '9/10', '10/10']
    },
    'Cardiology': {
      'Cardiac Rhythm': ['Regular', 'Irregular', 'Tachycardic', 'Bradycardic'],
      'Heart Sounds': ['Normal S1/S2', 'S3 gallop', 'S4 gallop', 'Murmur present'],
      'Chest Pain': ['No chest pain', 'Typical angina', 'Atypical chest pain', 'Non-cardiac chest pain'],
      'Edema': ['No edema', '1+ edema', '2+ edema', '3+ edema', '4+ edema']
    },
    'Respiratory': {
      'Breathing': ['Normal', 'Labored', 'Shallow', 'Deep', 'Tachypneic', 'Bradypneic'],
      'Lung Sounds': ['Clear bilaterally', 'Rales', 'Rhonchi', 'Wheezes', 'Diminished'],
      'Dyspnea': ['No dyspnea', 'Mild dyspnea', 'Moderate dyspnea', 'Severe dyspnea'],
      'Cough': ['No cough', 'Dry cough', 'Productive cough', 'Chronic cough']
    },
    'Neurological': {
      'Mental Status': ['Alert', 'Confused', 'Lethargic', 'Stuporous', 'Comatose'],
      'Orientation': ['Oriented x3', 'Oriented x2', 'Oriented x1', 'Disoriented'],
      'Motor Function': ['Normal strength', 'Mild weakness', 'Moderate weakness', 'Severe weakness'],
      'Reflexes': ['Normal', 'Hyperreflexic', 'Hyporeflexic', 'Absent']
    },
    'Dermatology': {
      'Skin Color': ['Pink', 'Pale', 'Cyanotic', 'Flushed', 'Jaundiced'],
      'Skin Condition': ['Normal', 'Dry', 'Moist', 'Diaphoretic'],
      'Lesion Type': ['Macule', 'Papule', 'Nodule', 'Vesicle', 'Pustule'],
      'Rash Distribution': ['Localized', 'Generalized', 'Symmetric', 'Asymmetric']
    }
  };

  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('General');

  const applyTemplate = (templateName: string) => {
    const specialtyTemplates = medicalTemplatesBySpecialty[selectedSpecialty as keyof typeof medicalTemplatesBySpecialty];
    const options = specialtyTemplates[templateName as keyof typeof specialtyTemplates];
    if (options) {
      setMultiOptions([...options]);
    }
  };

  return (
    <div className={`border border-blue-200 bg-blue-50 rounded-lg ${className}`}>
      {/* Header */}
      <div 
        className="p-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-blue-600">
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <span className="text-sm font-medium text-blue-800">Smart Function Builder</span>
            <Badge variant="secondary" className="text-xs">Enhanced</Badge>
          </div>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setActiveBuilder('multi-option');
                setIsExpanded(true);
              }}
              className="text-xs px-2 py-1 h-6"
            >
              <List className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                insertDate();
              }}
              className="text-xs px-2 py-1 h-6"
            >
              <Calendar className="w-3 h-3" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                insertCalculation();
              }}
              className="text-xs px-2 py-1 h-6"
            >
              <Hash className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 border-t border-blue-200">
          {/* Quick Actions */}
          <div className="mb-4 pt-3">
            <div className="text-xs font-medium text-blue-700 mb-2">Quick Insert:</div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveBuilder('multi-option')}
                className="text-xs bg-white hover:bg-blue-100 border-blue-300"
              >
                <List className="w-3 h-3 mr-1" />
                Multi-Option
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertDate}
                className="text-xs bg-white hover:bg-blue-100 border-blue-300"
              >
                <Calendar className="w-3 h-3 mr-1" />
                Date Picker
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={insertCalculation}
                className="text-xs bg-white hover:bg-blue-100 border-blue-300"
              >
                <Hash className="w-3 h-3 mr-1" />
                Calculator
              </Button>
            </div>
          </div>

          {/* Multi-Option Builder */}
          {activeBuilder === 'multi-option' && (
            <Card className="bg-white border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-900">Multi-Option Builder</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveBuilder(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Medical Templates by Specialty */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs font-medium text-gray-700">Medical Templates:</div>
                    <select
                      value={selectedSpecialty}
                      onChange={(e) => setSelectedSpecialty(e.target.value)}
                      className="text-xs px-2 py-1 border border-gray-300 rounded"
                    >
                      {Object.keys(medicalTemplatesBySpecialty).map((specialty) => (
                        <option key={specialty} value={specialty}>
                          {specialty}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.keys(medicalTemplatesBySpecialty[selectedSpecialty as keyof typeof medicalTemplatesBySpecialty]).map((template) => (
                      <Button
                        key={template}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => applyTemplate(template)}
                        className="text-xs px-2 py-1 h-6 bg-green-50 border-green-200 hover:bg-green-100 text-green-800"
                      >
                        {template}
                      </Button>
                    ))}
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Select a specialty above to see relevant medical templates
                  </div>
                </div>

                {/* Option Inputs with Drag & Drop */}
                <div className="space-y-2 mb-3">
                  {multiOptions.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-2 p-2 rounded transition-colors ${
                        draggedIndex === index 
                          ? 'bg-blue-100 border-2 border-blue-300' 
                          : 'bg-white border border-gray-200'
                      }`}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div 
                        className="flex items-center text-gray-400 cursor-grab active:cursor-grabbing"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-gray-500 min-w-[2rem]">
                        {index + 1}.
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 text-sm"
                      />
                      {multiOptions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {multiOptions.length > 1 && (
                    <div className="text-xs text-gray-500 text-center mt-2">
                      💡 Drag the grip handles to reorder options
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveBuilder(null)}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={insertMultiOption}
                      disabled={multiOptions.filter(opt => opt.trim() !== '').length < 2}
                      className="text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      Insert Multi-Option
                    </Button>
                  </div>
                </div>

                {/* Preview */}
                {multiOptions.filter(opt => opt.trim() !== '').length >= 2 && (
                  <div className="mt-3 p-2 bg-gray-50 border rounded text-xs">
                    <div className="text-gray-600 mb-1">Preview:</div>
                    <code className="text-blue-600">
                      [[{multiOptions.filter(opt => opt.trim() !== '').join('|')}]]
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Help Text */}
          <div className="mt-3 text-xs text-blue-600">
            <p>
              <strong>Multi-Option:</strong> Creates dropdown selections (requires 2+ options)
            </p>
            <p>
              <strong>Date Picker:</strong> Inserts interactive date selection
            </p>
            <p>
              <strong>Calculator:</strong> Inserts medical calculation trigger
            </p>
          </div>
        </div>
      )}
    </div>
  );
}