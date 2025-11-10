/**
 * Validation Schemas for Reports API
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

// Template Validation
export const CreateTemplateSchema = z.object({
  workspaceId: z.string().optional(),
  workspace: z.string().optional(),
  name: z.string().min(1, 'Template name is required').max(255),
  description: z.string().max(1000).optional(),
  type: z.enum(['internal-summary', 'investor-update', 'bank-compliance', 'custom']),
  filters: z.object({
    dateRange: z.object({
      type: z.enum(['monthly', 'quarterly', 'ytd', 'custom', 'relative']),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
    entities: z.array(z.string()).optional(),
    currency: z.string().optional(),
  }).optional(),
  sections: z.object({
    kpis: z.boolean().optional(),
    revenueChart: z.boolean().optional(),
    expensesChart: z.boolean().optional(),
    profitMarginChart: z.boolean().optional(),
    expensesTable: z.boolean().optional(),
    balanceTable: z.boolean().optional(),
    aiSummary: z.boolean().optional(),
  }).optional(),
  brandingOverrides: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    footerText: z.string().max(500).optional(),
  }).optional(),
  branding: z.object({
    logoUrl: z.string().url().optional(),
    primaryColor: z.string().optional(),
    footerText: z.string().max(500).optional(),
  }).optional(),
  userId: z.string().optional(),
});

export const UpdateTemplateSchema = CreateTemplateSchema.partial();

// Share Report Validation
export const ShareReportSchema = z.object({
  workspaceId: z.string().optional(),
  reportName: z.string().min(1, 'Report name is required').max(255),
  snapshot: z.object({
    period: z.object({
      type: z.string(),
      label: z.string(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }),
    generatedAt: z.string(),
    data: z.any(),
    pdfUrl: z.string().optional(),
    previewUrl: z.string().optional(),
  }),
  expiryDays: z.number().min(1).max(90).optional(),
  passcode: z.string().min(4).max(50).optional(),
  maxViews: z.number().min(1).max(1000).optional(),
});

// Email Delivery Validation
export const SendEmailSchema = z.object({
  workspaceId: z.string().optional(),
  recipients: z.array(z.object({
    email: z.string().email('Invalid email address'),
    name: z.string().optional(),
  })).min(1, 'At least one recipient is required').max(50, 'Maximum 50 recipients allowed'),
  reportName: z.string().min(1).max(255),
  reportPeriod: z.string().optional(),
  pdfData: z.string().optional(), // Optional now - can send PDF or share link
  shareUrl: z.string().url().optional(), // New: share link option
  customSubject: z.string().max(255).optional(),
  customMessage: z.string().max(2000).optional(),
}).refine((data) => data.pdfData || data.shareUrl, {
  message: 'Either pdfData or shareUrl must be provided',
});

// Schedule Report Validation
export const CreateScheduleSchema = z.object({
  workspaceId: z.string().optional(),
  workspace: z.string().optional(),
  templateId: z.string().optional(),
  name: z.string().min(1, 'Schedule name is required').max(255),
  schedule: z.object({
    frequency: z.enum(['weekly', 'monthly', 'quarterly']),
    dayOfWeek: z.number().min(0).max(6).optional(), // 0 = Sunday, 6 = Saturday
    dayOfMonth: z.number().min(1).max(31).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
    timezone: z.string().default('UTC'),
  }),
  recipients: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional(),
  })).min(1, 'At least one recipient is required').max(50),
  deliveryConfig: z.object({
    format: z.enum(['pdf', 'excel', 'both']).default('pdf'),
    includeAI: z.boolean().default(true),
    emailSubject: z.string().max(255).optional(),
    customMessage: z.string().max(2000).optional(),
  }).optional(),
  userId: z.string().optional(),
});

export const UpdateScheduleSchema = CreateScheduleSchema.partial().extend({
  status: z.enum(['active', 'paused', 'failed']).optional(),
});

// Helper function to validate and handle errors
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  details: z.ZodError;
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error,
      };
    }
    return {
      success: false,
      error: 'Unknown validation error',
      details: error as z.ZodError,
    };
  }
}
