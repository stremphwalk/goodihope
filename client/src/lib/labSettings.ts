/**
 * Lab Settings Management System
 * Handles user preferences for lab panel ordering, trending, and display customization
 */

import { getAvailableCategories } from './labCategorizer';
import { CANONICAL_LABS } from './labCanonical';

export interface LabTrendingPreference {
  /** Test name */
  testName: string;
  /** Number of trending values to show by default */
  defaultTrendCount: number;
  /** Whether trending is enabled by default for this test */
  enableTrending: boolean;
}

export interface PanelLabOrder {
  /** Panel/category name */
  panelName: string;
  /** Ordered list of lab test names for this panel */
  orderedLabNames: string[];
}

export interface LabDefaultSelection {
  /** Panel/category name */
  panelName: string;
  /** Lab test names that should be selected by default */
  defaultSelectedLabs: string[];
}

export interface LabSettings {
  /** Version for migration purposes */
  version: number;
  /** Custom order of lab panels/categories */
  panelOrder: string[];
  /** Custom order of labs within each panel */
  panelLabOrders: PanelLabOrder[];
  /** Trending preferences per lab test */
  trendingPreferences: LabTrendingPreference[];
  /** Default lab selections per panel */
  defaultSelections: LabDefaultSelection[];
  /** Global trending settings */
  globalTrending: {
    /** Default number of trending values for new labs */
    defaultTrendCount: number;
    /** Whether to enable trending by default for labs with multiple values */
    enableByDefault: boolean;
  };
  /** UI preferences */
  ui: {
    /** Whether to show panel headers */
    showPanelHeaders: boolean;
    /** Whether to show lab indices */
    showLabIndices: boolean;
    /** Compact view mode */
    compactMode: boolean;
  };
}

const SETTINGS_KEY = 'lab_settings_v1';
const CURRENT_VERSION = 1;

/**
 * Default lab settings with sensible defaults
 */
function getDefaultSettings(): LabSettings {
  const availableCategories = getAvailableCategories();
  
  return {
    version: CURRENT_VERSION,
    panelOrder: availableCategories,
    panelLabOrders: [],
    trendingPreferences: [],
    defaultSelections: [],
    globalTrending: {
      defaultTrendCount: 2,
      enableByDefault: true,
    },
    ui: {
      showPanelHeaders: true,
      showLabIndices: true,
      compactMode: false,
    },
  };
}

/**
 * Load lab settings from localStorage with fallback to defaults
 */
export function loadLabSettings(): LabSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return getDefaultSettings();
    }

    const parsed = JSON.parse(stored) as LabSettings;
    
    // Version migration logic
    if (!parsed.version || parsed.version < CURRENT_VERSION) {
      console.log('Migrating lab settings to newer version');
      return migrateSettings(parsed);
    }

    // Validate structure and fill in missing fields
    return validateAndFillSettings(parsed);
  } catch (error) {
    console.error('Error loading lab settings, using defaults:', error);
    return getDefaultSettings();
  }
}

/**
 * Save lab settings to localStorage
 */
export function saveLabSettings(settings: LabSettings): void {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid settings object');
  }
  
  try {
    // Validate settings structure before saving
    const validatedSettings = validateAndFillSettings(settings);
    validatedSettings.version = CURRENT_VERSION;
    
    const jsonString = JSON.stringify(validatedSettings);
    if (jsonString.length > 1024 * 1024) { // 1MB limit
      throw new Error('Settings data too large');
    }
    
    localStorage.setItem(SETTINGS_KEY, jsonString);
  } catch (error) {
    console.error('Error saving lab settings:', error);
    throw error;
  }
}

/**
 * Migrate settings from older versions with comprehensive version handling
 */
function migrateSettings(oldSettings: Partial<LabSettings>): LabSettings {
  const defaults = getDefaultSettings();
  
  try {
    // Handle completely missing settings
    if (!oldSettings || typeof oldSettings !== 'object') {
      console.log('No existing settings found, using defaults');
      return defaults;
    }
    
    const oldVersion = oldSettings.version || 0;
    console.log(`Migrating lab settings from version ${oldVersion} to ${CURRENT_VERSION}`);
    
    // Version-specific migrations
    let migratedSettings = { ...oldSettings };
    
    // Migration from version 0 to 1
    if (oldVersion < 1) {
      console.log('Migrating from version 0 to 1');
      
      // Ensure all required arrays exist
      if (!Array.isArray(migratedSettings.panelOrder)) {
        migratedSettings.panelOrder = defaults.panelOrder;
      }
      
      if (!Array.isArray(migratedSettings.panelLabOrders)) {
        migratedSettings.panelLabOrders = defaults.panelLabOrders;
      }
      
      if (!Array.isArray(migratedSettings.trendingPreferences)) {
        migratedSettings.trendingPreferences = defaults.trendingPreferences;
      }
      
      // Add defaultSelections if missing (new in v1)
      if (!Array.isArray(migratedSettings.defaultSelections)) {
        migratedSettings.defaultSelections = defaults.defaultSelections;
      }
      
      // Ensure globalTrending exists
      if (!migratedSettings.globalTrending || typeof migratedSettings.globalTrending !== 'object') {
        migratedSettings.globalTrending = defaults.globalTrending;
      } else {
        // Validate globalTrending properties
        if (typeof migratedSettings.globalTrending.defaultTrendCount !== 'number' ||
            migratedSettings.globalTrending.defaultTrendCount < 0 ||
            migratedSettings.globalTrending.defaultTrendCount > 10) {
          migratedSettings.globalTrending.defaultTrendCount = defaults.globalTrending.defaultTrendCount;
        }
        
        if (typeof migratedSettings.globalTrending.enableByDefault !== 'boolean') {
          migratedSettings.globalTrending.enableByDefault = defaults.globalTrending.enableByDefault;
        }
      }
      
      // Ensure UI settings exist
      if (!migratedSettings.ui || typeof migratedSettings.ui !== 'object') {
        migratedSettings.ui = defaults.ui;
      } else {
        // Validate UI properties
        Object.keys(defaults.ui).forEach(key => {
          const uiKey = key as keyof typeof defaults.ui;
          if (migratedSettings.ui && typeof migratedSettings.ui[uiKey] !== typeof defaults.ui[uiKey]) {
            migratedSettings.ui[uiKey] = defaults.ui[uiKey];
          }
        });
      }
    }
    
    // Future version migrations would go here
    // if (oldVersion < 2) { ... }
    
    // Final validation and cleanup
    const result = validateAndFillSettings(migratedSettings as LabSettings);
    result.version = CURRENT_VERSION;
    
    console.log('Settings migration completed successfully');
    return result;
    
  } catch (error) {
    console.error('Error during settings migration, using defaults:', error);
    return defaults;
  }
}

/**
 * Validate settings structure and fill in missing fields
 */
function validateAndFillSettings(settings: LabSettings): LabSettings {
  const defaults = getDefaultSettings();
  
  return {
    version: CURRENT_VERSION,
    panelOrder: Array.isArray(settings.panelOrder) ? settings.panelOrder : defaults.panelOrder,
    panelLabOrders: Array.isArray(settings.panelLabOrders) ? settings.panelLabOrders : defaults.panelLabOrders,
    trendingPreferences: Array.isArray(settings.trendingPreferences) ? settings.trendingPreferences : defaults.trendingPreferences,
    defaultSelections: Array.isArray(settings.defaultSelections) ? settings.defaultSelections : defaults.defaultSelections,
    globalTrending: {
      defaultTrendCount: settings.globalTrending?.defaultTrendCount ?? defaults.globalTrending.defaultTrendCount,
      enableByDefault: settings.globalTrending?.enableByDefault ?? defaults.globalTrending.enableByDefault,
    },
    ui: {
      showPanelHeaders: settings.ui?.showPanelHeaders ?? defaults.ui.showPanelHeaders,
      showLabIndices: settings.ui?.showLabIndices ?? defaults.ui.showLabIndices,
      compactMode: settings.ui?.compactMode ?? defaults.ui.compactMode,
    },
  };
}

/**
 * Get trending preference for a specific lab test
 */
export function getLabTrendingPreference(settings: LabSettings, testName: string): LabTrendingPreference {
  if (!settings || !testName || typeof testName !== 'string') {
    throw new Error('Invalid parameters for getLabTrendingPreference');
  }
  
  if (!Array.isArray(settings.trendingPreferences)) {
    console.warn('trendingPreferences is not an array, using defaults');
    return {
      testName,
      defaultTrendCount: settings.globalTrending?.defaultTrendCount ?? 2,
      enableTrending: settings.globalTrending?.enableByDefault ?? true,
    };
  }
  
  const existing = settings.trendingPreferences.find(p => 
    p && p.testName && typeof p.testName === 'string' &&
    p.testName.toLowerCase() === testName.toLowerCase()
  );
  
  if (existing) {
    return {
      testName: existing.testName,
      defaultTrendCount: Math.max(0, Math.min(10, existing.defaultTrendCount ?? 2)),
      enableTrending: existing.enableTrending ?? true,
    };
  }
  
  // Return global default
  return {
    testName,
    defaultTrendCount: Math.max(0, Math.min(10, settings.globalTrending?.defaultTrendCount ?? 2)),
    enableTrending: settings.globalTrending?.enableByDefault ?? true,
  };
}

/**
 * Update trending preference for a specific lab test
 */
export function updateLabTrendingPreference(
  settings: LabSettings, 
  testName: string, 
  preference: Partial<LabTrendingPreference>
): LabSettings {
  if (!settings || !testName || typeof testName !== 'string' || testName.trim().length === 0) {
    throw new Error('Invalid parameters for updateLabTrendingPreference');
  }
  
  if (!preference || typeof preference !== 'object') {
    throw new Error('Invalid preference object');
  }
  
  const updated = { ...settings };
  
  // Ensure trendingPreferences array exists
  if (!Array.isArray(updated.trendingPreferences)) {
    updated.trendingPreferences = [];
  }
  
  const existingIndex = updated.trendingPreferences.findIndex(p => 
    p && p.testName && typeof p.testName === 'string' &&
    p.testName.toLowerCase() === testName.toLowerCase()
  );
  
  // Validate and clamp values
  const defaultTrendCount = typeof preference.defaultTrendCount === 'number' 
    ? Math.max(0, Math.min(10, Math.floor(preference.defaultTrendCount)))
    : settings.globalTrending?.defaultTrendCount ?? 2;
  
  const enableTrending = typeof preference.enableTrending === 'boolean'
    ? preference.enableTrending
    : settings.globalTrending?.enableByDefault ?? true;
  
  const newPreference: LabTrendingPreference = {
    testName: testName.trim(),
    defaultTrendCount,
    enableTrending,
  };
  
  if (existingIndex >= 0) {
    updated.trendingPreferences[existingIndex] = newPreference;
  } else {
    updated.trendingPreferences.push(newPreference);
  }
  
  return updated;
}

/**
 * Get custom lab order for a specific panel
 */
export function getPanelLabOrder(settings: LabSettings, panelName: string): string[] {
  // Don't throw errors from UI-facing functions - return safe defaults instead
  if (!settings || typeof settings !== 'object') {
    console.warn('Invalid settings object provided to getPanelLabOrder');
    return [];
  }
  
  if (!panelName || typeof panelName !== 'string' || panelName.trim().length === 0) {
    console.warn('Invalid panel name provided to getPanelLabOrder:', panelName);
    return [];
  }
  
  if (!Array.isArray(settings.panelLabOrders)) {
    console.warn('panelLabOrders is not an array, returning empty order');
    return [];
  }
  
  const normalizedPanelName = panelName.trim().toLowerCase();
  
  try {
    const panelOrder = settings.panelLabOrders.find(p => 
      p && 
      typeof p === 'object' &&
      p.panelName && 
      typeof p.panelName === 'string' &&
      p.panelName.trim().toLowerCase() === normalizedPanelName
    );
    
    if (!panelOrder) {
      return []; // No custom order configured for this panel
    }
    
    if (!Array.isArray(panelOrder.orderedLabNames)) {
      console.warn('orderedLabNames is not an array for panel:', panelName);
      return [];
    }
    
    const cleanList = panelOrder.orderedLabNames
      .filter(name => name && typeof name === 'string' && name.trim().length > 0)
      .map(name => name.trim());

    // Remove duplicates and limit to the canonical list only
    const unique = Array.from(new Set(cleanList));
    return unique.filter(name => CANONICAL_LABS.includes(name as any));
  } catch (error) {
    console.error('Error in getPanelLabOrder:', error);
    return [];
  }
}

/**
 * Update lab order for a specific panel
 */
export function updatePanelLabOrder(
  settings: LabSettings, 
  panelName: string, 
  orderedLabNames: string[]
): LabSettings {
  // Validate inputs but don't throw - return safe defaults
  if (!settings || typeof settings !== 'object') {
    console.error('Invalid settings object provided to updatePanelLabOrder');
    return settings || getDefaultSettings();
  }
  
  if (!panelName || typeof panelName !== 'string' || panelName.trim().length === 0) {
    console.error('Invalid panel name provided to updatePanelLabOrder:', panelName);
    return settings;
  }
  
  if (!Array.isArray(orderedLabNames)) {
    console.error('orderedLabNames must be an array, received:', typeof orderedLabNames, orderedLabNames);
    return settings;
  }
  
  const updated = { ...settings };
  
  // Ensure panelLabOrders array exists
  if (!Array.isArray(updated.panelLabOrders)) {
    updated.panelLabOrders = [];
  }
  
  const existingIndex = updated.panelLabOrders.findIndex(p => 
    p && p.panelName && typeof p.panelName === 'string' &&
    p.panelName.toLowerCase() === panelName.toLowerCase()
  );
  
  // Filter and validate lab names
  const validLabNames = orderedLabNames
    .filter(name => name && typeof name === 'string' && name.trim().length > 0)
    .map(name => name.trim());
  
  const newOrder: PanelLabOrder = {
    panelName: panelName.trim(),
    orderedLabNames: validLabNames,
  };
  
  if (existingIndex >= 0) {
    updated.panelLabOrders[existingIndex] = newOrder;
  } else {
    updated.panelLabOrders.push(newOrder);
  }
  
  return updated;
}

/**
 * Get default lab selections for a specific panel
 */
export function getPanelDefaultSelections(settings: LabSettings, panelName: string): string[] {
  // Don't throw errors from UI-facing functions - return safe defaults instead
  if (!settings || typeof settings !== 'object') {
    console.warn('Invalid settings object provided to getPanelDefaultSelections');
    return [];
  }
  
  if (!panelName || typeof panelName !== 'string' || panelName.trim().length === 0) {
    console.warn('Invalid panel name provided to getPanelDefaultSelections:', panelName);
    return [];
  }
  
  if (!Array.isArray(settings.defaultSelections)) {
    console.warn('defaultSelections is not an array, returning empty selections');
    return [];
  }
  
  const normalizedPanelName = panelName.trim().toLowerCase();
  
  try {
    const panelSelection = settings.defaultSelections.find(p => 
      p && 
      typeof p === 'object' &&
      p.panelName && 
      typeof p.panelName === 'string' &&
      p.panelName.trim().toLowerCase() === normalizedPanelName
    );
    
    if (!panelSelection || !Array.isArray(panelSelection.defaultSelectedLabs)) {
      return [];
    }
    
    // Filter out invalid lab names and normalize
    return panelSelection.defaultSelectedLabs
      .filter(name => name && typeof name === 'string' && name.trim().length > 0)
      .map(name => name.trim());
  } catch (error) {
    console.error('Error in getPanelDefaultSelections:', error);
    return [];
  }
}

/**
 * Update default lab selections for a specific panel
 */
export function updatePanelDefaultSelections(
  settings: LabSettings, 
  panelName: string, 
  defaultSelectedLabs: string[]
): LabSettings {
  if (!settings || !panelName || typeof panelName !== 'string' || panelName.trim().length === 0) {
    throw new Error('Invalid parameters for updatePanelDefaultSelections');
  }
  
  if (!Array.isArray(defaultSelectedLabs)) {
    throw new Error('defaultSelectedLabs must be an array');
  }
  
  const updated = { ...settings };
  
  // Ensure defaultSelections array exists
  if (!Array.isArray(updated.defaultSelections)) {
    updated.defaultSelections = [];
  }
  
  const existingIndex = updated.defaultSelections.findIndex(p => 
    p && p.panelName && typeof p.panelName === 'string' &&
    p.panelName.toLowerCase() === panelName.toLowerCase()
  );
  
  // Filter and validate lab names
  const validSelectedLabs = defaultSelectedLabs
    .filter(name => name && typeof name === 'string' && name.trim().length > 0)
    .map(name => name.trim());
  
  const newSelection: LabDefaultSelection = {
    panelName: panelName.trim(),
    defaultSelectedLabs: validSelectedLabs,
  };
  
  if (existingIndex >= 0) {
    updated.defaultSelections[existingIndex] = newSelection;
  } else {
    updated.defaultSelections.push(newSelection);
  }
  
  return updated;
}

/**
 * Reset settings to defaults
 */
export function resetLabSettings(): LabSettings {
  const defaults = getDefaultSettings();
  saveLabSettings(defaults);
  return defaults;
}

/**
 * Export settings as JSON for backup/sharing
 */
export function exportLabSettings(settings: LabSettings): string {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Invalid settings object');
  }
  
  try {
    // Validate settings before export
    const validatedSettings = validateAndFillSettings(settings);
    const jsonString = JSON.stringify(validatedSettings, null, 2);
    
    if (!jsonString || jsonString.trim().length === 0) {
      throw new Error('Failed to serialize settings');
    }
    
    return jsonString;
  } catch (error) {
    console.error('Error exporting lab settings:', error);
    throw new Error('Failed to export settings');
  }
}

/**
 * Import settings from JSON
 */
export function importLabSettings(jsonString: string): LabSettings {
  if (!jsonString || typeof jsonString !== 'string' || jsonString.trim().length === 0) {
    throw new Error('Invalid JSON string');
  }
  
  if (jsonString.length > 1024 * 1024) { // 1MB limit
    throw new Error('Settings file too large');
  }
  
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid JSON structure');
    }
    
    const validated = validateAndFillSettings(parsed as LabSettings);
    saveLabSettings(validated);
    return validated;
  } catch (error) {
    console.error('Error importing lab settings:', error);
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw new Error('Invalid settings format');
  }
}