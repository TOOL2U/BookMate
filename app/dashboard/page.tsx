'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import FinancialSummary from '@/components/dashboard/FinancialSummary';
import RecentActivity from '@/components/dashboard/RecentActivity';
import CashBalanceOverview from '@/components/dashboard/CashBalanceOverview';
import { RefreshCw, AlertCircle } from 'lucide-react';

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

interface DashboardData {
  pnl: {
    month: PnLPeriodData;
    year: PnLPeriodData;
  } | null;
  balances: Balance[];
  recentActivity: Transaction[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    pnl: null,
    balances: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch P&L summary
      const pnlRes = await fetch('/api/pnl');
      const pnlData = await pnlRes.json();

      // Fetch balances
      const balanceRes = await fetch('/api/balance/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const balanceData = await balanceRes.json();

      // Fetch recent inbox items
      const inboxRes = await fetch('/api/inbox');
      const inboxData = await inboxRes.json();

      // Process balance data
      let balancesArray: Balance[] = [];
      if (balanceData.ok && balanceData.allBalances) {
        balancesArray = Object.values(balanceData.allBalances).filter(
          (b: any) => b.bankName !== 'Bank Name ' && b.balance !== 'Balance'
        ) as Balance[];
      }

      setData({
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
        balances: balancesArray,
        recentActivity: inboxData.ok ? (inboxData.data || []).slice(0, 10) : []
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
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
      <div className="space-y-8">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Comprehensive overview of your business performance</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 border border-slate-700/50"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* SECTION 1: KPI Cards */}
        <DashboardKpiCards
          pnlData={data.pnl}
          balanceData={balanceSummary}
          isLoading={loading}
        />

        {/* SECTION 2: Financial Summary with Charts */}
        <FinancialSummary
          pnlData={data.pnl}
          isLoading={loading}
        />

        {/* SECTION 3: Recent Activity */}
        <RecentActivity
          transactions={data.recentActivity}
          isLoading={loading}
        />

        {/* SECTION 4: Cash & Balance Overview */}
        <CashBalanceOverview
          balances={data.balances}
          isLoading={loading}
        />
      </div>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-8 right-8 max-w-md z-50 animate-slide-in-right">
          <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-start gap-3 shadow-xl">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium mb-1">
                Failed to load dashboard data
              </p>
              <p className="text-xs text-slate-400">
                {error}
              </p>
            </div>
            <button
              onClick={fetchDashboardData}
              className="flex-shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

