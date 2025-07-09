/**
 * Utility functions for generating and managing dot phrase share codes
 */

// Characters available for share codes: 0-9, A-Z (36 total)
const SHARE_CODE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SHARE_CODE_LENGTH = 4;

/**
 * Generate a random 4-character alphanumeric share code
 * @returns A random share code string (e.g., "A3X9", "M7K2")
 */
export function generateShareCode(): string {
  let result = '';
  for (let i = 0; i < SHARE_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * SHARE_CODE_CHARS.length);
    result += SHARE_CODE_CHARS[randomIndex];
  }
  return result;
}

/**
 * Validate that a share code meets the required format
 * @param code The share code to validate
 * @returns True if the code is valid, false otherwise
 */
export function isValidShareCode(code: string): boolean {
  if (typeof code !== 'string') return false;
  if (code.length !== SHARE_CODE_LENGTH) return false;
  
  // Check that all characters are valid
  for (const char of code) {
    if (!SHARE_CODE_CHARS.includes(char.toUpperCase())) {
      return false;
    }
  }
  
  return true;
}

/**
 * Normalize a share code to uppercase
 * @param code The share code to normalize
 * @returns The normalized share code
 */
export function normalizeShareCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Generate a unique share code by checking against existing codes
 * @param checkCodeExists Function that returns true if the code already exists
 * @param maxRetries Maximum number of generation attempts
 * @returns A unique share code
 * @throws Error if unable to generate unique code after maxRetries
 */
export async function generateUniqueShareCode(
  checkCodeExists: (code: string) => Promise<boolean>,
  maxRetries: number = 100
): Promise<string> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateShareCode();
    const exists = await checkCodeExists(code);
    
    if (!exists) {
      return code;
    }
  }
  
  throw new Error(`Unable to generate unique share code after ${maxRetries} attempts`);
}

/**
 * Calculate the theoretical maximum number of possible share codes
 * @returns The maximum number of unique codes possible
 */
export function getMaxPossibleCodes(): number {
  return Math.pow(SHARE_CODE_CHARS.length, SHARE_CODE_LENGTH);
}

/**
 * Estimate the collision probability given the number of existing codes
 * @param existingCodes Number of codes already in use
 * @returns Probability of collision (0-1)
 */
export function estimateCollisionProbability(existingCodes: number): number {
  const maxCodes = getMaxPossibleCodes();
  if (existingCodes >= maxCodes) return 1;
  
  // Simple approximation using birthday paradox
  return existingCodes / maxCodes;
}