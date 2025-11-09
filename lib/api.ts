// Centralized API functions with proper error handling and typing

export interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

export interface PnLData {
  month: PnLPeriodData;
  year: PnLPeriodData;
  updatedAt?: string;
}

export interface Balance {
  accountName: string;
  openingBalance: number;
  netChange: number;
  currentBalance: number;
  lastTxnAt: string;
  inflow: number;
  outflow: number;
  note?: string;
}

export interface BalanceResponse {
  ok: boolean;
  source: string;
  month: string;
  items: Balance[];
  totals: {
    netChange: number;
    currentBalance: number;
    inflow: number;
    outflow: number;
  };
  durationMs: number;
  cached: boolean;
  cacheAge?: number;
}

export interface BalanceSummary {
  total: number;
  cash: number;
  bank: number;
  balances: Balance[];
}

export interface OverheadCategory {
  name: string;
  expense: number;
  percentage: number;
}

export interface PropertyCategory {
  name: string;
  expense: number;
  percentage: number;
}

export interface Transaction {
  id: string;
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  debit: number;
  credit: number;
}

export interface OptionsData {
  properties: string[];
  typeOfOperations: string[];
  typeOfPayments: string[];
  overheadExpenseCategories: string[];
  propertyExpenseCategories: string[];
}

// API Base URL
const API_BASE = '/api';

// Generic fetch wrapper with error handling
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Log API performance in development
    if (process.env.NODE_ENV === 'development') {
      const duration = performance.now() - startTime;
      console.log(`[API] ${endpoint} - ${duration.toFixed(0)}ms`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

// P&L API
export async function fetchPnLData(): Promise<PnLData> {
  const response = await fetchAPI<{ ok: boolean; data: PnLData }>('/pnl');
  return response.data;
}

// Balance API
export async function fetchBalances(): Promise<BalanceSummary> {
  const response = await fetchAPI<BalanceResponse>('/balance');
  
  // Transform API response to match component expectations
  const cashAccounts = response.items.filter(item => 
    item.accountName.toLowerCase().includes('cash') || 
    item.accountName.toLowerCase().includes('petty')
  );
  
  const bankAccounts = response.items.filter(item => 
    !item.accountName.toLowerCase().includes('cash') && 
    !item.accountName.toLowerCase().includes('petty')
  );
  
  const cashTotal = cashAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  const bankTotal = bankAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0);
  
  return {
    total: response.totals.currentBalance,
    cash: cashTotal,
    bank: bankTotal,
    balances: response.items,
  };
}

// Overhead Categories API
export async function fetchOverheadCategories(): Promise<OverheadCategory[]> {
  const response = await fetchAPI<{ ok: boolean; data: OverheadCategory[] }>('/pnl/overhead-expenses?period=month');
  return response.data;
}

// Property Categories API
export async function fetchPropertyCategories(): Promise<PropertyCategory[]> {
  const response = await fetchAPI<{ ok: boolean; data: PropertyCategory[] }>('/pnl/property-person?period=month');
  return response.data;
}

// Transactions API (Inbox)
export async function fetchTransactions(): Promise<Transaction[]> {
  const response = await fetchAPI<{ ok: boolean; data: Transaction[] }>('/inbox');
  return response.data || [];
}

// Options API (Settings)
export async function fetchOptions(): Promise<OptionsData> {
  return fetchAPI<OptionsData>('/options');
}

// Parallel fetch for dashboard - fetches all critical data at once
export async function fetchDashboardData() {
  const startTime = performance.now();
  
  const [pnl, balances, overheadCategories, propertyCategories, transactions] = await Promise.all([
    fetchPnLData(),
    fetchBalances(),
    fetchOverheadCategories(),
    fetchPropertyCategories(),
    fetchTransactions(),
  ]);

  if (process.env.NODE_ENV === 'development') {
    const duration = performance.now() - startTime;
    console.log(`[API] Dashboard parallel fetch completed in ${duration.toFixed(0)}ms`);
  }

  return {
    pnl,
    balances,
    overheadCategories,
    propertyCategories,
    transactions,
  };
}
