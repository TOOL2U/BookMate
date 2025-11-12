import { NextRequest, NextResponse } from 'next/server';
import { getUserSpreadsheetId } from '@/lib/middleware/auth';

/**
 * ⚠️ DEPRECATED - Use /api/balance instead
 * 
 * This endpoint is deprecated in favor of the unified balance system.
 * 
 * Migration Guide:
 * - OLD: POST /api/balance/get (calls Google Apps Script webhook)
 * - NEW: GET /api/balance?month=ALL (reads from Balance Summary tab)
 * 
 * The new endpoint:
 * - Reads directly from Balance Summary tab (auto-updated by Apps Script)
 * - Faster response time (no webhook calls)
 * - More reliable (no Apps Script HTTP redirects)
 * - Supports month filtering
 * 
 * This endpoint will be removed in a future version.
 * 
 * @deprecated Use GET /api/balance instead
 */

/**
 * In-memory cache for balance data (LEGACY)
 */
interface CachedBalance {
  data: any;
  timestamp: number;
}

let balanceCache: CachedBalance | null = null;
const CACHE_TTL = 30 * 1000; // 30 seconds

/**
 * Clear the cache (called when balances are updated)
 * Note: This is internal and not exported as it's not a valid Next.js route export
 */
function clearBalanceGetCache() {
  balanceCache = null;
  console.log('🗑️ Balance get cache cleared');
}

/**
 * POST /api/balance/get
 * Get latest balances and reconciliation data from Google Sheets
 */
export async function POST(request: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (balanceCache && (now - balanceCache.timestamp) < CACHE_TTL) {
      return NextResponse.json(balanceCache.data);
    }

    // Get Google Sheets webhook URL
    const webhookUrl = process.env.SHEETS_BALANCES_GET_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('Balance webhook not configured');
      return NextResponse.json(
        { error: 'Balance service not configured' },
        { status: 500 }
      );
    }

    // Fetch from Google Sheets
    // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'balancesGetLatest',
        secret
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
      const errorText = await response.text();
      console.error('Sheets webhook error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch balance from Google Sheets' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch balance' },
        { status: 500 }
      );
    }

    // Cache the response
    balanceCache = {
      data,
      timestamp: now,
    };

    return NextResponse.json(data);

  } catch (error) {
    console.error('Balance get error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch balance',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/balance/get
 * Same as POST but for convenience
 */
export async function GET(request: NextRequest) {
  return POST(request);
}

