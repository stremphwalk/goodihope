/**
 * Comprehensive backward compatibility tests for lab settings
 * This file contains test cases to ensure older settings versions still work
 */

import { loadLabSettings, resetLabSettings } from './labSettings';

// Mock localStorage for testing
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage.store[key] = value; },
  clear: () => { mockLocalStorage.store = {}; }
};

Object.defineProperty(global, 'localStorage', { value: mockLocalStorage });

describe('Lab Settings Backward Compatibility', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    console.log = jest.fn(); // Mock console.log
    console.warn = jest.fn(); // Mock console.warn
    console.error = jest.fn(); // Mock console.error
  });

  it('should handle completely missing settings', () => {
    const settings = loadLabSettings();
    
    expect(settings.version).toBe(1);
    expect(Array.isArray(settings.panelOrder)).toBe(true);
    expect(Array.isArray(settings.panelLabOrders)).toBe(true);
    expect(Array.isArray(settings.trendingPreferences)).toBe(true);
    expect(Array.isArray(settings.defaultSelections)).toBe(true);
    expect(typeof settings.globalTrending).toBe('object');
    expect(typeof settings.ui).toBe('object');
  });

  it('should handle version 0 settings', () => {
    // Simulate old version 0 settings
    const oldSettings = {
      panelOrder: ['CBC', 'Chemistry'],
      panelLabOrders: [],
      trendingPreferences: []
      // Missing version, defaultSelections, globalTrending, ui
    };
    
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(oldSettings));
    
    const settings = loadLabSettings();
    
    expect(settings.version).toBe(1);
    expect(settings.panelOrder).toEqual(['CBC', 'Chemistry']);
    expect(Array.isArray(settings.defaultSelections)).toBe(true);
    expect(typeof settings.globalTrending).toBe('object');
    expect(typeof settings.ui).toBe('object');
  });

  it('should handle corrupted settings', () => {
    mockLocalStorage.setItem('lab_settings_v1', 'invalid json');
    
    const settings = loadLabSettings();
    
    expect(settings.version).toBe(1);
    expect(Array.isArray(settings.panelOrder)).toBe(true);
  });

  it('should handle null/undefined arrays', () => {
    const corruptedSettings = {
      version: 0,
      panelOrder: null,
      panelLabOrders: undefined,
      trendingPreferences: 'invalid',
      globalTrending: null,
      ui: undefined
    };
    
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(corruptedSettings));
    
    const settings = loadLabSettings();
    
    expect(settings.version).toBe(1);
    expect(Array.isArray(settings.panelOrder)).toBe(true);
    expect(Array.isArray(settings.panelLabOrders)).toBe(true);
    expect(Array.isArray(settings.trendingPreferences)).toBe(true);
    expect(typeof settings.globalTrending).toBe('object');
    expect(typeof settings.ui).toBe('object');
  });

  it('should preserve valid settings during migration', () => {
    const oldValidSettings = {
      version: 0,
      panelOrder: ['Custom', 'Order'],
      panelLabOrders: [{ panelName: 'Custom', orderedLabNames: ['Test1', 'Test2'] }],
      trendingPreferences: [{ testName: 'Hb', defaultTrendCount: 3, enableTrending: true }]
    };
    
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(oldValidSettings));
    
    const settings = loadLabSettings();
    
    expect(settings.version).toBe(1);
    expect(settings.panelOrder).toEqual(['Custom', 'Order']);
    expect(settings.panelLabOrders[0].panelName).toBe('Custom');
    expect(settings.trendingPreferences[0].testName).toBe('Hb');
  });

  it('should handle invalid globalTrending values', () => {
    const invalidSettings = {
      version: 0,
      panelOrder: ['CBC'],
      panelLabOrders: [],
      trendingPreferences: [],
      globalTrending: {
        defaultTrendCount: -5, // Invalid
        enableByDefault: 'not_boolean' // Invalid
      }
    };
    
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(invalidSettings));
    
    const settings = loadLabSettings();
    
    expect(settings.globalTrending.defaultTrendCount).toBeGreaterThanOrEqual(0);
    expect(settings.globalTrending.defaultTrendCount).toBeLessThanOrEqual(10);
    expect(typeof settings.globalTrending.enableByDefault).toBe('boolean');
  });

  it('should handle settings with excessive defaultTrendCount', () => {
    const invalidSettings = {
      version: 0,
      panelOrder: ['CBC'],
      panelLabOrders: [],
      trendingPreferences: [],
      globalTrending: {
        defaultTrendCount: 999, // Too high
        enableByDefault: true
      }
    };
    
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(invalidSettings));
    
    const settings = loadLabSettings();
    
    expect(settings.globalTrending.defaultTrendCount).toBeLessThanOrEqual(10);
  });

  it('should handle future version settings gracefully', () => {
    const futureSettings = {
      version: 999, // Future version
      panelOrder: ['CBC'],
      panelLabOrders: [],
      trendingPreferences: [],
      defaultSelections: [],
      globalTrending: { defaultTrendCount: 2, enableByDefault: true },
      ui: { showPanelHeaders: true, showLabIndices: true, compactMode: false },
      futureFeature: 'some_future_data' // Future feature
    };
    
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(futureSettings));
    
    const settings = loadLabSettings();
    
    // Should preserve current version (future versions are kept as-is for forward compatibility)
    expect(settings.version).toBe(999);
    expect(settings.panelOrder).toEqual(['CBC']);
  });
});

// Export test utilities for use in other test files
export const TestUtils = {
  createMockSettings: (overrides: Partial<any> = {}) => ({
    version: 1,
    panelOrder: ['CBC', 'Chemistry'],
    panelLabOrders: [],
    trendingPreferences: [],
    defaultSelections: [],
    globalTrending: { defaultTrendCount: 2, enableByDefault: true },
    ui: { showPanelHeaders: true, showLabIndices: true, compactMode: false },
    ...overrides
  }),
  
  mockLocalStorageWithSettings: (settings: any) => {
    mockLocalStorage.setItem('lab_settings_v1', JSON.stringify(settings));
  }
};