/**
 * Validates and sanitizes receipt data payload for Google Sheets
 * Expanded schema to match BookMate P&L 2025 spreadsheet
 * Trims whitespace and converts numeric fields to numbers
 * 
 * ⚠️ CRITICAL: This function now fetches live data from /api/options
 * Do NOT use static config files (options.json, live-dropdowns.json)
 */

import { NextRequest } from 'next/server';

export interface ReceiptPayload {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  ref: string;
  debit: string | number;
  credit: string | number;
}

export interface ValidatedPayload {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  ref: string;
  debit: number;
  credit: number;
}

export interface ValidationResult {
  isValid: boolean;
  data?: ValidatedPayload;
  error?: string;
}

/**
 * Validates and sanitizes receipt payload
 * @param payload - Raw receipt data from form
 * @param request - Optional NextRequest for authentication context
 * @returns Validation result with sanitized data or error message
 * 
 * ⚠️ ASYNC: Now fetches live dropdown options from /api/options
 */
export async function validatePayload(payload: ReceiptPayload, request?: NextRequest): Promise<ValidationResult> {
  // Check for required fields
  // For TRANSFERS: day, month, year, typeOfOperation, typeOfPayment, detail, ref are required; property is OPTIONAL
  // For REVENUE/EXPENSES: day, month, year, property, typeOfOperation, typeOfPayment, detail are required; ref is optional
  const isTransfer = payload.typeOfOperation?.trim() === 'Transfer';
  
  if (!payload.day || !payload.month || !payload.year ||
      !payload.typeOfOperation || !payload.typeOfPayment || !payload.detail) {
    return {
      isValid: false,
      error: 'Missing required fields: day, month, year, typeOfOperation, typeOfPayment, and detail are all required',
    };
  }

  // Property validation: REQUIRED for revenue/expenses, OPTIONAL for transfers
  if (!isTransfer && !payload.property) {
    return {
      isValid: false,
      error: 'Property is required for revenue and expense entries',
    };
  }

  // Ref validation: REQUIRED for transfers, optional for revenue/expenses
  if (isTransfer && !payload.ref?.trim()) {
    return {
      isValid: false,
      error: 'Ref is required for transfer entries. Both transfer rows must share the same ref value.',
    };
  }

  // Trim whitespace from string fields
  const day = String(payload.day).trim();
  const month = String(payload.month).trim();
  const year = String(payload.year).trim();
  const property = String(payload.property).trim();
  const typeOfOperation = String(payload.typeOfOperation).trim();
  const typeOfPayment = String(payload.typeOfPayment).trim();
  const detail = String(payload.detail).trim();
  const ref = String(payload.ref || '').trim(); // Optional field

  // Validate required fields are not empty after trimming
  if (!day) {
    return {
      isValid: false,
      error: 'Day cannot be empty',
    };
  }

  if (!month) {
    return {
      isValid: false,
      error: 'Month cannot be empty',
    };
  }

  if (!year) {
    return {
      isValid: false,
      error: 'Year cannot be empty',
    };
  }

  // Property can be empty for transfers, but not for revenue/expenses (already validated above)
  if (!isTransfer && !property) {
    return {
      isValid: false,
      error: 'Property cannot be empty for revenue and expense entries',
    };
  }

  if (!typeOfOperation) {
    return {
      isValid: false,
      error: 'Type of Operation cannot be empty',
    };
  }

  // Check for "Uncategorized" and prevent submission
  if (typeOfOperation === 'Uncategorized') {
    return {
      isValid: false,
      error: 'Please select a valid category from the dropdown. "Uncategorized" entries cannot be sent to the sheet.',
    };
  }

  // Fetch live dropdown options from /api/options
  let validProperties: string[] = [];
  let validOperations: string[] = [];
  let validPayments: string[] = [];

  try {
    // Server-side: use direct import from route handler instead of HTTP fetch
    // This avoids port/URL issues and is faster
    const { GET } = await import('../app/api/options/route');
    
    // Create request with authentication headers if provided
    const optionsRequest = request 
      ? new NextRequest('http://localhost/api/options', {
          headers: request.headers
        })
      : new NextRequest('http://localhost/api/options');
    
    const response = await GET(optionsRequest);

    if (!response.ok) {
      console.error('[VALIDATION] Failed to fetch /api/options:', response.status);
      return {
        isValid: false,
        error: 'Unable to validate dropdown values. Please try again.',
      };
    }

    const data = await response.json();
    
    // Extract validation arrays from API response (dual format)
    // Plain arrays are in data.data for backward compatibility
    validProperties = data.data?.properties || [];
    validOperations = data.data?.typeOfOperation || [];
    validPayments = data.data?.typeOfPayment || [];

    console.log('[VALIDATION] Fetched live options:', {
      properties: validProperties.length,
      operations: validOperations.length,
      payments: validPayments.length,
    });

  } catch (error) {
    console.error('[VALIDATION] Error fetching /api/options:', error);
    return {
      isValid: false,
      error: 'Unable to validate dropdown values. Please check your connection and try again.',
    };
  }

  // Check if property is valid (skip for transfers where property can be empty)
  if (!isTransfer && property && !validProperties.includes(property)) {
    return {
      isValid: false,
      error: `Invalid property "${property}". Please select from: ${validProperties.join(', ')}`,
    };
  }

  // Check if typeOfOperation is valid
  if (!validOperations.includes(typeOfOperation)) {
    return {
      isValid: false,
      error: `Invalid operation type "${typeOfOperation}". Please select a valid category from the dropdown.`,
    };
  }

  // Check if typeOfPayment is valid
  if (!validPayments.includes(typeOfPayment)) {
    return {
      isValid: false,
      error: `Invalid payment type "${typeOfPayment}". Please select from: ${validPayments.join(', ')}`,
    };
  }

  if (!typeOfPayment) {
    return {
      isValid: false,
      error: 'Type of Payment cannot be empty',
    };
  }

  if (!detail) {
    return {
      isValid: false,
      error: 'Detail cannot be empty',
    };
  }

  // Convert debit and credit to numbers and validate
  const debit = Number(payload.debit || 0);
  const credit = Number(payload.credit || 0);

  if (isNaN(debit)) {
    return {
      isValid: false,
      error: 'Debit must be a valid number',
    };
  }

  if (isNaN(credit)) {
    return {
      isValid: false,
      error: 'Credit must be a valid number',
    };
  }

  if (debit < 0) {
    return {
      isValid: false,
      error: 'Debit cannot be negative',
    };
  }

  if (credit < 0) {
    return {
      isValid: false,
      error: 'Credit cannot be negative',
    };
  }

  // ========================================
  // TRANSFER-SPECIFIC VALIDATION RULES
  // ========================================
  if (isTransfer) {
    // Rule 1: Detail must contain "Transfer to" or "Transfer from"
    const detailLower = detail.toLowerCase();
    if (!detailLower.includes('transfer to') && !detailLower.includes('transfer from')) {
      return {
        isValid: false,
        error: 'Transfer entries must have detail containing "Transfer to" or "Transfer from"',
      };
    }

    // Rule 2: Exactly ONE of debit/credit must be non-zero (not both, not neither)
    const hasDebit = debit > 0;
    const hasCredit = credit > 0;
    
    if (hasDebit && hasCredit) {
      return {
        isValid: false,
        error: 'Transfer entries must have either debit OR credit, not both',
      };
    }
    
    if (!hasDebit && !hasCredit) {
      return {
        isValid: false,
        error: 'Transfer entries must have either a debit or credit value (cannot be zero)',
      };
    }

    // Rule 3: Ref is required and must not be empty (already validated above)
    // This ensures matching transfer pairs can be identified
  }

  // Return validated and sanitized data
  return {
    isValid: true,
    data: {
      day,
      month,
      year,
      property, // Can be empty string for transfers
      typeOfOperation,
      typeOfPayment,
      detail,
      ref,
      debit,
      credit,
    },
  };
}

