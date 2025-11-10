'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import ReportPreview from '../../components/ReportPreview';
import { ReportData } from '@/lib/reports/generators';
import { AIInsightsOutput } from '@/lib/reports/ai-insights';
import LogoBM from '@/components/LogoBM';
import { Lock, ExternalLink, Printer } from 'lucide-react';

export default function SharedReportPage() {
  const params = useParams();
  const token = params?.token as string;
  
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [aiInsights, setAiInsights] = useState<AIInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!token) return;
    
    const fetchSharedReport = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/reports/share/${token}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Report not found or link has expired');
            setIsExpired(true);
          } else {
            setError('Failed to load report');
          }
          return;
        }
        
        const data = await response.json();
        setReportData(data.reportData);
        setAiInsights(data.aiInsights || null);
      } catch (err) {
        console.error('[SHARED REPORT] Failed to load:', err);
        setError('Failed to load report');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSharedReport();
  }, [token]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="mb-6">
            <LogoBM size={80} />
          </div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow mx-auto mb-4"></div>
          <p className="text-text-secondary font-aileron">Loading shared report...</p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <LogoBM size={80} />
          </div>
          <div className="bg-bg-card border border-border-card rounded-xl2 p-8">
            <Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bebasNeue uppercase text-white mb-2">
              {isExpired ? 'Link Expired' : 'Report Not Found'}
            </h1>
            <p className="text-text-secondary font-aileron mb-6">
              {error || 'This report link is invalid or has been removed'}
            </p>
            <a 
              href="https://bookmate.app" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow text-black font-bold rounded-xl2 hover:bg-yellow/90 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Visit BookMate
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print-only header */}
      <div className="print-only">
        <div className="flex items-center justify-between mb-4 pb-4 border-b-2 border-gray-300">
          <LogoBM size={48} />
          <div className="text-right">
            <p className="text-sm text-gray-600 font-aileron">Shared via BookMate</p>
            <p className="text-xs text-gray-500 font-aileron">
              Generated: {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Screen-only controls */}
      <div className="non-print sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-border-card shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <LogoBM size={40} />
            <div>
              <h1 className="text-lg font-bebasNeue uppercase text-white">Shared Report</h1>
              <p className="text-xs text-text-secondary font-aileron">Read-only view</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-yellow text-black font-bold rounded-xl2 hover:bg-yellow/90 transition-colors font-aileron"
            >
              <Printer className="w-4 h-4" />
              Download PDF
            </button>
            <a
              href="https://bookmate.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-border-card rounded-xl2 text-white hover:bg-bg-card transition-colors font-aileron"
            >
              <ExternalLink className="w-4 h-4" />
              Get BookMate
            </a>
          </div>
        </div>
      </div>

      {/* Report content */}
      <div className="non-print bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white rounded-xl2 shadow-2xl overflow-hidden">
            <ReportPreview 
              reportData={reportData} 
              aiInsights={aiInsights}
            />
          </div>
        </div>
      </div>

      {/* Print-optimized version (hidden on screen) */}
      <div className="print-only">
        <ReportPreview 
          reportData={reportData} 
          aiInsights={aiInsights}
        />
      </div>

      {/* Print-only footer */}
      <div className="print-only">
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center">
          <p className="text-sm text-gray-600 font-aileron">
            This report was generated and shared via <strong>BookMate</strong> Financial Analytics Platform
          </p>
          <p className="text-xs text-gray-500 font-aileron mt-1">
            © {new Date().getFullYear()} BookMate. All rights reserved. • Confidential - For Internal Use Only
          </p>
        </div>
      </div>
    </>
  );
}
