/**
 * POST /api/ai/check-balance-consistency
 * 
 * AI-powered balance consistency check with drift detection.
 * Compares expected balances (opening + inflow - outflow) against actual balances.
 * 
 * Business Rules:
 * - expectedCurrent = openingBalance + inflow - outflow
 * - drift = actualCurrent - expectedCurrent
 * - Status: OK (≤1 THB), WARN (1-100 THB), FAIL (>100 THB)
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { trackMetric } from '@/utils/telemetry';

type Month = 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC' | 'ALL';
type Status = 'OK' | 'WARN' | 'FAIL';

interface BalanceCheck {
  account: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  expectedCurrent: number;
  actualCurrent: number;
  drift: number;
  status: Status;
  notes: string[];
}

interface ConsistencyResponse {
  ok: boolean;
  checks: BalanceCheck[];
  totals: {
    openingTotal: number;
    inflowTotal: number;
    outflowTotal: number;
    expectedTotal: number;
    actualTotal: number;
    driftTotal: number;
    status: Status;
  };
  aiSummary?: string;
  error?: string;
}

// Thresholds from environment (with defaults)
const DRIFT_WARN = Number(process.env.DRIFT_WARN_THRESHOLD) || 100;
const DRIFT_FAIL = Number(process.env.DRIFT_FAIL_THRESHOLD) || 500;

function getDriftStatus(drift: number): Status {
  const absDrift = Math.abs(drift);
  if (absDrift <= 1) return 'OK';
  if (absDrift <= DRIFT_WARN) return 'WARN';
  return 'FAIL';
}

function generateNotes(check: BalanceCheck): string[] {
  const notes: string[] = [];
  const absDrift = Math.abs(check.drift);

  if (absDrift <= 1) {
    notes.push('✓ Balance is accurate within 1 THB');
  } else if (absDrift <= DRIFT_WARN) {
    notes.push(`⚠️ Minor drift detected: ${check.drift.toFixed(2)} THB`);
    notes.push('Recommend reviewing recent transactions');
  } else {
    notes.push(`❌ Significant drift: ${check.drift.toFixed(2)} THB`);
    notes.push('URGENT: Manual reconciliation required');
    
    if (check.drift > 0) {
      notes.push('Actual balance is HIGHER than expected - possible unrecorded income');
    } else {
      notes.push('Actual balance is LOWER than expected - possible unrecorded expense');
    }
  }

  // Transaction activity notes
  if (check.inflow > 0 && check.outflow > 0) {
    const activity = check.inflow + check.outflow;
    notes.push(`Transaction volume: ${activity.toLocaleString()} THB`);
  }

  return notes;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await req.json();
    const month: Month = body.month || 'ALL';

    // Feature flag check
    if (process.env.FEATURE_BALANCE_PHASE2 !== 'true') {
      return NextResponse.json({
        ok: false,
        error: 'Phase 2 features not enabled',
        checks: [],
        totals: {
          openingTotal: 0,
          inflowTotal: 0,
          outflowTotal: 0,
          expectedTotal: 0,
          actualTotal: 0,
          driftTotal: 0,
          status: 'OK' as Status
        }
      }, { status: 403 });
    }

    // 1. Fetch balance data from /api/v9/balance/summary
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const balanceUrl = `${baseUrl}/api/v9/balance/summary${month !== 'ALL' ? `?month=${month}` : ''}`;
    
    const balanceRes = await fetch(balanceUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!balanceRes.ok) {
      throw new Error(`Failed to fetch balances: ${balanceRes.statusText}`);
    }

    const balanceData = await balanceRes.json();

    if (!balanceData.ok || !balanceData.balances) {
      throw new Error('Invalid balance data received');
    }

    // 2. Compute expected vs actual for each account
    const checks: BalanceCheck[] = balanceData.balances.map((account: any) => {
      const openingBalance = account.openingBalance || 0;
      const inflow = account.inflow || 0;
      const outflow = account.outflow || 0;
      const actualCurrent = account.currentBalance || 0;
      
      // Core formula: expected = opening + inflow - outflow
      const expectedCurrent = openingBalance + inflow - outflow;
      const drift = actualCurrent - expectedCurrent;
      const status = getDriftStatus(drift);

      const check: BalanceCheck = {
        account: account.accountName,
        openingBalance,
        inflow,
        outflow,
        expectedCurrent,
        actualCurrent,
        drift,
        status,
        notes: []
      };

      check.notes = generateNotes(check);
      return check;
    });

    // 3. Compute totals
    const totals = checks.reduce(
      (acc, check) => ({
        openingTotal: acc.openingTotal + check.openingBalance,
        inflowTotal: acc.inflowTotal + check.inflow,
        outflowTotal: acc.outflowTotal + check.outflow,
        expectedTotal: acc.expectedTotal + check.expectedCurrent,
        actualTotal: acc.actualTotal + check.actualCurrent,
        driftTotal: acc.driftTotal + check.drift,
        status: 'OK' as Status
      }),
      {
        openingTotal: 0,
        inflowTotal: 0,
        outflowTotal: 0,
        expectedTotal: 0,
        actualTotal: 0,
        driftTotal: 0,
        status: 'OK' as Status
      }
    );

    totals.status = getDriftStatus(totals.driftTotal);

    // 4. Optional: Call OpenAI for narrative summary
    let aiSummary: string | undefined;
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const failedAccounts = checks.filter(c => c.status === 'FAIL');
        const warnAccounts = checks.filter(c => c.status === 'WARN');
        
        const prompt = `You are a financial auditor analyzing balance drift.

Total Accounts: ${checks.length}
Failed Checks (>500 THB drift): ${failedAccounts.length}
Warning Checks (100-500 THB drift): ${warnAccounts.length}
Total Drift: ${totals.driftTotal.toFixed(2)} THB
Overall Status: ${totals.status}

${failedAccounts.length > 0 ? `\nFailed Accounts:\n${failedAccounts.map(a => `- ${a.account}: ${a.drift.toFixed(2)} THB drift`).join('\n')}` : ''}

${warnAccounts.length > 0 ? `\nWarning Accounts:\n${warnAccounts.map(a => `- ${a.account}: ${a.drift.toFixed(2)} THB drift`).join('\n')}` : ''}

Provide a concise 2-3 sentence executive summary of the financial health and any recommended actions. Be direct and actionable.`;

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 150,
          temperature: 0.3
        });

        aiSummary = completion.choices[0]?.message?.content || undefined;
      } catch (aiError) {
        console.error('OpenAI summary failed:', aiError);
        // Non-blocking - continue without AI summary
      }
    }

    // 5. Track metrics
    const latency = Date.now() - startTime;
    trackMetric('ai.check.latency', latency);
    trackMetric('ai.check.status', 1, { status: totals.status, month });
    
    // 6. Return comprehensive response
    const response: ConsistencyResponse = {
      ok: true,
      checks,
      totals,
      aiSummary
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('AI consistency check error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: [],
      totals: {
        openingTotal: 0,
        inflowTotal: 0,
        outflowTotal: 0,
        expectedTotal: 0,
        actualTotal: 0,
        driftTotal: 0,
        status: 'OK' as Status
      }
    }, { status: 500 });
  }
}
