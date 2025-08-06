import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp,
  RotateCcw,
  Settings2,
  Plus,
  X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LabSettings, 
  updateLabTrendingPreference,
  getLabTrendingPreference,
  LabTrendingPreference
} from '@/lib/labSettings';

interface LabTrendingSettingsProps {
  settings: LabSettings;
  onSettingsChange: (settings: LabSettings) => void;
}

export function LabTrendingSettings({ 
  settings, 
  onSettingsChange 
}: LabTrendingSettingsProps) {
  const { language } = useLanguage();
  const [showCustomTests, setShowCustomTests] = useState(false);
  const [newTestName, setNewTestName] = useState('');

  // Update global trending settings
  const handleGlobalTrendingChange = useCallback((updates: Partial<typeof settings.globalTrending>) => {
    if (!settings || !settings.globalTrending) {
      console.error('Invalid settings object');
      return;
    }
    
    try {
      // Validate boundary conditions
      const validatedUpdates = { ...updates };
      
      if (typeof validatedUpdates.defaultTrendCount === 'number') {
        validatedUpdates.defaultTrendCount = Math.max(0, Math.min(10, Math.floor(validatedUpdates.defaultTrendCount)));
      }
      
      onSettingsChange({
        ...settings,
        globalTrending: {
          ...settings.globalTrending,
          ...validatedUpdates
        }
      });
    } catch (error) {
      console.error('Error updating global trending settings:', error);
    }
  }, [settings, onSettingsChange]);

  // Update specific lab trending preference
  const handleLabTrendingChange = useCallback((testName: string, updates: Partial<LabTrendingPreference>) => {
    if (!testName || typeof testName !== 'string' || !settings) {
      return;
    }
    
    try {
      // Validate boundary conditions
      const validatedUpdates = { ...updates };
      
      if (typeof validatedUpdates.defaultTrendCount === 'number') {
        validatedUpdates.defaultTrendCount = Math.max(0, Math.min(10, Math.floor(validatedUpdates.defaultTrendCount)));
      }
      
      const updatedSettings = updateLabTrendingPreference(settings, testName.trim(), validatedUpdates);
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error updating lab trending preference:', error);
    }
  }, [settings, onSettingsChange]);

  // Remove custom trending preference (revert to global default)
  const handleRemoveCustomPreference = useCallback((testName: string) => {
    if (!testName || typeof testName !== 'string' || !settings || !Array.isArray(settings.trendingPreferences)) {
      return;
    }
    
    try {
      const updatedSettings = {
        ...settings,
        trendingPreferences: settings.trendingPreferences.filter(p => 
          p && p.testName && p.testName.toLowerCase() !== testName.toLowerCase()
        )
      };
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error removing custom preference:', error);
    }
  }, [settings, onSettingsChange]);

  // Add new custom test preference
  const handleAddCustomTest = useCallback(() => {
    const trimmedName = newTestName?.trim();
    if (!trimmedName || trimmedName.length === 0 || !settings) {
      return;
    }
    
    // Check for duplicates
    const existingTest = settings.trendingPreferences?.find(p => 
      p && p.testName && p.testName.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (existingTest) {
      console.log('Test already has custom settings');
      setNewTestName('');
      return;
    }
    
    try {
      const updatedSettings = updateLabTrendingPreference(settings, trimmedName, {
        defaultTrendCount: Math.max(0, Math.min(10, settings.globalTrending?.defaultTrendCount || 2)),
        enableTrending: settings.globalTrending?.enableByDefault ?? true
      });
      
      onSettingsChange(updatedSettings);
      setNewTestName('');
    } catch (error) {
      console.error('Error adding custom test:', error);
    }
  }, [newTestName, settings, onSettingsChange]);

  // Reset all trending preferences
  const handleResetAll = useCallback(() => {
    onSettingsChange({
      ...settings,
      trendingPreferences: [],
      globalTrending: {
        defaultTrendCount: 2,
        enableByDefault: true
      }
    });
  }, [settings, onSettingsChange]);

  // Common lab tests for suggestions
  const commonLabTests = [
    'Hb', 'Hct', 'WBC', 'Plt', 'Glucose', 'Creatinine', 'Na', 'K', 
    'ALT', 'AST', 'CRP', 'TSH', 'INR', 'PT', 'PTT'
  ];

  const testsWithCustomSettings = useMemo(() => {
    if (!settings?.trendingPreferences || !Array.isArray(settings.trendingPreferences)) {
      return [];
    }
    return settings.trendingPreferences.filter(p => p && p.testName && typeof p.testName === 'string');
  }, [settings]);

  // Validate settings object
  if (!settings || !settings.globalTrending) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            {language === 'fr' ? 'Paramètres de tendance non disponibles' : 'Trending settings not available'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Settings */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Settings2 className="h-4 w-4" />
            <span>{language === 'fr' ? 'Paramètres Globaux' : 'Global Settings'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default trend count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {language === 'fr' ? 'Nombre de tendances par défaut' : 'Default Trend Count'}
              </Label>
              <Badge variant="secondary" className="text-xs">
                {settings.globalTrending?.defaultTrendCount ?? 2}
              </Badge>
            </div>
            <Slider
              value={[Math.max(0, Math.min(10, settings.globalTrending?.defaultTrendCount ?? 2))]}
              onValueChange={([value]) => handleGlobalTrendingChange({ defaultTrendCount: value })}
              max={10}
              min={0}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {language === 'fr' 
                ? 'Nombre de valeurs historiques affichées par défaut pour les nouveaux tests'
                : 'Number of historical values shown by default for new tests'
              }
            </p>
          </div>

          <Separator />

          {/* Enable by default */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                {language === 'fr' ? 'Activer les tendances par défaut' : 'Enable Trending by Default'}
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {language === 'fr' 
                  ? 'Activer automatiquement les tendances pour les tests avec plusieurs valeurs'
                  : 'Automatically enable trending for tests with multiple values'
                }
              </p>
            </div>
            <Switch
              checked={settings.globalTrending?.enableByDefault ?? true}
              onCheckedChange={(checked) => handleGlobalTrendingChange({ enableByDefault: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Custom Test Settings */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>{language === 'fr' ? 'Paramètres Personnalisés' : 'Custom Test Settings'}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {testsWithCustomSettings.length} {language === 'fr' ? 'personnalisés' : 'custom'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomTests(!showCustomTests)}
                className="text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {language === 'fr' ? 'Ajouter' : 'Add'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add new test */}
          {showCustomTests && (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Select value={newTestName} onValueChange={setNewTestName}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={language === 'fr' ? 'Choisir un test...' : 'Choose a test...'} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  {commonLabTests
                    .filter(test => !testsWithCustomSettings.some(p => 
                      p.testName.toLowerCase() === test.toLowerCase()
                    ))
                    .map((test) => (
                      <SelectItem key={test} value={test}>
                        {test}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleAddCustomTest}
                disabled={!newTestName}
                className="text-xs"
              >
                {language === 'fr' ? 'Ajouter' : 'Add'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCustomTests(false);
                  setNewTestName('');
                }}
                className="text-xs"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}

          {/* Custom test preferences */}
          {testsWithCustomSettings.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                {language === 'fr' 
                  ? 'Aucun paramètre personnalisé. Les paramètres globaux seront utilisés.'
                  : 'No custom settings. Global settings will be used for all tests.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {testsWithCustomSettings.map((pref) => (
                <div key={pref.testName} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {pref.testName}
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomPreference(pref.testName)}
                      className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Enable trending for this test */}
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">
                      {language === 'fr' ? 'Activer les tendances' : 'Enable Trending'}
                    </Label>
                    <Switch
                      checked={pref.enableTrending ?? true}
                      onCheckedChange={(checked) => 
                        handleLabTrendingChange(pref.testName, { enableTrending: checked })
                      }
                    />
                  </div>

                  {/* Trend count for this test */}
                  {(pref.enableTrending ?? true) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">
                          {language === 'fr' ? 'Nombre de tendances' : 'Trend Count'}
                        </Label>
                        <Badge variant="secondary" className="text-xs">
                          {Math.max(0, Math.min(10, pref.defaultTrendCount ?? 2))}
                        </Badge>
                      </div>
                      <Slider
                        value={[Math.max(0, Math.min(10, pref.defaultTrendCount ?? 2))]}
                        onValueChange={([value]) => 
                          handleLabTrendingChange(pref.testName, { defaultTrendCount: value })
                        }
                        max={10}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetAll}
          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {language === 'fr' ? 'Tout réinitialiser' : 'Reset All'}
        </Button>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {language === 'fr' 
            ? 'Les paramètres personnalisés remplacent les paramètres globaux'
            : 'Custom settings override global settings'
          }
        </p>
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        {language === 'fr' 
          ? '💡 Configurez le nombre de valeurs historiques affichées pour chaque test. Les paramètres personnalisés remplacent les paramètres globaux.'
          : '💡 Configure how many historical values are shown for each test. Custom settings override global defaults.'
        }
      </div>
    </div>
  );
}