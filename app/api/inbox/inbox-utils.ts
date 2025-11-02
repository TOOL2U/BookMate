/**
 * Shared utilities for inbox data fetching
 * This file contains reusable functions that can be imported by multiple API routes
 */

// Cache for inbox data (5 seconds TTL to keep it fresh)
let cache: {
  data: any[];
  timestamp: number;
} | null = null;

const CACHE_DURATION_MS = 5000; // 5 seconds

/**
 * Internal function to fetch inbox data from Google Sheets
 * Can be called by other API routes without HTTP overhead
 */
export async function fetchInboxData(): Promise<any[]> {
  // Check cache first
  const now = Date.now();
  if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
    console.log('✅ Returning cached inbox data');
    return cache.data;
  }

  // Validate environment variables
  const webhookUrl = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!webhookUrl) {
    console.error('❌ SHEETS_WEBHOOK_URL not configured');
    throw new Error('Webhook endpoint not configured');
  }

  if (!secret) {
    console.error('❌ SHEETS_WEBHOOK_SECRET not configured');
    throw new Error('Authentication secret not configured');
  }

  console.log('📥 Fetching fresh inbox data from Google Sheets...');

  // Fetch data from Apps Script endpoint
  // IMPORTANT: Use text/plain to avoid CORS preflight redirect (Google Apps Script requirement)
  // Apps Script returns HTTP 302 redirects - we must NOT follow them automatically
  // because fetch() converts POST to GET when following redirects, losing the body
  let response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      action: 'getInbox',
      secret: secret
    }),
    redirect: 'manual'  // Apps Script returns 302 - don't auto-follow
  });

  // Handle Apps Script 302 redirect
  if (response.status === 302) {
    const location = response.headers.get('location');
    if (location) {
      console.log('📍 Following 302 redirect...');
      response = await fetch(location);
    }
  }

  if (!response.ok) {
    console.error('❌ Apps Script returned error:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('Error details:', errorText.substring(0, 200));
    throw new Error(`Failed to fetch inbox data: ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.ok) {
    console.error('❌ Apps Script returned error:', data.error);
    throw new Error(data.error || 'Failed to fetch inbox data');
  }

  console.log(`✅ Fetched ${data.count || 0} entries from Google Sheets`);

  // Update cache
  cache = {
    data: data.data || [],
    timestamp: now
  };

  return data.data || [];
}

/**
 * Clear the inbox cache
 * Useful after modifying data (e.g., deleting entries)
 */
export function clearInboxCache() {
  cache = null;
  console.log('🔄 Inbox cache cleared');
}
