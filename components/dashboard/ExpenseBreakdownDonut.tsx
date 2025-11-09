'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ExpenseCategory {
  name: string;
  expense: number;
  percentage: number;
}

interface ExpenseBreakdownDonutProps {
  overheadCategories: ExpenseCategory[];
  propertyCategories: ExpenseCategory[];
  isLoading: boolean;
}

const COLORS = ['#FF3366', '#FF6B35', '#FFC107', '#00BCD4', '#00FF88', '#9C27B0', '#FF4081', '#FFD700'];

export default function ExpenseBreakdownDonut({ overheadCategories, propertyCategories, isLoading }: ExpenseBreakdownDonutProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl2 p-6">
        <div className="h-6 bg-border-card rounded w-1/2 mb-6 animate-pulse" />
        <div className="h-80 bg-border-card rounded-full animate-pulse mx-auto" />
      </div>
    );
  }

  // Only show overhead expenses
  if (overheadCategories.length === 0) {
    return (
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl2 p-6">
        <h3 className="text-lg font-bebasNeue uppercase text-white mb-6">Overhead Expense Breakdown</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-text-secondary">No overhead expense data available</p>
        </div>
      </div>
    );
  }

  // Filter out zero values and sort by expense
  const expenseData = overheadCategories
    .filter(cat => cat.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .map(cat => ({
      name: cat.name,
      value: cat.expense
    }));

  const totalExpense = expenseData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-linear-to-br from-bg-card to-black/50 backdrop-blur-sm border border-border-card rounded-xl2 p-4 hover:border-yellow/30 hover:shadow-glow-sm transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-lg font-bebasNeue uppercase text-white mb-1">Overhead Expense Breakdown</h3>
        <p className="text-sm text-text-secondary">Current month by category</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            innerRadius={95}
            outerRadius={130}
            fill="#8884d8"
            paddingAngle={2}
            dataKey="value"
            label={({ percent }: any) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
          >
            {expenseData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#171717',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#FFFFFF'
            }}
            labelStyle={{
              color: '#FFFFFF'
            }}
            itemStyle={{
              color: '#FFFFFF'
            }}
            formatter={(value: number) => `฿${value.toLocaleString()}`}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend with scrollable list - BIGGER TEXT */}
      <div className="mt-4 max-h-40 overflow-y-auto space-y-3 pr-2">
        {expenseData.map((entry, index) => {
          const percent = (entry.value / totalExpense) * 100;
          return (
            <div key={index} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div 
                  className="w-4 h-4 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-text-secondary text-sm font-medium truncate">{entry.name}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-text-secondary text-sm font-semibold">{percent.toFixed(1)}%</span>
                <span className="text-white font-bold text-sm min-w-20 text-right">฿{entry.value.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-5 pt-4 border-t border-border-card flex justify-between items-center">
        <span className="text-base font-semibold text-text-secondary">Total Expenses</span>
        <span className="text-xl font-bold text-white">฿{totalExpense.toLocaleString()}</span>
      </div>
    </div>
  );
}
