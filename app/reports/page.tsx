'use client';

import { useState, useEffect } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { FileText, Download, FileSpreadsheet, FileDown, Sparkles, FileType, Share2, Image as ImageIcon } from 'lucide-react';
import { usePageLoading } from '@/hooks/usePageLoading';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import ReportExport from './components/ReportExport';
import ReportPreview from './components/ReportPreview';
import TemplateSelector from './components/TemplateSelector';
import AIControls from './components/AIControls';
import ShareScheduleModal from './components/ShareScheduleModal';
import { ReportData } from '@/lib/reports/generators';
import { AIInsightsOutput, AITone } from '@/lib/reports/ai-insights';
import { exportReportToPDF, generatePDFFilename, exportReportAsPNG, generatePNGFilename } from '@/lib/reports/pdf-export';
import { exportReportSnapshot, exportReportToPNG, exportReportToJPEG } from '@/lib/reports/image-export';
import { ReportTemplate, OrganizationProfile } from '@/lib/reports/templates';

export default function ReportsPage() {
  const { isLoading, setDataReady } = usePageLoading();

  const [reportType, setReportType] = useState('monthly');
  const [currency, setCurrency] = useState<'THB' | 'USD'>('THB');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeAI, setIncludeAI] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsightsOutput | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  
  // Phase 3: Template & AI State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [aiTone, setAiTone] = useState<AITone>('standard');
  const [organizationProfile, setOrganizationProfile] = useState<OrganizationProfile | undefined>();
  const [showShareScheduleModal, setShowShareScheduleModal] = useState(false);
  const [currentPdfData, setCurrentPdfData] = useState<string | undefined>();

  // Mark data as ready on mount (no async data loading for this page)
  useEffect(() => {
    setDataReady(true);
  }, [setDataReady]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setError(null);
    setAiInsights(null);
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          currency: currency,
          dateRange: reportType === 'custom' ? dateRange : undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const result = await response.json();
      
      // API returns { ok: true, data: reportData }, so extract the data
      const data = result.ok ? result.data : result;
      setReportData(data);

      // Generate AI insights if enabled
      if (includeAI) {
        await generateAIInsights(data);
      }
    } catch (err) {
      console.error('Report generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIInsights = async (data: ReportData) => {
    setIsLoadingAI(true);
    try {
      const response = await fetch('/api/reports/ai-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: data.period,
          metrics: data.summary,
          breakdown: {
            topExpenses: data.expenses.overhead.slice(0, 5),
          },
          tone: aiTone,
          organizationProfile: organizationProfile,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a quota error
        if (errorData.quotaExceeded || response.status === 429) {
          throw new Error('OpenAI quota exceeded - AI insights temporarily unavailable');
        }
        
        throw new Error(errorData.details || 'Failed to generate AI insights');
      }

      const insights = await response.json();
      setAiInsights(insights);
    } catch (err) {
      console.error('AI insights error:', err);
      
      // Non-blocking error - show a user-friendly message but keep the report
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      if (errorMessage.includes('quota')) {
        setError('⚠️ OpenAI quota exceeded. AI insights are temporarily unavailable. Your report is ready without AI analysis.');
      } else {
        setError('⚠️ AI insights could not be generated, but your report is ready.');
      }
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleToggleAI = async () => {
    const newValue = !includeAI;
    setIncludeAI(newValue);

    // If turning on and we have report data, generate insights
    if (newValue && reportData && !aiInsights && !isLoadingAI) {
      await generateAIInsights(reportData);
    }
  };

  const handleExportPDF = async () => {
    if (!reportData || !reportData.period) return;

    setIsExportingPDF(true);
    try {
      const filename = generatePDFFilename(reportData.period);
      const pdfBase64 = await exportReportToPDF('report-preview', filename);
      
      // Store the PDF data for email sharing
      if (pdfBase64) {
        setCurrentPdfData(pdfBase64);
        console.log('✅ PDF data captured for email sharing');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      setError('Failed to export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpeg' = 'png') => {
    if (!reportData || !reportData.period) return;

    setIsExportingImage(true);
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const periodLabel = typeof reportData.period === 'string' 
        ? reportData.period 
        : reportData.period.label;
      const filename = `bookmate-report-${periodLabel.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${format}`;
      
      if (format === 'png') {
        await exportReportToPNG('report-preview', filename);
      } else {
        await exportReportToJPEG('report-preview', filename);
      }
      
      console.log(`✅ Image exported successfully: ${filename}`);
    } catch (err) {
      console.error('Image export error:', err);
      setError('Failed to export image');
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <AdminShell>
      {isLoading ? (
        <PageLoadingScreen />
      ) : (
        <div className="space-y-6">
          {/* Page Header */}
          <div
            className="flex items-center justify-between animate-fade-in opacity-0"
            style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
          >
            <div>
              <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-tight">
                Financial Reports
              </h1>
              <p className="text-text-secondary mt-3 font-aileron text-lg">
                AI-powered financial analysis with visual insights
              </p>
            </div>
            <div className="flex items-center gap-3">
              {reportData && (
                <button
                  onClick={() => setShowShareScheduleModal(true)}
                  className="bg-yellow hover:bg-yellow/90 text-black font-bebasNeue uppercase tracking-wide px-6 py-3 rounded-xl2 transition-all duration-200 shadow-glow flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share / Schedule
                </button>
              )}
              <FileText className="w-8 h-8 text-yellow" />
            </div>
          </div>

          {/* Main Layout: Controls Left, Preview Right */}
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column: Controls */}
            <div className="col-span-12 lg:col-span-4 space-y-6">
              {/* Template Selector */}
              <div
                className="animate-fade-in opacity-0"
                style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
              >
                <TemplateSelector
                  onApplyTemplate={(template) => {
                    setSelectedTemplate(template);
                    // Apply template settings to report config
                    if (template.filters?.dateRange?.type) {
                      setReportType(template.filters.dateRange.type);
                    }
                  }}
                  onSaveTemplate={(template) => {
                    console.log('Template saved:', template);
                  }}
                />
              </div>

              {/* AI Controls */}
              <div
                className="animate-fade-in opacity-0"
                style={{ animationDelay: '150ms', animationFillMode: 'forwards' }}
              >
                <AIControls
                  tone={aiTone}
                  onToneChange={setAiTone}
                  organizationProfile={organizationProfile}
                  onProfileChange={setOrganizationProfile}
                />
              </div>

              {/* Report Generator */}
              <div
                className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm animate-fade-in opacity-0"
                style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
              >
                <div className="border-b border-border-card p-6 bg-bg-app/40">
                  <h2 className="text-xl font-bebasNeue uppercase text-text-primary tracking-wide">
                    Generate Report
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Report Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
                      Report Type
                    </label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
                    >
                      <option value="monthly">Monthly Report</option>
                      <option value="quarterly">Quarterly Report</option>
                      <option value="ytd">Year-to-Date Report</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>

                  {/* Currency Selection */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value as 'THB' | 'USD')}
                      className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
                    >
                      <option value="THB">Thai Baht (฿)</option>
                      <option value="USD">US Dollar ($)</option>
                    </select>
                  </div>

                  {/* Date Range */}
                  {reportType === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.start}
                          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                          className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={dateRange.end}
                          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                          className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 font-aileron"
                        />
                      </div>
                    </div>
                  )}

                  {/* AI Summary Toggle */}
                  <div className="flex items-center justify-between p-4 bg-bg-app/60 border border-border-card rounded-xl2">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-yellow" />
                      <div>
                        <p className="font-medium text-text-primary font-aileron">Include AI Summary</p>
                        <p className="text-xs text-text-secondary">Add insights & trends</p>
                      </div>
                    </div>
                    <button
                      onClick={handleToggleAI}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        includeAI ? 'bg-yellow' : 'bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          includeAI ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Data Source */}
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 font-aileron">
                      Data Source
                    </label>
                    <div className="bg-bg-app/60 border border-border-card rounded-xl2 px-4 py-3 text-text-primary font-aileron">
                      BookMate P&L 2025
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bebasNeue uppercase tracking-wide px-6 py-4 rounded-xl2 transition-all duration-200 shadow-glow flex items-center justify-center gap-3 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5" />
                        Generate Report
                      </>
                    )}
                  </button>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl2 px-4 py-3 text-red-400 font-aileron text-sm">
                      {error}
                    </div>
                  )}

                  {/* Success Message */}
                  {reportData && !isGenerating && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl2 px-4 py-3 text-green-400 font-aileron text-sm">
                      Report generated successfully{reportData.period?.label ? ` for ${reportData.period.label}` : ''}
                    </div>
                  )}
                </div>
              </div>

              {/* Export Options */}
              {reportData && (
                <>
                  <div
                    className="animate-fade-in opacity-0"
                    style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
                  >
                    <ReportExport reportData={reportData} isGenerating={isGenerating} />
                  </div>

                  {/* PDF Export */}
                  <div
                    className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm animate-fade-in opacity-0"
                    style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
                  >
                    <div className="p-6">
                      <button
                        onClick={handleExportPDF}
                        disabled={isExportingPDF}
                        className="w-full bg-bg-app hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed border border-border-card hover:border-yellow/30 text-text-primary px-6 py-4 rounded-xl2 transition-all duration-200 flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl2 bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                            <FileType className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="text-left">
                            <p className="font-bebasNeue uppercase tracking-wide text-lg">
                              Export to PDF
                            </p>
                            <p className="text-xs text-text-secondary font-aileron">
                              Branded investor-ready report
                            </p>
                          </div>
                        </div>
                        {isExportingPDF ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-500 border-t-transparent" />
                        ) : (
                          <Download className="w-5 h-5 text-text-secondary group-hover:text-yellow transition-colors" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Image Export */}
                  <div
                    className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm animate-fade-in opacity-0"
                    style={{ animationDelay: '500ms', animationFillMode: 'forwards' }}
                  >
                    <div className="p-6">
                      <div className="space-y-3">
                        <button
                          onClick={() => handleExportImage('png')}
                          disabled={isExportingImage}
                          className="w-full bg-bg-app hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed border border-border-card hover:border-yellow/30 text-text-primary px-6 py-4 rounded-xl2 transition-all duration-200 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl2 bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                              <ImageIcon className="w-5 h-5 text-blue-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-bebasNeue uppercase tracking-wide text-lg">
                                Export as PNG
                              </p>
                              <p className="text-xs text-text-secondary font-aileron">
                                Pixel-perfect web snapshot
                              </p>
                            </div>
                          </div>
                          {isExportingImage ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
                          ) : (
                            <Download className="w-5 h-5 text-text-secondary group-hover:text-yellow transition-colors" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleExportImage('jpeg')}
                          disabled={isExportingImage}
                          className="w-full bg-bg-app hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed border border-border-card hover:border-yellow/30 text-text-primary px-6 py-4 rounded-xl2 transition-all duration-200 flex items-center justify-between group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl2 bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                              <ImageIcon className="w-5 h-5 text-purple-500" />
                            </div>
                            <div className="text-left">
                              <p className="font-bebasNeue uppercase tracking-wide text-lg">
                                Export as JPEG
                              </p>
                              <p className="text-xs text-text-secondary font-aileron">
                                Smaller file size option
                              </p>
                            </div>
                          </div>
                          {isExportingImage ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-500 border-t-transparent" />
                          ) : (
                            <Download className="w-5 h-5 text-text-secondary group-hover:text-yellow transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Column: Report Preview */}
            <div className="col-span-12 lg:col-span-8">
              {reportData ? (
                <div
                  className="animate-fade-in opacity-0"
                  style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
                >
                  <div className="mb-4">
                    <h2 className="text-xl font-bebasNeue uppercase text-text-primary tracking-wide">
                      Report Preview
                    </h2>
                    <p className="text-sm text-text-secondary font-aileron mt-1">
                      Live preview of your financial report
                    </p>
                  </div>
                  <ReportPreview 
                    reportData={reportData} 
                    aiInsights={includeAI ? aiInsights : null}
                    isLoadingAI={isLoadingAI}
                  />
                </div>
              ) : (
                <div
                  className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm p-12 text-center animate-fade-in opacity-0"
                  style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
                >
                  <FileText className="w-24 h-24 text-text-tertiary mx-auto mb-6 opacity-50" />
                  <h3 className="text-xl font-bebasNeue uppercase text-text-secondary mb-2">
                    No Report Generated
                  </h3>
                  <p className="text-text-secondary font-aileron max-w-md mx-auto">
                    Select your report parameters and click &quot;Generate Report&quot; to see a live preview with charts, insights, and analysis.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div
            className="bg-bg-card border border-border-card rounded-xl2 shadow-glow-sm animate-fade-in opacity-0"
            style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
          >
            <div className="border-b border-border-card p-6 bg-bg-app/40">
              <h2 className="text-xl font-bebasNeue uppercase text-text-primary tracking-wide">
                Recent Reports
              </h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-text-tertiary mx-auto mb-4 opacity-50" />
                <p className="text-text-secondary font-aileron">
                  No reports generated yet. Create your first report above.
                </p>
              </div>
            </div>
          </div>

          {/* Share & Schedule Modal */}
          {showShareScheduleModal && (
            <ShareScheduleModal
              reportData={reportData}
              pdfData={currentPdfData}
              onClose={() => setShowShareScheduleModal(false)}
            />
          )}
        </div>
      )}
    </AdminShell>
  );
}