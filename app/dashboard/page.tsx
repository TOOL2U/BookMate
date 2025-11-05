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

      // 🆕 Fetch balances - USE UNIFIED BALANCE API (reads from Balance Summary tab)
      const balanceRes = await fetch('/api/balance?month=ALL');
      const balanceData = await balanceRes.json();

      // Fetch recent inbox items
      const inboxRes = await fetch('/api/inbox');
      const inboxData = await inboxRes.json();

      // Process balance data - Map from unified API to Balance format
      let balancesArray: Balance[] = [];
      if (balanceData.ok && balanceData.items) {
        console.log('📊 Dashboard balance source:', balanceData.source); // Will show "BalanceSummary" or "Computed"
        balancesArray = balanceData.items.map((account: any) => ({
          bankName: account.accountName,
          balance: account.currentBalance,
          timestamp: account.lastTxnAt || new Date().toISOString()
        }));
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
            <h1 className="text-3xl font-bold text-text-primary">Dashboard</h1>
            <p className="text-text-secondary mt-1">Comprehensive overview of your business performance</p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="p-3 bg-[#0A0A0A] hover:bg-[#0A0A0A]/80 rounded-lg transition-colors disabled:opacity-50 border border-border-card"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
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
          <div className="bg-[#0A0A0A] backdrop-blur-sm border border-error/40 rounded-xl p-4 flex items-start gap-3 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
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
              className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-accent to-accent-blue text-text-primary text-xs font-medium rounded-lg transition-all duration-300 shadow-[0_0_16px_rgba(0,217,255,0.4)] hover:shadow-[0_0_20px_rgba(0,217,255,0.45)]"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
