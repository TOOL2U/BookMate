'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialSummaryProps {
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
  isLoading: boolean;
}

// Custom tooltip component
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white font-medium">
              ฿{entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function FinancialSummary({ pnlData, isLoading }: FinancialSummaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-6 animate-pulse" />
          <div className="h-80 bg-slate-700/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Prepare data for Month vs Year comparison
  const comparisonData = [
    {
      name: 'Revenue',
      Month: pnlData?.month.revenue || 0,
      Year: pnlData?.year.revenue || 0
    },
    {
      name: 'Overheads',  // Changed from "Expenses" to "Overheads"
      Month: pnlData?.month.overheads || 0,  // Only overheads
      Year: pnlData?.year.overheads || 0
    },
    {
      name: 'GOP',
      Month: pnlData?.month.gop || 0,
      Year: pnlData?.year.gop || 0
    }
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Financial Summary</h2>
        <p className="text-slate-400">Month vs Year comparison</p>
      </div>

      {/* Month vs Year Comparison Chart */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Month vs Year Comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar dataKey="Month" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Year" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

