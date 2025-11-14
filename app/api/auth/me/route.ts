/**
 * API Route: /api/auth/me
 * Get current user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    // Try to get session token from cookies first
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    // If no cookie, try Authorization header (for API clients)
    let token = sessionToken;
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: string;
    };

    return NextResponse.json({
      ok: true,
      success: true,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      },
    });
    
  } catch (error: any) {
    // Don't log 401s - they're expected when not logged in
    if (error.name !== 'TokenExpiredError' && error.name !== 'JsonWebTokenError') {
      console.error('Get user error:', error);
    }
    
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }
}
