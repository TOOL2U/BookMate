'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AdminShell from '@/components/layout/AdminShell';
import LogoBM from '@/components/LogoBM';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { usePageLoading } from '@/hooks/usePageLoading';
import ExpenseCategoryManager from '@/components/settings/ExpenseCategoryManager';
import PropertyManager from '@/components/settings/PropertyManager';
import PaymentTypeManager from '@/components/settings/PaymentTypeManager';
import RevenueManager from '@/components/settings/RevenueManager';
import { RefreshCw, Cloud, CheckCircle, AlertCircle, Loader2, ChevronDown, TrendingUp, BriefcaseBusiness, Building2, CreditCard } from 'lucide-react';
import { useOptions } from '@/hooks/useQueries';
import { queryKeys } from '@/hooks/useQueries';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { startPerformanceTimer } from '@/lib/performance';

interface SyncStatus {
  lastSynced: string | null;
  lastModified: string | null;
  needsSync: boolean;
  source: string;
}

export default function SettingsPage() {
  // Start performance tracking
  const endTimer = startPerformanceTimer('Settings Page');

  // Coordinate page loading with data fetching
  const { isLoading: showPageLoading, setDataReady } = usePageLoading({
    minLoadingTime: 800
  });

  // Use React Query for data fetching
  const queryClient = useQueryClient();
  const { data: optionsData, isLoading, error, refetch } = useOptions();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Accordion state for each section
  const [expandedSections, setExpandedSections] = useState<{
    revenue: boolean;
    expenses: boolean;
    properties: boolean;
    payments: boolean;
  }>({
    revenue: false,
    expenses: false,
    properties: false,
    payments: false
  });

  // Update lastUpdated when data changes
  useEffect(() => {
    if (optionsData) {
      setLastUpdated(new Date().toLocaleString());
      endTimer();
      setDataReady(true);
    }
  }, [optionsData, endTimer, setDataReady]);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.options() });
  };

  const fetchSyncStatus = async () => {
    try {
      const res = await fetch('/api/categories/sync');
      const result = await res.json();
      if (result.ok) {
        setSyncStatus(result.data);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
    }
  };

  const handleUpdate = async (
    type: string,
    action: 'add' | 'edit' | 'delete',
    oldValue?: string,
    newValue?: string,
    index?: number
  ) => {
    try {
      setIsUpdating(true);

      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, oldValue, newValue, index }),
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to update category');
      }

      // Invalidate options query to refetch latest data
      queryClient.invalidateQueries({ queryKey: queryKeys.options() });

      showToast(result.message, 'success');
      await fetchSyncStatus();
    } catch (error) {
      console.error('Error updating category:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update category', 'error');
      throw error;
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSyncToSheets = async () => {
    try {
      setIsSyncing(true);
      showToast('Syncing to Google Sheets...', 'success');

      const res = await fetch('/api/categories/sync', {
        method: 'POST',
      });

      const result = await res.json();

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to sync to Google Sheets');
      }

      showToast('Successfully synced to Google Sheets!', 'success');
      await fetchSyncStatus();
    } catch (error) {
      console.error('Error syncing to sheets:', error);
      showToast(error instanceof Error ? error.message : 'Failed to sync to Google Sheets', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Map optionsData to local data format
  const data = optionsData ? {
    properties: optionsData.properties || [],
    typeOfOperations: optionsData.typeOfOperations || [],
    typeOfPayments: optionsData.typeOfPayments || []
  } : null;

  // Show page loading screen while data loads
  if (showPageLoading) {
    return (
      <AdminShell>
        <PageLoadingScreen />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page header */}
        <div 
          className="flex items-center justify-between mb-4 animate-fade-in opacity-0"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
          <div>
            <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-tight">
              Settings
            </h1>
            <p className="text-text-secondary mt-3 font-aileron text-lg">
              Manage categories and sync data with Google Sheets
            </p>
          </div>
          <div className="-ml-86">
            <LogoBM size={100} />
          </div>
          <div className="flex items-center gap-2">
              {syncStatus?.needsSync && (
                <button
                  onClick={handleSyncToSheets}
                  disabled={isSyncing}
                  className="px-4 py-2 bg-success hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl2 text-black text-sm font-medium font-aileron transition-all duration-200 flex items-center gap-2 shadow-glow-green"
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <Cloud className="w-4 h-4" />
                      Sync to Sheets
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-3 bg-bg-card hover:bg-black rounded-xl2 transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
                aria-label="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 text-text-secondary ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
        </div>
        
        {/* Show skeleton loaders while loading */}
        {isLoading && !data && (
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Show content when data is loaded */}
        {data && (
          <>
        {/* Sync Status Banner */}
        {syncStatus && (
          <div 
            className={`backdrop-blur-sm border rounded-xl2 p-4 animate-fade-in opacity-0 ${
              syncStatus.needsSync
                ? 'bg-linear-to-r from-orange-900/20 to-yellow-900/20 border-orange-700/30'
                : 'bg-linear-to-r from-green-900/20 to-emerald-900/20 border-green-700/30'
            }`}
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
          >
            <div className="flex items-start gap-3">
              {syncStatus.needsSync ? (
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3 className="text-white font-semibold text-sm mb-1">
                  {syncStatus.needsSync ? 'Pending Changes' : 'All Synced'}
                </h3>
                <p className="text-text-primary text-xs">
                  {syncStatus.needsSync
                    ? 'You have unsaved changes. Click "Sync to Sheets" to update Google Sheets and mobile app.'
                    : 'All changes are synced to Google Sheets and available in the mobile app.'}
                </p>
                {syncStatus.lastSynced && (
                  <p className="text-text-secondary text-xs mt-1">
                    Last synced: {new Date(syncStatus.lastSynced).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Settings Container */}
        <div 
          className="bg-bg-card border border-border-card rounded-xl2 overflow-hidden shadow-glow-sm animate-fade-in opacity-0"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          {/* Container Header */}
          <div className="border-b border-border-card p-6 bg-bg-app/40">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl2 bg-yellow/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-yellow" />
              </div>
              <div>
                <h2 className="text-2xl font-bebasNeue uppercase text-text-primary tracking-tight">
                  Property Management
                </h2>
                <p className="text-text-secondary font-aileron">
                  Manage all business properties, categories, and settings
                </p>
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="p-6 space-y-4">
          {/* Revenue Management */}
          <div className="bg-black/20 border border-border-card rounded-xl2 overflow-hidden">
            <button
              onClick={() => toggleSection('revenue')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl2 bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary font-bebasNeue uppercase tracking-wide">
                    Revenue Categories
                  </h3>
                  <p className="text-sm text-text-secondary font-aileron">
                    Manage revenue streams and income types
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
                  expandedSections.revenue ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.revenue && (
              <div className="border-t border-border-card p-6 animate-in slide-in-from-top-2">
                <RevenueManager />
              </div>
            )}
          </div>

          {/* Expense Management */}
          <div className="bg-black/20 border border-border-card rounded-xl2 overflow-hidden">
            <button
              onClick={() => toggleSection('expenses')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl2 bg-red-500/10 flex items-center justify-center">
                  <BriefcaseBusiness className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary font-bebasNeue uppercase tracking-wide">
                    Overhead Expenses Management
                  </h3>
                  <p className="text-sm text-text-secondary font-aileron">
                    Manage expense types and cost classifications
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
                  expandedSections.expenses ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.expenses && (
              <div className="border-t border-border-card p-6 animate-in slide-in-from-top-2">
                <ExpenseCategoryManager onUpdate={handleRefresh} />
              </div>
            )}
          </div>

          {/* Property Management */}
          <div className="bg-black/20 border border-border-card rounded-xl2 overflow-hidden">
            <button
              onClick={() => toggleSection('properties')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl2 bg-blue-500/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary font-bebasNeue uppercase tracking-wide">
                    Properties
                  </h3>
                  <p className="text-sm text-text-secondary font-aileron">
                    Manage business locations and properties
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
                  expandedSections.properties ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.properties && (
              <div className="border-t border-border-card p-6 animate-in slide-in-from-top-2">
                <PropertyManager />
              </div>
            )}
          </div>

          {/* Payment Type Management */}
          <div className="bg-black/20 border border-border-card rounded-xl2 overflow-hidden">
            <button
              onClick={() => toggleSection('payments')}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-black/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl2 bg-purple-500/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-text-primary font-bebasNeue uppercase tracking-wide">
                    Payment Types
                  </h3>
                  <p className="text-sm text-text-secondary font-aileron">
                    Manage payment methods and transaction types
                  </p>
                </div>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-text-secondary transition-transform duration-200 ${
                  expandedSections.payments ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedSections.payments && (
              <div className="border-t border-border-card p-6 animate-in slide-in-from-top-2">
                <PaymentTypeManager />
              </div>
            )}
          </div>
          </div>
        </div>

        {lastUpdated && (
          <p className="text-text-secondary text-sm text-center mt-4">
            Last updated: {lastUpdated}
          </p>
        )}
        </>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl2 shadow-lg ${
          toast.type === 'success' ? 'bg-success text-black' : 'bg-error text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </AdminShell>
  );
}
