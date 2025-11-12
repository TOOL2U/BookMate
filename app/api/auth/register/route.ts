/**
 * API Route: /api/auth/register
 * User registration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth/service';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(e => e.message),
        },
        { status: 400 }
      );
    }

    const { email, password, name, phone } = validation.data;

    // Register user (throws error if fails)
    const result = await registerUser({
      email,
      password,
      name,
      phone,
    });

    // Return success with OAuth redirect URL for spreadsheet setup
    console.log(`✅ User registered: ${email}`);
    console.log(`📊 User needs to authorize Google Sheets access`);
    
    return NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens,
      message: 'Account created successfully!',
      // Frontend should redirect to this URL to complete spreadsheet setup
      nextStep: {
        action: 'oauth',
        url: `/api/auth/google/authorize?userId=${result.user.id}&returnUrl=/dashboard`,
        description: 'Please authorize Google Sheets access to complete setup'
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
