import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Debug endpoint to check environment variables
 * ⚠️ DISABLED IN PRODUCTION FOR SECURITY
 */
export async function GET() {
  // Disable debug endpoints in production
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({
      error: 'Debug endpoints are disabled in production',
      code: 'FORBIDDEN',
    }, { status: 403 });
  }

  return NextResponse.json({
    hasGoogleClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
    hasGooglePrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
    hasGoogleSheetId: !!process.env.GOOGLE_SHEET_ID,
    googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL || 'NOT SET',
    googleSheetId: process.env.GOOGLE_SHEET_ID || 'NOT SET',
    privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
    privateKeyStartsWith: process.env.GOOGLE_PRIVATE_KEY?.substring(0, 30) || 'NOT SET',
  });
}
