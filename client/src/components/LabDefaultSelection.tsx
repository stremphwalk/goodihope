import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckSquare,
  RotateCcw,
  Eye,
  EyeOff,
  Plus
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LabSettings, 
  updatePanelDefaultSelections,
  getPanelDefaultSelections
} from '@/lib/labSettings';

interface LabDefaultSelectionProps {
  settings: LabSettings;
  onSettingsChange: (settings: LabSettings) => void;
}

export function LabDefaultSelection({ 
  settings, 
  onSettingsChange 
}: LabDefaultSelectionProps) {
  const { language } = useLanguage();
  
  // Validate settings and get valid panel order
  const validPanelOrder = useMemo(() => {
    return settings?.panelOrder && Array.isArray(settings.panelOrder) 
      ? settings.panelOrder.filter(panel => panel && typeof panel === 'string')
      : ['CBC'];
  }, [settings]);
  
  const [selectedPanel, setSelectedPanel] = useState<string>(() => {
    return validPanelOrder[0] || 'CBC';
  });

  // Update selectedPanel if it's no longer valid
  useEffect(() => {
    if (!validPanelOrder.includes(selectedPanel)) {
      setSelectedPanel(validPanelOrder[0] || 'CBC');
    }
  }, [validPanelOrder, selectedPanel]);

  // Get current default selections for selected panel
  const currentDefaults = useMemo(() => {
    if (!selectedPanel || !settings) return [];
    try {
      return getPanelDefaultSelections(settings, selectedPanel);
    } catch (error) {
      console.error('Error getting panel default selections:', error);
      return [];
    }
  }, [settings, selectedPanel]);

  // Common lab tests by panel for selection
  const commonLabsByPanel: Record<string, { name: string; description?: string }[]> = {
    'CBC': [
      { name: 'Hb', description: 'Hemoglobin' },
      { name: 'Hct', description: 'Hematocrit' },
      { name: 'WBC', description: 'White Blood Cells' },
      { name: 'RBC', description: 'Red Blood Cells' },
      { name: 'Plt', description: 'Platelets' },
      { name: 'MCV', description: 'Mean Corpuscular Volume' },
      { name: 'MCH', description: 'Mean Corpuscular Hemoglobin' },
      { name: 'MCHC', description: 'Mean Corpuscular Hemoglobin Concentration' },
      { name: 'RDW', description: 'Red Cell Distribution Width' },
      { name: 'Neutrophils', description: 'Neutrophil percentage' },
      { name: 'Lymphocytes', description: 'Lymphocyte percentage' },
      { name: 'Monocytes', description: 'Monocyte percentage' }
    ],
    'Chemistry': [
      { name: 'Na', description: 'Sodium' },
      { name: 'K', description: 'Potassium' },
      { name: 'Cl', description: 'Chloride' },
      { name: 'CO2', description: 'Carbon Dioxide' },
      { name: 'BUN', description: 'Blood Urea Nitrogen' },
      { name: 'Creatinine', description: 'Serum Creatinine' },
      { name: 'Glucose', description: 'Blood Glucose' },
      { name: 'eGFR', description: 'Estimated GFR' },
      { name: 'Albumin', description: 'Serum Albumin' },
      { name: 'Total Protein', description: 'Total Protein' },
      { name: 'ALT', description: 'Alanine Aminotransferase' },
      { name: 'AST', description: 'Aspartate Aminotransferase' },
      { name: 'ALP', description: 'Alkaline Phosphatase' },
      { name: 'Bilirubin', description: 'Total Bilirubin' }
    ],
    'Coagulation': [
      { name: 'PT', description: 'Prothrombin Time' },
      { name: 'PTT', description: 'Partial Thromboplastin Time' },
      { name: 'INR', description: 'International Normalized Ratio' },
      { name: 'Fibrinogen', description: 'Fibrinogen Level' },
      { name: 'D-Dimer', description: 'D-Dimer' }
    ],
    'CRP': [
      { name: 'CRP', description: 'C-Reactive Protein' },
      { name: 'ESR', description: 'Erythrocyte Sedimentation Rate' },
      { name: 'Procalcitonin', description: 'Procalcitonin' }
    ],
    'Lipids': [
      { name: 'Total Cholesterol', description: 'Total Cholesterol' },
      { name: 'HDL', description: 'High-Density Lipoprotein' },
      { name: 'LDL', description: 'Low-Density Lipoprotein' },
      { name: 'Triglycerides', description: 'Triglycerides' },
      { name: 'Non-HDL', description: 'Non-HDL Cholesterol' }
    ],
    'Endocrinology': [
      { name: 'TSH', description: 'Thyroid Stimulating Hormone' },
      { name: 'Free T4', description: 'Free Thyroxine' },
      { name: 'Free T3', description: 'Free Triiodothyronine' },
      { name: 'HbA1c', description: 'Hemoglobin A1c' }
    ],
    'General': []
  };

  const availableTests = useMemo(() => {
    return commonLabsByPanel[selectedPanel] || [];
  }, [selectedPanel]);

  const handleToggleTest = useCallback((testName: string, checked: boolean) => {
    if (!testName || typeof testName !== 'string' || !settings || !selectedPanel) {
      return;
    }
    
    try {
      let newDefaults: string[];
      
      if (checked) {
        // Avoid duplicates
        if (currentDefaults.includes(testName)) {
          return;
        }
        newDefaults = [...currentDefaults, testName];
      } else {
        newDefaults = currentDefaults.filter(name => name !== testName);
      }
      
      const updatedSettings = updatePanelDefaultSelections(settings, selectedPanel, newDefaults);
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error toggling test selection:', error);
    }
  }, [currentDefaults, settings, selectedPanel, onSettingsChange]);

  const handleSelectAll = useCallback(() => {
    if (!settings || !selectedPanel || !Array.isArray(availableTests)) {
      return;
    }
    
    try {
      const allTestNames = availableTests
        .filter(test => test && test.name && typeof test.name === 'string')
        .map(test => test.name);
      
      if (allTestNames.length === 0) {
        return;
      }
      
      const updatedSettings = updatePanelDefaultSelections(settings, selectedPanel, allTestNames);
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error selecting all tests:', error);
    }
  }, [availableTests, settings, selectedPanel, onSettingsChange]);

  const handleSelectNone = useCallback(() => {
    if (!settings || !selectedPanel) {
      return;
    }
    
    try {
      const updatedSettings = updatePanelDefaultSelections(settings, selectedPanel, []);
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error clearing test selections:', error);
    }
  }, [settings, selectedPanel, onSettingsChange]);

  const handleSelectCommon = useCallback(() => {
    if (!settings || !selectedPanel) {
      return;
    }
    
    try {
      // Select commonly used tests based on panel type
      const commonSelections: Record<string, string[]> = {
        'CBC': ['Hb', 'Hct', 'WBC', 'Plt'],
        'Chemistry': ['Na', 'K', 'Creatinine', 'Glucose'],
        'Coagulation': ['PT', 'INR'],
        'CRP': ['CRP'],
        'Lipids': ['Total Cholesterol', 'HDL', 'LDL'],
        'Endocrinology': ['TSH', 'HbA1c']
      };
      
      const commonTests = commonSelections[selectedPanel] || [];
      
      // Filter to only include tests that are actually available for this panel
      const availableTestNames = availableTests.map(test => test.name);
      const validCommonTests = commonTests.filter(test => 
        test && typeof test === 'string' && availableTestNames.includes(test)
      );
      
      const updatedSettings = updatePanelDefaultSelections(settings, selectedPanel, validCommonTests);
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error selecting common tests:', error);
    }
  }, [settings, selectedPanel, onSettingsChange, availableTests]);

  const isTestSelected = useCallback((testName: string) => {
    if (!testName || typeof testName !== 'string' || !Array.isArray(currentDefaults)) {
      return false;
    }
    return currentDefaults.includes(testName);
  }, [currentDefaults]);

  const getSelectionStats = useMemo(() => {
    const selected = Array.isArray(currentDefaults) ? currentDefaults.length : 0;
    const total = Array.isArray(availableTests) ? availableTests.length : 0;
    return { 
      selected, 
      total, 
      percentage: total > 0 ? Math.round((selected / total) * 100) : 0 
    };
  }, [currentDefaults, availableTests]);

  return (
    <div className="space-y-4">
      {/* Panel selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {language === 'fr' ? 'Panneau à configurer' : 'Panel to Configure'}
        </label>
        <Select value={selectedPanel} onValueChange={setSelectedPanel}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {validPanelOrder.map((panel) => (
              <SelectItem key={panel} value={panel}>
                {panel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Selection stats and actions */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {language === 'fr' ? 'Sélections par défaut' : 'Default Selections'}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {getSelectionStats.selected}/{getSelectionStats.total} ({getSelectionStats.percentage}%)
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectCommon}
              className="text-xs"
            >
              <CheckSquare className="h-3 w-3 mr-1" />
              {language === 'fr' ? 'Communs' : 'Common'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="text-xs"
            >
              <Eye className="h-3 w-3 mr-1" />
              {language === 'fr' ? 'Tout' : 'All'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              className="text-xs"
            >
              <EyeOff className="h-3 w-3 mr-1" />
              {language === 'fr' ? 'Aucun' : 'None'}
            </Button>
          </div>

          {/* Test selection list */}
          {availableTests.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                {language === 'fr' 
                  ? 'Aucun test disponible pour ce panneau.'
                  : 'No tests available for this panel.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableTests.map((test) => (
                <div
                  key={test.name}
                  className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Checkbox
                    id={`test-${test.name}`}
                    checked={isTestSelected(test.name)}
                    onCheckedChange={(checked) => {
                      if (typeof checked === 'boolean') {
                        handleToggleTest(test.name, checked);
                      }
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <label 
                      htmlFor={`test-${test.name}`}
                      className="text-sm font-medium text-gray-900 dark:text-gray-100 cursor-pointer"
                    >
                      {test.name}
                    </label>
                    {test.description && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {test.description}
                      </p>
                    )}
                  </div>
                  {isTestSelected(test.name) && (
                    <div className="flex items-center justify-center w-5 h-5 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-full">
                      <CheckSquare className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {currentDefaults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'fr' ? 'Tests sélectionnés' : 'Selected Tests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {currentDefaults.map((testName) => (
                <Badge 
                  key={testName} 
                  variant="secondary" 
                  className="text-xs flex items-center space-x-1"
                >
                  <span>{testName}</span>
                  <button
                    onClick={() => {
                      if (testName && typeof testName === 'string') {
                        handleToggleTest(testName, false);
                      }
                    }}
                    className="ml-1 hover:text-red-600 dark:hover:text-red-400"
                    aria-label={`Remove ${testName}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        {language === 'fr' 
          ? '💡 Les tests sélectionnés seront visibles par défaut dans le panneau. Les autres tests peuvent toujours être ajoutés manuellement.'
          : '💡 Selected tests will be visible by default in the panel. Other tests can still be added manually.'
        }
      </div>
    </div>
  );
}