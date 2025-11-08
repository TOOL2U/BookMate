'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import AdminShell from '@/components/layout/AdminShell';
import LogoBM from '@/components/LogoBM';
import PnLKpiRow from '@/components/pnl/PnLKpiRow';
import PnLTrendChart from '@/components/pnl/PnLTrendChart';
import PnLExpenseBreakdown from '@/components/pnl/PnLExpenseBreakdown';
import PnLDetailedTable from '@/components/pnl/PnLDetailedTable';

// Type definitions
interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface PnLData {
  month: PnLPeriodData;
  year: PnLPeriodData;
  updatedAt: string;
}

// Error Toast Component
function ErrorToast({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="fixed bottom-8 right-8 max-w-md z-50 animate-slide-in-right">
      <div className="bg-gradient-to-br from-bg-card to-black backdrop-blur-sm border border-red-500/30 rounded-xl p-4 flex items-start gap-3 shadow-xl">
        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium mb-1">
            Couldn&apos;t fetch P&L data
          </p>
          <p className="text-xs text-text-secondary">
            {message}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-3 py-1.5 bg-yellow hover:opacity-90 text-black text-xs font-medium rounded-lg transition-all shadow-glow hover:shadow-glow-lg"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function PnLPage() {
  const [data, setData] = useState<PnLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const fetchPnLData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/pnl');
      const result = await response.json();

      if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch P&L data');
      }

      setData(result.data);
      setLastUpdated(new Date(result.data.updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }));

      // Log warnings and computed fallbacks to console for debugging (visible in admin page)
      if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️ P&L Warnings:', result.warnings);
      }
      if (result.computedFallbacks && result.computedFallbacks.length > 0) {
        console.log('→ Computed Fallbacks:', result.computedFallbacks);
      }
      if (result.matchInfo) {
        console.log('→ Match Info:', result.matchInfo);
      }

    } catch (err) {
      console.error('Error fetching P&L data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPnLData();
  }, []);

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-madeMirage font-bold text-text-primary tracking-tight mb-2">
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
            onClick={fetchPnLData}
            disabled={isLoading}
            className="p-3 bg-grey-dark hover:bg-black rounded-xl transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* SECTION 1: KPI Summary Row */}
        <PnLKpiRow
          monthData={data?.month || null}
          yearData={data?.year || null}
          updatedAt={lastUpdated}
          isLoading={isLoading}
        />

        {/* SECTION 2: Trends Chart */}
        <PnLTrendChart
          monthData={data?.month || null}
          yearData={data?.year || null}
          isLoading={isLoading}
        />

        {/* SECTION 3: Expense Breakdown */}
        <PnLExpenseBreakdown
          period={period}
          overheadsTotal={period === 'month' ? (data?.month.overheads || 0) : (data?.year.overheads || 0)}
          propertyPersonTotal={period === 'month' ? (data?.month.propertyPersonExpense || 0) : (data?.year.propertyPersonExpense || 0)}
        />

        {/* SECTION 4: Full P&L Table */}
        <PnLDetailedTable
          monthData={data?.month || null}
          yearData={data?.year || null}
          isLoading={isLoading}
        />

        {/* SECTION 5: Footer / Meta */}
        <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl p-6">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  period === 'month'
                    ? 'bg-yellow text-black shadow-glow'
                    : 'bg-border-card text-text-secondary hover:bg-border-card'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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

      {/* Error Toast */}
      {error && (
        <ErrorToast
          message={error}
          onRetry={fetchPnLData}
        />
      )}
    </AdminShell>
  );
}

