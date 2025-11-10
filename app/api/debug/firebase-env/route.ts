/**
 * Debug endpoint to verify Firebase environment variables
 * GET /api/debug/firebase-env
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
    
    // Check Vercel environment
    const vercelEnv = process.env.VERCEL_ENV;
    const vercelUrl = process.env.VERCEL_URL;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    
    return NextResponse.json({
      ok: true,
      vercel: {
        env: vercelEnv, // production, preview, or development
        url: vercelUrl,
        projectId: vercelProjectId,
      },
      firebase: {
        projectId: projectId || '❌ NOT SET',
        clientEmail: clientEmail || '❌ NOT SET',
        privateKeyExists: !!privateKey,
        privateKeyLength: privateKey?.length || 0,
        privateKeyStartsWith: privateKey?.substring(0, 30) || '❌ NOT SET',
        privateKeyHasEscapedNewlines: privateKey?.includes('\\n') || false,
        privateKeyHasRealNewlines: privateKey?.includes('\n') || false,
      },
      debug: {
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
