/**
 * Inbox API Route
 * 
 * GET /api/inbox - Fetch all entries from Google Sheets
 * DELETE /api/inbox - Delete a specific entry by row number
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSpreadsheetId } from '@/lib/middleware/auth';

// Cache for inbox data (30 seconds TTL - balance between freshness and performance)
// Per-user cache to prevent data leakage between users
const inboxCache = new Map<string, {
  data: any[];
  timestamp: number;
}>();

const CACHE_DURATION_MS = 30000; // 30 seconds

/**
 * GET /api/inbox
 * Returns all entries from Google Sheets
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Get user's spreadsheet ID first (for cache isolation)
    const spreadsheetId = await getSpreadsheetId(request);
    console.log('📊 Using spreadsheet:', spreadsheetId);
    
    // Check cache first (user-specific)
    const now = Date.now();
    const cached = inboxCache.get(spreadsheetId);
    if (cached && (now - cached.timestamp) < CACHE_DURATION_MS) {
      console.log(`✅ Returning cached inbox data for ${spreadsheetId} (${Date.now() - startTime}ms)`);
      return NextResponse.json({
        ok: true,
        data: cached.data,
        cached: true,
        cacheAge: Math.floor((now - cached.timestamp) / 1000)
      });
    }

    // Validate environment variables
    const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl) {
      console.error('❌ SHEETS_WEBHOOK_URL not configured');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Webhook endpoint not configured. Please set SHEETS_WEBHOOK_URL in environment variables.' 
        },
        { status: 500 }
      );
    }

    if (!secret) {
      console.error('❌ SHEETS_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Authentication secret not configured.' 
        },
        { status: 500 }
      );
    }

    console.log('📥 Fetching fresh inbox data from Google Sheets...');

    const fetchStart = Date.now();
    
    // Fetch data from Apps Script endpoint
    // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'getInbox',
        secret: secret,
        spreadsheetId: spreadsheetId  // Pass user's spreadsheet ID
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

    // Update cache (user-specific)
    inboxCache.set(spreadsheetId, {
      data: data.data || [],
      timestamp: now
    });

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

    // Validate environment variables
    const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('❌ Webhook not configured');
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Webhook not configured' 
        },
        { status: 500 }
      );
    }

    console.log(`🗑️ Deleting entry at row ${rowNumber}...`);

    // Get user's spreadsheet ID (for cache invalidation)
    const spreadsheetId = await getSpreadsheetId(request);
    console.log('📊 Using spreadsheet:', spreadsheetId);

    // Call Apps Script to delete the row
    // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
    // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
    // because fetch() converts POST to GET when following redirects, losing the body
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'deleteEntry',
        secret: secret,
        rowNumber: rowNumber,
        spreadsheetId: spreadsheetId  // Pass user's spreadsheet ID
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

    // Invalidate cache for this user
    inboxCache.delete(spreadsheetId);

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

