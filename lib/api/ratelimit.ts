/**
 * Rate Limiting Configuration
 * Uses in-memory store (upgrade to Redis/Upstash for production scale)
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetAt: number;
  firstRequest: number;
}

// In-memory store (consider Redis for multi-instance deployments)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Custom identifier function (default uses IP)
   */
  identifier?: (req: NextRequest) => string;
  
  /**
   * Custom response when rate limited
   */
  onRateLimit?: (req: NextRequest, resetAt: number) => NextResponse;
}

/**
 * Default rate limit configurations by endpoint type
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits
  auth: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 5 requests per minute
  },
  
  // Data modification endpoints
  write: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 requests per minute
  },
  
  // Read-only endpoints
  read: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 100 requests per minute
  },
  
  // Report generation (resource-intensive)
  reports: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 requests per minute
  },
  
  // Health checks and lightweight endpoints
  health: {
    maxRequests: 200,
    windowMs: 60 * 1000, // 200 requests per minute
  },
} as const;

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from headers (Vercel, Cloudflare, etc.)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  
  const ip = cfConnectingIp || realIp || forwardedFor?.split(',')[0] || 'unknown';
  
  // Include user agent for additional uniqueness
  const userAgent = req.headers.get('user-agent') || '';
  const platform = req.headers.get('x-platform') || '';
  
  return `${ip}:${platform}:${userAgent.substring(0, 50)}`;
}

/**
 * Check if request should be rate limited
 */
export async function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}> {
  const now = Date.now();
  const identifier = config.identifier?.(req) || getClientIdentifier(req);
  const key = `ratelimit:${identifier}`;
  
  let entry = rateLimitStore.get(key);
  
  // Clean up expired entry
  if (entry && entry.resetAt < now) {
    rateLimitStore.delete(key);
    entry = undefined;
  }
  
  if (!entry) {
    // First request in window
    const resetAt = now + config.windowMs;
    entry = {
      count: 1,
      resetAt,
      firstRequest: now,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt,
      total: config.maxRequests,
    };
  }
  
  // Increment count
  entry.count++;
  
  return {
    allowed: entry.count <= config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
    total: config.maxRequests,
  };
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const result = await checkRateLimit(req, config);
    
    // Always add rate limit headers
    const headers = new Headers();
    headers.set('X-RateLimit-Limit', String(result.total));
    headers.set('X-RateLimit-Remaining', String(result.remaining));
    headers.set('X-RateLimit-Reset', String(Math.floor(result.resetAt / 1000)));
    
    if (!result.allowed) {
      // Rate limit exceeded
      if (config.onRateLimit) {
        return config.onRateLimit(req, result.resetAt);
      }
      
      const resetDate = new Date(result.resetAt).toISOString();
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            details: {
              resetAt: resetDate,
              retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
            },
          },
          timestamp: new Date().toISOString(),
        },
        {
          status: 429,
          headers,
        }
      );
    }
    
    // Request allowed - call handler
    const response = await handler(req);
    
    // Add rate limit headers to response
    for (const [key, value] of headers.entries()) {
      response.headers.set(key, value);
    }
    
    return response;
  };
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStats(): {
  totalKeys: number;
  entries: Array<{ key: string; count: number; resetAt: string }>;
} {
  const entries = Array.from(rateLimitStore.entries()).map(([key, entry]) => ({
    key: key.replace(/^ratelimit:/, '').substring(0, 50) + '...',
    count: entry.count,
    resetAt: new Date(entry.resetAt).toISOString(),
  }));
  
  return {
    totalKeys: rateLimitStore.size,
    entries,
  };
}

/**
 * Clear all rate limit entries (for testing)
 */
export function clearRateLimits(): void {
  rateLimitStore.clear();
}
