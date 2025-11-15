/**
 * Admin Page: Create New Account
 * 
 * Form for manually creating new BookMate accounts with their
 * Google Sheets and Apps Script configurations
 */

import { redirect } from 'next/navigation';
import { checkAdminAccess } from '@/lib/auth/admin';
import CreateAccountForm from './CreateAccountForm';
import { Shield, AlertCircle } from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering (uses cookies for auth)
export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Create New Account | BookMate Admin',
  description: 'Create a new BookMate account with spreadsheet configuration',
};

export default async function NewAccountPage() {
  // Check admin access
  const { isAdmin } = await checkAdminAccess();

  if (!isAdmin) {
    // Redirect non-admin users
    redirect('/login?error=unauthorized');
  }

  return (
    <div className="min-h-screen bg-black py-12 px-4 sm:px-6 lg:px-8">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-yellow/5 to-transparent pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-yellow/5 rounded-full blur-3xl pointer-events-none" />
      
      <div className="max-w-2xl mx-auto relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-yellow/10 rounded-xl2 mb-4">
            <Shield className="w-8 h-8 text-yellow" />
          </div>
          <h1 className="text-4xl font-bebasNeue uppercase text-text-primary tracking-wide mb-2">
            Create New Account
          </h1>
          <p className="text-text-secondary font-aileron">
            Configure a new BookMate account with spreadsheet integration
          </p>
        </div>

        {/* Important Notice */}
        <div className="mb-6 bg-yellow/10 border border-yellow/20 rounded-xl2 p-4">
          <div className="flex gap-3">
            <div className="shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5 text-yellow" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow font-aileron mb-2">
                Before you continue
              </h3>
              <div className="text-sm text-text-secondary font-aileron space-y-1">
                <p className="mb-2">Make sure you&apos;ve already:</p>
                <ul className="space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-yellow mt-1">•</span>
                    <span>Created the Google Sheet from the Master Template</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow mt-1">•</span>
                    <span>Created and deployed the bound Apps Script</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow mt-1">•</span>
                    <span>Generated a unique secret for the Apps Script</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow mt-1">•</span>
                    <span>Tested that the WebApp URL is accessible</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-bg-card border border-border-card rounded-xl2 shadow-glow">
          <div className="px-6 py-8">
            <CreateAccountForm />
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            href="/admin/accounts"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-yellow transition-colors font-aileron"
          >
            <span>←</span>
            <span>Back to Accounts List</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
