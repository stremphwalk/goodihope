import { userQueries, teamGroupQueries, groupMemberQueries } from "./database-supabase.js";
import { teamGroups, groupMembers, users } from "../shared/schema.js";
import { eq, and, lt, gt } from "drizzle-orm";

// Letters and numbers for invite codes (excluding similar looking characters)
const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';

/**
 * Generates a random 6-character invite code
 */
export function generateInviteCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARS.charAt(Math.floor(Math.random() * INVITE_CHARS.length));
  }
  return code;
}

/**
 * Validates if an invite code follows the correct format
 */
export function isValidInviteCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Must be exactly 6 characters from our allowed set
  if (code.length !== 6) {
    return false;
  }
  
  return code.split('').every(char => INVITE_CHARS.includes(char));
}

/**
 * Checks if an invite code is already in use
 */
export async function isInviteCodeTaken(code: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: teamGroups.id })
      .from(teamGroups)
      .where(eq(teamGroups.inviteCode, code))
      .limit(1);
    
    return result.length > 0;
  } catch (error) {
    console.error('Error checking invite code:', error);
    return true; // Assume taken if there's an error
  }
}

/**
 * Generates a unique invite code that's not already in use
 */
export async function generateUniqueInviteCode(): Promise<string> {
  const maxAttempts = 100; // Prevent infinite loops
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const code = generateInviteCode();
    
    if (!(await isInviteCodeTaken(code))) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Unable to generate unique invite code after maximum attempts');
}

/**
 * Cleans up expired groups
 */
export async function cleanupExpiredGroups(): Promise<void> {
  try {
    const now = new Date();
    
    // Delete expired groups (cascade will handle related records)
    await db
      .delete(teamGroups)
      .where(lt(teamGroups.expiresAt, now));
      
    console.log('Cleaned up expired groups');
  } catch (error) {
    console.error('Error cleaning up expired groups:', error);
  }
}

/**
 * Gets a user's current active group
 */
export async function getUserActiveGroup(userId: number) {
  try {
    const result = await db
      .select({
        group: teamGroups,
        memberRole: groupMembers.role,
        memberCount: groupMembers.id, // We'll count these in the query
      })
      .from(groupMembers)
      .innerJoin(teamGroups, eq(groupMembers.groupId, teamGroups.id))
      .where(
        and(
          eq(groupMembers.userId, userId),
          gt(teamGroups.expiresAt, new Date()) // Only non-expired groups
        )
      )
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    // Get member count for this group
    const memberCount = await db
      .select({ count: groupMembers.id })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, result[0].group.id));

    return {
      ...result[0].group,
      role: result[0].memberRole,
      memberCount: memberCount.length
    };
  } catch (error) {
    console.error('Error getting user active group:', error);
    return null;
  }
}

/**
 * Removes a user from their current group (if any)
 */
export async function removeUserFromCurrentGroup(userId: number): Promise<void> {
  try {
    await db
      .delete(groupMembers)
      .where(eq(groupMembers.userId, userId));
  } catch (error) {
    console.error('Error removing user from current group:', error);
    throw error;
  }
}

/**
 * Gets the member count for a group
 */
export async function getGroupMemberCount(groupId: number): Promise<number> {
  try {
    const result = await db
      .select({ count: groupMembers.id })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
    
    return result.length;
  } catch (error) {
    console.error('Error getting group member count:', error);
    return 0;
  }
}