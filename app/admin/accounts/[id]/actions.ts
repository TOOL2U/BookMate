/**
 * Server Actions: Account Edit
 * 
 * Actions for updating account configurations
 */

'use server';

import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/auth/admin';
import { updateAccount } from '@/lib/accounts';

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
