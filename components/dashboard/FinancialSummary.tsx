'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

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
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-6 animate-pulse" />
          <div className="h-80 bg-slate-700/50 rounded animate-pulse" />
        </div>
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
      name: 'Expenses',
      Month: (pnlData?.month.overheads || 0) + (pnlData?.month.propertyPersonExpense || 0),
      Year: (pnlData?.year.overheads || 0) + (pnlData?.year.propertyPersonExpense || 0)
    },
    {
      name: 'GOP',
      Month: pnlData?.month.gop || 0,
      Year: pnlData?.year.gop || 0
    }
  ];

  // Prepare data for expense breakdown pie chart
  const monthOverheads = pnlData?.month.overheads || 0;
  const monthPropertyPerson = pnlData?.month.propertyPersonExpense || 0;
  const totalExpenses = monthOverheads + monthPropertyPerson;

  const expenseBreakdownData = [
    { name: 'Overheads', value: monthOverheads },
    { name: 'Property/Person', value: monthPropertyPerson }
  ];

  const COLORS = ['#ef4444', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Financial Summary</h2>
        <p className="text-slate-400">Month vs Year comparison and expense breakdown</p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Monthly Expense Breakdown</h3>
          <div className="h-80 flex items-center justify-center">
            {totalExpenses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `฿${value.toLocaleString()}`}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      border: '1px solid rgba(71, 85, 105, 0.5)',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center">
                <p className="text-slate-400">No expense data available</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-slate-300">Overheads</span>
              </div>
              <span className="text-white font-semibold">฿{monthOverheads.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-slate-300">Property/Person</span>
              </div>
              <span className="text-white font-semibold">฿{monthPropertyPerson.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border-t border-slate-700/50 pt-3">
              <span className="text-white font-medium">Total Expenses</span>
              <span className="text-xl font-bold text-red-400">฿{totalExpenses.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

