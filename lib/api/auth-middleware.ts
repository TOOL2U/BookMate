/**
 * Authentication Middleware for API Routes
 * 
 * Supports both:
 * 1. Bearer token authentication (mobile apps) - Authorization: Bearer <token>
 * 2. Session cookie authentication (web app) - Cookie: session=<token>
 * 
 * This middleware extracts and verifies JWT tokens from either source,
 * then returns the account configuration for the authenticated user.
 */

import { NextRequest } from 'next/server';
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
 * JWT payload structure
 */
interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify JWT token and return payload
 */
function verifyJWT(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not configured');
    throw new NotAuthenticatedError('Server configuration error');
  }

  try {
    const decoded = jwt.verify(token, secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new NotAuthenticatedError('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new NotAuthenticatedError('Invalid token');
    }
    throw new NotAuthenticatedError('Token verification failed');
  }
}

/**
 * Get account configuration from JWT token
 */
async function getAccountFromJWT(token: string): Promise<AccountConfigSerialized> {
  // Verify token
  const payload = verifyJWT(token);

  // Get user email from token
  const userEmail = payload.email;
  if (!userEmail) {
    throw new NotAuthenticatedError('Token missing email');
  }

  // Fetch account config from Firestore
  try {
    const account = await getAccountByEmail(userEmail);
    return serializeAccountConfig(account);
  } catch (error) {
    console.error(`[AUTH] Failed to get account for ${userEmail}:`, error);
    throw new NoAccountError(userEmail);
  }
}

/**
 * Extract Bearer token from Authorization header
 * 
 * @param request - The incoming request
 * @returns The token string or null if not found
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Check for "Bearer <token>" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove "Bearer " prefix
  }

  // Check for just the token without "Bearer" prefix (less common)
  if (authHeader && !authHeader.includes(' ')) {
    return authHeader;
  }

  return null;
}

/**
 * Extract session token from cookies
 * 
 * @returns The token string or null if not found
 */
async function extractSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  return sessionToken || null;
}

/**
 * Get account configuration from the current request
 * 
 * This function:
 * 1. Checks Authorization header for Bearer token (mobile apps)
 * 2. Falls back to session cookie (web app)
 * 3. Verifies the token with JWT
 * 4. Extracts user email from token
 * 5. Fetches account config from Firestore
 * 6. Returns serialized account config
 * 
 * @param request - The incoming NextRequest
 * @throws {NotAuthenticatedError} If no token found or token is invalid
 * @throws {NoAccountError} If user has no account configured
 * @returns {Promise<AccountConfigSerialized>} The user's account configuration
 * 
 * @example
 * ```typescript
 * // In an API route
 * export async function GET(request: NextRequest) {
 *   try {
 *     const account = await getAccountFromRequest(request);
 *     
 *     // Use account.sheetId, account.scriptUrl, account.scriptSecret
 *     const data = await fetchSheetData(account.sheetId);
 *     
 *     return NextResponse.json({ ok: true, data });
 *   } catch (error) {
 *     if (error instanceof NoAccountError) {
 *       return NextResponse.json(
 *         { ok: false, error: 'NO_ACCOUNT_FOUND' },
 *         { status: 403 }
 *       );
 *     }
 *     if (error instanceof NotAuthenticatedError) {
 *       return NextResponse.json(
 *         { ok: false, error: 'Not authenticated' },
 *         { status: 401 }
 *       );
 *     }
 *     throw error;
 *   }
 * }
 * ```
 */
export async function getAccountFromRequest(request: NextRequest): Promise<AccountConfigSerialized> {
  // Try Bearer token first (mobile apps, preferred for new implementations)
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    console.log('[AUTH] Using Bearer token authentication');
    return getAccountFromJWT(bearerToken);
  }

  // Fall back to session cookie (web app, backward compatibility)
  const sessionToken = await extractSessionCookie();
  if (sessionToken) {
    console.log('[AUTH] Using session cookie authentication');
    return getAccountFromJWT(sessionToken);
  }

  // No authentication found
  throw new NotAuthenticatedError('No authentication token found. Please provide either Authorization header or session cookie.');
}

/**
 * Legacy function for backward compatibility
 * 
 * @deprecated Use getAccountFromRequest(request) instead
 */
export async function getAccountFromSession(): Promise<AccountConfigSerialized> {
  const sessionToken = await extractSessionCookie();
  
  if (!sessionToken) {
    throw new NotAuthenticatedError('No session token found');
  }

  return getAccountFromJWT(sessionToken);
}

/**
 * Extract user info from request without fetching account
 * Useful for routes that need user identity but not full account config
 * 
 * @param request - The incoming NextRequest
 * @returns {Promise<TokenPayload>} The verified JWT payload
 * @throws {NotAuthenticatedError} If no token found or token is invalid
 */
export async function getUserFromRequest(request: NextRequest): Promise<TokenPayload> {
  // Try Bearer token first
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    return verifyJWT(bearerToken);
  }

  // Fall back to session cookie
  const sessionToken = await extractSessionCookie();
  if (sessionToken) {
    return verifyJWT(sessionToken);
  }

  throw new NotAuthenticatedError('No authentication token found');
}
