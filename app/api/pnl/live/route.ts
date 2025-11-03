import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

/**
 * Live P&L Data API Route - Formula-Based from Lists Sheet
 * 
 * Fetches data directly from the Lists sheet which contains normalized
 * pivot data with ARRAYFORMULA + VLOOKUP. This ensures webapp values
 * match spreadsheet formulas exactly.
 * 
 * Update Frequency: 5-minute cache
 * Data Source: Lists sheet (H:J, M:O, R:T, W:Y blocks)
 * Categories: Data!A2:D
 */

// Type definitions
interface CategoryRow {
  name: string;
  monthly: number[];
  yearTotal: number;
}

interface BlockData {
  revenue: CategoryRow[];
  overhead: CategoryRow[];
  property: CategoryRow[];
  payment: CategoryRow[];
}

interface TotalData {
  monthly: number[];
  yearTotal: number;
}

interface Totals {
  revenue: TotalData;
  overhead: TotalData;
  property: TotalData;
  payment: TotalData;
  grand: TotalData;
}

interface PnLLiveResponse {
  months: string[];
  blocks: BlockData;
  totals: Totals;
  updatedAt: string;
  cached?: boolean;
  cacheAge?: number;
}

interface CachedData {
  data: PnLLiveResponse;
  timestamp: number;
}

// In-memory cache (5 minutes)
let cache: CachedData | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/pnl/live
 * Returns live P&L data from Lists sheet with formula-accurate values
 */
export async function GET(request: NextRequest) {
  try {
    // Check cache first
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
      console.log('✅ Returning cached P&L live data');
      return NextResponse.json({
        ...cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      });
    }

    console.log('📊 Fetching fresh P&L live data from Lists sheet...');

    // Validate environment variables
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!serviceAccountKey) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not configured');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Service account credentials not configured' 
        },
        { status: 500 }
      );
    }

    if (!spreadsheetId) {
      console.error('❌ GOOGLE_SHEET_ID not configured');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Spreadsheet ID not configured' 
        },
        { status: 500 }
      );
    }

    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(serviceAccountKey),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch all required ranges in a single batch request
    const { data } = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      valueRenderOption: 'UNFORMATTED_VALUE',
      ranges: [
        // Category columns from Data sheet
        'Data!A2:A',  // 0: Revenue categories
        'Data!B2:B',  // 1: Overhead categories
        'Data!C2:C',  // 2: Property/Person categories
        'Data!D2:D',  // 3: Payment type categories
        
        // Lists sheet: Overhead Expenses (H:J)
        'Lists!H:H',  // 4: Overhead category
        'Lists!I:I',  // 5: Overhead month
        'Lists!J:J',  // 6: Overhead value
        
        // Lists sheet: Property/Person (M:O)
        'Lists!M:M',  // 7: Property category
        'Lists!N:N',  // 8: Property month
        'Lists!O:O',  // 9: Property value
        
        // Lists sheet: Payment Type (R:T)
        'Lists!R:R',  // 10: Payment category
        'Lists!S:S',  // 11: Payment month
        'Lists!T:T',  // 12: Payment value
        
        // Lists sheet: Revenue (W:Y)
        'Lists!W:W',  // 13: Revenue category
        'Lists!X:X',  // 14: Revenue month
        'Lists!Y:Y',  // 15: Revenue value
        
        // Month headers from P&L sheet
        "'P&L (DO NOT EDIT)'!4:4"  // 16: Month headers (E:P range)
      ],
    });

    // Helper to extract flat array from range
    const get = (index: number): any[] => {
      return (data.valueRanges?.[index]?.values ?? []).flat();
    };

    // Extract category lists
    const revCats = get(0).map(String).filter(Boolean);
    const ohCats = get(1).map(String).filter(Boolean);
    const prCats = get(2).map(String).filter(Boolean);
    const payCats = get(3).map(String).filter(Boolean);

    console.log(`📋 Categories: Revenue=${revCats.length}, Overhead=${ohCats.length}, Property=${prCats.length}, Payment=${payCats.length}`);

    // Extract Lists sheet blocks
    const blocks = {
      overhead: { cat: get(4), mon: get(5), val: get(6) },
      property: { cat: get(7), mon: get(8), val: get(9) },
      payment: { cat: get(10), mon: get(11), val: get(12) },
      revenue: { cat: get(13), mon: get(14), val: get(15) },
    };

    // Extract month headers (E:P = columns 4-15, indexes 4-15)
    const monthRow = get(16) as any[];
    const months = monthRow.slice(4, 16).map(String); // JAN, FEB, MAR, etc.
    const monthKeys = months.map(m => m.toUpperCase());
    
    // Create month index map (JAN => 0, FEB => 1, etc.)
    const monthIndex: Record<string, number> = Object.fromEntries(
      monthKeys.map((m, i) => [m, i])
    );

    console.log(`📅 Months: ${months.join(', ')}`);

    // Format a block (overhead/property/payment/revenue) into CategoryRow[]
    const formatBlock = (
      block: { cat: any[], mon: any[], val: any[] },
      categories: string[]
    ): CategoryRow[] => {
      return categories.map(name => {
        const monthly = Array(12).fill(0);
        
        // Aggregate values for this category across all months
        for (let i = 0; i < block.cat.length; i++) {
          const c = String(block.cat[i] || '').trim();
          const m = String(block.mon[i] || '').trim();
          const v = Number(block.val[i] || 0);
          
          if (c === name && monthIndex[m] != null) {
            monthly[monthIndex[m]] += v;
          }
        }
        
        const yearTotal = monthly.reduce((a, b) => a + b, 0);
        return { name, monthly, yearTotal };
      });
    };

    // Format all four blocks
    const revenue = formatBlock(blocks.revenue, revCats);
    const overhead = formatBlock(blocks.overhead, ohCats);
    const property = formatBlock(blocks.property, prCats);
    const payment = formatBlock(blocks.payment, payCats);

    console.log(`✅ Formatted blocks: Revenue=${revenue.length}, Overhead=${overhead.length}, Property=${property.length}, Payment=${payment.length}`);

    // Calculate totals for each block
    const sumCols = (arr: CategoryRow[]): TotalData => {
      const monthly = Array(12).fill(0);
      arr.forEach(row => {
        row.monthly.forEach((value, index) => {
          monthly[index] += value;
        });
      });
      const yearTotal = monthly.reduce((a, b) => a + b, 0);
      return { monthly, yearTotal };
    };

    const totals: Totals = {
      revenue: sumCols(revenue),
      overhead: sumCols(overhead),
      property: sumCols(property),
      payment: sumCols(payment),
      grand: { monthly: [], yearTotal: 0 }, // Will calculate below
    };

    // Calculate grand totals (sum of all blocks)
    const grandMonthly = totals.revenue.monthly.map((_, i) =>
      totals.revenue.monthly[i] +
      totals.overhead.monthly[i] +
      totals.property.monthly[i] +
      totals.payment.monthly[i]
    );

    totals.grand = {
      monthly: grandMonthly,
      yearTotal: grandMonthly.reduce((a, b) => a + b, 0),
    };

    console.log(`💰 Totals - Revenue: ฿${totals.revenue.yearTotal.toLocaleString()}, Overhead: ฿${totals.overhead.yearTotal.toLocaleString()}, Property: ฿${totals.property.yearTotal.toLocaleString()}, Payment: ฿${totals.payment.yearTotal.toLocaleString()}`);

    // Build response
    const responseData: PnLLiveResponse = {
      months,
      blocks: { revenue, overhead, property, payment },
      totals,
      updatedAt: new Date().toISOString(),
    };

    // Update cache
    cache = {
      data: responseData,
      timestamp: now,
    };

    console.log('✅ P&L live data fetched and cached successfully');

    return NextResponse.json({
      ...responseData,
      cached: false,
    });

  } catch (error) {
    console.error('❌ Error in P&L live API route:', error);
    
    // Provide detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    
    return NextResponse.json(
      { 
        ok: false, 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pnl/live (optional - for manual cache invalidation)
 * Clears the cache to force fresh data fetch
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (body.action === 'clearCache') {
      cache = null;
      console.log('🗑️ P&L live cache cleared');
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
    console.error('❌ Error in P&L live POST route:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
