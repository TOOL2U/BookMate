/**
 * Admin Endpoint: Environment Verification
 * 
 * Validates production environment configuration
 * Returns environment status with security checks
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/lib/api/security';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling } from '@/lib/api/errors';

async function envVerifyHandler(req: NextRequest) {
  // TODO: Add admin authentication check
  // const isAdmin = await verifyAdminToken(req);
  // if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const environment = process.env.NODE_ENV || 'development';
  const vercelEnv = process.env.VERCEL_ENV || 'none';
  const isProduction = environment === 'production' || vercelEnv === 'production';

  // Check all critical environment variables
  const checks = {
    environment: {
      nodeEnv: environment,
      vercelEnv: vercelEnv,
      isProduction,
      status: isProduction ? '✅' : '⚠️'
    },
    
    appUrl: {
      value: process.env.NEXT_PUBLIC_APP_URL,
      expected: isProduction ? 'https://accounting.siamoon.com' : 'http://localhost:3000',
      isValid: isProduction 
        ? process.env.NEXT_PUBLIC_APP_URL === 'https://accounting.siamoon.com'
        : true,
      status: process.env.NEXT_PUBLIC_APP_URL ? '✅' : '❌'
    },
    
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      expectedProjectId: 'bookmate-bfd43',
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      isValid: process.env.FIREBASE_PROJECT_ID === 'bookmate-bfd43' &&
               !!process.env.FIREBASE_CLIENT_EMAIL &&
               !!process.env.FIREBASE_PRIVATE_KEY,
      status: process.env.FIREBASE_PROJECT_ID === 'bookmate-bfd43' ? '✅' : '❌'
    },
    
    googleSheets: {
      hasSheetId: !!process.env.GOOGLE_SHEET_ID,
      hasCredentials: !!process.env.GOOGLE_CLIENT_EMAIL && !!process.env.GOOGLE_PRIVATE_KEY,
      sheetIdPreview: process.env.GOOGLE_SHEET_ID?.substring(0, 15) + '...',
      isValid: !!process.env.GOOGLE_SHEET_ID && 
               !!process.env.GOOGLE_CLIENT_EMAIL,
      status: !!process.env.GOOGLE_SHEET_ID ? '✅' : '❌'
    },
    
    openai: {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyPreview: process.env.OPENAI_API_KEY?.substring(0, 15) + '...',
      isValid: !!process.env.OPENAI_API_KEY,
      status: !!process.env.OPENAI_API_KEY ? '✅' : '❌'
    },
    
    sendgrid: {
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      keyPreview: process.env.SENDGRID_API_KEY?.substring(0, 15) + '...',
      isValid: !!process.env.SENDGRID_API_KEY,
      status: !!process.env.SENDGRID_API_KEY ? '✅' : '❌'
    },
    
    database: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isValid: !!process.env.DATABASE_URL,
      status: !!process.env.DATABASE_URL ? '✅' : '❌'
    }
  };

  // Calculate overall health
  const allValid = Object.values(checks).every(check => {
    if ('isValid' in check) return check.isValid;
    return true;
  });

  const warnings: string[] = [];
  const errors: string[] = [];

  // Validate production requirements
  if (isProduction) {
    if (checks.appUrl.value !== 'https://accounting.siamoon.com') {
      errors.push('NEXT_PUBLIC_APP_URL must be https://accounting.siamoon.com in production');
    }
    if (checks.firebase.projectId !== 'bookmate-bfd43') {
      errors.push('FIREBASE_PROJECT_ID must be bookmate-bfd43 in production');
    }
    if (!checks.openai.hasApiKey) {
      warnings.push('OPENAI_API_KEY not set - AI features will not work');
    }
    if (!checks.sendgrid.hasApiKey) {
      warnings.push('SENDGRID_API_KEY not set - Email reports will not work');
    }
  }

  return NextResponse.json({
    ok: allValid && errors.length === 0,
    environment: isProduction ? 'production' : 'development',
    timestamp: new Date().toISOString(),
    checks,
    summary: {
      allValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      status: errors.length > 0 ? '🔴 ERRORS' : warnings.length > 0 ? '🟡 WARNINGS' : '🟢 HEALTHY'
    },
    errors,
    warnings,
  });
}

// Apply middleware
export const GET = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(envVerifyHandler),
    RATE_LIMITS.health
  )
);
