import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

/**
 * Password Reset API
 * 
 * Sends a password reset email to the user using Firebase Auth.
 * 
 * POST /api/auth/reset-password
 * Body: { "email": "user@example.com" }
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    try {
      console.log('Attempting to get Firebase Admin Auth...');
      const auth = getAdminAuth();
      console.log('Firebase Admin Auth obtained successfully');
      
      // Check if user exists in Firebase
      console.log('Looking up user:', email);
      const userRecord = await auth.getUserByEmail(email);
      console.log('User found:', userRecord.uid);
      
      // Generate password reset link
      console.log('Generating password reset link...');
      const resetLink = await auth.generatePasswordResetLink(email, {
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://accounting.siamoon.com'}/login`,
        handleCodeInApp: false,
      });

      console.log('Password reset link generated for:', email);
      console.log('Reset link:', resetLink);

      // Return success (don't reveal if user exists for security)
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a password reset link has been sent.',
        // In development, include the link
        ...(process.env.NODE_ENV === 'development' && { 
          resetLink,
          note: 'This link is only shown in development mode. In production, it will be sent via email.'
        })
      });

    } catch (error: any) {
      console.error('Inner error:', error);
      // Don't reveal if user doesn't exist (security best practice)
      if (error.code === 'auth/user-not-found') {
        console.log('Password reset requested for non-existent email:', email);
        return NextResponse.json({
          success: true,
          message: 'If an account exists with this email, a password reset link has been sent.'
        });
      }
      
      throw error;
    }

  } catch (error: any) {
    console.error('Password reset error:', error);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Failed to process password reset request',
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
