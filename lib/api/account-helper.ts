/**
 * Account Config Helper for API Routes
 * 
 * Provides utilities to fetch account configuration for the authenticated user
 * in server-side API routes. This replaces hardcoded environment variables
 * with per-user account configs from Firestore.
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getAccountByEmail, serializeAccountConfig } from '@/lib/accounts';
import type { AccountConfigSerialized } from '@/lib/types/account';

/**
 * Error thrown when user has no account configured
 */
export class NoAccountError extends Error {
  constructor(public userEmail: string) {
    super(`No account found for user: ${userEmail}`);
    this.name = 'NoAccountError';
  }
}

/**
 * Error thrown when user is not authenticated
 */
export class NotAuthenticatedError extends Error {
  constructor(message = 'Not authenticated') {
    super(message);
    this.name = 'NotAuthenticatedError';
  }
}

/**
 * Get account configuration for the authenticated user
 * 
 * This function:
 * 1. Gets session token from cookies
 * 2. Verifies token with Firebase Admin
 * 3. Extracts user email from token
 * 4. Fetches account config from Firestore
 * 5. Returns serialized account config
 * 
 * @throws {NotAuthenticatedError} If no session token or token is invalid
 * @throws {NoAccountError} If user has no account configured
 * @returns {Promise<AccountConfigSerialized>} The user's account configuration
 * 
 * @example
 * ```typescript
 * // In an API route
 * export async function GET(request: NextRequest) {
 *   try {
 *     const account = await getAccountFromSession();
 *     
 *     // Use account.sheetId, account.scriptUrl, account.scriptSecret
 *     const response = await fetch(account.scriptUrl, {
 *       method: 'POST',
 *       body: JSON.stringify({
 *         action: 'getData',
 *         secret: account.scriptSecret,
 *         sheetId: account.sheetId
 *       })
 *     });
 *     
 *     return NextResponse.json({ ok: true, data: await response.json() });
 *   } catch (error) {
 *     if (error instanceof NoAccountError) {
 *       return NextResponse.json({ error: 'NO_ACCOUNT_FOUND' }, { status: 403 });
 *     }
 *     if (error instanceof NotAuthenticatedError) {
 *       return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function getAccountFromSession(): Promise<AccountConfigSerialized> {
  // Get session token from cookies
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;

  if (!sessionToken) {
    throw new NotAuthenticatedError('No session token found');
  }

  // Verify JWT token
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    throw new NotAuthenticatedError('Server configuration error');
  }

  let decoded;
  
  try {
    decoded = jwt.verify(sessionToken, secret) as {
      userId: string;
      email: string;
      role: string;
    };
  } catch (error) {
    console.error('❌ Failed to verify session token:', error);
    throw new NotAuthenticatedError('Session expired or invalid');
  }

  // Extract user email
  const userEmail = decoded.email;
  if (!userEmail) {
    throw new NotAuthenticatedError('No email in token');
  }

  // Fetch account from Firestore
  const account = await getAccountByEmail(userEmail);

  if (!account) {
    throw new NoAccountError(userEmail);
  }

  // Return serialized account config
  return serializeAccountConfig(account);
}

/**
 * Optional: Get account with fallback to environment variables
 * 
 * This is a transitional helper that allows gradual migration.
 * It tries to get account from session first, but falls back to
 * environment variables if no account is found.
 * 
 * **WARNING:** This should only be used temporarily during migration.
 * Eventually, all routes should require proper account configs.
 * 
 * @returns {Promise<AccountConfigSerialized | null>} Account config or null
 */
export async function getAccountOrFallback(): Promise<AccountConfigSerialized | null> {
  try {
    return await getAccountFromSession();
  } catch (error) {
    if (error instanceof NoAccountError || error instanceof NotAuthenticatedError) {
      console.warn('⚠️ No account found, falling back to env vars (temporary)');
      return null;
    }
    throw error; // Re-throw unexpected errors
  }
}
