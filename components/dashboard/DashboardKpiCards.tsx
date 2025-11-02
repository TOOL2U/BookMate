'use client';

import { TrendingUp, TrendingDown, DollarSign, Wallet, Activity, BarChart3 } from 'lucide-react';

interface DashboardKpiCardsProps {
  pnlData: {
    month: {
      revenue: number;
      overheads: number;
      propertyPersonExpense: number;
      gop: number;
      ebitdaMargin: number;
    };
    year: {
      revenue: number;
      overheads: number;
      propertyPersonExpense: number;
      gop: number;
      ebitdaMargin: number;
    };
  } | null;
  balanceData: {
    total: number;
    cash: number;
    bank: number;
  } | null;
  isLoading: boolean;
}

interface KPICardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  isPercentage?: boolean;
  isLoading?: boolean;
  trend?: 'up' | 'down' | 'neutral';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBgColor, 
  iconColor, 
  isPercentage, 
  isLoading,
  trend = 'neutral'
}: KPICardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 animate-pulse">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-slate-700/50 rounded-lg" />
            <div className="h-4 w-16 bg-slate-700/50 rounded" />
          </div>
          <div className="h-4 bg-slate-700/50 rounded w-2/3" />
          <div className="h-10 bg-slate-700/50 rounded w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:border-slate-600/50 transition-all duration-200 group">
      {/* Icon and Badge */}
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg ${iconBgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        <span className="text-xs text-slate-400 uppercase tracking-wider">{subtitle}</span>
      </div>

      {/* Title */}
      <p className="text-sm text-slate-400 mb-2 font-medium">{title}</p>

      {/* Value */}
      <div className="flex items-baseline gap-2">
        {!isPercentage && (
          <p className="text-3xl font-bold text-white">
            ฿{formatCurrency(value)}
          </p>
        )}
        {isPercentage && (
          <div className="flex items-center gap-2">
            <p className={`text-3xl font-bold ${
              trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-blue-400'
            }`}>
              {value.toFixed(1)}%
            </p>
            {trend === 'up' && <TrendingUp className="w-6 h-6 text-green-400" />}
            {trend === 'down' && <TrendingDown className="w-6 h-6 text-red-400" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardKpiCards({ pnlData, balanceData, isLoading }: DashboardKpiCardsProps) {
  const monthRevenue = pnlData?.month.revenue || 0;
  const monthExpenses = (pnlData?.month.overheads || 0) + (pnlData?.month.propertyPersonExpense || 0);
  const monthGop = pnlData?.month.gop || 0;
  const ebitdaMargin = pnlData?.month.ebitdaMargin || 0;
  const totalBalance = balanceData?.total || 0;
  const yearGop = pnlData?.year.gop || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
      <KPICard
        title="Monthly Revenue"
        value={monthRevenue}
        subtitle="This Month"
        icon={<TrendingUp className="w-6 h-6" />}
        iconBgColor="bg-green-500/10"
        iconColor="text-green-500"
        isLoading={isLoading}
        trend="up"
      />
      
      <KPICard
        title="Monthly Expenses"
        value={monthExpenses}
        subtitle="This Month"
        icon={<TrendingDown className="w-6 h-6" />}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
        isLoading={isLoading}
        trend="down"
      />
      
      <KPICard
        title="Monthly GOP"
        value={monthGop}
        subtitle="This Month"
        icon={<DollarSign className="w-6 h-6" />}
        iconBgColor="bg-blue-500/10"
        iconColor="text-blue-500"
        isLoading={isLoading}
      />
      
      <KPICard
        title="EBITDA Margin"
        value={ebitdaMargin}
        subtitle="Profitability"
        icon={<BarChart3 className="w-6 h-6" />}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
        isPercentage
        isLoading={isLoading}
        trend={ebitdaMargin > 0 ? 'up' : 'down'}
      />
      
      <KPICard
        title="Total Cash & Bank"
        value={totalBalance}
        subtitle="Current"
        icon={<Wallet className="w-6 h-6" />}
        iconBgColor="bg-cyan-500/10"
        iconColor="text-cyan-500"
        isLoading={isLoading}
      />
      
      <KPICard
        title="YTD GOP"
        value={yearGop}
        subtitle="Year to Date"
        icon={<Activity className="w-6 h-6" />}
        iconBgColor="bg-orange-500/10"
        iconColor="text-orange-500"
        isLoading={isLoading}
      />
    </div>
  );
}

