'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/layout/AdminShell';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import { RefreshCw, AlertCircle } from 'lucide-react';

// Lazy load heavy chart components to improve initial load time
const MonthlyIncomeExpenses = dynamic(
  () => import('@/components/dashboard/MonthlyIncomeExpenses'),
  {
    loading: () => <div className="h-[400px] bg-bg-card border border-border-card rounded-xl animate-pulse" />,
    ssr: false // Charts don't need SSR
  }
);

const ExpenseBreakdownDonut = dynamic(
  () => import('@/components/dashboard/ExpenseBreakdownDonut'),
  {
    loading: () => <div className="h-[400px] bg-bg-card border border-border-card rounded-xl animate-pulse" />,
    ssr: false
  }
);

const CashFlowTrend = dynamic(
  () => import('@/components/dashboard/CashFlowTrend'),
  {
    loading: () => <div className="h-[400px] bg-bg-card border border-border-card rounded-xl animate-pulse" />,
    ssr: false
  }
);

const RecentTransactionsTable = dynamic(
  () => import('@/components/dashboard/RecentTransactionsTable'),
  {
    loading: () => <div className="h-[300px] bg-bg-card border border-border-card rounded-xl animate-pulse" />,
    ssr: false
  }
);

interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface Balance {
  bankName: string;
  balance: number;
  timestamp?: string;
}

interface Transaction {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  debit: number;
  credit: number;
}

interface ExpenseCategory {
  name: string;
  expense: number;
  percentage: number;
}

interface DashboardData {
  pnl: {
    month: PnLPeriodData;
    year: PnLPeriodData;
  } | null;
  overheadCategories: ExpenseCategory[];
  propertyCategories: ExpenseCategory[];
  balances: Balance[];
  recentActivity: Transaction[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    pnl: null,
    overheadCategories: [],
    propertyCategories: [],
    balances: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // PERFORMANCE: Fetch critical data first (P&L + Balance), then load charts after
      // This allows KPI cards to display immediately while charts load in background
      
      // Phase 1: Critical data for KPI cards (parallel)
      const [pnlRes, balanceRes] = await Promise.all([
        fetch('/api/pnl', { cache: 'default' }), // Allow browser caching for 60s
        fetch('/api/balance?month=ALL', { cache: 'default' })
      ]);

      const pnlData = await pnlRes.json();
      const balanceData = await balanceRes.json();

      // Process balance data - Map from unified API to Balance format
      let balancesArray: Balance[] = [];
      if (balanceData.ok && balanceData.items) {
        console.log('📊 Dashboard balance source:', balanceData.source);
        balancesArray = balanceData.items.map((account: any) => ({
          bankName: account.accountName,
          balance: account.currentBalance,
          timestamp: account.lastTxnAt || new Date().toISOString()
        }));
      }

      // Update state with critical data immediately (KPI cards can render)
      setData(prev => ({
        ...prev,
        pnl: pnlData.ok ? {
          month: pnlData.data?.month || {
            revenue: 0,
            overheads: 0,
            propertyPersonExpense: 0,
            gop: 0,
            ebitdaMargin: 0
          },
          year: pnlData.data?.year || {
            revenue: 0,
            overheads: 0,
            propertyPersonExpense: 0,
            gop: 0,
            ebitdaMargin: 0
          }
        } : null,
        balances: balancesArray
      }));

      setLoading(false); // KPI cards ready - show them now!

      // Phase 2: Load chart data in background (non-blocking)
      Promise.all([
        fetch('/api/pnl/overhead-expenses?period=month', { cache: 'default' }),
        fetch('/api/pnl/property-person?period=month', { cache: 'default' }),
        fetch('/api/inbox', { cache: 'default' })
      ]).then(async ([overheadRes, propertyRes, inboxRes]) => {
        const [overheadData, propertyData, inboxData] = await Promise.all([
          overheadRes.json(),
          propertyRes.json(),
          inboxRes.json()
        ]);

        // Update state with chart data
        setData(prev => ({
          ...prev,
          overheadCategories: overheadData.ok ? (overheadData.data || []) : [],
          propertyCategories: propertyData.ok ? (propertyData.data || []) : [],
          recentActivity: inboxData.ok ? (inboxData.data || []).slice(0, 10) : []
        }));
      }).catch(err => {
        console.warn('Chart data loading failed:', err);
        // Don't set error - KPI cards are already showing
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate balance summary for KPI cards
  const balanceSummary = {
    total: data.balances.reduce((sum, b) => sum + b.balance, 0),
    cash: data.balances.find(b => b.bankName.toLowerCase().includes('cash'))?.balance || 0,
    bank: data.balances.filter(b => !b.bankName.toLowerCase().includes('cash')).reduce((sum, b) => sum + b.balance, 0)
  };

  return (
    <AdminShell>
      <div className="relative space-y-8">
        {/* Page header - Made Mirage font for title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-madeMirage font-bold text-text-primary tracking-tight">
              Dashboard
            </h1>
            <p className="text-text-secondary mt-2 font-aileron">
              Real-time overview of your business performance
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-3 bg-bg-card hover:bg-black rounded-xl transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* SECTION 1: KPI Cards - Total Income, Total Expenses, Net Profit, Bank Balance */}
        <DashboardKpiCards
          pnlData={data.pnl}
          balanceData={balanceSummary}
          isLoading={loading}
        />

        {/* SECTION 2: Two-column Charts - Monthly Income vs Expenses (Bar) + Expense Breakdown (Donut) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyIncomeExpenses
            pnlData={data.pnl}
            isLoading={loading}
          />
          <ExpenseBreakdownDonut
            overheadCategories={data.overheadCategories}
            propertyCategories={data.propertyCategories}
            isLoading={loading}
          />
        </div>

        {/* SECTION 3: Cash Flow Trend Line Chart + Recent Transactions Table */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CashFlowTrend
              pnlData={data.pnl}
              balances={data.balances}
              isLoading={loading}
            />
          </div>
          <div className="lg:col-span-1">
            <RecentTransactionsTable
              transactions={data.recentActivity}
              isLoading={loading}
            />
          </div>
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 right-8 max-w-md z-50 animate-slide-in-right">
          <div className="bg-bg-card backdrop-blur-sm border border-error/40 rounded-xl p-4 flex items-start gap-3 shadow-xl">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary font-medium mb-1">
                Failed to load dashboard data
              </p>
              <p className="text-xs text-text-secondary">
                {error}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="shrink-0 px-3 py-1.5 bg-yellow text-black text-xs font-medium rounded-lg transition-all duration-300 shadow-glow hover:shadow-glow-lg"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
