'use client';

import { Zap, RefreshCw } from 'lucide-react';

interface WebhookTestCardProps {
  isLoading: boolean;
  response: string;
  onTest: () => void;
}

export default function WebhookTestCard({ isLoading, response, onTest }: WebhookTestCardProps) {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-[#2A2A2A] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
          <Zap className="w-6 h-6 text-[#00D9FF]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#FFFFFF]">Webhook Testing</h2>
          <p className="text-sm text-[#A0A0A0]">Test Google Sheets integration</p>
        </div>
      </div>

      <button
        onClick={onTest}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[#FFFFFF] font-medium transition-all duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Test Webhook
          </>
        )}
      </button>

      {response && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-[#A0A0A0] mb-2">
            Response:
          </label>
          <pre className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg p-4 text-xs text-[#FFFFFF] font-mono overflow-x-auto max-h-64">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
}

