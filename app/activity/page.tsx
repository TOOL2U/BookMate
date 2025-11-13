'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Inbox as InboxIcon, Zap, Trash2, AlertCircle } from 'lucide-react';
import { fetchWithAuth, postWithAuth, deleteWithAuth } from '@/lib/api/client';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import AdminShell from '@/components/layout/AdminShell';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { usePageLoading } from '@/hooks/usePageLoading';

interface Receipt {
  id: string;
  rowNumber: number;
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  ref: string;
  debit: number;
  credit: number;
  date: string;
  amount: number;
  status: 'sent' | 'pending';
}

export default function InboxPage() {
  // Coordinate page loading with data fetching
  const { isLoading: showPageLoading, setDataReady } = usePageLoading({
    minLoadingTime: 800
  });
  
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch receipts from API
  const fetchReceipts = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      console.log('📥 Activity Page: Fetching receipts...');
      const startTime = Date.now();

      const response = await fetchWithAuth('/api/inbox');
      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to fetch receipts');
      }

      // Sort receipts by date descending (most recent first)
      const sortedReceipts = (data.data || []).sort((a: Receipt, b: Receipt) => {
        const dateA = new Date(`${a.month} ${a.day}, ${a.year}`);
        const dateB = new Date(`${b.month} ${b.day}, ${b.year}`);
        return dateB.getTime() - dateA.getTime();
      });

      setReceipts(sortedReceipts);
      
      console.log(`✅ Activity Page: Data loaded in ${Date.now() - startTime}ms`);
      setDataReady(true);
    } catch (err: any) {
      console.error('Error fetching receipts:', err);
      setError(err.message || 'Failed to load receipts');
      setDataReady(true); // Still mark ready on error
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Load receipts on mount
  useEffect(() => {
    fetchReceipts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = async (receipt: Receipt) => {
    if (!confirm(`Are you sure you want to delete this entry?\n\n${receipt.detail} - ${receipt.amount} THB`)) {
      return;
    }

    try {
      const response = await deleteWithAuth('/api/inbox', { rowNumber: receipt.rowNumber });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || 'Failed to delete entry');
      }

      // Remove from local state
      setReceipts(receipts.filter((r) => r.id !== receipt.id));
    } catch (err: any) {
      console.error('Error deleting receipt:', err);
      alert('Failed to delete entry: ' + err.message);
    }
  };

  // Show page loading screen while data loads
  if (showPageLoading) {
    return (
      <AdminShell>
        <PageLoadingScreen />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-7xl mx-auto page-transition"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow/10 rounded-xl2 border border-yellow/20">
                <InboxIcon className="w-7 h-7 text-yellow icon" strokeWidth={2} />
              </div>
              <div>
                <h1 className="font-bebasNeue text-3xl uppercase text-white">Activity</h1>
                <p className="text-muted text-sm mt-1 font-aileron">
                  <span className="inline-flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow" strokeWidth={2} />
                    View and manage your processed entries
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchReceipts(true)}
              disabled={isRefreshing}
              className="p-2.5 bg-grey-dark hover:bg-black rounded-xl2 transition-all duration-200 disabled:opacity-50 border border-border shadow-glow-sm"
            >
              <RefreshCw className={`w-5 h-5 text-yellow icon ${isRefreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            </button>
          </div>
        </div>

      {/* Error State */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6"
          >
            <Card className="border-error/40 bg-error/10">
              <div className="flex items-center gap-3 text-error">
                <AlertCircle className="w-5 h-5 flex-shrink-0" strokeWidth={2} />
                <div>
                  <p className="font-semibold font-aileron">Error loading receipts</p>
                  <p className="text-sm opacity-90 text-muted font-aileron">{error}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {isLoading && (
        <Card glow={true}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-12 text-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="inline-block mb-4"
            >
              <RefreshCw className="w-12 h-12 text-yellow" strokeWidth={2} />
            </motion.div>
            <p className="text-muted font-aileron">Loading receipts...</p>
          </motion.div>
        </Card>
      )}

      {/* Desktop Table View */}
      {!isLoading && receipts.length > 0 && (
        <div className="hidden sm:block bg-card border border-border rounded-xl2 overflow-hidden shadow-soft">
          <table className="table">
            <thead>
              <tr className="bg-grey-dark/50">
                <th className="px-4 py-4 w-[25%]">Detail</th>
                <th className="px-4 py-4 w-[12%]">Property</th>
                <th className="px-4 py-4 w-[15%]">Type</th>
                <th className="px-4 py-4 w-[12%]">Amount</th>
                <th className="px-4 py-4 w-[12%]">Date</th>
                <th className="px-4 py-4 w-[12%]">Status</th>
                <th className="px-4 py-4 text-right w-[12%]">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {receipts.map((receipt, index) => (
                  <motion.tr
                    key={receipt.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-grey-dark/30 transition-colors group"
                  >
                    <td className="px-4 py-4">
                      <div className="text-sm font-medium text-fg max-w-[280px] truncate font-aileron">
                        {receipt.detail || '-'}
                      </div>
                      {receipt.ref && (
                        <div className="text-xs text-muted truncate max-w-[280px] font-aileron">
                          Ref: {receipt.ref}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-muted truncate max-w-[120px] font-aileron">{receipt.property || '-'}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-xs font-aileron">
                        <div className="text-fg font-medium truncate max-w-[150px]">{receipt.typeOfOperation || '-'}</div>
                        <div className="text-muted truncate max-w-[150px]">{receipt.typeOfPayment || '-'}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className={`text-sm font-semibold font-aileron ${receipt.debit > 0 ? 'text-error' : 'text-success'}`}>
                        {receipt.debit > 0 ? `-${receipt.debit}` : `+${receipt.credit}`} THB
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-muted font-aileron">{receipt.date || '-'}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <Badge variant="success">
                        Synced
                      </Badge>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDelete(receipt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-error hover:bg-error/10 rounded-xl2 transition-all duration-200 font-aileron border border-transparent hover:border-error/30"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={2} />
                        <span className="hidden xl:inline">Delete</span>
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {/* Mobile Card View */}
      {!isLoading && receipts.length > 0 && (
        <div className="sm:hidden space-y-4">
          <AnimatePresence>
            {receipts.map((receipt, index) => (
              <motion.div
                key={receipt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card hoverable>
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-text-primary truncate">{receipt.detail || 'No description'}</p>
                        <p className="text-xs text-text-tertiary">{receipt.property || '-'}</p>
                      </div>
                      <Badge variant="success">
                        Synced
                      </Badge>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Type:</span>
                        <span className="text-text-primary font-medium">{receipt.typeOfOperation || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Payment:</span>
                        <span className="text-text-primary">{receipt.typeOfPayment || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Amount:</span>
                        <span className={`font-bold ${receipt.debit > 0 ? 'text-error' : 'text-success'}`}>
                          {receipt.debit > 0 ? `-${receipt.debit}` : `+${receipt.credit}`} THB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Date:</span>
                        <span className="text-text-primary">{receipt.date || '-'}</span>
                      </div>
                      {receipt.ref && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Ref:</span>
                          <span className="text-text-primary text-xs">{receipt.ref}</span>
                        </div>
                      )}
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(receipt)}
                      className="w-full mt-2 hover:bg-error/10 hover:text-error hover:border-error/30"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Entry
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && receipts.length === 0 && !error && (
        <Card>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="p-12 text-center"
          >
            {/* Empty icon with animation */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-block mb-4"
            >
              <div className="p-6 bg-gradient-to-br from-surface-2 to-surface-1 rounded-2xl border border-border-light">
                <InboxIcon className="w-16 h-16 text-text-tertiary" />
              </div>
            </motion.div>

            <h3 className="text-xl font-bold text-text-primary mb-2">
              No entries yet
            </h3>
            <p className="text-text-secondary max-w-md mx-auto">
              No activity yet. Upload a receipt or add a manual entry to get started.
            </p>
          </motion.div>
        </Card>
      )}

      {/* Back to Upload Link */}
      {!isLoading && receipts.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/upload"
            className="text-accent hover:text-info font-medium transition-colors duration-200 inline-flex items-center gap-2 group"
          >
            <motion.span
              animate={{ x: [0, -4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ←
            </motion.span>
            <span>Add More Entries</span>
          </Link>
        </motion.div>
      )}
      </motion.div>
    </AdminShell>
  );
}
