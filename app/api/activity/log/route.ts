/**
 * GET /api/activity/log
 * 
 * Live activity log showing recent balance transactions.
 * Returns near-real-time feed from Google Sheets Transactions.
 * 
 * Query params:
 * - limit: number (default: 200)
 * - cursor: string (timestamp for pagination)
 * - kind: "revenue" | "expense" | "transfer" | "all" (default: all)
 * - account: string (filter by account)
 * - user: string (filter by user)
 * - month: string (e.g., "JAN", "2025-01")
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackMetric } from '@/utils/telemetry';

interface ActivityItem {
  id: string;
  ts: string; // ISO timestamp
  kind: 'revenue' | 'expense' | 'transfer';
  fromAccount?: string;
  toAccount?: string;
  amount: number;
  note?: string;
  user?: string;
  source: 'webapp' | 'mobile' | 'api';
  ref?: string; // referenceID
}

interface ActivityLogResponse {
  ok: boolean;
  items: ActivityItem[];
  nextCursor?: string;
  error?: string;
}

export async function GET(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Feature flag check
    if (process.env.FEATURE_BALANCE_PHASE2 !== 'true') {
      return NextResponse.json({
        ok: false,
        error: 'Phase 2 features not enabled',
        items: []
      }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '200', 10);
    const cursor = searchParams.get('cursor') || undefined;
    const kindFilter = searchParams.get('kind') || 'all';
    const accountFilter = searchParams.get('account') || undefined;
    const userFilter = searchParams.get('user') || undefined;
    const monthFilter = searchParams.get('month') || undefined;

    // Fetch transactions from V9 API
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const txnRes = await fetch(`${baseUrl}/api/v9/transactions?limit=${limit * 2}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!txnRes.ok) {
      throw new Error(`Failed to fetch transactions: ${txnRes.statusText}`);
    }

    const txnData = await txnRes.json();

    if (!txnData.ok || !txnData.transactions) {
      throw new Error('Invalid transaction data received');
    }

    // Transform transactions to activity items
    let activities: ActivityItem[] = txnData.transactions.map((txn: any) => {
      // Determine kind based on fromAccount/toAccount
      let kind: 'revenue' | 'expense' | 'transfer';
      if (txn.transactionType === 'transfer') {
        kind = 'transfer';
      } else if (txn.transactionType === 'income' || txn.fromAccount === 'Revenue') {
        kind = 'revenue';
      } else {
        kind = 'expense';
      }

      return {
        id: txn.id || `${txn.timestamp}-${txn.amount}`,
        ts: txn.timestamp,
        kind,
        fromAccount: txn.fromAccount,
        toAccount: txn.toAccount,
        amount: txn.amount || 0,
        note: txn.note,
        user: txn.user,
        source: 'webapp' as const, // Default to webapp (can be enhanced later)
        ref: txn.referenceID
      };
    });

    // Apply filters
    if (kindFilter !== 'all') {
      activities = activities.filter(a => a.kind === kindFilter);
    }

    if (accountFilter) {
      activities = activities.filter(a => 
        a.fromAccount === accountFilter || a.toAccount === accountFilter
      );
    }

    if (userFilter) {
      activities = activities.filter(a => a.user === userFilter);
    }

    if (monthFilter) {
      activities = activities.filter(a => {
        const date = new Date(a.ts);
        const year = date.getFullYear();
        const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        
        // Support both "JAN" and "2025-01" formats
        if (monthFilter.includes('-')) {
          const [filterYear, filterMonth] = monthFilter.split('-');
          return year.toString() === filterYear && (date.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
        } else {
          return month === monthFilter.toUpperCase();
        }
      });
    }

    // Apply cursor-based pagination
    if (cursor) {
      const cursorDate = new Date(cursor);
      activities = activities.filter(a => new Date(a.ts) < cursorDate);
    }

    // Limit results
    const hasMore = activities.length > limit;
    activities = activities.slice(0, limit);

    // Generate next cursor
    const nextCursor = hasMore && activities.length > 0
      ? activities[activities.length - 1].ts
      : undefined;

    // Track metrics
    const latency = Date.now() - startTime;
    trackMetric('activity.log.requests', 1);
    trackMetric('activity.log.latency', latency);

    const response: ActivityLogResponse = {
      ok: true,
      items: activities,
      nextCursor
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Activity log error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      items: []
    }, { status: 500 });
  }
}
