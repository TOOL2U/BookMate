/**
 * GET /api/balance/summary
 * 
 * Fetches balance summary from Google Sheets Balance Summary sheet
 * Uses Apps Script V9 action: balanceGetSummary
 * 
 * Multi-tenant: Uses account-specific scriptUrl and scriptSecret
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
import { getAccountFromRequest, NoAccountError, NotAuthenticatedError } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    console.log('[Balance Summary API] Fetching balance summary from Google Sheets');

    // Authenticate user and get account config
    let account;
    try {
      account = await getAccountFromRequest(request);
      console.log(`[Balance Summary API] Authenticated: ${account.userEmail}, Account: ${account.accountId}`);
    } catch (error) {
      if (error instanceof NotAuthenticatedError) {
        return NextResponse.json(
          { ok: false, error: 'Not authenticated' },
          { status: 401 }
        );
      }
      if (error instanceof NoAccountError) {
        return NextResponse.json(
          { ok: false, error: 'No account found for your email' },
          { status: 403 }
        );
      }
      throw error;
    }

    // Use account-specific webhook URL and secret
    const webhookUrl = account.scriptUrl;
    const secret = account.scriptSecret;

    if (!webhookUrl || !secret) {
      console.error(`[Balance Summary API] Account ${account.accountId} missing scriptUrl or scriptSecret`);
      return NextResponse.json({
        ok: false,
        error: 'Account webhook not configured. Please contact administrator.'
      }, { status: 500 });
    }

    // Get optional month filter from query params
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || 'ALL';

    console.log(`[Balance Summary API] Calling account ${account.accountId} with month: ${month}`);

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

    console.log(`[Balance Summary API] Success for ${account.accountId}:`, {
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
