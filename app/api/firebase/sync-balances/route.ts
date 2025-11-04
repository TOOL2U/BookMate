import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Manual Sync: Google Sheets → Firestore
 * ============================================================================
 * Call this endpoint to sync latest balances from Google Sheets to Firestore
 * 
 * Usage:
 * POST /api/firebase/sync-balances
 * 
 * Returns:
 * {
 *   ok: true,
 *   message: "Balances synced successfully",
 *   balancesUpdated: 5,
 *   timestamp: "2025-11-04T12:00:00.000Z"
 * }
 */
export async function POST(request: Request) {
  try {
    console.log('🔄 Starting manual balance sync...');

    // Fetch balances from webapp API (which gets from Google Sheets)
    const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/balance/by-property`;
    
    console.log(`📡 Fetching from: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error(`Balance API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.propertyBalances || !Array.isArray(data.propertyBalances)) {
      return NextResponse.json({
        ok: false,
        error: 'No property balances found in API response'
      }, { status: 400 });
    }

    console.log(`📊 Found ${data.propertyBalances.length} property balances`);

    // Batch write to Firestore
    const batch = adminDb.batch();
    let updateCount = 0;

    for (const balance of data.propertyBalances) {
      if (!balance.property) {
        console.warn('⚠️ Skipping balance with no property name');
        continue;
      }

      const docRef = adminDb.collection('balances').doc(balance.property);

      batch.set(docRef, {
        accountName: balance.property,
        currentBalance: balance.balance || 0,
        currency: 'THB',
        updatedAt: new Date().toISOString(),
        lastSyncedBy: 'api',
        lastSyncedAt: new Date().toISOString(),
        syncSource: 'manual_api_call',
      }, { merge: true });

      updateCount++;
    }

    await batch.commit();
    console.log(`✅ Committed ${updateCount} balance updates to Firestore`);

    // Log activity
    await adminDb.collection('activityLogs').add({
      type: 'balance_sync',
      actor: 'api',
      timestamp: new Date().toISOString(),
      severity: 'info',
      details: {
        balancesUpdated: updateCount,
        source: 'manual_api_call',
        apiUrl: apiUrl,
      },
    });

    console.log('✅ Balance sync complete');

    return NextResponse.json({
      ok: true,
      message: 'Balances synced successfully',
      balancesUpdated: updateCount,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Sync error:', error);

    // Log error activity
    try {
      await adminDb.collection('activityLogs').add({
        type: 'balance_sync',
        actor: 'api',
        timestamp: new Date().toISOString(),
        severity: 'error',
        details: {
          error: error instanceof Error ? error.message : String(error),
          source: 'manual_api_call',
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * GET: Check last sync status
 * ============================================================================
 * Returns information about the last successful sync
 * 
 * Usage:
 * GET /api/firebase/sync-balances
 * 
 * Returns:
 * {
 *   ok: true,
 *   lastSync: {
 *     timestamp: "2025-11-04T12:00:00.000Z",
 *     balancesUpdated: 5
 *   }
 * }
 */
export async function GET() {
  try {
    // Get last activity log
    const snapshot = await adminDb
      .collection('activityLogs')
      .where('type', '==', 'balance_sync')
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({
        ok: true,
        lastSync: null,
        message: 'No sync activity yet',
      });
    }

    const lastSync = snapshot.docs[0].data();

    return NextResponse.json({
      ok: true,
      lastSync: {
        timestamp: lastSync.timestamp,
        balancesUpdated: lastSync.details?.balancesUpdated || 0,
        severity: lastSync.severity,
        error: lastSync.details?.error || null,
      },
    });

  } catch (error) {
    console.error('Error fetching sync status:', error);
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
