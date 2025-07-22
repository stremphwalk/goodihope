import { db } from "./database";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

// Letters to use for custom identifiers (excluding similar looking characters)
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded: I, O (look like 1, 0)
const NUMBERS = '0123456789';

/**
 * Generates a random custom identifier in the format XXXX## (4 letters + 2 numbers)
 */
export function generateCustomIdentifier(): string {
  let identifier = '';
  
  // Generate 4 random letters
  for (let i = 0; i < 4; i++) {
    identifier += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  }
  
  // Generate 2 random numbers
  for (let i = 0; i < 2; i++) {
    identifier += NUMBERS.charAt(Math.floor(Math.random() * NUMBERS.length));
  }
  
  return identifier;
}

/**
 * Validates if a custom identifier follows the correct format
 */
export function isValidCustomIdentifier(identifier: string): boolean {
  if (!identifier || typeof identifier !== 'string') {
    return false;
  }
  
  // Must be exactly 6 characters: 4 letters + 2 numbers
  if (identifier.length !== 6) {
    return false;
  }
  
  // First 4 characters must be letters (from our allowed set)
  const letters = identifier.substring(0, 4);
  if (!/^[A-Z]{4}$/.test(letters) || !letters.split('').every(char => LETTERS.includes(char))) {
    return false;
  }
  
  // Last 2 characters must be numbers
  const numbers = identifier.substring(4, 6);
  if (!/^[0-9]{2}$/.test(numbers)) {
    return false;
  }
  
  return true;
}

/**
 * Checks if a custom identifier is already in use
 */
export async function isCustomIdentifierTaken(identifier: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.customIdentifier, identifier))
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking custom identifier:', error);
    return true; // Assume taken if there's an error
  }
}

/**
 * Generates a unique custom identifier that's not already in use
 */
export async function generateUniqueCustomIdentifier(): Promise<string> {
  const maxAttempts = 100; // Prevent infinite loops
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const identifier = generateCustomIdentifier();
    
    if (!(await isCustomIdentifierTaken(identifier))) {
      return identifier;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique custom identifier after maximum attempts');
}

/**
 * Formats a custom identifier for display (adds space between letters and numbers)
 */
export function formatCustomIdentifier(identifier: string): string {
  if (!isValidCustomIdentifier(identifier)) {
    return identifier; // Return as-is if invalid
  }
  
  return `${identifier.substring(0, 4)} ${identifier.substring(4, 6)}`;
} 