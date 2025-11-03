'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle } from 'lucide-react';
import AdminShell from '@/components/layout/AdminShell';
import PnLKpiRow from '@/components/pnl/PnLKpiRow';
import PnLTrendChart from '@/components/pnl/PnLTrendChart';
import PnLExpenseBreakdown from '@/components/pnl/PnLExpenseBreakdown';
import PnLDetailedTable from '@/components/pnl/PnLDetailedTable';

// Type definitions for Live P&L API
interface CategoryRow {
  name: string;
  monthly: number[];
  yearTotal: number;
}

interface BlockData {
  revenue: CategoryRow[];
  overhead: CategoryRow[];
  property: CategoryRow[];
  payment: CategoryRow[];
}

interface TotalData {
  monthly: number[];
  yearTotal: number;
}

interface Totals {
  revenue: TotalData;
  overhead: TotalData;
  property: TotalData;
  payment: TotalData;
  grand: TotalData;
}

interface PnLLiveData {
  months: string[];
  blocks: BlockData;
  totals: Totals;
  updatedAt: string;
  cached?: boolean;
  cacheAge?: number;
}

// Legacy type for backward compatibility
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

// Utility functions
const formatMonth = (month: string): string => {
  const monthMap: Record<string, string> = {
    'JAN': 'Jan', 'FEB': 'Feb', 'MAR': 'Mar',
    'APR': 'Apr', 'MAY': 'May', 'JUN': 'Jun',
    'JUL': 'Jul', 'AUG': 'Aug', 'SEPT': 'Sep',
    'OCT': 'Oct', 'NOV': 'Nov', 'DEC': 'Dec'
  };
  return monthMap[month.toUpperCase()] || month;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const calculateGOP = (revenue: number, overhead: number): number => {
  return revenue - overhead;
};

const calculateEBITDAMargin = (gop: number, revenue: number): number => {
  return revenue > 0 ? (gop / revenue) * 100 : 0;
};

// Error Toast Component
function ErrorToast({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="fixed bottom-8 right-8 max-w-md z-50 animate-slide-in-right">
      <div className="bg-bg-card backdrop-blur-sm border border-error/40 rounded-xl p-4 flex items-start gap-3 shadow-[0_12px_48px_rgba(0,0,0,0.5)]">
        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text-primary font-medium mb-1">
            Couldn&apos;t fetch P&L data
          </p>
          <p className="text-xs text-text-secondary">
            {message}
          </p>
        </div>
        <button
          onClick={onRetry}
          className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-r from-accent to-accent-purple hover:shadow-[0_0_16px_rgba(0,217,255,0.5)] text-text-primary text-xs font-medium rounded-lg transition-all duration-300"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

export default function PnLPage() {
  const [liveData, setLiveData] = useState<PnLLiveData | null>(null);
  const [data, setData] = useState<PnLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [period, setPeriod] = useState<'month' | 'year'>('month');

  const fetchPnLData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/pnl/live');
      const result = await response.json();

      if (result.ok === false) {
        throw new Error(result.error || 'Failed to fetch P&L data');
      }

      setLiveData(result);

      // Get current month index (0-11)
      const currentMonthIndex = new Date().getMonth();

      // Transform live data to legacy format for existing components
      const transformedData: PnLData = {
        month: {
          revenue: result.totals.revenue.monthly[currentMonthIndex] || 0,
          overheads: result.totals.overhead.monthly[currentMonthIndex] || 0,
          propertyPersonExpense: result.totals.property.monthly[currentMonthIndex] || 0,
          gop: calculateGOP(
            result.totals.revenue.monthly[currentMonthIndex] || 0,
            result.totals.overhead.monthly[currentMonthIndex] || 0
          ),
          ebitdaMargin: calculateEBITDAMargin(
            calculateGOP(
              result.totals.revenue.monthly[currentMonthIndex] || 0,
              result.totals.overhead.monthly[currentMonthIndex] || 0
            ),
            result.totals.revenue.monthly[currentMonthIndex] || 0
          )
        },
        year: {
          revenue: result.totals.revenue.yearTotal || 0,
          overheads: result.totals.overhead.yearTotal || 0,
          propertyPersonExpense: result.totals.property.yearTotal || 0,
          gop: calculateGOP(
            result.totals.revenue.yearTotal || 0,
            result.totals.overhead.yearTotal || 0
          ),
          ebitdaMargin: calculateEBITDAMargin(
            calculateGOP(
              result.totals.revenue.yearTotal || 0,
              result.totals.overhead.yearTotal || 0
            ),
            result.totals.revenue.yearTotal || 0
          )
        },
        updatedAt: result.updatedAt
      };

      setData(transformedData);
      
      setLastUpdated(new Date(result.updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok'
      }));

      // Log cache status
      if (result.cached) {
        console.log(`✅ Using cached data (${result.cacheAge}s old)`);
      } else {
        console.log('📊 Fresh data from Google Sheets');
      }

      // Log formatted months for verification
      console.log('📅 Months:', result.months.map(formatMonth).join(', '));

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">P&L Dashboard</h1>
            <p className="text-text-secondary">
              Comprehensive financial performance and analytics
            </p>
          </div>
          <button
            onClick={fetchPnLData}
            disabled={isLoading}
            className="p-3 bg-bg-card hover:bg-bg-card/80 rounded-lg transition-colors disabled:opacity-50 border border-border-card"
            aria-label="Refresh data"
          >
            <RefreshCw className={`w-5 h-5 text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
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
          overheadData={liveData?.blocks.overhead || []}
          propertyData={liveData?.blocks.property || []}
          isLoading={isLoading}
        />

        {/* SECTION 4: Full P&L Table */}
        <PnLDetailedTable
          monthData={data?.month || null}
          yearData={data?.year || null}
          isLoading={isLoading}
        />

        {/* SECTION 5: Footer / Meta */}
        <div className="bg-bg-card border border-border-card rounded-xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-text-tertiary">
            <div className="flex items-center gap-6">
              <span>Last updated: {lastUpdated || 'Loading...'}</span>
              <span>•</span>
              <span>Source: Lists Sheet (Formula-based)</span>
              {liveData?.cached && (
                <>
                  <span>•</span>
                  <span className="text-accent">Cached ({liveData.cacheAge}s ago)</span>
                </>
              )}
              <span>•</span>
              <span>Period: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
              {data && (
                <>
                  <span>•</span>
                  <span className="font-medium text-text-secondary">
                    GOP {period === 'month' ? 'This Month' : 'YTD'}: {formatCurrency(
                      period === 'month' 
                        ? data.month.revenue - data.month.overheads
                        : data.year.revenue - data.year.overheads
                    )}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPeriod('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  period === 'month'
                    ? 'bg-gradient-to-r from-[#00D9FF] to-[#9D4EDD] text-[#FFFFFF] shadow-[0_0_16px_rgba(0,217,255,0.5)]'
                    : 'bg-slate-700/40 text-[#A0A0A0] hover:bg-slate-700/50'
                }`}
              >
                Month View
              </button>
              <button
                onClick={() => setPeriod('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 ${
                  period === 'year'
                    ? 'bg-gradient-to-r from-[#00D9FF] to-[#9D4EDD] text-[#FFFFFF] shadow-[0_0_16px_rgba(0,217,255,0.5)]'
                    : 'bg-slate-700/40 text-[#A0A0A0] hover:bg-slate-700/50'
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
