import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  X,
  Trash2
} from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTemplate } from '@/contexts/TemplateContext';
import { type Template } from '@shared/schema';

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

export function TemplateSelectorPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { language } = useLanguage();
  const auth = useAuth();
  const { selectedTemplate, setSelectedTemplate, clearTemplate } = useTemplate();

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

  // Load templates on first render or when filters change
  React.useEffect(() => {
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
        setHasLoaded(true);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    if (!hasLoaded || searchTerm || selectedCategory !== 'all' || selectedSpecialty !== 'all') {
      loadTemplates();
    }
  }, [auth.user?.id_token, selectedCategory, selectedSpecialty, searchTerm, hasLoaded]);

  const handleTemplateSelect = (template: Template) => {
    if (!template || !template.content) {
      console.error('Invalid template selected:', template);
      return;
    }
    setSelectedTemplate(template);
  };

  const handleClearSelection = () => {
    clearTemplate();
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
    <div className="flex h-full">
      {/* Left Panel - Template Selection */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'fr' ? 'Sélectionner un Modèle' : 'Select Template'}
          </h1>
          <p className="text-gray-600">
            {language === 'fr' 
              ? 'Choisissez un modèle pour remplacer la structure de note par défaut'
              : 'Choose a template to override the default note structure'
            }
          </p>
        </div>

        {/* Current Selection */}
        {selectedTemplate && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg text-white">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">{selectedTemplate.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary">{selectedTemplate.category}</Badge>
                    {selectedTemplate.specialty && (
                      <Badge variant="outline">{formatSpecialty(selectedTemplate.specialty)}</Badge>
                    )}
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearSelection}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">
                {language === 'fr' ? 'Modèle actif' : 'Active Template'}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {language === 'fr' 
                  ? 'Ce modèle remplace maintenant la structure de note par défaut'
                  : 'This template now overrides the default note structure'
                }
              </p>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher des modèles...' : 'Search templates...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialty</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        </div>

        {/* Templates List */}
        <div>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">
                {language === 'fr' ? 'Chargement des modèles...' : 'Loading templates...'}
              </p>
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">
                {language === 'fr' ? 'Aucun modèle trouvé' : 'No templates found'}
              </h3>
              <p className="text-sm">
                {searchTerm || selectedCategory !== 'all' || selectedSpecialty !== 'all'
                  ? (language === 'fr' ? 'Essayez de modifier vos critères de recherche' : 'Try adjusting your search criteria')
                  : (language === 'fr' ? 'Aucun modèle créé pour le moment' : 'No templates created yet')
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredTemplates.map(template => {
                const Icon = getIconForCategory(template.category);
                const isSelected = selectedTemplate?.id === template.id;
                
                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      isSelected 
                        ? 'border-2 border-blue-500 bg-blue-50 shadow-lg' 
                        : 'border hover:border-gray-300'
                    } ${!template.content ? 'opacity-50' : ''}`}
                    onClick={() => template.content && handleTemplateSelect(template)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${
                          isSelected ? 'bg-blue-500' : 'bg-gray-500'
                        } text-white flex-shrink-0`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                            {isSelected && (
                              <Check className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            )}
                            {template.isFavorite && (
                              <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-3">
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
                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{template.description}</p>
                          )}
                          <p className="text-xs text-gray-400">
                            {language === 'fr' ? 'Version' : 'Version'} {template.version} • 
                            {template.lastUsed 
                              ? ` ${language === 'fr' ? 'Utilisé' : 'Used'} ${new Date(template.lastUsed).toLocaleDateString()}`
                              : ` ${language === 'fr' ? 'Créé' : 'Created'} ${new Date(template.createdAt).toLocaleDateString()}`
                            }
                          </p>
                          {!template.content && (
                            <p className="text-xs text-red-500 mt-2">Template content unavailable</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}