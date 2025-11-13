/**
 * API Client Helper
 * Utilities for making authenticated API requests from the frontend
 */

/**
 * Get the authentication token from localStorage
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('accessToken');
}

/**
 * Get authorization headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token found. Please login again.');
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Make an authenticated GET request
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Make an authenticated POST request
 */
export async function postWithAuth(url: string, body: any, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Make an authenticated DELETE request
 */
export async function deleteWithAuth(url: string, body?: any, options: RequestInit = {}): Promise<Response> {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    method: 'DELETE',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}
