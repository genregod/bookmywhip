import crypto from 'crypto';
import { User } from '@shared/schema';
import { storage } from '../storage';

/**
 * Generate a random token for email verification
 * @returns A random token
 */
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a random code for phone verification (6 digits)
 * @returns A 6-digit random code
 */
export function generatePhoneVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Check if a given token matches the user's email verification token
 * @param user The user to verify
 * @param token The token to check
 * @returns Boolean indicating if the token is valid
 */
export function validateEmailVerificationToken(user: User, token: string): boolean {
  if (!user.emailVerificationToken || !user.emailVerificationExpiry) {
    return false;
  }
  
  // Check if token is expired
  const now = new Date();
  const expiry = new Date(user.emailVerificationExpiry);
  if (now > expiry) {
    return false;
  }
  
  // Check if token matches
  return user.emailVerificationToken === token;
}

/**
 * Check if a given code matches the user's phone verification code
 * @param user The user to verify
 * @param code The code to check
 * @returns Boolean indicating if the code is valid
 */
export function validatePhoneVerificationCode(user: User, code: string): boolean {
  if (!user.phoneVerificationCode || !user.phoneVerificationExpiry) {
    return false;
  }
  
  // Check if code is expired
  const now = new Date();
  const expiry = new Date(user.phoneVerificationExpiry);
  if (now > expiry) {
    return false;
  }
  
  // Check if code matches
  return user.phoneVerificationCode === code;
}

/**
 * Set up email verification for a user
 * @param userId The user ID to set up verification for
 * @returns The verification token
 */
export async function setupEmailVerification(userId: number): Promise<string> {
  const token = generateEmailVerificationToken();
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + 24); // 24 hour expiry
  
  await storage.updateUser(userId, {
    emailVerificationToken: token,
    emailVerificationExpiry: expiry
  });
  
  return token;
}

/**
 * Set up phone verification for a user
 * @param userId The user ID to set up verification for
 * @returns The verification code
 */
export async function setupPhoneVerification(userId: number): Promise<string> {
  const code = generatePhoneVerificationCode();
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + 30); // 30 minute expiry
  
  await storage.updateUser(userId, {
    phoneVerificationCode: code,
    phoneVerificationExpiry: expiry
  });
  
  return code;
}

/**
 * Mark a user's email as verified
 * @param userId The user ID to update
 */
export async function markEmailAsVerified(userId: number): Promise<void> {
  await storage.updateUser(userId, {
    isEmailVerified: true,
    emailVerificationToken: null,
    emailVerificationExpiry: null
  });
}

/**
 * Mark a user's phone as verified
 * @param userId The user ID to update
 */
export async function markPhoneAsVerified(userId: number): Promise<void> {
  await storage.updateUser(userId, {
    isPhoneVerified: true,
    phoneVerificationCode: null,
    phoneVerificationExpiry: null
  });
}

/**
 * Check if a user has verified their identity
 * @param userId The user ID to check
 * @returns Boolean indicating if identity is verified
 */
export async function checkIdentityVerification(userId: number): Promise<boolean> {
  const user = await storage.getUser(userId);
  return user?.isIdentityVerified || false;
}

/**
 * Submit identity documents for verification
 * @param userId The user ID to update
 * @param documents The identity documents to store
 */
export async function submitIdentityVerification(userId: number, documents: any): Promise<void> {
  await storage.updateUser(userId, {
    identityDocuments: documents,
    identityVerificationStatus: 'submitted'
  });
}

/**
 * Update identity verification status
 * @param userId The user ID to update
 * @param status The new verification status
 * @param isVerified Whether the identity is verified
 */
export async function updateIdentityVerificationStatus(
  userId: number, 
  status: string, 
  isVerified: boolean
): Promise<void> {
  await storage.updateUser(userId, {
    identityVerificationStatus: status,
    isIdentityVerified: isVerified
  });
}