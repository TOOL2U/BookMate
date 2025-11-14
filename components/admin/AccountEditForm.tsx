/**
 * Account Edit Form Component
 * 
 * Form for editing existing BookMate accounts
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountConfigSerialized } from '@/lib/types/account';
import AppsScriptTemplateCard from './AppsScriptTemplateCard';
import ConnectionTest from './ConnectionTest';
import { updateAccountAction } from '@/lib/accounts/actions';

interface AccountEditFormProps {
  account: AccountConfigSerialized;
}

export function AccountEditForm({ account }: AccountEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [companyName, setCompanyName] = useState(account.companyName);
  const [userEmail, setUserEmail] = useState(account.userEmail);
  const [sheetId, setSheetId] = useState(account.sheetId);
  const [scriptUrl, setScriptUrl] = useState(account.scriptUrl || '');
  const [scriptSecret, setScriptSecret] = useState(account.scriptSecret);

  // Track if values changed
  const hasChanges = 
    companyName !== account.companyName ||
    userEmail !== account.userEmail ||
    sheetId !== account.sheetId ||
    scriptUrl !== (account.scriptUrl || '') ||
    scriptSecret !== account.scriptSecret;

  const scriptSecretChanged = scriptSecret !== account.scriptSecret;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      setError('No changes detected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('accountId', account.accountId);
      formData.append('companyName', companyName);
      formData.append('userEmail', userEmail);
      formData.append('sheetId', sheetId);
      formData.append('scriptUrl', scriptUrl);
      formData.append('scriptSecret', scriptSecret);

      const result = await updateAccountAction(formData);

      if (result.success) {
        setSuccess(true);
        // Refresh the page to show updated data
        router.refresh();
      } else {
        setError(result.error || 'Update failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Update error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Read-only Info */}
      <div className="bg-card border border-border rounded-xl2 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 font-bebasNeue">ACCOUNT INFORMATION</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-secondary font-aileron">Account ID</label>
            <div className="mt-1 text-sm text-white font-mono">{account.accountId}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-secondary font-aileron">Created</label>
            <div className="mt-1 text-sm text-white font-aileron">
              {new Date(account.createdAt).toLocaleString()}
            </div>
          </div>
          {account.createdBy && (
            <div>
              <label className="block text-sm font-medium text-secondary font-aileron">Created By</label>
              <div className="mt-1 text-sm text-white font-aileron">{account.createdBy}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-secondary font-aileron">Status</label>
            <div className="mt-1">
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
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={handleSubmit} className="bg-card border border-border shadow-soft rounded-xl2 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 font-bebasNeue">EDIT ACCOUNT</h2>
        
        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-xl2">
            <p className="text-sm text-error font-aileron">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-4 bg-success/10 border border-success/30 rounded-xl2">
            <p className="text-sm text-success font-aileron">Account updated successfully!</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Company Name */}
          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-secondary font-aileron">
              Company Name *
            </label>
            <input
              type="text"
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl2 bg-black border-border text-white shadow-sm focus:border-yellow focus:ring-yellow font-aileron"
            />
          </div>

          {/* User Email */}
          <div>
            <label htmlFor="userEmail" className="block text-sm font-medium text-secondary font-aileron">
              User Email *
            </label>
            <input
              type="email"
              id="userEmail"
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl2 bg-black border-border text-white shadow-sm focus:border-yellow focus:ring-yellow font-aileron"
            />
            <p className="mt-1 text-xs text-secondary font-aileron">
              Primary user who will access this account
            </p>
          </div>

          {/* Sheet ID */}
          <div>
            <label htmlFor="sheetId" className="block text-sm font-medium text-secondary font-aileron">
              Google Sheet ID *
            </label>
            <input
              type="text"
              id="sheetId"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              required
              className="mt-1 block w-full font-mono text-sm rounded-xl2 bg-black border-border text-white shadow-sm focus:border-yellow focus:ring-yellow"
            />
            <p className="mt-1 text-xs text-secondary font-aileron">
              From the Google Sheet URL
            </p>
          </div>

          {/* Script URL */}
          <div>
            <label htmlFor="scriptUrl" className="block text-sm font-medium text-secondary font-aileron">
              Apps Script URL
            </label>
            <input
              type="url"
              id="scriptUrl"
              value={scriptUrl}
              onChange={(e) => setScriptUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="mt-1 block w-full font-mono text-sm rounded-xl2 bg-black border-border text-white placeholder-secondary/50 shadow-sm focus:border-yellow focus:ring-yellow"
            />
            <p className="mt-1 text-xs text-secondary font-aileron">
              The deployed web app URL from Google Apps Script
            </p>
          </div>

          {/* Script Secret */}
          <div>
            <label htmlFor="scriptSecret" className="block text-sm font-medium text-secondary font-aileron">
              Apps Script Secret *
            </label>
            <input
              type="text"
              id="scriptSecret"
              value={scriptSecret}
              onChange={(e) => setScriptSecret(e.target.value)}
              required
              minLength={10}
              className="mt-1 block w-full font-mono text-sm rounded-xl2 bg-black border-border text-white shadow-sm focus:border-yellow focus:ring-yellow"
            />
            <p className="mt-1 text-xs text-secondary font-aileron">
              Minimum 10 characters. Used to authenticate requests to Apps Script.
            </p>
            {scriptSecretChanged && (
              <div className="mt-2 p-3 bg-warning/10 border border-warning/30 rounded-xl2">
                <p className="text-xs text-warning font-aileron">
                  ⚠️ <strong>Script Secret Changed!</strong> You must update the Apps Script code
                  with the new secret. Use the template generator below.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push('/admin/accounts')}
            className="px-4 py-2 text-sm font-medium text-secondary bg-surface-2 border border-border rounded-xl2 hover:bg-surface-3 font-bebasNeue"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="px-6 py-2 text-sm font-medium text-black bg-yellow rounded-xl2 hover:bg-yellow/90 hover:shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bebasNeue"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Connection Test */}
      <div className="mt-6">
        <ConnectionTest
          accountId={account.accountId}
          lastTestAt={account.lastConnectionTestAt}
          lastTestStatus={account.lastConnectionTestStatus}
          lastTestMessage={account.lastConnectionTestMessage}
        />
      </div>

      {/* Apps Script Template Generator */}
      {scriptSecret.length >= 10 && (
        <div className="mt-6">
          <AppsScriptTemplateCard
            scriptSecret={scriptSecret}
            sheetId={sheetId}
            companyName={companyName}
          />
          {scriptSecretChanged && (
            <div className="mt-4 p-4 bg-yellow/10 border border-yellow/30 rounded-xl2">
              <h3 className="text-sm font-semibold text-yellow font-bebasNeue">
                📋 NEXT STEPS AFTER CHANGING SECRET:
              </h3>
              <ol className="mt-2 text-sm text-yellow font-aileron list-decimal list-inside space-y-1">
                <li>Copy the generated script above</li>
                <li>Open your Google Apps Script project</li>
                <li>Replace the entire Code.gs file with the new script</li>
                <li>Deploy as web app (new deployment)</li>
                <li>Update the Script URL field above with the new deployment URL</li>
                <li>Test the connection</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
