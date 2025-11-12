/**
 * API Route: /api/auth/me
 * Get current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth/service';

export async function GET(request: NextRequest) {
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
    
    // Verify session and get user
    const user = await verifySession(accessToken);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
    
  } catch (error) {
    console.error('Get user error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get user profile' },
      { status: 500 }
    );
  }
}
