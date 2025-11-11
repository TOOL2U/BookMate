/**
 * Report Sharing & Scheduling
 * 
 * Manages shareable report links and scheduled report generation
 */

export interface SharedReport {
  id: string;
  token: string; // Signed token for access
  reportId: string;
  reportName: string;
  
  // Snapshot data (frozen at time of sharing)
  snapshot: {
    period: {
      start: string;
      end: string;
      label: string;
    };
    generatedAt: string;
    pdfUrl?: string;
    previewUrl?: string;
    reportData?: any; // Full report data for rendering
  };
  
  // Access control
  access: {
    expiresAt?: string;
    passcode?: string;
    viewCount?: number;
    maxViews?: number;
  };
  
  // Metadata
  createdAt: string;
  createdBy?: string;
  workspace?: string;
}

export interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  
  // Template reference
  templateId?: string;
  templateConfig: {
    type: 'monthly' | 'weekly' | 'quarterly';
    dateRange: 'relative' | 'custom';
  };
  
  // Schedule
  schedule: {
    frequency: 'weekly' | 'monthly' | 'quarterly';
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    monthOfQuarter?: number; // 1-3 for quarterly
    time: string; // HH:MM format
    timezone: string;
  };
  
  // Recipients
  recipients: {
    email: string;
    name?: string;
  }[];
  
  // Delivery options
  delivery: {
    format: 'pdf' | 'excel' | 'both';
    includeAI: boolean;
    emailSubject?: string;
    emailMessage?: string;
  };
  
  // Status
  status: 'active' | 'paused' | 'failed';
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  workspace?: string;
}

export interface EmailDeliveryLog {
  id: string;
  scheduledReportId?: string;
  manualReportId?: string;
  
  recipients: string[];
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'bounced';
  error?: string;
  
  attachments: {
    name: string;
    type: string;
    size: number;
  }[];
}

/**
 * Generate secure shareable token
 */
export function generateShareToken(): string {
  // In production, use crypto.randomBytes and sign with secret
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `share_${timestamp}_${random}`;
}

/**
 * Calculate next run time for scheduled report
 */
export function calculateNextRun(schedule: ScheduledReport['schedule']): Date {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (schedule.frequency) {
    case 'weekly':
      // Find next occurrence of dayOfWeek
      const currentDay = now.getDay();
      const targetDay = schedule.dayOfWeek || 1; // Default Monday
      let daysUntilNext = (targetDay - currentDay + 7) % 7;
      if (daysUntilNext === 0 && now.getHours() >= hours) {
        daysUntilNext = 7;
      }
      nextRun.setDate(now.getDate() + daysUntilNext);
      break;
      
    case 'monthly':
      // Find next occurrence of dayOfMonth
      const targetDate = schedule.dayOfMonth || 1;
      nextRun.setDate(targetDate);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
      
    case 'quarterly':
      // Find next quarter
      const currentMonth = now.getMonth();
      const currentQuarter = Math.floor(currentMonth / 3);
      const nextQuarter = currentQuarter + 1;
      const nextQuarterMonth = nextQuarter * 3 + (schedule.monthOfQuarter || 0);
      nextRun.setMonth(nextQuarterMonth);
      nextRun.setDate(1);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 3);
      }
      break;
  }
  
  return nextRun;
}

/**
 * Validate share link access
 */
export function validateShareAccess(
  sharedReport: SharedReport,
  passcode?: string
): { valid: boolean; reason?: string } {
  // Check expiration
  if (sharedReport.access.expiresAt) {
    const expiryDate = new Date(sharedReport.access.expiresAt);
    if (expiryDate < new Date()) {
      return { valid: false, reason: 'Link has expired' };
    }
  }
  
  // Check view count
  if (sharedReport.access.maxViews && sharedReport.access.viewCount) {
    if (sharedReport.access.viewCount >= sharedReport.access.maxViews) {
      return { valid: false, reason: 'Maximum views exceeded' };
    }
  }
  
  // Check passcode
  if (sharedReport.access.passcode) {
    if (!passcode || passcode !== sharedReport.access.passcode) {
      return { valid: false, reason: 'Invalid passcode' };
    }
  }
  
  return { valid: true };
}

/**
 * Format email subject with period
 */
export function formatEmailSubject(
  reportName: string,
  period: { start: string; end: string; label: string }
): string {
  return `${reportName} - ${period.label}`;
}

/**
 * Generate default email message
 */
export function generateEmailMessage(
  reportName: string,
  period: { start: string; end: string; label: string },
  organizationName?: string
): string {
  const org = organizationName || 'BookMate';
  return `
Please find attached the ${reportName} for ${period.label}.

This report contains financial performance data from ${period.start} to ${period.end}.

Generated by ${org} on ${new Date().toLocaleDateString()}.

This is an automated message. Please do not reply to this email.
  `.trim();
}
