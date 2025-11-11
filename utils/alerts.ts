/**
 * Alert utilities for Phase 2
 * Handles Slack and Email notifications for drift alerts and low cash warnings
 */

export type AlertType = 'drift' | 'low_cash' | 'test';
export type AlertSeverity = 'info' | 'warning' | 'critical';

interface AlertPayload {
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * Send alert to Slack webhook
 */
export async function sendSlackAlert(payload: AlertPayload): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.includes('YOUR/WEBHOOK')) {
    console.warn('Slack webhook not configured');
    return false;
  }

  const emoji = payload.severity === 'critical' ? '🚨' : payload.severity === 'warning' ? '⚠️' : 'ℹ️';
  const color = payload.severity === 'critical' ? '#dc2626' : payload.severity === 'warning' ? '#f59e0b' : '#3b82f6';

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `${emoji} ${payload.title}`,
        attachments: [
          {
            color,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: `${emoji} ${payload.title}`
                }
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: payload.message
                }
              },
              ...(payload.details ? [{
                type: 'section',
                fields: Object.entries(payload.details).map(([key, value]) => ({
                  type: 'mrkdwn',
                  text: `*${key}:*\n${value}`
                }))
              }] : []),
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' })} ICT | 📊 BookMate Alert System`
                  }
                ]
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

/**
 * Send alert via email (placeholder - implement with SendGrid/SES)
 */
export async function sendEmailAlert(payload: AlertPayload): Promise<boolean> {
  const emailList = process.env.ALERT_EMAIL_LIST;
  if (!emailList || emailList.includes('example.com')) {
    console.warn('Email alerts not configured');
    return false;
  }

  // TODO: Implement with SendGrid, AWS SES, or similar
  console.log('[EMAIL ALERT]', {
    to: emailList,
    subject: payload.title,
    body: payload.message,
    details: payload.details
  });

  return false; // Return false until actually implemented
}

/**
 * Send drift alert when balance discrepancy detected
 */
export async function sendDriftAlert(
  account: string,
  drift: number,
  expected: number,
  actual: number,
  severity: 'warning' | 'critical'
): Promise<void> {
  const payload: AlertPayload = {
    type: 'drift',
    severity,
    title: `Balance Drift Detected: ${account}`,
    message: severity === 'critical'
      ? `*URGENT:* Significant balance drift detected in ${account}. Immediate reconciliation required.`
      : `Balance drift detected in ${account}. Please review recent transactions.`,
    details: {
      'Account': account,
      'Expected Balance': `฿${expected.toLocaleString()}`,
      'Actual Balance': `฿${actual.toLocaleString()}`,
      'Drift Amount': `฿${Math.abs(drift).toLocaleString()} ${drift > 0 ? '(higher)' : '(lower)'}`,
      'Severity': severity.toUpperCase()
    }
  };

  await Promise.all([
    sendSlackAlert(payload),
    sendEmailAlert(payload)
  ]);
}

/**
 * Send low cash alert when account falls below threshold
 */
export async function sendLowCashAlert(
  account: string,
  balance: number,
  threshold: number
): Promise<void> {
  const payload: AlertPayload = {
    type: 'low_cash',
    severity: 'warning',
    title: `Low Cash Warning: ${account}`,
    message: `The ${account} account has fallen below the configured threshold. Please review cash flow.`,
    details: {
      'Account': account,
      'Current Balance': `฿${balance.toLocaleString()}`,
      'Threshold': `฿${threshold.toLocaleString()}`,
      'Shortfall': `฿${(threshold - balance).toLocaleString()}`
    }
  };

  await Promise.all([
    sendSlackAlert(payload),
    sendEmailAlert(payload)
  ]);
}
