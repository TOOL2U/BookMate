'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import AdminShell from '@/components/layout/AdminShell';
import LogoBM from '@/components/LogoBM';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { usePageLoading } from '@/hooks/usePageLoading';
import PnLKpiRow from '@/components/pnl/PnLKpiRow';
import PnLTrendChart from '@/components/pnl/PnLTrendChart';
import PnLExpenseBreakdown from '@/components/pnl/PnLExpenseBreakdown';
import { usePnL, useOverheadCategories, usePropertyCategories } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useQueries';
import { SkeletonKPI, SkeletonChart } from '@/components/ui/Skeleton';
import { startPerformanceTimer } from '@/lib/performance';

export default function PnLPage() {
  const queryClient = useQueryClient();
  const [period, setPeriod] = useState<'month' | 'year'>('month');
  
  // Coordinate page loading with data fetching
  const { isLoading: showPageLoading, setDataReady } = usePageLoading({
    minLoadingTime: 800
  });
  
  // Fetch ALL P&L data in parallel
  const {
    data: pnlData,
    isLoading: isPnLLoading,
    error: pnlError,
  } = usePnL();

  const {
    data: overheadCategories,
    isLoading: isOverheadsLoading,
  } = useOverheadCategories();

  const {
    data: propertyCategories,
    isLoading: isPropertyLoading,
  } = usePropertyCategories();

  // Check if ANY data is still loading
  const isLoading = isPnLLoading || isOverheadsLoading || isPropertyLoading;
  const error = pnlError;

  // Performance tracking - wait for ALL data
  useEffect(() => {
    const endTimer = startPerformanceTimer('P&L Page');
    
    if (!isLoading && pnlData && overheadCategories && propertyCategories) {
      endTimer();
      setDataReady(true);
    }
  }, [isLoading, pnlData, overheadCategories, propertyCategories, setDataReady]);

  // Handle manual refresh - invalidate all P&L related queries
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.pnl });
    queryClient.invalidateQueries({ queryKey: queryKeys.overheadCategories });
    queryClient.invalidateQueries({ queryKey: queryKeys.propertyCategories });
  };

  // Get last updated time
  const lastUpdated = pnlData?.updatedAt 
    ? new Date(pnlData.updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : new Date().toLocaleTimeString();

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
      <div className="space-y-8">
        {/* Header */}
        <div 
          className="flex items-center justify-between mb-8 animate-fade-in opacity-0"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
          <div>
            <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-tight mb-2">
              P&L Dashboard
            </h1>
            <p className="text-text-secondary font-aileron">
              Comprehensive financial performance and analytics
            </p>
          </div>
          <div className="-ml-86">
            <LogoBM size={100} />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-3 bg-grey-dark hover:bg-black rounded-xl2 transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-linear-to-br from-bg-card to-black backdrop-blur-sm border border-red-500/30 rounded-xl2 p-4 flex items-start gap-3 shadow-xl">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-500 font-semibold text-sm">Failed to load P&L data</p>
              <p className="text-muted text-xs mt-1">
                Please try refreshing. If the issue persists, contact support.
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="shrink-0 px-3 py-1.5 bg-yellow hover:opacity-90 text-black text-xs font-medium rounded-xl2 transition-all shadow-glow hover:shadow-glow-lg"
            >
              Retry
            </button>
          </div>
        )}

        {/* SECTION 1: KPI Summary Row */}
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SkeletonKPI />
              <SkeletonKPI />
              <SkeletonKPI />
            </div>
          ) : (
            <PnLKpiRow
              monthData={pnlData?.month || null}
              yearData={pnlData?.year || null}
              updatedAt={lastUpdated}
              isLoading={false}
            />
          )}
        </div>

        {/* SECTION 2: Trends Chart */}
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <PnLTrendChart
              monthData={pnlData?.month || null}
              yearData={pnlData?.year || null}
              isLoading={false}
            />
          )}
        </div>

        {/* SECTION 3: Expense Breakdown */}
        <div
          className="animate-fade-in opacity-0"
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          {isLoading ? (
            <SkeletonChart />
          ) : (
            <PnLExpenseBreakdown
              period={period}
              overheadsTotal={period === 'month' ? (pnlData?.month?.overheads || 0) : (pnlData?.year?.overheads || 0)}
              propertyPersonTotal={period === 'month' ? (pnlData?.month?.propertyPersonExpense || 0) : (pnlData?.year?.propertyPersonExpense || 0)}
              overheadItems={overheadCategories || []}
              propertyPersonItems={propertyCategories || []}
              isLoading={false}
            />
          )}
        </div>

        {/* Footer / Meta with Period Toggle */}
        <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl2 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
            <div className="flex items-center gap-6">
              <span>Last updated: {lastUpdated || 'Loading...'}</span>
              <span>•</span>
              <span>Source: Accounting Buddy Sheet</span>
              <span>•</span>
              <span>Period: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-xl2 text-xs font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-yellow text-black shadow-glow'
                    : 'bg-border-card text-text-secondary hover:bg-border-card'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-xl2 text-xs font-medium transition-colors ${
                  period === 'year'
                    ? 'bg-yellow text-black shadow-glow'
                    : 'bg-border-card text-text-secondary hover:bg-border-card'
                }`}
              >
                Year View
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
