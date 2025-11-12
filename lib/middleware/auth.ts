/**
 * Authentication Middleware
 * 
 * Extract and verify JWT token from request, return authenticated user
 */

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/tokens';
import { prisma } from '@/lib/prisma';

/**
 * Extract and verify JWT token from request, return authenticated user
 */
export async function getCurrentUser(request: NextRequest) {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify JWT token
  const decoded = verifyToken(token);
  
  if (!decoded || !decoded.userId) {
    throw new Error('Invalid token');
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'active') {
    throw new Error('User account is not active');
  }

  return user;
}

/**
 * Get user's spreadsheet ID or throw error if not configured
 */
export async function getUserSpreadsheetId(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request);
  
  if (!user.spreadsheetId) {
    throw new Error('No spreadsheet configured for this user. Please contact support.');
  }

  return user.spreadsheetId;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user.role === 'admin' || user.role === 'owner';
}
