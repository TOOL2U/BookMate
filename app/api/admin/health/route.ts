/**
 * GET /api/admin/health
 * 
 * Admin health dashboard showing Phase 2 metrics
 */

import { NextResponse } from 'next/server';
import { getMetricStats, getMetrics } from '@/utils/telemetry';

export async function GET() {
  try {
    // Feature flag check
    if (process.env.FEATURE_BALANCE_PHASE2 !== 'true') {
      return NextResponse.json({
        ok: false,
        error: 'Phase 2 features not enabled'
      }, { status: 403 });
    }

    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Collect metrics
    const aiCheckStats24h = getMetricStats('ai.check.latency', last24h);
    const aiCheckStats7d = getMetricStats('ai.check.latency', last7d);
    const activityLogStats24h = getMetricStats('activity.log.requests', last24h);
    const alertStats24h = getMetricStats('alerts.sent', last24h);
    const alertStats7d = getMetricStats('alerts.sent', last7d);

    // Get recent alerts detail
    const recentAlerts = getMetrics('alerts.sent', last24h);

    // Calculate success rates
    const aiChecks = getMetrics('ai.check.status', last24h);
    const failedChecks = aiChecks.filter(m => m.metadata?.status === 'FAIL').length;
    const warnChecks = aiChecks.filter(m => m.metadata?.status === 'WARN').length;
    const okChecks = aiChecks.filter(m => m.metadata?.status === 'OK').length;

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      metrics: {
        aiCheck: {
          last24h: {
            count: aiCheckStats24h?.count || 0,
            avgLatency: aiCheckStats24h?.avg || 0,
            maxLatency: aiCheckStats24h?.max || 0,
            minLatency: aiCheckStats24h?.min || 0,
            lastRun: aiCheckStats24h?.latest?.timestamp || null,
            lastStatus: aiCheckStats24h?.latest?.metadata?.status || null
          },
          last7d: {
            count: aiCheckStats7d?.count || 0,
            avgLatency: aiCheckStats7d?.avg || 0
          },
          statusBreakdown: {
            ok: okChecks,
            warn: warnChecks,
            fail: failedChecks
          }
        },
        activityLog: {
          last24h: {
            requests: activityLogStats24h?.count || 0,
            avgLatency: activityLogStats24h?.avg || 0
          }
        },
        alerts: {
          last24h: {
            sent: alertStats24h?.count || 0,
            types: recentAlerts.reduce((acc, alert) => {
              const type = alert.metadata?.type || 'unknown';
              acc[type] = (acc[type] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          },
          last7d: {
            sent: alertStats7d?.count || 0
          }
        }
      },
      recentAlerts: recentAlerts.slice(-10).map(a => ({
        timestamp: a.timestamp,
        type: a.metadata?.type,
        severity: a.metadata?.severity,
        account: a.metadata?.account
      })),
      system: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      }
    });

  } catch (error) {
    console.error('Health endpoint error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
