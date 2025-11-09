'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
}

interface CashFlowTrendProps {
  pnlData: {
    month: PnLPeriodData;
    year: PnLPeriodData;
  } | null;
  balances: Balance[];
  isLoading: boolean;
}

export default function CashFlowTrend({ pnlData, balances, isLoading }: CashFlowTrendProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl2 p-6">
        <div className="h-6 bg-border-card rounded w-1/2 mb-6 animate-pulse" />
        <div className="h-80 bg-border-card rounded animate-pulse" />
      </div>
    );
  }

  if (!pnlData) {
    return (
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl2 p-6">
        <h3 className="text-lg font-bebasNeue uppercase text-white mb-6">Net Profit Trend</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-text-secondary">No data available</p>
        </div>
      </div>
    );
  }

  const totalBalance = balances.reduce((sum, b) => sum + b.balance, 0);

  // Create comparison data - Month vs Year GOP (Net Profit)
  const chartData = [
    {
      period: 'This Month',
      profit: pnlData.month.gop
    },
    {
      period: 'This Year',
      profit: pnlData.year.gop
    }
  ];

  // Debug: Log the values being displayed
  console.log('📊 Net Profit Trend Chart Data:', {
    monthGOP: pnlData.month.gop,
    yearGOP: pnlData.year.gop,
    monthRevenue: pnlData.month.revenue,
    monthOverheads: pnlData.month.overheads,
    monthProperty: pnlData.month.propertyPersonExpense,
    calculation: `${pnlData.month.revenue} - ${pnlData.month.overheads} - ${pnlData.month.propertyPersonExpense} = ${pnlData.month.revenue - pnlData.month.overheads - pnlData.month.propertyPersonExpense}`
  });

  return (
    <div className="bg-linear-to-br from-bg-card to-black/50 backdrop-blur-sm border border-border-card rounded-xl2 p-8 h-full hover:border-yellow/30 hover:shadow-glow-sm transition-all duration-200">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bebasNeue uppercase text-white mb-8">Net Profit Trend</h3>
          <p className="text-sm text-text-secondary">GOP comparison</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary mb-1">Current Balance</p>
          <p className="text-xl font-bold text-yellow">฿{totalBalance.toLocaleString()}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
          <XAxis 
            dataKey="period" 
            stroke="#b5b5b5"
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            stroke="#b5b5b5"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#171717',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              fontSize: '12px'
            }}
            formatter={(value: number) => [`฿${value.toLocaleString()}`, 'Net Profit (GOP)']}
          />
          <Line 
            type="monotone" 
            dataKey="profit" 
            stroke="#FFF02B" 
            strokeWidth={3}
            dot={{ fill: '#FFF02B', r: 6 }}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
