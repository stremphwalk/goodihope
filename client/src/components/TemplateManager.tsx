import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, HelpCircle, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from 'react-oidc-context';
import { TemplateBuilder } from './TemplateBuilder';
import { TemplateContent, createDefaultTemplateContent } from '@/lib/sectionLibrary';

export interface Template {
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
    return data.map((template: any) => ({
      ...template,
      createdAt: new Date(template.createdAt),
      updatedAt: new Date(template.updatedAt)
    }));
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
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },

  async update(id: string, template: Partial<Template>, id_token: string): Promise<Template> {
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
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  },

  async delete(id: string, id_token: string): Promise<void> {
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
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [builderContent, setBuilderContent] = useState<TemplateContent>(createDefaultTemplateContent());

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'admission',
    specialty: '',
    content: createDefaultTemplateContent(),
    isPublic: false,
    version: 1
  });

  const { t } = useLanguage();
  const auth = useAuth();

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

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'admission',
      specialty: '',
      content: createDefaultTemplateContent(),
      isPublic: false,
      version: 1
    });
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Template name is required';
    if (!formData.category) return 'Category is required';
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!auth.user?.id_token) {
      setError('Authentication required');
      return;
    }

    try {
      setError(null);
      if (editingId) {
        const updatedTemplate = await templatesAPI.update(editingId, formData, auth.user.id_token);
        setTemplates(prev => prev.map(t => t.id === editingId ? updatedTemplate : t));
        setEditingId(null);
      } else {
        const newTemplate = await templatesAPI.create(formData, auth.user.id_token);
        setTemplates(prev => [...prev, newTemplate]);
        setIsCreating(false);
      }
      resetForm();
    } catch (err) {
      console.error('Failed to save template:', err);
      setError(err instanceof Error ? err.message : 'Failed to save template');
    }
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      specialty: template.specialty || '',
      content: template.content,
      isPublic: template.isPublic,
      version: template.version
    });
    setEditingId(template.id);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!auth.user?.id_token) {
      setError('Authentication required');
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setError(null);
      await templatesAPI.delete(id, auth.user.id_token);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
    setError(null);
  };

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

    try {
      const newTemplateData = {
        name: content.metadata.name,
        description: content.metadata.description,
        category: content.metadata.category,
        specialty: content.metadata.specialty,
        content: content,
        isPublic: false,
        version: 1
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
    } catch (error) {
      console.error('Error saving template:', error);
      setError(error instanceof Error ? error.message : 'Failed to save template');
    }
  };

  // Delete template
  const deleteTemplate = async (id: string) => {
    if (!auth.user?.id_token) {
      setError('Authentication required');
      return;
    }

    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      setError(null);
      await templatesAPI.delete(id, auth.user.id_token);
      setTemplates(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete template:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete template');
    }
  };

  // Duplicate template
  const duplicateTemplate = async (template: Template) => {
    const duplicatedContent = {
      ...template.content,
      metadata: {
        ...template.content.metadata,
        name: `${template.name} (Copy)`
      }
    };
    
    setEditingTemplate(null);
    setBuilderContent(duplicatedContent);
    setShowBuilder(true);
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
          onClick={() => {
            setIsCreating(false);
            setEditingId(null);
            setEditingTemplate(null);
            setBuilderContent(createDefaultTemplateContent());
            setShowBuilder(true);
          }}
          className="flex items-center gap-2"
          disabled={isCreating || editingId !== null || loading}
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

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="mb-6 border-2 border-blue-200">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Template' : 'Create New Template'}</CardTitle>
            <CardDescription>
              {editingId ? 'Update your existing template' : 'Build a new medical note template'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Template Name</label>
                <Input
                  placeholder="e.g., Cardiac Admission Note"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Specialty</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={formData.specialty}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                >
                  <option value="">Select Specialty</option>
                  {specialties.map(spec => (
                    <option key={spec} value={spec}>
                      {spec.charAt(0).toUpperCase() + spec.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded"
                />
                <label htmlFor="isPublic" className="text-sm font-medium">
                  Make template public (share with team)
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <Input
                placeholder="Brief description of this template"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Template Content</label>
              <div className="p-4 bg-gray-50 border rounded-md">
                <p className="text-sm text-gray-600 mb-4">
                  Template builder interface will be implemented here.
                  This will include drag-and-drop sections and smart options.
                </p>
                <Textarea
                  placeholder="Template content will be built here..."
                  value={JSON.stringify(formData.content, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData(prev => ({ ...prev, content: parsed }));
                    } catch {
                      // Invalid JSON, keep as string for now
                    }
                  }}
                  rows={6}
                  className="font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {editingId ? 'Update' : 'Create'}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                Cancel
              </Button>
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
                        Version {template.version} • Updated {template.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                        disabled={isCreating || editingId !== null}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
          onClose={() => {
            setShowBuilder(false);
            // Save template when closing if it has a name
            if (builderContent.metadata.name.trim()) {
              saveTemplate(builderContent);
            }
          }}
        />
      )}
    </div>
  );
} 