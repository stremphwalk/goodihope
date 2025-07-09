import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Brain, 
  Stethoscope, 
  Zap, 
  Activity,
  FlaskConical,
  Clock,
  Plus,
  Check
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LabPreset {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tests: string[];
  commonFor: string[];
}

interface LabPresetPanelsProps {
  onPresetSelect: (testIds: string[]) => void;
  selectedTests: Set<string>;
}

const PRESET_PANELS: LabPreset[] = [
  {
    id: 'basic-metabolic',
    name: 'Basic Metabolic Panel',
    description: 'Essential chemistry panel',
    icon: <FlaskConical className="h-5 w-5" />,
    color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
    tests: ['glucose', 'sodium', 'potassium', 'chloride', 'bun', 'creatinine'],
    commonFor: ['Routine check', 'Diabetes', 'Kidney function']
  },
  {
    id: 'cardiac',
    name: 'Cardiac Panel',
    description: 'Heart health assessment',
    icon: <Heart className="h-5 w-5" />,
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    tests: ['cholesterol', 'hdl', 'ldl', 'triglycerides'],
    commonFor: ['Chest pain', 'CVD risk', 'Post-MI']
  },
  {
    id: 'liver-function',
    name: 'Liver Function Tests',
    description: 'Hepatic panel',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-amber-50 border-amber-200 hover:bg-amber-100',
    tests: ['alt', 'ast', 'bilirubin', 'albumin', 'alp'],
    commonFor: ['Hepatitis', 'Drug monitoring', 'Jaundice']
  },
  {
    id: 'complete-blood-count',
    name: 'Complete Blood Count',
    description: 'Full hematologic panel',
    icon: <Stethoscope className="h-5 w-5" />,
    color: 'bg-red-50 border-red-200 hover:bg-red-100',
    tests: ['hb', 'hct', 'wbc', 'plt', 'rbc', 'mcv'],
    commonFor: ['Anemia', 'Infection', 'Bleeding']
  },
  {
    id: 'coagulation',
    name: 'Coagulation Studies',
    description: 'Bleeding assessment',
    icon: <Clock className="h-5 w-5" />,
    color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    tests: ['pt', 'ptt', 'inr'],
    commonFor: ['Warfarin monitoring', 'Pre-op', 'Bleeding']
  },
  {
    id: 'renal-function',
    name: 'Renal Function',
    description: 'Kidney assessment',
    icon: <Activity className="h-5 w-5" />,
    color: 'bg-teal-50 border-teal-200 hover:bg-teal-100',
    tests: ['bun', 'creatinine', 'sodium', 'potassium'],
    commonFor: ['CKD', 'AKI', 'Hypertension']
  },
  {
    id: 'electrolytes',
    name: 'Electrolyte Panel',
    description: 'Fluid balance check',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    tests: ['sodium', 'potassium', 'chloride'],
    commonFor: ['Dehydration', 'Heart failure', 'Diuretics']
  },
  {
    id: 'diabetes-monitoring',
    name: 'Diabetes Panel',
    description: 'Glycemic control',
    icon: <Brain className="h-5 w-5" />,
    color: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    tests: ['glucose', 'hba1c'],
    commonFor: ['DM monitoring', 'Pre-diabetes', 'Hyperglycemia']
  }
];

export function LabPresetPanels({ onPresetSelect, selectedTests }: LabPresetPanelsProps) {
  const { language } = useLanguage();
  const [selectedPresets, setSelectedPresets] = useState<Set<string>>(new Set());

  const handlePresetClick = (preset: LabPreset) => {
    const newSelected = new Set(selectedPresets);
    
    if (newSelected.has(preset.id)) {
      newSelected.delete(preset.id);
    } else {
      newSelected.add(preset.id);
    }
    
    setSelectedPresets(newSelected);
    onPresetSelect(preset.tests);
  };

  const getPresetStatus = (preset: LabPreset) => {
    const isSelected = selectedPresets.has(preset.id);
    const testsCompleted = preset.tests.filter(test => selectedTests.has(test)).length;
    const totalTests = preset.tests.length;
    const isPartiallyCompleted = testsCompleted > 0 && testsCompleted < totalTests;
    const isFullyCompleted = testsCompleted === totalTests;

    return {
      isSelected,
      testsCompleted,
      totalTests,
      isPartiallyCompleted,
      isFullyCompleted,
      completionPercentage: Math.round((testsCompleted / totalTests) * 100)
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <FlaskConical className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">
          {language === 'fr' ? 'Panneaux Préétablis' : 'Quick Lab Panels'}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {PRESET_PANELS.map(preset => {
          const status = getPresetStatus(preset);
          
          return (
            <Card 
              key={preset.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                preset.color
              } ${
                status.isSelected ? 'ring-2 ring-blue-500' : ''
              } ${
                status.isFullyCompleted ? 'ring-2 ring-green-500' : ''
              }`}
              onClick={() => handlePresetClick(preset)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {preset.icon}
                    <span className="truncate">{preset.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    {status.isFullyCompleted && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    
                    <Badge 
                      variant={status.isFullyCompleted ? "default" : "secondary"} 
                      className="text-xs"
                    >
                      {status.testsCompleted}/{status.totalTests}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  {preset.description}
                </p>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mb-2">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      status.isFullyCompleted 
                        ? 'bg-green-500' 
                        : status.isPartiallyCompleted 
                          ? 'bg-yellow-500' 
                          : 'bg-gray-300'
                    }`}
                    style={{ width: `${status.completionPercentage}%` }}
                  />
                </div>
                
                <div className="text-xs text-gray-500 mb-2">
                  {language === 'fr' ? 'Commun pour: ' : 'Common for: '}
                  {preset.commonFor.slice(0, 2).join(', ')}
                  {preset.commonFor.length > 2 && '...'}
                </div>
                
                <Button 
                  size="sm" 
                  variant={status.isSelected ? "default" : "outline"}
                  className="w-full h-7 text-xs"
                >
                  {status.isSelected ? (
                    <>{language === 'fr' ? 'Sélectionné' : 'Selected'}</>
                  ) : status.isFullyCompleted ? (
                    <>{language === 'fr' ? 'Terminé' : 'Completed'}</>
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      {language === 'fr' ? 'Ajouter' : 'Add Panel'}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <span>
          {language === 'fr' ? 'Panneaux sélectionnés: ' : 'Selected panels: '}
          <strong>{selectedPresets.size}</strong>
        </span>
        <span>
          {language === 'fr' ? 'Tests saisis: ' : 'Tests entered: '}
          <strong>{selectedTests.size}</strong>
        </span>
      </div>
    </div>
  );
}