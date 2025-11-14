'use client';

/**
 * Account Context & Provider
 * 
 * Provides account configuration to all authenticated pages
 * Automatically loads account based on logged-in user's email
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AccountConfigSerialized } from '@/lib/types/account';

/**
 * Account context state
 */
interface AccountContextState {
  account: AccountConfigSerialized | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Create the context
 */
const AccountContext = createContext<AccountContextState | undefined>(undefined);

/**
 * Account Provider Props
 */
interface AccountProviderProps {
  children: React.ReactNode;
}

/**
 * Account Provider Component
 * 
 * Wraps authenticated parts of the app to provide account config
 * 
 * @example
 * <AccountProvider>
 *   <Dashboard />
 * </AccountProvider>
 */
export function AccountProvider({ children }: AccountProviderProps) {
  const [account, setAccount] = useState<AccountConfigSerialized | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch account configuration
   */
  const fetchAccount = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/account', {
        method: 'GET',
        credentials: 'include', // Include cookies for session
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error: No account found
        if (data.error === 'NO_ACCOUNT_FOUND') {
          setError('NO_ACCOUNT_FOUND');
          setAccount(null);
          return;
        }

        // Handle auth errors
        if (response.status === 401) {
          setError('NOT_AUTHENTICATED');
          setAccount(null);
          return;
        }

        // Generic error
        throw new Error(data.error || 'Failed to load account');
      }

      setAccount(data.account);
      setError(null);
    } catch (err: any) {
      console.error('Error loading account:', err);
      setError(err.message || 'Failed to load account configuration');
      setAccount(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load account on mount
   */
  useEffect(() => {
    fetchAccount();
  }, []);

  const value: AccountContextState = {
    account,
    loading,
    error,
    refetch: fetchAccount,
  };

  return (
    <AccountContext.Provider value={value}>
      {children}
    </AccountContext.Provider>
  );
}

/**
 * useAccount Hook
 * 
 * Access account configuration from any component
 * 
 * @returns Account context state
 * @throws Error if used outside AccountProvider
 * 
 * @example
 * function MyComponent() {
 *   const { account, loading, error } = useAccount();
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error} />;
 *   
 *   return <div>Company: {account?.companyName}</div>;
 * }
 */
export function useAccount(): AccountContextState {
  const context = useContext(AccountContext);

  if (context === undefined) {
    throw new Error('useAccount must be used within an AccountProvider');
  }

  return context;
}

/**
 * Higher-order component to require account
 * 
 * Wraps a component and handles loading/error states automatically
 * 
 * @example
 * export default withAccount(MyDashboard);
 */
export function withAccount<P extends object>(
  Component: React.ComponentType<P & { account: AccountConfigSerialized }>
) {
  return function WithAccountComponent(props: P) {
    const { account, loading, error } = useAccount();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4" />
            <p className="text-gray-600">Loading account...</p>
          </div>
        </div>
      );
    }

    if (error === 'NO_ACCOUNT_FOUND') {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                No Account Found
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                No BookMate account is linked to your email address.
                Please contact support to set up your account.
              </p>
              <div className="mt-6">
                <a
                  href="mailto:support@bookmate.com"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (error || !account) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                Error Loading Account
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {error || 'Failed to load your account configuration'}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return <Component {...props} account={account} />;
  };
}
