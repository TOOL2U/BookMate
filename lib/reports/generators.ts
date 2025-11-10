// Report data aggregation and generation logic
import { PnLData, Balance, Transaction } from '@/lib/api';

export interface ReportData {
  period: {
    type: 'monthly' | 'quarterly' | 'ytd' | 'custom';
    start: string;
    end: string;
    label: string;
  };
  currency?: 'THB' | 'USD';
  exchangeRate?: number;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    cashPosition: number;
    // Extended P&L metrics
    grossProfit?: number;
    totalOverheads?: number;
    totalPropertyPersonExpense?: number;
    ebitda?: number;
    ebitdaMargin?: number;
  };
  // Full P&L data
  pnl?: {
    month?: any;
    year?: any;
  };
  revenue: {
    byCategory: Array<{ category: string; amount: number; percentage: number }>;
    total: number;
    monthlyRevenue?: number;
    yearlyRevenue?: number;
  };
  expenses: {
    overhead: Array<{ category: string; amount: number; percentage: number; monthlyTotal?: number }>;
    propertyPerson: Array<{ category: string; amount: number; percentage: number; monthlyTotal?: number }>;
    overheadTotal?: number;
    propertyPersonTotal?: number;
  };
  balances: {
    byAccount: Array<{ 
      accountName: string; 
      balance: number; 
      type: 'cash' | 'bank';
      openingBalance?: number;
      currentBalance?: number;
      inflow?: number;
      outflow?: number;
      netChange?: number;
    }>;
    totalCash: number;
    totalBank: number;
    total: number;
    totalOpening?: number;
    totalInflow?: number;
    totalOutflow?: number;
    netChange?: number;
  };
  transactions?: Transaction[];
  transactionStats?: {
    totalCount: number;
    expenseCount: number;
    incomeCount: number;
    totalDebits: number;
    totalCredits: number;
    netPosition: number;
  };
  generatedAt: string;
}

/**
 * Generate report data from existing API responses
 */
export async function generateReportData(
  type: 'monthly' | 'quarterly' | 'ytd' | 'custom',
  dateRange?: { start: string; end: string }
): Promise<ReportData> {
  // Fetch data from existing APIs
  const [pnlRes, balancesRes, transactionsRes] = await Promise.all([
    fetch('/api/pnl'),
    fetch('/api/balance'),
    fetch('/api/inbox') // Use inbox API for P&L transactions
  ]);

  const pnlData: PnLData = await pnlRes.json();
  const balancesData = await balancesRes.json();
  const transactionsData = await transactionsRes.json();

  // Determine period based on type
  const period = calculatePeriod(type, dateRange);

  // Use existing P&L data (already calculated correctly)
  const summary = {
    totalRevenue: pnlData.month.revenue,
    totalExpenses: pnlData.month.overheads + pnlData.month.propertyPersonExpense,
    netProfit: pnlData.month.gop,
    profitMargin: pnlData.month.ebitdaMargin,
    cashPosition: balancesData.totals?.currentBalance || 0
  };

  // Extract transactions from inbox API response (structure: { ok: true, data: [...] })
  const transactions = transactionsData.ok ? (transactionsData.data || []) : [];
  
  console.log('📊 Report generated with', transactions.length, 'transactions');

  // Build report data structure
  const reportData: ReportData = {
    period,
    summary,
    revenue: {
      byCategory: [], // TODO: Fetch from revenue categories API
      total: pnlData.month.revenue
    },
    expenses: {
      overhead: [], // TODO: Fetch from overhead expenses API
      propertyPerson: [], // TODO: Fetch from property/person expenses API
      overheadTotal: pnlData.month.overheads,
      propertyPersonTotal: pnlData.month.propertyPersonExpense
    },
    balances: {
      byAccount: (balancesData.items || []).map((b: Balance) => ({
        accountName: b.accountName,
        balance: b.currentBalance,
        type: b.accountName.toLowerCase().includes('cash') ? 'cash' : 'bank'
      })),
      totalCash: balancesData.totals?.currentBalance || 0, // TODO: Split cash vs bank
      totalBank: 0,
      total: balancesData.totals?.currentBalance || 0
    },
    transactions: transactions.slice(0, 100), // Recent 100 transactions
    generatedAt: new Date().toISOString()
  };

  return reportData;
}

/**
 * Calculate period label and dates
 */
function calculatePeriod(
  type: 'monthly' | 'quarterly' | 'ytd' | 'custom',
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
      return calculatePeriod('monthly');
  }
}

/**
 * Format currency for reports
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format percentage for reports
 */
export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

/**
 * Calculate percentage of total
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}
