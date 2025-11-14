/**
 * Admin Authorization Utilities
 * 
 * Helper functions to verify admin access in server components and actions
 */

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

/**
 * Allowed admin email
 * Only this email can access admin pages
 */
const ALLOWED_ADMIN_EMAIL = 'admin@siamoon.com';

/**
 * Check if the current user is an admin
 * 
 * @returns Object with admin status and user info
 */
export async function checkAdminAccess(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  email?: string;
  error?: string;
}> {
  try {
    // Get the session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return {
        isAdmin: false,
        userId: null,
        error: 'Not authenticated',
      };
    }

    // Verify the JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return {
        isAdmin: false,
        userId: null,
        error: 'Server configuration error',
      };
    }

    const decoded = jwt.verify(sessionToken, secret) as {
      userId: string;
      email: string;
      role: string;
    };

    // Check if user email matches allowed admin email
    const userEmail = decoded.email?.toLowerCase();
    const isAdmin = userEmail === ALLOWED_ADMIN_EMAIL.toLowerCase() && decoded.role === 'admin';

    if (!isAdmin) {
      console.log(`❌ Admin access denied for: ${userEmail} (required: ${ALLOWED_ADMIN_EMAIL})`);
    }

    return {
      isAdmin,
      userId: decoded.userId,
      email: decoded.email,
      error: isAdmin ? undefined : `Access denied. Only ${ALLOWED_ADMIN_EMAIL} can access admin pages.`,
    };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return {
      isAdmin: false,
      userId: null,
      error: 'Authentication error',
    };
  }
}

/**
 * Require admin access or throw error
 * Use in server actions and API routes
 * 
 * @throws Error if user is not admin
 * @returns User ID of the admin
 */
export async function requireAdmin(): Promise<string> {
  const { isAdmin, userId, error } = await checkAdminAccess();

  if (!isAdmin || !userId) {
    throw new Error(error || 'Unauthorized');
  }

  return userId;
}
