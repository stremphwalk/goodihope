// Complete code for client/src/components/LabValuesDisplay.tsx with a new log

import React, { useMemo, useEffect, useState, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown, Hash, CheckCircle, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ProcessedLabValue, updateLabTrending, updateLabTrendingCount, toggleLabShowInNote, moveLabUp, moveLabDown, parseLabTimestamp } from '@/lib/labUtils';
import { loadLabSettings, getPanelLabOrder, getLabTrendingPreference } from '@/lib/labSettings';

interface LabValuesDisplayProps {
  processedLabs: ProcessedLabValue[];
  // Callback fired only the FIRST time the user mutates the list (so parent can show confirm chip)
  onFirstChange?: () => void;
}

// Exposed methods for the parent (confirm / discard)
export interface LabValuesDisplayHandle {
  /** Return the current draft list */
  getPendingLabs: () => ProcessedLabValue[];
  /** Reset the draft list back to the last confirmed props */
  reset: () => void;
}

// Convert to forwardRef so parent can call the handle
export const LabValuesDisplay = React.memo(forwardRef<LabValuesDisplayHandle, LabValuesDisplayProps>(function LabValuesDisplay(
  {
    processedLabs: initialLabs,
    onFirstChange,
  },
  ref
) {
  // Local draft copy that is mutated by all UI interactions
  const [draftLabs, setDraftLabs] = useState<ProcessedLabValue[]>(initialLabs);
  // Helper that also persists to localStorage to survive unmounts
  const setDraftAndPersist = (labs: ProcessedLabValue[]) => {
    setDraftLabs(labs);
    try {
      localStorage.setItem('draft_labs', JSON.stringify(labs));
    } catch {}
  };
  const { language } = useLanguage();
  const latestConfirmedLabsRef = useRef(initialLabs);
  const firstChangeRef = useRef(false);
  const [reorderMode, setReorderMode] = useState(false);
  const [orderingQueue, setOrderingQueue] = useState<string[]>([]);
  const pendingUpdatesRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  
  // Load user settings for custom ordering and trending
  const [labSettings] = useState(() => {
    try {
      return loadLabSettings();
    } catch (error) {
      console.error('Failed to load lab settings, using defaults:', error);
      return {
        version: 1,
        panelOrder: [],
        panelLabOrders: [],
        trendingPreferences: [],
        defaultSelections: [],
        globalTrending: { defaultTrendCount: 2, enableByDefault: true },
        ui: { showPanelHeaders: true, showLabIndices: true, compactMode: false }
      };
    }
  });


  // Comprehensive cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (pendingUpdatesRef.current) {
        clearTimeout(pendingUpdatesRef.current);
        pendingUpdatesRef.current = null;
      }
      
      // Reset processing flags
      isProcessingRef.current = false;
      lastInteractionRef.current = 0;
      
      console.debug('LabValuesDisplay cleanup completed');
    };
  }, []);

  // Additional cleanup when processedLabs changes significantly
  useEffect(() => {
    // Reset processing state when data changes
    isProcessingRef.current = false;
  }, [draftLabs]);

  // Restore any saved draft when the component first mounts
  useEffect(() => {
    try {
      const saved = localStorage.getItem('draft_labs');
      if (saved) {
        const parsed: ProcessedLabValue[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setDraftLabs(parsed);
        }
      }
    } catch {}
  }, []);

  // Debug logging
  console.log('🧪 LabValuesDisplay received processedLabs:', draftLabs);
  console.log('🧪 LabValuesDisplay processedLabs length:', draftLabs?.length || 0);

  // Keep draft in sync if parent confirms new list
  useEffect(() => {
    latestConfirmedLabsRef.current = initialLabs;
    // Only sync if the user has not started editing (i.e., no pending changes yet)
    if (!firstChangeRef.current) {
      setDraftLabs(initialLabs);
    }
  }, [initialLabs]);

  // Helper to notify parent once on first mutation
  const notifyFirstChange = () => {
    if (!firstChangeRef.current) {
      firstChangeRef.current = true;
      onFirstChange?.();
      try { localStorage.setItem('draft_labs', JSON.stringify(draftLabs)); } catch {}
    }
  };

  // Replace all usages of `processedLabs` with the local draft list
  const processedLabs = draftLabs;

  // Imperative handle exposed to parent component
  useImperativeHandle(ref, () => ({
    getPendingLabs: () => processedLabs,
    reset: () => setDraftLabs(latestConfirmedLabsRef.current),
  }), [processedLabs]);

  const handleTrendingChange = useCallback((testName: string, change: 'increase' | 'decrease', event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Rate limiting for rapid clicks (max 10 per second)
    const now = Date.now();
    if (now - lastInteractionRef.current < 100) {
      console.debug('Rate limiting triggered for trending change');
      return;
    }
    lastInteractionRef.current = now;

    // Prevent concurrent processing
    if (isProcessingRef.current) {
      console.debug('Already processing interaction, skipping');
      return;
    }

    try {
      isProcessingRef.current = true;
      
      notifyFirstChange();
      // Use requestAnimationFrame to ensure DOM changes are handled properly
      requestAnimationFrame(() => {
        try {
          const currentLab = draftLabs.find(lab => lab.testName === testName);
          if (!currentLab) return;

          const maxCount = currentLab.maxTrendCount || currentLab.allTrendingValues?.length || 0;
          let newCount = currentLab.trendCount || 0;

          if (change === 'increase') {
            newCount = Math.min(newCount + 1, maxCount);
          } else {
            newCount = Math.max(newCount - 1, 0);
          }

          const updatedLabs = updateLabTrendingCount(draftLabs, testName, newCount);
          if (updatedLabs && Array.isArray(updatedLabs)) {
            setDraftAndPersist(updatedLabs);
          } else {
            console.warn('Invalid lab data returned from updateLabTrendingCount');
          }
        } catch (error) {
          console.error('Error in handleTrendingChange:', error);
        } finally {
          isProcessingRef.current = false;
        }
      });
    } catch (error) {
      console.error('Error in handleTrendingChange setup:', error);
      isProcessingRef.current = false;
    }
  }, [draftLabs, setDraftAndPersist, notifyFirstChange]);

  const handleToggleShowInNote = useCallback((testName: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    requestAnimationFrame(() => {
      const updatedLabs = toggleLabShowInNote(processedLabs, testName);
      notifyFirstChange();
      setDraftAndPersist(updatedLabs);
    });
  }, [processedLabs, setDraftAndPersist, notifyFirstChange]);

  const handleMoveUp = useCallback((testName: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    requestAnimationFrame(() => {
      const updatedLabs = moveLabUp(processedLabs, testName);
      notifyFirstChange();
      setDraftAndPersist(updatedLabs);
    });
  }, [processedLabs, setDraftAndPersist, notifyFirstChange]);

  const handleMoveDown = useCallback((testName: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    requestAnimationFrame(() => {
      const updatedLabs = moveLabDown(processedLabs, testName);
      notifyFirstChange();
      setDraftAndPersist(updatedLabs);
    });
  }, [processedLabs, setDraftAndPersist, notifyFirstChange]);

  const handleRemoveLab = useCallback((testName: string, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Rate limiting and concurrency protection
    const now = Date.now();
    if (now - lastInteractionRef.current < 100 || isProcessingRef.current) {
      console.debug('Rate limiting or processing conflict for remove lab');
      return;
    }
    lastInteractionRef.current = now;

    try {
      isProcessingRef.current = true;
      
      requestAnimationFrame(() => {
        try {
          const updatedLabs = processedLabs.filter(lab => lab.testName !== testName);
          if (updatedLabs && Array.isArray(updatedLabs)) {
            notifyFirstChange();
            setDraftAndPersist(updatedLabs);
          } else {
            console.warn('Invalid lab data after removal');
          }
        } catch (error) {
          console.error('Error in handleRemoveLab:', error);
        } finally {
          isProcessingRef.current = false;
        }
      });
    } catch (error) {
      console.error('Error in handleRemoveLab setup:', error);
      isProcessingRef.current = false;
    }
  }, [processedLabs, setDraftAndPersist, notifyFirstChange]);

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
    const firstCategoryIndex = draftLabs.findIndex(lab => lab.category === category);
    
    // Replace the category labs in the original array while preserving other categories
    const updatedLabs = [...draftLabs];
    const categoryIndices = draftLabs
      .map((lab, index) => lab.category === category ? index : -1)
      .filter(index => index !== -1);
    
    // Remove old category labs
    categoryIndices.reverse().forEach(index => updatedLabs.splice(index, 1));
    
    // Insert reordered category labs at the original position
    updatedLabs.splice(firstCategoryIndex, 0, ...reorderedCategoryLabs);

    setDraftAndPersist(updatedLabs);
    setOrderingQueue(prev => prev.filter(key => !key.startsWith(category)));
    setReorderMode(false);
    notifyFirstChange();
  };

  const cancelReorder = () => {
    setReorderMode(false);
    setOrderingQueue([]);
  };


  const labsByCategory = useMemo(() => {
    try {
      if (!draftLabs || !Array.isArray(draftLabs)) {
        return {};
      }

      const grouped = draftLabs.reduce((acc, lab) => {
        // Validate lab object structure
        if (lab && typeof lab === 'object' && lab.category && lab.testName) {
          const category = String(lab.category);
          (acc[category] = acc[category] || []).push(lab);
        } else {
          console.warn('Invalid lab object found:', lab);
        }
        return acc;
      }, {} as Record<string, ProcessedLabValue[]>);

      // Apply custom lab ordering within each category if user has defined it
      Object.keys(grouped).forEach(category => {
        try {
          if (!category || typeof category !== 'string') {
            return;
          }
          
          const customOrder = getPanelLabOrder(labSettings, category);
          if (customOrder && Array.isArray(customOrder) && customOrder.length > 0) {
            const labs = grouped[category];
            if (!labs || !Array.isArray(labs)) {
              return;
            }
            
            const orderedLabs: ProcessedLabValue[] = [];
            const remainingLabs: ProcessedLabValue[] = [];
            
            // First, add labs in the custom order
            customOrder.forEach(testName => {
              if (testName && typeof testName === 'string') {
                const lab = labs.find(l => 
                  l && l.testName && typeof l.testName === 'string' && 
                  l.testName.toLowerCase() === testName.toLowerCase()
                );
                if (lab) {
                  orderedLabs.push(lab);
                }
              }
            });
            
            // Then add any remaining labs that weren't in the custom order
            labs.forEach(lab => {
              if (lab && lab.testName && typeof lab.testName === 'string') {
                if (!orderedLabs.some(ol => 
                  ol && ol.testName && typeof ol.testName === 'string' &&
                  ol.testName.toLowerCase() === lab.testName.toLowerCase()
                )) {
                  remainingLabs.push(lab);
                }
              }
            });
            
            grouped[category] = [...orderedLabs, ...remainingLabs];
          }
        } catch (error) {
          console.error(`Error applying custom order for category ${category}:`, error);
        }
      });

      return grouped;
    } catch (error) {
      console.error('Error in labsByCategory calculation:', error);
      return {};
    }
  }, [draftLabs, labSettings]);

  const orderedCategories = useMemo(() => {
    try {
      if (!draftLabs || !Array.isArray(draftLabs) || draftLabs.length === 0) {
        return [];
      }

      const availableCategories = Object.keys(labsByCategory);
      
      // Use user's custom panel order if available
      if (labSettings && labSettings.panelOrder && Array.isArray(labSettings.panelOrder) && labSettings.panelOrder.length > 0) {
        try {
          // Start with user's preferred order, then add any missing categories
          const validPanelOrder = labSettings.panelOrder.filter(cat => 
            cat && typeof cat === 'string' && cat.trim().length > 0
          );
          const userOrderedCategories = validPanelOrder.filter(cat => availableCategories.includes(cat));
          const remainingCategories = availableCategories.filter(cat => !validPanelOrder.includes(cat));
          return [...userOrderedCategories, ...remainingCategories];
        } catch (error) {
          console.error('Error processing custom panel order:', error);
        }
      }

      // Fallback to original logic if no custom order is set
      const categoryOrder = draftLabs.reduce((acc, lab, index) => {
        if (lab && lab.category && typeof lab.category === 'string') {
          if (!acc[lab.category]) {
            acc[lab.category] = index;
          }
        }
        return acc;
      }, {} as Record<string, number>);
      
      return availableCategories.sort((a, b) => {
        const orderA = categoryOrder[a] ?? 999;
        const orderB = categoryOrder[b] ?? 999;
        return orderA - orderB;
      });
    } catch (error) {
      console.error('Error in orderedCategories calculation:', error);
      return [];
    }
  }, [labsByCategory, draftLabs, labSettings.panelOrder]);


  if (!draftLabs || !Array.isArray(draftLabs) || draftLabs.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        {language === 'fr' ? 'Aucune valeur de laboratoire disponible' : 'No lab values available'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {orderedCategories.map(category => {
        // Validate category and its labs
        if (!category || typeof category !== 'string' || !labsByCategory[category] || !Array.isArray(labsByCategory[category])) {
          return null;
        }
        
        const categoryLabs = labsByCategory[category];
        if (categoryLabs.length === 0) {
          return null;
        }
        
        return (
        <div key={category} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wide">{category}</h3>
              {categoryLabs.length > 1 && (
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
            {categoryLabs.map((lab, index) => {
              // Validate individual lab object
              if (!lab || typeof lab !== 'object' || !lab.testName || typeof lab.testName !== 'string') {
                console.warn('Invalid lab object:', lab);
                return null;
              }
              const isFirstInCategory = index === 0;
              const isLastInCategory = index === categoryLabs.length - 1;
              const canMoveUp = !isFirstInCategory;
              const canMoveDown = !isLastInCategory;
              
              // The most recent value is lab.mostRecent.
              // The trending values are older values, which should be displayed chronologically.
              const firstValue = lab.mostRecent;
              const subsequentValues = Array.isArray(lab.trending) ? [...lab.trending].reverse() : [];

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
                        onClick={(e) => handleMoveUp(lab.testName, e)}
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
                        onClick={(e) => handleMoveDown(lab.testName, e)}
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

                  {/* Toggle visibility button */}
                  <Button
                    variant="ghost" size="sm"
                    onClick={(e) => handleToggleShowInNote(lab.testName, e)}
                    className={`h-8 w-8 p-0 rounded ${
                      lab.showInNote 
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950' 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                    title={lab.showInNote 
                      ? (language === 'fr' ? 'Cacher de la note' : 'Hide from note')
                      : (language === 'fr' ? 'Afficher dans la note' : 'Show in note')
                    }
                  >
                    {lab.showInNote ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>

                  {/* Show trending controls for all labs to allow user customization */}
                  {true && (
                    <div className="flex flex-col items-center space-y-1">
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {language === 'fr' ? 'Tendance' : 'Trending'}
                      </div>
                      <div className="flex items-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-sm">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleTrendingChange(lab.testName, 'decrease', e)} 
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
                            /{lab.maxTrendCount || lab.trending.length}
                          </span>
                        </div>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleTrendingChange(lab.testName, 'increase', e)} 
                          disabled={lab.trendCount >= (lab.maxTrendCount || lab.trending.length)} 
                          className="h-9 w-9 p-0 rounded-none hover:bg-green-50 dark:hover:bg-green-950 disabled:opacity-30"
                          title={language === 'fr' ? 'Afficher plus de valeurs' : 'Show more values'}
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                      </div>
                      {lab.trendCount > 0 ? (
                        <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                          {language === 'fr' ? 'Inclus dans la note' : 'Included in note'}
                        </div>
                      ) : (lab.maxTrendCount === 0 && (lab.allTrendingValues?.length === 0 || !lab.allTrendingValues) ? (
                        <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                          {language === 'fr' ? 'Aucune donnée historique' : 'No historical data'}
                        </div>
                      ) : null)}
                    </div>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>
        );
      })}
    </div>
  );
}));