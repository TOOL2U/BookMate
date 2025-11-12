/**
 * API Route: /api/auth/login
 * User login endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth/service';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(e => e.message),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Get request metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Login user
    const result = await loginUser(
      { email, password },
      { ipAddress, userAgent }
    );

    return NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
