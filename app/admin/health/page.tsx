'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { Activity, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, Zap } from 'lucide-react';

interface HealthData {
  ok: boolean;
  timestamp: string;
  metrics: {
    aiCheck: {
      last24h: {
        count: number;
        avgLatency: number;
        maxLatency: number;
        lastRun: string | null;
        lastStatus: string | null;
      };
      last7d: {
        count: number;
        avgLatency: number;
      };
      statusBreakdown: {
        ok: number;
        warn: number;
        fail: number;
      };
    };
    activityLog: {
      last24h: {
        requests: number;
        avgLatency: number;
      };
    };
    alerts: {
      last24h: {
        sent: number;
        types: Record<string, number>;
      };
      last7d: {
        sent: number;
      };
    };
  };
  recentAlerts: Array<{
    timestamp: string;
    type: string;
    severity: string;
    account?: string;
  }>;
  system: {
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/health');
      const result = await res.json();
      
      if (result.ok) {
        setData(result);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch health data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Zap className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-pulse" />
            <p className="text-gray-600">Loading health metrics...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell>
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <AdminShell>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            <p className="text-sm text-gray-500 mt-1">
              Phase 2 telemetry and monitoring
            </p>
          </div>
          <button
            onClick={fetchHealth}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data && formatUptime(data.system.uptime)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Node Version</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.system.nodeVersion}
                </p>
              </div>
              <Zap className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Platform</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {data?.system.platform}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* AI Check Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">AI Consistency Checks</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Last 24h</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.aiCheck.last24h.count || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Avg Latency</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.aiCheck.last24h.avgLatency.toFixed(0) || 0}
                <span className="text-sm">ms</span>
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Last Status</p>
              <p className={`text-3xl font-bold ${
                data?.metrics.aiCheck.last24h.lastStatus === 'OK' ? 'text-green-600' :
                data?.metrics.aiCheck.last24h.lastStatus === 'WARN' ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {data?.metrics.aiCheck.last24h.lastStatus || 'N/A'}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Last 7d</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.aiCheck.last7d.count || 0}
              </p>
              <p className="text-xs text-gray-500">checks</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Status Breakdown (24h)</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm">OK: {data?.metrics.aiCheck.statusBreakdown.ok || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">WARN: {data?.metrics.aiCheck.statusBreakdown.warn || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm">FAIL: {data?.metrics.aiCheck.statusBreakdown.fail || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log Metrics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Requests (24h)</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.activityLog.last24h.requests || 0}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.activityLog.last24h.avgLatency.toFixed(0) || 0}
                <span className="text-sm">ms</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Alerts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="text-sm text-gray-500">Sent (24h)</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.alerts.last24h.sent || 0}
              </p>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">Sent (7d)</p>
              <p className="text-3xl font-bold text-gray-900">
                {data?.metrics.alerts.last7d.sent || 0}
              </p>
            </div>
          </div>

          {data?.recentAlerts && data.recentAlerts.length > 0 && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Recent Alerts</p>
              <div className="space-y-2">
                {data.recentAlerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-4 h-4 ${
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'warning' ? 'text-yellow-600' :
                        'text-blue-600'
                      }`} />
                      <span className="font-medium">{alert.type}</span>
                      {alert.account && <span className="text-gray-500">({alert.account})</span>}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
