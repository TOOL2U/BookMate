'use client';

import { Wallet, Banknote, TrendingUp, Building2 } from 'lucide-react';

interface Balance {
  bankName: string;
  balance: number;
  timestamp?: string;
}

interface CashBalanceOverviewProps {
  balances: Balance[];
  isLoading: boolean;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

function formatTimestamp(timestamp?: string): string {
  if (!timestamp) return 'No data';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function CashBalanceOverview({ balances, isLoading }: CashBalanceOverviewProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-6 animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-700/50 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Calculate totals
  const cashBalance = balances.find(b => b.bankName.toLowerCase().includes('cash'))?.balance || 0;
  const bankBalances = balances.filter(b => !b.bankName.toLowerCase().includes('cash'));
  const totalBankBalance = bankBalances.reduce((sum, b) => sum + b.balance, 0);
  const totalBalance = cashBalance + totalBankBalance;

  // Get latest timestamp
  const latestTimestamp = balances
    .map(b => b.timestamp)
    .filter((t): t is string => !!t)
    .sort()
    .reverse()[0];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Cash & Bank Balances</h2>
        <p className="text-slate-400">Current financial position across all accounts</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-blue-200">Total Balance</p>
              <p className="text-xs text-blue-300/60">All accounts combined</p>
            </div>
          </div>
          <p className="text-4xl font-bold text-white mb-2">
            ฿{formatCurrency(totalBalance)}
          </p>
          <p className="text-xs text-blue-300/60">
            Updated: {formatTimestamp(latestTimestamp)}
          </p>
        </div>

        {/* Cash Balance Card */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-slate-300">Cash in Hand</p>
              <p className="text-xs text-slate-500">Physical cash</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-white">
            ฿{formatCurrency(cashBalance)}
          </p>
        </div>
      </div>

      {/* Bank Accounts List */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-white">Bank Accounts</h3>
        </div>

        {bankBalances.length > 0 ? (
          <div className="space-y-3">
            {bankBalances.map((bank, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{bank.bankName}</p>
                    {bank.timestamp && (
                      <p className="text-xs text-slate-500 mt-1">
                        Updated: {formatTimestamp(bank.timestamp)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-white">
                    ฿{formatCurrency(bank.balance)}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {((bank.balance / totalBalance) * 100).toFixed(1)}% of total
                  </p>
                </div>
              </div>
            ))}

            {/* Total Bank Balance Summary */}
            <div className="flex items-center justify-between p-4 bg-purple-500/10 rounded-lg border border-purple-500/30 mt-4">
              <p className="text-purple-200 font-medium">Total Bank Balance</p>
              <p className="text-2xl font-bold text-purple-100">
                ฿{formatCurrency(totalBankBalance)}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No bank accounts found</p>
          </div>
        )}
      </div>
    </div>
  );
}

