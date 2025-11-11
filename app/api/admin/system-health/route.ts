/**
 * API Endpoint: System Health Status
 * 
 * Provides real-time health metrics for monitoring dashboard
 * Checks API endpoints, Firebase, and scheduled jobs
 */

import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/lib/api/security';
import { withRateLimit, RATE_LIMITS } from '@/lib/api/ratelimit';
import { withErrorHandling } from '@/lib/api/errors';

interface EndpointHealth {
  name: string;
  url: string;
  status: 'healthy' | 'degraded' | 'offline';
  responseTime?: number;
  lastCheck: string;
  error?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'offline';
  timestamp: string;
  uptime: number;
  endpoints: EndpointHealth[];
  firebase: {
    status: 'healthy' | 'offline';
    lastSync?: string;
  };
  scheduledJobs: {
    name: string;
    lastRun?: string;
    status: 'success' | 'failed' | 'pending';
  }[];
  metrics: {
    avgResponseTime: number;
    errorRate: number;
    requestCount24h: number;
  };
}

async function checkEndpoint(url: string, name: string): Promise<EndpointHealth> {
  const startTime = Date.now();
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'x-internal-request': 'true' },
      signal: AbortSignal.timeout(5000), // 5s timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      name,
      url,
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      lastCheck: new Date().toISOString(),
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error: any) {
    return {
      name,
      url,
      status: 'offline',
      responseTime: Date.now() - startTime,
      lastCheck: new Date().toISOString(),
      error: error.message || 'Request failed'
    };
  }
}

async function systemHealthHandler(req: NextRequest) {
  // TODO: Add admin authentication
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Check critical endpoints in parallel
  const endpointChecks = await Promise.all([
    checkEndpoint(`${baseUrl}/api/balance`, 'Balance API'),
    checkEndpoint(`${baseUrl}/api/pnl`, 'P&L API'),
    checkEndpoint(`${baseUrl}/api/health/balance`, 'Health Check'),
    checkEndpoint(`${baseUrl}/api/categories/payments`, 'Categories API'),
    checkEndpoint(`${baseUrl}/api/reports/generate`, 'Reports API'),
  ]);

  // Calculate metrics
  const healthyCount = endpointChecks.filter(e => e.status === 'healthy').length;
  const totalCount = endpointChecks.length;
  const avgResponseTime = endpointChecks
    .filter(e => e.responseTime !== undefined)
    .reduce((sum, e) => sum + (e.responseTime || 0), 0) / totalCount;

  // Determine overall health
  let overallStatus: 'healthy' | 'degraded' | 'offline' = 'healthy';
  if (healthyCount === 0) {
    overallStatus = 'offline';
  } else if (healthyCount < totalCount) {
    overallStatus = 'degraded';
  }

  // Firebase health (check if we can connect)
  let firebaseStatus: 'healthy' | 'offline' = 'healthy';
  try {
    const { getAdminDb } = await import('@/lib/firebase/admin');
    const db = getAdminDb();
    // Simple connection test
    await db.collection('_health_check').limit(1).get();
  } catch (error) {
    firebaseStatus = 'offline';
  }

  // TODO: Get actual scheduled jobs status from database
  const scheduledJobs = [
    {
      name: 'Daily Backup',
      lastRun: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6h ago
      status: 'success' as const
    },
    {
      name: 'Consistency Check',
      lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24h ago
      status: 'success' as const
    }
  ];

  const health: SystemHealth = {
    overall: firebaseStatus === 'offline' ? 'offline' : overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    endpoints: endpointChecks,
    firebase: {
      status: firebaseStatus,
      lastSync: new Date().toISOString(), // TODO: Get from actual sync log
    },
    scheduledJobs,
    metrics: {
      avgResponseTime: Math.round(avgResponseTime),
      errorRate: ((totalCount - healthyCount) / totalCount) * 100,
      requestCount24h: 0, // TODO: Implement request counter
    }
  };

  return NextResponse.json(health);
}

// Apply middleware
export const GET = withSecurityHeaders(
  withRateLimit(
    withErrorHandling(systemHealthHandler),
    RATE_LIMITS.health
  )
);
