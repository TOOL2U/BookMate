'use client';

import { useEffect, useState } from 'react';
import AdminShell from '@/components/layout/AdminShell';
import { Wallet, TrendingUp, TrendingDown, Clock, AlertTriangle, RefreshCw, Upload, Plus, CheckCircle, XCircle, Sparkles, Edit3, Camera, Banknote, Building2, Save } from 'lucide-react';

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

// Available bank accounts (from options.json)
const AVAILABLE_BANKS = [
  'Bank Transfer - Bangkok Bank - Shaun Ducker',
  'Bank Transfer - Bangkok Bank - Maria Ren',
  'Bank transfer - Krung Thai Bank - Family Account',
  'Cash',
];

export default function BalanceAnalyticsPage() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'manual' | 'ocr'>('manual');
  const [newBalances, setNewBalances] = useState<NewBalanceEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [reconciliation, setReconciliation] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<string>(''); // Track which bank is selected for update

  const fetchBalances = async () => {
    setLoading(true);
    try {
      // Use the running balance endpoint that tracks expenses
      const res = await fetch('/api/balance/by-property', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();

      if (data.ok && data.propertyBalances) {
        // Map propertyBalances to Balance format
        const balancesArray = data.propertyBalances.map((pb: any) => ({
          bankName: pb.property,
          balance: pb.balance || pb.uploadedBalance,
          uploadedBalance: pb.uploadedBalance,
          uploadedDate: pb.uploadedDate,
          totalRevenue: pb.totalRevenue,
          totalExpense: pb.totalExpense,
          transactionCount: pb.transactionCount,
          variance: pb.variance,
          timestamp: pb.uploadedDate
        }));
        setBalances(balancesArray);
        setLastUpdated(new Date().toLocaleString());
      }

      // Always initialize newBalances with all available banks
      if (newBalances.length === 0) {
        setNewBalances(AVAILABLE_BANKS.map((bankName) => {
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
        alert(`✓ Balance extracted: ฿${data.bankBalance.toLocaleString()} for ${selectedBank}`);
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
            <h1 className="text-3xl font-bold text-white">Cash & Bank Balances</h1>
            <p className="text-slate-400 mt-1">Monitor your cash flow and bank accounts</p>
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Last updated: {lastUpdated}
              </p>
            )}
          </div>
          <button
            onClick={fetchBalances}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg transition-colors disabled:opacity-50 border border-slate-700/50"
            aria-label="Refresh balances"
          >
            <RefreshCw className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            <span className="text-slate-300 text-sm">Refresh</span>
          </button>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="text-white/80 text-sm">Total Available</span>
          </div>
          {loading ? (
            <div className="h-12 w-48 bg-white/20 animate-pulse rounded" />
          ) : (
            <div>
              <p className="text-5xl font-bold text-white mb-2">
                ฿{totalBalance.toLocaleString()}
              </p>
              <p className="text-white/80 text-sm">
                Cash + Bank Accounts
              </p>
            </div>
          )}
        </div>

        {/* Cash vs Bank Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cash Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Cash in Hand</p>
                <p className="text-xs text-slate-500">Physical currency</p>
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-slate-700/50 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-white">
                ฿{cashBalance.toLocaleString()}
              </p>
            )}
          </div>

          {/* Bank Card */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Bank Accounts</p>
                <p className="text-xs text-slate-500">Total in all banks</p>
              </div>
            </div>
            {loading ? (
              <div className="h-10 w-32 bg-slate-700/50 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold text-white">
                ฿{bankBalance.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Individual Account Balances */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Account Details</h2>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-700/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : balances.length > 0 ? (
            <div className="space-y-3">
              {balances.map((balance, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      balance.bankName === 'Cash' 
                        ? 'bg-green-500/10' 
                        : 'bg-blue-500/10'
                    }`}>
                      <Wallet className={`w-5 h-5 ${
                        balance.bankName === 'Cash' 
                          ? 'text-green-500' 
                          : 'text-blue-500'
                      }`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{balance.bankName}</p>
                      {balance.timestamp && (
                        <p className="text-xs text-slate-500 mt-1">
                          Updated: {new Date(balance.timestamp).toLocaleDateString()}
                        </p>
                      )}
                      {balance.transactionCount !== undefined && balance.transactionCount > 0 && (
                        <p className="text-xs text-slate-400 mt-1">
                          {balance.transactionCount} transaction{balance.transactionCount !== 1 ? 's' : ''} 
                          {balance.totalExpense! > 0 && ` • -฿${balance.totalExpense!.toLocaleString()} expenses`}
                          {balance.totalRevenue! > 0 && ` • +฿${balance.totalRevenue!.toLocaleString()} revenue`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      ฿{balance.balance.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No balance data available</p>
              <p className="text-sm text-slate-500 mt-1">Use the mobile app to upload balances</p>
            </div>
          )}
        </div>

        {/* Balance History Preview (Placeholder for future) */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Balance Trend</h2>
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Historical trend coming soon</p>
            <p className="text-sm text-slate-500 mt-1">
              Track balance changes over time
            </p>
          </div>
        </div>

        {/* Update Balances Section */}
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Edit3 className="w-6 h-6 text-blue-400" />
                Update Monthly Balances
              </h2>
              <p className="text-sm text-slate-400 mt-1">Upload screenshots or manually enter new bank balances</p>
            </div>
            {!showUploadModal && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="group relative flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 shadow-lg hover:shadow-blue-500/50"
              >
                <Sparkles className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
                <span className="text-white font-medium">Update Balances</span>
              </button>
            )}
          </div>

          {showUploadModal && (
            <div className="space-y-6 border-t border-slate-700/50 pt-6">
              {/* Method Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setUploadMethod('manual')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    uploadMethod === 'manual'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      uploadMethod === 'manual'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : 'bg-slate-800'
                    }`}>
                      <Edit3 className={`w-8 h-8 ${uploadMethod === 'manual' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-white font-semibold text-lg">Manual Entry</p>
                    <p className="text-xs text-slate-400 mt-2">Type in balances manually</p>
                  </div>
                  {uploadMethod === 'manual' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setUploadMethod('ocr')}
                  className={`group relative p-6 rounded-xl border-2 transition-all duration-200 ${
                    uploadMethod === 'ocr'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-500/20 to-purple-500/10 shadow-lg shadow-blue-500/20'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center ${
                      uploadMethod === 'ocr'
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                        : 'bg-slate-800'
                    }`}>
                      <Camera className={`w-8 h-8 ${uploadMethod === 'ocr' ? 'text-white' : 'text-slate-400'}`} />
                    </div>
                    <p className="text-white font-semibold text-lg">Upload Screenshot</p>
                    <p className="text-xs text-slate-400 mt-2">Auto-extract from image</p>
                  </div>
                  {uploadMethod === 'ocr' && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                </button>
              </div>

              {/* OCR Upload */}
              {uploadMethod === 'ocr' && (
                <div className="space-y-4">
                  {/* Bank Selection for OCR */}
                  <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                    <label className="block text-sm font-semibold text-white mb-3">
                      Select Bank Account for this Statement
                    </label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                    >
                      <option value="">-- Select a bank account --</option>
                      {AVAILABLE_BANKS.map((bankName, index) => {
                        const isCash = bankName.toLowerCase().includes('cash');
                        return (
                          <option key={index} value={bankName}>
                            {isCash ? '💵' : '🏦'} {bankName}
                          </option>
                        );
                      })}
                    </select>
                    {selectedBank && (
                      <p className="text-xs text-blue-400 mt-2">
                        ✓ Selected: {selectedBank}
                      </p>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="relative border-2 border-dashed border-blue-500/30 rounded-xl p-10 bg-gradient-to-br from-blue-500/5 to-purple-500/5 hover:border-blue-500/50 transition-all duration-200">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-white" />
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
                        className={`inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg cursor-pointer transition-all duration-200 shadow-lg hover:shadow-blue-500/50 ${
                          uploading || !selectedBank ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploading ? (
                          <>
                            <RefreshCw className="w-5 h-5 text-white animate-spin" />
                            <span className="text-white font-semibold">Processing Image...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-white" />
                            <span className="text-white font-semibold">
                              {selectedFile ? selectedFile.name : 'Choose Bank Statement'}
                            </span>
                          </>
                        )}
                      </label>
                      {!selectedBank && (
                        <p className="text-sm text-yellow-400 mt-4">
                          ⚠️ Please select a bank account first
                        </p>
                      )}
                      <p className="text-sm text-slate-400 mt-4">
                        Upload a screenshot of your bank statement or balance
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
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
                <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/50">
                  <label className="block text-sm font-semibold text-white mb-3">
                    Select Bank Account to Update
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                  >
                    <option value="">-- Select a bank account --</option>
                    {AVAILABLE_BANKS.map((bankName, index) => {
                      const isCash = bankName.toLowerCase().includes('cash');
                      return (
                        <option key={index} value={bankName}>
                          {isCash ? '💵' : '🏦'} {bankName}
                        </option>
                      );
                    })}
                  </select>
                  {selectedBank && (
                    <p className="text-xs text-blue-400 mt-2">
                      ✓ Selected: {selectedBank}
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
                    <div className="bg-slate-900/30 rounded-lg p-6 border border-slate-700/50 space-y-4">
                      {/* Bank Info Header */}
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isCash
                            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600'
                        }`}>
                          {isCash ? (
                            <Banknote className="w-6 h-6 text-white" />
                          ) : (
                            <Building2 className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-base font-semibold">{selectedBank}</p>
                          <p className="text-xs text-slate-400">{isCash ? 'Cash Account' : 'Bank Account'}</p>
                        </div>
                      </div>

                      {/* Previous Balance */}
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <label className="block text-xs text-slate-400 mb-1">Previous Balance</label>
                        <p className="text-slate-300 text-lg font-medium">
                          ฿{previousBalance.toLocaleString()}
                        </p>
                      </div>

                      {/* New Balance Input */}
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
                          New Balance <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">฿</span>
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
                            className={`w-full pl-10 pr-4 py-3.5 rounded-lg text-white text-base font-medium focus:outline-none focus:ring-2 transition-all ${
                              hasChanged
                                ? 'bg-blue-900/30 border-2 border-blue-500 focus:ring-blue-500/50'
                                : 'bg-slate-900 border border-slate-600 focus:border-blue-500 focus:ring-blue-500/30'
                            }`}
                            placeholder="Enter new balance amount"
                          />
                        </div>
                        {hasChanged && (
                          <p className="text-xs text-blue-400 mt-2">
                            ✓ Balance changed by ฿{Math.abs(entry.balance - previousBalance).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {/* Note Input */}
                      <div>
                        <label className="block text-sm font-semibold text-white mb-2">
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
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition-all"
                          placeholder="Add a note about this balance update..."
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Message when no bank selected */}
                {!selectedBank && (
                  <div className="bg-slate-800/30 rounded-lg p-8 border border-slate-700/50 text-center">
                    <Wallet className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">
                      Please select a bank account from the dropdown above to update its balance
                    </p>
                  </div>
                )}
                </div>
              )}

              {/* Reconciliation Summary */}
              {newBalances.some(b => b.balance > 0) && (
                <div className="border border-slate-700 rounded-lg p-4 bg-slate-900/50">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-blue-400" />
                    Money Tracking Reconciliation
                  </h3>
                  {(() => {
                    const recon = calculateReconciliation();
                    return (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Previous Total:</span>
                          <span className="text-white font-medium">฿{recon.oldTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-green-400">
                          <span>+ Revenue:</span>
                          <span className="font-medium">฿{recon.totalRevenue.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-400">
                          <span>- Expenses:</span>
                          <span className="font-medium">฿{recon.totalExpenses.toLocaleString()}</span>
                        </div>
                        <div className="border-t border-slate-700 my-2 pt-2 flex justify-between">
                          <span className="text-slate-400">Expected New Total:</span>
                          <span className="text-white font-medium">฿{recon.expectedNew.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Actual New Total:</span>
                          <span className="text-white font-medium">฿{recon.newTotal.toLocaleString()}</span>
                        </div>
                        <div className={`flex justify-between font-bold ${
                          recon.accountedFor ? 'text-green-400' : 'text-yellow-400'
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
                        <div className="text-center mt-3 p-3 rounded-lg bg-slate-800/50">
                          <p className={`text-lg font-bold ${
                            recon.accountedFor ? 'text-green-400' : 'text-yellow-400'
                          }`}>
                            {recon.accountedFor ? (
                              <>✓ 100% Money Tracked!</>
                            ) : (
                              <>⚠ {recon.percentageTracked}% Tracked</>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
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
              <div className="flex gap-4 pt-4 border-t border-slate-700/50">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg transition-all duration-200 text-white font-medium border border-slate-600"
                >
                  <XCircle className="w-5 h-5" />
                  Cancel
                </button>
                <button
                  onClick={handleSaveBalances}
                  disabled={uploading || !selectedBank}
                  className="flex-1 flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all duration-200 text-white font-semibold shadow-lg hover:shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
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
        <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 backdrop-blur-sm border border-yellow-700/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Alerts & Warnings</h2>
          </div>
          <div className="space-y-2">
            {cashBalance < 10000 && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <p>Cash balance is below ฿10,000</p>
              </div>
            )}
            {!lastUpdated && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <p>No recent balance updates</p>
              </div>
            )}
            {cashBalance >= 10000 && lastUpdated && (
              <p className="text-slate-400 text-sm">No warnings at this time</p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

