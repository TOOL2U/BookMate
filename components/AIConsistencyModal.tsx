'use client';

import { useState } from 'react';
import { X, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Download, Sparkles } from 'lucide-react';

type Month = 'JAN' | 'FEB' | 'MAR' | 'APR' | 'MAY' | 'JUN' | 'JUL' | 'AUG' | 'SEP' | 'OCT' | 'NOV' | 'DEC' | 'ALL';
type Status = 'OK' | 'WARN' | 'FAIL';

interface BalanceCheck {
  account: string;
  openingBalance: number;
  inflow: number;
  outflow: number;
  expectedCurrent: number;
  actualCurrent: number;
  drift: number;
  status: Status;
  notes: string[];
}

interface ConsistencyData {
  ok: boolean;
  checks: BalanceCheck[];
  totals: {
    openingTotal: number;
    inflowTotal: number;
    outflowTotal: number;
    expectedTotal: number;
    actualTotal: number;
    driftTotal: number;
    status: Status;
  };
  aiSummary?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIConsistencyModal({ isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ConsistencyData | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<Month>('ALL');
  const [error, setError] = useState<string | null>(null);

  const months: Month[] = ['ALL', 'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const runConsistencyCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/ai/check-balance-consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: selectedMonth })
      });

      const result = await res.json();
      
      if (result.ok) {
        setData(result);
      } else {
        setError(result.error || 'Failed to run consistency check');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!data) return;

    const rows = [
      ['Account', 'Opening Balance', 'Inflow', 'Outflow', 'Expected Current', 'Actual Current', 'Drift', 'Status'],
      ...data.checks.map(c => [
        c.account,
        c.openingBalance,
        c.inflow,
        c.outflow,
        c.expectedCurrent,
        c.actualCurrent,
        c.drift,
        c.status
      ]),
      [],
      ['TOTALS', data.totals.openingTotal, data.totals.inflowTotal, data.totals.outflowTotal, data.totals.expectedTotal, data.totals.actualTotal, data.totals.driftTotal, data.totals.status]
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-consistency-${selectedMonth}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: Status) => {
    const styles = {
      OK: 'bg-green-100 text-green-800 border-green-200',
      WARN: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      FAIL: 'bg-red-100 text-red-800 border-red-200'
    };

    const icons = {
      OK: <CheckCircle className="w-4 h-4" />,
      WARN: <AlertTriangle className="w-4 h-4" />,
      FAIL: <AlertTriangle className="w-4 h-4" />
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Consistency Check</h2>
              <p className="text-sm text-gray-600">Automated balance drift detection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Month:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value as Month)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {months.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <button
              onClick={runConsistencyCheck}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Running...' : 'Run Check'}
            </button>

            {data && (
              <button
                onClick={exportToCSV}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
              <p className="text-gray-600">Running AI consistency check...</p>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* AI Summary */}
              {data.aiSummary && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 mb-1">AI Executive Summary</p>
                      <p className="text-blue-800 text-sm">{data.aiSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Totals (Sticky) */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-300 rounded-lg p-4 sticky top-0 z-10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-gray-900">Overall Totals</h3>
                  {getStatusBadge(data.totals.status)}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Opening</p>
                    <p className="text-lg font-semibold text-gray-900">
                      ฿{data.totals.openingTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Inflow
                    </p>
                    <p className="text-lg font-semibold text-green-600">
                      ฿{data.totals.inflowTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" /> Outflow
                    </p>
                    <p className="text-lg font-semibold text-red-600">
                      ฿{data.totals.outflowTotal.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Drift</p>
                    <p className={`text-lg font-semibold ${
                      data.totals.driftTotal === 0 ? 'text-gray-900' :
                      data.totals.driftTotal > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {data.totals.driftTotal > 0 ? '+' : ''}฿{data.totals.driftTotal.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-Account Checks */}
              <div className="space-y-3">
                {data.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-lg p-4 ${
                      check.status === 'FAIL' ? 'border-red-300 bg-red-50' :
                      check.status === 'WARN' ? 'border-yellow-300 bg-yellow-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">{check.account}</h4>
                      {getStatusBadge(check.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                      <div>
                        <p className="text-gray-500">Opening</p>
                        <p className="font-medium">฿{check.openingBalance.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Inflow</p>
                        <p className="font-medium text-green-600">฿{check.inflow.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Outflow</p>
                        <p className="font-medium text-red-600">฿{check.outflow.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Drift</p>
                        <p className={`font-medium ${
                          check.drift === 0 ? 'text-gray-900' :
                          check.drift > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {check.drift > 0 ? '+' : ''}฿{check.drift.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3 space-y-1">
                      {check.notes.map((note, noteIdx) => (
                        <p key={noteIdx} className="text-xs text-gray-700">{note}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!data && !loading && !error && (
            <div className="text-center py-12 text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Select a month and click "Run Check" to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
