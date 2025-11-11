/**
 * Security Headers and CORS Configuration
 * Applies production-grade security headers to all API responses
 */

import { NextResponse } from 'next/server';

/**
 * Security headers for production
 */
export const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable browser XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (restrict features)
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  
  // Strict Transport Security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const;

/**
 * CORS headers for mobile app support
 */
export interface CORSConfig {
  /**
   * Allowed origins (* for all, or specific domains)
   */
  origins: string[] | '*';
  
  /**
   * Allowed HTTP methods
   */
  methods: string[];
  
  /**
   * Allowed headers
   */
  headers: string[];
  
  /**
   * Whether to allow credentials
   */
  credentials?: boolean;
  
  /**
   * Max age for preflight cache (in seconds)
   */
  maxAge?: number;
}

/**
 * Default CORS configuration for BookMate APIs
 */
export const DEFAULT_CORS_CONFIG: CORSConfig = {
  origins: '*', // Allow all origins (mobile apps don't have fixed origins)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  headers: [
    'Content-Type',
    'Authorization',
    'X-Platform',           // ios, android, web
    'X-Client-Version',     // App version
    'X-Device-ID',          // Device identifier
    'X-Request-ID',         // Request tracing
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  response: NextResponse,
  config: CORSConfig = DEFAULT_CORS_CONFIG
): NextResponse {
  // Origin
  if (config.origins === '*') {
    response.headers.set('Access-Control-Allow-Origin', '*');
  } else {
    // For specific origins, we'd check the request origin
    // For now, allow all since mobile apps don't have predictable origins
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  // Methods
  response.headers.set(
    'Access-Control-Allow-Methods',
    config.methods.join(', ')
  );
  
  // Headers
  response.headers.set(
    'Access-Control-Allow-Headers',
    config.headers.join(', ')
  );
  
  // Credentials
  if (config.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  
  // Max age
  if (config.maxAge) {
    response.headers.set('Access-Control-Max-Age', String(config.maxAge));
  }
  
  // Expose headers (so client can read them)
  response.headers.set(
    'Access-Control-Expose-Headers',
    [
      'X-RateLimit-Limit',
      'X-RateLimit-Remaining',
      'X-RateLimit-Reset',
      'X-Request-ID',
    ].join(', ')
  );
  
  return response;
}

/**
 * Apply all security and CORS headers
 */
export function applyProductionHeaders(
  response: NextResponse,
  corsConfig?: CORSConfig
): NextResponse {
  applySecurityHeaders(response);
  applyCORSHeaders(response, corsConfig);
  
  // Add request ID for tracing
  if (!response.headers.has('X-Request-ID')) {
    response.headers.set('X-Request-ID', generateRequestId());
  }
  
  return response;
}

/**
 * Handle OPTIONS preflight requests
 */
export function handlePreflight(corsConfig?: CORSConfig): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyCORSHeaders(response, corsConfig);
}

/**
 * Generate unique request ID for tracing
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Middleware wrapper to add security headers
 */
export function withSecurityHeaders(
  handler: (...args: any[]) => Promise<NextResponse>,
  corsConfig?: CORSConfig
) {
  return async (...args: any[]): Promise<NextResponse> => {
    // Check if this is a preflight request
    const request = args[0];
    if (request?.method === 'OPTIONS') {
      return handlePreflight(corsConfig);
    }
    
    // Call handler
    const response = await handler(...args);
    
    // Apply headers
    return applyProductionHeaders(response, corsConfig);
  };
}

/**
 * Content Security Policy for web pages (not API)
 */
export function getCSPHeader(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.firebase.com https://*.firebaseio.com https://*.googleapis.com https://accounting.siamoon.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}
