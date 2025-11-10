'use client';

import { ReportData } from '@/lib/reports/generators';
import { TrendingUp, TrendingDown, DollarSign, Wallet } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import LogoBM from '@/components/LogoBM';
import { AIInsightsOutput } from '@/lib/reports/ai-insights';

interface ReportPreviewProps {
  reportData: ReportData;
  aiInsights?: AIInsightsOutput | null;
  isLoadingAI?: boolean;
}


const BRAND_COLORS = {
  yellow: '#FFF02B',
  green: '#10B981',
  red: '#EF4444',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  pink: '#EC4899',
  cyan: '#06B6D4',
};

const CHART_COLORS = [
  BRAND_COLORS.yellow,
  BRAND_COLORS.blue,
  BRAND_COLORS.green,
  BRAND_COLORS.purple,
  BRAND_COLORS.orange,
  BRAND_COLORS.pink,
  BRAND_COLORS.cyan,
  BRAND_COLORS.red,
];

export default function ReportPreview({ reportData, aiInsights, isLoadingAI }: ReportPreviewProps) {
  const { period, summary, revenue, expenses, balances, currency = 'THB', exchangeRate } = reportData;

  // Format currency based on selected currency
  const formatCurrency = (value: number) => {
    const currencyCode = currency === 'USD' ? 'USD' : 'THB';
    const currencySymbol = currency === 'USD' ? '$' : '฿';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    }).format(value).replace(currencyCode, currencySymbol);
  };

  // Prepare chart data
  const summaryChartData = [
    { name: 'Revenue', value: summary.totalRevenue, color: BRAND_COLORS.green },
    { name: 'Expenses', value: (expenses.overheadTotal || 0) + (expenses.propertyPersonTotal || 0), color: BRAND_COLORS.red },
  ];

  const expenseChartData = [
    // Show ALL overhead expenses in chart (no slicing)
    ...expenses.overhead.map((e, i) => ({
      name: e.category,
      value: e.amount,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })),
    // Add property/person expenses too
    ...expenses.propertyPerson.map((e, i) => ({
      name: e.category,
      value: e.amount,
      color: CHART_COLORS[(i + expenses.overhead.length) % CHART_COLORS.length],
    })),
  ];

  const balanceChartData = balances.byAccount.slice(0, 10).map((b, i) => ({
    name: b.accountName,
    balance: b.balance,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  return (
    <div 
      id="report-preview"
      className="report-export-root max-w-full"
      style={{
        backgroundColor: '#FFFFFF',
        color: '#111827',
        width: '100%', // Full width on mobile
        maxWidth: '1240px', // Cap at 1240px on desktop
        padding: '0',
        margin: '0 auto', // Center on desktop
      }}
    >
      {/* Report Header - Enhanced */}
      <div className="p-4 sm:p-8 lg:p-12 border-b-2 sm:border-b-4" style={{ 
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #2d2d2d 100%)',
        borderBottomColor: '#FFF02B',
        color: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-4 sm:mb-8">
          <div className="flex justify-center sm:justify-start">
            <LogoBM size={60} className="sm:w-20 sm:h-20" />
          </div>
          <div className="text-center sm:text-right">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bebasNeue uppercase tracking-wider mb-2 sm:mb-3 leading-tight" style={{ 
              color: '#ffffff',
              letterSpacing: '0.05em'
            }}>
              Financial Performance
            </h1>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bebasNeue uppercase mb-2" style={{ 
              color: '#FFF02B',
              letterSpacing: '0.1em'
            }}>
              #REPORT
            </h2>
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg inline-block" style={{ backgroundColor: 'rgba(255, 240, 43, 0.1)' }}>
              <p className="text-lg sm:text-xl lg:text-2xl font-bebasNeue uppercase" style={{ color: '#FFF02B' }}>
                {period.label}
              </p>
              <p className="text-sm sm:text-base font-aileron mt-1" style={{ color: '#D1D5DB' }}>
                {period.start} — {period.end}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 pt-3 sm:pt-4 border-t" style={{ borderTopColor: 'rgba(255, 240, 43, 0.2)' }}>
          <div className="text-xs sm:text-sm font-aileron text-center sm:text-left" style={{ color: '#9CA3AF' }}>
            Generated: {new Date(reportData.generatedAt).toLocaleString('en-US', { 
              dateStyle: 'long', 
              timeStyle: 'short' 
            })}
          </div>
          <div className="text-xs font-aileron px-4 py-2 rounded-xl2" style={{ 
            backgroundColor: 'rgba(255, 240, 43, 0.15)',
            color: '#FFF02B',
            border: '1px solid rgba(255, 240, 43, 0.3)'
          }}>
            CONFIDENTIAL
          </div>
        </div>
      </div>

      {/* Currency Information Banner */}
      {currency === 'USD' && exchangeRate && (
        <div className="p-3 sm:p-4 border-b" style={{ 
          backgroundColor: '#FEF3C7',
          borderBottomColor: '#E5E7EB'
        }}>
          <div className="flex items-center justify-center gap-2">
            <DollarSign className="w-4 h-4" style={{ color: '#92400E' }} />
            <p className="text-xs sm:text-sm font-aileron text-center" style={{ color: '#92400E' }}>
              <strong>Currency:</strong> USD • Exchange Rate: 1 USD = {exchangeRate} THB • All amounts converted from Thai Baht
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Row - Enhanced & Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 p-4 sm:p-6 lg:p-10 border-b" style={{ 
        backgroundColor: '#F9FAFB',
        borderBottomColor: '#E5E7EB'
      }}>
        <KPICard
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon={<DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="green"
        />
        <KPICard
          title="Total Expenses"
          value={formatCurrency((expenses.overheadTotal || 0) + (expenses.propertyPersonTotal || 0))}
          icon={<TrendingDown className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="red"
          subtitle={`Overhead: ${formatCurrency(expenses.overheadTotal || 0)}`}
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(summary.netProfit)}
          icon={summary.netProfit >= 0 ? <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8" /> : <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8" />}
          color={summary.netProfit >= 0 ? 'green' : 'red'}
          subtitle={`${summary.profitMargin.toFixed(1)}% margin`}
        />
        <KPICard
          title="Cash Position"
          value={formatCurrency(summary.cashPosition)}
          icon={<Wallet className="w-6 h-6 sm:w-8 sm:h-8" />}
          color="blue"
        />
      </div>

      {/* AI Insights Section - Enhanced & Responsive */}
      {(aiInsights || isLoadingAI) && (
        <div className="p-4 sm:p-6 lg:p-10 border-b-2" style={{ 
          background: 'linear-gradient(135deg, rgba(255, 240, 43, 0.05) 0%, rgba(255, 240, 43, 0.15) 100%)',
          borderBottomColor: '#E5E7EB'
        }}>
          <h2 className="text-2xl sm:text-3xl font-bebasNeue uppercase mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3" style={{ color: '#111827' }}>
            <span className="w-1 sm:w-2 h-8 sm:h-10 rounded-xl2" style={{ backgroundColor: '#FFF02B' }}></span>
            AI-Powered Insights
          </h2>

          {isLoadingAI ? (
            <div className="space-y-4 sm:space-y-6">
              <div className="h-20 sm:h-24 bg-gray-200 animate-pulse rounded-xl2"></div>
              <div className="h-20 sm:h-24 bg-gray-200 animate-pulse rounded-xl2"></div>
              <div className="h-20 sm:h-24 bg-gray-200 animate-pulse rounded-xl2"></div>
            </div>
          ) : aiInsights ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              <InsightSection
                title="Executive Summary"
                points={aiInsights.executiveSummary}
                icon="📊"
              />
              <InsightSection
                title="Key Trends"
                points={aiInsights.keyTrends}
                icon="📈"
              />
              <InsightSection
                title="Risks & Considerations"
                points={aiInsights.risks}
                icon="⚠️"
                color="red"
              />
              <InsightSection
                title="Opportunities"
                points={aiInsights.opportunities}
                icon="💡"
                color="green"
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Charts Section - Enhanced & Responsive */}
      <div className="p-4 sm:p-6 lg:p-10 space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Revenue vs Expenses */}
        <div className="bg-white rounded-xl2 p-4 sm:p-6 lg:p-8 border-2 border-gray-200" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-bebasNeue uppercase mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3" style={{ color: '#111827' }}>
            <span className="w-1 sm:w-2 h-8 sm:h-10 rounded-xl2" style={{ backgroundColor: '#FFF02B' }}></span>
            Balance of Expenses
          </h3>
          {/* Mobile: 300px, Tablet: 350px, Desktop: 400px */}
          <div className="h-[300px] sm:h-[350px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeWidth={1.5} />
                <XAxis 
                  dataKey="name" 
                  stroke="#374151" 
                  style={{ fontFamily: 'Aileron', fontSize: '12px', fontWeight: '500' }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#374151" 
                  style={{ fontFamily: 'Aileron', fontSize: '11px', fontWeight: '500' }}
                  tickLine={false}
                  tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')}
                  width={55}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111827',
                    border: '2px solid #FFF02B',
                    borderRadius: '12px',
                    color: 'white',
                    fontFamily: 'Aileron',
                    fontSize: '12px',
                    padding: '8px 12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                  }}
                  formatter={(value: number) => [formatCurrency(value), '']}
                  labelStyle={{ color: '#FFF02B', fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={60}>
                  {summaryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Balance Information - Enhanced & Responsive */}
      {reportData.balances.byAccount.length > 0 && (
        <div className="p-4 sm:p-6 lg:p-10" style={{ backgroundColor: '#F9FAFB' }}>
          <h2 className="text-2xl sm:text-3xl font-bebasNeue uppercase mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3" style={{ color: '#111827' }}>
            <span className="w-1 sm:w-2 h-8 sm:h-10 rounded-xl2" style={{ backgroundColor: '#FFF02B' }}></span>
            Detailed Account Balances
          </h2>
          
          {/* Balance Summary Cards - Enhanced & Responsive */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2 border-gray-300" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#6B7280' }}>Opening Balance</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold font-bebasNeue" style={{ color: '#111827' }}>
                {formatCurrency(reportData.balances.totalOpening || 0)}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#6EE7B7',
              backgroundColor: '#D1FAE5',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#065F46' }}>Total Inflow</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold font-bebasNeue" style={{ color: '#047857' }}>
                +{formatCurrency(reportData.balances.totalInflow || 0)}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#FCA5A5',
              backgroundColor: '#FEE2E2',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#991B1B' }}>Total Outflow</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold font-bebasNeue" style={{ color: '#DC2626' }}>
                -{formatCurrency(reportData.balances.totalOutflow || 0)}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#93C5FD',
              backgroundColor: '#DBEAFE',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#1E3A8A' }}>Current Balance</p>
              <p className="text-base sm:text-xl lg:text-2xl font-bold font-bebasNeue" style={{ color: '#1E40AF' }}>
                {formatCurrency(reportData.balances.total)}
              </p>
            </div>
          </div>

          {/* Detailed Balance Table - Enhanced & Responsive */}
          <div className="rounded-xl2 overflow-x-auto border-2 border-gray-200" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <table className="w-full bg-white min-w-[800px]">
              <thead style={{ backgroundColor: '#111827', color: '#ffffff' }}>
                <tr>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-left font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Account</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Opening</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Inflow</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Outflow</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Net Change</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Current Balance</th>
                  <th className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center font-bebasNeue text-sm sm:text-base lg:text-lg uppercase tracking-wide">Type</th>
                </tr>
              </thead>
              <tbody className="font-aileron">
                {balances.byAccount.map((account, index) => (
                  <tr key={index} style={{ 
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#F9FAFB',
                    borderBottom: '1px solid #E5E7EB'
                  }}>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 font-semibold text-sm sm:text-base" style={{ color: '#111827' }}>{account.accountName}</td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right text-xs sm:text-sm lg:text-base whitespace-nowrap" style={{ color: '#6B7280' }}>
                      {formatCurrency(account.openingBalance || 0)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right text-xs sm:text-sm lg:text-base font-medium whitespace-nowrap" style={{ color: '#047857' }}>
                      {formatCurrency(account.inflow || 0)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right text-xs sm:text-sm lg:text-base font-medium whitespace-nowrap" style={{ color: '#DC2626' }}>
                      {formatCurrency(account.outflow || 0)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bold text-xs sm:text-sm lg:text-base whitespace-nowrap" style={{ 
                      color: (account.netChange || 0) >= 0 ? '#047857' : '#DC2626' 
                    }}>
                      {(account.netChange || 0) >= 0 ? '+' : ''}{formatCurrency(account.netChange || 0)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-right font-bold text-sm sm:text-base lg:text-lg whitespace-nowrap" style={{ color: '#111827' }}>
                      {formatCurrency(account.currentBalance || account.balance)}
                    </td>
                    <td className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5 text-center">
                      <span className="px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-xl2 text-xs font-bold uppercase tracking-wider" style={{
                        backgroundColor: account.type === 'cash' ? '#FEF3C7' : '#DBEAFE',
                        color: account.type === 'cash' ? '#92400E' : '#1E40AF',
                        border: `2px solid ${account.type === 'cash' ? '#FCD34D' : '#93C5FD'}`
                      }}>
                        {account.type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Statistics - Enhanced & Responsive */}
      {reportData.transactionStats && (
        <div className="p-4 sm:p-6 lg:p-10">
          <h2 className="text-2xl sm:text-3xl font-bebasNeue uppercase mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3" style={{ color: '#111827' }}>
            <span className="w-1 sm:w-2 h-8 sm:h-10 rounded-xl2" style={{ backgroundColor: '#FFF02B' }}></span>
            Transaction Summary
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2 border-gray-200" style={{ boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)' }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#6B7280' }}>Total Transactions</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-bebasNeue" style={{ color: '#111827' }}>
                {reportData.transactionStats.totalCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#6EE7B7',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#065F46' }}>Income Entries</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-bebasNeue" style={{ color: '#047857' }}>
                {reportData.transactionStats.incomeCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#FCA5A5',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#991B1B' }}>Expense Entries</p>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold font-bebasNeue" style={{ color: '#DC2626' }}>
                {reportData.transactionStats.expenseCount.toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#6EE7B7',
              backgroundColor: '#D1FAE5',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#065F46' }}>Total Credits</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold font-bebasNeue" style={{ color: '#047857' }}>
                {formatCurrency(reportData.transactionStats.totalCredits)}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: '#FCA5A5',
              backgroundColor: '#FEE2E2',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ color: '#991B1B' }}>Total Debits</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold font-bebasNeue" style={{ color: '#DC2626' }}>
                {formatCurrency(reportData.transactionStats.totalDebits)}
              </p>
            </div>
            <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl2 border-2" style={{ 
              borderColor: reportData.transactionStats.netPosition >= 0 ? '#6EE7B7' : '#FCA5A5',
              backgroundColor: reportData.transactionStats.netPosition >= 0 ? '#D1FAE5' : '#FEE2E2',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1 sm:mb-2" style={{ 
                color: reportData.transactionStats.netPosition >= 0 ? '#065F46' : '#991B1B' 
              }}>Net Position</p>
              <p className="text-base sm:text-lg lg:text-xl font-bold font-bebasNeue" style={{ 
                color: reportData.transactionStats.netPosition >= 0 ? '#047857' : '#DC2626' 
              }}>
                {formatCurrency(reportData.transactionStats.netPosition)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Expense Breakdown - Enhanced & Responsive */}
      {(expenses.overhead.length > 0 || expenses.propertyPerson.length > 0) && (
        <div className="p-4 sm:p-6 lg:p-10" style={{ backgroundColor: '#F9FAFB' }}>
          <h2 className="text-2xl sm:text-3xl font-bebasNeue uppercase mb-4 sm:mb-6 lg:mb-8 flex items-center gap-2 sm:gap-3" style={{ color: '#111827' }}>
            <span className="w-1 sm:w-2 h-8 sm:h-10 rounded-xl2" style={{ backgroundColor: '#FFF02B' }}></span>
            Complete Expense Breakdown
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
            {/* Overhead Expenses - Enhanced & Responsive */}
            {expenses.overhead.length > 0 && (
              <div className="bg-white rounded-xl2 border-2 border-gray-200 overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div className="p-4 sm:p-5 lg:p-6 border-b-2" style={{ 
                  backgroundColor: '#FEF3C7',
                  borderBottomColor: '#FCD34D'
                }}>
                  <h3 className="text-xl sm:text-2xl font-bebasNeue uppercase tracking-wide" style={{ color: '#92400E' }}>
                    Overhead Expenses
                  </h3>
                  <p className="font-bold mt-2 font-bebasNeue text-xl sm:text-2xl" style={{ color: '#78350F' }}>
                    {formatCurrency(expenses.overheadTotal || expenses.overhead.reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                </div>
                <div className="divide-y-2 divide-gray-100">
                  {expenses.overhead.map((expense, i) => (
                    <div key={i} className="p-3 sm:p-4 lg:p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base" style={{ color: '#111827' }}>{expense.category}</p>
                        <p className="text-xs sm:text-sm mt-1 font-medium" style={{ color: '#9CA3AF' }}>
                          {expense.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-bebasNeue text-lg sm:text-xl lg:text-2xl" style={{ color: '#DC2626' }}>
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 sm:p-5 lg:p-6 border-t-4 border-gray-300" style={{ backgroundColor: '#FEF2F2' }}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold font-bebasNeue uppercase text-base sm:text-lg lg:text-xl tracking-wide" style={{ color: '#111827' }}>Subtotal</p>
                    <p className="font-bold font-bebasNeue text-xl sm:text-2xl lg:text-3xl" style={{ color: '#DC2626' }}>
                      {formatCurrency(expenses.overheadTotal || expenses.overhead.reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Property/Person Expenses - Enhanced & Responsive */}
            {expenses.propertyPerson.length > 0 && (
              <div className="bg-white rounded-xl2 border-2 border-gray-200 overflow-hidden" style={{ boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                <div className="p-4 sm:p-5 lg:p-6 border-b-2" style={{ 
                  backgroundColor: '#DBEAFE',
                  borderBottomColor: '#93C5FD'
                }}>
                  <h3 className="text-xl sm:text-2xl font-bebasNeue uppercase tracking-wide" style={{ color: '#1E40AF' }}>
                    Property / Person Expenses
                  </h3>
                  <p className="font-bold mt-2 font-bebasNeue text-xl sm:text-2xl" style={{ color: '#1E3A8A' }}>
                    {formatCurrency(expenses.propertyPersonTotal || expenses.propertyPerson.reduce((sum, e) => sum + e.amount, 0))}
                  </p>
                </div>
                <div className="divide-y-2 divide-gray-100">
                  {expenses.propertyPerson.map((expense, i) => (
                    <div key={i} className="p-3 sm:p-4 lg:p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <p className="font-semibold text-sm sm:text-base" style={{ color: '#111827' }}>{expense.category}</p>
                        <p className="text-xs sm:text-sm mt-1 font-medium" style={{ color: '#9CA3AF' }}>
                          {expense.percentage.toFixed(1)}% of total
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-bebasNeue text-lg sm:text-xl lg:text-2xl" style={{ color: '#DC2626' }}>
                          {formatCurrency(expense.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 sm:p-5 lg:p-6 border-t-4 border-gray-300" style={{ backgroundColor: '#FEF2F2' }}>
                  <div className="flex justify-between items-center">
                    <p className="font-bold font-bebasNeue uppercase text-base sm:text-lg lg:text-xl tracking-wide" style={{ color: '#111827' }}>Subtotal</p>
                    <p className="font-bold font-bebasNeue text-xl sm:text-2xl lg:text-3xl" style={{ color: '#DC2626' }}>
                      {formatCurrency(expenses.propertyPersonTotal || expenses.propertyPerson.reduce((sum, e) => sum + e.amount, 0))}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Grand Total - Enhanced & Responsive */}
          <div className="mt-4 sm:mt-6 lg:mt-8 rounded-xl2 p-4 sm:p-6 lg:p-8 border-4" style={{ 
            background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
            borderColor: '#FFF02B',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
          }}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
              <div>
                <p className="text-base sm:text-lg lg:text-xl font-bold font-bebasNeue uppercase tracking-wider mb-1 sm:mb-2" style={{ color: '#FFF02B' }}>
                  TOTAL EXPENSES
                </p>
                <p className="text-xs sm:text-sm font-medium" style={{ color: '#9CA3AF' }}>
                  {expenses.overhead.length} overhead + {expenses.propertyPerson.length} property/person categories
                </p>
              </div>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-bold font-bebasNeue" style={{ color: '#FFF02B' }}>
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer - Enhanced & Responsive */}
      <div className="p-4 sm:p-6 lg:p-8 text-center border-t-4" style={{ 
        background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
        color: '#ffffff',
        borderTopColor: '#FFF02B'
      }}>
        <div className="mb-2 sm:mb-3">
          <LogoBM size={40} />
        </div>
        <p className="text-base sm:text-lg font-bebasNeue uppercase tracking-wider" style={{ color: '#FFF02B' }}>
          BookMate Financial Analytics Platform
        </p>
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-aileron" style={{ color: '#9CA3AF' }}>
          Confidential — For Internal Use Only
        </p>
        <p className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-aileron" style={{ color: '#6B7280' }}>
          © {new Date().getFullYear()} BookMate. All rights reserved.
        </p>
      </div>
    </div>
  );
}

// KPI Card Component - Enhanced
function KPICard({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'yellow';
  subtitle?: string;
}) {
  const colorClasses = {
    green: { bg: '#D1FAE5', text: '#047857', border: '#6EE7B7' },
    red: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
    blue: { bg: '#DBEAFE', text: '#1E40AF', border: '#93C5FD' },
    yellow: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
  };

  return (
    <div 
      className="bg-white p-8 rounded-xl2 border-2 transition-all hover:shadow-lg" 
      style={{ 
        borderColor: colorClasses[color].border,
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-base font-semibold font-aileron uppercase tracking-wide" style={{ color: '#6B7280' }}>
          {title}
        </p>
        <div 
          className="p-3 rounded-xl" 
          style={{ 
            backgroundColor: colorClasses[color].bg,
            color: colorClasses[color].text
          }}
        >
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold font-bebasNeue mb-1" style={{ color: '#111827' }}>{value}</p>
      {subtitle && (
        <p className="text-sm font-medium font-aileron mt-2" style={{ color: '#9CA3AF' }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// Insight Section Component - Enhanced
function InsightSection({
  title,
  points,
  icon,
  color = 'blue',
}: {
  title: string;
  points: string[];
  icon: string;
  color?: 'blue' | 'green' | 'red' | 'yellow';
}) {
  const colorStyles = {
    blue: { borderColor: '#93C5FD', backgroundColor: '#EFF6FF', titleColor: '#1E40AF' },
    green: { borderColor: '#6EE7B7', backgroundColor: '#F0FDF4', titleColor: '#047857' },
    red: { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2', titleColor: '#DC2626' },
    yellow: { borderColor: '#FCD34D', backgroundColor: '#FEFCE8', titleColor: '#D97706' },
  };

  return (
    <div 
      className="p-8 rounded-xl2 border-2" 
      style={{
        ...colorStyles[color],
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}
    >
      <h3 className="font-bebasNeue text-2xl uppercase mb-6 flex items-center gap-3" style={{ color: colorStyles[color].titleColor }}>
        <span className="text-3xl">{icon}</span>
        {title}
      </h3>
      <ul className="space-y-4">
        {points.map((point, i) => (
          <li key={i} className="text-base flex items-start gap-3 font-aileron" style={{ color: '#374151' }}>
            <span className="font-bold text-xl mt-0.5" style={{ color: '#FFF02B' }}>•</span>
            <span className="leading-relaxed">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
