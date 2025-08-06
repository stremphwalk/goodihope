// FINAL, DEFINITIVE, AND CORRECTED CODE for client/src/lib/labUtils.ts

import type { LabSettings } from './labSettings';
import { getPanelLabOrder } from './labSettings';
import { getChemistrySubCategory } from './labCategorizer';

export interface LabValue {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  category: string;
  timestamp?: string; 
}

export interface ProcessedLabValue {
  testName: string;
  category: string;
  mostRecent: LabValue;
  trending: LabValue[]; // All available trending values
  allTrendingValues: LabValue[]; // Complete historical dataset for user adjustment
  showTrending: boolean;
  trendCount: number; // Currently displayed count (user can adjust)
  maxTrendCount: number; // Maximum available trending values
  showInNote: boolean;
}

const CATEGORY_ORDER: { [key: string]: number } = {
  'CBC': 1,
  'Coagulation': 2,
  'Inflammatory': 3,
  'Chemistry': 4,
  'Blood gas': 5,
  'Cardiac': 6,
  'General': 99,
};

const LAB_ABBREVIATIONS: { [key: string]: string } = {
  'Hémoglobine': 'Hb',
  'Hématocrite': 'Hct',
  'Plaquettes': 'Plt',
  'Sodium': 'Na',
  'Potassium': 'K',
  'Chlore': 'Cl',
  'Créatinine': 'Creat',
  'Protéine C réactive': 'CRP',
  'Triglycérides': 'TG',
  'Cholestérol': 'Chol',
  'Fibrinogène': 'Fibrinogen',
  'Protéines totales': 'Total Protein',
  'Leucocytes': 'WBC',
  'Érythrocytes': 'RBC',
  'Neutrophiles': 'Neutrophils',
  'Albumine': 'Albumin',
  'Magnésium': 'Mg',
  'Insuline': 'Insulin'
};

// Bidirectional lab name mapping for matching settings to parsed text
const LAB_NAME_MAPPINGS: { [key: string]: string[] } = {
  // Coagulation - key mappings for the discrepancies you mentioned
  'INR': ['RNI', 'INR'],
  'RNI': ['INR', 'RNI'], 
  'PTT': ['TTPA', 'PTT', 'APTT'],
  'TTPA': ['PTT', 'TTPA', 'APTT'],
  'PT': ['TP', 'PT'],
  'TP': ['PT', 'TP'],
  
  // Chemistry - sodium/potassium mappings
  'Na': ['Sodium', 'Na'],
  'Sodium': ['Na', 'Sodium'],
  'K': ['Potassium', 'K'], 
  'Potassium': ['K', 'Potassium'],
  'Creatinine': ['Créatinine', 'Creat', 'Creatinine'],
  'Créatinine': ['Creatinine', 'Creat', 'Créatinine'],
  'Creat': ['Créatinine', 'Creatinine', 'Creat'],
  
  // CBC mappings
  'Hb': ['Hémoglobine', 'Hemoglobin', 'Hb', 'HGB'],
  'Hémoglobine': ['Hb', 'Hemoglobin', 'Hémoglobine'],
  'Hct': ['Hématocrite', 'Hematocrit', 'Hct'],
  'Hématocrite': ['Hct', 'Hematocrit', 'Hématocrite'],
  'WBC': ['Leucocytes', 'GB', 'WBC'],
  'Leucocytes': ['WBC', 'GB', 'Leucocytes'],
  'RBC': ['Érythrocytes', 'GR', 'RBC'],
  'Érythrocytes': ['RBC', 'GR', 'Érythrocytes'],
  'Plt': ['Plaquettes', 'Platelets', 'Plt'],
  'Plaquettes': ['Plt', 'Platelets', 'Plaquettes'],
  
  // Other common mappings
  'CRP': ['Protéine C réactive', 'C-reactive protein', 'CRP'],
  'Protéine C réactive': ['CRP', 'C-reactive protein', 'Protéine C réactive'],
  'Cholesterol': ['Cholestérol', 'Cholesterol', 'Chol'],
  'Cholestérol': ['Cholesterol', 'Chol', 'Cholestérol'],
  'Albumin': ['Albumine', 'Albumin', 'Alb'],
  'Albumine': ['Albumin', 'Alb', 'Albumine']
};

/**
 * Check if two lab names are equivalent using bidirectional mapping
 * This handles French/English variations and abbreviations
 */
function labNamesMatch(name1: string, name2: string): boolean {
  if (!name1 || !name2 || typeof name1 !== 'string' || typeof name2 !== 'string') {
    return false;
  }
  
  const normalized1 = name1.toLowerCase().trim();
  const normalized2 = name2.toLowerCase().trim();
  
  // Direct match
  if (normalized1 === normalized2) {
    return true;
  }
  
  // Check if name1 maps to name2 or vice versa
  const mappings1 = LAB_NAME_MAPPINGS[name1] || LAB_NAME_MAPPINGS[normalized1];
  const mappings2 = LAB_NAME_MAPPINGS[name2] || LAB_NAME_MAPPINGS[normalized2];
  
  if (mappings1 && mappings1.some(mapped => mapped.toLowerCase() === normalized2)) {
    return true;
  }
  
  if (mappings2 && mappings2.some(mapped => mapped.toLowerCase() === normalized1)) {
    return true;
  }
  
  // Check if both names exist in the same mapping array
  for (const [key, variants] of Object.entries(LAB_NAME_MAPPINGS)) {
    const normalizedVariants = variants.map(v => v.toLowerCase());
    if (normalizedVariants.includes(normalized1) && normalizedVariants.includes(normalized2)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get current system date in YYMMDD format for intelligent date comparison
 */
function getCurrentDateYYMMDD(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2); // Last 2 digits
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const result = `${year}${month}${day}`;
  console.log(`Current system date: ${now.toISOString().split('T')[0]} -> YYMMDD: ${result}`);
  return result;
}

/**
 * Check if a timestamp is in the future relative to current date
 */
function isFutureDate(timestamp: string): boolean {
  if (!timestamp || timestamp.length !== 6) return false;
  const currentYYMMDD = getCurrentDateYYMMDD();
  return timestamp > currentYYMMDD;
}

/**
 * Validate if a date is actually valid (handles edge cases like Feb 30)
 */
function isValidDate(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * A robust function to parse 'YYMMDD HHMM' timestamps into valid Date objects.
 * This is the key to accurate chronological sorting.
 */
export function parseLabTimestamp(timestamp?: string): Date {
  if (!timestamp) return new Date(0); 

  const parts = timestamp.trim().split(' ');
  const datePart = parts[0];

  if (datePart && datePart.length === 6 && /^\d+$/.test(datePart)) {
    const year = parseInt(datePart.substring(0, 2), 10);
    const month = parseInt(datePart.substring(2, 4), 10);
    const day = parseInt(datePart.substring(4, 6), 10);

    // Validate month and day ranges
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      console.warn(`Invalid date components for timestamp ${timestamp}: year=${year}, month=${month}, day=${day}`);
      return new Date(0);
    }

    // Future-proof year determination:
    // For medical records, assume 2-digit years:
    // 00-30 = 2000-2030 (future)
    // 31-99 = 1931-1999 (past) - for historical medical records
    const fullYear = year <= 30 ? 2000 + year : 1900 + year;

    // Validate actual date exists (handles Feb 29 on non-leap years, etc.)
    if (!isValidDate(fullYear, month, day)) {
      console.warn(`Invalid date for timestamp ${timestamp}: ${fullYear}-${month}-${day} does not exist`);
      return new Date(0);
    }

    let hour = 0;
    let minute = 0;

    if (parts.length > 1 && parts[1].length === 4 && /^\d+$/.test(parts[1])) {
      const timePart = parts[1];
      hour = parseInt(timePart.substring(0, 2), 10);
      minute = parseInt(timePart.substring(2, 4), 10);
      
      // Validate time components
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        console.warn(`Invalid time components for timestamp ${timestamp}: ${hour}:${minute}`);
        hour = 0;
        minute = 0;
      }
    }

    const result = new Date(fullYear, month - 1, day, hour, minute);
    
    // Final validation - ensure the date object is valid
    if (isNaN(result.getTime())) {
      console.warn(`Failed to create valid date for timestamp ${timestamp}`);
      return new Date(0);
    }
    
    return result;
  }

  // Try to parse as standard date string
  const parsedDate = Date.parse(timestamp);
  if (!isNaN(parsedDate)) {
    return new Date(parsedDate);
  }

  return new Date(0); 
}

/**
 * This function uses the robust date-sorting logic to guarantee chronological order.
 */
// Cache current date to avoid repeated calls
let cachedCurrentDate: string | null = null;
let cacheTimestamp = 0;

function getCachedCurrentDateYYMMDD(): string {
  const now = Date.now();
  // Cache for 1 minute to avoid repeated calculations
  if (!cachedCurrentDate || now - cacheTimestamp > 60000) {
    cachedCurrentDate = getCurrentDateYYMMDD();
    cacheTimestamp = now;
  }
  return cachedCurrentDate;
}

export function processLabValues(labValues: LabValue[], userSettings?: LabSettings): ProcessedLabValue[] {
  // Input validation
  if (!labValues || !Array.isArray(labValues)) {
    console.warn('processLabValues: Invalid input - expected array of LabValue');
    return [];
  }
  
  // Get current date for intelligent comparison
  const currentYYMMDD = getCachedCurrentDateYYMMDD();
  console.log(`Current system date (YYMMDD): ${currentYYMMDD}`);

  // First, filter out any invalid lab values
  const validLabs = labValues.filter(lab => {
    // Check for null/undefined lab object
    if (!lab || typeof lab !== 'object') {
      console.warn('processLabValues: Invalid lab object found:', lab);
      return false;
    }
    
    // Check for valid test name
    if (!lab.testName || typeof lab.testName !== 'string' || lab.testName.trim() === '') {
      console.warn('processLabValues: Lab missing valid testName:', lab);
      return false;
    }
    
    // Check for valid value (allow '0', 'negative', etc.)
    if (!lab.value || typeof lab.value !== 'string') {
      console.warn('processLabValues: Lab missing valid value:', lab);
      return false;
    }
    
    const trimmedValue = lab.value.trim();
    // Filter out completely empty values or just '>' (incomplete values)
    if (trimmedValue === '' || trimmedValue === '>') {
      console.warn('processLabValues: Lab has empty or incomplete value:', lab);
      return false;
    }
    
    // Check for valid category
    if (!lab.category || typeof lab.category !== 'string' || lab.category.trim() === '') {
      console.warn('processLabValues: Lab missing valid category:', lab);
      return false;
    }
    
    return true;
  });

  if (validLabs.length === 0) {
    return [];
  }

  // Defensive logging for missing or unparseable timestamps
  validLabs.forEach(lab => {
    if (!lab.timestamp) {
      console.warn(`Lab value missing timestamp:`, lab);
    } else if (parseLabTimestamp(lab.timestamp).getTime() === 0) {
      console.warn(`Lab value has unparseable timestamp:`, lab);
    }
  });

  // Parse all timestamps and find the actual date range in the data
  const parsedDates = validLabs
    .map(lab => ({ 
      lab, 
      date: parseLabTimestamp(lab.timestamp),
      timestamp: lab.timestamp,
      isFuture: isFutureDate(lab.timestamp || '')
    }))
    .filter(item => item.date.getTime() > 0); // Filter out invalid dates

  if (parsedDates.length === 0) {
    return [];
  }

  // Log date analysis for debugging
  const sortedForAnalysis = [...parsedDates].sort((a, b) => b.date.getTime() - a.date.getTime());
  console.log('Date analysis:', {
    currentDate: currentYYMMDD,
    allDates: sortedForAnalysis.slice(0, 5).map(item => ({
      timestamp: item.timestamp,
      date: item.date.toISOString().split('T')[0],
      isFuture: item.isFuture,
      value: item.lab.value,
      testName: item.lab.testName
    }))
  });

  // Sort by actual parsed dates to find chronological order
  parsedDates.sort((a, b) => b.date.getTime() - a.date.getTime());

  // Group by test name
  const groupedByTest = new Map<string, LabValue[]>();

  validLabs.forEach(lab => {
    const key = lab.testName.toLowerCase().trim();
    if (!groupedByTest.has(key)) {
      groupedByTest.set(key, []);
    }
    groupedByTest.get(key)!.push(lab);
  });

  const processed: ProcessedLabValue[] = [];

  groupedByTest.forEach((values, testKey) => {
    // Sort each test's values by actual chronological order
    const labsWithDates = values
      .map(lab => ({ 
        lab, 
        date: parseLabTimestamp(lab.timestamp), 
        timestamp: lab.timestamp,
        isFuture: isFutureDate(lab.timestamp || ''),
        dayDiff: Math.abs(parseInt(lab.timestamp?.substring(0,6) || '0') - parseInt(currentYYMMDD))
      }))
      .filter(item => item.date.getTime() > 0);

    // Fallback: if all dates are invalid, use row order (last = most recent)
    let sortedByDate: LabValue[];
    if (labsWithDates.length === 0) {
      console.warn(`All timestamps missing or unparseable for test '${testKey}'. Using row order as fallback.`);
      sortedByDate = values.slice().reverse(); // last = most recent
    } else {
    // Sort by date (newest first), but prefer non-future dates if available
      sortedByDate = labsWithDates
      .sort((a, b) => {
        if (a.isFuture && !b.isFuture) return 1;
        if (!a.isFuture && b.isFuture) return -1;
        return b.date.getTime() - a.date.getTime();
      })
      .map(item => item.lab);
    }

    // Debug logging for first few tests to verify correct selection
    if (processed.length < 3) {
      console.log(`${testKey} analysis:`, {
        currentDate: currentYYMMDD,
        dates: labsWithDates.map(item => ({
          timestamp: item.timestamp,
          date: item.date.toISOString().split('T')[0],
          value: item.lab.value,
          isFuture: item.isFuture,
          dayDiff: item.dayDiff
        })),
        selectedMostRecent: {
          timestamp: sortedByDate[0].timestamp,
          value: sortedByDate[0].value,
          date: parseLabTimestamp(sortedByDate[0].timestamp).toISOString().split('T')[0]
        }
      });
    }

    const mostRecent = sortedByDate[0]; 
    const trendingValues = sortedByDate.slice(1); // Include ALL historical values, not just limited count
    const hasTrending = trendingValues.length > 0;
    
    // Apply user trending preferences if available - default to showing trending
    let showTrending = hasTrending; // Show trending if data is available
    let trendCount = hasTrending ? Math.min(3, trendingValues.length) : 0; // Default to 3 trending values (but all are available)
    
    if (userSettings && typeof userSettings === 'object') {
      try {
        // Check for specific test preference first
        let testPreference = null;
        if (Array.isArray(userSettings.trendingPreferences)) {
          testPreference = userSettings.trendingPreferences.find(p => 
            p && p.testName && typeof p.testName === 'string' &&
            p.testName.toLowerCase() === mostRecent.testName.toLowerCase()
          );
        }
        
        if (testPreference) {
          showTrending = Boolean(testPreference.enableTrending) && hasTrending;
          const prefTrendCount = typeof testPreference.defaultTrendCount === 'number' ? testPreference.defaultTrendCount : 0;
          trendCount = showTrending ? Math.min(Math.max(0, prefTrendCount), trendingValues.length) : 0;
        } else if (userSettings.globalTrending && typeof userSettings.globalTrending === 'object') {
          // Use global defaults
          showTrending = Boolean(userSettings.globalTrending.enableByDefault) && hasTrending;
          const globalTrendCount = typeof userSettings.globalTrending.defaultTrendCount === 'number' ? userSettings.globalTrending.defaultTrendCount : 2;
          trendCount = showTrending ? Math.min(Math.max(0, globalTrendCount), trendingValues.length) : 0;
        }
      } catch (error) {
        console.error('Error applying user trending preferences:', error);
      }
    }
    
    // Check if this lab should be shown in note based on user lab order settings
    // Labs are included in notes based on whether they exist in the user's lab order for this panel
    let shouldShowInNote = true; // Default to showing
    
    if (userSettings && typeof userSettings === 'object') {
      try {
        // Check if user has a custom lab order for this panel
        const panelLabOrder = getPanelLabOrder(userSettings, mostRecent.category);
        
        // Validate that the returned lab order is a proper array
        if (!Array.isArray(panelLabOrder)) {
          console.warn('getPanelLabOrder returned non-array:', panelLabOrder, 'for category:', mostRecent.category);
          shouldShowInNote = true; // Default to showing if invalid order
        } else if (panelLabOrder.length > 0) {
          // If user has configured a lab order, only include labs that are in their list
          const normalizedTestName = mostRecent.testName?.toLowerCase().trim();
          if (!normalizedTestName) {
            console.warn('mostRecent.testName is null or invalid:', mostRecent);
            shouldShowInNote = false; // Skip invalid test names
          } else {
            shouldShowInNote = panelLabOrder.some(labName => {
              if (!labName || typeof labName !== 'string') {
                console.warn('Invalid lab name in panelLabOrder:', labName);
                return false;
              }
              // Use enhanced matching to handle French/English variations
              return labNamesMatch(labName, mostRecent.testName);
            });
          }
        }
        // If panelLabOrder is empty array (length === 0), show all labs (default behavior)
        // If no custom lab order (length === 0), show all labs
      } catch (settingsError) {
        console.warn('Error checking lab order settings:', settingsError);
        shouldShowInNote = true; // Default to showing if settings check fails
      }
    }
    
    processed.push({
      testName: mostRecent.testName,
      category: mostRecent.category,
      mostRecent: mostRecent,
      trending: trendingValues.slice(0, trendCount), // Currently displayed trending values based on user preference
      allTrendingValues: trendingValues, // All available historical values for user adjustment
      showTrending: showTrending, // Show trending as configured
      trendCount: trendCount, // Use configured trend count
      maxTrendCount: trendingValues.length, // Maximum available trending values
      showInNote: shouldShowInNote,
    });
  });

  return processed.sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category] || 99;
    const orderB = CATEGORY_ORDER[b.category] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    
    // For Chemistry category, sort by clinical sub-groups
    if (a.category === 'Chemistry' && b.category === 'Chemistry') {
      const subCategoryA = getChemistrySubCategory(a.testName);
      const subCategoryB = getChemistrySubCategory(b.testName);
      
      // Define clinical order: Renal -> Liver -> Metabolic -> Other
      const subCategoryOrder = { 'Renal': 1, 'Liver': 2, 'Metabolic': 3 };
      const orderSubA = subCategoryOrder[subCategoryA as keyof typeof subCategoryOrder] || 4;
      const orderSubB = subCategoryOrder[subCategoryB as keyof typeof subCategoryOrder] || 4;
      
      if (orderSubA !== orderSubB) {
        return orderSubA - orderSubB;
      }
      
      // Within same sub-category, sort by canonical order (as defined in CANONICAL_LABS)
      const canonicalOrder = ['NA', 'K', 'Cl', 'Créat', 'Urée', 'DFG ca', 'ALT', 'GGT', 'BILIT', 'P alc', 'LDH', 'Gluc', 'Ca', 'Mg', 'PHOSP', 'Alb'];
      const indexA = canonicalOrder.indexOf(a.testName);
      const indexB = canonicalOrder.indexOf(b.testName);
      
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    
    return a.testName.localeCompare(b.testName);
  });
}

export function formatLabValuesForNote(
  processedLabs: ProcessedLabValue[],
  userSettings?: LabSettings
): string {
  if (!Array.isArray(processedLabs) || processedLabs.length === 0) return '';

  // Map category -> array of { testName, line }
  const grouped = new Map<string, { testName: string; line: string }[]>();

  for (const lab of processedLabs) {
    if (!lab || !lab.showInNote) continue;
    if (!lab.testName || !lab.category || !lab.mostRecent?.value) continue;

    const canonicalName = LAB_ABBREVIATIONS[lab.testName] || lab.testName;
    let line = `${canonicalName} ${lab.mostRecent.value}`;
    if (lab.showTrending && lab.trendCount > 0 && Array.isArray(lab.trending) && lab.trending.length > 0) {
      const trendingValues = lab.trending
        .slice(0, lab.trendCount)
        .filter(v => v && v.value)
        .map(v => v.value);
      if (trendingValues.length > 0) {
        line += ` (${trendingValues.join(', ')})`;
      }
    }

    if (!grouped.has(lab.category)) grouped.set(lab.category, []);
    grouped.get(lab.category)!.push({ testName: lab.testName, line });
  }

  if (grouped.size === 0) return '';

  // Determine category order
  const presentCategories = Array.from(grouped.keys());
  let orderedCategories: string[] = [];
  if (userSettings && Array.isArray(userSettings.panelOrder) && userSettings.panelOrder.length > 0) {
    const validPanelOrder = userSettings.panelOrder.filter(c => presentCategories.includes(c));
    const remaining = presentCategories.filter(c => !validPanelOrder.includes(c));
    orderedCategories = [...validPanelOrder, ...remaining];
  } else {
    orderedCategories = presentCategories.sort((a, b) => {
      const orderA = CATEGORY_ORDER[a] || 99;
      const orderB = CATEGORY_ORDER[b] || 99;
      return orderA - orderB;
    });
  }

  const finalLines: string[] = [];

  for (const category of orderedCategories) {
    const items = grouped.get(category)!;

    let orderedItems: { testName: string; line: string }[] = items;

    if (userSettings) {
      const customLabOrder = getPanelLabOrder(userSettings, category);
      if (customLabOrder && customLabOrder.length > 0) {
        const lowerMap = new Map<string, { testName: string; line: string }>();
        items.forEach(it => lowerMap.set(it.testName.toLowerCase(), it));
        orderedItems = [];
        customLabOrder.forEach(name => {
          const it = lowerMap.get(name.toLowerCase());
          if (it) orderedItems.push(it);
        });
        // Append any items not present in custom order
        items.forEach(it => {
          if (!orderedItems.includes(it)) orderedItems.push(it);
        });
      }
    }

    finalLines.push(...orderedItems.map(it => it.line));
  }

  return finalLines.join('\n');
}

export function updateLabTrending(
  processedLabs: ProcessedLabValue[],
  testName: string,
  change: 'increase' | 'decrease'
): ProcessedLabValue[] {
  if (!processedLabs || !Array.isArray(processedLabs)) {
    console.warn('updateLabTrending: Invalid processedLabs array');
    return [];
  }
  
  if (!testName || typeof testName !== 'string' || testName.trim().length === 0) {
    console.warn('updateLabTrending: Invalid testName');
    return processedLabs;
  }
  
  if (change !== 'increase' && change !== 'decrease') {
    console.warn('updateLabTrending: Invalid change parameter');
    return processedLabs;
  }
  
  return processedLabs.map(lab => {
    if (!lab || typeof lab !== 'object' || !lab.testName || typeof lab.testName !== 'string') {
      console.warn('updateLabTrending: Invalid lab object', lab);
      return lab;
    }
    
    if (labNamesMatch(lab.testName, testName)) {
      // Ensure trending array exists and is valid
      const trendingLength = Array.isArray(lab.trending) ? lab.trending.length : 0;
      let newCount = typeof lab.trendCount === 'number' ? lab.trendCount : 0;
      
      // Clamp current value
      newCount = Math.max(0, Math.min(newCount, trendingLength));
      
      if (change === 'increase') {
        newCount = Math.min(newCount + 1, trendingLength);
      } else {
        newCount = Math.max(newCount - 1, 0);
      }
      
      return {
        ...lab,
        trendCount: newCount,
        showTrending: newCount > 0, 
      };
    }
    return lab;
  });
}

export function toggleLabShowInNote(
  processedLabs: ProcessedLabValue[],
  testName: string
): ProcessedLabValue[] {
  if (!processedLabs || !Array.isArray(processedLabs)) {
    console.warn('toggleLabShowInNote: Invalid processedLabs array');
    return [];
  }
  
  if (!testName || typeof testName !== 'string' || testName.trim().length === 0) {
    console.warn('toggleLabShowInNote: Invalid testName');
    return processedLabs;
  }
  
  return processedLabs.map(lab => {
    if (!lab || typeof lab !== 'object' || !lab.testName || typeof lab.testName !== 'string') {
      console.warn('toggleLabShowInNote: Invalid lab object', lab);
      return lab;
    }
    
    if (labNamesMatch(lab.testName, testName)) {
      return {
        ...lab,
        showInNote: !lab.showInNote
      };
    }
    return lab; 
  });
}

export function moveLabUp(
  processedLabs: ProcessedLabValue[],
  testName: string
): ProcessedLabValue[] {
  if (!processedLabs || processedLabs.length === 0 || !testName) {
    return processedLabs;
  }
  
  const currentIndex = processedLabs.findIndex(lab => 
    labNamesMatch(lab.testName, testName)
  );
  
  if (currentIndex <= 0) return processedLabs;
  
  // Find the previous lab in the same category
  const currentLab = processedLabs[currentIndex];
  if (!currentLab || !currentLab.category) return processedLabs;
  
  let targetIndex = -1;
  
  for (let i = currentIndex - 1; i >= 0; i--) {
    const lab = processedLabs[i];
    if (lab && lab.category === currentLab.category) {
      targetIndex = i;
      break;
    }
  }
  
  if (targetIndex === -1) return processedLabs;
  
  const newOrder = [...processedLabs];
  [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
  
  return newOrder;
}

export function moveLabDown(
  processedLabs: ProcessedLabValue[],
  testName: string
): ProcessedLabValue[] {
  if (!processedLabs || processedLabs.length === 0 || !testName) {
    return processedLabs;
  }
  
  const currentIndex = processedLabs.findIndex(lab => 
    labNamesMatch(lab.testName, testName)
  );
  
  if (currentIndex === -1 || currentIndex >= processedLabs.length - 1) {
    return processedLabs;
  }
  
  // Find the next lab in the same category
  const currentLab = processedLabs[currentIndex];
  if (!currentLab || !currentLab.category) return processedLabs;
  
  let targetIndex = -1;
  
  for (let i = currentIndex + 1; i < processedLabs.length; i++) {
    const lab = processedLabs[i];
    if (lab && lab.category === currentLab.category) {
      targetIndex = i;
      break;
    }
  }
  
  if (targetIndex === -1) return processedLabs;
  
  const newOrder = [...processedLabs];
  [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
  
  return newOrder;
}
/**
 * Update the trending count for a specific lab test
 */
export function updateLabTrendingCount(labs: ProcessedLabValue[], testName: string, newTrendCount: number): ProcessedLabValue[] {
  return labs.map(lab => {
    if (lab.testName === testName) {
      const maxCount = lab.allTrendingValues?.length || 0;
      const validCount = Math.max(0, Math.min(newTrendCount, maxCount));
      
      return {
        ...lab,
        trendCount: validCount,
        trending: lab.allTrendingValues?.slice(0, validCount) || [],
        showTrending: validCount > 0
      };
    }
    return lab;
  });
}

