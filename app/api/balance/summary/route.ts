/**
 * GET /api/balance/summary
 * 
 * Fetches balance summary from Google Sheets Balance Summary sheet
 * Uses Apps Script V9 action: balanceGetSummary
 * 
 * Returns:
 * {
 *   ok: true,
 *   data: {
 *     accounts: [
 *       {
 *         account: string,
 *         opening: number,
 *         netChange: number,
 *         inflow: number,
 *         outflow: number,
 *         currentBalance: number
 *       }
 *     ],
 *     selectedMonth: string,
 *     totalBalance: number
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Balance Summary API] Fetching balance summary from Google Sheets');

    // Use SHEETS_BALANCE_URL for V9 balance operations
    const webhookUrl = process.env.SHEETS_BALANCE_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('[Balance Summary API] Missing environment variables');
      return NextResponse.json({
        ok: false,
        error: 'Server configuration error: Missing SHEETS_BALANCE_URL or secret'
      }, { status: 500 });
    }

    // Get optional month filter from query params
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 'ALL';

    console.log('[Balance Summary API] Calling Apps Script with month:', month);

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'BookMate-WebApp/1.0'
      },
      body: JSON.stringify({
        action: 'balanceGetSummary',
        secret: secret,
        month: month
      })
    });

    if (!response.ok) {
      console.error('[Balance Summary API] Apps Script error:', response.status, response.statusText);
      return NextResponse.json({
        ok: false,
        error: `Apps Script returned error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const data = await response.json();

    console.log('[Balance Summary API] Success:', {
      accountCount: data.data?.accounts?.length || 0,
      totalBalance: data.data?.totalBalance || 0
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('[Balance Summary API] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to fetch balance summary'
    }, { status: 500 });
  }
}
