import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { RosSymptomAccordion } from './RosSymptomAccordion';
import { Button } from '@/components/ui/button';

export interface HpiSectionProps {
  selectedSymptoms: Record<string, Set<string>>;
  setSelectedSymptoms: (updater: (prev: Record<string, Set<string>>) => Record<string, Set<string>>) => void;
}

function getRosCustomSummary(selectedSymptoms: Record<string, Set<string>>): string {
  // Create a human-readable summary for the dotphrase
  return Object.entries(selectedSymptoms)
    .filter(([_, set]) => set.size > 0)
    .map(([system, set]) => {
      const symptoms = Array.from(set).join(', ');
      return `${system.charAt(0).toUpperCase() + system.slice(1)}: ${symptoms}`;
    })
    .join('; ');
}

export function HpiSection({ selectedSymptoms, setSelectedSymptoms }: HpiSectionProps) {
  const { language } = useLanguage();
  // Preset state (persist in localStorage for demo, could be in backend)
  const [customPresets, setCustomPresets] = useState<{ name: string; command: string; symptoms: Record<string, string[]> }[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hpiCustomPresets');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [presetName, setPresetName] = useState('');
  const [presetCommand, setPresetCommand] = useState('');
  const [error, setError] = useState('');

  // Save current selection as preset and update dotphrase
  const handleSavePreset = () => {
    setError('');
    if (!presetName.trim()) {
      setError('Name required');
      return;
    }
    if (!presetCommand.trim() || !presetCommand.startsWith('/')) {
      setError('Command must start with /');
      return;
    }
    // Check for duplicate command
    if (customPresets.some(p => p.command === presetCommand.trim())) {
      setError('Command already exists');
      return;
    }
    const symptomsObj: Record<string, string[]> = {};
    Object.entries(selectedSymptoms).forEach(([system, set]) => {
      symptomsObj[system] = Array.from(set);
    });
    const newPresets = [...customPresets, { name: presetName.trim(), command: presetCommand.trim(), symptoms: symptomsObj }];
    setCustomPresets(newPresets);
    localStorage.setItem('hpiCustomPresets', JSON.stringify(newPresets));
    setPresetName('');
    setPresetCommand('');

    // Update dotphrases in localStorage
    const customDotPhrases = JSON.parse(localStorage.getItem('customDotPhrases') || '[]');
    const now = new Date();
    const newDotPhrase = {
      id: presetCommand.trim().replace(/^\//, ''),
      trigger: presetCommand.trim(),
      content: getRosCustomSummary(selectedSymptoms),
      description: `Custom ROS/HPI selection: ${presetName.trim()}`,
      category: 'general',
      createdAt: now,
      updatedAt: now
    };
    // Remove any existing with same trigger
    const filtered = customDotPhrases.filter((p: any) => p.trigger !== presetCommand.trim());
    filtered.push(newDotPhrase);
    localStorage.setItem('customDotPhrases', JSON.stringify(filtered));
  };

  // Apply a preset
  const handleApplyPreset = (symptoms: Record<string, string[]>) => {
    setSelectedSymptoms(() => {
      const newObj: Record<string, Set<string>> = {};
      Object.entries(symptoms).forEach(([system, arr]) => {
        newObj[system] = new Set(arr);
      });
      return newObj;
    });
  };

  // Delete a preset and its dotphrase
  const handleDeletePreset = (command: string) => {
    const newPresets = customPresets.filter(p => p.command !== command);
    setCustomPresets(newPresets);
    localStorage.setItem('hpiCustomPresets', JSON.stringify(newPresets));
    // Remove dotphrase
    const customDotPhrases = JSON.parse(localStorage.getItem('customDotPhrases') || '[]');
    const filtered = customDotPhrases.filter((p: any) => p.trigger !== command);
    localStorage.setItem('customDotPhrases', JSON.stringify(filtered));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Helper Text */}
      <div className="mb-4 text-sm text-gray-600">
        {language === 'fr'
          ? 'Sélectionnez les systèmes et symptômes pertinents pour générer une HMA structurée.'
          : 'Select relevant systems and symptoms to generate a structured HPI.'}
      </div>
      {/* Custom Preset Save/Load UI */}
      <div className="mb-4 flex flex-col gap-2">
        <div className="flex gap-2 items-end">
          <input
            className="border rounded px-2 py-1 text-sm flex-1"
            type="text"
            placeholder={language === 'fr' ? 'Preset name...' : 'Preset name...'}
            value={presetName}
            onChange={e => setPresetName(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm w-40"
            type="text"
            placeholder={language === 'fr' ? 'Command (e.g. /roscustom)' : 'Command (e.g. /roscustom)'}
            value={presetCommand}
            onChange={e => setPresetCommand(e.target.value)}
          />
          <Button
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
            onClick={handleSavePreset}
            disabled={!presetName.trim() || !presetCommand.trim()}
            type="button"
          >
            {language === 'fr' ? 'Enregistrer la sélection' : 'Save Selection'}
          </Button>
        </div>
        {error && <div className="text-xs text-red-500">{error}</div>}
        {customPresets.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">{language === 'fr' ? 'Préréglages personnalisés :' : 'Custom Presets:'}</span>
            {customPresets.map((preset, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <Button
                  className="px-3 py-1 text-xs rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200 border border-cyan-200"
                  onClick={() => handleApplyPreset(preset.symptoms)}
                  type="button"
                >
                  {preset.name} <span className="ml-1 text-gray-400">{preset.command}</span>
                </Button>
                <Button
                  className="px-1 py-1 text-xs rounded text-red-500 hover:text-white hover:bg-red-500 border border-red-200 bg-white"
                  onClick={() => handleDeletePreset(preset.command)}
                  type="button"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Modern Card for Accordion */}
      <div className="bg-white rounded-2xl shadow-lg p-4">
        <RosSymptomAccordion
          selectedSymptoms={selectedSymptoms}
          setSelectedSymptoms={setSelectedSymptoms}
        />
      </div>
    </div>
  );
}

export default HpiSection;
