import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling, validateRequired, APIErrors } from '@/lib/api/errors';
import { withSecurityHeaders } from '@/lib/api/security';
import { buildAIPrompt, type ReportTone } from '@/lib/ai/tone-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/generate
 * Generate a financial report from existing data sources
 * Supports AI tone personalization: standard, investor, casual, executive
 */
async function generateReportHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, dateRange, currency = 'THB', tone = 'standard' } = body;

    // Validate input
    if (!['monthly', 'quarterly', 'ytd', 'custom'].includes(type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid report type' },
        { status: 400 }
      );
    }

    // Get exchange rate if USD is selected (approximate rate: 1 USD = 35 THB)
    const exchangeRate = currency === 'USD' ? 35 : 1;
    const convertCurrency = (amount: number) => currency === 'USD' ? amount / exchangeRate : amount;

    // Fetch data from existing APIs (reusing existing logic)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 
                    `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host') || 'localhost:3000'}`;
    
    console.log('📊 Fetching comprehensive report data from:', baseUrl);

    const [pnlRes, balancesRes, overheadRes, propertyRes, transactionsRes] = await Promise.all([
      fetch(`${baseUrl}/api/pnl`, { 
        headers: { 'x-internal-request': 'true' },
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/balance`, { 
        headers: { 'x-internal-request': 'true' },
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/pnl/overhead-expenses?period=month`, { 
        headers: { 'x-internal-request': 'true' },
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/pnl/property-person?period=month`, { 
        headers: { 'x-internal-request': 'true' },
        cache: 'no-store'
      }),
      fetch(`${baseUrl}/api/inbox`, { 
        headers: { 'x-internal-request': 'true' },
        cache: 'no-store'
      })
    ]).catch(error => {
      console.error('❌ Fetch error:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    });

    console.log('📊 API Response Status:', {
      pnl: pnlRes.status,
      balances: balancesRes.status,
      overhead: overheadRes.status,
      property: propertyRes.status,
      transactions: transactionsRes.status
    });

    if (!pnlRes.ok || !balancesRes.ok) {
      const pnlError = !pnlRes.ok ? await pnlRes.text() : null;
      const balanceError = !balancesRes.ok ? await balancesRes.text() : null;
      console.error('❌ API Errors:', { pnlError, balanceError });
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch source data', details: { pnlError, balanceError } },
        { status: 500 }
      );
    }

    const pnlData = await pnlRes.json().catch(() => ({ ok: false, data: null }));
    const balancesData = await balancesRes.json().catch(() => ({ ok: false, items: [], totals: {} }));
    const overheadData = await overheadRes.json().catch(() => ({ ok: false, data: [] }));
    const propertyData = await propertyRes.json().catch(() => ({ ok: false, data: [] }));
    const transactionsData = await transactionsRes.json().catch(() => ({ ok: false, data: [] }));
    
    console.log('✅ Data fetched:', {
      pnl: !!pnlData.data,
      balances: balancesData.items?.length || 0,
      overhead: overheadData.data?.length || 0,
      property: propertyData.data?.length || 0,
      transactions: transactionsData.data?.length || 0
    });
    
    // Debug: Log overhead data structure (API returns array directly)
    console.log('📊 Overhead API Response:', {
      ok: overheadData.ok,
      hasData: !!overheadData.data,
      isArray: Array.isArray(overheadData.data),
      itemCount: Array.isArray(overheadData.data) ? overheadData.data.length : 0,
      preview: Array.isArray(overheadData.data) ? overheadData.data.slice(0, 3) : [],
      fullStructure: JSON.stringify(overheadData).substring(0, 500)
    });
    
    // Debug: Log property data structure (API returns array directly)
    console.log('📊 Property API Response:', {
      ok: propertyData.ok,
      hasData: !!propertyData.data,
      isArray: Array.isArray(propertyData.data),
      itemCount: Array.isArray(propertyData.data) ? propertyData.data.length : 0,
      preview: Array.isArray(propertyData.data) ? propertyData.data.slice(0, 3) : []
    });

    // Calculate period
    const period = calculatePeriod(type, dateRange);

    // Extract transactions from inbox API response (structure: { ok: true, data: [...] })
    const transactions = transactionsData.ok ? (transactionsData.data || []) : [];
    
    console.log(`📊 Report includes ${transactions.length} transactions`);

    // Build comprehensive report data with ALL details
    const reportData = {
      period,
      currency,
      exchangeRate: currency === 'USD' ? exchangeRate : undefined,
      summary: {
        totalRevenue: convertCurrency(pnlData.data?.month?.revenue || 0),
        totalExpenses: convertCurrency(pnlData.data?.month?.overheads || 0), // Only overhead expenses
        netProfit: convertCurrency(pnlData.data?.month?.gop || 0),
        profitMargin: pnlData.data?.month?.ebitdaMargin || 0,
        cashPosition: convertCurrency(balancesData.totals?.currentBalance || 0),
        // Add more P&L details
        grossProfit: convertCurrency(pnlData.data?.month?.grossProfit || 0),
        totalOverheads: convertCurrency(pnlData.data?.month?.overheads || 0),
        totalPropertyPersonExpense: convertCurrency(pnlData.data?.month?.propertyPersonExpense || 0),
        ebitda: convertCurrency(pnlData.data?.month?.ebitda || 0),
        ebitdaMargin: pnlData.data?.month?.ebitdaMargin || 0,
      },
      // Full P&L Data (Month and Year)
      pnl: {
        month: pnlData.data?.month || {},
        year: pnlData.data?.year || {},
      },
      revenue: {
        byCategory: [], // TODO: Implement when revenue categories API is ready
        total: convertCurrency(pnlData.data?.month?.revenue || 0),
        // Add revenue breakdown details
        monthlyRevenue: convertCurrency(pnlData.data?.month?.revenue || 0),
        yearlyRevenue: convertCurrency(pnlData.data?.year?.revenue || 0),
      },
      expenses: {
        // Overhead expenses: API returns { ok: true, data: [{ name, expense, percentage }] }
        overhead: (Array.isArray(overheadData.data) ? overheadData.data : []).map((item: any) => ({
          category: item.name || item.category,
          amount: convertCurrency(item.expense || item.amount),
          percentage: item.percentage || 0,
          monthlyTotal: convertCurrency(item.expense || item.amount),
        })),
        // Property/Person expenses: Same structure
        propertyPerson: (Array.isArray(propertyData.data) ? propertyData.data : []).map((item: any) => ({
          category: item.name || item.category,
          amount: convertCurrency(item.expense || item.amount),
          percentage: item.percentage || 0,
          monthlyTotal: convertCurrency(item.expense || item.amount),
        })),
        // No combined total - keep overhead and property/person separate
        overheadTotal: Array.isArray(overheadData.data) 
          ? convertCurrency(overheadData.data.reduce((sum: number, item: any) => sum + (item.expense || item.amount || 0), 0))
          : 0,
        propertyPersonTotal: Array.isArray(propertyData.data)
          ? convertCurrency(propertyData.data.reduce((sum: number, item: any) => sum + (item.expense || item.amount || 0), 0))
          : 0,
      },
      balances: {
        byAccount: (balancesData.items || []).map((b: any) => ({
          accountName: b.accountName,
          balance: convertCurrency(b.currentBalance),
          type: b.accountName.toLowerCase().includes('cash') ? 'cash' : 'bank',
          openingBalance: convertCurrency(b.openingBalance || 0),
          currentBalance: convertCurrency(b.currentBalance || 0),
          // Add full balance details
          inflow: convertCurrency(b.inflow || 0),
          outflow: convertCurrency(b.outflow || 0),
          netChange: convertCurrency((b.inflow || 0) - (b.outflow || 0)),
        })),
        totalCash: convertCurrency((balancesData.items || [])
          .filter((b: any) => b.accountName.toLowerCase().includes('cash'))
          .reduce((sum: number, b: any) => sum + (b.currentBalance || 0), 0)),
        totalBank: convertCurrency((balancesData.items || [])
          .filter((b: any) => !b.accountName.toLowerCase().includes('cash'))
          .reduce((sum: number, b: any) => sum + (b.currentBalance || 0), 0)),
        total: convertCurrency(balancesData.totals?.currentBalance || 0),
        // Calculate totals (some like openingBalance need to be calculated from items)
        totalOpening: convertCurrency((balancesData.items || []).reduce((sum: number, b: any) => sum + (b.openingBalance || 0), 0)),
        totalInflow: convertCurrency(balancesData.totals?.inflow || 0),
        totalOutflow: convertCurrency(balancesData.totals?.outflow || 0),
        netChange: convertCurrency(balancesData.totals?.netChange || 0),
      },
      transactions: transactions.slice(0, 1000).map((t: any) => ({
        ...t,
        debit: convertCurrency(t.debit || 0),
        credit: convertCurrency(t.credit || 0),
      })),
      // Add transaction statistics
      transactionStats: {
        totalCount: transactions.length,
        expenseCount: transactions.filter((t: any) => t.debit > 0).length,
        incomeCount: transactions.filter((t: any) => t.credit > 0).length,
        totalDebits: convertCurrency(transactions.reduce((sum: number, t: any) => sum + (t.debit || 0), 0)),
        totalCredits: convertCurrency(transactions.reduce((sum: number, t: any) => sum + (t.credit || 0), 0)),
        netPosition: convertCurrency(transactions.reduce((sum: number, t: any) => sum + ((t.credit || 0) - (t.debit || 0)), 0)),
      },
      generatedAt: new Date().toISOString()
    };
    
    // Debug: Log expense categories in final report
    console.log('📊 Final Report Expense Categories:', {
      overheadCount: reportData.expenses.overhead.length,
      propertyPersonCount: reportData.expenses.propertyPerson.length,
      overheadPreview: reportData.expenses.overhead.slice(0, 3),
      propertyPersonPreview: reportData.expenses.propertyPerson.slice(0, 3),
      overheadTotal: reportData.expenses.overheadTotal,
      propertyPersonTotal: reportData.expenses.propertyPersonTotal,
      summaryTotalExpenses: reportData.summary.totalExpenses
    });

    return NextResponse.json({
      ok: true,
      data: reportData,
      durationMs: 0 // TODO: Track timing
    });

  } catch (error: any) {
    console.error('❌ Error generating report:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Internal server error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

function calculatePeriod(
  type: string,
  dateRange?: { start: string; end: string }
) {
  const now = new Date();
  
  switch (type) {
    case 'monthly':
      return {
        type,
        start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0],
        label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      };
    
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      return {
        type,
        start: new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0],
        end: new Date(now.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0],
        label: `Q${quarter + 1} ${now.getFullYear()}`
      };
    
    case 'ytd':
      return {
        type,
        start: new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0],
        end: now.toISOString().split('T')[0],
        label: `YTD ${now.getFullYear()}`
      };
    
    case 'custom':
      return {
        type,
        start: dateRange?.start || '',
        end: dateRange?.end || '',
        label: `${dateRange?.start} to ${dateRange?.end}`
      };
    
    default:
      return calculatePeriod('monthly', dateRange);
  }
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

// Apply middleware: security headers → rate limiting (reports tier) → error handling
export const POST = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(generateReportHandler),
    RATE_LIMITS.reports
  )
);
