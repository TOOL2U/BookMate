'use client';

import { useState, useEffect } from 'react';
import { Activity, Server, Database, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  uptime: number;
  endpoints: Array<{
    name: string;
    url: string;
    status: 'healthy' | 'degraded' | 'offline';
    responseTime?: number;
    lastCheck: string;
    error?: string;
  }>;
  firebase: {
    status: 'healthy' | 'offline';
    lastSync?: string;
  };
  scheduledJobs: Array<{
    name: string;
    lastRun?: string;
    status: 'success' | 'failed' | 'pending';
  }>;
  metrics: {
    avgResponseTime: number;
    errorRate: number;
    requestCount24h: number;
  };
}

interface EnvCheck {
  ok: boolean;
  environment: string;
  timestamp: string;
  checks: any;
  summary: {
    allValid: boolean;
    errorCount: number;
    warningCount: number;
    status: string;
  };
  errors: string[];
  warnings: string[];
}

export default function HealthDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [envCheck, setEnvCheck] = useState<EnvCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = async () => {
    try {
      const [healthRes, envRes] = await Promise.all([
        fetch('/api/admin/system-health'),
        fetch('/api/admin/env-verify')
      ]);

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (envRes.ok) {
        const envData = await envRes.json();
        setEnvCheck(envData);
      }
    } catch (error) {
      console.error('Failed to fetch health data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'degraded':
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'offline':
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'offline':
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-primary p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary font-aileron">System Health Dashboard</h1>
            <p className="text-text-secondary mt-2">
              Real-time monitoring for BookMate production system
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchHealth}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh Now
            </button>
            <label className="flex items-center gap-2 text-text-secondary">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              Auto-refresh (30s)
            </label>
          </div>
        </div>

        {/* Overall Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* System Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Server className="w-8 h-8 text-blue-600" />
              {health && getStatusIcon(health.overall)}
            </div>
            <h3 className="text-sm font-medium text-text-secondary">System Status</h3>
            <p className="text-2xl font-bold text-text-primary mt-2 capitalize">
              {health?.overall || 'Unknown'}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Uptime: {health ? formatUptime(health.uptime) : 'N/A'}
            </p>
          </div>

          {/* Environment */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-green-600" />
              {envCheck && <span className="text-2xl">{envCheck.summary.status.split(' ')[0]}</span>}
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Environment</h3>
            <p className="text-2xl font-bold text-text-primary mt-2 capitalize">
              {envCheck?.environment || 'Unknown'}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              {envCheck?.summary.errorCount === 0 ? 'All checks passed' : `${envCheck?.summary.errorCount} errors`}
            </p>
          </div>

          {/* Firebase */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-orange-600" />
              {health && getStatusIcon(health.firebase.status)}
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Firebase</h3>
            <p className="text-2xl font-bold text-text-primary mt-2 capitalize">
              {health?.firebase.status || 'Unknown'}
            </p>
            <p className="text-xs text-text-secondary mt-2">
              {health?.firebase.lastSync ? `Last sync: ${formatDate(health.firebase.lastSync)}` : 'No sync data'}
            </p>
          </div>

          {/* Response Time */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-sm font-medium text-text-secondary">Avg Response Time</h3>
            <p className="text-2xl font-bold text-text-primary mt-2">
              {health?.metrics.avgResponseTime}ms
            </p>
            <p className="text-xs text-text-secondary mt-2">
              Error rate: {health?.metrics.errorRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Environment Checks */}
        {envCheck && envCheck.errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-4">❌ Configuration Errors</h3>
            <ul className="list-disc list-inside space-y-2">
              {envCheck.errors.map((error, i) => (
                <li key={i} className="text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}

        {envCheck && envCheck.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">⚠️ Warnings</h3>
            <ul className="list-disc list-inside space-y-2">
              {envCheck.warnings.map((warning, i) => (
                <li key={i} className="text-yellow-700">{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* API Endpoints Status */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-text-primary">API Endpoints</h2>
            <p className="text-text-secondary text-sm mt-1">Status of critical API endpoints</p>
          </div>
          <div className="divide-y divide-gray-200">
            {health?.endpoints.map((endpoint, i) => (
              <div key={i} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(endpoint.status)}
                    <div>
                      <h3 className="font-medium text-text-primary">{endpoint.name}</h3>
                      <p className="text-sm text-text-secondary">{endpoint.url}</p>
                      {endpoint.error && (
                        <p className="text-sm text-red-600 mt-1">Error: {endpoint.error}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${getStatusColor(endpoint.status)} px-3 py-1 rounded-full inline-block`}>
                      {endpoint.status}
                    </p>
                    {endpoint.responseTime !== undefined && (
                      <p className="text-sm text-text-secondary mt-2">{endpoint.responseTime}ms</p>
                    )}
                    <p className="text-xs text-text-secondary mt-1">{formatDate(endpoint.lastCheck)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Jobs */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-text-primary">Scheduled Jobs</h2>
            <p className="text-text-secondary text-sm mt-1">Status of automated background tasks</p>
          </div>
          <div className="divide-y divide-gray-200">
            {health?.scheduledJobs.map((job, i) => (
              <div key={i} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(job.status)}
                    <div>
                      <h3 className="font-medium text-text-primary">{job.name}</h3>
                      {job.lastRun && (
                        <p className="text-sm text-text-secondary">Last run: {formatDate(job.lastRun)}</p>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm font-medium ${getStatusColor(job.status)} px-3 py-1 rounded-full`}>
                    {job.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-text-secondary">
          <p>Last updated: {health ? new Date(health.timestamp).toLocaleString() : 'Never'}</p>
        </div>
      </div>
    </div>
  );
}
