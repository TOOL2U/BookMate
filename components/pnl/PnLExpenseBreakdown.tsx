'use client';

import { useState, useEffect } from 'react';
import { TrendingDown, Loader2, ChevronRight } from 'lucide-react';
import OverheadExpensesModal from '@/components/OverheadExpensesModal';

interface ExpenseItem {
  name: string;
  expense: number;
  percentage: number;
}

interface PnLExpenseBreakdownProps {
  period: 'month' | 'year';
  overheadsTotal: number;
  propertyPersonTotal: number;
  overheadItems?: ExpenseItem[];
  propertyPersonItems?: ExpenseItem[];
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
    <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl2 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bebasNeue text-xl text-text-primary uppercase tracking-wide">{title}</h3>
          <p className="font-aileron text-sm text-text-secondary mt-1">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="font-aileron text-xs text-text-secondary uppercase tracking-wider">Total</p>
          <p className="font-madeMirage text-3xl text-yellow">฿{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-text-secondary animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <TrendingDown className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">{error}</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <TrendingDown className="w-12 h-12 text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No expense data available</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 pb-2 border-b border-border-card text-xs text-text-secondary uppercase tracking-wider">
            <div className="col-span-6">Category</div>
            <div className="col-span-3 text-right">Amount</div>
            <div className="col-span-3 text-right">% of Total</div>
          </div>

          {/* Table Rows */}
          {items.slice(0, 5).map((item, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-4 py-3 border-b border-border-card hover:bg-bg-app/20 transition-colors rounded"
            >
              <div className="col-span-6 text-text-primary font-medium truncate">
                {item.name}
              </div>
              <div className="col-span-3 text-right text-text-primary font-mono">
                ฿{formatCurrency(item.expense)}
              </div>
              <div className="col-span-3 text-right">
                <span className="text-text-secondary font-mono">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}

          {/* Show count if more items exist */}
          {items.length > 5 && (
            <div className="text-center pt-4">
              <p className="text-xs text-text-secondary mb-3">
                Showing top 5 of {items.length} categories
              </p>
              {onViewAll && (
                <button
                  onClick={onViewAll}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow/10 hover:bg-yellow/20 border border-yellow/30 rounded-xl2 text-yellow text-sm font-medium transition-all duration-300 hover:shadow-glow"
                >
                  <span>View All Categories</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
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
  overheadItems = [],
  propertyPersonItems = [],
  isLoading = false
}: PnLExpenseBreakdownProps) {
  const [showOverheadModal, setShowOverheadModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  const periodLabel = period === 'month' ? 'This Month' : 'Year to Date';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="font-bebasNeue text-3xl text-text-primary uppercase tracking-wide mb-2">Expense Breakdown</h2>
        <p className="font-aileron text-text-secondary">Detailed cost analysis for {periodLabel.toLowerCase()}</p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpensePanel
          title="Overheads"
          subtitle={`Top cost drivers - ${periodLabel}`}
          total={overheadsTotal}
          items={overheadItems}
          isLoading={isLoading}
          error={null}
          onViewAll={() => setShowOverheadModal(true)}
        />
        
        <ExpensePanel
          title="Property Expenses"
          subtitle={`Top cost drivers - ${periodLabel}`}
          total={propertyPersonTotal}
          items={propertyPersonItems}
          isLoading={isLoading}
          error={null}
          onViewAll={() => setShowPropertyModal(true)}
        />
      </div>

      {/* Overhead Expenses Modal */}
      {showOverheadModal && (
        <OverheadExpensesModal
          isOpen={showOverheadModal}
          onClose={() => setShowOverheadModal(false)}
          period={period}
          totalExpense={overheadsTotal}
          expenseType="overhead"
        />
      )}

      {/* Property/Person Expenses Modal */}
      {showPropertyModal && (
        <OverheadExpensesModal
          isOpen={showPropertyModal}
          onClose={() => setShowPropertyModal(false)}
          period={period}
          totalExpense={propertyPersonTotal}
          expenseType="property-person"
        />
      )}
    </div>
  );
}

