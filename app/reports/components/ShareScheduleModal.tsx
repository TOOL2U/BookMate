'use client';

import { useState } from 'react';
import { Share2, Mail, Calendar, Link as LinkIcon, Copy, Check, X, Clock } from 'lucide-react';
import { ReportData } from '@/lib/reports/generators';

interface ShareScheduleModalProps {
  reportData: ReportData | null;
  pdfData?: string;
  onClose: () => void;
}

export default function ShareScheduleModal({ reportData, pdfData, onClose }: ShareScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'email' | 'schedule'>('share');
  const [shareSettings, setShareSettings] = useState({
    expiryDays: 30,
    passcode: '',
    maxViews: 0,
  });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  const [emailSettings, setEmailSettings] = useState({
    recipients: '',
    subject: '',
    message: '',
  });
  const [emailSent, setEmailSent] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const [scheduleSettings, setScheduleSettings] = useState({
    name: '',
    frequency: 'monthly' as 'weekly' | 'monthly' | 'quarterly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    time: '09:00',
    recipients: '',
    includeAI: true,
  });
  const [scheduleCreated, setScheduleCreated] = useState(false);
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

  const handleGenerateShareLink = async () => {
    if (!reportData) return;

    setIsGeneratingLink(true);
    try {
      const response = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName: `Financial Report - ${reportData.period.label}`,
          snapshot: {
            period: reportData.period,
            generatedAt: reportData.generatedAt,
            reportData: reportData, // Include full report data for viewing
          },
          expiryDays: shareSettings.expiryDays || undefined,
          passcode: shareSettings.passcode || undefined,
          maxViews: shareSettings.maxViews || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.shareUrl);
      }
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendEmail = async () => {
    if (!reportData) return;

    const recipients = emailSettings.recipients
      .split(',')
      .map(email => ({ email: email.trim() }))
      .filter(r => r.email);

    if (recipients.length === 0) return;

    setIsSendingEmail(true);
    try {
      // First, generate a share link
      const shareResponse = await fetch('/api/reports/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportName: `Financial Report - ${reportData.period.label}`,
          snapshot: {
            period: reportData.period,
            generatedAt: reportData.generatedAt,
            reportData: reportData,
          },
          expiryDays: 30, // Default 30 days expiry for emailed links
        }),
      });

      if (!shareResponse.ok) {
        throw new Error('Failed to generate share link');
      }

      const { shareUrl } = await shareResponse.json();

      // Then send email with the share link
      const emailResponse = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          reportName: `Financial Report - ${reportData.period.label}`,
          reportPeriod: reportData.period.label,
          shareUrl, // Include share URL instead of PDF
          customSubject: emailSettings.subject || undefined,
          customMessage: emailSettings.message || undefined,
        }),
      });

      if (emailResponse.ok) {
        setEmailSent(true);
        setTimeout(() => setEmailSent(false), 3000);
      } else {
        const error = await emailResponse.json();
        console.error('Failed to send email:', error);
        alert(`Failed to send email: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (!reportData || !scheduleSettings.name) return;

    const recipients = scheduleSettings.recipients
      .split(',')
      .map(email => ({ email: email.trim() }))
      .filter(r => r.email);

    if (recipients.length === 0) return;

    setIsCreatingSchedule(true);
    try {
      const response = await fetch('/api/reports/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: scheduleSettings.name,
          templateConfig: {
            type: scheduleSettings.frequency,
            dateRange: 'relative',
          },
          schedule: {
            frequency: scheduleSettings.frequency,
            dayOfWeek: scheduleSettings.dayOfWeek,
            dayOfMonth: scheduleSettings.dayOfMonth,
            time: scheduleSettings.time,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          recipients,
          delivery: {
            format: 'pdf',
            includeAI: scheduleSettings.includeAI,
          },
        }),
      });

      if (response.ok) {
        setScheduleCreated(true);
        setTimeout(() => setScheduleCreated(false), 3000);
      }
    } catch (error) {
      console.error('Failed to create schedule:', error);
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  if (!reportData) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-bg-card border border-border-card rounded-xl2 max-w-2xl w-full my-8">
        {/* Header */}
        <div className="p-6 border-b border-border-card flex items-center justify-between">
          <h2 className="text-2xl font-bebasNeue uppercase text-text-primary">
            Share & Schedule
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-card">
          {[
            { id: 'share', label: 'Share Link', icon: LinkIcon },
            { id: 'email', label: 'Send Email', icon: Mail },
            { id: 'schedule', label: 'Schedule', icon: Calendar },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex-1 px-6 py-4 font-aileron font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'text-yellow border-b-2 border-yellow'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Share Link Tab */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary font-aileron">
                Generate a secure link to share this report. The link provides view-only access to the report snapshot.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Expires In (Days)
                  </label>
                  <select
                    value={shareSettings.expiryDays}
                    onChange={(e) => setShareSettings({ ...shareSettings, expiryDays: Number(e.target.value) })}
                    className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                  >
                    <option value={7}>7 days</option>
                    <option value={30}>30 days</option>
                    <option value={90}>90 days</option>
                    <option value={0}>Never</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Max Views (0 = unlimited)
                  </label>
                  <input
                    type="number"
                    value={shareSettings.maxViews}
                    onChange={(e) => setShareSettings({ ...shareSettings, maxViews: Number(e.target.value) })}
                    min={0}
                    className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Passcode (Optional)
                </label>
                <input
                  type="text"
                  value={shareSettings.passcode}
                  onChange={(e) => setShareSettings({ ...shareSettings, passcode: e.target.value })}
                  placeholder="Leave empty for no passcode"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>

              <button
                onClick={handleGenerateShareLink}
                disabled={isGeneratingLink}
                className="w-full bg-yellow text-black px-6 py-3 rounded-xl2 font-bebasNeue uppercase tracking-wide hover:bg-yellow/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingLink ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Generate Share Link
                  </>
                )}
              </button>

              {shareUrl && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl2 p-4">
                  <p className="text-sm text-green-400 mb-2 font-medium">Link Generated!</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary text-sm"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="bg-yellow text-black px-4 py-2 rounded-xl2 hover:bg-yellow/90 transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl2 p-4">
                <p className="text-sm text-blue-400 font-aileron">
                  <strong>Note:</strong> The email will contain a secure link to view the report online. The link will be valid for 30 days.
                </p>
              </div>
              
              <p className="text-sm text-text-secondary font-aileron">
                Send a secure link to this report via email.
              </p>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  value={emailSettings.recipients}
                  onChange={(e) => setEmailSettings({ ...emailSettings, recipients: e.target.value })}
                  placeholder="investor@example.com, cfo@company.com"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  value={emailSettings.subject}
                  onChange={(e) => setEmailSettings({ ...emailSettings, subject: e.target.value })}
                  placeholder={`Financial Report - ${reportData.period.label}`}
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={emailSettings.message}
                  onChange={(e) => setEmailSettings({ ...emailSettings, message: e.target.value })}
                  placeholder="Add a custom message..."
                  rows={4}
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30 resize-none"
                />
              </div>

              <button
                onClick={handleSendEmail}
                disabled={!emailSettings.recipients.trim() || isSendingEmail}
                className="w-full bg-yellow text-black px-6 py-3 rounded-xl2 font-bebasNeue uppercase tracking-wide hover:bg-yellow/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Email with Link
                  </>
                )}
              </button>

              {emailSent && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl2 p-4 text-center">
                  <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium">Email sent successfully!</p>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary font-aileron">
                Schedule automatic report generation and delivery.
              </p>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Schedule Name
                </label>
                <input
                  type="text"
                  value={scheduleSettings.name}
                  onChange={(e) => setScheduleSettings({ ...scheduleSettings, name: e.target.value })}
                  placeholder="e.g., Monthly Investor Report"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Frequency
                  </label>
                  <select
                    value={scheduleSettings.frequency}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, frequency: e.target.value as typeof scheduleSettings.frequency })}
                    className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Time
                  </label>
                  <input
                    type="time"
                    value={scheduleSettings.time}
                    onChange={(e) => setScheduleSettings({ ...scheduleSettings, time: e.target.value })}
                    className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Recipients (comma-separated)
                </label>
                <input
                  type="text"
                  value={scheduleSettings.recipients}
                  onChange={(e) => setScheduleSettings({ ...scheduleSettings, recipients: e.target.value })}
                  placeholder="investor@example.com, cfo@company.com"
                  className="w-full bg-bg-app border border-border-card rounded-xl2 px-4 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-yellow/30"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-bg-app/60 border border-border-card rounded-xl2">
                <div>
                  <p className="font-medium text-text-primary">Include AI Insights</p>
                  <p className="text-xs text-text-secondary">Add AI summary to scheduled reports</p>
                </div>
                <button
                  onClick={() => setScheduleSettings({ ...scheduleSettings, includeAI: !scheduleSettings.includeAI })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    scheduleSettings.includeAI ? 'bg-yellow' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      scheduleSettings.includeAI ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <button
                onClick={handleCreateSchedule}
                disabled={!scheduleSettings.name.trim() || !scheduleSettings.recipients.trim() || isCreatingSchedule}
                className="w-full bg-yellow text-black px-6 py-3 rounded-xl2 font-bebasNeue uppercase tracking-wide hover:bg-yellow/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingSchedule ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar className="w-5 h-5" />
                    Create Schedule
                  </>
                )}
              </button>

              {scheduleCreated && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl2 p-4 text-center">
                  <Check className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-green-400 font-medium">Schedule created successfully!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
