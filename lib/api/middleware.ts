/**
 * API Middleware for BookMate
 * Provides security, rate limiting, and standardized responses
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

/**
 * Error Codes
 */
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

/**
 * Create standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponse<T>> {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ApiErrorCode | string,
  message: string,
  status: number = 500,
  details?: any
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        details,
      },
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

/**
 * Check if environment is production
 */
export function isProduction(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    process.env.VERCEL_ENV === 'production'
  );
}

/**
 * Middleware to disable debug routes in production
 */
export function requireDevelopment(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    if (isProduction()) {
      return createErrorResponse(
        ApiErrorCode.FORBIDDEN,
        'Debug endpoints are disabled in production',
        403
      );
    }
    return handler(req);
  };
}

/**
 * CORS configuration for mobile clients
 */
export function configureCORS(response: NextResponse): NextResponse {
  // Allow requests from mobile apps and web clients
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Client-Version, X-Platform'
  );
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours

  return response;
}

/**
 * Extract client info from request
 */
export interface ClientInfo {
  userAgent: string;
  platform: string | null; // 'ios', 'android', 'web'
  version: string | null;
  ip: string | null;
}

export function getClientInfo(req: NextRequest): ClientInfo {
  const userAgent = req.headers.get('user-agent') || '';
  const platform = req.headers.get('x-platform');
  const version = req.headers.get('x-client-version');
  const ip =
    req.headers.get('x-forwarded-for') ||
    req.headers.get('x-real-ip') ||
    null;

  return {
    userAgent,
    platform,
    version,
    ip,
  };
}

/**
 * Simple rate limiting (in-memory)
 * For production, use Redis or Vercel KV
 */
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 } // 100 req/min default
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean up expired entries
  if (record && record.resetAt < now) {
    rateLimitStore.delete(identifier);
  }

  const current = rateLimitStore.get(identifier);

  if (!current) {
    // First request in window
    rateLimitStore.set(identifier, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  if (current.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count++;
  return {
    allowed: true,
    remaining: config.maxRequests - current.count,
    resetAt: current.resetAt,
  };
}

/**
 * Middleware to apply rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (req: NextRequest) => {
    const clientInfo = getClientInfo(req);
    const identifier = clientInfo.ip || clientInfo.userAgent || 'unknown';

    const rateLimit = await checkRateLimit(identifier, config);

    if (!rateLimit.allowed) {
      return createErrorResponse(
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.',
        429,
        {
          resetAt: new Date(rateLimit.resetAt).toISOString(),
        }
      );
    }

    const response = await handler(req);

    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', String(config?.maxRequests || 100));
    response.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining));
    response.headers.set(
      'X-RateLimit-Reset',
      String(Math.floor(rateLimit.resetAt / 1000))
    );

    return response;
  };
}

/**
 * Validate request body against schema
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  validator: (data: any) => data is T
): Promise<{ valid: boolean; data?: T; error?: string }> {
  try {
    const body = await req.json();
    
    if (validator(body)) {
      return { valid: true, data: body };
    }
    
    return {
      valid: false,
      error: 'Request body validation failed',
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid JSON in request body',
    };
  }
}

/**
 * Log API request for monitoring
 */
export function logApiRequest(
  req: NextRequest,
  response: NextResponse,
  duration: number
) {
  const clientInfo = getClientInfo(req);
  
  console.log(JSON.stringify({
    type: 'api_request',
    method: req.method,
    url: req.url,
    status: response.status,
    duration,
    platform: clientInfo.platform,
    version: clientInfo.version,
    ip: clientInfo.ip,
    timestamp: new Date().toISOString(),
  }));
}

/**
 * Wrapper to add monitoring to API routes
 */
export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const startTime = Date.now();
    
    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;
      
      logApiRequest(req, response, duration);
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(JSON.stringify({
        type: 'api_error',
        method: req.method,
        url: req.url,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString(),
      }));
      
      throw error;
    }
  };
}
