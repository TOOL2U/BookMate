'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import LogoBM from '@/components/LogoBM';
import PageLoadingScreen from '@/components/PageLoadingScreen';
import { usePageLoading } from '@/hooks/usePageLoading';
import BalanceTrendChart from '@/components/balance/BalanceTrendChart';
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, Upload, Plus, CheckCircle, XCircle, Zap, Edit3, Camera, Banknote, Building2, Save } from 'lucide-react';
import { useBalances, useOptions } from '@/hooks/useQueries';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/useQueries';
import { SkeletonKPI, SkeletonCard } from '@/components/ui/Skeleton';
import { startPerformanceTimer } from '@/lib/performance';

interface Balance {
  bankName: string;
  balance: number;
  uploadedBalance?: number;
  uploadedDate?: string;
  totalRevenue?: number;
  totalExpense?: number;
  transactionCount?: number;
  variance?: number;
  timestamp?: string;
}

interface NewBalanceEntry {
  bankName: string;
  balance: number;
  note?: string;
}

function BalanceAnalyticsPage() {
  const queryClient = useQueryClient();
  
  // Coordinate page loading with data fetching
  const { isLoading: showPageLoading, setDataReady } = usePageLoading({
    minLoadingTime: 800
  });
  
  // Use React Query for data fetching
  const {
    data: balanceData,
    isLoading: balancesLoading,
    error: balancesError,
  } = useBalances();
  
  const {
    data: optionsData,
    isLoading: optionsLoading,
  } = useOptions();
  
  const loading = balancesLoading || optionsLoading;
  
  // Performance tracking
  useEffect(() => {
    const endTimer = startPerformanceTimer('Balance Page');
    
    if (!loading && balanceData) {
      endTimer();
      setDataReady(true);
    }
  }, [loading, balanceData, setDataReady]);
  
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [availableBanks, setAvailableBanks] = useState<string[]>([]);

  // Extract available banks from options
  useEffect(() => {
    if (optionsData?.typeOfPayments) {
      const bankNames = optionsData.typeOfPayments.map((payment: any) => 
        typeof payment === 'string' ? payment : payment.name
      );
      setAvailableBanks(bankNames);
    }
  }, [optionsData]);

  // Update timestamp when data changes
  useEffect(() => {
    if (balanceData) {
      setLastUpdated(new Date().toLocaleString());
    }
  }, [balanceData]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.balances() });
    queryClient.invalidateQueries({ queryKey: queryKeys.options() });
  };

  // Map balance data to component format
  const balances = balanceData?.balances.map((account: any) => ({
    bankName: account.accountName,
    balance: account.currentBalance,
    uploadedBalance: account.openingBalance,
    uploadedDate: account.lastTxnAt || '',
    totalRevenue: account.inflow,
    totalExpense: account.outflow,
    transactionCount: 0,
    variance: account.netChange,
    timestamp: account.lastTxnAt || new Date().toISOString()
  })) || [];

  const totalBalance = balanceData?.total || 0;
  const cashBalance = balanceData?.cash || 0;
  const bankBalance = balanceData?.bank || 0;

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
      <div className="space-y-4">
        {/* Page header - Made Mirage font for title */}
        <div 
          className="flex items-start justify-between mb-1 animate-fade-in opacity-0"
          style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}
        >
          <div>
            <h1 className="text-3xl font-bebasNeue uppercase text-text-primary tracking-tight">
              Balance Overview
            </h1>
            <p className="text-text-secondary mt-2 font-aileron">
              Monitor your cash flow and bank accounts
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted mt-2 flex items-center gap-2 font-aileron">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <div className="-ml-86">
            <LogoBM size={100} />
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-grey-dark hover:bg-black rounded-xl2 transition-all disabled:opacity-50 border border-border-card hover:border-yellow/20"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`w-4 h-4 text-muted ${loading ? 'animate-spin' : ''}`} />
            <span className="text-text-primary text-sm font-aileron font-medium">Refresh</span>
          </button>
        </div>

        {/* Total Balance Card - #171717 bg, proper brand styling */}
        <div 
          className="bg-bg-card border border-border-card rounded-xl2 p-4 shadow-glow-sm animate-fade-in opacity-0"
          style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-14 h-14 rounded-full bg-yellow/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-yellow" />
            </div>
            <span className="text-muted text-sm font-bebasNeue uppercase tracking-wide">
              Total Available
            </span>
          </div>
          {loading ? (
            <div className="h-12 w-48 bg-border-card/60 animate-pulse rounded" />
          ) : (
            <div>
              <p className="font-madeMirage text-6xl text-yellow mb-1">
                ฿{totalBalance.toLocaleString()}
              </p>
              <p className="font-aileron text-text-secondary text-sm">
                Cash + Bank Accounts
              </p>
            </div>
          )}
        </div>

        {/* Cash vs Bank Breakdown */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in opacity-0"
          style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
        >
          {/* Cash Card */}
          <div className="bg-bg-card border border-border-card rounded-xl2 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl2 bg-success/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="font-bebasNeue text-sm text-white uppercase tracking-wide">Cash in Hand</p>
                <p className="font-aileron text-xs text-text-tertiary">Physical currency</p>
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-border-card/60 animate-pulse rounded" />
            ) : (
              <p className="font-madeMirage text-4xl text-yellow">
                ฿{cashBalance.toLocaleString()}
              </p>
            )}
          </div>

          {/* Bank Card */}
          <div className="bg-bg-card border border-border-card rounded-xl2 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl2 bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-bebasNeue text-sm text-white uppercase tracking-wide">Bank Accounts</p>
                <p className="font-aileron text-xs text-text-tertiary">Total in all banks</p>
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-border-card/60 animate-pulse rounded" />
            ) : (
              <p className="font-madeMirage text-4xl text-yellow">
                ฿{bankBalance.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Account Details & Balance Trend - Stacked Vertically */}
        <div 
          className="space-y-4 animate-fade-in opacity-0"
          style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
        >
          {/* Individual Account Balances */}
          <div className="bg-bg-card border border-border-card rounded-xl2 p-4">
            <h2 className="font-bebasNeue text-2xl text-text-primary uppercase tracking-wide mb-2">Account Details</h2>
            
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-border-card/60 animate-pulse rounded-xl2" />
                ))}
              </div>
            ) : balances.length > 0 ? (
              <div className="space-y-2">
                {balances.map((balance, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-black rounded-xl2 border border-border-card hover:border-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl2 flex items-center justify-center ${
                        balance.bankName === 'Cash' 
                          ? 'bg-success/10' 
                          : 'bg-accent/10'
                      }`}>
                        <Wallet className={`w-5 h-5 ${
                          balance.bankName === 'Cash' 
                            ? 'text-success' 
                            : 'text-accent'
                        }`} />
                      </div>
                      <div>
                        <p className="font-aileron text-text-primary font-medium">{balance.bankName}</p>
                        {balance.timestamp && (
                          <p className="font-aileron text-xs text-text-secondary">
                            {new Date(balance.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-madeMirage text-3xl text-yellow">
                        ฿{balance.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                <p className="font-aileron text-text-secondary">No balance data available</p>
                <p className="font-aileron text-sm text-text-secondary mt-1">Use the mobile app to upload balances</p>
              </div>
            )}
          </div>

          {/* Balance Trend Chart */}
          <div className="bg-bg-card border border-border-card rounded-xl2 p-4">
            <BalanceTrendChart balances={balances} />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default React.memo(BalanceAnalyticsPage);
