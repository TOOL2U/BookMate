'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface OverheadExpenseItem {
  name: string;
  expense: number;
  percentage: number;
}

interface OverheadExpensesModalProps {
  isOpen: boolean;
  onClose: () => void;
  period: 'month' | 'year';
  totalExpense: number;
  expenseType?: 'overhead' | 'property-person'; // Add expense type parameter
}

export default function OverheadExpensesModal({ isOpen, onClose, period, totalExpense, expenseType = 'overhead' }: OverheadExpensesModalProps) {
  const [data, setData] = useState<OverheadExpenseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryTransactions, setCategoryTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchOverheadExpensesData();
    }
  }, [isOpen, period]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOverheadExpensesData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the appropriate API endpoint based on expense type
      const endpoint = expenseType === 'overhead' 
        ? `/api/pnl/overhead-expenses?period=${period}`
        : `/api/pnl/property-person?period=${period}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${expenseType} expenses data`);
      }
      
      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTransactions = async (categoryName: string) => {
    setLoadingTransactions(true);
    setSelectedCategory(categoryName);
    
    try {
      const response = await fetch(`/api/inbox?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const result = await response.json();
      
      // Filter transactions for this specific category
      // For overhead: exact match on typeOfOperation
      // For property/person: match on property name or typeOfOperation
      const filtered = (result.data || []).filter((txn: any) => {
        if (expenseType === 'overhead') {
          // Overhead expenses match exactly on typeOfOperation
          return txn.typeOfOperation === categoryName;
        } else {
          // Property/Person expenses: check if categoryName contains the property/person name
          // Category format is like "EXP - Property/Person - PropertyName" or just "PropertyName"
          const extractedName = categoryName.includes(' - ') 
            ? categoryName.split(' - ').pop()?.trim() 
            : categoryName;
          
          // Match on property field OR if typeOfOperation contains the name
          return txn.property === extractedName || 
                 txn.property === categoryName ||
                 txn.typeOfOperation === categoryName;
        }
      });
      
      setCategoryTransactions(filtered);
    } catch (err) {
      console.error('Error fetching category transactions:', err);
      setCategoryTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      // Close if clicking the same category
      setSelectedCategory(null);
      setCategoryTransactions([]);
    } else {
      fetchCategoryTransactions(categoryName);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 30) return 'text-status-danger';
    if (percentage >= 15) return 'text-status-warning';
    return 'text-status-success';
  };

  // Group expenses by category
  const groupedExpenses = data.reduce((acc, item) => {
    // Extract category from name (e.g., "EXP - Utilities - Gas" -> "Utilities")
    const match = item.name.match(/EXP - ([^-]+)/);
    const category = match ? match[1].trim() : 'Other';
    
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, OverheadExpenseItem[]>);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 isolate">
          {/* Full Screen Backdrop with Strong Opacity */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />
          
          {/* Modal Container - Centered on Screen */}
          <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="bg-bg-card backdrop-blur-xl rounded-xl2 shadow-glow-lg border border-border-card max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col my-auto"
            >
              {/* Header */}
              <div className="px-8 py-6 border-b border-border-card shrink-0 bg-bg-app/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bebasNeue uppercase text-text-primary tracking-tight">
                      {expenseType === 'overhead' ? 'Overhead Expenses' : 'Property Expenses'} Breakdown
                    </h2>
                    <p className="text-text-secondary font-aileron mt-2">
                      {period === 'month' ? 'This Month' : 'Year Total'} • {formatCurrency(totalExpense)} Total
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-3 hover:bg-black rounded-xl2 transition-all border border-border-card hover:border-yellow/20"
                    aria-label="Close modal"
                  >
                    <svg className="w-5 h-5 text-text-secondary hover:text-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 overflow-y-auto flex-1 bg-bg-card">
                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                    <span className="ml-4 text-text-primary text-base">Loading {expenseType} expenses...</span>
                  </div>
                )}

                {error && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">❌</div>
                    <p className="text-text-primary text-sm mb-1">Error loading data</p>
                    <p className="text-text-secondary text-xs mb-4">{error}</p>
                    <button
                      onClick={fetchOverheadExpensesData}
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-xl2 transition-colors text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {!loading && !error && data.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">📊</div>
                    <p className="text-text-primary text-sm">No overhead expenses found</p>
                    <p className="text-text-secondary text-xs mt-1">No data available for this period</p>
                  </div>
                )}

                {!loading && !error && data.length > 0 && (
                  <div className="space-y-8">
                    {Object.entries(groupedExpenses).map(([category, items]) => (
                      <div key={category} className="space-y-3">
                        {/* Category Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-base font-semibold text-yellow uppercase tracking-wide font-bebasNeue">
                            {category}
                          </h3>
                          <div className="flex-1 h-px bg-white/20"></div>
                          <span className="text-sm text-text-secondary">
                            {items.length} {items.length === 1 ? 'item' : 'items'}
                          </span>
                        </div>

                        {/* Category Items */}
                        <div className="space-y-3">
                          {items.map((item, index) => {
                            // Extract subcategory (everything after the main category)
                            const subcategoryMatch = item.name.match(/EXP - [^-]+ - (.+)/);
                            const subcategory = subcategoryMatch ? subcategoryMatch[1].trim() : item.name;

                            return (
                              <motion.div
                                key={item.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="cursor-pointer"
                              >
                                <div
                                  onClick={() => handleCategoryClick(item.name)}
                                  className="flex items-center justify-between p-4 bg-bg-card hover:bg-black/60 border border-border-card hover:border-yellow/40 rounded-xl2 transition-all duration-150"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-medium text-white mb-2 truncate">
                                      {subcategory}
                                    </h4>
                                    <div className="flex items-center space-x-3">
                                      <span className={`text-sm font-medium ${getPercentageColor(item.percentage)}`}>
                                        {item.percentage.toFixed(1)}% of {expenseType === 'overhead' ? 'overhead' : 'property/person'}
                                      </span>
                                      {selectedCategory === item.name && (
                                        <span className="text-sm text-yellow">
                                          • {categoryTransactions.length} transaction{categoryTransactions.length !== 1 ? 's' : ''}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0 ml-4">
                                    <div className="text-lg font-semibold text-white">
                                      {formatCurrency(item.expense)}
                                    </div>
                                  </div>
                                </div>

                                {/* Transactions List - Shows when category is selected */}
                                {selectedCategory === item.name && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mt-3 ml-6 space-y-3 border-l-2 border-yellow/30 pl-6"
                                  >
                                    {loadingTransactions ? (
                                      <div className="py-6 text-center text-sm text-text-secondary">
                                        Loading transactions...
                                      </div>
                                    ) : categoryTransactions.length === 0 ? (
                                      <div className="py-6 text-center text-sm text-text-secondary">
                                        No transactions found for this category
                                      </div>
                                    ) : (
                                      categoryTransactions.map((txn: any, txnIndex: number) => (
                                        <div
                                          key={txnIndex}
                                          className="p-4 bg-black/40 border border-border-card rounded-xl2 text-sm"
                                        >
                                          <div className="flex justify-between items-start mb-2">
                                            <span className="text-white font-medium text-base">
                                              {txn.detail || 'No description'}
                                            </span>
                                            <span className="text-error font-semibold text-base">
                                              ฿{txn.debit.toLocaleString()}
                                            </span>
                                          </div>
                                          <div className="flex justify-between text-text-secondary text-sm">
                                            <span>{txn.day}/{txn.month}/{txn.year}</span>
                                            <span>{txn.typeOfPayment}</span>
                                          </div>
                                          {txn.property && (
                                            <div className="mt-2 text-text-secondary text-sm">
                                              Property: {txn.property}
                                            </div>
                                          )}
                                        </div>
                                      ))
                                    )}
                                  </motion.div>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {!loading && !error && data.length > 0 && (
                <div className="px-8 py-6 border-t border-border-card shrink-0 bg-linear-to-r from-bg-card to-black">
                  <div className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-4">
                      <span className="text-text-primary">
                        {data.length} expense {data.length === 1 ? 'category' : 'categories'}
                      </span>
                      <span className="text-text-secondary">
                        {Object.keys(groupedExpenses).length} {Object.keys(groupedExpenses).length === 1 ? 'group' : 'groups'}
                      </span>
                    </div>
                    <span className="text-white font-medium">
                      Total: {formatCurrency(data.reduce((sum, item) => sum + item.expense, 0))}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  // Use portal to render modal at body level, breaking out of any parent containers
  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
