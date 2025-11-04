/**
 * POST /api/alerts/test
 * 
 * Test endpoint to verify alert wiring (Slack/Email).
 * Sends a demo alert to configured channels.
 */

import { NextRequest, NextResponse } from 'next/server';

interface AlertTestResponse {
  ok: boolean;
  sent: {
    slack: boolean;
    email: boolean;
  };
  message: string;
  error?: string;
}

async function sendSlackAlert(message: string): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('YOUR/WEBHOOK')) {
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: message,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🔔 BookMate Alert Test'
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })} ICT`
              }
            ]
          }
        ]
      })
    });

    return res.ok;
  } catch (error) {
    console.error('Slack alert failed:', error);
    return false;
  }
}

async function sendEmailAlert(message: string): Promise<boolean> {
  const emailList = process.env.ALERT_EMAIL_LIST;
  if (!emailList || emailList.includes('example.com')) {
    return false;
  }

  // TODO: Implement email sending via SendGrid, AWS SES, or similar
  // For now, just log
  console.log('Email alert would be sent to:', emailList);
  console.log('Message:', message);
  
  // Return false since not actually implemented yet
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // Feature flag check
    if (process.env.FEATURE_BALANCE_PHASE2 !== 'true') {
      return NextResponse.json({
        ok: false,
        error: 'Phase 2 features not enabled',
        sent: { slack: false, email: false },
        message: ''
      }, { status: 403 });
    }

    const body = await req.json();
    const customMessage = body.message || '✅ This is a test alert from BookMate. All systems operational.';

    // Send to Slack
    const slackSent = await sendSlackAlert(customMessage);

    // Send to Email
    const emailSent = await sendEmailAlert(customMessage);

    const response: AlertTestResponse = {
      ok: true,
      sent: {
        slack: slackSent,
        email: emailSent
      },
      message: slackSent || emailSent
        ? 'Alert test sent successfully'
        : 'No alert channels configured (check SLACK_WEBHOOK_URL and ALERT_EMAIL_LIST)'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Alert test error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      sent: { slack: false, email: false },
      message: 'Failed to send test alert'
    }, { status: 500 });
  }
}
