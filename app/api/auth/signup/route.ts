/**
 * API Route: /api/auth/signup
 * User signup endpoint - creates both Firebase Auth user and PostgreSQL user
 */

import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth/service';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map(e => e.message),
        },
        { status: 400 }
      );
    }

    const { email, password, name } = validation.data;

    // Register user (creates both Firebase and PostgreSQL user)
    const result = await registerUser({
      email,
      password,
      name,
    });

    return NextResponse.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof Error) {
      // Handle specific Firebase errors
      const errorMessage = error.message;
      
      if (errorMessage.includes('already exists')) {
        return NextResponse.json(
          { error: 'This email is already registered. Try logging in instead.' },
          { status: 409 }
        );
      }
      
      if (errorMessage.includes('weak-password')) {
        return NextResponse.json(
          { error: 'Password is too weak. Please choose a stronger password.' },
          { status: 400 }
        );
      }
      
      if (errorMessage.includes('invalid-email')) {
        return NextResponse.json(
          { error: 'Invalid email address.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
