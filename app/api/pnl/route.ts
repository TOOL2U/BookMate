import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling } from '@/lib/api/errors';
import { withSecurityHeaders } from '@/lib/api/security';
import { getAccountFromSession, NoAccountError, NotAuthenticatedError } from '@/lib/api/account-helper';

/**
 * P&L Data API Route
 * Fetches live KPI data from Google Sheets P&L tab via Apps Script endpoint
 * Implements 60-second in-memory cache to reduce load on Apps Script
 */

// Type definitions
interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface PnLData {
  month: PnLPeriodData;
  year: PnLPeriodData;
  updatedAt: string;
}

interface CachedData {
  data: PnLData;
  timestamp: number;
}

// In-memory cache (60 seconds)
let cache: CachedData | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

/**
 * GET /api/pnl
 * Returns P&L KPI data from Google Sheets
 */
async function pnlHandler(request: NextRequest) {
  try {
    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromSession();
    } catch (error) {
      if (error instanceof NotAuthenticatedError) {
        return NextResponse.json(
          { ok: false, error: 'Not authenticated' },
          { status: 401 }
        );
      }
      if (error instanceof NoAccountError) {
        return NextResponse.json(
          { ok: false, error: 'NO_ACCOUNT_FOUND', message: 'No account configured for your email' },
          { status: 403 }
        );
      }
      throw error;
    }

    // Check cache first (using account-specific cache key)
    const cacheKey = `pnl_${account.accountId}`;
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
      console.log('✅ Returning cached P&L data');
      return NextResponse.json({
        ok: true,
        data: cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      });
    }

    console.log('📊 Fetching fresh P&L data from Google Sheets...');
    console.log(`🏢 Company: ${account.companyName}`);
    console.log('🔐 Using account-specific script URL');

    // Fetch data from account's Apps Script endpoint
    // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(account.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'getPnL',
        secret: account.scriptSecret
      }),
      redirect: 'manual'  // Apps Script returns 302 - don't auto-follow
    });

    // Handle Apps Script 302 redirect
    if (response.status === 302) {
      const location = response.headers.get('location');
      if (location) {
        console.log('📍 Following 302 redirect...');
        response = await fetch(location);
      }
    }

    if (!response.ok) {
      console.error('❌ Apps Script returned error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText.substring(0, 200));
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to fetch P&L data: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Apps Script returned non-JSON response (likely HTML error page)');
      console.error('Response preview:', responseText.substring(0, 200));
      
      // Check if it's an HTML error page
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Apps Script not properly deployed',
            message: 'The Apps Script URL is returning an HTML page instead of data. Please ensure the script is deployed as a Web App with "Anyone" access.',
            appsScriptUrl: account.appsScriptUrl
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid response from Apps Script',
          message: 'Expected JSON but received: ' + contentType
        },
        { status: 500 }
      );
    }

    const result = await response.json();

    if (!result.ok) {
      console.error('❌ Apps Script returned error:', result.error);
      return NextResponse.json(
        { 
          ok: false, 
          error: result.error || 'Failed to retrieve P&L data' 
        },
        { status: 500 }
      );
    }

    // Validate data structure
    if (!result.data || !result.data.month || !result.data.year) {
      console.error('❌ Invalid data structure from Apps Script');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Invalid data structure received from P&L endpoint' 
        },
        { status: 500 }
      );
    }

    // Update cache
    cache = {
      data: result.data,
      timestamp: now
    };

    console.log('✅ P&L data fetched and cached successfully');

    // Log warnings and computed fallbacks if present
    if (result.warnings && result.warnings.length > 0) {
      console.warn('⚠️ P&L Warnings:', result.warnings);
    }

    if (result.computedFallbacks && result.computedFallbacks.length > 0) {
      console.log('→ P&L Computed Fallbacks:', result.computedFallbacks);
    }

    return NextResponse.json({
      ok: true,
      data: result.data,
      cached: false,
      warnings: result.warnings || [],
      computedFallbacks: result.computedFallbacks || [],
      matchInfo: result.matchInfo || {}
    });

  } catch (error) {
    console.error('❌ Error in P&L API route:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pnl (optional - for manual cache invalidation)
 * Clears the cache to force fresh data fetch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'clearCache') {
      cache = null;
      console.log('🗑️ P&L cache cleared');
      return NextResponse.json({
        ok: true,
        message: 'Cache cleared successfully'
      });
    }

    return NextResponse.json(
      { 
        ok: false, 
        error: 'Unknown action' 
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error in P&L POST route:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// Apply middleware: security headers → rate limiting → error handling
export const GET = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(pnlHandler),
    RATE_LIMITS.read
  )
);