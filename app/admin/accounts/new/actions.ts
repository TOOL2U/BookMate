/**
 * Server Action: Create New Account
 * 
 * Handles form submission for creating new BookMate accounts
 */

'use server';

import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { createAccount, getAccountByEmail } from '@/lib/accounts';
import type { CreateAccountInput } from '@/lib/types/account';

/**
 * Form validation result
 */
interface ValidationResult {
  success: boolean;
  errors: {
    companyName?: string;
    userEmail?: string;
    sheetId?: string;
    scriptUrl?: string;
    scriptSecret?: string;
    general?: string;
  };
}

/**
 * Create account form data
 */
export interface CreateAccountFormData {
  companyName: string;
  userEmail: string;
  sheetId: string;
  scriptUrl: string;
  scriptSecret: string;
}

/**
 * Slugify a string for use as accountId
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Validate form data server-side
 */
async function validateFormData(
  data: CreateAccountFormData
): Promise<ValidationResult> {
  const errors: ValidationResult['errors'] = {};

  // Required fields
  if (!data.companyName?.trim()) {
    errors.companyName = 'Company name is required';
  }

  if (!data.userEmail?.trim()) {
    errors.userEmail = 'User email is required';
  } else {
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.userEmail)) {
      errors.userEmail = 'Please enter a valid email address';
    } else {
      // Check if email already has an account
      try {
        const existingAccount = await getAccountByEmail(data.userEmail);
        if (existingAccount) {
          errors.userEmail = 'This email already has an account';
        }
      } catch (error) {
        console.error('Error checking existing account:', error);
        errors.general = 'Error validating email';
      }
    }
  }

  if (!data.sheetId?.trim()) {
    errors.sheetId = 'Sheet ID is required';
  }

  if (!data.scriptUrl?.trim()) {
    errors.scriptUrl = 'Script URL is required';
  } else if (!data.scriptUrl.startsWith('https://script.google.com/macros/s/')) {
    errors.scriptUrl = 'Script URL must start with https://script.google.com/macros/s/';
  }

  if (!data.scriptSecret?.trim()) {
    errors.scriptSecret = 'Script secret is required';
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Server Action: Create new account
 * 
 * @param formData - Form data from the create account page
 * @returns Validation errors or redirects on success
 */
export async function createAccountAction(
  prevState: ValidationResult | null,
  formData: FormData
): Promise<ValidationResult> {
  try {
    // Verify admin access
    const adminUid = await requireAdmin();

    // Extract form data
    const data: CreateAccountFormData = {
      companyName: formData.get('companyName') as string,
      userEmail: formData.get('userEmail') as string,
      sheetId: formData.get('sheetId') as string,
      scriptUrl: formData.get('scriptUrl') as string,
      scriptSecret: formData.get('scriptSecret') as string,
    };

    // Validate form data
    const validation = await validateFormData(data);
    if (!validation.success) {
      return validation;
    }

    // Generate accountId from company name
    const accountId = slugify(data.companyName);

    // Create the account
    const accountInput: CreateAccountInput = {
      accountId,
      companyName: data.companyName.trim(),
      userEmail: data.userEmail.trim().toLowerCase(),
      sheetId: data.sheetId.trim(),
      scriptUrl: data.scriptUrl.trim(),
      scriptSecret: data.scriptSecret.trim(),
      createdBy: adminUid,
      status: 'active',
    };

    await createAccount(accountInput);

    // Success! Redirect to accounts list
    redirect('/admin/accounts');
  } catch (error: any) {
    // Handle redirect (thrown by Next.js redirect()) - this is NOT an error!
    if (error.message === 'NEXT_REDIRECT' || error.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }

    // Now log actual errors only
    console.error('Error creating account:', error);

    // Handle specific errors
    if (error.message?.includes('already exists')) {
      return {
        success: false,
        errors: {
          general: error.message,
        },
      };
    }

    // Generic error
    return {
      success: false,
      errors: {
        general: 'Failed to create account. Please try again.',
      },
    };
  }
}
