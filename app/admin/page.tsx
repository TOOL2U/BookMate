'use client';

import { useState, useEffect } from 'react';
import { Shield, Zap, Download, Eye, BarChart3, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import AdminShell from '@/components/layout/AdminShell';
import SystemStatsCards from '@/components/admin/SystemStatsCards';
import ApiHealthCard from '@/components/admin/ApiHealthCard';
import WebhookTestCard from '@/components/admin/WebhookTestCard';
import FeatureTestsGrid from '@/components/admin/FeatureTestsGrid';

interface SystemStats {
  totalEntries: number;
  todayEntries: number;
  lastSync: string;
  cacheStatus: 'active' | 'expired' | 'empty';
}

interface ApiHealthCheck {
  endpoint: string;
  status: 'healthy' | 'error' | 'checking';
  responseTime?: number;
  message?: string;
}

export default function AdminPage() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    totalEntries: 0,
    todayEntries: 0,
    lastSync: 'Never',
    cacheStatus: 'empty'
  });
  const [apiHealth, setApiHealth] = useState<ApiHealthCheck[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState<string>('');
  const [namedRanges, setNamedRanges] = useState<any[]>([]);
  const [showNamedRanges, setShowNamedRanges] = useState(false);
  const [isLoadingRanges, setIsLoadingRanges] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const CORRECT_PIN = '1234';

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === CORRECT_PIN) {
      setIsUnlocked(true);
      setPinError(false);
      showToast('Access granted!', 'success');
    } else {
      setPinError(true);
      setPin('');
      showToast('Incorrect PIN', 'error');
      setTimeout(() => setPinError(false), 500);
    }
  };

  const handlePinChange = (value: string) => {
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setPin(value);
      setPinError(false);
    }
  };

  useEffect(() => {
    loadSystemStats();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadSystemStats = async () => {
    setIsLoadingStats(true);
    try {
      const response = await fetch('/api/inbox');
      const data = await response.json();

      if (data.ok) {
        const entries = data.data || [];
        const today = new Date().toDateString();
        const todayCount = entries.filter((e: any) => {
          const entryDate = new Date(`${e.month} ${e.day}, ${e.year}`);
          return entryDate.toDateString() === today;
        }).length;

        setStats({
          totalEntries: entries.length,
          todayEntries: todayCount,
          lastSync: data.cached ? 'Cached' : 'Just now',
          cacheStatus: data.cached ? 'active' : 'empty'
        });
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    setWebhookResponse('');

    try {
      const testPayload = {
        day: new Date().getDate().toString(),
        month: new Date().toLocaleString('en-US', { month: 'short' }),
        year: new Date().getFullYear().toString(),
        property: 'Lanna House',
        typeOfOperation: 'EXP - Other Expenses',
        typeOfPayment: 'Cash',
        detail: 'Admin panel webhook test',
        ref: 'ADMIN-TEST-' + Date.now(),
        debit: 100,
        credit: 0
      };

      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      const data = await response.json();
      setWebhookResponse(JSON.stringify(data, null, 2));

      if (data.ok) {
        showToast('Webhook test successful! Check your Google Sheet.', 'success');
        await loadSystemStats();
      } else {
        showToast('Webhook test failed: ' + (data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setWebhookResponse(JSON.stringify({ error: errorMessage }, null, 2));
      showToast('Webhook test failed: ' + errorMessage, 'error');
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleCheckApiHealth = async () => {
    const endpoints = [
      { name: 'Inbox API', url: '/api/inbox' },
      { name: 'P&L API', url: '/api/pnl' },
      { name: 'Balance API', url: '/api/balance/get' },
      { name: 'Sheets Webhook', url: '/api/sheets' }
    ];

    const checks: ApiHealthCheck[] = endpoints.map(e => ({
      endpoint: e.name,
      status: 'checking'
    }));
    setApiHealth(checks);

    for (let i = 0; i < endpoints.length; i++) {
      const start = Date.now();
      try {
        const response = await fetch(endpoints[i].url);
        const responseTime = Date.now() - start;
        
        checks[i] = {
          endpoint: endpoints[i].name,
          status: response.ok ? 'healthy' : 'error',
          responseTime,
          message: response.ok ? `${responseTime}ms` : `HTTP ${response.status}`
        };
      } catch (error) {
        checks[i] = {
          endpoint: endpoints[i].name,
          status: 'error',
          message: 'Failed to connect'
        };
      }
      setApiHealth([...checks]);
    }
  };

  const handleLoadNamedRanges = async () => {
    setIsLoadingRanges(true);
    try {
      const response = await fetch('/api/pnl/namedRanges');
      const data = await response.json();

      if (data.ok) {
        setNamedRanges(data.pnlRelated || []);
        setShowNamedRanges(true);
        showToast(`Found ${data.pnlRelatedCount} P&L-related named ranges`, 'success');
      } else {
        showToast('Failed to load named ranges', 'error');
      }
    } catch (error) {
      showToast('Error loading named ranges', 'error');
    } finally {
      setIsLoadingRanges(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/inbox');
      const data = await response.json();

      if (data.ok) {
        const jsonStr = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accounting-buddy-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Data exported successfully!', 'success');
      }
    } catch (error) {
      showToast('Failed to export data', 'error');
    }
  };

  // Show unlock screen if not unlocked
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Background effects - Brand compliant yellow accents */}
        <div className="absolute inset-0 bg-black" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-8">
            {/* Lock Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow via-yellow to-yellow rounded-full blur-xl opacity-50" />
                <div className="relative bg-gradient-to-br bg-[#0A0A0A] p-5 rounded-2xl shadow-lg">
                  <Shield className="w-10 h-10 text-text-primary" />
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                <span className="text-yellow">
                  Admin Access
                </span>
              </h1>
              <p className="text-text-secondary text-sm">
                Enter PIN to continue
              </p>
            </div>

            {/* PIN Form */}
            <form onSubmit={handlePinSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-3 text-center">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => handlePinChange(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className={`
                    w-full px-6 py-4 text-center text-2xl font-bold tracking-[0.5em]
                    bg-[#0A0A0A] border-2 rounded-xl
                    text-text-primary placeholder-slate-600
                    focus:outline-none focus:ring-2 focus:ring-accent/40
                    transition-all duration-200
                    ${pinError
                      ? 'border-error ring-2 ring-error/50'
                      : 'border-border-card hover:border-accent/50'}
                  `}
                />
              </div>

              <button
                type="submit"
                disabled={pin.length !== 4}
                className="w-full px-4 py-3 bg-gradient-to-r bg-yellow hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-black font-medium transition-all duration-200 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Unlock
              </button>
            </form>

            <p className="text-center text-xs text-text-secondary mt-6 flex items-center justify-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Protected area - authorized access only
            </p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <div className={`px-6 py-3 rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.45)] flex items-center gap-3 border
              ${toast.type === 'success'
                ? 'bg-success/90 border-success text-text-primary'
                : 'bg-error/90 border-error text-text-primary'}
            `}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center p-3 bg-yellow/10 rounded-xl mb-4">
            <Shield className="w-8 h-8 text-yellow" />
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-yellow">
              Admin Panel
            </span>
          </h1>
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-accent" />
            System management and monitoring
          </p>
        </div>

        {/* System Stats */}
        <SystemStatsCards stats={stats} isLoading={isLoadingStats} />

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WebhookTestCard
            isLoading={isTestingWebhook}
            response={webhookResponse}
            onTest={handleTestWebhook}
          />
          <ApiHealthCard
            apiHealth={apiHealth}
            onCheck={handleCheckApiHealth}
          />
        </div>

        {/* Data Management Tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Named Ranges */}
          <ToolCard
            icon={BarChart3}
            title="P&L Ranges"
            description="View named ranges"
            color="orange"
            isLoading={isLoadingRanges}
            onClick={handleLoadNamedRanges}
            buttonText="View Ranges"
            buttonIcon={Eye}
          />

          {/* Export Data */}
          <ToolCard
            icon={Download}
            title="Export Data"
            description="Download as JSON"
            color="purple"
            onClick={handleExportData}
            buttonText="Export All"
            buttonIcon={Download}
          />

          {/* Refresh Stats */}
          <ToolCard
            icon={RefreshCw}
            title="Refresh Stats"
            description="Update dashboard"
            color="green"
            isLoading={isLoadingStats}
            onClick={loadSystemStats}
            buttonText="Refresh"
            buttonIcon={RefreshCw}
          />
        </div>

        {/* Feature Tests */}
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            Feature Tests
          </h2>
          <FeatureTestsGrid onToast={showToast} />
        </div>

        {/* Named Ranges Display */}
        {showNamedRanges && namedRanges.length > 0 && (
          <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">P&L Named Ranges ({namedRanges.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {namedRanges.map((range, index) => (
                <div key={index} className="px-3 py-2 bg-[#0A0A0A] border border-border-card rounded-lg text-sm text-text-primary">
                  {range.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50">
          <div className={`px-6 py-3 rounded-xl shadow-[0_12px_24px_rgba(0,0,0,0.45)] flex items-center gap-3 border
            ${toast.type === 'success'
              ? 'bg-success/90 border-success text-text-primary'
              : 'bg-error/90 border-error text-text-primary'}
          `}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

// Helper component for tool cards
interface ToolCardProps {
  icon: any;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  isLoading?: boolean;
  onClick: () => void;
  buttonText: string;
  buttonIcon: any;
}

function ToolCard({ icon: Icon, title, description, color, isLoading, onClick, buttonText, buttonIcon: ButtonIcon }: ToolCardProps) {
  const colorClasses = {
    blue: { bg: 'bg-yellow/10', text: 'text-yellow' },
    green: { bg: 'bg-success/10', text: 'text-success' },
    orange: { bg: 'bg-warning/10', text: 'text-warning' },
    purple: { bg: 'bg-yellow/10', text: 'text-yellow' }
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 ${colors.bg} rounded-xl`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <p className="text-xs text-text-secondary">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={isLoading}
        className="w-full px-4 py-2 bg-bg-app/40 hover:bg-bg-app/60 disabled:opacity-50 disabled:cursor-not-allowed border border-border-card/60 rounded-lg text-text-primary text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ButtonIcon className="w-4 h-4" />
            {buttonText}
          </>
        )}
      </button>
    </div>
  );
}
