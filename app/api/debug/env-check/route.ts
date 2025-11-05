import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
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
