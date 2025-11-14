/**
 * Admin Page: Account Detail & Edit
 * 
 * View and edit individual BookMate account
 */

import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/auth/admin';
import { getAccountById, serializeAccountConfig } from '@/lib/accounts';
import { AccountEditForm } from '@/components/admin/AccountEditForm';

interface AccountDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const user = await checkAdminAccess();
  if (!user) {
    redirect('/login');
  }

  const { id: accountId } = await params;
  const account = await getAccountById(accountId);

  if (!account) {
    redirect('/admin/accounts');
  }

  const serializedAccount = serializeAccountConfig(account);

  return (
    <div className="min-h-screen bg-black py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white font-bebasNeue">ACCOUNT DETAILS</h1>
          <p className="mt-2 text-sm text-secondary font-aileron">
            View and edit account configuration
          </p>
        </div>

        <AccountEditForm account={serializedAccount} />
      </div>
    </div>
  );
}
