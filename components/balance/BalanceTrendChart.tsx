'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

interface Balance {
  bankName: string;
  balance: number;
  uploadedDate?: string;
  timestamp?: string;
}

interface BalanceTrendChartProps {
  balances: Balance[];
}

export default function BalanceTrendChart({ balances }: BalanceTrendChartProps) {
  // Create trend data showing only current month (November 2025)
  // This will be expanded as more months of data accumulate
  const trendData = balances.length > 0 ? [
    {
      date: 'Nov 2025',
      ...balances.reduce((acc, b) => {
        acc[b.bankName] = b.balance;
        return acc;
      }, {} as Record<string, number>),
      Total: balances.reduce((sum, b) => sum + b.balance, 0)
    }
  ] : [];

  // Brand colors for different banks
  const colors = ['#00ff88', '#ff3366', '#FFF02B', '#00D9FF', '#FF6B9D'];

  if (balances.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-12 h-12 text-muted mx-auto mb-3" />
        <p className="font-aileron text-text-secondary">No balance data available</p>
        <p className="font-aileron text-sm text-muted mt-1">
          Balance trends will appear here once data is available
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Current Balance Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {balances.slice(0, 3).map((balance, idx) => (
          <div key={balance.bankName} className="bg-black border border-border-card rounded-xl2 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-aileron text-sm text-muted">{balance.bankName}</p>
                <p className="font-bebasNeue text-2xl text-text-primary mt-1">
                  ฿{balance.balance.toLocaleString()}
                </p>
              </div>
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[idx % colors.length] }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Balance Distribution Chart */}
      <div className="bg-black border border-border-card rounded-xl2 p-6">
        <h3 className="font-bebasNeue uppercase text-lg text-text-primary mb-4">Balance Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4D4D4D" />
            <XAxis 
              dataKey="date" 
              stroke="#4D4D4D"
              style={{ fontSize: '12px', fontFamily: 'Aileron' }}
            />
            <YAxis 
              stroke="#4D4D4D"
              style={{ fontSize: '12px', fontFamily: 'Aileron' }}
              tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#171717',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                fontFamily: 'Aileron',
                padding: '12px'
              }}
              labelStyle={{ color: '#FFF02B', fontWeight: 'bold', marginBottom: '8px' }}
              formatter={(value: number, name: string) => [
                `฿${value.toLocaleString()}`,
                name
              ]}
            />
            <Legend 
              wrapperStyle={{ 
                fontFamily: 'Aileron', 
                fontSize: '12px',
                paddingTop: '20px'
              }}
              iconType="line"
            />
            
            {/* Total line in yellow (hero color) - prominent */}
            <Line
              type="monotone"
              dataKey="Total"
              stroke="#FFF02B"
              strokeWidth={3}
              dot={{ fill: '#FFF02B', r: 5 }}
              activeDot={{ r: 7 }}
              name="Total Balance"
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="font-aileron text-xs text-muted text-center mt-4">
          Showing data from November 2025 onwards • Historical trends will build as more months are tracked
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-black border border-border-card rounded-xl2 p-4">
          <p className="font-aileron text-sm text-muted">Total Accounts</p>
          <p className="font-bebasNeue text-xl text-text-primary mt-1">{balances.length}</p>
        </div>
        <div className="bg-black border border-border-card rounded-xl2 p-4">
          <p className="font-aileron text-sm text-muted">Total Balance</p>
          <p className="font-bebasNeue text-xl text-success mt-1">
            ฿{balances.reduce((sum, b) => sum + b.balance, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-black border border-border-card rounded-xl2 p-4">
          <p className="font-aileron text-sm text-muted">Highest Account</p>
          <p className="font-bebasNeue text-xl text-text-primary mt-1">
            {balances.reduce((max, b) => b.balance > max.balance ? b : max, balances[0])?.bankName || 'N/A'}
          </p>
        </div>
        <div className="bg-black border border-border-card rounded-xl2 p-4">
          <p className="font-aileron text-sm text-muted">Avg Balance</p>
          <p className="font-bebasNeue text-xl text-text-primary mt-1">
            ฿{(balances.reduce((sum, b) => sum + b.balance, 0) / balances.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>
    </div>
  );
}
