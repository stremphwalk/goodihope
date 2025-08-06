import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  RotateCcw,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LabSettings } from '@/lib/labSettings';
import { getAvailableCategories } from '@/lib/labCategorizer';

interface LabPanelOrderSettingsProps {
  settings: LabSettings;
  onSettingsChange: (settings: LabSettings) => void;
}

export function LabPanelOrderSettings({ 
  settings, 
  onSettingsChange 
}: LabPanelOrderSettingsProps) {
  const { language } = useLanguage();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleMoveUp = useCallback((index: number) => {
    if (!settings?.panelOrder || !Array.isArray(settings.panelOrder) || index === 0 || index >= settings.panelOrder.length) {
      return;
    }
    
    try {
      const newOrder = [...settings.panelOrder];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      
      onSettingsChange({
        ...settings,
        panelOrder: newOrder
      });
    } catch (error) {
      console.error('Error moving panel up:', error);
    }
  }, [settings, onSettingsChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (!settings?.panelOrder || !Array.isArray(settings.panelOrder) || index < 0 || index >= settings.panelOrder.length - 1) {
      return;
    }
    
    try {
      const newOrder = [...settings.panelOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      onSettingsChange({
        ...settings,
        panelOrder: newOrder
      });
    } catch (error) {
      console.error('Error moving panel down:', error);
    }
  }, [settings, onSettingsChange]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!settings?.panelOrder || index < 0 || index >= settings.panelOrder.length) {
      e.preventDefault();
      return;
    }
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, [settings]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!settings?.panelOrder || !Array.isArray(settings.panelOrder)) {
      setDraggedIndex(null);
      return;
    }
    
    if (draggedIndex === null || draggedIndex === dropIndex || dropIndex < 0 || dropIndex >= settings.panelOrder.length) {
      setDraggedIndex(null);
      return;
    }

    try {
      const newOrder = [...settings.panelOrder];
      const draggedItem = newOrder[draggedIndex];
      
      if (!draggedItem) {
        setDraggedIndex(null);
        return;
      }
      
      // Remove dragged item
      newOrder.splice(draggedIndex, 1);
      
      // Insert at new position
      const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newOrder.splice(insertIndex, 0, draggedItem);
      
      onSettingsChange({
        ...settings,
        panelOrder: newOrder
      });
    } catch (error) {
      console.error('Error during drag and drop:', error);
    } finally {
      setDraggedIndex(null);
    }
  }, [draggedIndex, settings, onSettingsChange]);

  const handleReset = useCallback(() => {
    const defaultOrder = getAvailableCategories();
    onSettingsChange({
      ...settings,
      panelOrder: defaultOrder
    });
  }, [settings, onSettingsChange]);

  const getPanelDisplayName = (panel: string) => {
    const displayNames: Record<string, { en: string; fr: string }> = {
      'CBC': { en: 'Complete Blood Count', fr: 'Hémogramme' },
      'Coagulation': { en: 'Coagulation Studies', fr: 'Coagulation' },
      'Chemistry': { en: 'Chemistry Panel', fr: 'Biochimie' },
      'CRP': { en: 'Inflammatory Markers', fr: 'Marqueurs Inflammatoires' },
      'Lipids': { en: 'Lipid Panel', fr: 'Bilan Lipidique' },
      'Endocrinology': { en: 'Endocrine Tests', fr: 'Tests Endocriniens' },
      'Immunology': { en: 'Immunology', fr: 'Immunologie' },
      'Tumor Markers': { en: 'Tumor Markers', fr: 'Marqueurs Tumoraux' },
      'General': { en: 'General Labs', fr: 'Tests Généraux' }
    };

    const names = displayNames[panel];
    if (!names) return panel;
    
    return language === 'fr' ? names.fr : names.en;
  };

  const getPanelDescription = (panel: string) => {
    const descriptions: Record<string, { en: string; fr: string }> = {
      'CBC': { en: 'Blood cell counts and differentials', fr: 'Numération et formule sanguine' },
      'Coagulation': { en: 'Blood clotting function tests', fr: 'Tests de coagulation' },
      'Chemistry': { en: 'Biochemical and metabolic tests', fr: 'Tests biochimiques et métaboliques' },
      'CRP': { en: 'Inflammation and infection markers', fr: 'Marqueurs d\'inflammation et d\'infection' },
      'Lipids': { en: 'Cholesterol and lipid metabolism', fr: 'Cholestérol et métabolisme lipidique' },
      'Endocrinology': { en: 'Hormone and thyroid function', fr: 'Fonction hormonale et thyroïdienne' },
      'Immunology': { en: 'Immune system function', fr: 'Fonction du système immunitaire' },
      'Tumor Markers': { en: 'Cancer screening markers', fr: 'Marqueurs de dépistage du cancer' },
      'General': { en: 'Miscellaneous laboratory tests', fr: 'Tests de laboratoire divers' }
    };

    const descs = descriptions[panel];
    if (!descs) return '';
    
    return language === 'fr' ? descs.fr : descs.en;
  };

  // Validate settings and provide fallback
  const validPanelOrder = settings?.panelOrder && Array.isArray(settings.panelOrder) 
    ? settings.panelOrder.filter(panel => panel && typeof panel === 'string')
    : [];

  if (validPanelOrder.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="text-sm">
            {language === 'fr' ? 'Aucun panneau configuré' : 'No panels configured'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="mt-2 text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" />
            {language === 'fr' ? 'Charger par défaut' : 'Load Default'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with reset button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {language === 'fr' 
            ? `${validPanelOrder.length} panneaux configurés`
            : `${validPanelOrder.length} panels configured`
          }
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          {language === 'fr' ? 'Par défaut' : 'Default Order'}
        </Button>
      </div>

      {/* Panel list */}
      <div className="space-y-2">
        {validPanelOrder.map((panel, index) => (
          <Card
            key={panel}
            className={`transition-all duration-200 ${
              draggedIndex === index 
                ? 'opacity-50 transform rotate-2' 
                : 'hover:shadow-md'
            }`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Position indicator */}
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
                    {index + 1}
                  </div>
                  
                  {/* Drag handle */}
                  <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  
                  {/* Panel info */}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {getPanelDisplayName(panel)}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {panel}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {getPanelDescription(panel)}
                    </p>
                  </div>
                </div>

                {/* Move buttons */}
                <div className="flex flex-col space-y-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === validPanelOrder.length - 1}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        {language === 'fr' 
          ? '💡 Glissez-déposez les panneaux pour modifier leur ordre d\'affichage, ou utilisez les flèches.'
          : '💡 Drag and drop panels to change their display order, or use the arrow buttons.'
        }
      </div>
    </div>
  );
}