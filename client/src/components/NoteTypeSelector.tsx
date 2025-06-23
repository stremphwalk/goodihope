import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Clock,
  User
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from 'react-oidc-context';
import { TemplateContent, getSectionById } from '@/lib/sectionLibrary';

interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  specialty?: string;
  content: TemplateContent;
  isPublic: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

interface NoteTypeSelectorProps {
  onSelect: (noteType: string, sections?: string[]) => void;
  selectedType?: string;
}

export function NoteTypeSelector({ onSelect, selectedType }: NoteTypeSelectorProps) {
  const { language } = useLanguage();
  const auth = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Built-in note types
  const builtInTypes = [
    {
      id: 'admission',
      name: language === 'fr' ? 'Note d\'Admission' : 'Admission Note',
      description: language === 'fr' ? 'Note complète d\'admission avec antécédents, examen et plan' : 'Complete admission note with history, exam, and plan',
      icon: FileText,
      category: 'admission',
      sections: ['note-type', 'hpi', 'pmh', 'meds', 'physical-exam', 'labs', 'impression', 'plan']
    },
    {
      id: 'progress',
      name: language === 'fr' ? 'Note de Progression' : 'Progress Note',
      description: language === 'fr' ? 'Note de suivi quotidien avec évolution et plan' : 'Daily follow-up note with progress and plan',
      icon: Clock,
      category: 'progress',
      sections: ['note-type', 'hpi', 'physical-exam', 'labs', 'impression', 'plan']
    },
    {
      id: 'discharge',
      name: language === 'fr' ? 'Note de Sortie' : 'Discharge Note',
      description: language === 'fr' ? 'Note de sortie avec résumé et instructions' : 'Discharge note with summary and instructions',
      icon: User,
      category: 'discharge',
      sections: ['note-type', 'hpi', 'pmh', 'meds', 'labs', 'impression', 'plan']
    },
    {
      id: 'consultation',
      name: language === 'fr' ? 'Note de Consultation' : 'Consultation Note',
      description: language === 'fr' ? 'Note de consultation spécialisée' : 'Specialist consultation note',
      icon: Stethoscope,
      category: 'consultation',
      sections: ['note-type', 'hpi', 'pmh', 'physical-exam', 'impression', 'plan']
    }
  ];

  const categories = [
    { id: 'all', name: language === 'fr' ? 'Tous' : 'All' },
    { id: 'admission', name: language === 'fr' ? 'Admission' : 'Admission' },
    { id: 'progress', name: language === 'fr' ? 'Progression' : 'Progress' },
    { id: 'discharge', name: language === 'fr' ? 'Sortie' : 'Discharge' },
    { id: 'consultation', name: language === 'fr' ? 'Consultation' : 'Consultation' },
    { id: 'custom', name: language === 'fr' ? 'Personnalisés' : 'Custom' }
  ];

  // Fetch user templates
  useEffect(() => {
    if (auth.user?.id_token) {
      fetchTemplates();
    }
  }, [auth.user?.id_token]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates', {
        headers: {
          'Authorization': `Bearer ${auth.user!.id_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter note types based on category
  const filteredBuiltInTypes = builtInTypes.filter(type => 
    selectedCategory === 'all' || type.category === selectedCategory
  );

  const filteredCustomTemplates = templates.filter(template => 
    selectedCategory === 'all' || 
    selectedCategory === 'custom' || 
    template.category === selectedCategory
  );

  const handleSelect = (type: any, isCustom = false) => {
    if (isCustom) {
      // For custom templates, use the sections from the template
      const sections = type.content.sections
        .filter((section: any) => section.isEnabled)
        .map((section: any) => section.sectionId);
      onSelect(`custom-${type.id}`, sections);
    } else {
      // For built-in types, use predefined sections
      onSelect(type.id, type.sections);
    }
  };

  const getSectionIcon = (sectionId: string) => {
    const section = getSectionById(sectionId);
    return section?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          {language === 'fr' ? 'Sélectionner le Type de Note' : 'Select Note Type'}
        </h2>
        <p className="text-gray-600">
          {language === 'fr' 
            ? 'Choisissez un type de note prédéfini ou utilisez un de vos modèles personnalisés'
            : 'Choose a predefined note type or use one of your custom templates'
          }
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* Built-in Note Types */}
      {filteredBuiltInTypes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {language === 'fr' ? 'Types Prédéfinis' : 'Built-in Types'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBuiltInTypes.map(type => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === type.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSelect(type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <type.icon className="w-6 h-6 text-blue-600" />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {type.category}
                    </Badge>
                    <div className="flex flex-wrap gap-1">
                      {type.sections.slice(0, 4).map(sectionId => {
                        const Icon = getSectionIcon(sectionId);
                        return (
                          <div key={sectionId} className="flex items-center gap-1 text-xs text-gray-500">
                            <Icon className="w-3 h-3" />
                          </div>
                        );
                      })}
                      {type.sections.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{type.sections.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Custom Templates */}
      {filteredCustomTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            {language === 'fr' ? 'Modèles Personnalisés' : 'Custom Templates'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomTemplates.map(template => (
              <Card
                key={template.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === `custom-${template.id}` ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => handleSelect(template, true)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {template.description && (
                        <p className="text-sm text-gray-600">{template.description}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                      {template.specialty && (
                        <Badge variant="secondary" className="text-xs">
                          {template.specialty}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.content.sections
                        .filter(section => section.isEnabled)
                        .slice(0, 4)
                        .map(section => {
                          const Icon = getSectionIcon(section.sectionId);
                          return (
                            <div key={section.id} className="flex items-center gap-1 text-xs text-gray-500">
                              <Icon className="w-3 h-3" />
                            </div>
                          );
                        })}
                      {template.content.sections.filter(s => s.isEnabled).length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{template.content.sections.filter(s => s.isEnabled).length - 4} more
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredBuiltInTypes.length === 0 && filteredCustomTemplates.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {language === 'fr' ? 'Aucun type de note trouvé' : 'No note types found'}
            </h3>
            <p className="text-gray-600">
              {language === 'fr' 
                ? 'Essayez de changer les filtres ou créez un nouveau modèle personnalisé'
                : 'Try changing the filters or create a new custom template'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">
                {language === 'fr' ? 'Chargement des modèles...' : 'Loading templates...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 