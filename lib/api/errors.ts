/**
 * Enhanced Error Handling for Production APIs
 * Ensures all endpoints return consistent, mobile-friendly error responses
 */

import { NextResponse } from 'next/server';
import { createErrorResponse, ApiErrorCode } from './middleware';

/**
 * HTTP Status Code Mapping
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Common error scenarios with standardized responses
 */
export class APIError extends Error {
  constructor(
    public code: ApiErrorCode | string,
    public message: string,
    public statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
  
  toResponse(): NextResponse {
    return createErrorResponse(this.code, this.message, this.statusCode, this.details);
  }
}

/**
 * Pre-defined error types for common scenarios
 */
export const APIErrors = {
  // Authentication errors
  INVALID_TOKEN: () =>
    new APIError(
      ApiErrorCode.UNAUTHORIZED,
      'Invalid or expired authentication token',
      HTTP_STATUS.UNAUTHORIZED
    ),
  
  MISSING_TOKEN: () =>
    new APIError(
      ApiErrorCode.UNAUTHORIZED,
      'Authentication token required',
      HTTP_STATUS.UNAUTHORIZED
    ),
  
  // Authorization errors
  INSUFFICIENT_PERMISSIONS: () =>
    new APIError(
      ApiErrorCode.FORBIDDEN,
      'You do not have permission to access this resource',
      HTTP_STATUS.FORBIDDEN
    ),
  
  // Validation errors
  INVALID_INPUT: (details?: any) =>
    new APIError(
      ApiErrorCode.VALIDATION_ERROR,
      'Invalid request parameters',
      HTTP_STATUS.BAD_REQUEST,
      details
    ),
  
  MISSING_REQUIRED_FIELD: (field: string) =>
    new APIError(
      ApiErrorCode.VALIDATION_ERROR,
      `Required field missing: ${field}`,
      HTTP_STATUS.BAD_REQUEST,
      { field }
    ),
  
  // Resource errors
  NOT_FOUND: (resource: string) =>
    new APIError(
      ApiErrorCode.NOT_FOUND,
      `${resource} not found`,
      HTTP_STATUS.NOT_FOUND
    ),
  
  ALREADY_EXISTS: (resource: string) =>
    new APIError(
      'RESOURCE_EXISTS',
      `${resource} already exists`,
      HTTP_STATUS.CONFLICT
    ),
  
  // Service errors
  SERVICE_UNAVAILABLE: (service: string) =>
    new APIError(
      ApiErrorCode.SERVICE_UNAVAILABLE,
      `${service} is currently unavailable`,
      HTTP_STATUS.SERVICE_UNAVAILABLE
    ),
  
  FIREBASE_ERROR: (details?: any) =>
    new APIError(
      ApiErrorCode.INTERNAL_ERROR,
      'Firebase operation failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details
    ),
  
  GOOGLE_SHEETS_ERROR: (details?: any) =>
    new APIError(
      ApiErrorCode.INTERNAL_ERROR,
      'Google Sheets operation failed',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      details
    ),
  
  // Rate limiting
  RATE_LIMIT: (resetAt: Date) =>
    new APIError(
      ApiErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      HTTP_STATUS.TOO_MANY_REQUESTS,
      {
        resetAt: resetAt.toISOString(),
        retryAfter: Math.ceil((resetAt.getTime() - Date.now()) / 1000),
      }
    ),
};

/**
 * Wraps async route handlers with error handling
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('[API Error]', error);
      
      // Handle APIError instances
      if (error instanceof APIError) {
        return error.toResponse();
      }
      
      // Handle Firebase errors
      if (error && typeof error === 'object' && 'code' in error) {
        const firebaseError = error as { code: string; message: string };
        
        if (firebaseError.code === 'permission-denied') {
          return APIErrors.INSUFFICIENT_PERMISSIONS().toResponse();
        }
        
        if (firebaseError.code === 'not-found') {
          return APIErrors.NOT_FOUND('Resource').toResponse();
        }
        
        return APIErrors.FIREBASE_ERROR({
          code: firebaseError.code,
          message: firebaseError.message,
        }).toResponse();
      }
      
      // Generic error handler
      return createErrorResponse(
        ApiErrorCode.INTERNAL_ERROR,
        error instanceof Error ? error.message : 'An unexpected error occurred',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  };
}

/**
 * Validate request body and throw error if invalid
 */
export function validateRequired<T extends Record<string, any>>(
  body: T,
  requiredFields: (keyof T)[]
): void {
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      throw APIErrors.MISSING_REQUIRED_FIELD(String(field));
    }
  }
}

/**
 * Validate request method
 */
export function validateMethod(
  actual: string,
  allowed: string[]
): void {
  if (!allowed.includes(actual)) {
    throw new APIError(
      'METHOD_NOT_ALLOWED',
      `Method ${actual} not allowed. Allowed methods: ${allowed.join(', ')}`,
      HTTP_STATUS.METHOD_NOT_ALLOWED
    );
  }
}

/**
 * Log API errors for monitoring
 */
export function logAPIError(
  endpoint: string,
  error: Error | APIError,
  metadata?: Record<string, any>
): void {
  const logData = {
    type: 'api_error',
    endpoint,
    error: {
      name: error.name,
      message: error.message,
      ...(error instanceof APIError && {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      }),
    },
    metadata,
    timestamp: new Date().toISOString(),
  };
  
  console.error('[API Error Log]', JSON.stringify(logData));
}
