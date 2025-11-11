'use client';

import { Activity, ArrowUpRight, ArrowDownRight, Calendar, MapPin } from 'lucide-react';

interface Transaction {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  debit: number;
  credit: number;
}

interface RecentActivityProps {
  transactions: Transaction[];
  isLoading: boolean;
}

function formatDate(day: string, month: string, year: string): string {
  return `${day} ${month} ${year}`;
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isExpense = transaction.debit > 0;
  const amount = isExpense ? transaction.debit : transaction.credit;

  return (
    <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-bg-card to-black backdrop-blur-sm rounded-lg border border-border-card hover:border-border-card/50 hover:bg-gradient-to-br from-bg-card to-black backdrop-blur-sm transition-all duration-200 group">
      {/* Icon */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isExpense ? 'bg-red-500/10' : 'bg-green-500/10'
      }`}>
        {isExpense ? (
          <ArrowUpRight className="w-5 h-5 text-[#FF3366]" />
        ) : (
          <ArrowDownRight className="w-5 h-5 text-[#00FF88]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[#FFFFFF] font-medium truncate group-hover:text-yellow transition-colors">
          {transaction.detail || 'No description'}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-[#A0A0A0]">
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            <span>{transaction.property}</span>
          </div>
          <span>•</span>
          <span>{transaction.typeOfOperation}</span>
          <span>•</span>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formatDate(transaction.day, transaction.month, transaction.year)}</span>
          </div>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        <p className={`text-lg font-bold ${isExpense ? 'text-red-400' : 'text-green-400'}`}>
          {isExpense ? '-' : '+'}฿{amount.toLocaleString()}
        </p>
        <p className="text-xs text-[#A0A0A0] mt-1">{transaction.typeOfPayment}</p>
      </div>
    </div>
  );
}

export default function RecentActivity({ transactions, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-bg-card to-black backdrop-blur-sm border border-border-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-5 h-5 text-yellow" />
          <h2 className="text-xl font-semibold text-[#FFFFFF]">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-[#222222] animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Recent Activity</h2>
        <p className="text-[#A0A0A0]">Latest transactions from your properties</p>
      </div>

      {/* Activity List */}
      <div className="bg-gradient-to-br from-bg-card to-black backdrop-blur-sm border border-border-card rounded-xl p-6">
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((transaction, idx) => (
              <TransactionRow key={idx} transaction={transaction} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 text-[#666666] mx-auto mb-4" />
            <p className="text-[#A0A0A0] text-lg font-medium mb-2">No recent activity</p>
            <p className="text-sm text-[#A0A0A0]">
              Use the mobile app to add transactions
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

