import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Search, 
  Star, 
  Clock, 
  User, 
  Stethoscope, 
  Activity, 
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { type Template } from '@shared/schema';
import { TemplateContent } from '@/lib/sectionLibrary';

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template | null) => void;
  selectedTemplate?: Template | null;
  onClose?: () => void;
  noteType?: string;
  specialty?: string;
  className?: string;
}

const getApiHeaders = (id_token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${id_token}`,
});

const templatesAPI = {
  async getAll(id_token: string, filters?: { category?: string; specialty?: string; search?: string }): Promise<Template[]> {
    const params = new URLSearchParams();
    if (filters?.category) params.append('category', filters.category);
    if (filters?.specialty) params.append('specialty', filters.specialty);
    if (filters?.search) params.append('search', filters.search);
    
    const response = await fetch(`/api/templates?${params.toString()}`, {
      headers: getApiHeaders(id_token),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch templates');
    }
    const data = await response.json();
    return data.map((template: any) => ({
      ...template,
      createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
      lastUsed: template.lastUsed ? new Date(template.lastUsed) : null
    }));
  },
};

export function TemplateSelector({ 
  onTemplateSelect, 
  selectedTemplate, 
  onClose, 
  noteType, 
  specialty,
  className = ''
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(noteType || 'all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(specialty || 'all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { language } = useLanguage();
  const auth = useAuth();

  const categories = [
    'admission',
    'discharge', 
    'progress',
    'consultation',
    'procedure',
    'emergency',
    'follow-up'
  ];

  const specialties = [
    'internal-medicine',
    'cardiology',
    'gastroenterology',
    'nephrology',
    'endocrinology',
    'pulmonology',
    'hematology',
    'oncology',
    'rheumatology',
    'infectious-disease',
    'critical-care',
    'geriatrics'
  ];

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      if (!auth.user?.id_token) return;
      
      try {
        setLoading(true);
        setError(null);
        const filters = {
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
          search: searchTerm || undefined
        };
        const templateData = await templatesAPI.getAll(auth.user.id_token, filters);
        setTemplates(templateData);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, [auth.user?.id_token, selectedCategory, selectedSpecialty, searchTerm]);

  const handleTemplateSelect = (template: Template) => {
    if (!template || !template.content) {
      console.error('Invalid template selected:', template);
      return;
    }
    onTemplateSelect(template);
  };

  const handleClearSelection = () => {
    onTemplateSelect(null);
  };

  const getIconForCategory = (category: string) => {
    const icons: Record<string, React.ComponentType<any>> = {
      admission: FileText,
      discharge: User,
      progress: Clock,
      consultation: Stethoscope,
      procedure: Activity,
      emergency: AlertCircle,
      'follow-up': Clock
    };
    return icons[category] || FileText;
  };

  const formatSpecialty = (specialty: string) => {
    return specialty.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSpecialty = selectedSpecialty === 'all' || template.specialty === selectedSpecialty;
    return matchesSearch && matchesCategory && matchesSpecialty;
  });

  return (
    <div className={`bg-white border rounded-lg shadow-lg ${className}`}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {language === 'fr' ? 'Sélectionner un Modèle' : 'Select Template'}
            </CardTitle>
            <p className="text-sm text-gray-600">
              {language === 'fr' 
                ? 'Choisissez un modèle pour démarrer votre note'
                : 'Choose a template to start your note'
              }
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Selected Template Display */}
        {selectedTemplate && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900">{selectedTemplate.name}</h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedTemplate.category}</Badge>
                    {selectedTemplate.specialty && (
                      <Badge variant="outline">{formatSpecialty(selectedTemplate.specialty)}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={language === 'fr' ? 'Rechercher des modèles...' : 'Search templates...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Toutes les catégories' : 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm flex-1"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
            >
              <option value="all">{language === 'fr' ? 'Toutes les spécialités' : 'All Specialties'}</option>
              {specialties.map(spec => (
                <option key={spec} value={spec}>
                  {formatSpecialty(spec)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Templates List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">
                {language === 'fr' ? 'Chargement des modèles...' : 'Loading templates...'}
              </p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">
                {language === 'fr' ? 'Aucun modèle trouvé' : 'No templates found'}
              </p>
              <p className="text-sm">
                {searchTerm || selectedCategory !== 'all' || selectedSpecialty !== 'all'
                  ? (language === 'fr' ? 'Essayez de modifier vos critères de recherche' : 'Try adjusting your search criteria')
                  : (language === 'fr' ? 'Aucun modèle créé pour le moment' : 'No templates created yet')
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map(template => {
                const Icon = getIconForCategory(template.category);
                const isSelected = selectedTemplate?.id === template.id;
                
                return (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    disabled={!template.content}
                    className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-md ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    } ${!template.content ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!template.content ? 'Template content unavailable' : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        isSelected ? 'bg-blue-500' : 'bg-gray-500'
                      } text-white flex-shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900 truncate">{template.name}</h4>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          )}
                          {template.isFavorite && (
                            <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          {template.specialty && (
                            <Badge variant="outline" className="text-xs">
                              {formatSpecialty(template.specialty)}
                            </Badge>
                          )}
                          {template.isPublic && (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                              Public
                            </Badge>
                          )}
                        </div>
                        {template.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">{template.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {language === 'fr' ? 'Version' : 'Version'} {template.version} • 
                          {template.lastUsed 
                            ? ` ${language === 'fr' ? 'Utilisé' : 'Used'} ${new Date(template.lastUsed).toLocaleDateString()}`
                            : ` ${language === 'fr' ? 'Créé' : 'Created'} ${new Date(template.createdAt).toLocaleDateString()}`
                          }
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </div>
  );
}