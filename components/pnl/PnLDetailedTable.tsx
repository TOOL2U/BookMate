'use client';

interface PnLPeriodData {
  revenue: number;
  overheads: number;
  propertyPersonExpense: number;
  gop: number;
  ebitdaMargin: number;
}

interface PnLDetailedTableProps {
  monthData: PnLPeriodData | null;
  yearData: PnLPeriodData | null;
  isLoading: boolean;
}

interface TableRow {
  category: string;
  monthValue: number;
  yearValue: number;
  type: 'revenue' | 'expense' | 'profit' | 'margin' | 'header';
  indent?: boolean;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculatePercentage(value: number, revenue: number): string {
  if (revenue === 0) return '0.0';
  return ((value / revenue) * 100).toFixed(1);
}

export default function PnLDetailedTable({ monthData, yearData, isLoading }: PnLDetailedTableProps) {
  if (isLoading) {
    return (
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl p-6">
        <div className="space-y-4">
          <div className="h-6 bg-border-card rounded w-1/3 animate-pulse" />
          <div className="h-96 bg-border-card rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Build table rows from data
  const rows: TableRow[] = [
    // Revenue Section
    { category: 'REVENUE', monthValue: 0, yearValue: 0, type: 'header' },
    { category: 'Total Revenue', monthValue: monthData?.revenue || 0, yearValue: yearData?.revenue || 0, type: 'revenue', indent: true },
    
    // Expenses Section
    { category: 'EXPENSES', monthValue: 0, yearValue: 0, type: 'header' },
    { category: 'Overheads', monthValue: monthData?.overheads || 0, yearValue: yearData?.overheads || 0, type: 'expense', indent: true },
    { category: 'Property/Person Expenses', monthValue: monthData?.propertyPersonExpense || 0, yearValue: yearData?.propertyPersonExpense || 0, type: 'expense', indent: true },
    // Note: Total Expenses row removed - we don't add these together
    
    // Profit Section
    { category: 'PROFITABILITY', monthValue: 0, yearValue: 0, type: 'header' },
    { category: 'Gross Operating Profit (GOP)', monthValue: monthData?.gop || 0, yearValue: yearData?.gop || 0, type: 'profit', indent: true },
    { category: 'EBITDA Margin', monthValue: monthData?.ebitdaMargin || 0, yearValue: yearData?.ebitdaMargin || 0, type: 'margin', indent: true },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div>
        <h2 className="font-bebasNeue text-3xl text-text-primary uppercase tracking-wide mb-2">Detailed P&L Breakdown</h2>
        <p className="font-aileron text-text-secondary">Complete financial statement with all line items</p>
      </div>

      {/* Table Container */}
      <div className="bg-bg-card backdrop-blur-sm border border-border-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header - Sticky */}
            <thead className="bg-black/80 sticky top-0 z-10">
              <tr className="border-b border-border-card">
                <th className="font-bebasNeue text-left py-4 px-6 text-sm text-text-primary uppercase tracking-wider">
                  Category
                </th>
                <th className="font-bebasNeue text-right py-4 px-6 text-sm text-text-primary uppercase tracking-wider">
                  This Month (THB)
                </th>
                <th className="font-bebasNeue text-right py-4 px-6 text-sm text-text-primary uppercase tracking-wider">
                  Year to Date (THB)
                </th>
                <th className="font-bebasNeue text-right py-4 px-6 text-sm text-text-primary uppercase tracking-wider">
                  % of Revenue
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {rows.map((row, index) => {
                const isHeader = row.type === 'header';
                const isProfit = row.type === 'profit';
                const isMargin = row.type === 'margin';
                const isExpense = row.type === 'expense';
                const isRevenue = row.type === 'revenue';

                // Calculate percentage of revenue
                const monthPercent = row.type !== 'header' && row.type !== 'margin' 
                  ? calculatePercentage(row.monthValue, monthData?.revenue || 0)
                  : row.type === 'margin' ? row.monthValue.toFixed(1) : '-';
                
                const yearPercent = row.type !== 'header' && row.type !== 'margin'
                  ? calculatePercentage(row.yearValue, yearData?.revenue || 0)
                  : row.type === 'margin' ? row.yearValue.toFixed(1) : '-';

                return (
                  <tr 
                    key={index}
                    className={`
                      border-b border-border-card
                      ${isHeader ? 'bg-black/50' : 'hover:bg-black/20'}
                      transition-colors
                    `}
                  >
                    {/* Category Name */}
                    <td className={`
                      py-4 px-6
                      ${isHeader ? 'font-bebasNeue text-white text-sm uppercase tracking-wider' : 'font-aileron text-text-primary'}
                      ${row.indent ? 'pl-12' : ''}
                      ${isProfit || isMargin ? 'font-madeMirage' : ''}
                    `}>
                      {row.category}
                    </td>

                    {/* Month Value */}
                    <td className={`
                      py-4 px-6 text-right font-mono
                      ${isHeader ? 'font-aileron text-text-secondary' : ''}
                      ${isProfit ? 'font-madeMirage text-green-400' : ''}
                      ${isMargin ? 'font-madeMirage text-blue-400' : ''}
                      ${isExpense ? 'text-red-400' : ''}
                      ${isRevenue ? 'text-green-400' : ''}
                      ${!isHeader && !isProfit && !isMargin && !isExpense && !isRevenue ? 'text-white' : ''}
                    `}>
                      {isHeader ? '-' : isMargin ? `${row.monthValue.toFixed(1)}%` : `฿${formatCurrency(row.monthValue)}`}
                    </td>

                    {/* Year Value */}
                    <td className={`
                      py-4 px-6 text-right font-mono
                      ${isHeader ? 'font-aileron text-text-secondary' : ''}
                      ${isProfit ? 'font-madeMirage text-green-400' : ''}
                      ${isMargin ? 'font-madeMirage text-blue-400' : ''}
                      ${isExpense ? 'text-red-400' : ''}
                      ${isRevenue ? 'text-green-400' : ''}
                      ${!isHeader && !isProfit && !isMargin && !isExpense && !isRevenue ? 'text-white' : ''}
                    `}>
                      {isHeader ? '-' : isMargin ? `${row.yearValue.toFixed(1)}%` : `฿${formatCurrency(row.yearValue)}`}
                    </td>

                    {/* Percentage */}
                    <td className={`
                      py-4 px-6 text-right font-mono text-text-secondary
                      ${isHeader ? 'text-text-secondary' : ''}
                    `}>
                      {isHeader ? '-' : isMargin ? 'Margin' : `${monthPercent}% / ${yearPercent}%`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Note */}
        <div className="bg-black/50 px-6 py-4 border-t border-border-card">
          <p className="font-aileron text-xs text-text-secondary">
            <span className="font-medium">Note:</span> Percentages show Month % / Year % of total revenue. 
            EBITDA Margin is shown as a percentage value.
          </p>
        </div>
      </div>
    </div>
  );
}

