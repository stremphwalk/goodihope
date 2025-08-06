import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import RosSymptomAccordion from './RosSymptomAccordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Star, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';  // Assuming auth for user ID

interface SymptomObject {
  key: string;
  severity?: 'mild' | 'moderate' | 'severe';
  note?: string;
}

interface Preset {
  id: string;
  title: string;
  isFavorite: boolean;
  symptoms: Record<string, SymptomObject[]>;
}

export interface HpiSectionProps {
  selectedSymptoms: Record<string, Set<SymptomObject>>;
  setSelectedSymptoms: (updater: (prev: Record<string, Set<SymptomObject>>) => Record<string, Set<SymptomObject>>) => void;
}

export function HpiSection({ selectedSymptoms: globalSelectedSymptoms, setSelectedSymptoms: setGlobalSelectedSymptoms }: HpiSectionProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const auth = useAuth();
  const [presetTitle, setPresetTitle] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRequestTime, setLastRequestTime] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [localSelectedSymptoms, setLocalSelectedSymptoms] = useState<Record<string, Set<SymptomObject>>>(globalSelectedSymptoms);

  // Keep parent state in sync whenever the local selection changes
  useEffect(() => {
    setGlobalSelectedSymptoms(() => localSelectedSymptoms);
  }, [localSelectedSymptoms, setGlobalSelectedSymptoms]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (auth.user?.id_token && !loading && auth.isAuthenticated) {
      const now = Date.now();
      // Prevent requests more frequent than 2 seconds
      if (now - lastRequestTime > 2000) {
        console.log('[DEBUG] HpiSection: Loading presets, token changed or initial load');
        setLastRequestTime(now);
        loadPresets();
      } else {
        console.log('[DEBUG] HpiSection: Skipping request, too frequent');
      }
    } else {
      console.log('[DEBUG] HpiSection: Not authenticated or no token, skipping request');
    }
  }, [auth.user?.id_token, auth.isAuthenticated]); // Added auth.isAuthenticated to dependencies

  const loadPresets = useCallback(async () => {
    if (!auth.user?.id_token || !auth.isAuthenticated) {
      console.log('[DEBUG] HpiSection: Not authenticated, skipping loadPresets');
      return;
    }
    console.log('[DEBUG] HpiSection: Starting loadPresets');
    setLoading(true);
    try {
      const response = await fetch('/api/user-presets', {
        headers: { Authorization: `Bearer ${auth.user.id_token}` },
      });
      if (!response.ok) throw new Error('Failed to load presets');
      const data: Preset[] = await response.json();
      
      // Validate that data is an array before calling .sort()
      if (!Array.isArray(data)) {
        console.error('Presets API response is not an array:', data);
        setPresets([]);
        return;
      }
      
      // Sort favorites first
      setPresets(data.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)));
      console.log('[DEBUG] HpiSection: Loaded presets successfully');
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load presets', variant: 'destructive' });
      setPresets([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [auth.user?.id_token, auth.isAuthenticated, toast]);

  const savePreset = async () => {
    if (!auth.user?.id_token || !auth.isAuthenticated) {
      console.log('[DEBUG] HpiSection: Not authenticated, skipping savePreset');
      return;
    }
    
    if (Object.keys(localSelectedSymptoms).length === 0) {
      setError(language === 'fr' ? 'Aucune sélection à sauvegarder' : 'No selections to save');
      return;
    }
    if (!presetTitle.trim()) {
      setError('Title required');
      return;
    }
    if (presets.length >= 20) {
      setError(language === 'fr' ? 'Limite de 20 préréglages' : 'Max 20 presets');
      return;
    }
    if (presets.some(p => p.title === presetTitle.trim())) {
      setError('Duplicate title');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const symptomsObj: Record<string, SymptomObject[]> = {};
      Object.entries(localSelectedSymptoms).forEach(([system, set]) => {
        symptomsObj[system] = Array.from(set);
      });
      const newPreset = {
        title: presetTitle.trim(),
        isFavorite: false,
        symptoms: symptomsObj,
      };
      const response = await fetch('/api/user-presets', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.user?.id_token}`,
        },
        body: JSON.stringify(newPreset),
      });
      if (!response.ok) throw new Error('Failed to save preset');
      const saved: Preset = await response.json();
      setPresets(prev => [...prev, saved].sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)));
      setPresetTitle('');
      toast({ title: 'Success', description: 'Preset saved' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to save preset', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    setLocalSelectedSymptoms(() => {
      const newObj: Record<string, Set<SymptomObject>> = {};
      Object.entries(preset.symptoms).forEach(([system, arr]) => {
        newObj[system] = new Set(arr);
      });
      return newObj;
    });
  };

  const toggleFavorite = async (presetId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (!auth.user?.id_token || !auth.isAuthenticated) {
      console.log('[DEBUG] HpiSection: Not authenticated, skipping toggleFavorite');
      return;
    }
    
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    // Optimistically update the UI
    const updatedPresets = presets.map(p => 
      p.id === presetId ? { ...p, isFavorite: !p.isFavorite } : p
    ).sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
    
    setPresets(updatedPresets);
    
    try {
      const response = await fetch(`/api/user-presets/${presetId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.user?.id_token}`,
        },
        body: JSON.stringify({ isFavorite: !preset.isFavorite }),
      });
      if (!response.ok) throw new Error('Failed to update favorite');
      // Keep the optimistic update
    } catch (err) {
      console.error(err);
      // Revert on error
      setPresets(prev => prev.map(p => 
        p.id === presetId ? { ...p, isFavorite: preset.isFavorite } : p
      ).sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)));
      toast({ title: 'Error', description: 'Failed to toggle favorite', variant: 'destructive' });
    }
  };

  const handleConfirm = () => {
    setGlobalSelectedSymptoms(() => localSelectedSymptoms);
    toast({ title: 'Success', description: 'Selections confirmed and note updated' });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 relative">
      {/* Enhanced Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-800">
            {language === 'fr' ? 'Histoire de la Maladie Actuelle' : 'History of Present Illness'}
          </h2>
        </div>
        <p className="text-sm text-gray-600 max-w-md mx-auto">
          {language === 'fr' 
            ? 'Sélectionnez les systèmes et symptômes pour créer une HMA structurée et organisée.'
            : 'Select systems and symptoms to create a structured and organized HPI.'
          }
        </p>
      </div>

      {/* Enhanced Preset UI */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-700">
            {language === 'fr' ? 'Gestion des Préréglages HPI' : 'HPI Preset Management'}
          </h3>
        </div>
        
        <div className="flex gap-2">
          <Input
            placeholder={language === 'fr' ? 'Titre du préréglage...' : 'Preset title...'}
            value={presetTitle}
            onChange={e => setPresetTitle(e.target.value)}
            className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <Button 
            onClick={savePreset} 
            disabled={loading || !presetTitle.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {language === 'fr' ? 'Sauvegarde...' : 'Saving...'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                {language === 'fr' ? 'Sauvegarder' : 'Save'}
              </div>
            )}
          </Button>
        </div>
        
        {error && (
          <div className="text-xs text-red-600 flex items-center gap-1 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        {presets.length > 0 ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {language === 'fr' ? 'Sélectionner un préréglage' : 'Select a preset'}
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-white border border-gray-300 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-md px-3 py-2 text-sm"
              >
                <span className={selectedPresetId ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedPresetId 
                    ? presets.find(p => p.id === selectedPresetId)?.title 
                    : (language === 'fr' ? 'Choisir un préréglage...' : 'Choose a preset...')
                  }
                </span>
                <svg className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg rounded-md max-h-60 overflow-y-auto">
                  {presets.map(preset => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        applyPreset(preset.id);
                        setSelectedPresetId(preset.id);
                        setIsDropdownOpen(false);
                      }}
                    >
                      <div className="flex items-center flex-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => toggleFavorite(preset.id, e)}
                          className="mr-2 h-6 w-6 hover:bg-yellow-100 rounded-full"
                        >
                          <Star className={`w-4 h-4 ${preset.isFavorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`} />
                        </Button>
                        <span className="text-sm font-medium text-gray-900">{preset.title}</span>
                      </div>
                      {preset.isFavorite && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                          {language === 'fr' ? 'Favori' : 'Favorite'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {language === 'fr' 
                ? `${presets.length} préréglage${presets.length > 1 ? 's' : ''} disponible${presets.length > 1 ? 's' : ''}`
                : `${presets.length} preset${presets.length > 1 ? 's' : ''} available`
              }
            </p>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600">
              {language === 'fr' 
                ? 'Aucun préréglage sauvegardé. Créez votre premier préréglage ci-dessus.'
                : 'No presets saved yet. Create your first preset above.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">
            {language === 'fr' ? 'Sélection des Symptômes' : 'Symptom Selection'}
          </span>
        </div>
      </div>

      {/* Symptom Accordion and Confirm Button */}
      <div className="relative pb-16"> {/* Added padding bottom to make space for sticky button */}
        <RosSymptomAccordion selectedSymptoms={localSelectedSymptoms} setSelectedSymptoms={setLocalSelectedSymptoms} />
        <div className="sticky bottom-0 flex justify-end pr-4"> {/* Changed to justify-end and added padding-right */}
          <Button 
            onClick={handleConfirm}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {language === 'fr' ? 'Confirmer Sélections' : 'Confirm Selections'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default memo(HpiSection);