'use client';

/**
 * Account Test Page
 * 
 * Simple page to test and demonstrate the account context
 * Shows account configuration and how to use useAccount hook
 */

import { useAccount } from '@/lib/context/AccountContext';
import AccountInfo from '@/components/dashboard/AccountInfo';

export default function AccountTestPage() {
  const { account, loading, error, refetch } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Account Configuration Test
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            This page demonstrates the account context and shows your account configuration.
          </p>
        </div>

        {/* Account Info Component */}
        <div className="mb-6">
          <AccountInfo />
        </div>

        {/* Quick Access Section */}
        {account && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Quick Access to Account Data
            </h2>
            <div className="space-y-2 text-sm">
              <p className="text-blue-800 dark:text-blue-200">
                <strong>Company:</strong> {account.companyName}
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                <strong>Sheet ID:</strong>{' '}
                <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-mono text-xs">
                  {account.sheetId}
                </code>
              </p>
              <p className="text-blue-800 dark:text-blue-200">
                <strong>Script URL:</strong>{' '}
                <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded font-mono text-xs break-all">
                  {account.scriptUrl}
                </code>
              </p>
            </div>
          </div>
        )}

        {/* Developer Usage Examples */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Usage Example
          </h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Basic Hook Usage:
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 overflow-x-auto text-xs">
{`import { useAccount } from '@/lib/context/AccountContext';

function MyComponent() {
  const { account, loading, error } = useAccount();
  
  if (loading) return <Spinner />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <h1>{account?.companyName}</h1>
      <p>Sheet ID: {account?.sheetId}</p>
    </div>
  );
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Using in API Calls:
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 overflow-x-auto text-xs">
{`import { useAccount } from '@/lib/context/AccountContext';

function Dashboard() {
  const { account } = useAccount();
  
  // Use account config in API calls
  const fetchData = async () => {
    const response = await fetch(account.scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: account.scriptSecret,
        sheetId: account.sheetId,
        action: 'getData'
      })
    });
    
    return response.json();
  };
  
  // ...
}`}
              </pre>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Higher-Order Component Pattern:
              </h3>
              <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 overflow-x-auto text-xs">
{`import { withAccount } from '@/lib/context/AccountContext';

function MyDashboard({ account }) {
  // account is automatically passed as prop
  // loading/error states handled automatically
  
  return <div>{account.companyName}</div>;
}

export default withAccount(MyDashboard);`}
              </pre>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-6 text-center">
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Refreshing...
              </>
            ) : (
              <>
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                    clipRule="evenodd"
                  />
                </svg>
                Refresh Account
              </>
            )}
          </button>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <a
            href="/dashboard"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
