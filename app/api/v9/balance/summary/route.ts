import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v9/balance/summary
 * Get balance summary for all accounts (new V9 system)
 * 
 * This uses the new double-entry bookkeeping system:
 * - Reads from "Balance Summary" sheet
 * - Shows opening balance + net change = current balance
 * - Includes inflow/outflow for each account
 */
export async function POST(request: NextRequest) {
  try {
    // Get Google Sheets webhook URL for V9 balance system
    const webhookUrl = process.env.SHEETS_V9_BALANCE_URL || process.env.SHEETS_BALANCES_GET_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('V9 Balance webhook not configured');
      return NextResponse.json(
        { error: 'V9 Balance service not configured' },
        { status: 500 }
      );
    }

    console.log('📊 Fetching V9 balance summary from Google Sheets...');

    // Fetch from Google Sheets
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'balanceGetSummary',
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
        { error: 'Failed to fetch balance summary from Google Sheets' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch balance summary' },
        { status: 500 }
      );
    }

    console.log('✅ V9 Balance summary fetched:', data.balances?.length || 0, 'accounts');

    // Calculate totals
    const balances = data.balances || [];
    const totalCurrent = balances.reduce((sum: number, b: any) => sum + (b.currentBalance || 0), 0);
    const totalInflow = balances.reduce((sum: number, b: any) => sum + (b.inflow || 0), 0);
    const totalOutflow = balances.reduce((sum: number, b: any) => sum + (b.outflow || 0), 0);

    // Check for balance drift (inflow should equal outflow in a closed system)
    const drift = totalInflow - totalOutflow;
    const hasDrift = Math.abs(drift) > 1; // Allow 1 THB rounding

    return NextResponse.json({
      ok: true,
      balances: balances,
      summary: {
        totalCurrent,
        totalInflow,
        totalOutflow,
        netChange: totalInflow - totalOutflow,
        accountCount: balances.length,
        hasDrift,
        drift: hasDrift ? drift : 0
      },
      timestamp: data.timestamp || new Date().toISOString()
    });

  } catch (error) {
    console.error('V9 Balance summary error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch balance summary',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v9/balance/summary
 * Same as POST but for convenience
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
