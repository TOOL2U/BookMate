/**
 * Admin Page: Accounts List
 * 
 * Lists all BookMate accounts with basic management
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { checkAdminAccess } from '@/lib/auth/admin';
import { getAllAccounts, serializeAccountConfig } from '@/lib/accounts';
import LogoutButton from '@/components/admin/LogoutButton';

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Accounts | BookMate Admin',
  description: 'Manage BookMate accounts',
};

export default async function AccountsPage() {
  // Check admin access
  const { isAdmin } = await checkAdminAccess();

  if (!isAdmin) {
    redirect('/login?error=unauthorized');
  }

  // Fetch all accounts
  const accounts = await getAllAccounts();
  const serializedAccounts = accounts.map(serializeAccountConfig);

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Top row with logout */}
          <div className="flex justify-end mb-4">
            <LogoutButton />
          </div>
          
          {/* Title and Create button row */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white font-bebasNeue">
                BOOKMATE ACCOUNTS
              </h1>
              <p className="mt-2 text-sm text-secondary font-aileron">
                Manage BookMate client accounts and their spreadsheet configurations
              </p>
            </div>
            <Link
              href="/admin/accounts/new"
              className="inline-flex items-center px-6 py-3 border-2 border-yellow rounded-xl2 shadow-sm text-sm font-medium text-black bg-yellow hover:bg-yellow/90 hover:shadow-glow-yellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow transition-all font-bebasNeue"
            >
              <svg
                className="-ml-1 mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Create New Account
            </Link>
          </div>
        </div>

        {/* Accounts Table */}
        {serializedAccounts.length === 0 ? (
          <div className="bg-card border border-border shadow-soft rounded-xl2 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-yellow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-white font-bebasNeue">NO ACCOUNTS</h3>
            <p className="mt-1 text-sm text-secondary font-aileron">
              Get started by creating a new account.
            </p>
            <div className="mt-6">
              <Link
                href="/admin/accounts/new"
                className="inline-flex items-center px-6 py-3 border-2 border-yellow shadow-sm text-sm font-medium rounded-xl2 text-black bg-yellow hover:bg-yellow/90 hover:shadow-glow-yellow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow transition-all font-bebasNeue"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                Create Account
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border shadow-soft overflow-hidden rounded-xl2">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-black">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-yellow uppercase tracking-wider font-bebasNeue"
                  >
                    Company
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-yellow uppercase tracking-wider font-bebasNeue"
                  >
                    User Email
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-yellow uppercase tracking-wider font-bebasNeue"
                  >
                    Sheet ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-yellow uppercase tracking-wider font-bebasNeue"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-yellow uppercase tracking-wider font-bebasNeue"
                  >
                    Created
                  </th>
                  <th
                    scope="col"
                    className="relative px-6 py-3"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {serializedAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-surface-2 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white font-bebasNeue">
                        {account.companyName}
                      </div>
                      <div className="text-sm text-secondary font-aileron">
                        {account.accountId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-primary font-aileron">
                        {account.userEmail}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-secondary font-mono truncate max-w-xs">
                        {account.sheetId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full font-aileron ${
                          account.status === 'active'
                            ? 'bg-success/20 text-success border border-success/30'
                            : account.status === 'suspended'
                            ? 'bg-warning/20 text-warning border border-warning/30'
                            : 'bg-surface-2 text-secondary border border-border'
                        }`}
                      >
                        {account.status || 'active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary font-aileron">
                      {new Date(account.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/accounts/${account.accountId}`}
                        className="text-yellow hover:text-yellow/80 font-medium font-bebasNeue"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Stats */}
        {serializedAccounts.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-card border border-border overflow-hidden shadow-soft rounded-xl2">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-secondary truncate font-aileron">
                  Total Accounts
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-yellow font-bebasNeue">
                  {serializedAccounts.length}
                </dd>
              </div>
            </div>
            <div className="bg-card border border-border overflow-hidden shadow-soft rounded-xl2">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-secondary truncate font-aileron">
                  Active Accounts
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-success font-bebasNeue">
                  {serializedAccounts.filter((a) => a.status === 'active').length}
                </dd>
              </div>
            </div>
            <div className="bg-card border border-border overflow-hidden shadow-soft rounded-xl2">
              <div className="px-4 py-5 sm:p-6">
                <dt className="text-sm font-medium text-secondary truncate font-aileron">
                  Suspended
                </dt>
                <dd className="mt-1 text-3xl font-semibold text-error font-bebasNeue">
                  {serializedAccounts.filter((a) => a.status === 'suspended').length}
                </dd>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
