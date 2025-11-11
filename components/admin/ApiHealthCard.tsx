'use client';

import { Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface ApiHealthCheck {
  endpoint: string;
  status: 'healthy' | 'error' | 'checking';
  responseTime?: number;
  message?: string;
}

interface ApiHealthCardProps {
  apiHealth: ApiHealthCheck[];
  onCheck: () => void;
}

export default function ApiHealthCard({ apiHealth, onCheck }: ApiHealthCardProps) {
  return (
    <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-success/20 to-info/20 rounded-xl">
          <Activity className="w-6 h-6 text-success" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-text-primary">API Health</h2>
          <p className="text-sm text-text-secondary">Check endpoint status</p>
        </div>
      </div>

      <button
        onClick={onCheck}
        className="w-full px-4 py-3 bg-bg-app/40 hover:bg-bg-app/40/70 border border-border-card/50 rounded-lg text-text-primary font-medium transition-all duration-200 flex items-center justify-center gap-2 mb-4"
      >
        <Activity className="w-4 h-4" />
        Check All Endpoints
      </button>

      {apiHealth.length > 0 && (
        <div className="space-y-2">
          {apiHealth.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-[#0A0A0A] border border-border-card rounded-lg"
            >
              <div className="flex items-center gap-2">
                {check.status === 'checking' && (
                  <RefreshCw className="w-4 h-4 text-text-secondary animate-spin" />
                )}
                {check.status === 'healthy' && (
                  <CheckCircle className="w-4 h-4 text-success" />
                )}
                {check.status === 'error' && (
                  <XCircle className="w-4 h-4 text-error" />
                )}
                <span className="text-sm font-medium text-text-primary">
                  {check.endpoint}
                </span>
              </div>
              <span className="text-xs text-text-secondary">
                {check.message || 'Checking...'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

