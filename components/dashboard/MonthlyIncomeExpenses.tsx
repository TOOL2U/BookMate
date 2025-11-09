'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface MonthlyIncomeExpensesProps {
  pnlData: {
    month: PnLPeriodData;
    year: PnLPeriodData;
  } | null;
  isLoading: boolean;
}

export default function MonthlyIncomeExpenses({ pnlData, isLoading }: MonthlyIncomeExpensesProps) {
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
      <div className="bg-linear-to-br from-bg-card to-black/50 backdrop-blur-sm border border-border-card rounded-xl2 p-6">
        <h3 className="text-lg font-bebasNeue uppercase text-white mb-6">Income vs Expenses</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-text-secondary">No data available</p>
        </div>
      </div>
    );
  }

  // Prepare chart data - Month vs Year comparison
  // CRITICAL: Show ONLY overhead expenses, NOT property/person expenses
  const chartData = [
    {
      period: 'This Month',
      Income: pnlData.month.revenue,
      Expenses: pnlData.month.overheads, // ✅ ONLY OVERHEADS
    },
    {
      period: 'This Year',
      Income: pnlData.year.revenue,
      Expenses: pnlData.year.overheads, // ✅ ONLY OVERHEADS
    }
  ];

  return (
    <div className="bg-linear-to-br from-bg-card to-black/50 backdrop-blur-sm border border-border-card rounded-xl2 p-4 hover:border-yellow/30 hover:shadow-glow-sm transition-all duration-200 hover:border-[#2A2A2A]/50 transition-all duration-200 group">
      <div className="mb-4">
        <h3 className="text-lg font-bebasNeue uppercase text-white mb-1">Income vs Expenses</h3>
        <p className="text-sm text-text-secondary">Monthly and yearly comparison</p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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
            formatter={(value: number) => `฿${value.toLocaleString()}`}
          />
          <Legend 
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
          />
          <Bar dataKey="Income" fill="#00FF88" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Expenses" fill="#FF3366" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
