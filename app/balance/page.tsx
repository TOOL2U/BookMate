'use client';

import React, { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, Upload, Plus, CheckCircle, XCircle, Zap, Edit3, Camera, Banknote, Building2, Save } from 'lucide-react';

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
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'ocr'>('manual');
  const [newBalances, setNewBalances] = useState<NewBalanceEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [availableBanks, setAvailableBanks] = useState<string[]>([]); // Dynamic bank list from API

  const fetchBalances = async () => {
    setLoading(true);
    try {
      // Fetch available bank accounts from API (same as Settings page)
      // Add cache-busting to ensure fresh data
      const optionsRes = await fetch(`/api/options?t=${Date.now()}`);
      const optionsData = await optionsRes.json();
      
      if (optionsData.ok && optionsData.data?.typeOfPayments) {
        // Extract bank names from payment type objects
        const bankNames = optionsData.data.typeOfPayments.map((payment: any) => 
          typeof payment === 'string' ? payment : payment.name
        );
        setAvailableBanks(bankNames);
      }

      // 🆕 USE UNIFIED BALANCE API (reads from Balance Summary tab)
      const res = await fetch('/api/balance?month=ALL');
      const data = await res.json();

      if (data.ok && data.items) {
        console.log('📊 Balance data source:', data.source); // Will show "BalanceSummary" or "Computed"
        
        // Map unified API format to Balance format
        const balancesArray = data.items.map((account: any) => ({
          bankName: account.accountName,
          balance: account.currentBalance,
          uploadedBalance: account.openingBalance,
          uploadedDate: account.lastTxnAt || '',
          totalRevenue: account.inflow,
          totalExpense: account.outflow,
          transactionCount: 0, // Not provided by unified API
          variance: account.netChange,
          timestamp: account.lastTxnAt || new Date().toISOString()
        }));
        setBalances(balancesArray);
        setLastUpdated(new Date().toLocaleString());
      }

      // Always initialize newBalances with all available banks
      if (newBalances.length === 0 && optionsData.ok && optionsData.data?.typeOfPayments) {
        setNewBalances(optionsData.data.typeOfPayments.map((payment: any) => {
          const bankName = typeof payment === 'string' ? payment : payment.name;
          // Try to find existing balance for this bank
          const existingBalance = data?.propertyBalances?.find((pb: any) => pb.property === bankName);
          return {
            bankName,
            balance: existingBalance?.balance || 0,
            note: ''
          };
        }));
      }

      // Also fetch reconciliation data
      const reconcileRes = await fetch('/api/balance/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const reconcileData = await reconcileRes.json();
      if (reconcileData.ok && reconcileData.reconcile) {
        setReconciliation(reconcileData.reconcile);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if a bank is selected
    if (!selectedBank) {
      alert('Please select a bank account first');
      return;
    }

    setSelectedFile(file);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/balance/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.ok && data.bankBalance) {
        // Update the selected bank's balance with OCR result
        const updatedBalances = newBalances.map(nb => {
          if (nb.bankName === selectedBank) {
            return { ...nb, balance: data.bankBalance };
          }
          return nb;
        });
        setNewBalances(updatedBalances);
        alert(`Balance extracted: ฿${data.bankBalance.toLocaleString()} for ${selectedBank}`);
      } else {
        alert('Could not extract balance from image. Please try manual entry.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try manual entry.');
    } finally {
      setUploading(false);
    }
  };

  const handleManualBalanceChange = (index: number, field: keyof NewBalanceEntry, value: string | number) => {
    const updated = [...newBalances];
    updated[index] = { ...updated[index], [field]: value };
    setNewBalances(updated);
  };

  const handleSaveBalances = async () => {
    setUploading(true);
    try {
      // Check if a bank is selected
      if (!selectedBank) {
        alert('Please select a bank account first.');
        setUploading(false);
        return;
      }

      // Get the selected bank's data
      const selectedBankData = newBalances.find(nb => nb.bankName === selectedBank);
      if (!selectedBankData) {
        alert('Selected bank not found.');
        setUploading(false);
        return;
      }

      // Check if a new balance has been entered
      const oldBalance = balances.find(b => b.bankName === selectedBank)?.uploadedBalance || 0;
      if (!selectedBankData.balance || selectedBankData.balance <= 0) {
        alert('Please enter a new balance value for the selected bank.');
        setUploading(false);
        return;
      }

      if (selectedBankData.balance === oldBalance) {
        alert('The new balance is the same as the previous balance. Please enter a different value.');
        setUploading(false);
        return;
      }

      const updatedBalances = [selectedBankData];

      // Save each balance individually
      const results = await Promise.all(
        updatedBalances.map(async (balance) => {
          try {
            const response = await fetch('/api/balance/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bankName: balance.bankName,
                balance: balance.balance,
                note: balance.note || undefined
              })
            });
            const data = await response.json();
            return { success: data.ok, bankName: balance.bankName, error: data.error };
          } catch (error) {
            return { success: false, bankName: balance.bankName, error: 'Network error' };
          }
        })
      );

      // Check results
      const failed = results.filter(r => !r.success);
      
      if (failed.length === 0) {
        alert(`Successfully saved ${updatedBalances.length} balance(s)!`);
        setShowUploadModal(false);
        fetchBalances(); // Refresh the data
      } else {
        const failedNames = failed.map(f => f.bankName).join(', ');
        alert(`Saved ${results.length - failed.length}/${results.length} balances.\nFailed: ${failedNames}`);
      }
    } catch (error) {
      console.error('Error saving balances:', error);
      alert('Failed to save balances');
    } finally {
      setUploading(false);
    }
  };

  const calculateReconciliation = () => {
    const oldTotal = balances.reduce((sum, b) => sum + (b.uploadedBalance || 0), 0);
    const newTotal = newBalances.reduce((sum, b) => sum + b.balance, 0);
    const totalExpenses = balances.reduce((sum, b) => sum + (b.totalExpense || 0), 0);
    const totalRevenue = balances.reduce((sum, b) => sum + (b.totalRevenue || 0), 0);
    
    const expectedNew = oldTotal + totalRevenue - totalExpenses;
    const difference = newTotal - expectedNew;
    const accountedFor = Math.abs(difference) < 1; // Allow 1 baht rounding
    
    return {
      oldTotal,
      newTotal,
      totalExpenses,
      totalRevenue,
      expectedNew,
      difference,
      accountedFor,
      percentageTracked: expectedNew !== 0 ? ((newTotal / expectedNew) * 100).toFixed(2) : '0'
    };
  };

  useEffect(() => {
    fetchBalances();
  }, []);

  const totalBalance = balances.reduce((sum, b) => sum + (b.balance || 0), 0);
  const cashBalance = balances.find(b => b.bankName === 'Cash')?.balance || 0;
  const bankBalance = balances.filter(b => b.bankName !== 'Cash').reduce((sum, b) => sum + (b.balance || 0), 0);

  return (
    <AdminShell>
      <div className="space-y-6">
        {/* Page header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Cash & Bank Balances</h1>
            <p className="text-text-secondary mt-1">Monitor your cash flow and bank accounts</p>
            {lastUpdated && (
              <p className="text-xs text-text-secondary mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-tertiary" />
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <button
            onClick={fetchBalances}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#0A0A0A] hover:bg-[#0A0A0A]/80 rounded-lg transition-colors disabled:opacity-50 border border-border-card"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`w-4 h-4 text-text-secondary ${loading ? 'animate-spin' : ''}`} />
            <span className="text-text-primary text-sm">Refresh</span>
          </button>
        </div>

        {/* Total Balance Card */}
        <div className=" border border-border-card rounded-xl p-8 shadow-[0_12px_48px_rgba(0,0,0,0.4)] bg-gradient-to-br from-[#000000] to-[#141E21]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-accent" />
            </div>
            <span className="text-text-secondary text-sm">Total Available</span>
          </div>
          {loading ? (
            <div className="h-12 w-48 bg-border-card/60 animate-pulse rounded" />
          ) : (
            <div>
              <p className="text-5xl font-bold text-text-primary mb-2">
                ฿{totalBalance.toLocaleString()}
              </p>
              <p className="text-text-secondary text-sm">
                Cash + Bank Accounts
              </p>
            </div>
          )}
        </div>

        {/* Cash vs Bank Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Card */}
          <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-white">Cash in Hand</p>
                <p className="text-xs text-text-tertiary">Physical currency</p>
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-border-card/60 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-text-primary">
                ฿{cashBalance.toLocaleString()}
              </p>
            )}
          </div>

          {/* Bank Card */}
          <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-white">Bank Accounts</p>
                <p className="text-xs text-text-tertiary">Total in all banks</p>
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-border-card/60 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-text-primary">
                ฿{bankBalance.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Individual Account Balances */}
        <div className="bg-[#0A0A0A] border border-border-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Account Details</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-border-card/60 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((balance, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 bg-[#0A0A0A] rounded-lg border border-border-card hover:border-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
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
                      <p className="text-text-primary font-medium">{balance.bankName}</p>
                      {balance.timestamp && (
                        <p className="text-xs text-text-secondary mt-1">
                          Last updated {new Date(balance.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {balance.transactionCount !== undefined && balance.transactionCount > 0 && (
                        <p className="text-xs text-text-secondary mt-1">
                          {balance.transactionCount} transaction{balance.transactionCount !== 1 ? 's' : ''} 
                          {balance.totalExpense! > 0 && ` • -฿${balance.totalExpense!.toLocaleString()} expenses`}
                          {balance.totalRevenue! > 0 && ` • +฿${balance.totalRevenue!.toLocaleString()} revenue`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-text-primary">
                      ฿{balance.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
              <p className="text-text-secondary">No balance data available</p>
              <p className="text-sm text-text-secondary mt-1">Use the mobile app to upload balances</p>
            </div>
          )}
        </div>

        {/* Balance History Preview (Placeholder for future) */}
        <div className="bg-gradient-to-br from-[#000000] to-[#141E21] border border-border-card rounded-xl p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-4">Balance Trend</h2>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
            <p className="text-text-secondary">Historical trend coming soon</p>
            <p className="text-sm text-text-secondary mt-1">
              Track balance changes over time
            </p>
          </div>
        </div>

        {/* Update Balances Section */}
        <div className="bg-black border border-border-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-accent" />
                Update Monthly Balances
              </h2>
              <p className="text-sm text-text-secondary mt-1">Upload screenshots or manually enter new bank balances</p>
            </div>
            {!showUploadModal && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent to-accent-blue hover:opacity-95 rounded-lg transition-all duration-200 shadow-lg hover:shadow-[0_0_25px_rgba(0,217,255,0.45)]"
              >
                <Zap className="w-5 h-5 text-text-primary group-hover:text-accent transition-colors" />
                <span className="text-text-primary font-medium">Update Balances</span>
              </button>
            )}
          </div>

          {showUploadModal && (
            <div className="space-y-6 border-t border-border-card pt-6">
              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUploadMethod('manual')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    uploadMethod === 'manual'
                      ? 'border-accent bg-gradient-to-br from-accent/20 to-accent-black/10 shadow-lg shadow-[0_0_20px_rgba(0,217,255,0.35)]'
                      : 'border-border-card bg-black hover:border-border-card hover:bg-[#0A0A0A]'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      uploadMethod === 'manual'
                        ? 'bg-gradient-to-br from-accent to-accent-blue'
                        : 'bg-[#0A0A0A]'
                    }`}>
                      <Edit3 className={`w-8 h-8 ${uploadMethod === 'manual' ? 'text-text-primary' : 'text-text-secondary'}`} />
                    </div>
                    <p className="text-text-primary font-semibold text-lg">Manual Entry</p>
                    <p className="text-xs text-text-secondary mt-2">Type in balances manually</p>
                  </div>
                  {uploadMethod === 'manual' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-accent" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setUploadMethod('ocr')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    uploadMethod === 'ocr'
                      ? 'border-accent bg-gradient-to-br from-accent/20 to-accent-purple/10 shadow-lg shadow-[0_0_20px_rgba(0,217,255,0.35)]'
                      : 'border-border-card bg-[#0A0A0A] hover:border-border-card hover:bg-[#0A0A0A]'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      uploadMethod === 'ocr'
                        ? 'bg-gradient-to-br from-accent to-accent-purple'
                        : 'bg-[#0A0A0A]'
                    }`}>
                      <Camera className={`w-8 h-8 ${uploadMethod === 'ocr' ? 'text-text-primary' : 'text-text-secondary'}`} />
                    </div>
                    <p className="text-text-primary font-semibold text-lg">Upload Screenshot</p>
                    <p className="text-xs text-text-secondary mt-2">Auto-extract from image</p>
                  </div>
                  {uploadMethod === 'ocr' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-accent" />
                    </div>
                  )}
                </button>
              </div>

              {/* OCR Upload */}
              {uploadMethod === 'ocr' && (
                <div className="space-y-4">
                  {/* Bank Selection for OCR */}
                  <div className="bg-[#0A0A0A] rounded-lg p-4 border border-border-card">
                    <label className="block text-sm font-semibold text-text-primary mb-3">
                      Select Bank Account for this Statement
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0A0A] border border-border-card rounded-lg text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                    >
                      <option value="">-- Select a bank account --</option>
                      {availableBanks.map((bankName, index) => {
                        return (
                          <option key={index} value={bankName}>
                            {bankName}
                          </option>
                        );
                      })}
                    </select>
                    {selectedBank && (
                      <p className="text-xs text-accent mt-2 inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Selected: {selectedBank}</span>
                      </p>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="relative border-2 border-dashed border-accent/30 rounded-xl p-10 bg-gradient-to-br from-accent/10 to-accent-purple/10 hover:border-accent/50 transition-all duration-200">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-accent to-accent-blue flex items-center justify-center">
                        <Camera className="w-10 h-10 text-text-primary" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="balance-upload"
                        disabled={uploading || !selectedBank}
                      />
                      <label
                        htmlFor="balance-upload"
                        className={`inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-accent to-accent-blue hover:opacity-95 rounded-lg cursor-pointer transition-all duration-200 shadow-lg hover:shadow-[0_0_25px_rgba(0,217,255,0.45)] ${
                          uploading || !selectedBank ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-5 h-5 text-text-primary animate-spin" />
                            <span className="text-text-primary font-semibold">Processing Image...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-text-primary" />
                            <span className="text-text-primary font-semibold">
                              {selectedFile ? selectedFile.name : 'Choose Bank Statement'}
                            </span>
                          </>
                        )}
                      </label>
                      {!selectedBank && (
                        <p className="text-sm text-warning mt-4">
                          Please select a bank account first
                        </p>
                      )}
                      <p className="text-sm text-text-secondary mt-4">
                        Upload a screenshot of your bank statement or balance
                      </p>
                      <p className="text-xs text-text-secondary mt-2">
                        Supports JPG, PNG • AI will auto-extract balance amounts
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Entry Form */}
              {uploadMethod === 'manual' && (
                <div className="space-y-4">
                {/* Bank Selection Dropdown */}
                <div className="bg-[#0A0A0A] rounded-lg p-4 border border-border-card">
                  <label className="block text-sm font-semibold text-text-primary mb-3">
                    Select Bank Account to Update
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-border-card rounded-lg text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  >
                    <option value="">-- Select a bank account --</option>
                    {availableBanks.map((bankName, index) => {
                      return (
                        <option key={index} value={bankName}>
                          {bankName}
                        </option>
                      );
                    })}
                  </select>
                  {selectedBank && (
                    <p className="text-xs text-accent mt-2 inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>Selected: {selectedBank}</span>
                    </p>
                  )}
                </div>

                {/* Selected Bank Details */}
                {selectedBank && (() => {
                  const isCash = selectedBank.toLowerCase().includes('cash');
                  const previousBalance = balances.find(b => b.bankName === selectedBank)?.uploadedBalance || 0;
                  const originalIndex = newBalances.findIndex(b => b.bankName === selectedBank);
                  const entry = newBalances[originalIndex] || { bankName: selectedBank, balance: 0, note: '' };
                  const hasChanged = entry.balance > 0 && entry.balance !== previousBalance;

                  return (
                    <div className="bg-[#0A0A0A] rounded-lg p-6 border border-border-card space-y-4">
                      {/* Bank Info Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-border-card">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isCash
                            ? 'bg-success/10'
                            : 'bg-accent/10'
                        }`}>
                          {isCash ? (
                            <Banknote className="w-6 h-6 text-success" />
                          ) : (
                            <Building2 className="w-6 h-6 text-accent" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-text-primary text-base font-semibold">{selectedBank}</p>
                          <p className="text-xs text-text-secondary">{isCash ? 'Cash Account' : 'Bank Account'}</p>
                        </div>
                      </div>

                      {/* Previous Balance */}
                      <div className="bg-[#0A0A0A] rounded-lg p-4">
                        <label className="block text-xs text-text-secondary mb-1">Previous Balance</label>
                        <p className="text-text-primary text-lg font-medium">
                          ฿{previousBalance.toLocaleString()}
                        </p>
                      </div>

                      {/* New Balance Input */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          New Balance <span className="text-error">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary text-base">฿</span>
                          <input
                            type="number"
                            value={entry.balance || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0;
                              if (originalIndex >= 0) {
                                handleManualBalanceChange(originalIndex, 'balance', value);
                              } else {
                                // If entry doesn't exist yet, add it
                                const newEntry = { bankName: selectedBank, balance: value, note: '' };
                                setNewBalances([...newBalances, newEntry]);
                              }
                            }}
                            className={`w-full pl-10 pr-4 py-3.5 rounded-lg text-text-primary text-base font-medium focus:outline-none focus:ring-2 transition-all ${
                              hasChanged
                                ? 'bg-accent/10 border-2 border-accent focus:ring-accent/40'
                                : 'bg-bg-app border border-border-card focus:border-accent focus:ring-accent/30'
                            }`}
                            placeholder="Enter new balance amount"
                          />
                        </div>
                        {hasChanged && (
                          <p className="text-xs text-accent mt-2 inline-flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>Balance changed by ฿{Math.abs(entry.balance - previousBalance).toLocaleString()}</span>
                          </p>
                        )}
                      </div>

                      {/* Note Input */}
                      <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                          Note (Optional)
                        </label>
                        <input
                          type="text"
                          value={entry.note || ''}
                          onChange={(e) => {
                            if (originalIndex >= 0) {
                              handleManualBalanceChange(originalIndex, 'note', e.target.value);
                            } else {
                              // If entry doesn't exist yet, add it
                              const newEntry = { bankName: selectedBank, balance: 0, note: e.target.value };
                              setNewBalances([...newBalances, newEntry]);
                            }
                          }}
                          className="w-full px-4 py-3 bg-bg-app border border-border-card rounded-lg text-text-primary text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                          placeholder="Add a note about this balance update..."
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Message when no bank selected */}
                {!selectedBank && (
                  <div className="bg-[#0A0A0A] rounded-lg p-8 border border-border-card text-center">
                    <Wallet className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
                    <p className="text-text-secondary text-sm">
                      Please select a bank account from the dropdown above to update its balance
                    </p>
                  </div>
                )}
                </div>
              )}

              {/* Reconciliation Summary */}
              {newBalances.some(b => b.balance > 0) && (
                <div className="border border-border-card rounded-lg p-4 bg-[#0A0A0A]">
                  <h3 className="text-text-primary font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-accent" />
                    Money Tracking Reconciliation
                  </h3>
                  {(() => {
                    const recon = calculateReconciliation();
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Previous Total:</span>
                          <span className="text-text-primary font-medium">฿{recon.oldTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-success">
                          <span>+ Revenue:</span>
                          <span className="font-medium">฿{recon.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-error">
                          <span>- Expenses:</span>
                          <span className="font-medium">฿{recon.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-border-card my-2 pt-2 flex justify-between">
                          <span className="text-text-secondary">Expected New Total:</span>
                          <span className="text-text-primary font-medium">฿{recon.expectedNew.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Actual New Total:</span>
                          <span className="text-text-primary font-medium">฿{recon.newTotal.toLocaleString()}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${
                          recon.accountedFor ? 'text-success' : 'text-warning'
                        }`}>
                          <span>Difference:</span>
                          <span className="flex items-center gap-2">
                            {recon.accountedFor ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            ฿{Math.abs(recon.difference).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-center mt-3 p-3 rounded-lg bg-[#0A0A0A]">
                          <p className={`text-lg font-bold ${
                            recon.accountedFor ? 'text-success' : 'text-warning'
                          }`}>
                            {recon.accountedFor ? (
                              <span className="inline-flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                100% Money Tracked!
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                {recon.percentageTracked}% Tracked
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-text-secondary mt-1">
                            {recon.accountedFor
                              ? 'All transactions accounted for'
                              : `฿${Math.abs(recon.difference).toLocaleString()} ${recon.difference > 0 ? 'extra' : 'missing'}`
                            }
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-border-card">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-border-card/60 hover:bg-border-card rounded-lg transition-all duration-200 text-text-primary font-medium border border-border-card"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveBalances}
                  disabled={uploading || !selectedBank}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-accent to-accent-blue hover:opacity-95 rounded-lg transition-all duration-200 text-text-primary font-semibold shadow-lg hover:shadow-[0_0_25px_rgba(0,217,255,0.45)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {!selectedBank ? 'Select a Bank to Save' : `Save Balance for ${selectedBank}`}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Warnings Section */}
        <div className="bg-[#0A0A0A] border border-warning/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-warning" />
            <h2 className="text-xl font-semibold text-text-primary">Alerts & Warnings</h2>
          </div>
          <div className="space-y-2">
            {cashBalance < 10000 && (
              <div className="flex items-center gap-2 text-warning text-sm">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <p>Cash balance is below ฿10,000</p>
              </div>
            )}
            {!lastUpdated && (
              <div className="flex items-center gap-2 text-warning text-sm">
                <div className="w-2 h-2 rounded-full bg-warning" />
                <p>No recent balance updates</p>
              </div>
            )}
            {cashBalance >= 10000 && lastUpdated && (
              <p className="text-text-secondary text-sm">No warnings at this time</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

export default React.memo(BalanceAnalyticsPage);
