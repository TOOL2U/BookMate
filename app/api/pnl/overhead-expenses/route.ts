import { NextRequest, NextResponse } from 'next/server';
import { getAccountFromSession, NoAccountError, NotAuthenticatedError } from '@/lib/api/account-helper';

// Cache for overhead expenses data (60 seconds TTL) - account-specific
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION_MS = 60000; // 60 seconds

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') as 'month' | 'year' | null;

  if (!period || !['month', 'year'].includes(period)) {
    return NextResponse.json(
      { ok: false, error: 'Invalid period parameter. Must be "month" or "year".' },
      { status: 400 }
    );
  }

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

  // Check if account has Apps Script URL configured
  if (!account.scriptUrl || !account.scriptSecret) {
    console.warn(`⚠️ Account ${account.accountId} missing Apps Script configuration`);
    return NextResponse.json(
      {
        ok: false,
        error: 'ACCOUNT_NOT_CONFIGURED',
        message: 'Your account has been created but not fully configured yet. Please contact your administrator to complete the setup with your Google Sheet and Apps Script URL.',
        data: [],
        period,
        totalExpense: 0
      },
      { status: 503 } // Service Unavailable
    );
  }

  // Check cache first (account-specific)
  const cacheKey = `overhead-${account.accountId}-${period}`;
  const now = Date.now();
  const cached = cache.get(cacheKey);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
    console.log(`✅ Returning cached overhead expenses (${period}) - ${Date.now() - startTime}ms`);
    return NextResponse.json({
      ...cached.data,
      cached: true,
      cacheAge: Math.floor((now - cached.timestamp) / 1000)
    });
  }

  try {
    console.log(`📊 Fetching overhead expenses (${period}) from Google Sheets...`);
    const fetchStart = Date.now();
    
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(account.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOverheadExpensesDetails',
        secret: account.scriptSecret,
        period,
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
      throw new Error(`Apps Script responded with status: ${response.status}`);
    }

    const data = await response.json();

    const fetchTime = Date.now() - fetchStart;
    console.log(`⏱️ Overhead expenses (${period}) fetch took ${fetchTime}ms`);

    // Update cache (account-specific)
    const responseData = {
      ok: true,
      data: data.data || [],
      period,
      totalExpense: data.totalExpense || 0,
      timestamp: new Date().toISOString(),
    };
    
    cache.set(cacheKey, {
      data: responseData,
      timestamp: now
    });

    console.log(`✅ Overhead expenses (${period}) loaded in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      ...responseData,
      cached: false,
      fetchTime: fetchTime
    });
  } catch (error) {
    console.error('Error fetching overhead expenses details:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch overhead expenses data' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { period } = body;

    if (!period || !['month', 'year'].includes(period)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid period parameter. Must be "month" or "year".' },
        { status: 400 }
      );
    }

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

    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(account.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOverheadExpensesDetails',
        secret: account.scriptSecret,
        period,
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
      throw new Error(`Apps Script responded with status: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      ok: true,
      data: data.data || [],
      period,
      totalExpense: data.totalExpense || 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching overhead expenses details:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch overhead expenses data' 
      },
      { status: 500 }
    );
  }
}
