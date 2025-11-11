/**
 * API Route: /api/reports/email
 * 
 * Sends reports via email with PDF attachments using SendGrid
 */

import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';
import { formatEmailSubject, generateEmailMessage } from '@/lib/reports/sharing';
import prisma from '@/lib/prisma';
import { validateRequest, SendEmailSchema } from '@/lib/validation/reports';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling } from '@/lib/api/errors';
import { withSecurityHeaders } from '@/lib/api/security';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function emailReportHandler(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate request
    const validation = validateRequest(SendEmailSchema, body);
    if (!validation.success) {
      const failedValidation = validation as { success: false; error: string; details?: any };
      console.error('Email validation failed:', failedValidation);
      return NextResponse.json(
        { 
          error: failedValidation.error,
          details: failedValidation.details?.errors?.map((e: any) => ({
            field: e.path?.join('.') || 'unknown',
            message: e.message,
          })) || [{ message: failedValidation.error }],
        },
        { status: 400 }
      );
    }
    
    // validation.success is true here, so we can access .data
    const {
      recipients,
      reportName,
      reportPeriod,
      pdfData,
      shareUrl,
      customSubject,
      customMessage,
      workspaceId,
    } = validation.data;
    
    // Check if SendGrid is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('⚠️ SendGrid API key not configured - simulating email send');
      
      // Mock delivery log for development (optional - skip if database unavailable)
      let mockMessageId = `mock_${Date.now()}`;
      try {
        const mockLog = await prisma.emailDeliveryLog.create({
          data: {
            workspaceId: workspaceId || 'default',
            reportName,
            reportPeriod: reportPeriod || 'N/A',
            recipients,
            emailProvider: 'sendgrid',
            messageId: mockMessageId,
            status: 'sent',
            pdfSize: pdfData ? Buffer.from(pdfData, 'base64').length : 0,
          },
        });
        mockMessageId = mockLog.messageId;
      } catch (dbError) {
        console.warn('Failed to log mock email (database unavailable):', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
      
      return NextResponse.json({
        success: true,
        message: 'Email simulated (SendGrid not configured)',
        messageId: mockMessageId,
        recipients: recipients.length,
        warning: 'SendGrid API key not set - email not actually sent',
      });
    }
    
    // Generate email content
    const subject = customSubject || `${reportName} - ${reportPeriod || 'Report'}`;
    const baseMessage = customMessage || (shareUrl 
      ? `Your ${reportName} report is ready to view.` 
      : `Please find attached your ${reportName} report.`);
    
    // Create HTML email template
    const htmlContent = shareUrl ? `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${reportName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #000000; padding: 40px 40px; text-align: center;">
                      <!-- Logo -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 16px;">
                            <img src="https://accounting.siamoon.com/logo/bm-logo-email.png" alt="BookMate Logo" width="80" height="80" style="display: block; margin: 0 auto; border-radius: 12px; max-width: 80px; height: auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; font-family: Arial, sans-serif;">BOOKMATE</h1>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Financial Analytics</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Yellow Accent Bar -->
                  <tr>
                    <td style="background-color: #FFF02B; height: 4px; padding: 0;"></td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 50px 40px; background-color: #ffffff;">
                      
                      <!-- Status Badge -->
                      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 30px;">
                        <tr>
                          <td style="background-color: #000000; border-radius: 6px; padding: 8px 20px;">
                            <p style="margin: 0; color: #FFF02B; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Your Report is Ready</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Report Title -->
                      <h2 style="margin: 0 0 8px 0; color: #000000; font-size: 26px; font-weight: 700; text-align: center;">${reportName}</h2>
                      ${reportPeriod ? `
                        <p style="margin: 0 0 30px 0; color: #6B7280; font-size: 14px; text-align: center; font-weight: 500;">${reportPeriod}</p>
                      ` : '<div style="margin-bottom: 30px;"></div>'}
                      
                      <!-- Divider -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td style="border-bottom: 1px solid #E5E7EB;"></td>
                        </tr>
                      </table>
                      
                      <!-- Message -->
                      <p style="margin: 0 0 36px 0; font-size: 15px; line-height: 1.7; color: #374151; text-align: center;">${baseMessage}</p>
                      
                      <!-- CTA Button -->
                      <table cellpadding="0" cellspacing="0" align="center">
                        <tr>
                          <td style="border-radius: 8px; background-color: #000000;">
                            <a href="${shareUrl}" style="display: inline-block; padding: 16px 48px; color: #FFF02B; text-decoration: none; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">
                              View Report
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Security Notice -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px; background-color: #F9FAFB; border-left: 3px solid #000000; border-radius: 4px;">
                        <tr>
                          <td style="padding: 20px 24px;">
                            <p style="margin: 0 0 6px 0; color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">SECURE ACCESS</p>
                            <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.6;">
                              This link expires in 30 days. Your data is protected with enterprise-grade encryption.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 30px 40px; text-align: center;">
                      <p style="margin: 0 0 8px 0; font-size: 11px; color: #9CA3AF; line-height: 1.6;">
                        &copy; ${new Date().getFullYear()} BookMate. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 10px; color: #6B7280;">
                        Automated message - please do not reply
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${reportName}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 0; overflow: hidden; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: #000000; padding: 40px 40px; text-align: center;">
                      <!-- Logo -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding-bottom: 16px;">
                            <img src="https://accounting.siamoon.com/logo/bm-logo-email.png" alt="BookMate Logo" width="80" height="80" style="display: block; margin: 0 auto; border-radius: 12px; max-width: 80px; height: auto;" />
                          </td>
                        </tr>
                        <tr>
                          <td align="center">
                            <h1 style="margin: 0 0 8px 0; color: #FFFFFF; font-size: 28px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; font-family: Arial, sans-serif;">BOOKMATE</h1>
                            <p style="margin: 0; color: #9CA3AF; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;">Financial Analytics</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  <!-- Yellow Accent Bar -->
                  <tr>
                    <td style="background-color: #FFF02B; height: 4px; padding: 0;"></td>
                  </tr>
                  
                  <!-- Main Content -->
                  <tr>
                    <td style="padding: 50px 40px; background-color: #ffffff;">
                      
                      <!-- Status Badge -->
                      <table cellpadding="0" cellspacing="0" align="center" style="margin-bottom: 30px;">
                        <tr>
                          <td style="background-color: #000000; border-radius: 6px; padding: 8px 20px;">
                            <p style="margin: 0; color: #FFF02B; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Report Generated</p>
                          </td>
                        </tr>
                      </table>
                      
                      <!-- Report Title -->
                      <h2 style="margin: 0 0 8px 0; color: #000000; font-size: 26px; font-weight: 700; text-align: center;">${reportName}</h2>
                      ${reportPeriod ? `
                        <p style="margin: 0 0 30px 0; color: #6B7280; font-size: 14px; text-align: center; font-weight: 500;">${reportPeriod}</p>
                      ` : '<div style="margin-bottom: 30px;"></div>'}
                      
                      <!-- Divider -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                        <tr>
                          <td style="border-bottom: 1px solid #E5E7EB;"></td>
                        </tr>
                      </table>
                      
                      <!-- Message -->
                      <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.7; color: #374151; text-align: center;">${baseMessage}</p>
                      
                      <!-- Security Notice -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 40px; background-color: #F9FAFB; border-left: 3px solid #000000; border-radius: 4px;">
                        <tr>
                          <td style="padding: 20px 24px;">
                            <p style="margin: 0 0 6px 0; color: #000000; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">SECURE DELIVERY</p>
                            <p style="margin: 0; font-size: 13px; color: #6B7280; line-height: 1.6;">
                              Your financial report has been securely generated. All data is protected with enterprise-grade encryption.
                            </p>
                          </td>
                        </tr>
                      </table>
                      
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #000000; padding: 30px 40px; text-align: center;">
                      <p style="margin: 0 0 8px 0; font-size: 11px; color: #9CA3AF; line-height: 1.6;">
                        &copy; ${new Date().getFullYear()} BookMate. All rights reserved.
                      </p>
                      <p style="margin: 0; font-size: 10px; color: #6B7280;">
                        Automated message - please do not reply
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
    
    try {
      // Send emails via SendGrid - must match EXACT verified sender in SendGrid
      const emailData: any = {
        to: recipients.map(r => ({ email: r.email, name: r.name })),
        from: {
          email: 'shaunducker1@gmail.com', // Must match verified sender exactly
          name: 'Shaun', // Match the name in SendGrid verification
        },
        replyTo: 'shaun@siamoon.com',
        subject,
        text: baseMessage + (shareUrl ? `\n\nView your report: ${shareUrl}` : ''),
        html: htmlContent,
      };
      
      console.log('📧 Sending email via SendGrid:', {
        from: emailData.from,
        to: recipients.map(r => r.email),
        subject,
        hasShareLink: !!shareUrl,
      });
      
      const response = await sgMail.send(emailData);
      
      // Log successful delivery to database (optional - skip if database unavailable)
      let messageId = response[0].headers['x-message-id'] || `sg_${Date.now()}`;
      try {
        const deliveryLog = await prisma.emailDeliveryLog.create({
          data: {
            workspaceId: workspaceId || 'default',
            reportName,
            reportPeriod: reportPeriod || 'N/A',
            recipients,
            emailProvider: 'sendgrid',
            messageId,
            status: 'sent',
            pdfSize: pdfData ? Buffer.from(pdfData, 'base64').length : 0,
            sentAt: new Date(),
          },
        });
        messageId = deliveryLog.messageId;
      } catch (dbError) {
        console.warn('Failed to log email delivery (database unavailable):', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
      
      console.log('✅ Email sent successfully:', {
        messageId,
        recipients: recipients.length,
        reportName,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Report sent successfully',
        messageId,
        recipients: recipients.length,
      });
      
    } catch (sendGridError: any) {
      console.error('❌ SendGrid error:', sendGridError);
      console.error('SendGrid error details:', {
        code: sendGridError.code,
        message: sendGridError.message,
        response: JSON.stringify(sendGridError.response?.body, null, 2),
      });
      
      // Log failed delivery to database (optional - skip if database unavailable)
      try {
        await prisma.emailDeliveryLog.create({
          data: {
            workspaceId: workspaceId || 'default',
            reportName,
            reportPeriod: reportPeriod || 'N/A',
            recipients,
            emailProvider: 'sendgrid',
            status: 'failed',
            error: sendGridError.message || 'Unknown SendGrid error',
            pdfSize: pdfData ? Buffer.from(pdfData, 'base64').length : 0,
          },
        });
      } catch (dbError) {
        console.warn('Failed to log email delivery (database unavailable):', dbError instanceof Error ? dbError.message : 'Unknown error');
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to send email',
          details: sendGridError.response?.body?.errors || sendGridError.message || 'Unknown error',
          code: sendGridError.code,
          help: sendGridError.code === 403 ? 'Verify that your sender email (shaunducker1@gmail.com) is verified in SendGrid: https://app.sendgrid.com/settings/sender_auth' : undefined,
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Email POST error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process email request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check email delivery status
async function getEmailStatusHandler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const emailId = searchParams.get('id');
    const workspaceId = searchParams.get('workspaceId') || 'default';
    
    if (!emailId) {
      // Return recent email logs for workspace
      const logs = await prisma.emailDeliveryLog.findMany({
        where: { workspaceId },
        orderBy: { sentAt: 'desc' },
        take: 20,
      });
      
      return NextResponse.json({
        logs,
        count: logs.length,
      });
    }
    
    // Get specific email log
    const log = await prisma.emailDeliveryLog.findUnique({
      where: { id: emailId },
    });
    
    if (!log) {
      return NextResponse.json(
        { error: 'Email log not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(log);
  } catch (error) {
    console.error('Email GET error:', error);
    return NextResponse.json(
      { error: 'Failed to check email status' },
      { status: 500 }
    );
  }
}

// Apply middleware: security headers → rate limiting (write tier for sending emails) → error handling
export const POST = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(emailReportHandler),
    RATE_LIMITS.write
  )
);

export const GET = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(getEmailStatusHandler),
    RATE_LIMITS.read
  )
);
