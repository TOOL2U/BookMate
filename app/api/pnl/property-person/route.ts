import { NextRequest, NextResponse } from 'next/server';
import { getAccountFromRequest, NoAccountError, NotAuthenticatedError } from '@/lib/api/auth-middleware';

interface PropertyPersonItem {
  name: string;
  expense: number;
  percentage: number;
}

// In-memory cache for property/person data (5 minutes)
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CachedData {
  data: any;
  timestamp: number;
  accountId: string; // Add account ID to cache
}

const cache = new Map<string, CachedData>();

function getCachedData(accountId: string, period: string): any | null {
  const cacheKey = `property-person-${accountId}-${period}`;
  const cached = cache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    console.log(`✅ Returning cached property/person data for ${accountId} (${period}) - ${Date.now() - cached.timestamp}ms old`);
    return cached.data;
  }
  
  return null;
}

function setCachedData(accountId: string, period: string, data: any): void {
  const cacheKey = `property-person-${accountId}-${period}`;
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    accountId
  });
}

async function fetchPropertyPersonData(scriptUrl: string, secret: string, period: string, accountId: string) {
  if (!scriptUrl || !secret) {
    throw new Error('Google Apps Script configuration missing');
  }

  console.log(`🔍 Fetching property/person data for account ${accountId}, period: ${period}`);
  console.log(`📤 Sending to Apps Script:`, {
    action: 'getPropertyPersonDetails',
    period: period,
    secret: '[REDACTED]'
  });

  // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
  // because fetch() converts POST to GET when following redirects, losing the body
  let response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'getPropertyPersonDetails',
      period: period,
      secret: secret
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

  // Handle rate limiting (429)
  if (response.status === 429) {
    console.warn('⚠️ Apps Script rate limit hit - using cached data if available');
    const cached = getCachedData(accountId, period);
    if (cached) {
      return {
        ...cached,
        cached: true,
        rateLimited: true
      };
    }
    throw new Error('Rate limit exceeded and no cached data available');
  }

  if (!response.ok) {
    throw new Error(`Apps Script responded with status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.error || 'Apps Script returned error');
  }

  console.log(`✅ Successfully fetched ${result.data?.length || 0} property/person items`);

  return {
    ok: true,
    success: true,
    data: result.data || [],
    period: period,
    totalExpense: result.totalExpense || 0,
    timestamp: new Date().toISOString()
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';

    if (!period || !['month', 'year'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be "month" or "year".' },
        { status: 400 }
      );
    }

    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromRequest(request);
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

    // Check if account has Apps Script URL configured
    if (!account.scriptUrl || !account.scriptSecret) {
      console.warn(`⚠️ Account ${account.accountId} missing Apps Script configuration`);
      return NextResponse.json(
        {
          ok: false,
          error: 'ACCOUNT_NOT_CONFIGURED',
          message: 'Your account has been created but not fully configured yet. Please contact your administrator to complete the setup with your Google Sheet and Apps Script URL.',
          data: []
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Check cache first (account-specific)
    const cachedData = getCachedData(account.accountId, period);
    if (cachedData) {
      return NextResponse.json({
        ...cachedData,
        cached: true
      });
    }

    // Fetch fresh data using account's Apps Script URL
    const result = await fetchPropertyPersonData(
      account.scriptUrl,
      account.scriptSecret,
      period,
      account.accountId
    );
    
    // Cache the result (account-specific)
    setCachedData(account.accountId, period, result);
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Property/Person API Error:', error);

    // Try to return cached data even if it's old
    try {
      const account = await getAccountFromRequest(request);
      const period = new URL(request.url).searchParams.get('period') || 'month';
      const staleCache = cache.get(`property-person-${account.accountId}-${period}`);
      
      if (staleCache) {
        console.log('⚠️ Returning stale cached data due to error');
        return NextResponse.json({
          ...staleCache.data,
          cached: true,
          stale: true,
          warning: 'Using cached data due to API error'
        });
      }
    } catch {
      // Ignore errors getting account for fallback
    }

    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch property/person data',
        data: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const period = body.period || 'month';

    if (!period || !['month', 'year'].includes(period)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid period. Must be "month" or "year".'
        },
        { status: 400 }
      );
    }

    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromRequest(request);
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

    // Fetch fresh data using account's Apps Script URL
    const result = await fetchPropertyPersonData(
      account.scriptUrl,
      account.scriptSecret,
      period,
      account.accountId
    );
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Property/Person API Error:', error);

    return NextResponse.json(
      {
        ok: false,
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch property/person data',
        data: []
      },
      { status: 500 }
    );
  }
}