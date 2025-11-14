/**
 * Authentication Middleware
 * 
 * Extract and verify JWT token from request, return authenticated user
 */

import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/tokens';
import { prisma } from '@/lib/prisma';

// Original spreadsheet - ONLY for shaun@siamoon.com
const ORIGINAL_SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';
const ADMIN_EMAIL = 'shaun@siamoon.com';

// Default spreadsheet for backward compatibility
const DEFAULT_SHEET_ID = process.env.GOOGLE_SHEET_ID;

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
  
  // SPECIAL CASE: Admin account (shaun@siamoon.com) always uses original spreadsheet
  if (user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    console.log('⭐ Admin account detected - using original spreadsheet');
    
    // If admin doesn't have spreadsheet assigned yet, assign it now
    if (!user.spreadsheetId || user.spreadsheetId !== ORIGINAL_SPREADSHEET_ID) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          spreadsheetId: ORIGINAL_SPREADSHEET_ID,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${ORIGINAL_SPREADSHEET_ID}/edit`,
          spreadsheetCreatedAt: user.spreadsheetCreatedAt || new Date(),
        },
      });
    }
    
    return ORIGINAL_SPREADSHEET_ID;
  }
  
  // For all other users, they must have their own spreadsheet
  if (!user.spreadsheetId) {
    throw new Error('No spreadsheet configured for this user. Please contact support.');
  }

  return user.spreadsheetId;
}

/**
 * Get spreadsheet ID - REQUIRES authentication
 * No fallback - user must be authenticated and have a spreadsheet
 */
export async function getSpreadsheetId(request: NextRequest): Promise<string> {
  // Get user's spreadsheet (requires auth token)
  const spreadsheetId = await getUserSpreadsheetId(request);
  console.log(`📊 Using user's spreadsheet: ${spreadsheetId}`);
  return spreadsheetId;
}

/**
 * Check if user is admin
 */
export async function isAdmin(request: NextRequest): Promise<boolean> {
  const user = await getCurrentUser(request);
  return user.role === 'admin' || user.role === 'owner';
}
