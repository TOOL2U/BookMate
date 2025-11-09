// Vercel / Next runtime config
export const runtime = 'nodejs';            // ensure Node (googleapis works best here)
export const dynamic = 'force-dynamic';     // do not try to cache at build
export const maxDuration = 60;              // ask Vercel for max allowed (Pro plans give more than 30s)

import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// In-memory cache for balance data (60 seconds)
interface BalanceCacheEntry {
  data: any;
  timestamp: number;
}
const balanceCache = new Map<string, BalanceCacheEntry>();
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

function getCachedBalance(month: string): any | null {
  const cached = balanceCache.get(month);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION_MS) {
    return cached.data;
  }
  return null;
}

function setCachedBalance(month: string, data: any): void {
  balanceCache.set(month, { data, timestamp: Date.now() });
}

// small helper: hard timeout
function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>((_, rej) =>
    (t = setTimeout(() => rej(new Error(label)), ms))
  );
  return Promise.race([p, timeout]).finally(() => clearTimeout(t));
}

// read required env once
const SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const SA_KEY_JSON = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY;

function buildAuth() {
  // Prefer the single-line JSON if provided; otherwise fall back to separate vars.
  if (SA_KEY_JSON) {
    const creds = JSON.parse(SA_KEY_JSON);
    // IMPORTANT: convert escaped newlines to real newlines
    if (creds.private_key) {
      creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    }
    return new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
  }
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing service account credentials (GOOGLE_SERVICE_ACCOUNT_KEY or CLIENT vars).');
  }
  // IMPORTANT: convert literal \n to real newlines if they exist
  const key = PRIVATE_KEY.replace(/\\n/g, '\n');
  return new google.auth.JWT({
    email: CLIENT_EMAIL,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const month = (url.searchParams.get('month') || 'ALL').toUpperCase();
  const skipCache = url.searchParams.has('t'); // Cache-busting: if ?t= param exists, skip cache

  // Check cache first (unless cache-busting param is present)
  if (!skipCache) {
    const cached = getCachedBalance(month);
    if (cached) {
      console.log(`✅ [Balance API] Returning cached data for month: ${month}`);
      return NextResponse.json({
        ...cached,
        cached: true,
        cacheAge: Math.floor((Date.now() - balanceCache.get(month)!.timestamp) / 1000)
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
        }
      });
    }
  } else {
    console.log(`🔄 [Balance API] Cache-busting enabled, fetching fresh data for month: ${month}`);
  }

  const start = Date.now();
  try {
    const auth = buildAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Read ONLY the cells we need from Balance Summary (fast ranges)
    // Headers are in row 3, data from row 4 down. A:H is the 8 columns we expose.
    const RANGE = `'Balance Summary'!A3:H50`; // Reduced from 200 to 50 rows for faster fetch

    const res = await withTimeout(
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: RANGE,
        valueRenderOption: 'UNFORMATTED_VALUE',
        dateTimeRenderOption: 'FORMATTED_STRING',
      }),
      25000, // Increased from 8s to 25s to allow Google Sheets more time
      'sheets/balanceSummary timeout'
    );

    const rows = res.data.values || [];
    if (rows.length < 2) {
      // header + zero data rows
      return NextResponse.json({
        ok: true,
        source: 'BalanceSummary',
        month,
        items: [],
        totals: { netChange: 0, currentBalance: 0, inflow: 0, outflow: 0 },
        durationMs: Date.now() - start,
      });
    }

    // row[0] is headers from A3:H3
    const header = rows[0].map((h: any) => (h || '').toString().trim().toLowerCase());
    const idx = (name: string) => header.findIndex((h: string) => h.includes(name));

    const iAccount = idx('accountname');
    const iOpen    = idx('opening');
    const iNet     = idx('netchange');
    const iCurrent = idx('currentbalance');
    const iLast    = idx('lasttxn');
    const iInflow  = idx('inflow');
    const iOutflow = idx('outflow');

    const items = rows.slice(1) // data rows
      .filter((r: any[]) => (r[iAccount] ?? '') !== '')
      .map((r: any[]) => ({
        accountName: r[iAccount] ?? '',
        openingBalance: Number(r[iOpen] ?? 0),
        netChange: Number(r[iNet] ?? 0),
        currentBalance: Number(r[iCurrent] ?? 0),
        lastTxnAt: r[iLast] ?? '',
        inflow: Number(r[iInflow] ?? 0),
        outflow: Number(r[iOutflow] ?? 0),
        note: '' // optional
      }));

    // optional month filter (client still passes ?month=ALL/JAN/…)
    const filtered = month === 'ALL'
      ? items
      : items; // if you later put a month column in Balance Summary, filter here

    // quick totals
    const totals = filtered.reduce((acc, it) => ({
      netChange: acc.netChange + it.netChange,
      currentBalance: acc.currentBalance + it.currentBalance,
      inflow: acc.inflow + it.inflow,
      outflow: acc.outflow + it.outflow,
    }), { netChange: 0, currentBalance: 0, inflow: 0, outflow: 0 });

    const responseData = {
      ok: true,
      source: 'BalanceSummary',
      month,
      items: filtered,
      totals,
      durationMs: Date.now() - start,
      cached: false
    };

    // Cache the response
    setCachedBalance(month, responseData);

    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    });

  } catch (err: any) {
    // If the issue was a timeout, return 504 quickly (prevents Vercel 30s kill)
    const isTimeout = /timeout/i.test(err?.message || '');
    console.error('[Balance API] Error:', err?.message || err);
    return NextResponse.json({
      ok: false,
      error: isTimeout ? 'UPSTREAM_TIMEOUT' : 'UNEXPECTED_ERROR',
      detail: err?.message || String(err),
      durationMs: Date.now() - start,
    }, { status: isTimeout ? 504 : 500 });
  }
}
