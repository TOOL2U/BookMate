/**
 * Admin API: List all users and their spreadsheets
 * GET /api/admin/users/spreadsheets
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/middleware/auth';
import prisma from '@/lib/prisma';

const ORIGINAL_SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';

export async function GET(request: NextRequest) {
  try {
    // Verify user is admin
    const currentUser = await getCurrentUser(request);
    
    if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    // Get all users with their spreadsheet info
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        spreadsheetId: true,
        spreadsheetUrl: true,
        spreadsheetCreatedAt: true,
        createdAt: true,
        role: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Add flag for original spreadsheet
    const usersWithFlags = users.map(user => ({
      ...user,
      isUsingOriginalSpreadsheet: user.spreadsheetId === ORIGINAL_SPREADSHEET_ID,
    }));

    // Count users using original spreadsheet
    const originalSpreadsheetUsers = usersWithFlags.filter(
      u => u.isUsingOriginalSpreadsheet
    );

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: users.length,
        usersWithSpreadsheets: users.filter(u => u.spreadsheetId).length,
        usersWithoutSpreadsheets: users.filter(u => !u.spreadsheetId).length,
        usingOriginalSpreadsheet: originalSpreadsheetUsers.length,
        originalSpreadsheetId: ORIGINAL_SPREADSHEET_ID,
      },
      users: usersWithFlags,
      originalSpreadsheetUsers: originalSpreadsheetUsers.map(u => u.email),
    });

  } catch (error: any) {
    console.error('Error fetching user spreadsheets:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user spreadsheets' },
      { status: 500 }
    );
  }
}
