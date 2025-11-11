'use client';

import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { ReportData } from '@/lib/reports/generators';
import { exportToExcel, exportToCSV, exportTransactionsToCSV } from '@/lib/reports/exporters';
import { useState } from 'react';

interface ReportExportProps {
  reportData: ReportData | null;
  isGenerating: boolean;
}

export default function ReportExport({ reportData, isGenerating }: ReportExportProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  // Debug: Log transaction data
  console.log('ReportExport - reportData:', {
    hasReportData: !!reportData,
    hasTransactions: !!reportData?.transactions,
    transactionsLength: reportData?.transactions?.length,
    transactionsPreview: reportData?.transactions?.slice(0, 3)
  });

  const handleExport = async (type: 'excel' | 'csv' | 'transactions') => {
    if (!reportData) return;
    
    setExporting(type);
    
    try {
      switch (type) {
        case 'excel':
          await exportToExcel(reportData);
          break;
        case 'csv':
          exportToCSV(reportData);
          break;
        case 'transactions':
          exportTransactionsToCSV(reportData);
          break;
      }
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setTimeout(() => setExporting(null), 1000);
    }
  };

  const isDisabled = !reportData || isGenerating;

  return (
    <div className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm">
      <div className="border-b border-border-card p-6 bg-bg-app/40">
        <h2 className="text-xl font-bebasNeue uppercase text-text-primary tracking-wide">
          Export Report
        </h2>
        <p className="text-sm text-text-secondary font-aileron mt-1">
          Download your financial report in multiple formats
        </p>
      </div>
      
      <div className="p-6 space-y-3">
        {/* Export to Excel */}
        <button
          onClick={() => handleExport('excel')}
          disabled={isDisabled}
          className="w-full bg-bg-app hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed border border-border-card hover:border-yellow/30 text-text-primary px-6 py-4 rounded-xl2 transition-all duration-200 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <FileSpreadsheet className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-left">
              <p className="font-bebasNeue uppercase tracking-wide text-lg">
                Export to Excel
              </p>
              <p className="text-xs text-text-secondary font-aileron">
                Multi-sheet workbook with all data
              </p>
            </div>
          </div>
          {exporting === 'excel' ? (
            <Loader2 className="w-5 h-5 animate-spin text-green-500" />
          ) : (
            <Download className="w-5 h-5 text-text-secondary group-hover:text-yellow transition-colors" />
          )}
        </button>

        {/* Export to CSV */}
        <button
          onClick={() => handleExport('csv')}
          disabled={isDisabled}
          className="w-full bg-bg-app hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed border border-border-card hover:border-yellow/30 text-text-primary px-6 py-4 rounded-xl2 transition-all duration-200 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-left">
              <p className="font-bebasNeue uppercase tracking-wide text-lg">
                Export to CSV
              </p>
              <p className="text-xs text-text-secondary font-aileron">
                Summary data in CSV format
              </p>
            </div>
          </div>
          {exporting === 'csv' ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
          ) : (
            <Download className="w-5 h-5 text-text-secondary group-hover:text-yellow transition-colors" />
          )}
        </button>

        {/* Export Transactions */}
        <button
          onClick={() => handleExport('transactions')}
          disabled={isDisabled}
          className="w-full bg-bg-app hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed border border-border-card hover:border-yellow/30 text-text-primary px-6 py-4 rounded-xl2 transition-all duration-200 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl2 bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <FileText className="w-5 h-5 text-purple-500" />
            </div>
            <div className="text-left">
              <p className="font-bebasNeue uppercase tracking-wide text-lg">
                Export Transactions
              </p>
              <p className="text-xs text-text-secondary font-aileron">
                {reportData?.transactions?.length 
                  ? `${reportData.transactions.length} transaction${reportData.transactions.length !== 1 ? 's' : ''} available`
                  : 'No transactions found - will export empty file'}
              </p>
            </div>
          </div>
          {exporting === 'transactions' ? (
            <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
          ) : (
            <Download className="w-5 h-5 text-text-secondary group-hover:text-yellow transition-colors" />
          )}
        </button>

        {!reportData && (
          <p className="text-center text-sm text-text-tertiary font-aileron mt-4">
            Generate a report first to enable exports
          </p>
        )}
      </div>
    </div>
  );
}
