import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Cog,
  Layers, 
  ArrowUpDown, 
  TrendingUp, 
  CheckSquare,
  RotateCcw,
  Download,
  Upload,
  X as XIcon
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LabSettings, 
  loadLabSettings, 
  saveLabSettings, 
  resetLabSettings,
  exportLabSettings,
  importLabSettings
} from '@/lib/labSettings';
import { LabPanelOrderSettings } from './LabPanelOrderSettings';
import { LabOrderSettings } from './LabOrderSettings';
import { LabTrendingSettings } from './LabTrendingSettings';

interface LabSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: LabSettings) => void;
  /**
   * Optional externally controlled active tab. If provided together with setActiveTabExternal, the modal will use controlled mode for tabs.
   */
  activeTabExternal?: string;
  /**
   * Setter for externally controlled active tab. Required if activeTabExternal is provided.
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

export const LabSettingsModal = React.memo(function LabSettingsModal({ 
  isOpen,
  onClose,
  onSettingsChange,
  activeTabExternal,
  setActiveTabExternal,
  selectedPanelExternal,
  setSelectedPanelExternal
}: LabSettingsModalProps) {
  const { language } = useLanguage();
  const auth = useAuth();

  // Debug modal state changes
  useEffect(() => {
    console.log('🔍 LabSettingsModal: isOpen changed to:', isOpen, 'at', new Date().toISOString());
    if (!isOpen) {
      console.trace('🔍 LabSettingsModal: Modal closed - stack trace:');
    }
  }, [isOpen]);

  // Debug component lifecycle
  useEffect(() => {
    console.log('🔍 LabSettingsModal: Component mounted/updated');
    return () => {
      console.log('🔍 LabSettingsModal: Component unmounting');
    };
  });
  const [settings, setSettings] = useState<LabSettings>(() => {
    try {
      return loadLabSettings();
    } catch (error) {
      console.error('Failed to load lab settings, using defaults:', error);
      return resetLabSettings();
    }
  });
  
  // Panel state for LabOrderSettings - use external if provided, otherwise internal
  const [internalSelectedPanel, setInternalSelectedPanel] = useState<string>('CBC');
  const isPanelControlled = typeof selectedPanelExternal === 'string' && typeof setSelectedPanelExternal === 'function';
  const selectedPanel = isPanelControlled ? selectedPanelExternal! : internalSelectedPanel;
  const setSelectedPanel = isPanelControlled ? setSelectedPanelExternal! : setInternalSelectedPanel;
  
  // Load settings from cloud only once when the modal first opens
  const hasLoadedCloudSettings = useRef(false);
  useEffect(() => {
    let isMounted = true; // Prevent race conditions
    
    const loadCloudSettings = async () => {
      try {
        if (!auth?.user?.id_token) {
          console.warn('No auth token available for loading cloud settings');
          return;
        }
        
        const response = await fetch('/api/lab-settings', {
          headers: {
            'Authorization': `Bearer ${auth.user.id_token}`
          },
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        if (!isMounted) return; // Component unmounted, don't update state
        
        if (response.ok) {
          const result = await response.json();
          if (result.settings && typeof result.settings === 'object' && result.settings.version) {
            // Check for version conflicts with local settings
            const currentLocalSettings = settings;
            if (currentLocalSettings.version && 
                result.settings.version < currentLocalSettings.version) {
              console.warn('Cloud settings are older than local settings, using local settings');
              return;
            }
            
            // Add server timestamp for conflict resolution
            const enhancedSettings = {
              ...result.settings,
              lastSyncedAt: result.updatedAt || new Date().toISOString()
            };
            
            setSettings(enhancedSettings);
            try {
              saveLabSettings(enhancedSettings); // Also save to localStorage as cache
            } catch (saveError) {
              console.warn('Failed to cache settings locally:', saveError);
            }
            onSettingsChange?.(enhancedSettings);
            console.log('Loaded settings from cloud');
          } else {
            console.warn('Invalid settings format from cloud:', result);
          }
        } else if (response.status !== 404) {
          // 404 is expected if user has no cloud settings yet
          console.warn('Failed to load cloud settings:', response.status, response.statusText);
        }
      } catch (error) {
        if (!isMounted) return;
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('Cloud settings load timed out');
        } else {
          console.warn('Could not load cloud settings, using local settings:', error);
        }
        // Continue with local settings, don't show error to user
      }
    };
    
    if (isOpen && !hasLoadedCloudSettings.current) {
      hasLoadedCloudSettings.current = true;
      loadCloudSettings();
    }
    
    return () => {
      isMounted = false; // Cleanup flag
    };
  }, [isOpen, onSettingsChange, auth]);

  // Active tab can be controlled from parent (to survive any accidental remounts)
  const isActiveTabControlled = typeof activeTabExternal === 'string' && typeof setActiveTabExternal === 'function';
  const [internalActiveTab, setInternalActiveTab] = useState('panels');
  const activeTab = isActiveTabControlled ? activeTabExternal! : internalActiveTab;
  const setActiveTab = isActiveTabControlled ? setActiveTabExternal! : setInternalActiveTab;
  
  // Debug tab state
  useEffect(() => {
    console.log('🔍 LabSettingsModal: Tab state - isControlled:', isActiveTabControlled, 'activeTab:', activeTab, 'external:', activeTabExternal, 'internal:', internalActiveTab);
  }, [isActiveTabControlled, activeTab, activeTabExternal, internalActiveTab]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to maintain stable state that doesn't trigger re-renders
  const isModalOpenRef = useRef(isOpen);
  const settingsChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isOperationInProgressRef = useRef(false);
  
  // Update ref when modal state changes and reset cloud settings flag when closed
  useEffect(() => {
    isModalOpenRef.current = isOpen;
    if (!isOpen) {
      hasLoadedCloudSettings.current = false; // Reset to allow cloud sync next time
    }
  }, [isOpen]);
  
  // Prevent modal from closing during operations
  const preventClose = () => {
    isOperationInProgressRef.current = true;
    setTimeout(() => {
      isOperationInProgressRef.current = false;
    }, 500); // 500ms protection window
  };

  // Minimal close prevention for critical operations only
  const preventCloseDuringInteraction = useCallback(() => {
    isOperationInProgressRef.current = true;
    setTimeout(() => {
      isOperationInProgressRef.current = false;
    }, 50); // 50ms protection for critical interactions only
  }, []);

  // Auto-save function that doesn't interfere with user interactions
  const autoSaveToCloud = async (settingsToSave: LabSettings) => {
    try {
      if (!auth?.user?.id_token || !settingsToSave || typeof settingsToSave !== 'object') {
        return; // Silently skip if conditions aren't met
      }

      // Validate settings before sending
      if (!settingsToSave.version || !Array.isArray(settingsToSave.panelOrder)) {
        console.warn('Invalid settings format for auto-save, skipping');
        return;
      }

      // Add client timestamp for conflict resolution
      const settingsWithTimestamp = {
        ...settingsToSave,
        lastModifiedAt: new Date().toISOString(),
        clientVersion: settingsToSave.version
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for auto-save

      const response = await fetch('/api/lab-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.id_token}`
        },
        body: JSON.stringify({ settings: settingsWithTimestamp }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Auto-save to cloud successful');
        }
      }
    } catch (error) {
      // Silently log auto-save errors without disrupting user experience
      console.error('Auto-save to cloud failed:', error);
    }
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isModalOpenRef.current && !isLoading && !isOperationInProgressRef.current) {
        console.log('🚪 LabSettingsModal: Closing via Escape key');
        event.preventDefault();
        event.stopPropagation();
        onClose();
      } else if (event.key === 'Escape' && isOperationInProgressRef.current) {
        console.log('🛡️ LabSettingsModal: Prevented Escape close during operation');
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true); // Use capture phase
      return () => document.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [isOpen, isLoading, onClose]);

  const handleSettingsUpdate = useCallback((newSettings: LabSettings) => {
    console.log('🔧 LabSettingsModal: Settings update triggered at', new Date().toISOString());
    console.log('🔧 LabSettingsModal: Current modal isOpen state:', isModalOpenRef.current);
    
    // Prevent modal from closing during this critical operation
    preventClose();
    
    // Immediately update local state and save to localStorage
    try {
      // Validate settings before updating
      if (!newSettings || typeof newSettings !== 'object') {
        throw new Error('Invalid settings object');
      }
      
      setSettings(newSettings);
      saveLabSettings(newSettings);
      setError(null);
      console.log('🔧 LabSettingsModal: Local settings updated successfully');
    } catch (error) {
      console.error('❌ LabSettingsModal: Failed to update local settings:', error);
      setError(language === 'fr' ? 'Erreur lors de la sauvegarde des paramètres' : 'Failed to save settings');
      return;
    }
    
    // Debounce the parent callback to prevent rapid re-renders
    if (settingsChangeTimeoutRef.current) {
      clearTimeout(settingsChangeTimeoutRef.current);
    }
    
    settingsChangeTimeoutRef.current = setTimeout(() => {
      if (isModalOpenRef.current) { // Only call parent if modal is still open
        console.log('🔧 LabSettingsModal: Calling debounced onSettingsChange callback');
        // Use requestAnimationFrame to ensure this callback doesn't interfere with ongoing user interactions
        requestAnimationFrame(() => {
          if (isModalOpenRef.current) {
            onSettingsChange?.(newSettings);
            console.log('🔧 LabSettingsModal: onSettingsChange callback completed');
            
            // Auto-save to cloud database after parent callback
            if (auth?.user?.id_token) {
              console.log('🔧 LabSettingsModal: Auto-saving to cloud database');
              // Call auto-save directly without dependency tracking to avoid hoisting issues
              autoSaveToCloud(newSettings);
            }
          }
        });
      } else {
        console.log('🔧 LabSettingsModal: Skipping parent callback - modal was closed');
      }
    }, 300); // Increased debounce to 300ms to reduce interference
  }, [onSettingsChange, language, auth]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (settingsChangeTimeoutRef.current) {
        clearTimeout(settingsChangeTimeoutRef.current);
      }
    };
  }, []);

  const handleReset = useCallback(() => {
    try {
      setIsLoading(true);
      const defaultSettings = resetLabSettings();
      setSettings(defaultSettings);
      onSettingsChange?.(defaultSettings);
      setError(null);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      setError(language === 'fr' ? 'Erreur lors de la réinitialisation' : 'Failed to reset settings');
    } finally {
      setIsLoading(false);
    }
  }, [onSettingsChange, language]);

  const handleExport = useCallback(() => {
    try {
      setIsLoading(true);
      const exported = exportLabSettings(settings);
      
      if (!exported || exported.trim().length === 0) {
        throw new Error('Empty export data');
      }
      
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setError(null);
    } catch (error) {
      console.error('Error exporting settings:', error);
      setError(language === 'fr' ? 'Erreur lors de l\'exportation' : 'Failed to export settings');
    } finally {
      setIsLoading(false);
    }
  }, [settings, language, auth]);

  const handleSaveToCloud = useCallback(async () => {
    if (!settings || typeof settings !== 'object') {
      setError(language === 'fr' ? 'Paramètres invalides' : 'Invalid settings');
      return;
    }
    
    if (!auth?.user?.id_token) {
      setError(language === 'fr' ? 'Non authentifié - veuillez vous reconnecter' : 'Not authenticated - please log in again');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Validate settings before sending
      if (!settings.version || !Array.isArray(settings.panelOrder)) {
        throw new Error('Invalid settings format');
      }
      
      // Add client timestamp for conflict resolution
      const settingsWithTimestamp = {
        ...settings,
        lastModifiedAt: new Date().toISOString(),
        clientVersion: settings.version
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch('/api/lab-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.user.id_token}`
        },
        body: JSON.stringify({ settings: settingsWithTimestamp }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = 'Failed to save settings to cloud';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Failed to parse error response, use default message
        }
        
        if (response.status === 401) {
          errorMessage = language === 'fr' ? 'Non autorisé - veuillez vous reconnecter' : 'Unauthorized - please log in again';
        } else if (response.status === 413) {
          errorMessage = language === 'fr' ? 'Paramètres trop volumineux' : 'Settings too large';
        } else if (response.status >= 500) {
          errorMessage = language === 'fr' ? 'Erreur serveur - réessayez plus tard' : 'Server error - try again later';
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save operation failed');
      }
      
      console.log('Settings saved to cloud successfully:', result);
      
      // Clear any existing error and show success (temporarily)
      setError(null);
      
      // Show temporary success message
      const successMessage = language === 'fr' ? '✅ Paramètres sauvegardés avec succès' : '✅ Settings saved successfully';
      setError(successMessage);
      setTimeout(() => setError(null), 3000); // Clear success message after 3 seconds
      
    } catch (error) {
      console.error('Error saving settings to cloud:', error);
      
      let errorMessage = language === 'fr' 
        ? 'Erreur lors de la sauvegarde sur le cloud' 
        : 'Failed to save settings to cloud';
        
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = language === 'fr' 
          ? 'Délai d\'attente dépassé - vérifiez votre connexion' 
          : 'Request timed out - check your connection';
      } else if (error instanceof Error && error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [settings, language, auth]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        setError(language === 'fr' ? 'Fichier trop volumineux (max 1MB)' : 'File too large (max 1MB)');
        return;
      }
      
      // Validate file type
      if (!file.name.endsWith('.json')) {
        setError(language === 'fr' ? 'Format de fichier invalide' : 'Invalid file format');
        return;
      }
      
      setIsLoading(true);
      const reader = new FileReader();
      
      reader.onerror = () => {
        setError(language === 'fr' ? 'Erreur de lecture du fichier' : 'File read error');
        setIsLoading(false);
      };
      
      reader.onload = (event) => {
        try {
          const jsonString = event.target?.result as string;
          
          if (!jsonString || jsonString.trim().length === 0) {
            throw new Error('Empty file');
          }
          
          const imported = importLabSettings(jsonString);
          
          if (!imported) {
            throw new Error('Invalid settings data');
          }
          
          setSettings(imported);
          onSettingsChange?.(imported);
          setError(null);
        } catch (error) {
          console.error('Error importing settings:', error);
          setError(language === 'fr' ? 'Fichier de paramètres invalide' : 'Invalid settings file');
        } finally {
          setIsLoading(false);
        }
      };
      
      reader.readAsText(file);
    };
    input.click();
  }, [language, onSettingsChange]);

  const tabConfig = [
    {
      id: 'panels',
      label: language === 'fr' ? 'Ordre des Panneaux' : 'Panel Order',
      icon: <Layers className="h-4 w-4" />,
      description: language === 'fr' ? 'Réorganiser l\'ordre d\'affichage des panneaux' : 'Reorder panel display order'
    },
    {
      id: 'labs',
      label: language === 'fr' ? 'Tests & Ordre' : 'Tests & Order',
      icon: <ArrowUpDown className="h-4 w-4" />,
      description: language === 'fr' ? 'Sélectionner et réorganiser les tests dans chaque panneau' : 'Select and reorder tests within panels'
    },
    {
      id: 'trending',
      label: language === 'fr' ? 'Tendances' : 'Trending',
      icon: <TrendingUp className="h-4 w-4" />,
      description: language === 'fr' ? 'Configurer les valeurs de tendance par défaut' : 'Configure default trending values'
    }
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={() => {}} // Disable automatic closing
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div 
          className="fixed inset-0 bg-black/30" 
          aria-hidden="true" 
          // Disable overlay click-to-close to avoid accidental modal resets
          onClick={(e) => {
            e.stopPropagation();
            // Intentionally do NOT call onClose here; user must use Close/X buttons.
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => e.preventDefault()}
        />

        <div 
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-[90vw] max-w-4xl h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()} // Just prevent click bubbling, no operation blocking
          onDragStart={(e) => e.stopPropagation()}
          onDragOver={(e) => e.stopPropagation()}
          onDragEnd={(e) => e.stopPropagation()}
          onDrop={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (!isLoading && !isOperationInProgressRef.current) {
                console.log('🚪 LabSettingsModal: Closing via X button');
                onClose();
              } else {
                console.log('🛡️ LabSettingsModal: Prevented close during operation');
              }
            }}
            disabled={isLoading || isOperationInProgressRef.current}
            className="absolute top-4 right-4 p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full z-10 border border-gray-200 dark:border-gray-600 transition-shadow shadow disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            <XIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>

          {/* Header */}
          <div 
            className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pr-12">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {language === 'fr' ? 'Paramètres des Laboratoires' : 'Lab Settings'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'fr' ? 'Personnalisez l\'affichage de vos résultats' : 'Customize your lab results display'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  v{settings.version}
                </Badge>
              </div>
            </div>
          </div>

                      {/* Tab Navigation */}
            <Tabs 
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                preventCloseDuringInteraction();
              }}
              className="flex-1 flex flex-col"
            >
              <div 
                className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
              >
              <TabsList className="grid w-full grid-cols-3 gap-1">
                {tabConfig.map((tab) => (
                  <TabsTrigger 
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center space-x-2 text-xs px-2 py-2"
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Content - This is the scrollable area */}
            <div 
              className="flex-1 overflow-y-auto bg-white dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <TabsContent value="panels" className="m-0 p-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {language === 'fr' ? 'Ordre des Panneaux' : 'Panel Order'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'fr' 
                      ? 'Glissez-déposez pour réorganiser l\'ordre d\'affichage des panneaux de laboratoire.'
                      : 'Drag and drop to reorder how lab panels are displayed.'
                    }
                  </p>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                >
                  <LabPanelOrderSettings 
                    settings={settings}
                    onSettingsChange={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>

              <TabsContent value="labs" className="m-0 p-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {language === 'fr' ? 'Ordre des Tests par Panneau' : 'Test Order by Panel'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'fr' 
                      ? 'Personnalisez l\'ordre des tests individuels dans chaque panneau.'
                      : 'Customize the order of individual tests within each panel.'
                    }
                  </p>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                >
                  <LabOrderSettings 
                    settings={settings}
                    onSettingsChange={handleSettingsUpdate}
                    selectedPanelExternal={selectedPanel}
                    onSelectedPanelChange={setSelectedPanel}
                  />
                </div>
              </TabsContent>

              <TabsContent value="trending" className="m-0 p-6 space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {language === 'fr' ? 'Paramètres de Tendance' : 'Trending Settings'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'fr' 
                      ? 'Configurez le nombre de valeurs de tendance affichées par défaut.'
                      : 'Configure how many trending values are shown by default.'
                    }
                  </p>
                </div>
                <div
                  onClick={(e) => e.stopPropagation()}
                >
                  <LabTrendingSettings 
                    settings={settings}
                    onSettingsChange={handleSettingsUpdate}
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>

          {/* Error/Success Display */}
          {error && (
            <div className={`px-6 py-3 border-t border-gray-200 dark:border-gray-700 ${
              error.includes('✅') ? 'bg-green-50 dark:bg-green-950' : 'bg-red-50 dark:bg-red-950'
            }`}>
              <div className={`flex items-center space-x-2 ${
                error.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  error.includes('✅') ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm">{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className={`ml-auto h-6 w-6 p-0 ${
                    error.includes('✅') 
                      ? 'text-green-600 hover:text-green-700' 
                      : 'text-red-600 hover:text-red-700'
                  }`}
                >
                  ×
                </Button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div 
            className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleImport}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  {language === 'fr' ? 'Importer' : 'Import'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExport}
                  disabled={isLoading}
                  className="text-xs"
                >
                  <Download className="h-3 w-3 mr-1" />
                  {language === 'fr' ? 'Exporter' : 'Export'}
                </Button>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 disabled:opacity-50"
                >
                  <RotateCcw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                  {isLoading ? (language === 'fr' ? 'En cours...' : 'Loading...') : (language === 'fr' ? 'Réinitialiser' : 'Reset')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveToCloud}
                  disabled={isLoading}
                  className="text-xs bg-blue-50 dark:bg-blue-950 hover:bg-blue-100 dark:hover:bg-blue-900 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                >
                  {isLoading ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...') : (language === 'fr' ? 'Sauvegarder' : 'Save Settings')}
                </Button>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isLoading && !isOperationInProgressRef.current) {
                      onClose();
                    }
                  }}
                  disabled={isLoading || isOperationInProgressRef.current}
                  className="text-xs"
                >
                  {language === 'fr' ? 'Fermer' : 'Close'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
});