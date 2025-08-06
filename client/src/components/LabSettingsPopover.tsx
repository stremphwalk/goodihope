import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Cog } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LabSettings } from '@/lib/labSettings';
import { LabSettingsModal } from './LabSettingsModal';

interface LabSettingsPopoverProps {
  onSettingsChange?: (settings: LabSettings) => void;
  trigger?: React.ReactNode;
  /**
   * Optional externally controlled open state. If provided, the popover becomes a controlled component.
   */
  isOpenExternal?: boolean;
  /**
   * Optional setter for externally controlled open state. Required if `isOpenExternal` is provided.
   */
  setIsOpenExternal?: (open: boolean) => void;
  /**
   * Optional externally controlled active tab state. If provided, tab state is managed externally.
   */
  activeTabExternal?: string;
  /**
   * Optional setter for externally controlled active tab state. Required if `activeTabExternal` is provided.
   */
  setActiveTabExternal?: (tab: string) => void;
  /**
   * Optional externally controlled panel selection state for Tests & Order tab.
   */
  selectedPanelExternal?: string;
  /**
   * Optional setter for externally controlled panel selection state.
   */
  setSelectedPanelExternal?: (panel: string) => void;
}

export const LabSettingsPopover = React.memo(function LabSettingsPopover({ 
  onSettingsChange,
  trigger,
  isOpenExternal,
  setIsOpenExternal,
  activeTabExternal,
  setActiveTabExternal,
  selectedPanelExternal,
  setSelectedPanelExternal
}: LabSettingsPopoverProps) {
  const { language } = useLanguage();
  // Decide if controlled or uncontrolled for modal open state
  const isControlled = typeof isOpenExternal === 'boolean' && typeof setIsOpenExternal === 'function';
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? isOpenExternal! : internalOpen;
  const setIsOpen = isControlled ? setIsOpenExternal! : setInternalOpen;
  
  // Decide if controlled or uncontrolled for tab state
  const isTabControlled = typeof activeTabExternal === 'string' && typeof setActiveTabExternal === 'function';
  const [internalActiveTab, setInternalActiveTab] = useState<string>('panels');
  const persistentActiveTab = isTabControlled ? activeTabExternal! : internalActiveTab;
  const setPersistentActiveTab = isTabControlled ? setActiveTabExternal! : setInternalActiveTab;
  
  // Memoized setter to prevent unnecessary re-renders
  const memoizedSetActiveTab = useCallback((tab: string) => {
    setPersistentActiveTab(tab);
  }, [setPersistentActiveTab]);

  // Debug state changes
  useEffect(() => {
    console.log('🎯 LabSettingsPopover: isOpen changed to:', isOpen, 'at', new Date().toISOString());
  }, [isOpen]);

  // Debug component lifecycle
  useEffect(() => {
    console.log('🎯 LabSettingsPopover: Component mounted/updated, persistentActiveTab:', persistentActiveTab, 'isTabControlled:', isTabControlled);
    return () => {
      console.log('🎯 LabSettingsPopover: Component unmounting, persistentActiveTab was:', persistentActiveTab);
    };
  });

  // Debug parent callback - memoized to prevent unnecessary re-renders
  const handleSettingsChange = useCallback((settings: LabSettings) => {
    console.log('🎯 LabSettingsPopover: Received settings change, passing to parent');
    console.log('🎯 LabSettingsPopover: Current persistentActiveTab before parent call:', persistentActiveTab);
    onSettingsChange?.(settings);
    console.log('🎯 LabSettingsPopover: Parent callback completed, persistentActiveTab after:', persistentActiveTab);
  }, [onSettingsChange]); // Removed persistentActiveTab from dependencies

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm" 
      className="px-3 py-2 h-auto bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm flex items-center space-x-2"
      title={language === 'fr' ? 'Personnaliser l\'affichage des laboratoires' : 'Customize lab display settings'}
      onClick={() => setIsOpen(true)}
    >
      <Cog className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {language === 'fr' ? 'Paramètres' : 'Settings'}
      </span>
    </Button>
  );

  const handleTriggerClick = () => {
    setIsOpen(true);
  };

  return (
    <>
      {trigger ? (
        <div onClick={handleTriggerClick}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}
      
      <LabSettingsModal
        key="lab-settings-modal" // Stable key to prevent unnecessary remounts
        isOpen={isOpen}
        onClose={() => {
          console.log('🎯 LabSettingsPopover: Modal close requested');
          setIsOpen(false);
        }}
        onSettingsChange={handleSettingsChange}
        activeTabExternal={persistentActiveTab}
        setActiveTabExternal={memoizedSetActiveTab}
        selectedPanelExternal={selectedPanelExternal}
        setSelectedPanelExternal={setSelectedPanelExternal}
      />
    </>
  );
});