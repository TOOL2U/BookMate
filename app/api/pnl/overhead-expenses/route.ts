import { NextRequest, NextResponse } from 'next/server';

// Cache for overhead expenses data (60 seconds TTL)
let cache: {
  [key: string]: {
    data: any;
    timestamp: number;
  };
} | null = null;

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

  // Check cache first
  const cacheKey = `overhead-${period}`;
  const now = Date.now();
  
  if (cache && cache[cacheKey] && (now - cache[cacheKey].timestamp) < CACHE_DURATION_MS) {
    console.log(`✅ Returning cached overhead expenses (${period}) - ${Date.now() - startTime}ms`);
    return NextResponse.json({
      ...cache[cacheKey].data,
      cached: true,
      cacheAge: Math.floor((now - cache[cacheKey].timestamp) / 1000)
    });
  }

  const scriptUrl = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!scriptUrl) {
    console.error('❌ SHEETS_WEBHOOK_URL is not defined in environment variables');
    return NextResponse.json(
      { ok: false, error: 'Apps Script URL not configured. Please set SHEETS_WEBHOOK_URL in environment variables.' },
      { status: 500 }
    );
  }

  if (!secret) {
    console.error('❌ SHEETS_WEBHOOK_SECRET is not defined in environment variables');
    return NextResponse.json(
      { ok: false, error: 'Webhook secret not configured. Please set SHEETS_WEBHOOK_SECRET in environment variables.' },
      { status: 500 }
    );
  }

  try {
    console.log(`📊 Fetching overhead expenses (${period}) from Google Sheets...`);
    const fetchStart = Date.now();
    
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOverheadExpensesDetails',
        secret: secret,
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

    // Update cache
    if (!cache) cache = {};
    cache[cacheKey] = {
      data: {
        ok: true,
        data: data.data || [],
        period,
        totalExpense: data.totalExpense || 0,
        timestamp: new Date().toISOString(),
      },
      timestamp: now
    };

    console.log(`✅ Overhead expenses (${period}) loaded in ${Date.now() - startTime}ms`);

    return NextResponse.json({
      ok: true,
      data: data.data || [],
      period,
      totalExpense: data.totalExpense || 0,
      timestamp: new Date().toISOString(),
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

    const scriptUrl = process.env.SHEETS_WEBHOOK_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!scriptUrl) {
      console.error('❌ SHEETS_WEBHOOK_URL is not defined in environment variables');
      return NextResponse.json(
        { ok: false, error: 'Apps Script URL not configured. Please set SHEETS_WEBHOOK_URL in environment variables.' },
        { status: 500 }
      );
    }

    if (!secret) {
      console.error('❌ SHEETS_WEBHOOK_SECRET is not defined in environment variables');
      return NextResponse.json(
        { ok: false, error: 'Webhook secret not configured. Please set SHEETS_WEBHOOK_SECRET in environment variables.' },
        { status: 500 }
      );
    }

    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getOverheadExpensesDetails',
        secret: secret,
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
