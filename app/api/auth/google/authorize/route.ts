/**
 * Google OAuth Authorization Endpoint
 * Redirects user to Google consent screen
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthorizationUrl } from '@/lib/services/oauth-service';
import { getAuth } from 'firebase/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const returnUrl = searchParams.get('returnUrl') || '/dashboard';

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Create state parameter to maintain context
    const state = JSON.stringify({
      userId,
      returnUrl
    });

    // Get authorization URL
    const authUrl = getAuthorizationUrl(state);

    // Redirect to Google consent screen
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating OAuth flow:', error);
    return NextResponse.json(
      { error: 'Failed to initiate authorization' },
      { status: 500 }
    );
  }
}
