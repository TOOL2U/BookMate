/**
 * Server Actions: Account Management
 * 
 * Centralized server actions for account operations
 */

'use server';

import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/auth/admin';
import { updateAccount, getAccountById } from '@/lib/accounts';

interface UpdateAccountResult {
  success: boolean;
  error?: string;
}

export async function updateAccountAction(formData: FormData): Promise<UpdateAccountResult> {
  try {
    // Check admin access
    const user = await checkAdminAccess();
    if (!user) {
      redirect('/login');
    }

    // Extract and validate fields
    const accountId = formData.get('accountId') as string;
    const companyName = formData.get('companyName') as string;
    const userEmail = formData.get('userEmail') as string;
    const sheetId = formData.get('sheetId') as string;
    const scriptUrl = formData.get('scriptUrl') as string;
    const scriptSecret = formData.get('scriptSecret') as string;

    // Validation
    if (!accountId || !companyName || !userEmail || !sheetId || !scriptSecret) {
      return {
        success: false,
        error: 'Missing required fields',
      };
    }

    if (companyName.trim().length === 0) {
      return {
        success: false,
        error: 'Company name cannot be empty',
      };
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return {
        success: false,
        error: 'Invalid email address',
      };
    }

    // Script secret validation
    if (scriptSecret.length < 10) {
      return {
        success: false,
        error: 'Script secret must be at least 10 characters',
      };
    }

    // Script URL validation (if provided)
    if (scriptUrl && scriptUrl.trim().length > 0) {
      try {
        const url = new URL(scriptUrl);
        if (!url.hostname.includes('script.google.com')) {
          return {
            success: false,
            error: 'Script URL must be from script.google.com',
          };
        }
      } catch {
        return {
          success: false,
          error: 'Invalid script URL format',
        };
      }
    }

    // Update account
    await updateAccount(accountId, {
      companyName: companyName.trim(),
      userEmail: userEmail.trim(),
      sheetId: sheetId.trim(),
      scriptUrl: scriptUrl.trim() || '',
      scriptSecret: scriptSecret.trim(),
      updatedBy: user.userId || 'admin',
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error('Error updating account:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update account',
    };
  }
}

interface TestConnectionResult {
  ok: boolean;
  status?: number;
  body?: any;
  errorMessage?: string;
  timestamp: string;
}

/**
 * Test the Apps Script connection for an account
 */
export async function testConnectionAction(accountId: string): Promise<TestConnectionResult> {
  const timestamp = new Date().toISOString();

  try {
    // Check admin access
    const user = await checkAdminAccess();
    if (!user || !user.isAdmin) {
      redirect('/login');
    }

    // Get account configuration
    const account = await getAccountById(accountId);
    if (!account) {
      return {
        ok: false,
        errorMessage: 'Account not found',
        timestamp,
      };
    }

    // Validate required fields
    if (!account.scriptUrl || account.scriptUrl.trim().length === 0) {
      return {
        ok: false,
        errorMessage: 'Script URL is not configured for this account',
        timestamp,
      };
    }

    if (!account.scriptSecret || account.scriptSecret.trim().length === 0) {
      return {
        ok: false,
        errorMessage: 'Script Secret is not configured for this account',
        timestamp,
      };
    }

    // Construct test transaction payload
    const testPayload = {
      secret: account.scriptSecret,
      testMode: true,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      description: 'BookMate connection test',
      amount: 0,
      category: 'TEST',
      source: 'admin_connection_test',
    };

    // Send request to Apps Script endpoint
    let response: Response;
    try {
      response = await fetch(account.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        // Timeout after 10 seconds
        signal: AbortSignal.timeout(10000),
      });
    } catch (error) {
      // Network error, timeout, or DNS failure
      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.name === 'TimeoutError') {
          return {
            ok: false,
            errorMessage: 'Connection timeout (Apps Script did not respond within 10 seconds)',
            timestamp,
          };
        }
        return {
          ok: false,
          errorMessage: `Network error: ${error.message}`,
          timestamp,
        };
      }
      return {
        ok: false,
        errorMessage: 'Unknown network error occurred',
        timestamp,
      };
    }

    // Parse response body
    let responseBody: any;
    const responseText = await response.text();
    
    try {
      responseBody = JSON.parse(responseText);
    } catch {
      // Apps Script returned invalid JSON
      return {
        ok: false,
        status: response.status,
        errorMessage: `Apps Script returned invalid JSON. Status: ${response.status}. Response: ${responseText.substring(0, 200)}`,
        timestamp,
      };
    }

    // Check HTTP status
    if (!response.ok) {
      // HTTP error status (4xx, 5xx)
      const errorMsg = responseBody?.error || responseBody?.message || 'Unknown error';
      return {
        ok: false,
        status: response.status,
        body: responseBody,
        errorMessage: `HTTP ${response.status}: ${errorMsg}`,
        timestamp,
      };
    }

    // Check Apps Script response
    if (responseBody.success === true) {
      // Success! Update account with test result
      await updateAccount(accountId, {
        lastConnectionTestAt: timestamp,
        lastConnectionTestStatus: 'success',
        lastConnectionTestMessage: 'Connection successful',
        updatedBy: user.userId || 'system',
      });

      return {
        ok: true,
        status: response.status,
        body: responseBody,
        timestamp,
      };
    } else {
      // Apps Script returned success: false
      const errorMsg = responseBody.error || responseBody.message || 'Apps Script rejected the request';
      
      // Common error messages
      let friendlyMessage = errorMsg;
      if (errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('secret')) {
        friendlyMessage = 'Unauthorized - Script secret may be incorrect';
      } else if (errorMsg.toLowerCase().includes('missing') || errorMsg.toLowerCase().includes('required')) {
        friendlyMessage = 'Missing required fields in request';
      }

      // Update account with test result
      await updateAccount(accountId, {
        lastConnectionTestAt: timestamp,
        lastConnectionTestStatus: 'error',
        lastConnectionTestMessage: friendlyMessage,
        updatedBy: user.userId || 'system',
      });

      return {
        ok: false,
        status: response.status,
        body: responseBody,
        errorMessage: friendlyMessage,
        timestamp,
      };
    }
  } catch (error) {
    console.error('Error testing connection:', error);
    
    // Update account with test result
    try {
      const user = await checkAdminAccess();
      await updateAccount(accountId, {
        lastConnectionTestAt: timestamp,
        lastConnectionTestStatus: 'error',
        lastConnectionTestMessage: error instanceof Error ? error.message : 'Unknown error',
        updatedBy: user?.userId || 'system',
      });
    } catch {
      // Ignore update errors
    }

    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : 'Unexpected error occurred',
      timestamp,
    };
  }
}
