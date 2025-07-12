// Complete code for client/src/components/LabValuesDisplay.tsx with a new log

import React, { useMemo, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X, ArrowUp, ArrowDown, Hash, CheckCircle, RotateCcw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollPreservation } from '@/hooks/useScrollPreservation';
import { ProcessedLabValue, updateLabTrending, toggleLabShowInNote, moveLabUp, moveLabDown, parseLabTimestamp } from '@/lib/labUtils';

interface LabValuesDisplayProps {
  processedLabs: ProcessedLabValue[];
  onLabsChange: (labs: ProcessedLabValue[]) => void;
}

export function LabValuesDisplay({ processedLabs, onLabsChange }: LabValuesDisplayProps) {
  const { language } = useLanguage();
  const { preserveScrollPosition, restoreScrollPosition, setContainer } = useScrollPreservation();
  const [reorderMode, setReorderMode] = useState(false);
  const [orderingQueue, setOrderingQueue] = useState<string[]>([]);

  // Always use window scroll
  useEffect(() => {
    setContainer(null);
  }, [setContainer]);

  // Restore scroll after DOM update
  useEffect(() => {
    setTimeout(() => {
      restoreScrollPosition();
    }, 0);
  }, [processedLabs, restoreScrollPosition]);

  // Debug logging
  console.log('🧪 LabValuesDisplay received processedLabs:', processedLabs);
  console.log('🧪 LabValuesDisplay processedLabs length:', processedLabs?.length || 0);

  const handleTrendingChange = (testName: string, change: 'increase' | 'decrease') => {
    preserveScrollPosition();
    const updatedLabs = updateLabTrending(processedLabs, testName, change);
    onLabsChange(updatedLabs);
  };

  const handleToggleShowInNote = (testName: string) => {
    preserveScrollPosition();
    const updatedLabs = toggleLabShowInNote(processedLabs, testName);
    onLabsChange(updatedLabs);
  };

  const handleMoveUp = (testName: string) => {
    preserveScrollPosition();
    const updatedLabs = moveLabUp(processedLabs, testName);
    onLabsChange(updatedLabs);
  };

  const handleMoveDown = (testName: string) => {
    preserveScrollPosition();
    const updatedLabs = moveLabDown(processedLabs, testName);
    onLabsChange(updatedLabs);
  };

  const handleRemoveLab = (testName: string) => {
    preserveScrollPosition();
    const updatedLabs = processedLabs.filter(lab => lab.testName !== testName);
    onLabsChange(updatedLabs);
  };

  const handleLabClick = (testName: string, category: string) => {
    if (!reorderMode) return;
    
    const fullLabKey = `${category}-${testName}`;
    
    if (orderingQueue.includes(fullLabKey)) {
      setOrderingQueue(prev => prev.filter(id => id !== fullLabKey));
      return;
    }
    
    setOrderingQueue(prev => [...prev, fullLabKey]);
  };

  const applyNewOrder = (category: string) => {
    const categoryLabs = labsByCategory[category];
    const categoryQueue = orderingQueue
      .filter(key => key.startsWith(category))
      .map(key => key.replace(`${category}-`, ''));

    if (categoryQueue.length === 0) return;

    const labsNotInQueue = categoryLabs.filter(lab => !categoryQueue.includes(lab.testName));
    const reorderedCategoryLabs = [
      ...categoryQueue.map(testName => categoryLabs.find(lab => lab.testName === testName)!),
      ...labsNotInQueue
    ];

    // Find the position of the first lab in this category in the original array
    const firstCategoryIndex = processedLabs.findIndex(lab => lab.category === category);
    
    // Replace the category labs in the original array while preserving other categories
    const updatedLabs = [...processedLabs];
    const categoryIndices = processedLabs
      .map((lab, index) => lab.category === category ? index : -1)
      .filter(index => index !== -1);
    
    // Remove old category labs
    categoryIndices.reverse().forEach(index => updatedLabs.splice(index, 1));
    
    // Insert reordered category labs at the original position
    updatedLabs.splice(firstCategoryIndex, 0, ...reorderedCategoryLabs);

    onLabsChange(updatedLabs);
    setOrderingQueue(prev => prev.filter(key => !key.startsWith(category)));
    setReorderMode(false);
  };

  const cancelReorder = () => {
    setReorderMode(false);
    setOrderingQueue([]);
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
    <div className="space-y-6">
      {orderedCategories.map(category => (
        <div key={category} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{category}</h3>
              {labsByCategory[category].length > 1 && (
                <div className="flex gap-2">
                  {!reorderMode ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReorderMode(true)}
                      className="h-6 px-2 text-xs bg-blue-100 text-blue-700"
                    >
                      <Hash className="h-3 w-3 mr-1" />
                      {language === 'fr' ? 'Réorganiser' : 'Reorder'}
                    </Button>
                  ) : (
                    <>
                      <span className="text-xs text-blue-600 font-medium">
                        {language === 'fr' ? 'Cliquez pour réorganiser' : 'Click to reorder'}
                      </span>
                      {orderingQueue.some(key => key.startsWith(category)) && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => applyNewOrder(category)}
                          className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {language === 'fr' ? 'Appliquer' : 'Apply'}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelReorder}
                        className="h-6 px-2 text-xs"
                      >
                        {language === 'fr' ? 'Annuler' : 'Cancel'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="p-4 space-y-3">
            {labsByCategory[category].map((lab, index) => {
              const isFirstInCategory = index === 0;
              const isLastInCategory = index === labsByCategory[category].length - 1;
              const canMoveUp = !isFirstInCategory;
              const canMoveDown = !isLastInCategory;
              
              // The most recent value is lab.mostRecent.
              // The trending values are older values, which should be displayed chronologically.
              const firstValue = lab.mostRecent;
              const subsequentValues = [...lab.trending].reverse();

              const fullLabKey = `${category}-${lab.testName}`;
              const queueIndex = orderingQueue.indexOf(fullLabKey);
              const queuePosition = queueIndex >= 0 ? queueIndex + 1 : undefined;
              const isSelected = queueIndex >= 0;

              return (
              <div 
                key={`${category}-${lab.testName}-${index}`} 
                className={`group flex items-center justify-between p-2 rounded-md border min-h-0 transition-all duration-200 ${
                  reorderMode 
                    ? `cursor-pointer ${
                        isSelected 
                          ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 ring-2 ring-blue-300' 
                          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-300'
                      }`
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
                }`}
                onClick={() => handleLabClick(lab.testName, category)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {reorderMode && queuePosition ? (
                        <div className="flex items-center gap-1">
                          <div className="w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {queuePosition}
                          </div>
                          <span className="text-xs text-gray-400">→</span>
                          <span className="text-xs text-gray-500">{index + 1}</span>
                        </div>
                      ) : (
                        <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs rounded-full flex items-center justify-center">
                          {index + 1}
                        </div>
                      )}
                      <span className={`inline-block w-2 h-2 rounded-full ${lab.showInNote ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-medium truncate ${!lab.showInNote ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100'}`}>{lab.testName}</p>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-base font-mono font-semibold text-gray-900 dark:text-gray-100">
                          {firstValue?.value}
                          {firstValue?.unit && <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{firstValue.unit}</span>}
                        </span>
                        {lab.showTrending && lab.trendCount > 0 && subsequentValues.length > 0 && (
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                            ({subsequentValues.slice(0, lab.trendCount).map(trend => trend?.value || 'N/A').join(', ')})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 transition-opacity ${
                  reorderMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}>
                  {!reorderMode && (
                    <div className="flex flex-col space-y-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(lab.testName); }}
                        disabled={!canMoveUp}
                        className={`h-6 w-6 p-0 rounded ${
                          canMoveUp ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-600' : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={language === 'fr' ? 'Déplacer vers le haut' : 'Move up'}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(lab.testName); }}
                        disabled={!canMoveDown}
                        className={`h-6 w-6 p-0 rounded ${
                          canMoveDown ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-600' : 'text-gray-300 cursor-not-allowed'
                        }`}
                        title={language === 'fr' ? 'Déplacer vers le bas' : 'Move down'}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>

                  <Button
                    variant="ghost" size="sm"
                    onClick={(e) => { e.stopPropagation(); handleRemoveLab(lab.testName); }}
                    className={`h-8 w-8 p-0 rounded ${
                      !lab.showInNote 
                        ? 'text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-600'
                    }`}
                    title={language === 'fr' ? 'Supprimer la valeur de laboratoire' : 'Remove lab value'}
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {lab.trending && lab.trending.length > 0 && (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {language === 'fr' ? 'Tendance' : 'Trending'}
                      </div>
                      <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleTrendingChange(lab.testName, 'decrease'); }} 
                          disabled={lab.trendCount === 0} 
                          className="h-9 w-9 p-0 rounded-none hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-30"
                          title={language === 'fr' ? 'Afficher moins de valeurs' : 'Show fewer values'}
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>

                        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-x border-gray-200 dark:border-gray-600">
                          <span className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400">
                            {lab.trendCount}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                            /{lab.trending.length}
                          </span>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleTrendingChange(lab.testName, 'increase'); }} 
                          disabled={lab.trendCount === lab.trending.length} 
                          className="h-9 w-9 p-0 rounded-none hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-30"
                          title={language === 'fr' ? 'Afficher plus de valeurs' : 'Show more values'}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                      {lab.trendCount > 0 && (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {language === 'fr' ? 'Inclus dans la note' : 'Included in note'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}