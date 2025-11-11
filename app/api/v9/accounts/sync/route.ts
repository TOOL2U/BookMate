import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v9/accounts/sync
 * Sync accounts from /api/options (type-of-payments from Data sheet)
 * 
 * This ensures the Accounts sheet stays in sync with payment types
 * Should be called:
 * - When a new payment type is added in Settings
 * - Periodically (daily via Apps Script trigger)
 * - On-demand when user clicks "Sync Accounts"
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Syncing V9 accounts from type-of-payments...');

    // Get Google Sheets webhook URL (Balance Sheet deployment)
    const webhookUrl = process.env.SHEETS_BALANCE_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('SHEETS_BALANCE_URL not configured');
      return NextResponse.json(
        { error: 'SHEETS_BALANCE_URL not configured' },
        { status: 500 }
      );
    }

    // Call Apps Script to sync accounts
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'accountsSync',
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
        { error: 'Failed to sync accounts in Google Sheets' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('❌ Accounts sync failed:', data.error);
      return NextResponse.json(
        { error: data.error || 'Failed to sync accounts' },
        { status: 500 }
      );
    }

    console.log('✅ Accounts synced:', data.addedAccounts, 'new accounts added');

    return NextResponse.json({
      ok: true,
      message: 'Accounts synced successfully',
      totalAccounts: data.totalAccounts,
      addedAccounts: data.addedAccounts,
      timestamp: data.timestamp
    });

  } catch (error) {
    console.error('V9 Accounts sync error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to sync accounts',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v9/accounts/sync
 * Same as POST for convenience
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
