'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface PnLTrendChartProps {
  monthData: PnLPeriodData | null;
  yearData: PnLPeriodData | null;
  isLoading: boolean;
}

// Generate placeholder data for the chart
// In the future, this will be replaced with actual historical data from the API
function generatePlaceholderData(monthData: PnLPeriodData | null): any[] {
  if (!monthData) {
    return [];
  }

  const currentMonth = new Date().getMonth();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Generate last 6 months of data (placeholder - will be replaced with real data)
  const data = [];
  for (let i = 5; i >= 0; i--) {
    const monthIndex = (currentMonth - i + 12) % 12;
    const monthName = months[monthIndex];
    
    // For current month, use actual data
    if (i === 0) {
      data.push({
        month: monthName,
        revenue: monthData.revenue,
        expenses: monthData.overheads + monthData.propertyPersonExpense,
        gop: monthData.gop
      });
    } else {
      // For past months, generate placeholder data (80-120% of current values)
      const variance = 0.8 + Math.random() * 0.4;
      data.push({
        month: monthName,
        revenue: Math.round(monthData.revenue * variance),
        expenses: Math.round((monthData.overheads + monthData.propertyPersonExpense) * variance),
        gop: Math.round(monthData.gop * variance)
      });
    }
  }
  
  return data;
}

// Custom tooltip component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700/50 rounded-lg p-4 shadow-xl">
        <p className="text-white font-semibold mb-2">{label}</p>
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

export default function PnLTrendChart({ monthData, yearData, isLoading }: PnLTrendChartProps) {
  const chartData = generatePlaceholderData(monthData);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="space-y-4">
          <div className="h-6 bg-slate-700/50 rounded w-1/3 animate-pulse" />
          <div className="h-80 bg-slate-700/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-2">Revenue vs Expenses Trend</h2>
        <p className="text-sm text-slate-400">
          Last 6 months performance overview
          <span className="ml-2 text-xs text-slate-500">(Historical data coming soon)</span>
        </p>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis 
              dataKey="month" 
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
              iconType="line"
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Revenue"
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={3}
              name="Expenses"
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="gop" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="GOP"
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explanation */}
      <div className="mt-4 flex items-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Revenue (Income)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Expenses (Costs)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>GOP (Profit)</span>
        </div>
      </div>
    </div>
  );
}

