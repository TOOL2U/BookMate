/**
 * Inbox API Route
 * 
 * GET /api/inbox - Fetch all entries from Google Sheets
 * DELETE /api/inbox - Delete a specific entry by row number
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccountFromRequest, NoAccountError, NotAuthenticatedError } from '@/lib/api/auth-middleware';

// Cache for inbox data (30 seconds TTL - balance between freshness and performance)
let cache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION_MS = 30000; // 30 seconds

/**
 * GET /api/inbox
 * Returns all entries from Google Sheets
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromRequest(request);
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

    // Check cache first (account-specific)
    const cacheKey = `inbox_${account.accountId}`;
    const now = Date.now();
    if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
      console.log(`✅ Returning cached inbox data for ${account.companyName} (${Date.now() - startTime}ms)`);
      return NextResponse.json({
        ok: true,
        data: cache.data,
        cached: true,
        cacheAge: Math.floor((now - cache.timestamp) / 1000)
      });
    }

    console.log(`📥 Fetching fresh inbox data for ${account.companyName}...`);

    const fetchStart = Date.now();
    
    // Fetch data from account's Apps Script endpoint
    // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(account.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'getInbox',
        secret: account.scriptSecret
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
      console.error('❌ Apps Script returned error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText.substring(0, 200));
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to fetch inbox data: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const responseText = await response.text();
      console.error('❌ Apps Script returned non-JSON response (likely HTML error page)');
      console.error('Response preview:', responseText.substring(0, 200));
      
      // Check if it's an HTML error page
      if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
        return NextResponse.json(
          {
            ok: false,
            error: 'Apps Script not properly deployed',
            message: 'The Apps Script URL is returning an HTML page instead of data. Please ensure the script is deployed as a Web App with "Anyone" access.',
            appsScriptUrl: account.appsScriptUrl
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid response from Apps Script',
          message: 'Expected JSON but received: ' + contentType
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    const fetchTime = Date.now() - fetchStart;
    console.log(`⏱️ Google Sheets fetch took ${fetchTime}ms`);

    if (!data.ok) {
      console.error('❌ Apps Script returned error:', data.error);
      return NextResponse.json(
        { 
          ok: false, 
          error: data.error || 'Failed to fetch inbox data' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Fetched ${data.count || 0} entries from Google Sheets (total: ${Date.now() - startTime}ms)`);

    // Update cache
    cache = {
      data: data.data || [],
      timestamp: now
    };

    return NextResponse.json({
      ok: true,
      data: data.data || [],
      count: data.count || 0,
      cached: false,
      fetchTime: fetchTime,
      totalTime: Date.now() - startTime
    });

  } catch (error) {
    console.error('❌ Inbox API error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to fetch inbox data. Please try again.' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/inbox
 * Deletes a specific entry by row number
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { rowNumber } = body;

    if (!rowNumber) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Row number is required' 
        },
        { status: 400 }
      );
    }

    // Get account config for authenticated user
    let account;
    try {
      account = await getAccountFromRequest(request);
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

    console.log(`🗑️ Deleting entry at row ${rowNumber} for ${account.companyName}...`);

    // Call Apps Script to delete the row
    // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(account.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'deleteEntry',
        secret: account.scriptSecret,
        rowNumber: rowNumber
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
      console.error('❌ Apps Script returned error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText.substring(0, 200));
      return NextResponse.json(
        {
          ok: false,
          error: `Failed to delete entry: ${response.statusText}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('❌ Apps Script returned error:', data.error);
      return NextResponse.json(
        { 
          ok: false, 
          error: data.error || 'Failed to delete entry' 
        },
        { status: 500 }
      );
    }

    console.log(`✅ Deleted entry at row ${rowNumber}`);

    // Invalidate cache
    cache = null;

    return NextResponse.json({
      ok: true,
      success: true,
      message: 'Entry deleted successfully',
      deletedRow: rowNumber
    });

  } catch (error) {
    console.error('❌ Delete API error:', error);
    return NextResponse.json(
      { 
        ok: false,
        error: 'Failed to delete entry. Please try again.' 
      },
      { status: 500 }
    );
  }
}

