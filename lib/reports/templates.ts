/**
 * Report Templates - Reusable report configurations
 * 
 * Allows users to save and reuse report settings, filters, and styling
 */

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'internal-summary' | 'investor-update' | 'bank-compliance' | 'custom';
  
  // Filters & Parameters
  filters: {
    dateRange: {
      type: 'monthly' | 'quarterly' | 'ytd' | 'custom' | 'relative';
      relative?: 'last-month' | 'last-quarter' | 'last-year' | 'ytd';
      custom?: { start: string; end: string };
    };
    entities?: {
      accounts?: string[];
      properties?: string[];
      persons?: string[];
    };
    currency?: string;
  };
  
  // Section Toggles
  sections: {
    kpis: boolean;
    charts: {
      revenueVsExpenses: boolean;
      expenseBreakdown: boolean;
      accountBalances: boolean;
    };
    tables: {
      financialSummary: boolean;
      categoryBreakdown: boolean;
    };
    aiSummary: {
      enabled: boolean;
      tone?: 'standard' | 'investor' | 'internal' | 'founder' | 'simple';
      language?: string;
    };
  };
  
  // Branding Overrides
  brandingOverrides?: {
    logoUrl?: string;
    primaryColor?: string;
    footerText?: string;
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  workspace?: string;
}

export interface OrganizationProfile {
  businessName: string;
  sector?: string;
  keyProperties?: string[];
  goals?: string[];
  description?: string;
}

export interface AIToneConfig {
  tone: 'standard' | 'investor' | 'internal' | 'founder' | 'simple';
  language: string;
  organizationProfile?: OrganizationProfile;
}

/**
 * Default report templates
 */
export const DEFAULT_TEMPLATES: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Investor Update',
    description: 'High-level summary for investors with AI insights',
    type: 'investor-update',
    filters: {
      dateRange: {
        type: 'relative',
        relative: 'last-month',
      },
      currency: 'USD',
    },
    sections: {
      kpis: true,
      charts: {
        revenueVsExpenses: true,
        expenseBreakdown: true,
        accountBalances: false,
      },
      tables: {
        financialSummary: true,
        categoryBreakdown: false,
      },
      aiSummary: {
        enabled: true,
        tone: 'investor',
        language: 'en',
      },
    },
    brandingOverrides: {
      footerText: 'Confidential – For Investors Only',
    },
  },
  {
    name: 'Internal Performance',
    description: 'Detailed report for internal finance team',
    type: 'internal-summary',
    filters: {
      dateRange: {
        type: 'monthly',
      },
      currency: 'USD',
    },
    sections: {
      kpis: true,
      charts: {
        revenueVsExpenses: true,
        expenseBreakdown: true,
        accountBalances: true,
      },
      tables: {
        financialSummary: true,
        categoryBreakdown: true,
      },
      aiSummary: {
        enabled: true,
        tone: 'internal',
        language: 'en',
      },
    },
  },
  {
    name: 'Bank/Compliance',
    description: 'Compliance-ready report for banking and regulatory purposes',
    type: 'bank-compliance',
    filters: {
      dateRange: {
        type: 'quarterly',
      },
      currency: 'USD',
    },
    sections: {
      kpis: true,
      charts: {
        revenueVsExpenses: true,
        expenseBreakdown: true,
        accountBalances: true,
      },
      tables: {
        financialSummary: true,
        categoryBreakdown: true,
      },
      aiSummary: {
        enabled: false,
      },
    },
    brandingOverrides: {
      footerText: 'Official Financial Statement – BookMate',
    },
  },
];

/**
 * Calculate date range from relative period
 */
export function calculateRelativeDateRange(
  relative: 'last-month' | 'last-quarter' | 'last-year' | 'ytd'
): { start: string; end: string; label: string } {
  const now = new Date();
  let start: Date;
  let end: Date;
  let label: string;

  switch (relative) {
    case 'last-month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
      label = start.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      break;

    case 'last-quarter':
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1;
      const lastQuarterYear = currentQuarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      start = new Date(lastQuarterYear, lastQuarter * 3, 1);
      end = new Date(lastQuarterYear, (lastQuarter + 1) * 3, 0);
      label = `Q${lastQuarter + 1} ${lastQuarterYear}`;
      break;

    case 'last-year':
      start = new Date(now.getFullYear() - 1, 0, 1);
      end = new Date(now.getFullYear() - 1, 11, 31);
      label = `${now.getFullYear() - 1}`;
      break;

    case 'ytd':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date();
      label = `YTD ${now.getFullYear()}`;
      break;
  }

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label,
  };
}

/**
 * Apply template to report configuration
 */
export function applyTemplate(template: ReportTemplate): {
  reportType: string;
  dateRange: { start: string; end: string };
  includeAI: boolean;
  aiTone?: string;
} {
  let dateRange: { start: string; end: string };

  if (template.filters.dateRange.type === 'relative' && template.filters.dateRange.relative) {
    const calculated = calculateRelativeDateRange(template.filters.dateRange.relative);
    dateRange = { start: calculated.start, end: calculated.end };
  } else if (template.filters.dateRange.type === 'custom' && template.filters.dateRange.custom) {
    dateRange = template.filters.dateRange.custom;
  } else {
    // Default to current month
    const now = new Date();
    dateRange = {
      start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    };
  }

  return {
    reportType: template.filters.dateRange.type === 'relative' ? 'custom' : template.filters.dateRange.type,
    dateRange,
    includeAI: template.sections.aiSummary.enabled,
    aiTone: template.sections.aiSummary.tone,
  };
}
