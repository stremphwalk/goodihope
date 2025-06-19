// Complete code for client/src/components/LabValuesDisplay.tsx with a new log

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X } from 'lucide-react'; // Simplified imports
import { useLanguage } from '@/contexts/LanguageContext';
import { ProcessedLabValue, updateLabTrending, toggleLabShowInNote } from '@/lib/labUtils';

interface LabValuesDisplayProps {
  processedLabs: ProcessedLabValue[];
  onLabsChange: (labs: ProcessedLabValue[]) => void;
}

export function LabValuesDisplay({ processedLabs, onLabsChange }: LabValuesDisplayProps) {
  const { language } = useLanguage();



  const handleTrendingChange = (testName: string, change: 'increase' | 'decrease') => {
    const updatedLabs = updateLabTrending(processedLabs, testName, change);
    onLabsChange(updatedLabs);
  };

  const handleToggleShowInNote = (testName: string) => {
    const updatedLabs = toggleLabShowInNote(processedLabs, testName);
    onLabsChange(updatedLabs);
  };

  const labsByCategory = useMemo(() => {
    return processedLabs.reduce((acc, lab) => {
      (acc[lab.category] = acc[lab.category] || []).push(lab);
      return acc;
    }, {} as Record<string, ProcessedLabValue[]>);
  }, [processedLabs]);

  const orderedCategories = useMemo(() => {
    const categoryOrder = processedLabs.reduce((acc, lab, index) => {
      if (!acc[lab.category]) {
        acc[lab.category] = index;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(labsByCategory).sort((a, b) => categoryOrder[a] - categoryOrder[b]);
  }, [labsByCategory, processedLabs]);


  if (processedLabs.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        {language === 'fr' ? 'Aucune valeur de laboratoire disponible' : 'No lab values available'}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orderedCategories.map(category => (
        <div key={category}>
          <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-300 border-b pb-1">{category}</h3>
          <div className="space-y-2">
            {labsByCategory[category].map((lab) => (
              <div key={lab.testName} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md border">
                <div className="flex-1 flex items-center">
                  <span className={`font-medium ${!lab.showInNote ? 'line-through text-gray-400' : ''}`}>
                    {lab.testName}:
                  </span>
                  <span className="ml-2 font-mono">
                    {lab.mostRecent.value}
                    {lab.mostRecent.unit && <span className="text-gray-600 dark:text-gray-400 ml-1">{lab.mostRecent.unit}</span>}
                  </span>

                  {lab.showTrending && lab.trendCount > 0 && (
                    <span className="ml-2 font-mono text-gray-500 dark:text-gray-400">
                      (
                      {lab.trending
                        .slice(0, lab.trendCount)
                        .map(trend => trend.value)
                        .join(', ')}
                      )
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 ml-2">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleToggleShowInNote(lab.testName)}
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                    title={lab.showInNote ? 'Hide from note' : 'Show in note'}
                  >
                    <X className={`h-4 w-4 ${!lab.showInNote ? 'text-red-500' : ''}`} />
                  </Button>

                  {lab.trending.length > 0 && (
                    <div className="flex items-center border rounded-md p-0.5">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTrendingChange(lab.testName, 'decrease')} 
                        disabled={lab.trendCount === 0} 
                        className="h-6 w-6 p-0"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>

                      <span className="text-xs min-w-[1.2rem] text-center font-mono">
                        {lab.trendCount}
                      </span>

                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleTrendingChange(lab.testName, 'increase')} 
                        disabled={lab.trendCount === lab.trending.length} 
                        className="h-6 w-6 p-0"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}