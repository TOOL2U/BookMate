'use client';

import { useMemo, useState } from 'react';
import { TrendingDown, Loader2, ChevronRight } from 'lucide-react';
import OverheadExpensesModal from '@/components/OverheadExpensesModal';

interface ExpenseItem {
  name: string;
  expense: number;
  percentage: number;
}

interface CategoryRow {
  name: string;
  monthly: number[];
  yearTotal: number;
}

interface PnLExpenseBreakdownProps {
  period: 'month' | 'year';
  overheadsTotal: number;
  propertyPersonTotal: number;
  overheadData?: CategoryRow[];
  propertyData?: CategoryRow[];
  isLoading?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function ExpensePanel({ 
  title, 
  subtitle, 
  total, 
  items, 
  isLoading, 
  error,
  onViewAll
}: { 
  title: string; 
  subtitle: string; 
  total: number; 
  items: ExpenseItem[]; 
  isLoading: boolean; 
  error: string | null;
  onViewAll?: () => void;
}) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-[#2A2A2A] rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#FFFFFF]">{title}</h3>
          <p className="text-sm text-[#A0A0A0] mt-1">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#A0A0A0] uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-[#FFFFFF]">฿{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-[#A0A0A0] animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <TrendingDown className="w-12 h-12 text-[#666666] mx-auto mb-3" />
          <p className="text-[#A0A0A0] text-sm">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <TrendingDown className="w-12 h-12 text-[#666666] mx-auto mb-3" />
          <p className="text-[#A0A0A0] text-sm">No expense data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-2 border-b border-[#2A2A2A] text-xs text-[#A0A0A0] uppercase tracking-wider">
            <div className="col-span-6">Category</div>
            <div className="col-span-3 text-right">Amount</div>
            <div className="col-span-3 text-right">% of Total</div>
          </div>

          {/* Table Rows */}
          {items.slice(0, 5).map((item, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-4 py-3 border-b border-[#2A2A2A] hover:bg-[#222222]/20 transition-colors rounded"
            >
              <div className="col-span-6 text-[#FFFFFF] font-medium truncate">
                {item.name}
              </div>
              <div className="col-span-3 text-right text-[#FFFFFF] font-mono">
                ฿{formatCurrency(item.expense)}
              </div>
              <div className="col-span-3 text-right">
                <span className="text-[#A0A0A0] font-mono">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}

          {/* Show count if more items exist */}
          {items.length > 5 && (
            <div className="text-center pt-2">
              <p className="text-xs text-[#A0A0A0]">
                Showing top 5 of {items.length} categories
              </p>
            </div>
          )}

          {/* View All Button */}
          {onViewAll && items.length > 0 && (
            <div className="pt-4 border-t border-[#2A2A2A]">
              <button
                onClick={onViewAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00D9FF]/10 to-[#9D4EDD]/10 hover:from-[#00D9FF]/20 hover:to-[#9D4EDD]/20 border border-[#00D9FF]/30 rounded-lg text-[#00D9FF] text-sm font-medium transition-all duration-300 hover:shadow-[0_0_16px_rgba(0,217,255,0.3)]"
              >
                View All Categories
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PnLExpenseBreakdown({ 
  period, 
  overheadsTotal, 
  propertyPersonTotal,
  overheadData = [],
  propertyData = [],
  isLoading = false
}: PnLExpenseBreakdownProps) {
  const [isOverheadModalOpen, setIsOverheadModalOpen] = useState(false);

  // Get current month index (0-11)
  const currentMonthIndex = useMemo(() => new Date().getMonth(), []);

  // Transform overhead data to expense items
  const overheadItems = useMemo(() => {
    if (!overheadData || overheadData.length === 0) return [];

    const items: ExpenseItem[] = overheadData
      .map(cat => {
        const expense = period === 'month' 
          ? cat.monthly[currentMonthIndex] || 0
          : cat.yearTotal || 0;
        
        return {
          name: cat.name,
          expense,
          percentage: overheadsTotal > 0 ? (expense / overheadsTotal) * 100 : 0
        };
      })
      .filter(item => item.expense > 0) // Only show categories with expenses
      .sort((a, b) => b.expense - a.expense); // Sort by highest expense first

    return items;
  }, [overheadData, period, currentMonthIndex, overheadsTotal]);

  // Transform property data to expense items
  const propertyPersonItems = useMemo(() => {
    if (!propertyData || propertyData.length === 0) return [];

    const items: ExpenseItem[] = propertyData
      .map(cat => {
        const expense = period === 'month' 
          ? cat.monthly[currentMonthIndex] || 0
          : cat.yearTotal || 0;
        
        return {
          name: cat.name,
          expense,
          percentage: propertyPersonTotal > 0 ? (expense / propertyPersonTotal) * 100 : 0
        };
      })
      .filter(item => item.expense > 0) // Only show properties with expenses
      .sort((a, b) => b.expense - a.expense); // Sort by highest expense first

    return items;
  }, [propertyData, period, currentMonthIndex, propertyPersonTotal]);

  const periodLabel = period === 'month' ? 'This Month' : 'Year to Date';

  return (
    <>
      <div className="space-y-6">
        {/* Section Header */}
        <div>
          <h2 className="text-2xl font-bold text-[#FFFFFF] mb-2">Expense Breakdown</h2>
          <p className="text-[#A0A0A0]">Detailed cost analysis for {periodLabel.toLowerCase()}</p>
        </div>

        {/* Two-column grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ExpensePanel
            title="Overheads"
            subtitle={`Top cost drivers - ${periodLabel}`}
            total={overheadsTotal}
            items={overheadItems}
            isLoading={isLoading}
            error={null}
            onViewAll={() => setIsOverheadModalOpen(true)}
          />
          
          <ExpensePanel
            title="Property/Person Expenses"
            subtitle={`Top cost drivers - ${periodLabel}`}
            total={propertyPersonTotal}
            items={propertyPersonItems}
            isLoading={isLoading}
            error={null}
          />
        </div>
      </div>

      {/* Overhead Expenses Modal */}
      <OverheadExpensesModal
        isOpen={isOverheadModalOpen}
        onClose={() => setIsOverheadModalOpen(false)}
        period={period}
        totalExpense={overheadsTotal}
      />
    </>
  );
}