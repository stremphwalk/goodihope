// FINAL, DEFINITIVE, AND CORRECTED CODE for client/src/lib/labUtils.ts

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
  trending: LabValue[];
  showTrending: boolean;
  trendCount: number;
  showInNote: boolean;
}

const CATEGORY_ORDER: { [key: string]: number } = {
  'CBC': 1,
  'Hématologie': 1,
  'Coagulation': 2,
  'Chemistry': 3,
  'Biochimie': 3,
  'CRP': 4,
  'Lipids': 5,
  'Endocrinology': 6,
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
};

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

export function processLabValues(labValues: LabValue[]): ProcessedLabValue[] {
  // Input validation
  if (!labValues || !Array.isArray(labValues)) {
    console.warn('processLabValues: Invalid input - expected array of LabValue');
    return [];
  }
  
  // Get current date for intelligent comparison
  const currentYYMMDD = getCachedCurrentDateYYMMDD();
  console.log(`Current system date (YYMMDD): ${currentYYMMDD}`);

  // First, filter out any invalid lab values
  const validLabs = labValues.filter(lab => 
    lab.value && lab.value.trim() !== '' && 
    lab.value.trim() !== '>' && 
    lab.testName && lab.testName.trim() !== ''
  );

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
    const trendingValues = sortedByDate.slice(1);
    const hasTrending = trendingValues.length > 0;
    
    processed.push({
      testName: mostRecent.testName,
      category: mostRecent.category,
      mostRecent: mostRecent,
      trending: trendingValues,
      showTrending: hasTrending, // Auto-enable trending if there are multiple values
      trendCount: hasTrending ? trendingValues.length : 0, // Show all trending values by default
      showInNote: true,
    });
  });

  return processed.sort((a, b) => {
    const orderA = CATEGORY_ORDER[a.category] || 99;
    const orderB = CATEGORY_ORDER[b.category] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.testName.localeCompare(b.testName);
  });
}

// No changes needed to the functions below
export function formatLabValuesForNote(processedLabs: ProcessedLabValue[]): string {
  const groupedByCategory = new Map<string, string[]>();

  processedLabs.forEach(lab => {
    if (!lab.showInNote) return;
    const name = LAB_ABBREVIATIONS[lab.testName] || lab.testName;
    
    if (lab.showTrending && lab.trendCount > 0 && lab.trending && lab.trending.length > 0) {
      const principalValue = lab.mostRecent.value;
      const trendingValues = lab.trending
        .slice(0, lab.trendCount)
        .map(v => v.value);

      let line = `${name} ${principalValue}`;

      if (trendingValues.length > 0) {
        line += ` (${trendingValues.join(', ')})`;
      }

      if (!groupedByCategory.has(lab.category)) {
        groupedByCategory.set(lab.category, []);
      }
      groupedByCategory.get(lab.category)!.push(line);
    } else {
      // No trending - just show the most recent value
      let line = `${name} ${lab.mostRecent.value}`;

      if (!groupedByCategory.has(lab.category)) {
        groupedByCategory.set(lab.category, []);
      }
      groupedByCategory.get(lab.category)!.push(line);
    }
  });

  const finalLines: string[] = [];
  const categories: string[] = [];
  groupedByCategory.forEach((_, key) => categories.push(key));
  const sortedCategories = categories.sort((a, b) => {
      const orderA = CATEGORY_ORDER[a] || 99;
      const orderB = CATEGORY_ORDER[b] || 99;
      return orderA - orderB;
  });

  for(const category of sortedCategories) {
      finalLines.push(...groupedByCategory.get(category)!);
  }

  return finalLines.join('\n');
}

export function updateLabTrending(
  processedLabs: ProcessedLabValue[],
  testName: string,
  change: 'increase' | 'decrease'
): ProcessedLabValue[] {
  return processedLabs.map(lab => {
    if (lab.testName.toLowerCase() === testName.toLowerCase()) {
      // Ensure trending array exists and is valid
      const trendingLength = lab.trending?.length || 0;
      let newCount = lab.trendCount || 0;
      
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
  return processedLabs.map(lab => {
    if (lab.testName.toLowerCase() === testName.toLowerCase()) {
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
    lab.testName.toLowerCase() === testName.toLowerCase()
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
    lab.testName.toLowerCase() === testName.toLowerCase()
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