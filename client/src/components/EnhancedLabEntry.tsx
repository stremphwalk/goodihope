import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  FlaskConical,
  Heart,
  Droplets,
  Activity
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LabValue } from '@/lib/labUtils';

interface LabTest {
  id: string;
  name: string;
  unit: string;
  category: string;
  icon?: React.ReactNode;
  referenceRange?: string;
  normalRange?: [number, number];
}

interface LabGroup {
  name: string;
  panelId: string;
  icon: React.ReactNode;
  color: string;
  tests: LabTest[];
}

interface LabEntryValue {
  value: string;
}

interface EnhancedLabEntryProps {
  onLabAdd: (labValues: LabValue[]) => void;
  selectedLabs: string[];
  selectedPanel: string;
  setSelectedPanel: (panelId: string) => void;
  pendingLabEntries: Record<string, string[]>;
  setPendingLabEntries: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  confirmAllPendingEntries?: () => Promise<void>;
  isConfirming?: boolean;
  totalPendingEntries?: number;
}

const LAB_GROUPS: LabGroup[] = [
  {
    name: 'Basic Metabolic Panel',
    panelId: 'bmp',
    icon: <FlaskConical className="h-4 w-4" />,
    color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    tests: [
      { id: 'sodium', name: 'Na', unit: 'mmol/L', category: 'BMP', referenceRange: '136-145', normalRange: [136, 145] },
      { id: 'potassium', name: 'K', unit: 'mmol/L', category: 'BMP', referenceRange: '3.5-5.1', normalRange: [3.5, 5.1] },
      { id: 'chloride', name: 'Cl', unit: 'mmol/L', category: 'BMP', referenceRange: '98-107', normalRange: [98, 107] },
      { id: 'co2', name: 'CO2', unit: 'mmol/L', category: 'BMP', referenceRange: '22-28', normalRange: [22, 28] },
      { id: 'bun', name: 'BUN', unit: 'mmol/L', category: 'BMP', referenceRange: '2.5-7.1', normalRange: [2.5, 7.1] },
      { id: 'creatinine', name: 'Creat', unit: 'μmol/L', category: 'BMP', referenceRange: '53-106', normalRange: [53, 106] },
      { id: 'glucose', name: 'Glucose', unit: 'mmol/L', category: 'BMP', referenceRange: '3.9-5.6', normalRange: [3.9, 5.6] },
      { id: 'egfr', name: 'eGFR', unit: 'mL/min/1.73m²', category: 'BMP', referenceRange: '>60', normalRange: [60, 999] },
    ]
  },
  {
    name: 'CBC with Differential',
    panelId: 'cbc',
    icon: <Droplets className="h-4 w-4" />,
    color: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
    tests: [
      { id: 'hb', name: 'Hb', unit: 'g/L', category: 'CBC', referenceRange: '120-160', normalRange: [120, 160] },
      { id: 'hct', name: 'Hct', unit: 'L/L', category: 'CBC', referenceRange: '0.36-0.46', normalRange: [0.36, 0.46] },
      { id: 'wbc', name: 'WBC', unit: '×10⁹/L', category: 'CBC', referenceRange: '4.5-11.0', normalRange: [4.5, 11.0] },
      { id: 'rbc', name: 'RBC', unit: '×10¹²/L', category: 'CBC', referenceRange: '4.2-5.4', normalRange: [4.2, 5.4] },
      { id: 'plt', name: 'Plt', unit: '×10⁹/L', category: 'CBC', referenceRange: '150-450', normalRange: [150, 450] },
      { id: 'mcv', name: 'MCV', unit: 'fL', category: 'CBC', referenceRange: '80-100', normalRange: [80, 100] },
      { id: 'mch', name: 'MCH', unit: 'pg', category: 'CBC', referenceRange: '27-31', normalRange: [27, 31] },
      { id: 'mchc', name: 'MCHC', unit: 'g/L', category: 'CBC', referenceRange: '320-360', normalRange: [320, 360] },
      { id: 'rdw', name: 'RDW', unit: '%', category: 'CBC', referenceRange: '11.5-14.5', normalRange: [11.5, 14.5] },
      { id: 'neutrophils', name: 'Neutrophils', unit: '%', category: 'CBC', referenceRange: '50-70', normalRange: [50, 70] },
      { id: 'lymphocytes', name: 'Lymphocytes', unit: '%', category: 'CBC', referenceRange: '20-40', normalRange: [20, 40] },
      { id: 'monocytes', name: 'Monocytes', unit: '%', category: 'CBC', referenceRange: '2-8', normalRange: [2, 8] },
    ]
  },
  {
    name: 'Liver Function Tests',
    panelId: 'lft',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800',
    tests: [
      { id: 'alt', name: 'ALT', unit: 'U/L', category: 'LFT', referenceRange: '7-56', normalRange: [7, 56] },
      { id: 'ast', name: 'AST', unit: 'U/L', category: 'LFT', referenceRange: '10-40', normalRange: [10, 40] },
      { id: 'alp', name: 'ALP', unit: 'U/L', category: 'LFT', referenceRange: '44-147', normalRange: [44, 147] },
      { id: 'bilirubin_total', name: 'Total Bili', unit: 'μmol/L', category: 'LFT', referenceRange: '5-21', normalRange: [5, 21] },
      { id: 'bilirubin_direct', name: 'Direct Bili', unit: 'μmol/L', category: 'LFT', referenceRange: '0-5', normalRange: [0, 5] },
      { id: 'albumin', name: 'Albumin', unit: 'g/L', category: 'LFT', referenceRange: '35-50', normalRange: [35, 50] },
      { id: 'total_protein', name: 'Total Protein', unit: 'g/L', category: 'LFT', referenceRange: '60-83', normalRange: [60, 83] },
      { id: 'ggt', name: 'GGT', unit: 'U/L', category: 'LFT', referenceRange: '9-48', normalRange: [9, 48] },
    ]
  },
  {
    name: 'Lipid Panel',
    panelId: 'lipids',
    icon: <Heart className="h-4 w-4" />,
    color: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800',
    tests: [
      { id: 'cholesterol_total', name: 'Total Chol', unit: 'mmol/L', category: 'Lipids', referenceRange: '<5.2', normalRange: [0, 5.2] },
      { id: 'hdl', name: 'HDL', unit: 'mmol/L', category: 'Lipids', referenceRange: '>1.0', normalRange: [1.0, 999] },
      { id: 'ldl', name: 'LDL', unit: 'mmol/L', category: 'Lipids', referenceRange: '<2.6', normalRange: [0, 2.6] },
      { id: 'triglycerides', name: 'Triglycerides', unit: 'mmol/L', category: 'Lipids', referenceRange: '<1.7', normalRange: [0, 1.7] },
      { id: 'non_hdl', name: 'Non-HDL', unit: 'mmol/L', category: 'Lipids', referenceRange: '<3.4', normalRange: [0, 3.4] },
    ]
  },
  {
    name: 'Thyroid Panel',
    panelId: 'thyroid',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800',
    tests: [
      { id: 'tsh', name: 'TSH', unit: 'mU/L', category: 'Thyroid', referenceRange: '0.4-4.0', normalRange: [0.4, 4.0] },
      { id: 't4_free', name: 'Free T4', unit: 'pmol/L', category: 'Thyroid', referenceRange: '10-23', normalRange: [10, 23] },
      { id: 't3_free', name: 'Free T3', unit: 'pmol/L', category: 'Thyroid', referenceRange: '3.5-6.5', normalRange: [3.5, 6.5] },
      { id: 't3_total', name: 'Total T3', unit: 'nmol/L', category: 'Thyroid', referenceRange: '1.2-3.1', normalRange: [1.2, 3.1] },
    ]
  },
  {
    name: 'Cardiac Markers',
    panelId: 'cardiac',
    icon: <Heart className="h-4 w-4" />,
    color: 'bg-rose-50 border-rose-200 dark:bg-rose-950 dark:border-rose-800',
    tests: [
      { id: 'troponin_i', name: 'Troponin I', unit: 'ng/mL', category: 'Cardiac', referenceRange: '<0.04', normalRange: [0, 0.04] },
      { id: 'troponin_t', name: 'Troponin T', unit: 'ng/mL', category: 'Cardiac', referenceRange: '<0.01', normalRange: [0, 0.01] },
      { id: 'ck_mb', name: 'CK-MB', unit: 'ng/mL', category: 'Cardiac', referenceRange: '<6.3', normalRange: [0, 6.3] },
      { id: 'bnp', name: 'BNP', unit: 'pg/mL', category: 'Cardiac', referenceRange: '<100', normalRange: [0, 100] },
      { id: 'nt_probnp', name: 'NT-proBNP', unit: 'pg/mL', category: 'Cardiac', referenceRange: '<125', normalRange: [0, 125] },
    ]
  },
  {
    name: 'Inflammatory Markers',
    panelId: 'inflammatory',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800',
    tests: [
      { id: 'esr', name: 'ESR', unit: 'mm/hr', category: 'Inflammatory', referenceRange: '<30', normalRange: [0, 30] },
      { id: 'crp', name: 'CRP', unit: 'mg/L', category: 'Inflammatory', referenceRange: '<3.0', normalRange: [0, 3.0] },
      { id: 'procalcitonin', name: 'Procalcitonin', unit: 'ng/mL', category: 'Inflammatory', referenceRange: '<0.25', normalRange: [0, 0.25] },
      { id: 'ferritin', name: 'Ferritin', unit: 'ng/mL', category: 'Inflammatory', referenceRange: '15-150', normalRange: [15, 150] },
    ]
  },
  {
    name: 'Diabetic Panel',
    panelId: 'diabetic',
    icon: <FlaskConical className="h-4 w-4" />,
    color: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-950 dark:border-cyan-800',
    tests: [
      { id: 'glucose_fasting', name: 'Fasting Glucose', unit: 'mmol/L', category: 'Diabetic', referenceRange: '3.9-5.6', normalRange: [3.9, 5.6] },
      { id: 'hba1c', name: 'HbA1c', unit: '%', category: 'Diabetic', referenceRange: '<5.7', normalRange: [0, 5.7] },
      { id: 'glucose_random', name: 'Random Glucose', unit: 'mmol/L', category: 'Diabetic', referenceRange: '<7.8', normalRange: [0, 7.8] },
      { id: 'fructosamine', name: 'Fructosamine', unit: 'μmol/L', category: 'Diabetic', referenceRange: '205-285', normalRange: [205, 285] },
    ]
  },
  {
    name: 'Coagulation Studies',
    panelId: 'coagulation',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800',
    tests: [
      { id: 'pt', name: 'PT', unit: 'sec', category: 'Coagulation', referenceRange: '11-13', normalRange: [11, 13] },
      { id: 'ptt', name: 'PTT', unit: 'sec', category: 'Coagulation', referenceRange: '25-35', normalRange: [25, 35] },
      { id: 'inr', name: 'INR', unit: '', category: 'Coagulation', referenceRange: '0.8-1.1', normalRange: [0.8, 1.1] },
      { id: 'fibrinogen', name: 'Fibrinogen', unit: 'g/L', category: 'Coagulation', referenceRange: '2.0-4.0', normalRange: [2.0, 4.0] },
      { id: 'd_dimer', name: 'D-Dimer', unit: 'μg/L', category: 'Coagulation', referenceRange: '<500', normalRange: [0, 500] },
    ]
  }
];

export function EnhancedLabEntry({ 
  onLabAdd, 
  selectedPanel, 
  setSelectedPanel, 
  pendingLabEntries, 
  setPendingLabEntries,
  confirmAllPendingEntries,
  isConfirming = false,
  totalPendingEntries = 0
}: EnhancedLabEntryProps) {
  const { language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [labEntries, setLabEntries] = useState<Record<string, LabEntryValue[]>>({});
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [bulkValues, setBulkValues] = useState<Record<string, string>>({});

  // Custom lab state
  const [customLabName, setCustomLabName] = useState('');
  const [customLabValue, setCustomLabValue] = useState('');
  const [customLabUnit, setCustomLabUnit] = useState('');
  const [showCustomSuggestions, setShowCustomSuggestions] = useState(false);
  const [customSuggestions, setCustomSuggestions] = useState<LabTest[]>([]);
  const [selectedCustomIndex, setSelectedCustomIndex] = useState(-1);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const isValueAbnormal = (value: string, test: LabTest): 'high' | 'low' | 'normal' => {
    if (!test.normalRange || !value) return 'normal';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'normal';
    
    const [min, max] = test.normalRange;
    if (numValue < min) return 'low';
    if (numValue > max) return 'high';
    return 'normal';
  };

  const getValueColor = (status: 'high' | 'low' | 'normal') => {
    switch (status) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'low': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      default: return '';
    }
  };

  const addLabEntry = (testId: string, value: string) => {
    const trimmedValue = value.trim();
    if (!trimmedValue) return; // Don't add empty values
    
    setPendingLabEntries(prev => {
      const existingValues = prev[testId] || [];
      
      // Allow duplicate values - users should be able to enter the same value multiple times
      // This is important for tracking the same lab value over time
      
      // Limit to maximum 10 pending values per test to prevent memory issues
      const MAX_PENDING_VALUES = 10;
      if (existingValues.length >= MAX_PENDING_VALUES) {
        console.warn(`Maximum pending values (${MAX_PENDING_VALUES}) reached for test ${testId}`);
        return prev;
      }
      
      return {
        ...prev,
        [testId]: [...existingValues, trimmedValue]
      };
    });
  };

  const removePendingEntry = (testId: string, index: number) => {
    setPendingLabEntries(prev => ({
      ...prev,
      [testId]: (prev[testId] || []).filter((_, i) => i !== index)
    }));
  };

  const clearAllPendingForTest = (testId: string) => {
    setPendingLabEntries(prev => ({
      ...prev,
      [testId]: []
    }));
  };


  const removeLabEntry = (testId: string, index: number) => {
    setLabEntries(prev => ({
      ...prev,
      [testId]: prev[testId]?.filter((_, i) => i !== index) || []
    }));
  };


  // Calculate pending entries per panel
  const getPendingEntriesForPanel = useCallback((panelId: string) => {
    const panelTests = LAB_GROUPS.find(g => g.panelId === panelId)?.tests || [];
    return panelTests.reduce((count, test) => {
      return count + (pendingLabEntries[test.id]?.length || 0);
    }, 0);
  }, [pendingLabEntries]);

  const filteredGroups = LAB_GROUPS.filter(group => 
    group.panelId === selectedPanel
  ).map(group => ({
    ...group,
    tests: group.tests.filter(test => 
      !searchTerm || 
      test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(group => group.tests.length > 0);


  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Add a value to a custom lab
  const addCustomLabValue = () => {
    const name = customLabName.trim();
    const value = customLabValue.trim();
    if (!name || !value) return;
    const key = `custom:${name}`;
    setPendingLabEntries(prev => {
      const existing = prev[key] || [];
      return { ...prev, [key]: [...existing, value] };
    });
    setCustomLabValue('');
  };

  // Remove a value from a custom lab
  const removeCustomLabValue = (key: string, idx: number) => {
    setPendingLabEntries(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx)
    }));
  };

  // Remove the entire custom lab
  const removeCustomLab = (key: string) => {
    setPendingLabEntries(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // Auto-complete functionality for custom lab name
  const handleCustomLabNameChange = (value: string) => {
    setCustomLabName(value);
    
    if (value.length < 2) {
      setShowCustomSuggestions(false);
      setCustomSuggestions([]);
      return;
    }

    // Get all lab tests from all groups
    const allTests = LAB_GROUPS.flatMap(group => group.tests);
    
    // Filter tests that match the input
    const filteredTests = allTests.filter(test => 
      test.name.toLowerCase().includes(value.toLowerCase()) ||
      test.id.toLowerCase().includes(value.toLowerCase())
    );
    
    setCustomSuggestions(filteredTests.slice(0, 8)); // Limit to 8 suggestions
    setShowCustomSuggestions(filteredTests.length > 0);
    setSelectedCustomIndex(-1);
  };

  const handleCustomLabNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowCustomSuggestions(false);
      setSelectedCustomIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showCustomSuggestions && customSuggestions.length > 0) {
        setSelectedCustomIndex(prev => (prev + 1) % customSuggestions.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showCustomSuggestions && customSuggestions.length > 0) {
        setSelectedCustomIndex(prev => prev <= 0 ? customSuggestions.length - 1 : prev - 1);
      }
    } else if (e.key === 'Enter' && selectedCustomIndex >= 0 && customSuggestions[selectedCustomIndex]) {
      e.preventDefault();
      const selectedTest = customSuggestions[selectedCustomIndex];
      setCustomLabName(selectedTest.name);
      setCustomLabUnit(selectedTest.unit);
      setShowCustomSuggestions(false);
      setSelectedCustomIndex(-1);
    }
  };

  const handleCustomSuggestionClick = (test: LabTest) => {
    setCustomLabName(test.name);
    setCustomLabUnit(test.unit);
    setShowCustomSuggestions(false);
    setSelectedCustomIndex(-1);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Custom Lab Entry Section */}
      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-end gap-2">
          <div className="flex-1 relative">
            <label className="block text-xs font-medium mb-1">{language === 'fr' ? 'Nom du test personnalisé' : 'Custom Lab Name'}</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-xs"
              value={customLabName}
              onChange={e => handleCustomLabNameChange(e.target.value)}
              onKeyDown={handleCustomLabNameKeyDown}
              onBlur={() => setTimeout(() => setShowCustomSuggestions(false), 150)}
              placeholder={language === 'fr' ? 'Ex: Amylase ou rechercher...' : 'e.g. Amylase or search...'}
            />
            {/* Auto-complete suggestions dropdown */}
            {showCustomSuggestions && customSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {customSuggestions.map((test, index) => (
                  <div
                    key={test.id}
                    className={`px-3 py-2 cursor-pointer text-xs hover:bg-blue-50 dark:hover:bg-blue-900/50 ${
                      index === selectedCustomIndex ? 'bg-blue-100 dark:bg-blue-900' : ''
                    }`}
                    onClick={() => handleCustomSuggestionClick(test)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{test.name}</span>
                      <span className="text-gray-500 text-xs">{test.unit}</span>
                    </div>
                    <div className="text-gray-400 text-xs mt-1">{test.category} • {test.referenceRange}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{language === 'fr' ? 'Valeur' : 'Value'}</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-xs"
              value={customLabValue}
              onChange={e => setCustomLabValue(e.target.value)}
              placeholder={language === 'fr' ? 'Entrer la valeur' : 'Enter value'}
              onKeyDown={e => { if (e.key === 'Enter') addCustomLabValue(); }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{language === 'fr' ? 'Unité (optionnel)' : 'Unit (optional)'}</label>
            <input
              type="text"
              className="w-full border rounded px-2 py-1 text-xs"
              value={customLabUnit}
              onChange={e => setCustomLabUnit(e.target.value)}
              placeholder={language === 'fr' ? 'Ex: U/L' : 'e.g. U/L'}
            />
          </div>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold mt-4 sm:mt-0"
            onClick={addCustomLabValue}
            disabled={!customLabName.trim() || !customLabValue.trim()}
          >
            {language === 'fr' ? 'Ajouter' : 'Add'}
          </button>
        </div>
        {/* List of pending custom labs */}
        <div className="mt-3 space-y-2">
          {Object.entries(pendingLabEntries).filter(([k]) => k.startsWith('custom:')).map(([key, values]) => {
            const name = key.replace('custom:', '');
            return (
              <div key={key} className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2">
                <span className="font-semibold text-xs text-blue-700 dark:text-blue-300">{name}</span>
                <div className="flex gap-1 flex-wrap">
                  {values.map((val, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 rounded px-2 py-0.5 text-xs font-mono">
                      {val}
                      <button className="ml-1 text-red-500 hover:text-red-700" onClick={() => removeCustomLabValue(key, idx)} title="Remove value">×</button>
                    </span>
                  ))}
                </div>
                <button className="ml-auto text-xs text-red-600 hover:text-red-800" onClick={() => removeCustomLab(key)} title="Remove lab">{language === 'fr' ? 'Supprimer' : 'Remove'}</button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Header with search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 px-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Stethoscope className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {language === 'fr' ? 'Saisie Rapide des Labs' : 'Quick Lab Entry'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'fr' ? 'Entrez les valeurs par panneau ou recherchez des tests spécifiques' : 'Enter values by panel or search for specific tests'}
            </p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            ref={searchInputRef}
            placeholder={language === 'fr' ? 'Rechercher des tests...' : 'Search lab tests...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-80 h-11"
          />
        </div>
      </div>

      {/* Lab Groups with Wheel Picker */}
      <div className="flex">
        <div className="flex flex-col mr-6 w-48">
          {LAB_GROUPS.map(group => {
            const pendingCount = getPendingEntriesForPanel(group.panelId);
            return (
              <button
                key={group.panelId}
                onClick={() => !isConfirming && setSelectedPanel(group.panelId)}
                disabled={isConfirming}
                className={`text-left px-4 py-2 mb-2 rounded-lg border transition-colors font-semibold relative ${
                  selectedPanel === group.panelId
                    ? 'bg-blue-100 border-blue-400 text-blue-900'
                    : isConfirming
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="flex-1">{group.name}</span>
                  {pendingCount > 0 && (
                    <Badge 
                      variant="outline" 
                      className="ml-2 px-2 py-0.5 text-xs border-amber-300 text-amber-700 bg-amber-50"
                    >
                      {pendingCount}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex-1 space-y-6">
          {filteredGroups.map(group => {
            const completedTests = group.tests.filter(test => labEntries[test.id]?.length > 0).length;
            const isCollapsed = collapsedGroups.has(group.name);
            
            return (
              <Card key={group.name} className={`${group.color} border-2 transition-all duration-200 hover:shadow-lg w-full`}>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center justify-between">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer flex-1 group" 
                      onClick={() => toggleGroup(group.name)}
                    >
                      <div className="flex items-center justify-center w-10 h-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                        {group.icon}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {group.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant={completedTests > 0 ? "default" : "secondary"} className="text-xs">
                            {completedTests}/{group.tests.length} {language === 'fr' ? 'complétés' : 'completed'}
                          </Badge>
                          {completedTests === group.tests.length && group.tests.length > 0 && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                              ✓ {language === 'fr' ? 'Complet' : 'Complete'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroup(group.name);
                        }}
                      >
                        {isCollapsed ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {!isCollapsed && (
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {group.tests.map(test => (
                        <div key={test.id} className="space-y-4 p-4 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700/50 transition-shadow hover:shadow-md relative">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">{test.name}</span>
                            </div>
                            {labEntries[test.id]?.length > 0 && (
                              <Badge variant="secondary" className="text-xs font-bold">
                                {labEntries[test.id].length}
                              </Badge>
                            )}
                          </div>
                          
                          {/* New value input */}
                          <div className="relative">
                            <QuickValueInput
                              testId={test.id}
                              test={test}
                              onAdd={addLabEntry}
                              onRemove={removePendingEntry}
                              onClearAll={clearAllPendingForTest}
                              isFocused={focusedInput === test.id}
                              onFocus={() => setFocusedInput(test.id)}
                              onBlur={() => setFocusedInput(null)}
                              bulkValue={bulkValues[test.id] || ''}
                              onBulkValueChange={(value) => setBulkValues(prev => ({ ...prev, [test.id]: value }))}
                              enteredValues={pendingLabEntries[test.id] || []}
                            />
                          </div>

                          {/* Current values display */}
                          {labEntries[test.id]?.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Entered Values</h4>
                              {labEntries[test.id]?.map((entry, index) => {
                                const abnormalStatus = isValueAbnormal(entry.value, test);
                                return (
                                  <div key={index} className="flex items-center justify-between space-x-2 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-md">
                                    <span className={`font-mono font-bold text-lg ${getValueColor(abnormalStatus)}`}>
                                      {entry.value}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeLabEntry(test.id, index)}
                                      className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                                    >
                                      <Minus className="h-4 w-4" />
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      </div>

    </div>
  );
}

// Quick input component for individual lab values
interface QuickValueInputProps {
  testId: string;
  test: LabTest;
  onAdd: (testId: string, value: string) => void;
  onRemove?: (testId: string, index: number) => void;
  onClearAll?: (testId: string) => void;
  isFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  bulkValue: string;
  onBulkValueChange: (value: string) => void;
  enteredValues: string[];
}

function QuickValueInput({ testId, test, onAdd, onRemove, onClearAll, isFocused, onFocus, onBlur, bulkValue, onBulkValueChange, enteredValues }: QuickValueInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmedValue = effectiveValue.trim();
    if (!trimmedValue) return;
    onAdd(testId, trimmedValue);
    setValue('');
    onBulkValueChange('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const effectiveValue = value || bulkValue;
  const isAbnormal = effectiveValue ? test.normalRange && (
    parseFloat(effectiveValue) < test.normalRange[0] || parseFloat(effectiveValue) > test.normalRange[1]
  ) : false;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onBulkValueChange(newValue);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Enter value..."
          value={effectiveValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full h-10 text-center font-mono font-bold text-sm transition-all duration-200 ease-in-out ${
            isAbnormal 
              ? 'bg-amber-50 dark:bg-amber-950 border-2 border-amber-400 dark:border-amber-500 text-amber-900 dark:text-amber-300 shadow-lg shadow-amber-500/10' 
              : 'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10'
          }`}
        />
      </div>
      {/* Show entered values for this test in a small row */}
      {enteredValues && enteredValues.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Pending values:</span>
            {enteredValues.length > 1 && onClearAll && (
              <button
                onClick={() => onClearAll(testId)}
                className="text-xs text-red-600 hover:text-red-800 hover:underline"
                title="Clear all pending values"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {enteredValues.map((val, idx) => (
              <div key={idx} className="group relative">
                <span className="px-2 py-0.5 rounded bg-amber-100 text-xs font-mono text-amber-800 border border-amber-200">
                  {val}
                </span>
                {onRemove && (
                  <button
                    onClick={() => onRemove(testId, idx)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Remove this pending value"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}