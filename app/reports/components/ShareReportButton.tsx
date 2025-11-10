'use client';

import { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Clock, Eye, Trash2 } from 'lucide-react';
import { ReportData } from '@/lib/reports/generators';
import { AIInsightsOutput } from '@/lib/reports/ai-insights';

interface ShareReportButtonProps {
  reportData: ReportData;
  aiInsights?: AIInsightsOutput | null;
}

export default function ShareReportButton({ reportData, aiInsights }: ShareReportButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleGenerateLink = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/reports/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData,
          aiInsights,
          expiresInDays: 30,
          sharedBy: 'BookMate User', // TODO: Replace with actual user name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.shareUrl);
      setExpiresAt(data.expiresAt);
      setShowModal(true);

    } catch (err) {
      console.error('[SHARE] Failed to create link:', err);
      setError('Failed to create share link. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[SHARE] Failed to copy:', err);
    }
  };

  const handleOpenLink = () => {
    if (!shareUrl) return;
    window.open(shareUrl, '_blank');
  };

  return (
    <>
      {/* Share Button */}
      <button
        onClick={handleGenerateLink}
        disabled={isGenerating}
        className="flex items-center gap-2 px-4 py-2 border border-border-card rounded-xl2 text-white hover:bg-bg-card transition-colors font-aileron disabled:opacity-50"
      >
        <Share2 className="w-4 h-4" />
        {isGenerating ? 'Generating...' : 'Share Report'}
      </button>

      {/* Share Modal */}
      {showModal && shareUrl && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-bg-card border-2 border-yellow rounded-xl2 p-8 max-w-2xl w-full mx-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow/20 rounded-xl">
                  <Share2 className="w-6 h-6 text-yellow" />
                </div>
                <div>
                  <h2 className="text-2xl font-bebasNeue uppercase text-white">
                    Share Report
                  </h2>
                  <p className="text-sm text-text-secondary font-aileron">
                    Anyone with this link can view the report
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Share URL */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-secondary mb-2 font-aileron">
                Shareable Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-black border border-border-card rounded-xl2 text-white font-mono text-sm focus:outline-none focus:border-yellow"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-3 bg-yellow text-black font-bold rounded-xl2 hover:bg-yellow/90 transition-colors flex items-center gap-2 font-aileron"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/50 border border-border-card rounded-xl2 p-4">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide font-aileron">
                    Expires
                  </span>
                </div>
                <p className="text-white font-semibold font-aileron">
                  {expiresAt ? new Date(expiresAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : '30 days'}
                </p>
              </div>
              <div className="bg-black/50 border border-border-card rounded-xl2 p-4">
                <div className="flex items-center gap-2 text-text-secondary mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs font-semibold uppercase tracking-wide font-aileron">
                    Access
                  </span>
                </div>
                <p className="text-white font-semibold font-aileron">
                  View Only
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenLink}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-bg-card border border-border-card rounded-xl2 text-white hover:bg-black transition-colors font-aileron"
              >
                <ExternalLink className="w-4 h-4" />
                Open Preview
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-yellow text-black font-bold rounded-xl2 hover:bg-yellow/90 transition-colors font-aileron"
              >
                Done
              </button>
            </div>

            {/* Features List */}
            <div className="mt-6 pt-6 border-t border-border-card">
              <p className="text-xs text-text-secondary font-aileron mb-3">
                ✨ Recipients can:
              </p>
              <ul className="space-y-2 text-sm text-text-secondary font-aileron">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  View the full report in their browser
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Download as PDF using &ldquo;Print&rdquo; → &ldquo;Save as PDF&rdquo;
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Zoom, scroll, and interact with charts
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-101 bg-red-500 text-white px-6 py-4 rounded-xl2 shadow-xl font-aileron">
          {error}
        </div>
      )}
    </>
  );
}
