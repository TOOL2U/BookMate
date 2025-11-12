/**
 * OAuth Service
 * Handles Google OAuth 2.0 flow for spreadsheet access
 */

import { OAuth2Client } from 'google-auth-library';
import prisma from '@/lib/prisma';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Get OAuth2 client instance
 */
export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirectUri = getRedirectUri();

  if (!clientId || !clientSecret) {
    throw new Error('OAuth credentials not configured');
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Get the correct redirect URI based on environment
 */
function getRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000';
  return `${baseUrl}/api/auth/google/callback`;
}

/**
 * Generate authorization URL for OAuth flow
 */
export function getAuthorizationUrl(state: string): string {
  const oauth2Client = getOAuth2Client();
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    state: state,
    prompt: 'consent' // Force consent screen to always get refresh token
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string) {
  const oauth2Client = getOAuth2Client();
  
  const { tokens } = await oauth2Client.getToken(code);
  
  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Failed to obtain tokens from Google');
  }
  
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null
  };
}

/**
 * Store OAuth tokens for a user
 */
export async function storeUserTokens(
  userId: string,
  accessToken: string,
  refreshToken: string,
  expiryDate: Date | null
) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      googleAccessToken: accessToken,
      googleRefreshToken: refreshToken,
      googleTokenExpiry: expiryDate
    }
  });
}

/**
 * Get valid access token for a user (refreshes if needed)
 */
export async function getUserAccessToken(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      googleAccessToken: true,
      googleRefreshToken: true,
      googleTokenExpiry: true
    }
  });

  if (!user || !user.googleRefreshToken) {
    throw new Error('User has not authorized Google access');
  }

  // Check if token is expired or about to expire (5 min buffer)
  const now = new Date();
  const expiryBuffer = new Date(now.getTime() + 5 * 60 * 1000);
  
  if (!user.googleTokenExpiry || user.googleTokenExpiry < expiryBuffer) {
    // Need to refresh token
    const oauth2Client = getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: user.googleRefreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    // Update stored tokens
    await storeUserTokens(
      userId,
      credentials.access_token,
      user.googleRefreshToken,
      credentials.expiry_date ? new Date(credentials.expiry_date) : null
    );

    return credentials.access_token;
  }

  return user.googleAccessToken!;
}

/**
 * Check if user has valid OAuth tokens
 */
export async function userHasValidTokens(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleRefreshToken: true }
  });

  return !!(user?.googleRefreshToken);
}
