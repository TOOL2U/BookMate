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
    <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary uppercase tracking-wider">Total</p>
          <p className="text-2xl font-bold text-text-primary">฿{formatCurrency(total)}</p>
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
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow/10 hover:bg-yellow/20 border border-yellow/30 rounded-lg text-yellow text-sm font-medium transition-all duration-300 hover:shadow-glow"
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
  propertyPersonTotal 
}: PnLExpenseBreakdownProps) {
  const [overheadItems, setOverheadItems] = useState<ExpenseItem[]>([]);
  const [propertyPersonItems, setPropertyPersonItems] = useState<ExpenseItem[]>([]);
  const [overheadLoading, setOverheadLoading] = useState(true);
  const [propertyPersonLoading, setPropertyPersonLoading] = useState(true);
  const [overheadError, setOverheadError] = useState<string | null>(null);
  const [propertyPersonError, setPropertyPersonError] = useState<string | null>(null);
  const [showOverheadModal, setShowOverheadModal] = useState(false);
  const [showPropertyModal, setShowPropertyModal] = useState(false);

  useEffect(() => {
    console.log('🔍 PnLExpenseBreakdown: useEffect triggered, period =', period);
    fetchOverheadData();
    fetchPropertyPersonData();
  }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOverheadData = async () => {
    console.log('📊 Fetching overhead expenses for period:', period);
    setOverheadLoading(true);
    setOverheadError(null);
    
    try {
      const response = await fetch(`/api/pnl/overhead-expenses?period=${period}`);
      console.log('📊 Overhead API response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to fetch overhead data');
      }
      
      const result = await response.json();
      console.log('📊 Overhead data received:', result.data?.length, 'items');
      setOverheadItems(result.data || []);
    } catch (err) {
      console.error('❌ Error fetching overhead data:', err);
      setOverheadError(err instanceof Error ? err.message : 'An error occurred');
      setOverheadItems([]);
    } finally {
      setOverheadLoading(false);
    }
  };

  const fetchPropertyPersonData = async () => {
    setPropertyPersonLoading(true);
    setPropertyPersonError(null);
    
    try {
      const response = await fetch(`/api/pnl/property-person?period=${period}`);
      if (!response.ok) {
        throw new Error('Failed to fetch property/person data');
      }
      
      const result = await response.json();
      setPropertyPersonItems(result.data || []);
    } catch (err) {
      setPropertyPersonError(err instanceof Error ? err.message : 'An error occurred');
      setPropertyPersonItems([]);
    } finally {
      setPropertyPersonLoading(false);
    }
  };

  const periodLabel = period === 'month' ? 'This Month' : 'Year to Date';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Expense Breakdown</h2>
        <p className="text-text-secondary">Detailed cost analysis for {periodLabel.toLowerCase()}</p>
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ExpensePanel
          title="Overheads"
          subtitle={`Top cost drivers - ${periodLabel}`}
          total={overheadsTotal}
          items={overheadItems}
          isLoading={overheadLoading}
          error={overheadError}
          onViewAll={() => setShowOverheadModal(true)}
        />
        
        <ExpensePanel
          title="Property/Person Expenses"
          subtitle={`Top cost drivers - ${periodLabel}`}
          total={propertyPersonTotal}
          items={propertyPersonItems}
          isLoading={propertyPersonLoading}
          error={propertyPersonError}
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
        />
      )}

      {/* Property/Person Expenses Modal - Currently reusing OverheadExpensesModal */}
      {showPropertyModal && (
        <OverheadExpensesModal
          isOpen={showPropertyModal}
          onClose={() => setShowPropertyModal(false)}
          period={period}
          totalExpense={propertyPersonTotal}
        />
      )}
    </div>
  );
}

