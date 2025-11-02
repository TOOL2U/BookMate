'use client';

import { Eye, Zap, TrendingUp, Activity, BarChart3, XCircle, RefreshCw } from 'lucide-react';
import { useState } from 'react';

interface FeatureTestsGridProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export default function FeatureTestsGrid({ onToast }: FeatureTestsGridProps) {
  // OCR Test
  const [isTestingOCR, setIsTestingOCR] = useState(false);
  const [ocrResponse, setOcrResponse] = useState('');
  const [ocrFile, setOcrFile] = useState<File | null>(null);

  // AI Extraction Test
  const [isTestingExtraction, setIsTestingExtraction] = useState(false);
  const [extractionResponse, setExtractionResponse] = useState('');
  const [extractionText, setExtractionText] = useState('');

  // Balance Tests
  const [isTestingBalance, setIsTestingBalance] = useState(false);
  const [balanceResponse, setBalanceResponse] = useState('');
  const [balanceFile, setBalanceFile] = useState<File | null>(null);

  // Property/Person Test
  const [isTestingPropertyPerson, setIsTestingPropertyPerson] = useState(false);
  const [propertyPersonResponse, setPropertyPersonResponse] = useState('');
  const [propertyPersonPeriod, setPropertyPersonPeriod] = useState<'month' | 'year'>('month');

  // Delete Entry Test
  const [isTestingDelete, setIsTestingDelete] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState('');
  const [deleteRowNumber, setDeleteRowNumber] = useState('');

  // Overhead Expenses Test
  const [isTestingOverhead, setIsTestingOverhead] = useState(false);
  const [overheadResponse, setOverheadResponse] = useState('');
  const [overheadPeriod, setOverheadPeriod] = useState<'month' | 'year'>('month');

  // Running Balance Test
  const [isTestingRunningBalance, setIsTestingRunningBalance] = useState(false);
  const [runningBalanceResponse, setRunningBalanceResponse] = useState('');

  // OCR Test Handler
  const handleTestOCR = async () => {
    if (!ocrFile) {
      onToast('Please select an image file', 'error');
      return;
    }

    setIsTestingOCR(true);
    setOcrResponse('Testing OCR...');

    try {
      const formData = new FormData();
      formData.append('file', ocrFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setOcrResponse(JSON.stringify(data, null, 2));

      if (data.text) {
        onToast('OCR test successful!', 'success');
      } else {
        onToast('OCR test completed with warnings', 'error');
      }
    } catch (error) {
      console.error('OCR test error:', error);
      setOcrResponse(`Error: ${error}`);
      onToast('OCR test failed', 'error');
    } finally {
      setIsTestingOCR(false);
    }
  };

  // AI Extraction Test Handler
  const handleTestExtraction = async () => {
    if (!extractionText.trim()) {
      onToast('Please enter OCR text to extract', 'error');
      return;
    }

    setIsTestingExtraction(true);
    setExtractionResponse('Testing AI extraction...');

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: extractionText }),
      });

      const data = await response.json();
      setExtractionResponse(JSON.stringify(data, null, 2));

      if (data.day && data.typeOfOperation) {
        onToast('AI extraction test successful!', 'success');
      } else {
        onToast('AI extraction completed with warnings', 'error');
      }
    } catch (error) {
      console.error('Extraction test error:', error);
      setExtractionResponse(`Error: ${error}`);
      onToast('AI extraction test failed', 'error');
    } finally {
      setIsTestingExtraction(false);
    }
  };

  // Balance Save Test Handler
  const handleTestBalanceSave = async () => {
    setIsTestingBalance(true);
    setBalanceResponse('Testing balance save...');

    try {
      const testData = {
        bankBalance: 50000,
        cashBalance: 5000,
        note: 'Admin panel test - ' + new Date().toISOString(),
      };

      const response = await fetch('/api/balance/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      setBalanceResponse(JSON.stringify(data, null, 2));

      if (data.success) {
        onToast('Balance save test successful!', 'success');
      } else {
        onToast('Balance save test failed', 'error');
      }
    } catch (error) {
      console.error('Balance save test error:', error);
      setBalanceResponse(`Error: ${error}`);
      onToast('Balance save test failed', 'error');
    } finally {
      setIsTestingBalance(false);
    }
  };

  // Balance Get Test Handler
  const handleTestBalanceGet = async () => {
    setIsTestingBalance(true);
    setBalanceResponse('Testing balance get...');

    try {
      const response = await fetch('/api/balance/get', {
        method: 'POST',
      });

      const data = await response.json();
      setBalanceResponse(JSON.stringify(data, null, 2));

      if (data.bankBalance !== undefined) {
        onToast('Balance get test successful!', 'success');
      } else {
        onToast('Balance get test failed', 'error');
      }
    } catch (error) {
      console.error('Balance get test error:', error);
      setBalanceResponse(`Error: ${error}`);
      onToast('Balance get test failed', 'error');
    } finally {
      setIsTestingBalance(false);
    }
  };

  // Balance OCR Test Handler
  const handleTestBalanceOCR = async () => {
    if (!balanceFile) {
      onToast('Please select a bank screenshot', 'error');
      return;
    }

    setIsTestingBalance(true);
    setBalanceResponse('Testing balance OCR...');

    try {
      const formData = new FormData();
      formData.append('file', balanceFile);

      const response = await fetch('/api/balance/ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setBalanceResponse(JSON.stringify(data, null, 2));

      if (data.balance !== undefined) {
        onToast('Balance OCR test successful!', 'success');
      } else {
        onToast('Balance OCR test completed with warnings', 'error');
      }
    } catch (error) {
      console.error('Balance OCR test error:', error);
      setBalanceResponse(`Error: ${error}`);
      onToast('Balance OCR test failed', 'error');
    } finally {
      setIsTestingBalance(false);
    }
  };

  // Property/Person Test Handler
  const handleTestPropertyPerson = async () => {
    setIsTestingPropertyPerson(true);
    setPropertyPersonResponse('Testing property/person details...');

    try {
      const response = await fetch('/api/pnl/property-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: propertyPersonPeriod }),
      });

      const data = await response.json();
      setPropertyPersonResponse(JSON.stringify(data, null, 2));

      if (data.ok) {
        onToast('Property/Person test successful!', 'success');
      } else {
        onToast('Property/Person test failed', 'error');
      }
    } catch (error) {
      console.error('Property/Person test error:', error);
      setPropertyPersonResponse(`Error: ${error}`);
      onToast('Property/Person test failed', 'error');
    } finally {
      setIsTestingPropertyPerson(false);
    }
  };

  // Delete Entry Test Handler
  const handleTestDelete = async () => {
    if (!deleteRowNumber.trim()) {
      onToast('Please enter a row number', 'error');
      return;
    }

    const rowNum = parseInt(deleteRowNumber);
    if (isNaN(rowNum) || rowNum < 2) {
      onToast('Please enter a valid row number (>= 2)', 'error');
      return;
    }

    setIsTestingDelete(true);
    setDeleteResponse('Testing delete entry...');

    try {
      const response = await fetch('/api/inbox', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rowNumber: rowNum }),
      });

      const data = await response.json();
      setDeleteResponse(JSON.stringify(data, null, 2));

      if (data.ok) {
        onToast('Delete test successful!', 'success');
      } else {
        onToast('Delete test failed', 'error');
      }
    } catch (error) {
      console.error('Delete test error:', error);
      setDeleteResponse(`Error: ${error}`);
      onToast('Delete test failed', 'error');
    } finally {
      setIsTestingDelete(false);
    }
  };

  // Overhead Expenses Test Handler
  const handleTestOverhead = async () => {
    setIsTestingOverhead(true);
    setOverheadResponse('Testing overhead expenses details...');

    try {
      const response = await fetch('/api/pnl/overhead-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period: overheadPeriod }),
      });

      const data = await response.json();
      setOverheadResponse(JSON.stringify(data, null, 2));

      if (data.ok) {
        onToast('Overhead expenses test successful!', 'success');
      } else {
        onToast('Overhead expenses test failed', 'error');
      }
    } catch (error) {
      console.error('Overhead expenses test error:', error);
      setOverheadResponse(`Error: ${error}`);
      onToast('Overhead expenses test failed', 'error');
    } finally {
      setIsTestingOverhead(false);
    }
  };

  // Running Balance Test Handler
  const handleTestRunningBalance = async () => {
    setIsTestingRunningBalance(true);
    setRunningBalanceResponse('Testing running balance calculation...');

    try {
      const response = await fetch('/api/balance/by-property', {
        method: 'POST',
      });

      const data = await response.json();
      setRunningBalanceResponse(JSON.stringify(data, null, 2));

      if (data.ok) {
        onToast('Running balance test successful!', 'success');
      } else {
        onToast('Running balance test failed', 'error');
      }
    } catch (error) {
      console.error('Running balance test error:', error);
      setRunningBalanceResponse(`Error: ${error}`);
      onToast('Running balance test failed', 'error');
    } finally {
      setIsTestingRunningBalance(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* OCR Test Card */}
      <TestCard
        icon={Eye}
        title="OCR Test"
        description="Test Google Vision API"
        color="purple"
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setOcrFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 cursor-pointer"
        />
        <button
          onClick={handleTestOCR}
          disabled={isTestingOCR || !ocrFile}
          className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isTestingOCR ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4" />
              Test OCR
            </>
          )}
        </button>
        {ocrResponse && (
          <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
            {ocrResponse}
          </pre>
        )}
      </TestCard>

      {/* AI Extraction Test Card */}
      <TestCard
        icon={Zap}
        title="AI Extraction Test"
        description="Test OpenAI GPT-4o"
        color="green"
      >
        <textarea
          value={extractionText}
          onChange={(e) => setExtractionText(e.target.value)}
          placeholder="Paste OCR text here..."
          className="w-full h-24 px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        />
        <button
          onClick={handleTestExtraction}
          disabled={isTestingExtraction || !extractionText.trim()}
          className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isTestingExtraction ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Test Extraction
            </>
          )}
        </button>
        {extractionResponse && (
          <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
            {extractionResponse}
          </pre>
        )}
      </TestCard>

      {/* Balance Tests Card */}
      <TestCard
        icon={TrendingUp}
        title="Balance Tests"
        description="Test balance feature"
        color="orange"
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleTestBalanceSave}
            disabled={isTestingBalance}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200"
          >
            {isTestingBalance ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Save'}
          </button>
          <button
            onClick={handleTestBalanceGet}
            disabled={isTestingBalance}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200"
          >
            {isTestingBalance ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : 'Get'}
          </button>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 block">Bank Screenshot OCR:</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setBalanceFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-500/10 file:text-blue-500 hover:file:bg-blue-500/20 cursor-pointer mb-2"
          />
          <button
            onClick={handleTestBalanceOCR}
            disabled={isTestingBalance || !balanceFile}
            className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isTestingBalance ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                Test OCR
              </>
            )}
          </button>
        </div>

        {balanceResponse && (
          <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
            {balanceResponse}
          </pre>
        )}
      </TestCard>

      {/* Property/Person Test Card */}
      <TestCard
        icon={Activity}
        title="Property/Person Test"
        description="Test expense breakdown"
        color="blue"
      >
        <select
          value={propertyPersonPeriod}
          onChange={(e) => setPropertyPersonPeriod(e.target.value as 'month' | 'year')}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <button
          onClick={handleTestPropertyPerson}
          disabled={isTestingPropertyPerson}
          className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isTestingPropertyPerson ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <Activity className="w-4 h-4" />
              Test
            </>
          )}
        </button>
        {propertyPersonResponse && (
          <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
            {propertyPersonResponse}
          </pre>
        )}
      </TestCard>

      {/* Overhead Expenses Test Card */}
      <TestCard
        icon={BarChart3}
        title="Overhead Expenses Test"
        description="Test overhead expenses breakdown (V7.1)"
        color="orange"
      >
        <select
          value={overheadPeriod}
          onChange={(e) => setOverheadPeriod(e.target.value as 'month' | 'year')}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
        >
          <option value="month">Month</option>
          <option value="year">Year</option>
        </select>
        <button
          onClick={handleTestOverhead}
          disabled={isTestingOverhead}
          className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isTestingOverhead ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <BarChart3 className="w-4 h-4" />
              Test Overhead
            </>
          )}
        </button>
        {overheadResponse && (
          <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
            {overheadResponse}
          </pre>
        )}
      </TestCard>

      {/* Running Balance Test Card */}
      <TestCard
        icon={TrendingUp}
        title="Running Balance Test"
        description="Test running balance calculation"
        color="green"
      >
        <button
          onClick={handleTestRunningBalance}
          disabled={isTestingRunningBalance}
          className="w-full px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600/50 rounded-lg text-white text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isTestingRunningBalance ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Test Running Balance
            </>
          )}
        </button>
        {runningBalanceResponse && (
          <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
            {runningBalanceResponse}
          </pre>
        )}
      </TestCard>

      {/* Delete Entry Test Card - Full Width */}
      <div className="lg:col-span-2 xl:col-span-3">
        <TestCard
          icon={XCircle}
          title="Delete Entry Test"
          description="Test entry deletion (use with caution)"
          color="red"
        >
          <input
            type="number"
            value={deleteRowNumber}
            onChange={(e) => setDeleteRowNumber(e.target.value)}
            placeholder="Row number (e.g., 10)"
            min="2"
            className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            onClick={handleTestDelete}
            disabled={isTestingDelete || !deleteRowNumber.trim()}
            className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/50 rounded-lg text-red-400 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isTestingDelete ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                Test Delete
              </>
            )}
          </button>
          {deleteResponse && (
            <pre className="text-xs bg-slate-900/50 p-3 rounded-lg overflow-auto max-h-40 text-slate-400">
              {deleteResponse}
            </pre>
          )}
        </TestCard>
      </div>
    </div>
  );
}

// Helper component for test cards
interface TestCardProps {
  icon: any;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  children: React.ReactNode;
}

function TestCard({ icon: Icon, title, description, color, children }: TestCardProps) {
  const colorClasses = {
    blue: 'from-blue-500/20 to-purple-500/20 text-blue-500',
    green: 'from-green-500/20 to-blue-500/20 text-green-500',
    orange: 'from-orange-500/20 to-blue-500/20 text-orange-500',
    purple: 'from-purple-500/20 to-blue-500/20 text-purple-500',
    red: 'from-red-500/20 to-blue-500/20 text-red-500'
  };

  const [gradientClass, iconColorClass] = colorClasses[color].split(' text-');

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 bg-gradient-to-br ${gradientClass} rounded-xl`}>
          <Icon className={`w-6 h-6 text-${iconColorClass}`} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>

      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

