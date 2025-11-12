/**
 * API Route: /api/auth/refresh
 * Refresh access token endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken } from '@/lib/auth/service';
import { z } from 'zod';

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = refreshSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(e => e.message),
        },
        { status: 400 }
      );
    }

    const { refreshToken } = validation.data;

    // Refresh token
    const result = await refreshAccessToken(refreshToken);

    return NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens,
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
