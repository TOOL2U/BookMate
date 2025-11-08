'use client';

import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface PnLKpiRowProps {
  monthData: PnLPeriodData | null;
  yearData: PnLPeriodData | null;
  updatedAt: string;
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: number;
  isPercentage?: boolean;
  subtitle?: string;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercentage(value: number): string {
  return value.toFixed(1);
}

function KPICard({ title, value, isPercentage, subtitle, isLoading }: KPICardProps) {
  const isPositive = value >= 0;
  
  if (isLoading) {
    return (
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl p-6 animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-border-card rounded w-2/3" />
          <div className="h-10 bg-border-card rounded w-full" />
          <div className="h-3 bg-border-card rounded w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl p-6 hover:border-yellow/30 hover:shadow-glow-sm transition-all duration-200">
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-text-secondary font-bebasNeue uppercase tracking-wider">
          {title}
        </h3>
        {!isPercentage && (
          <DollarSign className="w-4 h-4 text-blue-500" />
        )}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-2 mb-2">
        {!isPercentage && (
          <span className="font-madeMirage text-4xl text-yellow">
            ฿{formatCurrency(value)}
          </span>
        )}
        {isPercentage && (
          <div className="flex items-center gap-2">
            <span className={`font-madeMirage text-4xl ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatPercentage(value)}%
            </span>
            {isPositive ? (
              <TrendingUp className="w-6 h-6 text-green-400" />
            ) : (
              <TrendingDown className="w-6 h-6 text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Subtitle */}
      <p className="font-aileron text-xs text-text-secondary">
        {subtitle || 'Live from P&L sheet'}
      </p>
    </div>
  );
}

export default function PnLKpiRow({ monthData, yearData, updatedAt, isLoading }: PnLKpiRowProps) {
  // Show only overheads (NOT adding property/person)
  const monthExpenses = monthData?.overheads || 0;
  const yearExpenses = yearData?.overheads || 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <KPICard
          title="Monthly Revenue"
          value={monthData?.revenue || 0}
          subtitle={`Updated: ${updatedAt}`}
          isLoading={isLoading}
        />
        <KPICard
          title="Monthly Expenses"
          value={monthExpenses}
          subtitle="Overhead Expenses Only"
          isLoading={isLoading}
        />
        <KPICard
          title="Monthly GOP"
          value={monthData?.gop || 0}
          subtitle="Gross Operating Profit"
          isLoading={isLoading}
        />
        <KPICard
          title="EBITDA Margin"
          value={monthData?.ebitdaMargin || 0}
          isPercentage
          subtitle="Month profitability"
          isLoading={isLoading}
        />
        <KPICard
          title="YTD GOP"
          value={yearData?.gop || 0}
          subtitle="Year to Date"
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

