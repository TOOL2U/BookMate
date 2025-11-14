/**
 * Connection Test Component
 * 
 * Tests the Apps Script connection for an account
 */

'use client';

import { useState } from 'react';
import { testConnectionAction } from '@/lib/accounts/actions';

interface ConnectionTestProps {
  accountId: string;
  lastTestAt?: string;
  lastTestStatus?: 'success' | 'error';
  lastTestMessage?: string;
}

export default function ConnectionTest({
  accountId,
  lastTestAt,
  lastTestStatus,
  lastTestMessage,
}: ConnectionTestProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await testConnectionAction(accountId);

      if (response.ok) {
        setResult({
          ok: true,
          message: 'Connection successful! Apps Script accepted the test transaction.',
          timestamp: response.timestamp,
        });
      } else {
        setResult({
          ok: false,
          message: response.errorMessage || 'Connection failed',
          timestamp: response.timestamp,
        });
      }
    } catch (error) {
      setResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Unexpected error occurred',
        timestamp: new Date().toISOString(),
      });
    } finally {
      setTesting(false);
    }
  };

  const formatTimestamp = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card border border-border rounded-xl2 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white font-bebasNeue">CONNECTION TEST</h3>
          <p className="text-sm text-secondary mt-1 font-aileron">
            Verify the Apps Script endpoint is reachable and configured correctly
          </p>
        </div>
        <button
          onClick={handleTest}
          disabled={testing}
          className="px-6 py-2 bg-yellow text-black rounded-xl2 hover:bg-yellow/90 hover:shadow-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed font-medium font-bebasNeue transition-all"
        >
          {testing ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Testing...
            </span>
          ) : (
            'Test Connection'
          )}
        </button>
      </div>

      {/* Current test result */}
      {result && (
        <div
          className={`mb-4 p-4 rounded-xl2 border ${
            result.ok
              ? 'bg-success/10 border-success/30'
              : 'bg-error/10 border-error/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {result.ok ? (
                <svg
                  className="h-5 w-5 text-success"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-error"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4
                className={`text-sm font-semibold font-bebasNeue ${
                  result.ok ? 'text-success' : 'text-error'
                }`}
              >
                {result.ok ? 'CONNECTION SUCCESSFUL' : 'CONNECTION FAILED'}
              </h4>
              <p
                className={`text-sm mt-1 font-aileron ${
                  result.ok ? 'text-success' : 'text-error'
                }`}
              >
                {result.message}
              </p>
              <p className="text-xs text-secondary mt-2 font-aileron">
                Tested at {formatTimestamp(result.timestamp)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Last test result (from database) */}
      {!result && lastTestAt && (
        <div
          className={`p-4 rounded-xl2 border ${
            lastTestStatus === 'success'
              ? 'bg-surface-2 border-border'
              : 'bg-warning/10 border-warning/30'
          }`}
        >
          <div className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
              {lastTestStatus === 'success' ? (
                <svg
                  className="h-5 w-5 text-success"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 text-warning"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h4
                className={`text-sm font-semibold font-bebasNeue ${
                  lastTestStatus === 'success' ? 'text-white' : 'text-warning'
                }`}
              >
                LAST TEST: {lastTestStatus === 'success' ? 'SUCCESS' : 'FAILED'}
              </h4>
              <p
                className={`text-sm mt-1 font-aileron ${
                  lastTestStatus === 'success' ? 'text-primary' : 'text-warning'
                }`}
              >
                {lastTestMessage}
              </p>
              <p className="text-xs text-secondary mt-2 font-aileron">
                {formatTimestamp(lastTestAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No test results */}
      {!result && !lastTestAt && (
        <div className="p-4 bg-surface-2 border border-border rounded-xl2">
          <p className="text-sm text-secondary font-aileron">
            No connection tests have been run yet. Click &quot;Test Connection&quot; to verify the Apps Script is deployed correctly.
          </p>
        </div>
      )}

      {/* Test details */}
      <div className="mt-4 pt-4 border-t border-border">
        <h4 className="text-sm font-semibold text-white mb-2 font-bebasNeue">WHAT THIS TEST DOES:</h4>
        <ul className="text-sm text-secondary space-y-1 list-disc list-inside font-aileron">
          <li>Sends a test transaction to the Apps Script endpoint</li>
          <li>Verifies the script URL is reachable</li>
          <li>Confirms the script secret is correct</li>
          <li>Checks that the Apps Script is properly deployed</li>
        </ul>
      </div>
    </div>
  );
}
