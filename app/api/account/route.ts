/**
 * API Route: Get Current User's Account Config
 * 
 * Fetches the account configuration for the logged-in user
 * based on their email address
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getAccountByEmail, serializeAccountConfig } from '@/lib/accounts';

export async function GET() {
  try {
    // Get session token from cookies
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Verify JWT token and get user email
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const decoded = jwt.verify(sessionToken, secret) as {
      userId: string;
      email: string;
      role: string;
    };

    const userEmail = decoded.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'No email found in user token' },
        { status: 400 }
      );
    }

    // Fetch account config by email
    const account = await getAccountByEmail(userEmail);

    if (!account) {
      return NextResponse.json(
        { 
          error: 'NO_ACCOUNT_FOUND',
          message: 'No BookMate account is linked to this email. Please contact support.',
          userEmail 
        },
        { status: 404 }
      );
    }

    // Return serialized account (converts Timestamps to ISO strings)
    return NextResponse.json({
      ok: true,
      account: serializeAccountConfig(account),
    });
  } catch (error: any) {
    console.error('Error fetching user account:', error);

    // Handle JWT errors
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Session expired. Please login again.' },
        { status: 401 }
      );
    }

    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid session. Please login again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch account configuration' },
      { status: 500 }
    );
  }
}
