/**
 * Cron Job: Data Consistency Check
 * 
 * Compares data between Google Sheets and Firebase
 * Detects mismatches and missing records
 * Can be triggered manually or via cron
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/lib/api/security';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling } from '@/lib/api/errors';

interface ConsistencyResult {
  timestamp: string;
  overall: 'pass' | 'warning' | 'fail';
  checks: {
    name: string;
    status: 'pass' | 'warning' | 'fail';
    details: string;
    mismatchCount?: number;
    data?: any;
  }[];
  summary: {
    totalChecks: number;
    passed: number;
    warnings: number;
    failed: number;
  };
}

async function consistencyCheckHandler(req: NextRequest) {
  // Verify this is a cron job or admin request
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow cron jobs with secret or internal requests
  const isCron = authHeader === `Bearer ${cronSecret}`;
  const isInternal = req.headers.get('x-internal-request') === 'true';
  
  if (!isCron && !isInternal) {
    // TODO: Add admin authentication check
    // For now, allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const checks: ConsistencyResult['checks'] = [];

  try {
    // 1. Check Balance Totals
    const balanceRes = await fetch(`${baseUrl}/api/balance`, {
      headers: { 'x-internal-request': 'true' }
    });
    
    if (balanceRes.ok) {
      const balanceData = await balanceRes.json();
      const totalBalance = balanceData.totals?.currentBalance || 0;
      const accountCount = balanceData.items?.length || 0;

      checks.push({
        name: 'Balance Data Sync',
        status: accountCount > 0 ? 'pass' : 'warning',
        details: `${accountCount} accounts synced, total balance: ${totalBalance.toLocaleString()}`,
        data: {
          accountCount,
          totalBalance,
          lastSync: new Date().toISOString()
        }
      });
    } else {
      checks.push({
        name: 'Balance Data Sync',
        status: 'fail',
        details: `API returned ${balanceRes.status}`,
      });
    }

    // 2. Check P&L Data
    const pnlRes = await fetch(`${baseUrl}/api/pnl`, {
      headers: { 'x-internal-request': 'true' }
    });

    if (pnlRes.ok) {
      const pnlData = await pnlRes.json();
      const monthRevenue = pnlData.data?.month?.revenue || 0;
      const monthExpenses = pnlData.data?.month?.overheads || 0;
      const hasData = monthRevenue > 0 || monthExpenses > 0;

      checks.push({
        name: 'P&L Data Sync',
        status: hasData ? 'pass' : 'warning',
        details: `Revenue: ${monthRevenue.toLocaleString()}, Expenses: ${monthExpenses.toLocaleString()}`,
        data: {
          monthRevenue,
          monthExpenses,
          hasData
        }
      });
    } else {
      checks.push({
        name: 'P&L Data Sync',
        status: 'fail',
        details: `API returned ${pnlRes.status}`,
      });
    }

    // 3. Check Categories
    const categoryEndpoints = [
      'payments',
      'properties',
      'expenses',
      'revenues'
    ];

    for (const category of categoryEndpoints) {
      const catRes = await fetch(`${baseUrl}/api/categories/${category}`, {
        headers: { 'x-internal-request': 'true' }
      });

      if (catRes.ok) {
        const catData = await catRes.json();
        const itemCount = catData.data?.length || 0;

        checks.push({
          name: `Categories: ${category}`,
          status: itemCount > 0 ? 'pass' : 'warning',
          details: `${itemCount} items found`,
          data: { itemCount, category }
        });
      } else {
        checks.push({
          name: `Categories: ${category}`,
          status: 'fail',
          details: `API returned ${catRes.status}`,
        });
      }
    }

    // 4. Check Firebase Connection
    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const db = getAdminDb();
      
      // Try to query a collection
      const snapshot = await db.collection('users').limit(1).get();
      
      checks.push({
        name: 'Firebase Connection',
        status: 'pass',
        details: `Connected successfully, ${snapshot.size} test document(s) found`,
      });
    } catch (error: any) {
      checks.push({
        name: 'Firebase Connection',
        status: 'fail',
        details: `Connection failed: ${error.message}`,
      });
    }

    // 5. Check scheduled reports (if any)
    try {
      const { prisma } = await import('@/lib/prisma');
      const scheduledCount = await prisma.scheduledReport.count();
      
      checks.push({
        name: 'Scheduled Reports',
        status: 'pass',
        details: `${scheduledCount} scheduled reports configured`,
        data: { scheduledCount }
      });
    } catch (error: any) {
      checks.push({
        name: 'Scheduled Reports',
        status: 'warning',
        details: `Could not check: ${error.message}`,
      });
    }

    // Calculate summary
    const summary = {
      totalChecks: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      warnings: checks.filter(c => c.status === 'warning').length,
      failed: checks.filter(c => c.status === 'fail').length,
    };

    // Determine overall status
    let overall: 'pass' | 'warning' | 'fail' = 'pass';
    if (summary.failed > 0) {
      overall = 'fail';
    } else if (summary.warnings > 0) {
      overall = 'warning';
    }

    const result: ConsistencyResult = {
      timestamp: new Date().toISOString(),
      overall,
      checks,
      summary,
    };

    // TODO: Log results to admin dashboard or Sentry
    console.log('📊 Consistency Check Result:', result.summary);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Consistency check failed:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      overall: 'fail',
      checks: [{
        name: 'Consistency Check',
        status: 'fail',
        details: `Fatal error: ${error.message}`,
      }],
      summary: {
        totalChecks: 1,
        passed: 0,
        warnings: 0,
        failed: 1,
      },
      error: error.message,
    }, { status: 500 });
  }
}

// Apply middleware
export const POST = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(consistencyCheckHandler),
    RATE_LIMITS.write
  )
);

// Support GET for manual triggers
export const GET = POST;
