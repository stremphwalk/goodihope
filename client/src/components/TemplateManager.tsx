import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, HelpCircle, FileText, Search, MoreVertical, Copy, Eye, Share, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from 'react-oidc-context';
import { TemplateBuilder } from './TemplateBuilder';
import { TemplateContent, createDefaultTemplateContent, getSectionById } from '@/lib/sectionLibrary';
import { type Template } from '@shared/schema';

interface TemplateManagerProps {
  onTemplatesChange?: (templates: Template[]) => void;
}

// API functions for templates
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
    return Array.isArray(data) ? data.map((template: any) => ({
      ...template,
      createdAt: template.createdAt ? new Date(template.createdAt) : new Date(),
      updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(),
      lastUsed: template.lastUsed ? new Date(template.lastUsed) : null
    })) : [];
  },

  async create(template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>, id_token: string): Promise<Template> {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: getApiHeaders(id_token),
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create template');
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      lastUsed: data.lastUsed ? new Date(data.lastUsed) : null
    };
  },

  async update(id: number, template: Partial<Template>, id_token: string): Promise<Template> {
    const response = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: getApiHeaders(id_token),
      body: JSON.stringify(template),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update template');
    }
    const data = await response.json();
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      lastUsed: data.lastUsed ? new Date(data.lastUsed) : null
    };
  },

  async delete(id: number, id_token: string): Promise<void> {
    const response = await fetch(`/api/templates/${id}`, {
      method: 'DELETE',
      headers: getApiHeaders(id_token),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete template');
    }
  },
};

export function TemplateManager({ onTemplatesChange }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [builderContent, setBuilderContent] = useState<TemplateContent>(createDefaultTemplateContent());
  
  // Sub menu state
  const [openSubMenuId, setOpenSubMenuId] = useState<string | null>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  
  // Preview state
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [showPreview, setShowPreview] = useState(false);


  const { t } = useLanguage();
  const auth = useAuth();

  // Close sub menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target as Node)) {
        setOpenSubMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    'admission',
    'discharge',
    'progress',
    'consultation',
    'procedure',
    'emergency',
    'follow-up',
    'other'
  ];

  const specialties = [
    'cardiology',
    'neurology',
    'pulmonology',
    'nephrology',
    'endocrinology',
    'gastroenterology',
    'hematology',
    'oncology',
    'psychiatry',
    'general',
    'other'
  ];

  // Load templates from API on mount
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

  // Save templates to callback whenever they change
  useEffect(() => {
    onTemplatesChange?.(templates);
  }, [templates, onTemplatesChange]);


  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSpecialty = selectedSpecialty === 'all' || template.specialty === selectedSpecialty;
    return matchesSearch && matchesCategory && matchesSpecialty;
  });

  // Create new template
  const createTemplate = () => {
    setEditingTemplate(null);
    setBuilderContent(createDefaultTemplateContent());
    setShowBuilder(true);
  };

  // Edit template
  const editTemplate = (template: Template) => {
    setEditingTemplate(template);
    setBuilderContent(template.content);
    setShowBuilder(true);
  };

  // Save template
  const saveTemplate = async (content: TemplateContent) => {
    if (!auth.user?.id_token) {
      setError('Authentication required');
      return;
    }

    // Validate required fields
    if (!content.metadata.name?.trim()) {
      setError('Template name is required');
      return;
    }

    if (!content.metadata.category) {
      setError('Template category is required');
      return;
    }

    if (content.sections.length === 0) {
      setError('Template must have at least one section');
      return;
    }

    try {
      setError(null);
      
      // Extract section defaults from content - ensure we have the latest from the builder
      const sectionDefaults: Record<string, string> = {};
      content.sections.forEach(section => {
        if (section.customContent) {
          sectionDefaults[section.sectionId] = section.customContent;
        }
      });

      const newTemplateData = {
        name: content.metadata.name.trim(),
        description: content.metadata.description?.trim() || null,
        category: content.metadata.category,
        specialty: content.metadata.specialty || null,
        content: content,
        sectionDefaults: sectionDefaults,
        compatibleNoteTypes: (content.metadata as any).compatibleNoteTypes || ['admission'],
        compatibleSubtypes: (content.metadata as any).compatibleSubtypes || ['general'],
        isFavorite: editingTemplate?.isFavorite || false,
        lastUsed: editingTemplate ? editingTemplate.lastUsed : null,
        isPublic: editingTemplate?.isPublic || false,
        version: editingTemplate ? editingTemplate.version + 1 : 1
      };

      if (editingTemplate) {
        await templatesAPI.update(editingTemplate.id, newTemplateData, auth.user.id_token);
      } else {
        await templatesAPI.create(newTemplateData, auth.user.id_token);
      }
      
      // Reload templates
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        specialty: selectedSpecialty !== 'all' ? selectedSpecialty : undefined,
        search: searchTerm || undefined
      };
      const updatedTemplates = await templatesAPI.getAll(auth.user.id_token, filters);
      setTemplates(updatedTemplates);
      setShowBuilder(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error instanceof Error ? error.message : 'Failed to save template');
    }
  };

  // Delete template
  const deleteTemplate = async (id: number) => {
    if (!auth.user?.id_token) {
      setError('Authentication required');
      return;
    }

    const template = templates.find(t => t.id === id);
    if (!template) {
      setError('Template not found');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${template.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await templatesAPI.delete(id, auth.user.id_token);
      setTemplates(prev => prev.filter(t => t.id !== id));
      
      // Clear editing state if this template was being edited
      if (editingTemplate && editingTemplate.id === id) {
        setEditingTemplate(null);
        setShowBuilder(false);
      }
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  // Duplicate template
  const duplicateTemplate = async (template: Template) => {
    if (!template.content || !template.content.metadata) {
      setError('Cannot duplicate template: invalid template structure');
      return;
    }

    try {
      const duplicatedContent = {
        ...template.content,
        metadata: {
          ...template.content.metadata,
          name: `${template.name} (Copy)`,
          description: template.description ? `Copy of: ${template.description}` : undefined
        },
        sections: Array.isArray(template.content.sections) 
          ? template.content.sections.map(section => ({
              ...section,
              id: `${section.sectionId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }))
          : []
      };
      
      setEditingTemplate(null);
      setBuilderContent(duplicatedContent);
      setShowBuilder(true);
      setError(null);
      setOpenSubMenuId(null);
    } catch (err) {
      console.error('Failed to duplicate template:', err);
      setError('Failed to duplicate template');
    }
  };

  // Preview template
  const handlePreviewTemplate = (template: Template) => {
    setPreviewTemplate(template);
    setShowPreview(true);
    setOpenSubMenuId(null);
  };

  // Share template
  const shareTemplate = (template: Template) => {
    navigator.clipboard.writeText(`Template: ${template.name}\nCategory: ${template.category}\nSections: ${template.content.sections.length}`);
    setOpenSubMenuId(null);
  };

  // Template Preview Component
  const TemplatePreview = ({ template, onClose }: { template: Template; onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold">{template.name}</h2>
              <p className="text-gray-600">{template.description}</p>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Badge variant="secondary">{template.category}</Badge>
                {template.specialty && <Badge variant="outline">{template.specialty}</Badge>}
                <Badge variant="outline">v{template.version}</Badge>
              </div>
              <div className="space-y-3">
                {template.content.sections.filter(s => s.isEnabled).map(section => {
                  const sectionDef = getSectionById(section.sectionId);
                  if (!sectionDef) return null;
                  return (
                    <Card key={section.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <sectionDef.icon className="w-5 h-5 text-blue-600" />
                          <h3 className="font-medium">{sectionDef.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600">{sectionDef.description}</p>
                        {section.customContent && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                            {section.customContent}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Sub menu component
  const TemplateSubMenu = ({ template, isOpen }: { template: Template; isOpen: boolean }) => {
    if (!isOpen) return null;

    return (
      <div 
        ref={subMenuRef}
        className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
      >
        <button
          onClick={() => editTemplate(template)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <Edit2 className="w-4 h-4" />
          Edit Template
        </button>
        <button
          onClick={() => duplicateTemplate(template)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <Copy className="w-4 h-4" />
          Duplicate
        </button>
        <button
          onClick={() => handlePreviewTemplate(template)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          onClick={() => shareTemplate(template)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
        >
          <Share className="w-4 h-4" />
          Copy Info
        </button>
        <div className="border-t border-gray-100 my-1" />
        <button
          onClick={() => deleteTemplate(template.id)}
          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Manager</h1>
        <p className="text-gray-600">Create and manage medical note templates</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Help Section */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <HelpCircle className="w-5 h-5" />
            How to Use Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>Categories:</strong> Choose the type of medical note (admission, discharge, progress, etc.)</p>
            <p><strong>Specialties:</strong> Specify the medical specialty for better organization</p>
            <p><strong>Content:</strong> Build your template using medical sections and smart options</p>
            <p><strong>Sharing:</strong> Make templates public to share with your team</p>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={selectedSpecialty}
          onChange={(e) => setSelectedSpecialty(e.target.value)}
        >
          <option value="all">All Specialties</option>
          {specialties.map(spec => (
            <option key={spec} value={spec}>
              {spec.charAt(0).toUpperCase() + spec.slice(1)}
            </option>
          ))}
        </select>
        <Button 
          onClick={createTemplate}
          className="flex items-center gap-2"
          disabled={loading || !auth.user?.id_token}
        >
          <Plus className="w-4 h-4" />
          Build Template
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">Loading templates...</p>
            </div>
          </CardContent>
        </Card>
      )}


      {/* Templates List */}
      {!loading && (
        <div className="space-y-4">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'all' || selectedSpecialty !== 'all'
                    ? 'No templates match your search criteria'
                    : 'No templates created yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <Badge variant="secondary">{template.category}</Badge>
                        {template.specialty && (
                          <Badge variant="outline">{template.specialty}</Badge>
                        )}
                        {template.isPublic && (
                          <Badge variant="default" className="bg-green-100 text-green-800">Public</Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Version {template.version} • Updated {new Date(template.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="relative ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOpenSubMenuId(openSubMenuId === template.id ? null : template.id)}
                        className="h-8 w-8 p-0"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      <TemplateSubMenu 
                        template={template} 
                        isOpen={openSubMenuId === template.id} 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Template Builder Modal */}
      {showBuilder && (
        <TemplateBuilder
          content={builderContent}
          onChange={setBuilderContent}
          onClose={() => setShowBuilder(false)}
          onSave={saveTemplate}
        />
      )}

      {/* Template Preview Modal */}
      {showPreview && previewTemplate && (
        <TemplatePreview
          template={previewTemplate}
          onClose={() => {
            setShowPreview(false);
            setPreviewTemplate(null);
          }}
        />
      )}
    </div>
  );
}