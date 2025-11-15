/**
 * API Route: One-Time Admin Setup
 * 
 * Use this ONCE to set the first admin user.
 * DELETE THIS FILE after setting your first admin!
 * 
 * Usage:
 *   POST /api/admin/setup
 *   Body: { "uid": "your-firebase-uid", "secret": "your-setup-secret" }
 * 
 * Set ADMIN_SETUP_SECRET in your .env.local:
 *   ADMIN_SETUP_SECRET=some-random-string-here
 */

import { NextResponse } from 'next/server';
import { setAdminClaim } from '@/lib/auth/admin';

export async function POST(req: Request) {
  try {
    const { uid, secret } = await req.json();

    // Security: Require a setup secret
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    
    if (!setupSecret) {
      return NextResponse.json(
        { 
          error: 'ADMIN_SETUP_SECRET not configured',
          message: 'Add ADMIN_SETUP_SECRET to your .env.local file'
        },
        { status: 500 }
      );
    }

    if (secret !== setupSecret) {
      return NextResponse.json(
        { error: 'Invalid setup secret' },
        { status: 401 }
      );
    }

    if (!uid) {
      return NextResponse.json(
        { error: 'UID is required' },
        { status: 400 }
      );
    }

    // Set admin claim
    await setAdminClaim(uid);

    return NextResponse.json({
      success: true,
      message: 'Admin claim set successfully. User must logout and login again.',
      uid,
      nextSteps: [
        'User should logout',
        'User should login again',
        'Navigate to /admin/accounts/new',
        '⚠️  DELETE this API route file for security!'
      ]
    });
  } catch (error: any) {
    console.error('Error in admin setup:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set admin claim' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint with instructions
 */
export async function GET() {
  return NextResponse.json({
    instructions: {
      purpose: 'One-time setup to create first admin user',
      method: 'POST',
      body: {
        uid: 'your-firebase-user-uid',
        secret: 'value-from-ADMIN_SETUP_SECRET-env-var'
      },
      steps: [
        '1. Add ADMIN_SETUP_SECRET to .env.local',
        '2. Get your Firebase UID from Auth console',
        '3. POST to this endpoint with UID and secret',
        '4. Logout and login again',
        '5. DELETE this file for security'
      ],
      example: `
        curl -X POST http://localhost:3000/api/admin/setup \\
          -H "Content-Type: application/json" \\
          -d '{"uid": "abc123...", "secret": "your-secret"}'
      `
    },
    warning: '⚠️  DELETE THIS FILE after setting your first admin!'
  });
}
