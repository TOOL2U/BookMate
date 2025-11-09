'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/layout/AdminShell';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import LogoBM from '@/components/LogoBM';
import LoadingScreen from '@/components/LoadingScreen';
import { useLoadingState } from '@/hooks/useLoadingState';
import { RefreshCw, AlertCircle } from 'lucide-react';

// Lazy load heavy chart components to improve initial load time
const MonthlyIncomeExpenses = dynamic(
  () => import('@/components/dashboard/MonthlyIncomeExpenses'),
  {
    loading: () => <div className="h-[400px] bg-bg-card border border-border-card rounded-xl2 animate-pulse" />,
    ssr: false // Charts don't need SSR
  }
);

const ExpenseBreakdownDonut = dynamic(
  () => import('@/components/dashboard/ExpenseBreakdownDonut'),
  {
    loading: () => <div className="h-[400px] bg-bg-card border border-border-card rounded-xl2 animate-pulse" />,
    ssr: false
  }
);

const CashFlowTrend = dynamic(
  () => import('@/components/dashboard/CashFlowTrend'),
  {
    loading: () => <div className="h-[400px] bg-bg-card border border-border-card rounded-xl2 animate-pulse" />,
    ssr: false
  }
);

const RecentTransactionsTable = dynamic(
  () => import('@/components/dashboard/RecentTransactionsTable'),
  {
    loading: () => <div className="h-[300px] bg-bg-card border border-border-card rounded-xl2 animate-pulse" />,
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
  // Coordinate loading screen with data fetching
  // Wait for BOTH animation (2s) AND all data to be ready
  const { isLoading: showLoadingScreen, setDataReady } = useLoadingState({
    minLoadingTime: 2000 // Minimum 2 seconds for branding
  });
  
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

      const dashboardStartTime = Date.now();
      console.log('🚀 Dashboard: Starting background data fetch...');

      // PERFORMANCE: Fetch critical data first (P&L + Balance), then load charts after
      // This allows KPI cards to display immediately while charts load in background
      
      // Phase 1: Critical data for KPI cards (parallel)
      const phase1Start = Date.now();
      const [pnlRes, balanceRes] = await Promise.all([
        fetch('/api/pnl', { cache: 'default' }), // Allow browser caching for 60s
        fetch('/api/balance?month=ALL', { cache: 'default' })
      ]);
      console.log(`⏱️ Phase 1 (P&L + Balance) took ${Date.now() - phase1Start}ms`);

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

      console.log(`✅ Dashboard KPIs ready in ${Date.now() - dashboardStartTime}ms`);
      // Don't mark data as ready yet - wait for Phase 2 (charts + transactions)

      // Phase 2: Load chart data in background (non-blocking)
      const phase2Start = Date.now();
      Promise.all([
        fetch('/api/pnl/overhead-expenses?period=month', { cache: 'default' }),
        fetch('/api/pnl/property-person?period=month', { cache: 'default' }),
        fetch('/api/inbox', { cache: 'default' }) // Allow 30s cache on inbox
      ]).then(async ([overheadRes, propertyRes, inboxRes]) => {
        console.log(`⏱️ Phase 2 (Charts) took ${Date.now() - phase2Start}ms`);
        const [overheadData, propertyData, inboxData] = await Promise.all([
          overheadRes.json(),
          propertyRes.json(),
          inboxRes.json()
        ]);

        // Sort transactions by date (most recent first)
        let sortedTransactions: Transaction[] = [];
        if (inboxData.ok && inboxData.data) {
          sortedTransactions = [...inboxData.data].sort((a: Transaction, b: Transaction) => {
            // Create date objects for comparison (DD/MM/YYYY format)
            const dateA = new Date(parseInt(a.year), parseInt(a.month) - 1, parseInt(a.day));
            const dateB = new Date(parseInt(b.year), parseInt(b.month) - 1, parseInt(b.day));
            return dateB.getTime() - dateA.getTime(); // Most recent first
          });
        }

        // Update state with chart data
        setData(prev => ({
          ...prev,
          overheadCategories: overheadData.ok ? (overheadData.data || []) : [],
          propertyCategories: propertyData.ok ? (propertyData.data || []) : [],
          recentActivity: sortedTransactions // Show ALL transactions, sorted by date
        }));
        
        console.log(`✅ Dashboard fully loaded in ${Date.now() - dashboardStartTime}ms`);
        
        // NOW mark data as ready - all phases complete (KPIs + Charts + Transactions)
        setDataReady(true);
      }).catch(err => {
        console.warn('Chart data loading failed:', err);
        // Even if charts fail, mark as ready so loading screen doesn't hang forever
        setDataReady(true);
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start fetching data immediately, even if loading screen is still showing
    // This ensures data is ready by the time loading screen finishes
    fetchDashboardData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate balance summary for KPI cards
  const balanceSummary = {
    total: data.balances.reduce((sum, b) => sum + b.balance, 0),
    cash: data.balances.find(b => b.bankName.toLowerCase().includes('cash'))?.balance || 0,
    bank: data.balances.filter(b => !b.bankName.toLowerCase().includes('cash')).reduce((sum, b) => sum + b.balance, 0)
  };

  // Show loading screen until both animation and data are ready
  if (showLoadingScreen) {
    return <LoadingScreen />;
  }

  return (
    <AdminShell>
      <div className="relative space-y-4">
        {/* Page header - Made Mirage font for title */}
        <div className="flex items-center justify-between mb-4 animate-fade-in opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <div>
            <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-tight">
              Dashboard
            </h1>
            <p className="text-text-secondary mt-3 font-aileron text-lg">
              Real-time overview of your business performance
            </p>
          </div>
          <div className="-ml-86">
            <LogoBM size={100} />
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-3 bg-bg-card hover:bg-black rounded-xl2 transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* SECTION 1: KPI Cards - Total Income, Total Expenses, Net Profit, Bank Balance */}
        <div className="animate-fade-in opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
          <DashboardKpiCards
            pnlData={data.pnl}
            balanceData={balanceSummary}
            isLoading={loading}
          />
        </div>

        {/* SECTION 2: Two-column Charts - Monthly Income vs Expenses (Bar) + Expense Breakdown (Donut) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in opacity-0" style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}>
          <CashFlowTrend
            pnlData={data.pnl}
            balances={data.balances}
            isLoading={loading}
          />
          <RecentTransactionsTable
            transactions={data.recentActivity}
            isLoading={loading}
          />
        </div>
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 right-8 max-w-md z-50 animate-slide-in-right">
          <div className="bg-bg-card backdrop-blur-sm border border-error/40 rounded-xl2 p-4 flex items-start gap-3 shadow-xl">
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
