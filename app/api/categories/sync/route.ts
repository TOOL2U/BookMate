import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';

/**
 * POST /api/categories/sync
 * Sync local category changes back to Google Sheets
 * 
 * NOTE: This feature is not available in production (Vercel).
 * Category changes should be made directly in Google Sheets.
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[SYNC] Category sync requested');

    // Check if we're in a serverless environment (Vercel)
    const isServerless = !fs.existsSync(path.join(process.cwd(), 'config'));

    if (isServerless) {
      console.log('[SYNC] Running in serverless environment - sync not available');
      return NextResponse.json(
        {
          ok: false,
          error: 'Category sync is not available in production. Please update categories directly in your Google Sheet.',
          message: 'To update categories:\n1. Open your Google Sheet\n2. Navigate to the FORM LOOKUP sheet\n3. Update the category columns\n4. Changes will be automatically picked up by the app'
        },
        { status: 400 }
      );
    }

    console.log('[SYNC] Starting category sync to Google Sheets...');

    // Read current config
    const configPath = path.join(process.cwd(), 'config', 'live-dropdowns.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { ok: false, error: 'Config file not found' },
        { status: 500 }
      );
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    // Setup Google Sheets API
    const credentialsPath = path.join(process.cwd(), 'config', 'google-credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      return NextResponse.json(
        { ok: false, error: 'Google credentials not found. Please run sync-sheets.js first.' },
        { status: 500 }
      );
    }

    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { ok: false, error: 'GOOGLE_SHEET_ID not configured in environment' },
        { status: 500 }
      );
    }

    // Get the ranges from config
    const ranges = config.ranges || {};
    const updates: any[] = [];

    // Helper function to calculate dynamic range based on data length
    const calculateRange = (baseRange: string, itemCount: number) => {
      // Extract sheet name and starting cell (e.g., "Data!A38:A43" -> "Data", "A38")
      const [sheet, cellRange] = baseRange.split('!');
      const [startCell] = cellRange.split(':');
      const column = startCell.replace(/[0-9]/g, ''); // Extract column letter
      const startRow = parseInt(startCell.replace(/[A-Z]/g, '')); // Extract starting row
      const endRow = startRow + itemCount - 1;
      return `${sheet}!${column}${startRow}:${column}${endRow}`;
    };

    // Prepare updates for each category type
    if (config.property && ranges.property) {
      const propertyValues = config.property.map((item: string) => [item]);
      const dynamicRange = calculateRange(ranges.property, propertyValues.length);
      updates.push({
        range: dynamicRange,
        values: propertyValues
      });
      console.log(`[SYNC] Prepared ${propertyValues.length} properties for sync to ${dynamicRange}`);
    }

    if (config.typeOfOperation && ranges.typeOfOperation) {
      const operationValues = config.typeOfOperation.map((item: string) => [item]);
      const dynamicRange = calculateRange(ranges.typeOfOperation, operationValues.length);
      updates.push({
        range: dynamicRange,
        values: operationValues
      });
      console.log(`[SYNC] Prepared ${operationValues.length} operations for sync to ${dynamicRange}`);
    }

    if (config.typeOfPayment && ranges.typeOfPayment) {
      const paymentValues = config.typeOfPayment.map((item: string) => [item]);
      const dynamicRange = calculateRange(ranges.typeOfPayment, paymentValues.length);
      updates.push({
        range: dynamicRange,
        values: paymentValues
      });
      console.log(`[SYNC] Prepared ${paymentValues.length} payments for sync to ${dynamicRange}`);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No data to sync' },
        { status: 400 }
      );
    }

    // Clear existing ranges first (to handle deletions)
    console.log('[SYNC] Clearing existing ranges...');
    for (const update of updates) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: update.range,
      });
    }

    // Batch update all ranges
    console.log('[SYNC] Writing new values to Google Sheets...');
    const batchUpdateResponse = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates,
      },
    });

    console.log('[SYNC] Successfully synced to Google Sheets');
    console.log(`[SYNC] Updated ${batchUpdateResponse.data.totalUpdatedCells} cells`);

    // Update config to mark as synced
    config.lastSyncedToSheets = new Date().toISOString();
    config.source = 'synced_to_sheets';
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');

    return NextResponse.json({
      ok: true,
      message: 'Successfully synced categories to Google Sheets',
      data: {
        updatedRanges: updates.length,
        totalCells: batchUpdateResponse.data.totalUpdatedCells,
        syncedAt: config.lastSyncedToSheets,
        details: {
          properties: config.property?.length || 0,
          operations: config.typeOfOperation?.length || 0,
          payments: config.typeOfPayment?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('[SYNC] Error syncing to Google Sheets:', error);
    
    // Provide more detailed error message
    let errorMessage = 'Failed to sync to Google Sheets';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for common errors
      if (errorMessage.includes('credentials')) {
        errorMessage = 'Google Sheets authentication failed. Please check your credentials.';
      } else if (errorMessage.includes('PERMISSION_DENIED')) {
        errorMessage = 'Permission denied. Please ensure the service account has edit access to the sheet.';
      } else if (errorMessage.includes('SHEET_NOT_FOUND')) {
        errorMessage = 'Google Sheet not found. Please check the GOOGLE_SHEET_ID.';
      }
    }

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
 * GET /api/categories/sync
 * Check sync status
 */
export async function GET(request: NextRequest) {
  try {
    const configPath = path.join(process.cwd(), 'config', 'live-dropdowns.json');
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { ok: false, error: 'Config file not found' },
        { status: 500 }
      );
    }

    const fileContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(fileContent);

    const lastSynced = config.lastSyncedToSheets || null;
    const lastModified = config.fetchedAt || null;
    const needsSync = config.source === 'webapp_edit' || config.source === 'webapp_bulk_edit';

    return NextResponse.json({
      ok: true,
      data: {
        lastSynced,
        lastModified,
        needsSync,
        source: config.source,
        counts: {
          properties: config.property?.length || 0,
          operations: config.typeOfOperation?.length || 0,
          payments: config.typeOfPayment?.length || 0
        }
      }
    });

  } catch (error) {
    console.error('[SYNC] Error checking sync status:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Failed to check sync status'
      },
      { status: 500 }
    );
  }
}

