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
            <Zap className="w-12 h-12 mx-auto mb-4 text-yellow animate-pulse" />
            <p className="font-aileron text-text-secondary">Loading health metrics...</p>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (error) {
    return (
      <AdminShell>
        <div className="p-6">
          <div className="bg-error/10 border border-error/30 rounded-lg p-4">
            <p className="font-aileron text-error">{error}</p>
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
            <h1 className="font-madeMirage text-4xl text-text-primary tracking-tight">System Health</h1>
            <p className="font-aileron text-sm text-text-secondary mt-1">
              Phase 2 telemetry and monitoring
            </p>
          </div>
          <button
            onClick={fetchHealth}
            className="font-aileron px-4 py-2 bg-yellow text-black rounded-lg hover:opacity-90 transition-all shadow-glow hover:shadow-glow-lg font-medium"
          >
            Refresh
          </button>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-bg-card border border-border-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-aileron text-sm text-text-secondary">Uptime</p>
                <p className="font-madeMirage text-3xl text-yellow">
                  {data && formatUptime(data.system.uptime)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-accent" />
            </div>
          </div>

          <div className="bg-bg-card border border-border-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-aileron text-sm text-text-secondary">Node Version</p>
                <p className="font-madeMirage text-3xl text-yellow">
                  {data?.system.nodeVersion}
                </p>
              </div>
              <Zap className="w-8 h-8 text-success" />
            </div>
          </div>

          <div className="bg-bg-card border border-border-card rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-aileron text-sm text-text-secondary">Platform</p>
                <p className="font-madeMirage text-3xl text-yellow capitalize">
                  {data?.system.platform}
                </p>
              </div>
              <Activity className="w-8 h-8 text-info" />
            </div>
          </div>
        </div>

        {/* AI Check Metrics */}
        <div className="bg-bg-card border border-border-card rounded-lg p-6">
          <h2 className="font-bebasNeue text-2xl text-text-primary uppercase tracking-wide mb-4">AI Consistency Checks</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Last 24h</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.aiCheck.last24h.count || 0}
              </p>
              <p className="font-aileron text-xs text-text-secondary">checks</p>
            </div>

            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Avg Latency</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.aiCheck.last24h.avgLatency.toFixed(0) || 0}
                <span className="text-sm">ms</span>
              </p>
            </div>

            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Last Status</p>
              <p className={`font-madeMirage text-4xl ${
                data?.metrics.aiCheck.last24h.lastStatus === 'OK' ? 'text-success' :
                data?.metrics.aiCheck.last24h.lastStatus === 'WARN' ? 'text-warning' :
                'text-error'
              }`}>
                {data?.metrics.aiCheck.last24h.lastStatus || 'N/A'}
              </p>
            </div>

            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Last 7d</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.aiCheck.last7d.count || 0}
              </p>
              <p className="font-aileron text-xs text-text-secondary">checks</p>
            </div>
          </div>

          <div className="border-t border-border-card pt-4">
            <p className="font-bebasNeue text-sm text-text-primary uppercase tracking-wide mb-2">Status Breakdown (24h)</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                <span className="font-aileron text-sm text-text-primary">OK: {data?.metrics.aiCheck.statusBreakdown.ok || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="font-aileron text-sm text-text-primary">WARN: {data?.metrics.aiCheck.statusBreakdown.warn || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-error" />
                <span className="font-aileron text-sm text-text-primary">FAIL: {data?.metrics.aiCheck.statusBreakdown.fail || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Log Metrics */}
        <div className="bg-bg-card border border-border-card rounded-lg p-6">
          <h2 className="font-bebasNeue text-2xl text-text-primary uppercase tracking-wide mb-4">Activity Log</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Requests (24h)</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.activityLog.last24h.requests || 0}
              </p>
            </div>

            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Avg Response Time</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.activityLog.last24h.avgLatency.toFixed(0) || 0}
                <span className="text-sm">ms</span>
              </p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-bg-card border border-border-card rounded-lg p-6">
          <h2 className="font-bebasNeue text-2xl text-text-primary uppercase tracking-wide mb-4">Alerts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Sent (24h)</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.alerts.last24h.sent || 0}
              </p>
            </div>

            <div className="text-center">
              <p className="font-aileron text-sm text-text-secondary">Sent (7d)</p>
              <p className="font-madeMirage text-4xl text-yellow">
                {data?.metrics.alerts.last7d.sent || 0}
              </p>
            </div>
          </div>

          {data?.recentAlerts && data.recentAlerts.length > 0 && (
            <div className="border-t border-border-card pt-4">
              <p className="font-bebasNeue text-sm text-text-primary uppercase tracking-wide mb-2">Recent Alerts</p>
              <div className="space-y-2">
                {data.recentAlerts.map((alert, idx) => (
                  <div key={idx} className="font-aileron flex items-center justify-between text-sm p-2 bg-bg-app/40 rounded border border-border-card">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`w-4 h-4 ${
                        alert.severity === 'critical' ? 'text-error' :
                        alert.severity === 'warning' ? 'text-warning' :
                        'text-info'
                      }`} />
                      <span className="font-medium text-text-primary">{alert.type}</span>
                      {alert.account && <span className="text-text-secondary">({alert.account})</span>}
                    </div>
                    <span className="text-xs text-text-tertiary">
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
