import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GripVertical,
  ChevronUp, 
  ChevronDown,
  RotateCcw,
  Plus,
  X
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  LabSettings, 
  updatePanelLabOrder, 
  getPanelLabOrder
} from '@/lib/labSettings';
import { CANONICAL_LABS } from '@/lib/labCanonical';
import { categorizeLabTest, getAvailableCategories, getChemistrySubCategories, getChemistrySubCategory } from '@/lib/labCategorizer';

interface LabOrderSettingsProps {
  settings: LabSettings;
  onSettingsChange: (settings: LabSettings) => void;
  // Optional external control for selected panel to prevent resets
  selectedPanelExternal?: string;
  onSelectedPanelChange?: (panel: string) => void;
}

// Memoized individual lab item component for performance
const LabItem = memo(({ 
  labName, 
  index, 
  isDragged,
  onMoveUp, 
  onMoveDown, 
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isFirst,
  isLast
}: {
  labName: string;
  index: number;
  isDragged: boolean;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (index: number) => void;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => (
  <div
    className={`flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-all duration-200 ${
      isDragged 
        ? 'opacity-50 transform rotate-1' 
        : 'hover:shadow-sm'
    }`}
    draggable
    onDragStart={(e) => onDragStart(e, index)}
    onDragOver={onDragOver}
    onDrop={(e) => onDrop(e, index)}
    onDragEnd={onDragEnd}
  >
    <div className="flex items-center space-x-3">
      <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-semibold">
        {index + 1}
      </div>
      
      <div className="cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <GripVertical className="h-4 w-4" />
      </div>
      
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {labName}
      </span>
    </div>

    <div className="flex items-center space-x-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMoveUp(index)}
        disabled={isFirst}
        className="h-6 w-6 p-0"
      >
        <ChevronUp className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onMoveDown(index)}
        disabled={isLast}
        className="h-6 w-6 p-0"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(index)}
        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  </div>
));

LabItem.displayName = 'LabItem';

export function LabOrderSettings({ 
  settings, 
  onSettingsChange,
  selectedPanelExternal,
  onSelectedPanelChange 
}: LabOrderSettingsProps) {
  const { language } = useLanguage();
  
  // Get all available categories that have labs, respecting user's panel order preference
  const validPanelOrder = useMemo(() => {
    // Get all available categories from the categorizer
    const allAvailableCategories = getAvailableCategories();
    
    // Use user's panel order if available, otherwise use default order
    const userPanelOrder = settings?.panelOrder && Array.isArray(settings.panelOrder) 
      ? settings.panelOrder.filter(panel => panel && typeof panel === 'string')
      : [];
    
    // Ensure all available categories are included, starting with user's preferred order
    const orderedCategories = [...userPanelOrder];
    
    // Add any missing categories that aren't in the user's order
    allAvailableCategories.forEach(category => {
      if (!orderedCategories.includes(category)) {
        orderedCategories.push(category);
      }
    });
    
    return orderedCategories.length > 0 ? orderedCategories : ['CBC'];
  }, [settings]);
  
  // Use external panel state when provided, otherwise use internal state
  const [internalSelectedPanel, setInternalSelectedPanel] = useState<string>(() => {
    return validPanelOrder[0] || 'CBC';
  });
  
  const selectedPanel = selectedPanelExternal ?? internalSelectedPanel;
  const setSelectedPanel = onSelectedPanelChange ?? setInternalSelectedPanel;
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 50; // Pagination for large datasets

  // Update selectedPanel if it's no longer valid
  useEffect(() => {
    if (!validPanelOrder.includes(selectedPanel)) {
      setSelectedPanel(validPanelOrder[0] || 'CBC');
    }
  }, [validPanelOrder, selectedPanel, setSelectedPanel]);

  // Get current lab order for selected panel
  const currentLabOrder = useMemo(() => {
    if (!selectedPanel || !settings) return [];
    try {
      return getPanelLabOrder(settings, selectedPanel);
    } catch (error) {
      console.error('Error getting panel lab order:', error);
      return [];
    }
  }, [settings, selectedPanel]);


  // Dynamic suggestion map derived from canonical list with logical clinical grouping
  const commonLabsByPanel = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    const chemistrySubCategories = getChemistrySubCategories();
    
    CANONICAL_LABS.forEach((lab) => {
      const panel = categorizeLabTest(lab);
      if (!mapping[panel]) mapping[panel] = [];
      if (!mapping[panel].includes(lab)) {
        mapping[panel].push(lab);
      }
    });
    
    // For Chemistry panel, reorganize by clinical subgroups
    if (mapping['Chemistry']) {
      const organizedChemistry: string[] = [];
      
      // Add labs in clinical order: Renal → Liver → Metabolic
      const clinicalOrder = ['Renal', 'Liver', 'Metabolic'];
      
      clinicalOrder.forEach(subCategory => {
        if (chemistrySubCategories[subCategory]) {
          const subCategoryLabs = mapping['Chemistry'].filter(lab => {
            const labSubCategory = getChemistrySubCategory(lab);
            return labSubCategory === subCategory;
          });
          organizedChemistry.push(...subCategoryLabs);
        }
      });
      
      // Add any remaining chemistry labs that don't fit into subcategories
      const remainingLabs = mapping['Chemistry'].filter(lab => {
        const labSubCategory = getChemistrySubCategory(lab);
        return !labSubCategory;
      });
      organizedChemistry.push(...remainingLabs);
      
      mapping['Chemistry'] = organizedChemistry;
    }
    
    return mapping;
  }, []);

  const handleMoveUp = useCallback((index: number) => {
    if (!currentLabOrder || !Array.isArray(currentLabOrder) || index <= 0 || index >= currentLabOrder.length) {
      return;
    }
    
    try {
      const newOrder = [...currentLabOrder];
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
      
      const updatedSettings = updatePanelLabOrder(settings, selectedPanel, newOrder);
      
      if (!updatedSettings || typeof updatedSettings !== 'object') {
        console.error('handleMoveUp: updatePanelLabOrder returned invalid settings');
        return;
      }
      
      if (typeof onSettingsChange === 'function') {
        onSettingsChange(updatedSettings);
      } else {
        console.error('handleMoveUp: onSettingsChange is not a function');
      }
    } catch (error) {
      console.error('Error moving lab up:', error);
    }
  }, [currentLabOrder, settings, selectedPanel, onSettingsChange]);

  const handleMoveDown = useCallback((index: number) => {
    if (!currentLabOrder || !Array.isArray(currentLabOrder) || index < 0 || index >= currentLabOrder.length - 1) {
      return;
    }
    
    try {
      const newOrder = [...currentLabOrder];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      
      const updatedSettings = updatePanelLabOrder(settings, selectedPanel, newOrder);
      
      if (!updatedSettings || typeof updatedSettings !== 'object') {
        console.error('handleMoveDown: updatePanelLabOrder returned invalid settings');
        return;
      }
      
      if (typeof onSettingsChange === 'function') {
        onSettingsChange(updatedSettings);
      } else {
        console.error('handleMoveDown: onSettingsChange is not a function');
      }
    } catch (error) {
      console.error('Error moving lab down:', error);
    }
  }, [currentLabOrder, settings, selectedPanel, onSettingsChange]);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    if (!currentLabOrder || index < 0 || index >= currentLabOrder.length) {
      e.preventDefault();
      return;
    }
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  }, [currentLabOrder]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (!currentLabOrder || !Array.isArray(currentLabOrder)) {
      setDraggedIndex(null);
      return;
    }
    
    if (draggedIndex === null || draggedIndex === dropIndex || dropIndex < 0 || dropIndex >= currentLabOrder.length) {
      setDraggedIndex(null);
      return;
    }

    try {
      const newOrder = [...currentLabOrder];
      const draggedItem = newOrder[draggedIndex];
      
      if (!draggedItem) {
        setDraggedIndex(null);
        return;
      }
      
      newOrder.splice(draggedIndex, 1);
      const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
      newOrder.splice(insertIndex, 0, draggedItem);
      
      const updatedSettings = updatePanelLabOrder(settings, selectedPanel, newOrder);
      onSettingsChange(updatedSettings);
    } catch (error) {
      console.error('Error during drag and drop:', error);
    } finally {
      setDraggedIndex(null);
    }
  }, [draggedIndex, currentLabOrder, settings, selectedPanel, onSettingsChange]);

  const handleAddLab = useCallback((labName: string) => {
    if (!labName || typeof labName !== 'string' || labName.trim().length === 0) {
      return;
    }
    
    const trimmedName = labName.trim();
    if (!currentLabOrder || currentLabOrder.includes(trimmedName)) {
      return;
    }
    
    try {
      const newOrder = [...currentLabOrder, trimmedName];
      const updatedSettings = updatePanelLabOrder(settings, selectedPanel, newOrder);
      
      if (!updatedSettings || typeof updatedSettings !== 'object') {
        console.error('handleAddLab: updatePanelLabOrder returned invalid settings');
        return;
      }
      
      if (typeof onSettingsChange === 'function') {
        onSettingsChange(updatedSettings);
      } else {
        console.error('handleAddLab: onSettingsChange is not a function');
      }
    } catch (error) {
      console.error('Error adding lab:', error);
    }
  }, [currentLabOrder, settings, selectedPanel, onSettingsChange]);

  const handleRemoveLab = useCallback((index: number) => {
    if (!currentLabOrder || !Array.isArray(currentLabOrder) || index < 0 || index >= currentLabOrder.length) {
      return;
    }
    
    try {
      const newOrder = currentLabOrder.filter((_, i) => i !== index);
      const updatedSettings = updatePanelLabOrder(settings, selectedPanel, newOrder);
      
      // Validate that we got valid updated settings
      if (!updatedSettings || typeof updatedSettings !== 'object') {
        console.error('updatePanelLabOrder returned invalid settings');
        return;
      }
      
      if (typeof onSettingsChange === 'function') {
        onSettingsChange(updatedSettings);
      } else {
        console.error('onSettingsChange is not a function');
      }
    } catch (error) {
      console.error('Error removing lab:', error);
    }
  }, [currentLabOrder, settings, selectedPanel, onSettingsChange]);

  const handleReset = useCallback(() => {
    try {
      const updatedSettings = updatePanelLabOrder(settings, selectedPanel, []);
      
      if (!updatedSettings || typeof updatedSettings !== 'object') {
        console.error('handleReset: updatePanelLabOrder returned invalid settings');
        return;
      }
      
      if (typeof onSettingsChange === 'function') {
        onSettingsChange(updatedSettings);
      } else {
        console.error('handleReset: onSettingsChange is not a function');
      }
    } catch (error) {
      console.error('Error in handleReset:', error);
    }
  }, [settings, selectedPanel, onSettingsChange]);





  const availableLabsToAdd = useMemo(() => {
    const common = commonLabsByPanel[selectedPanel] || [];
    return common.filter(lab => !currentLabOrder.includes(lab));
  }, [selectedPanel, currentLabOrder]);


  // Pagination for large datasets
  const paginatedLabOrder = useMemo(() => {
    if (!Array.isArray(currentLabOrder) || currentLabOrder.length <= ITEMS_PER_PAGE) {
      return { items: currentLabOrder, totalPages: 1, showPagination: false };
    }
    
    const totalPages = Math.ceil(currentLabOrder.length / ITEMS_PER_PAGE);
    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const items = currentLabOrder.slice(startIndex, endIndex);
    
    return { items, totalPages, showPagination: true };
  }, [currentLabOrder, currentPage, ITEMS_PER_PAGE]);

  // Reset to first page when panel changes
  useEffect(() => {
    setCurrentPage(0);
  }, [selectedPanel]);

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
          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            {validPanelOrder.map((panel) => (
              <SelectItem key={panel} value={panel}>
                {panel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>


      {/* Current lab order */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              {language === 'fr' ? 'Ordre actuel des tests' : 'Current Test Order'}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {currentLabOrder.length} {language === 'fr' ? 'tests' : 'tests'}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs"
                disabled={currentLabOrder.length === 0}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                {language === 'fr' ? 'Effacer' : 'Clear'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {currentLabOrder.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-sm">
                {language === 'fr' 
                  ? 'Aucun ordre personnalisé défini. L\'ordre par défaut sera utilisé.'
                  : 'No custom order defined. Default order will be used.'
                }
              </p>
            </div>
          ) : (
            <>
              {paginatedLabOrder.items.map((labName, relativeIndex) => {
                const absoluteIndex = currentPage * ITEMS_PER_PAGE + relativeIndex;
                return (
                  <LabItem
                    key={`${labName}-${absoluteIndex}`}
                    labName={labName}
                    index={absoluteIndex}
                    isDragged={draggedIndex === absoluteIndex}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onRemove={handleRemoveLab}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isFirst={absoluteIndex === 0}
                    isLast={absoluteIndex === currentLabOrder.length - 1}
                  />
                );
              })}
              
              {/* Pagination Controls */}
              {paginatedLabOrder.showPagination && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'fr' 
                      ? `Page ${currentPage + 1} sur ${paginatedLabOrder.totalPages} (${currentLabOrder.length} tests au total)`
                      : `Page ${currentPage + 1} of ${paginatedLabOrder.totalPages} (${currentLabOrder.length} total tests)`}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                      disabled={currentPage === 0}
                      className="text-xs"
                    >
                      {language === 'fr' ? 'Précédent' : 'Previous'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(paginatedLabOrder.totalPages - 1, currentPage + 1))}
                      disabled={currentPage >= paginatedLabOrder.totalPages - 1}
                      className="text-xs"
                    >
                      {language === 'fr' ? 'Suivant' : 'Next'}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add new lab */}
      {availableLabsToAdd.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              {language === 'fr' ? 'Ajouter des tests' : 'Add Tests'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPanel === 'Chemistry' ? (
              // Special chemistry layout with clinical subgroups
              <div className="space-y-4">
                {['Renal', 'Liver', 'Metabolic'].map(subCategory => {
                  const subCategoryLabs = availableLabsToAdd.filter(lab => {
                    const labSubCategory = getChemistrySubCategory(lab);
                    return labSubCategory === subCategory;
                  });
                  
                  if (subCategoryLabs.length === 0) return null;
                  
                  return (
                    <div key={subCategory} className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                        {language === 'fr' ? (
                          subCategory === 'Renal' ? 'Fonction rénale' :
                          subCategory === 'Liver' ? 'Fonction hépatique' :
                          'Métabolique'
                        ) : subCategory}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {subCategoryLabs.map((labName) => (
                          <Button
                            key={labName}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddLab(labName)}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {labName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                {/* Add any remaining chemistry labs that don't fit subcategories */}
                {(() => {
                  const remainingLabs = availableLabsToAdd.filter(lab => {
                    const labSubCategory = getChemistrySubCategory(lab);
                    return !labSubCategory;
                  });
                  
                  if (remainingLabs.length === 0) return null;
                  
                  return (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide border-b border-gray-200 dark:border-gray-700 pb-1">
                        {language === 'fr' ? 'Autres' : 'Other'}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {remainingLabs.map((labName) => (
                          <Button
                            key={labName}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddLab(labName)}
                            className="text-xs"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {labName}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              // Standard layout for non-chemistry panels
              <div className="flex flex-wrap gap-2">
                {availableLabsToAdd.map((labName) => (
                  <Button
                    key={labName}
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddLab(labName)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {labName}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        {language === 'fr' 
          ? '💡 Définissez un ordre personnalisé pour prioritiser certains tests. Les tests non listés suivront l\'ordre par défaut.'
          : '💡 Define a custom order to prioritize specific tests. Unlisted tests will follow the default order.'
        }
      </div>
    </div>
  );
}