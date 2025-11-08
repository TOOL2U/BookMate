'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import LogoBM from '@/components/LogoBM';
import { Activity, Filter, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, User, Search } from 'lucide-react';

type ActivityKind = 'revenue' | 'expense' | 'transfer' | 'all';

interface ActivityItem {
  id: string;
  ts: string;
  kind: 'revenue' | 'expense' | 'transfer';
  fromAccount?: string;
  toAccount?: string;
  amount: number;
  note?: string;
  user?: string;
  source: 'webapp' | 'mobile' | 'api';
  ref?: string;
}

export default function ActivityLogPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  
  // Filters
  const [kindFilter, setKindFilter] = useState<ActivityKind>('all');
  const [accountFilter, setAccountFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selected item for detail view
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);

  const fetchActivities = async (cursor?: string) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.set('limit', '200');
      if (cursor) params.set('cursor', cursor);
      if (kindFilter !== 'all') params.set('kind', kindFilter);
      if (accountFilter) params.set('account', accountFilter);
      if (userFilter) params.set('user', userFilter);
      if (monthFilter) params.set('month', monthFilter);

      const res = await fetch(`/api/activity/log?${params.toString()}`);
      const data = await res.json();

      if (data.ok) {
        setItems(cursor ? [...items, ...data.items] : data.items);
        setNextCursor(data.nextCursor);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch activity log');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [kindFilter, accountFilter, userFilter, monthFilter]);

  const groupByDay = () => {
    const grouped: Record<string, ActivityItem[]> = {};
    
    items.forEach(item => {
      const date = new Date(item.ts).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });

    return grouped;
  };

  const getKindIcon = (kind: 'revenue' | 'expense' | 'transfer') => {
    switch (kind) {
      case 'revenue':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'expense':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'transfer':
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
    }
  };

  const getKindBadge = (kind: 'revenue' | 'expense' | 'transfer') => {
    const styles = {
      revenue: 'bg-green-100 text-green-800 border-green-200',
      expense: 'bg-red-100 text-red-800 border-red-200',
      transfer: 'bg-blue-100 text-blue-800 border-blue-200'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[kind]}`}>
        {getKindIcon(kind)}
        {kind}
      </span>
    );
  };

  const filteredItems = searchTerm
    ? items.filter(item =>
        item.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.fromAccount?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.toAccount?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : items;

  const groupedItems = groupByDay();

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-madeMirage text-3xl text-text-primary tracking-tight">Activity Log</h1>
            <p className="font-aileron text-text-secondary mt-2">
              Live transaction feed from Google Sheets
            </p>
          </div>
          <div className="-ml-86">
            <LogoBM size={100} />
          </div>
          <button
            onClick={() => fetchActivities()}
            className="px-4 py-2 bg-yellow hover:opacity-90 text-black rounded-lg transition-all shadow-glow hover:shadow-glow-lg font-aileron font-medium"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-bg-card border border-border-card rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-text-secondary" />
            <h2 className="font-bebasNeue text-xl text-text-primary uppercase tracking-wide">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="font-bebasNeue block text-sm text-text-secondary uppercase tracking-wide mb-1">Type</label>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as ActivityKind)}
                className="font-aileron w-full px-3 py-2 bg-bg-app border border-border-card text-text-primary rounded-lg focus:ring-2 focus:ring-yellow focus:border-yellow transition-all"
              >
                <option value="all">All Types</option>
                <option value="transfer">Transfer</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="font-bebasNeue block text-sm text-text-secondary uppercase tracking-wide mb-1">Account</label>
              <input
                type="text"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                placeholder="Any account"
                className="font-aileron w-full px-3 py-2 bg-bg-app border border-border-card text-text-primary rounded-lg focus:ring-2 focus:ring-yellow focus:border-yellow transition-all"
              />
            </div>

            <div>
              <label className="font-bebasNeue block text-sm text-text-secondary uppercase tracking-wide mb-1">User</label>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Any user"
                className="font-aileron w-full px-3 py-2 bg-bg-app border border-border-card text-text-primary rounded-lg focus:ring-2 focus:ring-yellow focus:border-yellow transition-all"
              />
            </div>

            <div>
              <label className="font-bebasNeue block text-sm text-text-secondary uppercase tracking-wide mb-1">Month</label>
              <input
                type="text"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                placeholder="JAN or 2025-01"
                className="font-aileron w-full px-3 py-2 bg-bg-app border border-border-card text-text-primary rounded-lg focus:ring-2 focus:ring-yellow focus:border-yellow transition-all"
              />
            </div>

            <div>
              <label className="font-bebasNeue block text-sm text-text-secondary uppercase tracking-wide mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notes..."
                  className="font-aileron w-full pl-9 pr-3 py-2 bg-bg-app border border-border-card text-text-primary rounded-lg focus:ring-2 focus:ring-yellow focus:border-yellow transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <p className="font-aileron text-error">{error}</p>
          </div>
        )}

        {/* Activity Feed */}
        {loading && items.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4 text-yellow animate-pulse" />
            <p className="font-aileron text-text-secondary">Loading activity log...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([date, dayItems]) => (
              <div key={date} className="bg-bg-card border border-border-card rounded-lg overflow-hidden">
                <div className="bg-black/50 px-4 py-2 border-b border-border-card flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <h3 className="font-bebasNeue text-text-primary uppercase tracking-wide">{date}</h3>
                  <span className="font-aileron text-sm text-text-secondary">({dayItems.length} transactions)</span>
                </div>

                <div className="divide-y divide-border-card">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-4 hover:bg-bg-app/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getKindBadge(item.kind)}
                            <span className="font-aileron text-xs text-text-secondary">
                              {new Date(item.ts).toLocaleTimeString()}
                            </span>
                            {item.user && (
                              <span className="font-aileron flex items-center gap-1 text-xs text-text-secondary">
                                <User className="w-3 h-3" />
                                {item.user}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm mb-1">
                            {item.fromAccount && (
                              <span className="font-aileron font-medium text-text-primary">{item.fromAccount}</span>
                            )}
                            {item.kind === 'transfer' && (
                              <ArrowRightLeft className="w-3 h-3 text-text-secondary" />
                            )}
                            {item.toAccount && (
                              <span className="font-aileron font-medium text-text-primary">{item.toAccount}</span>
                            )}
                          </div>

                          {item.note && (
                            <p className="font-aileron text-sm text-text-secondary line-clamp-1">{item.note}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className={`font-madeMirage text-2xl ${
                            item.kind === 'revenue' ? 'text-success' :
                            item.kind === 'expense' ? 'text-error' :
                            'text-accent'
                          }`}>
                            {item.kind === 'expense' ? '-' : '+'}฿{item.amount.toLocaleString()}
                          </p>
                          {item.ref && (
                            <p className="font-aileron text-xs text-text-secondary">Ref: {item.ref}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More */}
            {nextCursor && (
              <div className="text-center">
                <button
                  onClick={() => fetchActivities(nextCursor)}
                  disabled={loading}
                  className="font-aileron px-6 py-2 bg-yellow text-black rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-glow hover:shadow-glow-lg font-medium"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {items.length === 0 && !loading && (
              <div className="text-center py-12 text-text-secondary">
                <Activity className="w-12 h-12 mx-auto mb-4 text-text-tertiary" />
                <p className="font-aileron">No transactions found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-bg-card border border-border-card rounded-xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bebasNeue text-2xl text-text-primary uppercase tracking-wide mb-4">Transaction Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="font-aileron text-text-secondary">Type:</span>
                {getKindBadge(selectedItem.kind)}
              </div>
              <div className="flex justify-between">
                <span className="font-aileron text-text-secondary">Amount:</span>
                <span className="font-madeMirage text-2xl text-yellow">฿{selectedItem.amount.toLocaleString()}</span>
              </div>
              {selectedItem.fromAccount && (
                <div className="flex justify-between">
                  <span className="font-aileron text-text-secondary">From Account:</span>
                  <span className="font-aileron font-medium text-text-primary">{selectedItem.fromAccount}</span>
                </div>
              )}
              {selectedItem.toAccount && (
                <div className="flex justify-between">
                  <span className="font-aileron text-text-secondary">To Account:</span>
                  <span className="font-aileron font-medium text-text-primary">{selectedItem.toAccount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-aileron text-text-secondary">Timestamp:</span>
                <span className="font-aileron text-text-primary">{new Date(selectedItem.ts).toLocaleString()}</span>
              </div>
              {selectedItem.user && (
                <div className="flex justify-between">
                  <span className="font-aileron text-text-secondary">User:</span>
                  <span className="font-aileron text-text-primary">{selectedItem.user}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="font-aileron text-text-secondary">Source:</span>
                <span className="font-aileron capitalize text-text-primary">{selectedItem.source}</span>
              </div>
              {selectedItem.ref && (
                <div className="flex justify-between">
                  <span className="font-aileron text-text-secondary">Reference ID:</span>
                  <span className="font-mono text-xs text-text-primary">{selectedItem.ref}</span>
                </div>
              )}
              {selectedItem.note && (
                <div className="pt-3 border-t border-border-card">
                  <span className="font-aileron text-text-secondary block mb-1">Note:</span>
                  <p className="font-aileron text-text-primary">{selectedItem.note}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="font-aileron mt-6 w-full px-4 py-2 bg-yellow text-black rounded-lg hover:opacity-90 transition-all shadow-glow hover:shadow-glow-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
