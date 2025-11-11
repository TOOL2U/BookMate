'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { FileDown, Lock, AlertCircle, CheckCircle, Calendar, TrendingUp, Printer } from 'lucide-react';
import { SharedReport } from '@/lib/reports/sharing';
import Image from 'next/image';
import ReportPreview from '@/app/reports/components/ReportPreview';

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token as string;

  const [sharedReport, setSharedReport] = useState<SharedReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passcode, setPasscode] = useState('');
  const [needsPasscode, setNeedsPasscode] = useState(false);

  const fetchSharedReport = async (providedPasscode?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL(`/api/reports/share`, window.location.origin);
      url.searchParams.append('token', token);
      if (providedPasscode) {
        url.searchParams.append('passcode', providedPasscode);
      }

      const response = await fetch(url.toString());
      
      if (response.status === 401) {
        const data = await response.json();
        if (data.error === 'Passcode required') {
          setNeedsPasscode(true);
          setIsLoading(false);
          return;
        } else if (data.error === 'Invalid passcode') {
          setError('Invalid passcode. Please try again.');
          setIsLoading(false);
          return;
        }
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load shared report');
      }

      const data = await response.json();
      setSharedReport(data.report);
      setNeedsPasscode(false);
    } catch (err) {
      console.error('Failed to fetch shared report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSharedReport();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSharedReport(passcode);
  };

  const handleDownloadPDF = async () => {
    try {
      // Dynamically import the PDF export utility
      const { exportReportToPDF } = await import('@/lib/reports/pdf-export');
      
      await exportReportToPDF(
        'report-preview-container',
        `${sharedReport?.reportName || 'financial-report'}.pdf`
      );
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-yellow border-t-transparent mx-auto mb-4" />
          <p className="text-text-secondary font-aileron text-lg">Loading report...</p>
        </div>
      </div>
    );
  }

  if (needsPasscode) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
        <div className="bg-bg-card border border-border-card rounded-xl2 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-yellow" />
            </div>
            <h1 className="text-2xl font-bebasNeue uppercase text-text-primary mb-2">
              Protected Report
            </h1>
            <p className="text-text-secondary font-aileron">
              This report requires a passcode to view
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
                Enter Passcode
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="••••••"
                className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl2 px-4 py-3 text-red-400 font-aileron text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!passcode.trim()}
              className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bebasNeue uppercase tracking-wide px-6 py-3 rounded-xl2 transition-all duration-200"
            >
              Unlock Report
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center p-4">
        <div className="bg-bg-card border border-red-500/30 rounded-xl2 p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bebasNeue uppercase text-text-primary mb-2">
            Unable to Load Report
          </h1>
          <p className="text-red-400 font-aileron mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow hover:bg-yellow/90 text-black font-bebasNeue uppercase tracking-wide px-6 py-3 rounded-xl2 transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!sharedReport) {
    return null;
  }

  return (
    <div className="min-h-screen bg-bg-app">
      {/* Header */}
      <div className="bg-bg-card border-b border-border-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="shrink-0">
                <Image src="/logo/bm-logo.svg" alt="BookMate" width={48} height={48} className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-bebasNeue uppercase text-text-primary truncate">
                  {sharedReport.reportName}
                </h1>
                <p className="text-xs sm:text-sm text-text-secondary font-aileron">
                  Shared on {new Date(sharedReport.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Print Button - Hidden on mobile, visible on tablet+ */}
              <button
                onClick={handlePrint}
                className="hidden sm:flex bg-bg-app hover:bg-bg-card text-text-primary border border-border-card font-bebasNeue uppercase tracking-wide px-4 lg:px-6 py-2 lg:py-3 rounded-xl2 transition-all duration-200 items-center gap-2 text-sm lg:text-base"
              >
                <Printer className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden lg:inline">Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Expiry Warning */}
        {sharedReport.access.expiresAt && (
          <div className="bg-yellow/10 border border-yellow/30 rounded-xl2 p-3 sm:p-4 mb-4 sm:mb-6 flex items-start sm:items-center gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow shrink-0 mt-0.5 sm:mt-0" />
            <p className="text-xs sm:text-sm text-text-primary font-aileron">
              This report expires on{' '}
              <strong>{new Date(sharedReport.access.expiresAt).toLocaleDateString()}</strong>
              {sharedReport.access.maxViews && (
                <span className="block sm:inline sm:ml-1">
                  <span className="hidden sm:inline">•</span> Views: {sharedReport.access.viewCount}/{sharedReport.access.maxViews}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Report Summary Card */}
        <div className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm mb-4 sm:mb-6">
          <div className="border-b border-border-card p-4 sm:p-6 bg-bg-app/40">
            <h2 className="text-lg sm:text-xl font-bebasNeue uppercase text-text-primary tracking-wide">
              Report Summary
            </h2>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-text-secondary font-aileron">Period</p>
                  <p className="text-base sm:text-lg font-bebasNeue uppercase text-text-primary truncate">
                    {sharedReport.snapshot.period.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-text-secondary font-aileron">Generated</p>
                  <p className="text-base sm:text-lg font-bebasNeue uppercase text-text-primary truncate">
                    {new Date(sharedReport.snapshot.generatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-text-secondary font-aileron">Status</p>
                  <p className="text-base sm:text-lg font-bebasNeue uppercase text-green-400 truncate">
                    View Only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div id="report-preview-container" className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm overflow-hidden">
          {sharedReport.snapshot.reportData ? (
            <div className="p-3 sm:p-4 lg:p-6">
              <ReportPreview
                reportData={sharedReport.snapshot.reportData}
                aiInsights={null}
              />
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <FileDown className="w-16 h-16 sm:w-24 sm:h-24 text-text-tertiary mx-auto mb-4 sm:mb-6 opacity-50" />
              <h3 className="text-lg sm:text-xl font-bebasNeue uppercase text-text-secondary mb-2">
                Report Data Not Available
              </h3>
              <p className="text-sm sm:text-base text-text-secondary font-aileron max-w-md mx-auto">
                This shared report doesn&apos;t contain the full report data. Please generate a new share link.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-text-secondary font-aileron px-4">
          <p>
            Powered by{' '}
            <span className="text-yellow font-medium">BookMate</span> • This is a read-only snapshot
          </p>
        </div>
      </div>
    </div>
  );
}
