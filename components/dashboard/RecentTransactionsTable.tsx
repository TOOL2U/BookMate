'use client';

import { Calendar, Tag, DollarSign } from 'lucide-react';

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

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function RecentTransactionsTable({ transactions, isLoading }: RecentTransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-bg-card to-black backdrop-blur-sm border border-border-card rounded-xl2 p-6">
        <div className="h-6 bg-border-card rounded w-1/2 mb-6 animate-pulse" />
        <div className="space-y-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-border-card rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const formatDate = (txn: Transaction) => {
    return `${txn.day}/${txn.month}/${txn.year}`;
  };

  const getAmount = (txn: Transaction) => {
    return txn.credit > 0 ? txn.credit : -txn.debit;
  };

  const isIncome = (txn: Transaction) => {
    return txn.credit > 0;
  };

  // Sort transactions by date (most recent first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    // Parse date components - month might be text like "NOV" or number like "11"
    const parseMonth = (month: string): number => {
      const monthNum = parseInt(month);
      if (!isNaN(monthNum)) return monthNum - 1; // If numeric, convert to 0-indexed
      
      // If text month like "NOV", convert to number
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const monthIndex = months.indexOf(month.toUpperCase());
      return monthIndex >= 0 ? monthIndex : 0;
    };

    const dateA = new Date(parseInt(a.year), parseMonth(a.month), parseInt(a.day));
    const dateB = new Date(parseInt(b.year), parseMonth(b.month), parseInt(b.day));
    
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });

  return (
    <div className="bg-linear-to-br from-bg-card to-black/50 backdrop-blur-sm border border-border-card rounded-xl2 p-4 h-full hover:border-yellow/30 hover:shadow-glow-sm transition-all duration-200">
      <div className="mb-4">
        <h3 className="text-lg font-bebasNeue uppercase text-white mb-1">Recent Transactions</h3>
        <p className="text-sm text-text-secondary">
          {sortedTransactions.length > 0 
            ? `${sortedTransactions.length} transaction${sortedTransactions.length !== 1 ? 's' : ''} • Most recent first`
            : 'No transactions yet'
          }
        </p>
      </div>

      {sortedTransactions.length > 0 ? (
        <div className="space-y-2 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
          {sortedTransactions.map((txn, index) => {
            const amount = getAmount(txn);
            const income = isIncome(txn);
            
            return (
              <div 
                key={index}
                className="p-4 bg-black/50 rounded-lg border border-border-card hover:border-yellow/20 transition-all group"
              >
                {/* Date and Amount Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <span className="text-xs text-text-secondary font-aileron">
                      {formatDate(txn)}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${income ? 'text-green-400' : 'text-red-400'}`}>
                    {income ? '+' : ''}฿{Math.abs(amount).toLocaleString()}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-white font-medium mb-2 line-clamp-1">
                  {txn.detail || 'No description'}
                </p>

                {/* Category and Payment Method */}
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3 text-yellow" />
                    <span className="text-text-secondary">{txn.typeOfOperation}</span>
                  </div>
                  {txn.typeOfPayment && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-yellow" />
                      <span className="text-text-secondary">{txn.typeOfPayment}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center">
          <p className="text-text-secondary">No recent transactions</p>
        </div>
      )}

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(42, 42, 42, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 240, 43, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 240, 43, 0.5);
        }
      `}</style>
    </div>
  );
}
