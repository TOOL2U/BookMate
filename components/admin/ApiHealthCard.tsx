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
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-green-500/20 to-purple-500/20 rounded-xl">
          <Activity className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">API Health</h2>
          <p className="text-sm text-slate-400">Check endpoint status</p>
        </div>
      </div>

      <button
        onClick={onCheck}
        className="w-full px-4 py-3 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 mb-4"
      >
        <Activity className="w-4 h-4" />
        Check All Endpoints
      </button>

      {apiHealth.length > 0 && (
        <div className="space-y-2">
          {apiHealth.map((check, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-lg"
            >
              <div className="flex items-center gap-2">
                {check.status === 'checking' && (
                  <RefreshCw className="w-4 h-4 text-slate-500 animate-spin" />
                )}
                {check.status === 'healthy' && (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                {check.status === 'error' && (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm font-medium text-white">
                  {check.endpoint}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                {check.message || 'Checking...'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

