/**
 * Admin endpoint to discover and list all named ranges from Google Sheets
 * 
 * GET /api/pnl/namedRanges
 * 
 * Multi-tenant: Uses account-specific scriptUrl and scriptSecret
 * 
 * This endpoint calls the Apps Script discovery endpoint to fetch all named ranges
 * and returns them in a formatted JSON response for debugging and verification.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccountFromRequest, NoAccountError, NotAuthenticatedError } from '@/lib/api/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    console.log('[NAMED_RANGES] Discovery request received');
    
    // Authenticate user and get account config
    let account;
    try {
      account = await getAccountFromRequest(request);
      console.log(`[NAMED_RANGES] Authenticated: ${account.userEmail}, Account: ${account.accountId}`);
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
    const pnlUrl = account.scriptUrl;
    const secret = account.scriptSecret;
    
    // Validate configuration
    if (!pnlUrl || !secret) {
      console.error(`[NAMED_RANGES] Account ${account.accountId} missing scriptUrl or scriptSecret`);
      return NextResponse.json({
        ok: false,
        error: 'Account webhook not configured. Please contact administrator.'
      }, { status: 500 });
    }
    
    console.log(`[NAMED_RANGES] Calling Apps Script for account ${account.accountId}...`);
    console.log('[NAMED_RANGES] URL:', pnlUrl.substring(0, 50) + '...');
    
    // Call Apps Script discovery endpoint
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(pnlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list_named_ranges',
        secret: secret
      }),
      redirect: 'manual'  // Apps Script returns 302 - don't auto-follow
    });

    console.log('[NAMED_RANGES] Apps Script response status:', response.status);

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
      console.error('[NAMED_RANGES] Apps Script error:', errorText);
      return NextResponse.json({
        ok: false,
        error: `Apps Script returned ${response.status}: ${errorText}`
      }, { status: response.status });
    }
    
    // Parse response
    const result = await response.json();
    
    console.log(`[NAMED_RANGES] Discovery successful for ${account.accountId}`);
    console.log('[NAMED_RANGES] Total ranges:', result.totalRanges);
    console.log('[NAMED_RANGES] P&L-related ranges:', result.pnlRelatedCount);
    
    // Return formatted response
    return NextResponse.json({
      ok: true,
      ...result,
      accountId: account.accountId,
      endpoint: pnlUrl,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[NAMED_RANGES] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to discover named ranges'
    }, { status: 500 });
  }
}

/**
 * POST endpoint to clear cache and force fresh discovery
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[NAMED_RANGES] Force refresh request received');
    
    // Authenticate user and get account config
    let account;
    try {
      account = await getAccountFromRequest(request);
      console.log(`[NAMED_RANGES] Authenticated: ${account.userEmail}, Account: ${account.accountId}`);
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
    const pnlUrl = account.scriptUrl;
    const secret = account.scriptSecret;
    
    if (!pnlUrl || !secret) {
      console.error(`[NAMED_RANGES] Account ${account.accountId} missing scriptUrl or scriptSecret`);
      return NextResponse.json({
        ok: false,
        error: 'Account webhook not configured'
      }, { status: 500 });
    }
    
    // Note: Apps Script cache is managed server-side
    // This endpoint just forces a fresh fetch by calling the discovery endpoint
    
    console.log(`[NAMED_RANGES] Calling Apps Script for account ${account.accountId} (fresh)...`);

    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(pnlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'list_named_ranges',
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[NAMED_RANGES] Apps Script error:', errorText);
      return NextResponse.json({
        ok: false,
        error: `Apps Script returned ${response.status}: ${errorText}`
      }, { status: response.status });
    }
    
    const result = await response.json();
    
    console.log(`[NAMED_RANGES] Fresh discovery successful for ${account.accountId}`);
    
    return NextResponse.json({
      ok: true,
      ...result,
      accountId: account.accountId,
      refreshed: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('[NAMED_RANGES] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error.message || 'Failed to refresh named ranges'
    }, { status: 500 });
  }
}

