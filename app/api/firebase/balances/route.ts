import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Get all balances from Firestore
 * ============================================================================
 * Returns all account balances stored in Firestore
 * Used by mobile team for testing and debugging
 * 
 * Usage:
 * GET /api/firebase/balances
 * 
 * Query params (optional):
 * - limit: number of results (default: 100)
 * - orderBy: field to sort by (default: currentBalance)
 * 
 * Returns:
 * {
 *   ok: true,
 *   count: 5,
 *   balances: [...],
 *   timestamp: "2025-11-04T12:00:00.000Z"
 * }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const orderByField = searchParams.get('orderBy') || 'currentBalance';

    console.log(`📊 Fetching balances from Firestore (limit: ${limit}, orderBy: ${orderByField})`);

    const snapshot = await adminDb
      .collection('balances')
      .orderBy(orderByField, 'desc')
      .limit(limit)
      .get();

    const balances = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Retrieved ${balances.length} balances`);

    return NextResponse.json({
      ok: true,
      count: balances.length,
      balances,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error fetching balances:', error);
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * Get specific balance by account name
 * ============================================================================
 * POST /api/firebase/balances
 * Body: { accountName: "Cash - Family" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accountName } = body;

    if (!accountName) {
      return NextResponse.json({
        ok: false,
        error: 'accountName is required',
      }, { status: 400 });
    }

    console.log(`📊 Fetching balance for: ${accountName}`);

    const docRef = adminDb.collection('balances').doc(accountName);
    const doc = await docRef.get();

    if (!doc.exists) {
      return NextResponse.json({
        ok: false,
        error: 'Balance not found',
      }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      balance: {
        id: doc.id,
        ...doc.data(),
      },
    });

  } catch (error) {
    console.error('❌ Error fetching balance:', error);
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
