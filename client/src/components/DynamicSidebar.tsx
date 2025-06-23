import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Stethoscope, 
  Pill, 
  Users, 
  ClipboardList, 
  HeartPulse, 
  TestTube, 
  Image, 
  Brain,
  Wind,
  Activity,
  Sparkles,
  Settings,
  Plus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getSectionById, SectionDefinition } from '@/lib/sectionLibrary';

interface DynamicSidebarProps {
  selectedSections: string[];
  onSectionClick: (sectionId: string) => void;
  activeSection?: string;
  onAddSection?: () => void;
  showAddButton?: boolean;
}

export function DynamicSidebar({ 
  selectedSections, 
  onSectionClick, 
  activeSection,
  onAddSection,
  showAddButton = false
}: DynamicSidebarProps) {
  const { language } = useLanguage();

  // Group sections by category for better organization
  const groupedSections = selectedSections.reduce((groups, sectionId) => {
    const section = getSectionById(sectionId);
    if (section) {
      const category = section.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(section);
    }
    return groups;
  }, {} as Record<string, SectionDefinition[]>);

  const categoryLabels = {
    'patient-info': language === 'fr' ? 'Info Patient' : 'Patient Info',
    'history': language === 'fr' ? 'Antécédents' : 'History',
    'examination': language === 'fr' ? 'Examen' : 'Examination',
    'results': language === 'fr' ? 'Résultats' : 'Results',
    'assessment': language === 'fr' ? 'Évaluation' : 'Assessment',
    'plan': language === 'fr' ? 'Plan' : 'Plan'
  };

  const categoryColors = {
    'patient-info': 'bg-blue-100 text-blue-800',
    'history': 'bg-green-100 text-green-800',
    'examination': 'bg-purple-100 text-purple-800',
    'results': 'bg-orange-100 text-orange-800',
    'assessment': 'bg-red-100 text-red-800',
    'plan': 'bg-indigo-100 text-indigo-800'
  };

  if (selectedSections.length === 0) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <div className="text-center py-8">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {language === 'fr' ? 'Aucune Section' : 'No Sections'}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {language === 'fr' 
              ? 'Sélectionnez un type de note pour voir les sections disponibles'
              : 'Select a note type to see available sections'
            }
          </p>
          {showAddButton && onAddSection && (
            <Button onClick={onAddSection} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'fr' ? 'Ajouter Section' : 'Add Section'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            {language === 'fr' ? 'Sections' : 'Sections'}
          </h2>
          <Badge variant="outline" className="text-xs">
            {selectedSections.length}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          {language === 'fr' 
            ? 'Sections sélectionnées pour ce type de note'
            : 'Sections selected for this note type'
          }
        </p>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedSections).map(([category, sections]) => (
          <div key={category} className="border-b border-gray-100 last:border-b-0">
            {/* Category Header */}
            <div className="px-4 py-2 bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </span>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${categoryColors[category as keyof typeof categoryColors]}`}
                >
                  {sections.length}
                </Badge>
              </div>
            </div>

            {/* Section Items */}
            <div className="py-1">
              {sections.map(section => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? 'default' : 'ghost'}
                  className={`w-full justify-start px-4 py-2 h-auto text-left ${
                    activeSection === section.id 
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSectionClick(section.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <section.icon className="w-4 h-4 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {section.name}
                      </div>
                      {section.isRequired && (
                        <Badge variant="destructive" className="text-xs mt-1">
                          {language === 'fr' ? 'Requis' : 'Required'}
                        </Badge>
                      )}
                    </div>
                    {section.hasSmartOptions && (
                      <Settings className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {showAddButton && onAddSection && (
        <div className="p-4 border-t border-gray-200">
          <Button 
            onClick={onAddSection} 
            variant="outline" 
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {language === 'fr' ? 'Ajouter Section' : 'Add Section'}
          </Button>
        </div>
      )}
    </div>
  );
} 