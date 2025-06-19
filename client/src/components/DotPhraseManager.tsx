import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit2, Trash2, Save, X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/contexts/LanguageContext';
import { Tabs, Tab } from '@/components/ui/tabs';

export interface CustomDotPhrase {
  id: string;
  trigger: string; // The slash command (e.g., "/chest")
  content: string; // The phrase content with [[options]]
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DotPhraseManagerProps {
  onDotPhrasesChange?: (phrases: CustomDotPhrase[]) => void;
}

export function DotPhraseManager({ onDotPhrasesChange }: DotPhraseManagerProps) {
  const [customPhrases, setCustomPhrases] = useState<CustomDotPhrase[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form state for creating/editing
  const [formData, setFormData] = useState({
    trigger: '',
    content: '',
    description: '',
    category: 'general'
  });

  const { t } = useLanguage();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showOptionDialog, setShowOptionDialog] = useState(false);
  const [optionInput, setOptionInput] = useState('');

  // Smart Option Panel State
  const [showOptionPanel, setShowOptionPanel] = useState(false);
  const [optionInputs, setOptionInputs] = useState<string[]>(['']);
  const [smartTab, setSmartTab] = useState<'dropdown'|'date'>('dropdown');

  // Load saved phrases from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('customDotPhrases');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomPhrases(parsed.map((p: any) => ({
          ...p,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt)
        })));
      } catch (error) {
        console.error('Failed to load custom dot phrases:', error);
      }
    }
  }, []);

  // Save phrases to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customDotPhrases', JSON.stringify(customPhrases));
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

  const handleSave = () => {
    const error = validateForm();
    if (error) {
      alert(error);
      return;
    }

    const now = new Date();
    
    if (editingId) {
      // Update existing phrase
      setCustomPhrases(phrases => phrases.map(p => 
        p.id === editingId 
          ? { ...p, ...formData, updatedAt: now }
          : p
      ));
      setEditingId(null);
    } else {
      // Create new phrase
      const newPhrase: CustomDotPhrase = {
        id: Date.now().toString(),
        ...formData,
        createdAt: now,
        updatedAt: now
      };
      setCustomPhrases(phrases => [...phrases, newPhrase]);
      setIsCreating(false);
    }
    
    resetForm();
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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this dot phrase?')) {
      setCustomPhrases(phrases => phrases.filter(p => p.id !== id));
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

  const parseSmartOptions = (content: string) => {
    const regex = /\[\[([^\]]+?)\]\]/g;
    const matches = [];
    let match;
    while ((match = regex.exec(content))) {
      matches.push(match[1].split('|'));
    }
    return matches;
  };

  const previewContent = (content: string) => {
    const smartOptions = parseSmartOptions(content);
    if (smartOptions.length === 0) return content;
    
    let result = content;
    smartOptions.forEach(options => {
      const pattern = `[[${options.join('|')}]]`;
      result = result.replace(pattern, `[${options[0]}]`);
    });
    return result;
  };

  // Insert smart option at cursor
  const handleInsertOption = () => {
    if (!textareaRef.current) return;
    const options = optionInputs.map(opt => opt.trim()).filter(Boolean);
    if (options.length === 0) return;
    const smartSyntax = `[[${options.join('|')}]]`;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = formData.content.slice(0, start);
    const after = formData.content.slice(end);
    const newContent = before + smartSyntax + after;
    setFormData(prev => ({ ...prev, content: newContent }));
    setShowOptionPanel(false);
    setOptionInputs(['']);
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = before.length + smartSyntax.length;
    }, 0);
  };

  // UI for smart option panel
  const SmartOptionPanel = () => (
    <div style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 8, padding: 16, position: 'absolute', zIndex: 100, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', left: 0, top: -180, minWidth: 320, maxWidth: 400 }}>
      <div className="mb-2 font-medium">{t('dotManager.insertSmartOptionTitle')}</div>
      <div className="mb-4 flex gap-2">
        <button className={`px-3 py-1 rounded ${smartTab==='dropdown'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-600'}`} onClick={()=>setSmartTab('dropdown')}>{t('dotManager.tabDropdown')}</button>
        <button className={`px-3 py-1 rounded ${smartTab==='date'?'bg-blue-100 text-blue-800':'bg-gray-100 text-gray-600'}`} onClick={()=>setSmartTab('date')}>{t('dotManager.tabDate')}</button>
      </div>
      {smartTab === 'dropdown' && (
        <>
          <div className="text-sm text-gray-600 mb-2">{t('dotManager.insertSmartOptionDesc')}</div>
          {optionInputs.map((val, idx) => (
            <input
              key={idx}
              type="text"
              className="border px-2 py-1 rounded w-full mb-2"
              placeholder={`Option ${idx + 1}`}
              value={val}
              onChange={e => setOptionInputs(inputs => inputs.map((v, i) => i === idx ? e.target.value : v))}
            />
          ))}
          <Button type="button" size="sm" variant="outline" onClick={() => setOptionInputs(inputs => [...inputs, ''])}>
            + {t('dotManager.addAnotherOption')}
          </Button>
        </>
      )}
      {smartTab === 'date' && (
        <>
          <div className="text-sm text-gray-600 mb-2">{t('dotManager.datePickerDesc')}</div>
          <div className="mb-2 text-xs text-gray-500">{t('dotManager.datePickerExample')}</div>
        </>
      )}
      <div className="mt-3 text-xs text-gray-400">{t('dotManager.moreSmartOptionsSoon')}</div>
      <div className="flex gap-2 mt-4">
        <Button type="button" onClick={() => {
          if (!textareaRef.current) return;
          const textarea = textareaRef.current;
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const before = formData.content.slice(0, start);
          const after = formData.content.slice(end);
          let insertVal = '';
          if (smartTab === 'dropdown') {
            const options = optionInputs.map(opt => opt.trim()).filter(Boolean);
            if (options.length === 0) return;
            insertVal = `[[${options.join('|')}]]`;
          } else if (smartTab === 'date') {
            insertVal = '[[DATE]]';
          }
          const newContent = before + insertVal + after;
          setFormData(prev => ({ ...prev, content: newContent }));
          setShowOptionPanel(false);
          setOptionInputs(['']);
          setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = before.length + insertVal.length;
          }, 0);
        }}>{t('dotManager.insert')}</Button>
        <Button type="button" variant="outline" onClick={() => { setShowOptionPanel(false); setOptionInputs(['']); }}>{t('dotManager.cancel')}</Button>
      </div>
    </div>
  );

  // Enhanced preview: preserve line breaks and show options as chips
  const enhancedPreview = (content: string) => {
    // Replace smart options and date pickers with chips
    const regex = /\[\[([^\]]+?)\]\]/g;
    let lastIdx = 0;
    const elements: React.ReactNode[] = [];
    let match;
    while ((match = regex.exec(content))) {
      if (match.index > lastIdx) {
        const text = content.slice(lastIdx, match.index);
        text.split('\n').forEach((line, i, arr) => {
          elements.push(line);
          if (i < arr.length - 1) elements.push(<br key={lastIdx + i} />);
        });
      }
      if (match[1] === 'DATE') {
        elements.push(
          <span key={match.index} style={{ display: 'inline-block', margin: '0 4px' }}>
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
      } else {
        const options = match[1].split('|');
        elements.push(
          <span key={match.index} style={{ display: 'inline-block', margin: '0 4px' }}>
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
              {options.join(' / ')}
            </span>
          </span>
        );
      }
      lastIdx = match.index + match[0].length;
    }
    if (lastIdx < content.length) {
      content.slice(lastIdx).split('\n').forEach((line, i, arr) => {
        elements.push(line);
        if (i < arr.length - 1) elements.push(<br key={lastIdx + i} />);
      });
    }
    return elements;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('dotManager.title')}</h1>
        <p className="text-gray-600">{t('dotManager.subtitle')}</p>
      </div>

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
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2"
          disabled={isCreating || editingId !== null}
        >
          <Plus className="w-4 h-4" />
          {t('dotManager.newPhrase')}
        </Button>
      </div>

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
              {/* Add Smart Option button above and left of textarea */}
              <div className="mb-2 flex items-center gap-2">
                <Button type="button" onClick={() => setShowOptionPanel(true)}>
                  + {t('dotManager.addSmartOption')}
                </Button>
                <span className="text-xs text-gray-500">{t('dotManager.smartOptionsHint')}</span>
              </div>
              <label className="block text-sm font-medium mb-2">{t('dotManager.content')}</label>
              <div style={{ position: 'relative' }}>
              <Textarea
                  ref={textareaRef}
                  placeholder={t('dotManager.content')}
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
                {showOptionPanel && <SmartOptionPanel />}
              </div>
            </div>

            {/* Preview */}
            {formData.content && (
              <div>
                <label className="block text-sm font-medium mb-2">{t('dotManager.preview')}</label>
                <div className="p-3 bg-gray-50 border rounded-md text-sm" style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                  {enhancedPreview(formData.content)}
                </div>
                {parseSmartOptions(formData.content).length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dotManager.smartOptionsDetected').replace('{count}', parseSmartOptions(formData.content).length.toString())}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
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
                      onClick={() => handleEdit(phrase)}
                      disabled={isCreating || editingId !== null}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(phrase.id)}
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
    </div>
  );
}