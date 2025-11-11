import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v9/transactions
 * Create a new transaction in the V9 balance system
 * 
 * Supports three transaction types:
 * 1. transfer: Move money between accounts (fromAccount → toAccount)
 * 2. income: Money coming in (→ toAccount)
 * 3. expense: Money going out (fromAccount →)
 * 
 * Request body:
 * {
 *   fromAccount?: string,
 *   toAccount?: string,
 *   transactionType: 'transfer' | 'income' | 'expense',
 *   amount: number,
 *   currency?: string,
 *   note?: string,
 *   referenceID?: string,
 *   user?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fromAccount,
      toAccount,
      transactionType = 'transfer',
      amount,
      currency = 'THB',
      note = '',
      referenceID = '',
      user = 'webapp'
    } = body;

    console.log('💸 Creating V9 transaction:', {
      type: transactionType,
      from: fromAccount,
      to: toAccount,
      amount,
      currency
    });

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Must be a positive number.' },
        { status: 400 }
      );
    }

    if (transactionType === 'transfer' && (!fromAccount || !toAccount)) {
      return NextResponse.json(
        { error: 'Transfer requires both fromAccount and toAccount' },
        { status: 400 }
      );
    }

    if (transactionType === 'income' && !toAccount) {
      return NextResponse.json(
        { error: 'Income requires toAccount' },
        { status: 400 }
      );
    }

    if (transactionType === 'expense' && !fromAccount) {
      return NextResponse.json(
        { error: 'Expense requires fromAccount' },
        { status: 400 }
      );
    }

    // Get Google Sheets webhook URL (Balance Sheet deployment)
    const webhookUrl = process.env.SHEETS_BALANCE_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('SHEETS_BALANCE_URL not configured');
      return NextResponse.json(
        { error: 'V9 Transactions service not configured' },
        { status: 500 }
      );
    }

    // Prepare payload
    const payload = {
      action: 'transactionAppend',
      secret,
      fromAccount,
      toAccount,
      transactionType,
      amount,
      currency,
      note,
      referenceID,
      user
    };

    console.log('📤 Sending transaction to Google Sheets...');

    // Send to Google Sheets
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
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
      const errorText = await response.text();
      console.error('Sheets webhook error:', errorText);
      return NextResponse.json(
        { error: 'Failed to create transaction in Google Sheets' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      console.error('❌ Transaction failed:', data.error);
      return NextResponse.json(
        { error: data.error || 'Failed to create transaction' },
        { status: 500 }
      );
    }

    console.log('✅ Transaction created successfully');

    return NextResponse.json({
      ok: true,
      message: 'Transaction created successfully',
      transaction: {
        timestamp: data.timestamp,
        fromAccount,
        toAccount,
        transactionType,
        amount,
        currency,
        note,
        referenceID,
        user
      }
    });

  } catch (error) {
    console.error('V9 Transaction error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create transaction',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v9/transactions
 * Get transactions for an account or all transactions
 * 
 * Query params:
 * - accountName: Filter by account
 * - limit: Max number of transactions (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountName = searchParams.get('accountName') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('📋 Fetching V9 transactions...', { accountName, limit });

    // Get Google Sheets webhook URL (Balance Sheet deployment)
    const webhookUrl = process.env.SHEETS_BALANCE_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!webhookUrl || !secret) {
      console.error('SHEETS_BALANCE_URL not configured');
      return NextResponse.json(
        { error: 'SHEETS_BALANCE_URL not configured' },
        { status: 500 }
      );
    }

    // Fetch from Google Sheets
    let response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'getTransactions',
        secret,
        accountName,
        limit
      }),
      redirect: 'manual'
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
      const errorText = await response.text();
      console.error('Sheets webhook error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch transactions from Google Sheets' },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: data.error || 'Failed to fetch transactions' },
        { status: 500 }
      );
    }

    console.log('✅ Fetched', data.transactions?.length || 0, 'transactions');

    return NextResponse.json({
      ok: true,
      transactions: data.transactions || [],
      count: data.count || 0
    });

  } catch (error) {
    console.error('V9 Get transactions error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      },
      { status: 500 }
    );
  }
}
