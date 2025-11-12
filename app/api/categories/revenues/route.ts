import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling, APIErrors } from '@/lib/api/errors';
import { withSecurityHeaders } from '@/lib/api/security';
import { google } from 'googleapis';
import { getUserSpreadsheetId } from '@/lib/middleware/auth';

const DATA_REVENUE_START_ROW = 2;

function getCredentials() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }
  console.log('[REVENUES] Using credentials from GOOGLE_SERVICE_ACCOUNT_KEY');
  return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
}

async function getHandler(request: NextRequest) {
  try {
    console.log('[REVENUES] Fetching revenue items from Google Sheets...');
    
    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get user's spreadsheet ID from authenticated request
    const spreadsheetId = await getUserSpreadsheetId(request);

    const range = `Data!A${DATA_REVENUE_START_ROW}:A`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const values = response.data.values || [];
    const revenues = values.flat().filter(Boolean);

    console.log(`[REVENUES] Found ${revenues.length} revenue items`);

    return NextResponse.json({
      ok: true,
      data: {
        revenues,
        count: revenues.length,
        source: 'google_sheets',
        sheet: 'Data',
        range: `A${DATA_REVENUE_START_ROW}:A`,
      },
    });
  } catch (error) {
    console.error('[REVENUES] Error fetching revenue items:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to fetch revenue items',
      },
      { status: 500 }
    );
  }
}

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, newValue, oldValue, index } = body;

    const credentials = getCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth });

    // Get user's spreadsheet ID from authenticated request
    const spreadsheetId = await getUserSpreadsheetId(request);

    // Get current revenues
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `Data!A${DATA_REVENUE_START_ROW}:A`,
    });

    let revenues = (getResponse.data.values || []).flat().filter(Boolean);

    if (action === 'add') {
      if (!newValue?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Revenue item name is required' },
          { status: 400 }
        );
      }

      if (revenues.includes(newValue.trim())) {
        return NextResponse.json(
          { ok: false, error: 'Revenue item already exists' },
          { status: 400 }
        );
      }

      revenues.push(newValue.trim());
      console.log(`[REVENUES] Adding new revenue item: ${newValue}`);
      
    } else if (action === 'edit') {
      if (index === undefined || !newValue?.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Index and new value are required' },
          { status: 400 }
        );
      }

      if (revenues[index] !== oldValue) {
        return NextResponse.json(
          { ok: false, error: 'Revenue item has changed, please refresh' },
          { status: 409 }
        );
      }

      if (revenues.includes(newValue.trim()) && newValue.trim() !== oldValue) {
        return NextResponse.json(
          { ok: false, error: 'Revenue item already exists' },
          { status: 400 }
        );
      }

      revenues[index] = newValue.trim();
      console.log(`[REVENUES] Editing revenue item at index ${index}: ${oldValue} → ${newValue}`);
      
    } else if (action === 'delete') {
      if (index === undefined) {
        return NextResponse.json(
          { ok: false, error: 'Index is required' },
          { status: 400 }
        );
      }

      if (revenues[index] !== oldValue) {
        return NextResponse.json(
          { ok: false, error: 'Revenue item has changed, please refresh' },
          { status: 409 }
        );
      }

      console.log(`[REVENUES] Deleting revenue item at index ${index}: ${oldValue}`);
      revenues.splice(index, 1);
    } else {
      return NextResponse.json(
        { ok: false, error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update the sheet
    const updateRange = `Data!A${DATA_REVENUE_START_ROW}:A${DATA_REVENUE_START_ROW + revenues.length - 1}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'RAW',
      requestBody: {
        values: revenues.map(r => [r]),
      },
    });

    // Clear any extra rows if we deleted items
    if (action === 'delete') {
      const clearStart = DATA_REVENUE_START_ROW + revenues.length;
      const clearEnd = clearStart + 10;
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `Data!A${clearStart}:A${clearEnd}`,
      });
    }

    console.log(`[REVENUES] Successfully ${action}ed revenue item. Total: ${revenues.length}`);

    return NextResponse.json({
      ok: true,
      data: {
        revenues,
        count: revenues.length,
      },
    });
  } catch (error) {
    console.error('[REVENUES] Error updating revenue items:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to update revenue items',
      },
      { status: 500 }
    );
  }
}


// Apply middleware: security headers → rate limiting → error handling
export const GET = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(getHandler),
    RATE_LIMITS.read
  )
);

export const POST = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(postHandler),
    RATE_LIMITS.write
  )
);
