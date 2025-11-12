/**
 * API Route: /api/auth/logout
 * User logout endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { logoutUser } from '@/lib/auth/service';
import { verifyToken } from '@/lib/auth/tokens';

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);
    
    // Verify token and get user ID
    const payload = verifyToken(accessToken);
    
    // Get refresh token from body (optional)
    const body = await request.json().catch(() => ({}));
    const refreshToken = body.refreshToken;

    // Logout user
    await logoutUser(payload.userId, refreshToken);

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
