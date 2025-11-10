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

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function POST(req: NextRequest) {
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
      
      // Mock delivery log for development
      const mockLog = await prisma.emailDeliveryLog.create({
        data: {
          workspaceId: workspaceId || 'default',
          reportName,
          reportPeriod: reportPeriod || 'N/A',
          recipients,
          emailProvider: 'sendgrid',
          messageId: `mock_${Date.now()}`,
          status: 'sent',
          pdfSize: pdfData ? Buffer.from(pdfData, 'base64').length : 0,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: 'Email simulated (SendGrid not configured)',
        messageId: mockLog.messageId,
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
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #FFF02B; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">📊 BookMate Financial Report</h1>
          </div>
          
          <div style="background: #fff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #000; margin-top: 0; font-size: 20px;">${reportName}</h2>
            ${reportPeriod ? `<p style="color: #666; font-size: 14px; margin-bottom: 20px;"><strong>Period:</strong> ${reportPeriod}</p>` : ''}
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.8;">${baseMessage}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareUrl}" style="display: inline-block; background: #FFF02B; color: #000; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: bold; text-transform: uppercase;">
                View Report
              </a>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background: #fff9e6; border-left: 4px solid #FFF02B; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>🔒 Secure Link:</strong> This link will expire in 30 days. Click the button above to view your report online.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions about this report, please don't hesitate to reach out.
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; margin-top: 0;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} BookMate. All rights reserved.<br>
              This is an automated message from BookMate Reports. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    ` : `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #FFF02B; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">📊 BookMate Financial Report</h1>
          </div>
          
          <div style="background: #fff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #000; margin-top: 0; font-size: 20px;">${reportName}</h2>
            ${reportPeriod ? `<p style="color: #666; font-size: 14px; margin-bottom: 20px;"><strong>Period:</strong> ${reportPeriod}</p>` : ''}
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin: 25px 0;">
              <p style="margin: 0; font-size: 16px; line-height: 1.8;">${baseMessage}</p>
            </div>
            
            <div style="margin: 30px 0; padding: 20px; background: #fff9e6; border-left: 4px solid #FFF02B; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>📎 Attachment:</strong> Your report is attached as a PDF file.
              </p>
            </div>
            
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              If you have any questions about this report, please don't hesitate to reach out.
            </p>
          </div>
          
          <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; margin-top: 0;">
            <p style="margin: 0; font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} BookMate. All rights reserved.<br>
              This is an automated message from BookMate Reports. Please do not reply to this email.
            </p>
          </div>
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

      // Only add attachments if PDF data is provided
      if (pdfData) {
        emailData.attachments = [
          {
            content: pdfData,
            filename: `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${reportPeriod?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'report'}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment',
          },
        ];
      }
      
      console.log('📧 Sending email via SendGrid:', {
        from: emailData.from,
        to: recipients.map(r => r.email),
        subject,
        hasAttachment: !!pdfData,
        hasShareLink: !!shareUrl,
        attachmentSize: pdfData ? Math.round((pdfData.length * 3) / 4 / 1024) + ' KB' : 'N/A',
      });
      
      const response = await sgMail.send(emailData);
      
      // Log successful delivery to database
      const deliveryLog = await prisma.emailDeliveryLog.create({
        data: {
          workspaceId: workspaceId || 'default',
          reportName,
          reportPeriod: reportPeriod || 'N/A',
          recipients,
          emailProvider: 'sendgrid',
          messageId: response[0].headers['x-message-id'] || `sg_${Date.now()}`,
          status: 'sent',
          pdfSize: pdfData ? Buffer.from(pdfData, 'base64').length : 0,
          sentAt: new Date(),
        },
      });
      
      console.log('✅ Email sent successfully:', {
        messageId: deliveryLog.messageId,
        recipients: recipients.length,
        reportName,
      });
      
      return NextResponse.json({
        success: true,
        message: 'Report sent successfully',
        messageId: deliveryLog.messageId,
        recipients: recipients.length,
        deliveryLogId: deliveryLog.id,
      });
      
    } catch (sendGridError: any) {
      console.error('❌ SendGrid error:', sendGridError);
      console.error('SendGrid error details:', {
        code: sendGridError.code,
        message: sendGridError.message,
        response: JSON.stringify(sendGridError.response?.body, null, 2),
      });
      
      // Log failed delivery to database
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
export async function GET(req: NextRequest) {
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
