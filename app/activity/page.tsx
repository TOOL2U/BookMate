'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
            <p className="text-sm text-gray-500 mt-1">
              Live transaction feed from Google Sheets
            </p>
          </div>
          <button
            onClick={() => fetchActivities()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={kindFilter}
                onChange={(e) => setKindFilter(e.target.value as ActivityKind)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="transfer">Transfer</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <input
                type="text"
                value={accountFilter}
                onChange={(e) => setAccountFilter(e.target.value)}
                placeholder="Any account"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
              <input
                type="text"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Any user"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="text"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                placeholder="JAN or 2025-01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Activity Feed */}
        {loading && items.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <p className="text-gray-600">Loading activity log...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedItems).map(([date, dayItems]) => (
              <div key={date} className="bg-white rounded-lg shadow overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">{date}</h3>
                  <span className="text-sm text-gray-500">({dayItems.length} transactions)</span>
                </div>

                <div className="divide-y divide-gray-200">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getKindBadge(item.kind)}
                            <span className="text-xs text-gray-500">
                              {new Date(item.ts).toLocaleTimeString()}
                            </span>
                            {item.user && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                {item.user}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm mb-1">
                            {item.fromAccount && (
                              <span className="font-medium text-gray-900">{item.fromAccount}</span>
                            )}
                            {item.kind === 'transfer' && (
                              <ArrowRightLeft className="w-3 h-3 text-gray-400" />
                            )}
                            {item.toAccount && (
                              <span className="font-medium text-gray-900">{item.toAccount}</span>
                            )}
                          </div>

                          {item.note && (
                            <p className="text-sm text-gray-600 line-clamp-1">{item.note}</p>
                          )}
                        </div>

                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            item.kind === 'revenue' ? 'text-green-600' :
                            item.kind === 'expense' ? 'text-red-600' :
                            'text-blue-600'
                          }`}>
                            {item.kind === 'expense' ? '-' : '+'}฿{item.amount.toLocaleString()}
                          </p>
                          {item.ref && (
                            <p className="text-xs text-gray-500">Ref: {item.ref}</p>
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
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}

            {items.length === 0 && !loading && (
              <div className="text-center py-12 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No transactions found</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Transaction Details</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                {getKindBadge(selectedItem.kind)}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-semibold">฿{selectedItem.amount.toLocaleString()}</span>
              </div>
              {selectedItem.fromAccount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">From Account:</span>
                  <span className="font-medium">{selectedItem.fromAccount}</span>
                </div>
              )}
              {selectedItem.toAccount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">To Account:</span>
                  <span className="font-medium">{selectedItem.toAccount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Timestamp:</span>
                <span>{new Date(selectedItem.ts).toLocaleString()}</span>
              </div>
              {selectedItem.user && (
                <div className="flex justify-between">
                  <span className="text-gray-500">User:</span>
                  <span>{selectedItem.user}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Source:</span>
                <span className="capitalize">{selectedItem.source}</span>
              </div>
              {selectedItem.ref && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference ID:</span>
                  <span className="font-mono text-xs">{selectedItem.ref}</span>
                </div>
              )}
              {selectedItem.note && (
                <div className="pt-3 border-t">
                  <span className="text-gray-500 block mb-1">Note:</span>
                  <p className="text-gray-900">{selectedItem.note}</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
