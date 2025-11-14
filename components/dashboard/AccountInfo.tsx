'use client';

/**
 * Account Info Component
 * 
 * Example component showing how to use the useAccount hook
 * Displays current account configuration details
 */

import { useAccount } from '@/lib/context/AccountContext';

export default function AccountInfo() {
  const { account, loading, error } = useAccount();

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-sm text-red-800 dark:text-red-200">
          Error: {error}
        </p>
      </div>
    );
  }

  if (!account) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Account Configuration
      </h3>
      
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Company Name
          </dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-semibold">
            {account.companyName}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Account ID
          </dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
            {account.accountId}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            User Email
          </dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
            {account.userEmail}
          </dd>
        </div>

        <div>
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Status
          </dt>
          <dd className="mt-1">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                account.status === 'active'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                  : account.status === 'suspended'
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
              }`}
            >
              {account.status || 'active'}
            </span>
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Google Sheets ID
          </dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono truncate">
            {account.sheetId}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Apps Script URL
          </dt>
          <dd className="mt-1 text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
            {account.scriptUrl}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Created
          </dt>
          <dd className="mt-1 text-sm text-gray-900 dark:text-white">
            {new Date(account.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </dd>
        </div>
      </dl>

      {/* Developer Info (can be removed in production) */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            Developer Info (Full Account Object)
          </summary>
          <pre className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs overflow-x-auto">
            {JSON.stringify(account, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}
