/**
 * Google OAuth Callback Endpoint
 * Handles the redirect from Google after user authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens, storeUserTokens } from '@/lib/services/oauth-service';
import { provisionUserSpreadsheet } from '@/lib/services/spreadsheet-provisioning';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const stateStr = searchParams.get('state');
    const error = searchParams.get('error');

    // Handle user denial
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/dashboard?oauth_error=denied', request.url)
      );
    }

    if (!code || !stateStr) {
      return NextResponse.json(
        { error: 'Missing authorization code or state' },
        { status: 400 }
      );
    }

    // Parse state to get user context
    let state: { userId: string; returnUrl: string };
    try {
      state = JSON.parse(stateStr);
    } catch {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      );
    }

    // Exchange code for tokens
    const { accessToken, refreshToken, expiryDate } = await exchangeCodeForTokens(code);

    // Store tokens in database
    await storeUserTokens(state.userId, accessToken, refreshToken, expiryDate);

    // Get user details for spreadsheet provisioning
    const user = await prisma.user.findUnique({
      where: { id: state.userId },
      select: { email: true, name: true, spreadsheetId: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Provision spreadsheet if not already done
    let spreadsheetProvisioned = false;
    if (!user.spreadsheetId) {
      try {
        const result = await provisionUserSpreadsheet(
          state.userId,
          user.email,
          user.name || user.email,
          accessToken
        );

        if (result.success && result.spreadsheetId) {
          // Update user with spreadsheet info
          await prisma.user.update({
            where: { id: state.userId },
            data: {
              spreadsheetId: result.spreadsheetId,
              spreadsheetUrl: result.spreadsheetUrl,
              spreadsheetCreatedAt: new Date()
            }
          });
          spreadsheetProvisioned = true;
        }
      } catch (error) {
        console.error('Error provisioning spreadsheet during OAuth callback:', error);
        // Continue anyway - user can try again later
      }
    }

    // Redirect back to the return URL with success message
    const returnUrl = new URL(state.returnUrl, request.url);
    returnUrl.searchParams.set('oauth_success', 'true');
    if (spreadsheetProvisioned) {
      returnUrl.searchParams.set('spreadsheet_created', 'true');
    }

    return NextResponse.redirect(returnUrl);
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard?oauth_error=callback_failed', request.url)
    );
  }
}
