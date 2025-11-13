'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/layout/AdminShell';
import DashboardKpiCards from '@/components/dashboard/DashboardKpiCards';
import LogoBM from '@/components/LogoBM';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { usePageLoading } from '@/hooks/usePageLoading';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useDashboard } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useQueries';
import { SkeletonKPI, SkeletonChart, SkeletonTable } from '@/components/ui/Skeleton';
import { startPerformanceTimer } from '@/lib/performance';

// Lazy load heavy chart components to improve initial load time
const MonthlyIncomeExpenses = dynamic(
  () => import('@/components/dashboard/MonthlyIncomeExpenses'),
  {
    loading: () => <SkeletonChart />,
    ssr: false
  }
);

const ExpenseBreakdownDonut = dynamic(
  () => import('@/components/dashboard/ExpenseBreakdownDonut'),
  {
    loading: () => <SkeletonChart />,
    ssr: false
  }
);

const CashFlowTrend = dynamic(
  () => import('@/components/dashboard/CashFlowTrend'),
  {
    loading: () => <SkeletonChart />,
    ssr: false
  }
);

const RecentTransactionsTable = dynamic(
  () => import('@/components/dashboard/RecentTransactionsTable'),
  {
    loading: () => <SkeletonTable rows={5} />,
    ssr: false
  }
);

export default function DashboardPage() {
  const queryClient = useQueryClient();
  
  // Coordinate page loading with data fetching
  const { isLoading: showPageLoading, setDataReady } = usePageLoading({
    minLoadingTime: 800
  });
  
  // Use React Query for parallel data fetching with intelligent caching
  const {
    data: dashboardData,
    isLoading,
    error,
  } = useDashboard();

  // Performance tracking
  useEffect(() => {
    const endTimer = startPerformanceTimer('Dashboard');
    
    if (!isLoading && dashboardData) {
      endTimer();
      setDataReady(true);
    }
  }, [isLoading, dashboardData, setDataReady]);

  // Handle manual refresh
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard() });
  };

  // Balance data is already in correct format
  const balanceSummary = dashboardData?.balances || null;

  // Show page loading screen while data loads
  if (showPageLoading) {
    return (
      <AdminShell>
        <PageLoadingScreen />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="relative space-y-4">
        {/* Page header */}
        <div
          className="flex items-center justify-between mb-4 animate-fade-in opacity-0"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
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
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 bg-bg-card hover:bg-black rounded-xl2 transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
            aria-label="Refresh data"
          >
            <RefreshCw
              className={`w-5 h-5 text-text-secondary ${isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-xl2 p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <div>
              <p className="text-error font-semibold font-aileron mb-1">Failed to load dashboard data</p>
              <p className="text-text-secondary text-sm font-aileron">
                Please try refreshing the page or contact support if the issue persists.
              </p>
            </div>
          </div>
        )}

        {/* SECTION 1: KPI Cards */}
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SkeletonKPI />
              <SkeletonKPI />
              <SkeletonKPI />
              <SkeletonKPI />
            </div>
          ) : (
            <DashboardKpiCards
              pnlData={dashboardData?.pnl || null}
              balanceData={balanceSummary}
              isLoading={false}
            />
          )}
        </div>

        {/* SECTION 2: Charts - Monthly Income vs Expenses + Expense Breakdown */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in opacity-0"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          {isLoading ? (
            <>
              <SkeletonChart />
              <SkeletonChart />
            </>
          ) : (
            <>
              <MonthlyIncomeExpenses
                pnlData={dashboardData?.pnl || null}
                isLoading={false}
              />
              <ExpenseBreakdownDonut
                overheadCategories={dashboardData?.overheadCategories || []}
                propertyCategories={dashboardData?.propertyCategories || []}
                isLoading={false}
              />
            </>
          )}
        </div>

        {/* SECTION 3: Cash Flow Trend + Recent Transactions */}
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in opacity-0"
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          {isLoading ? (
            <>
              <SkeletonChart />
              <SkeletonTable rows={5} />
            </>
          ) : (
            <>
              <CashFlowTrend
                pnlData={dashboardData?.pnl || null}
                balances={(dashboardData?.balances?.balances || []).map(b => ({
                  bankName: b.accountName,
                  balance: b.currentBalance
                }))}
                isLoading={false}
              />
              <RecentTransactionsTable
                transactions={dashboardData?.transactions || []}
                isLoading={false}
              />
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
