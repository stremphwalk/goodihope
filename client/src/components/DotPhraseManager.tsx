import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, HelpCircle, Calendar, List, Hash, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from 'react-oidc-context';
import { Tabs } from '@/components/ui/tabs';
import { DotPhraseTextarea } from './DotPhraseTextarea';
import { SmartFunctionBuilder } from './SmartFunctionBuilder';
import { ShareDotPhraseModal } from './ShareDotPhraseModal';
import { ImportDotPhraseModal } from './ImportDotPhraseModal';
import { useDotPhrases, useCreateDotPhrase, useUpdateDotPhrase, useDeleteDotPhrase } from '@/hooks/useDotPhrases';

export interface CustomDotPhrase {
  id: string;
  trigger: string; // The slash command (e.g., "/chest")
  content: string; // The phrase content with [[options]]
  description: string;
  category: string;
  shareCode?: string; // 4-character sharing code
  isPublic?: boolean; // Whether the phrase is shared publicly
  sharedAt?: Date; // When the phrase was first shared
  importCount?: number; // How many times it's been imported
  createdAt: Date;
  updatedAt: Date;
}

interface DotPhraseManagerProps {
  onDotPhrasesChange?: (phrases: CustomDotPhrase[]) => void;
}


export function DotPhraseManager({ onDotPhrasesChange }: DotPhraseManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedPhraseForShare, setSelectedPhraseForShare] = useState<CustomDotPhrase | null>(null);
  
  // React Query hooks
  const { data: customPhrases = [], isLoading: loading, error: queryError } = useDotPhrases();
  const createMutation = useCreateDotPhrase();
  const updateMutation = useUpdateDotPhrase();
  const deleteMutation = useDeleteDotPhrase();
  
  const error = queryError?.message || null;

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    trigger: '',
    content: '',
    description: '',
    category: 'general'
  });

  const { t } = useLanguage();
  const auth = useAuth();
  const [textareaRef, setTextareaRef] = useState<React.RefObject<HTMLTextAreaElement> | null>(null);

  


  // Notify parent when phrases change
  useEffect(() => {
    onDotPhrasesChange?.(customPhrases);
  }, [customPhrases, onDotPhrasesChange]);

  const categories = [
    'general',
    'cardiac',
    'respiratory',
    'neurological',
    'gastrointestinal',
    'musculoskeletal',
    'dermatological',
    'endocrine',
    'hematologic',
    'renal',
    'genitourinary',
    'psychiatric',
    'immunologic',
    'infectious',
    'ophthalmologic',
    'otorhinolaryngologic',
    'other',
  ];

  const resetForm = () => {
    setFormData({
      trigger: '',
      content: '',
      description: '',
      category: 'general'
    });
  };

  // Smart feature insertion function
  const handleSmartFunctionInsert = (content: string) => {
    const textarea = textareaRef?.current;
    if (!textarea) {
      // Fallback: append to end of content
      setFormData(prev => ({ ...prev, content: prev.content + content }));
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentContent = formData.content;
    
    const newContent = currentContent.slice(0, start) + content + currentContent.slice(end);
    setFormData(prev => ({ ...prev, content: newContent }));

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + content.length, start + content.length);
    }, 0);
  };

  const validateForm = () => {
    if (!formData.trigger.trim()) return 'Trigger is required';
    if (!formData.trigger.startsWith('/')) return 'Trigger must start with /';
    if (!formData.content.trim()) return 'Content is required';
    // Description is now optional
    // Check for duplicate triggers (excluding current editing item)
    const existingTrigger = customPhrases.find(p => 
      p.trigger.toLowerCase() === formData.trigger.toLowerCase() && 
      p.id !== editingId
    );
    if (existingTrigger) return 'This trigger already exists';
    return null;
  };

  const handleSave = async () => {
    if (!auth.user?.id_token) {
      alert("You must be logged in to save dot phrases.");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      if (editingId) {
        // Update existing phrase
        await updateMutation.mutateAsync({ id: editingId, phrase: formData });
        setEditingId(null);
      } else {
        // Create new phrase
        await createMutation.mutateAsync(formData);
        setIsCreating(false);
      }
      
      resetForm();
    } catch (err) {
      console.error('Error saving dot phrase:', err);
      alert(err instanceof Error ? err.message : 'Failed to save dot phrase');
    }
  };

  const handleEdit = (phrase: CustomDotPhrase) => {
    setFormData({
      trigger: phrase.trigger,
      content: phrase.content,
      description: phrase.description,
      category: phrase.category
    });
    setEditingId(phrase.id);
    setIsCreating(false);
  };

  const handleDelete = async (id: string) => {
    if (!auth.user?.id_token) {
      alert("You must be logged in to delete dot phrases.");
      return;
    }
    if (confirm('Are you sure you want to delete this dot phrase?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error('Error deleting dot phrase:', err);
        alert(err instanceof Error ? err.message : 'Failed to delete dot phrase');
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    resetForm();
  };

  const filteredPhrases = customPhrases.filter(phrase => {
    const matchesSearch = phrase.trigger.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         phrase.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         phrase.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || phrase.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  

  // Helper function to preview content (truncate long text)
  const previewContent = (content: string) => {
    const plainText = content.replace(/\[\[.*?\]\]/g, '[...]');
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  // Helper to parse smart options
  const parseSmartOptions = (text: string) => {
    const regex = /\[\[([^\]]+?)\]\]/g;
    const matches = [];
    let match;
    while ((match = regex.exec(text))) {
      const options = match[1].split('|');
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        options,
        selectedIdx: 0
      });
    }
    return matches;
  };

  const enhancedPreview = (content: string) => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].startsWith('[[') && parts[i].endsWith(']]')) {
        const match = parts[i].slice(2, -2).split('|');
        if (match.length > 1) {
          elements.push(
            <span key={i} style={{ display: 'inline-block', margin: '0 4px' }}>
              <span style={{
                background: '#e0e7ff',
                color: '#3730a3',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: '0.95em',
                border: '1px solid #a5b4fc',
                display: 'inline-block',
                marginRight: 2
              }}>
                {match.join(' / ')}
              </span>
            </span>
          );
        } else if (match[0] === 'DATE') {
          elements.push(
            <span key={i} style={{ display: 'inline-block', margin: '0 4px' }}>
              <span style={{
                background: '#fef9c3',
                color: '#92400e',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: '0.95em',
                border: '1px solid #fde68a',
                display: 'inline-block',
                marginRight: 2
              }}>
                Date
              </span>
            </span>
          );
        }
      } else {
        const text = parts[i];
        text.split('\n').forEach((line, j, arr) => {
          elements.push(line);
          if (j < arr.length - 1) elements.push(<br key={lastIdx + j} />);
        });
      }
      lastIdx += parts[i].length;
    }
    return elements;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dotManager.title')}</h1>
        <p className="text-gray-600">{t('dotManager.subtitle')}</p>
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
            {t('dotManager.howTo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <div className="space-y-2 text-sm">
            <p><strong>{t('dotManager.triggers')}:</strong> {t('dotManager.triggersDesc')}</p>
            <p><strong>{t('dotManager.smartOptions')}:</strong> {t('dotManager.smartOptionsDesc')}</p>
            <p><strong>{t('dotManager.example')}:</strong> {t('dotManager.exampleDesc')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder={t('dotManager.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 border border-gray-300 rounded-md"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">{t('dotManager.allCategories')}</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </option>
          ))}
        </select>
        <Button 
          onClick={() => setImportModalOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
          disabled={isCreating || editingId !== null || loading}
        >
          <Download className="w-4 h-4" />
          Import
        </Button>
        <Button 
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
          disabled={isCreating || editingId !== null || loading || createMutation.isPending}
        >
          <Plus className="w-4 h-4" />
          {t('dotManager.newPhrase')}
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-gray-500">Loading dot phrases...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="mb-6 border-2 border-blue-200" style={{ position: 'relative' }}>
          <CardHeader>
            <CardTitle>{editingId ? t('dotManager.edit') : t('dotManager.createNew')}</CardTitle>
            <CardDescription>
              {editingId ? t('dotManager.updateExisting') : t('dotManager.addNew')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">{t('dotManager.trigger')}</label>
                <Input
                  placeholder="/myshortcut"
                  value={formData.trigger}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t('dotManager.category')}</label>
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
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('dotManager.description')}</label>
              <Input
                placeholder={t('dotManager.description')}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">{t('dotManager.content')}</label>
              <DotPhraseTextarea
                value={formData.content}
                onChange={(val) => setFormData(prev => ({ ...prev, content: val }))}
                placeholder={t('dotManager.content')}
                rows={4}
                className="w-full min-w-[600px]"
                onRef={(ref) => setTextareaRef(ref)}
                isCreationMode={true}
              />
              
              {/* Enhanced Smart Function Builder */}
              <SmartFunctionBuilder
                onInsert={handleSmartFunctionInsert}
                className="mt-2"
              />
            </div>

            {/* Enhanced Interactive Preview */}
            {formData.content && (
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  {t('dotManager.preview')}
                  <Badge variant="secondary" className="text-xs">Interactive</Badge>
                </label>
                <div className="border rounded-lg overflow-hidden">
                  {/* Static Preview */}
                  <div className="p-3 bg-gray-50 border-b text-sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                    <div className="text-xs text-gray-600 mb-2 font-medium">Visual Preview:</div>
                    {enhancedPreview(formData.content)}
                  </div>
                  
                  {/* Interactive Testing Area */}
                  {parseSmartOptions(formData.content).length > 0 && (
                    <div className="p-3 bg-blue-50">
                      <div className="text-xs text-blue-700 mb-2 font-medium">
                        Test Interactive Functions ({parseSmartOptions(formData.content).length} detected):
                      </div>
                      <DotPhraseTextarea
                        value={formData.content}
                        onChange={() => {}} // Read-only for testing
                        placeholder="This preview shows how your dot phrase will work when used"
                        rows={2}
                        className="w-full bg-white text-sm"
                        disabled={true}
                        isCreationMode={true}
                      />
                      <p className="text-xs text-blue-600 mt-1">
                        This shows how users will see your smart functions in action. Click dropdown arrows to test options.
                      </p>
                    </div>
                  )}
                  
                  {/* Analysis */}
                  <div className="p-3 bg-white border-t">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between items-center">
                        <span>Smart Functions:</span>
                        <span className="font-medium">{parseSmartOptions(formData.content).length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Character Length:</span>
                        <span className="font-medium">{formData.content.length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Contains Calculations:</span>
                        <span className="font-medium">{formData.content.includes('/calc') ? 'Yes' : 'No'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Contains Dates:</span>
                        <span className="font-medium">{formData.content.includes('[[DATE]]') ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                className="flex items-center gap-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="w-4 h-4" />
                {editingId ? t('dotManager.update') : t('dotManager.create')}
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="w-4 h-4" />
                {t('dotManager.cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phrases List */}
      {!loading && (
        <div className="space-y-4">
          {filteredPhrases.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? t('dotManager.noMatch')
                    : t('dotManager.noCustom')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredPhrases.map(phrase => (
              <Card key={phrase.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                          {phrase.trigger}
                        </code>
                        <Badge variant="secondary">{phrase.category}</Badge>
                        {phrase.shareCode && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <Share2 className="w-3 h-3 mr-1" />
                            Shared
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 mb-1">{phrase.description}</h3>
                      <p className="text-sm text-gray-600 mb-2">{previewContent(phrase.content)}</p>
                      <p className="text-xs text-gray-400">
                        Updated {phrase.updatedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPhraseForShare(phrase);
                          setShareModalOpen(true);
                        }}
                        disabled={isCreating || editingId !== null}
                        title="Share this dot phrase"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(phrase)}
                        disabled={isCreating || editingId !== null || createMutation.isPending || updateMutation.isPending}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(phrase.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={deleteMutation.isPending}
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

      {/* Share Modal */}
      {selectedPhraseForShare && (
        <ShareDotPhraseModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedPhraseForShare(null);
          }}
          dotPhrase={selectedPhraseForShare}
        />
      )}

      {/* Import Modal */}
      <ImportDotPhraseModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={(importedPhrase) => {
          // The phrase will be automatically added to the list via React Query cache
          console.log('Successfully imported:', importedPhrase.trigger);
        }}
      />
    </div>
  );
}