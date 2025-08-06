import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { WidgetInstance } from '@/types/widgets';

interface WeaningStep {
  dose: number;
  duration: number;
  unit: 'days' | 'weeks';
}

interface PrednisoneWeanData {
  startingDose: number;
  targetDose: number;
  steps: WeaningStep[];
  useCustomSteps: boolean;
}

interface PrednisoneWeanWidgetProps extends Omit<WidgetInstance, 'data' | 'onDataChange'> {
  data: PrednisoneWeanData;
  onDataChange: (data: PrednisoneWeanData) => void;
}

export function PrednisoneWeanWidget({ data, onDataChange, mode }: PrednisoneWeanWidgetProps) {
  const { language } = useLanguage();
  const [localData, setLocalData] = useState<PrednisoneWeanData>({
    startingDose: 60,
    targetDose: 0,
    steps: [],
    useCustomSteps: false,
    ...data
  });

  // Generate automatic weaning schedule based on starting dose
  const generateAutoSteps = (startDose: number, targetDose: number): WeaningStep[] => {
    const steps: WeaningStep[] = [];
    let currentDose = startDose;

    while (currentDose > targetDose) {
      let reduction: number;
      let duration: number;
      let unit: 'days' | 'weeks' = 'weeks';

      // Determine reduction amount based on current dose
      if (currentDose >= 40) {
        // High dose: reduce by 10mg
        reduction = 10;
        duration = 1;
      } else if (currentDose >= 20) {
        // Moderate dose: reduce by 5mg
        reduction = 5;
        duration = 1;
      } else if (currentDose >= 10) {
        // Low dose: reduce by 2.5mg
        reduction = 2.5;
        duration = 2;
      } else if (currentDose > 5) {
        // Very low dose: reduce by 1mg
        reduction = 1;
        duration = 2;
      } else {
        // Physiological dose: reduce by 0.5-1mg very slowly
        reduction = currentDose > 2.5 ? 1 : 0.5;
        duration = 2;
      }

      // Don't go below target dose
      const nextDose = Math.max(targetDose, currentDose - reduction);
      
      steps.push({
        dose: nextDose,
        duration,
        unit
      });

      currentDose = nextDose;
      
      // Prevent infinite loop
      if (currentDose === targetDose) break;
    }

    return steps;
  };

  // Update steps when parameters change
  useEffect(() => {
    if (!localData.useCustomSteps && localData.startingDose > 0) {
      const autoSteps = generateAutoSteps(localData.startingDose, localData.targetDose);
      setLocalData(prev => ({ ...prev, steps: autoSteps }));
    }
  }, [localData.startingDose, localData.targetDose, localData.useCustomSteps]);

  // Sync with parent
  useEffect(() => {
    onDataChange(localData);
  }, [localData]);

  const addCustomStep = () => {
    const lastDose = localData.steps.length > 0 
      ? localData.steps[localData.steps.length - 1].dose 
      : localData.startingDose - 10;
    
    setLocalData(prev => ({
      ...prev,
      steps: [...prev.steps, { dose: Math.max(0, lastDose - 5), duration: 1, unit: 'weeks' }]
    }));
  };

  const updateStep = (index: number, field: keyof WeaningStep, value: any) => {
    setLocalData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      )
    }));
  };

  const removeStep = (index: number) => {
    setLocalData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index)
    }));
  };

  if (mode === 'display') {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded text-sm">
        <TrendingDown className="w-3 h-3 text-orange-600" />
        <span className="font-medium text-orange-900">
          {language === 'fr' ? 'Sevrage Prednisone' : 'Prednisone Taper'}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <TrendingDown className="w-5 h-5 text-orange-600" />
        <h3 className="font-semibold text-lg">
          {language === 'fr' ? 'Protocole de Sevrage de Prednisone' : 'Prednisone Weaning Protocol'}
        </h3>
      </div>

      {/* Starting Parameters */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="starting-dose">
            {language === 'fr' ? 'Dose initiale (mg)' : 'Starting Dose (mg)'}
          </Label>
          <Input
            id="starting-dose"
            type="number"
            min="0"
            step="5"
            value={localData.startingDose}
            onChange={(e) => setLocalData(prev => ({ 
              ...prev, 
              startingDose: parseFloat(e.target.value) || 0 
            }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="target-dose">
            {language === 'fr' ? 'Dose cible (mg)' : 'Target Dose (mg)'}
          </Label>
          <Input
            id="target-dose"
            type="number"
            min="0"
            step="1"
            value={localData.targetDose}
            onChange={(e) => setLocalData(prev => ({ 
              ...prev, 
              targetDose: parseFloat(e.target.value) || 0 
            }))}
            className="mt-1"
          />
        </div>
      </div>

      {/* Custom Steps Toggle */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="custom-steps"
          checked={localData.useCustomSteps}
          onChange={(e) => setLocalData(prev => ({ 
            ...prev, 
            useCustomSteps: e.target.checked 
          }))}
          className="rounded"
        />
        <Label htmlFor="custom-steps" className="cursor-pointer">
          {language === 'fr' ? 'Utiliser des étapes personnalisées' : 'Use custom steps'}
        </Label>
      </div>

      {/* Weaning Steps */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>
            {language === 'fr' ? 'Étapes de sevrage' : 'Weaning Steps'}
          </Label>
          {localData.useCustomSteps && (
            <Button
              size="sm"
              variant="outline"
              onClick={addCustomStep}
              className="text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              {language === 'fr' ? 'Ajouter' : 'Add Step'}
            </Button>
          )}
        </div>

        {localData.steps.length === 0 ? (
          <div className="text-sm text-gray-500 italic p-2 border border-dashed rounded">
            {language === 'fr' 
              ? 'Ajustez les doses pour générer le protocole' 
              : 'Adjust doses to generate protocol'}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {localData.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium w-12">
                  #{index + 1}
                </span>
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={step.dose}
                    onChange={(e) => updateStep(index, 'dose', parseFloat(e.target.value) || 0)}
                    disabled={!localData.useCustomSteps}
                    className="w-20 h-8 text-sm"
                  />
                  <span className="text-sm">mg {language === 'fr' ? 'pour' : 'for'}</span>
                  <Input
                    type="number"
                    min="1"
                    value={step.duration}
                    onChange={(e) => updateStep(index, 'duration', parseInt(e.target.value) || 1)}
                    disabled={!localData.useCustomSteps}
                    className="w-16 h-8 text-sm"
                  />
                  <Select
                    value={step.unit}
                    onValueChange={(value: 'days' | 'weeks') => updateStep(index, 'unit', value)}
                    disabled={!localData.useCustomSteps}
                  >
                    <SelectTrigger className="w-24 h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">
                        {language === 'fr' ? 'jours' : 'days'}
                      </SelectItem>
                      <SelectItem value="weeks">
                        {language === 'fr' ? 'semaines' : 'weeks'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {localData.useCustomSteps && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeStep(index)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Physiological Dose Warning */}
      {localData.steps.some(s => s.dose <= 7.5) && (
        <div className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-yellow-800">
            {language === 'fr' 
              ? "Attention: Doses ≤7.5mg sont proches du niveau physiologique. Sevrage lent recommandé pour éviter l'insuffisance surrénalienne."
              : "Warning: Doses ≤7.5mg approach physiological levels. Slow taper recommended to avoid adrenal insufficiency."}
          </div>
        </div>
      )}
    </div>
  );
}

// Generate the text output for the note
export function generatePrednisoneWeanText(data: PrednisoneWeanData, language: 'en' | 'fr'): string {
  if (!data.steps || data.steps.length === 0) {
    return language === 'fr' 
      ? `Prednisone ${data.startingDose}mg → ${data.targetDose}mg (protocole à déterminer)`
      : `Prednisone ${data.startingDose}mg → ${data.targetDose}mg (protocol TBD)`;
  }

  const lines: string[] = [];
  
  // Header
  lines.push(language === 'fr' 
    ? `Protocole de sevrage de prednisone:` 
    : `Prednisone tapering protocol:`);
  
  // Starting dose
  lines.push(language === 'fr'
    ? `• Commencer: ${data.startingDose}mg PO DIE`
    : `• Start: ${data.startingDose}mg PO daily`);
  
  // Steps
  data.steps.forEach((step, index) => {
    const durationText = step.unit === 'weeks' 
      ? (language === 'fr' ? `${step.duration} semaine${step.duration > 1 ? 's' : ''}` : `${step.duration} week${step.duration > 1 ? 's' : ''}`)
      : (language === 'fr' ? `${step.duration} jour${step.duration > 1 ? 's' : ''}` : `${step.duration} day${step.duration > 1 ? 's' : ''}`);
    
    lines.push(language === 'fr'
      ? `• Puis ${step.dose}mg PO DIE × ${durationText}`
      : `• Then ${step.dose}mg PO daily × ${durationText}`);
  });
  
  // Add warning for low doses
  const hasLowDose = data.steps.some(s => s.dose <= 7.5);
  if (hasLowDose) {
    lines.push('');
    lines.push(language === 'fr'
      ? `⚠️ Surveillance de l'insuffisance surrénalienne lors du sevrage <7.5mg`
      : `⚠️ Monitor for adrenal insufficiency when tapering <7.5mg`);
  }
  
  return lines.join('\n');
}