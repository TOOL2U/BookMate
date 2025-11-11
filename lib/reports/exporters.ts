// Report export functions (Excel, CSV, PDF)
import { ReportData, formatCurrency } from './generators';

/**
 * Export report to Excel
 * Requires: npm install xlsx
 */
export async function exportToExcel(reportData: ReportData, filename?: string) {
  // Dynamic import to avoid SSR issues
  const XLSX = await import('xlsx');
  
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Summary
  const summaryData = [
    ['BookMate Financial Report'],
    ['Period', reportData.period.label],
    ['Generated', new Date(reportData.generatedAt).toLocaleString()],
    [],
    ['Financial Summary'],
    ['Total Revenue', reportData.summary.totalRevenue],
    ['Total Expenses', reportData.summary.totalExpenses],
    ['Net Profit', reportData.summary.netProfit],
    ['Profit Margin %', reportData.summary.profitMargin],
    ['Cash Position', reportData.summary.cashPosition]
  ];
  
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Sheet 2: Revenue Breakdown
  const revenueData = [
    ['Revenue Breakdown'],
    ['Category', 'Amount', 'Percentage'],
    ...reportData.revenue.byCategory.map(cat => [
      cat.category,
      cat.amount,
      cat.percentage
    ]),
    [],
    ['Total Revenue', reportData.revenue.total, '100%']
  ];
  
  const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
  XLSX.utils.book_append_sheet(workbook, revenueSheet, 'Revenue');

  // Sheet 3: Expenses Breakdown
  const expensesData = [
    ['Expense Breakdown'],
    ['Category', 'Amount', 'Percentage'],
    ['Overhead Expenses'],
    ...reportData.expenses.overhead.map(cat => [
      cat.category,
      cat.amount,
      cat.percentage
    ]),
    [],
    ['Property/Person Expenses'],
    ...reportData.expenses.propertyPerson.map(cat => [
      cat.category,
      cat.amount,
      cat.percentage
    ]),
    [],
    ['Overhead Subtotal', reportData.expenses.overheadTotal || 0, ''],
    ['Property/Person Subtotal', reportData.expenses.propertyPersonTotal || 0, ''],
    ['Total Expenses', (reportData.expenses.overheadTotal || 0) + (reportData.expenses.propertyPersonTotal || 0), '']
  ];
  
  const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

  // Sheet 4: Balances
  const balancesData = [
    ['Account Balances'],
    ['Account Name', 'Balance', 'Type'],
    ...reportData.balances.byAccount.map(acc => [
      acc.accountName,
      acc.balance,
      acc.type
    ]),
    [],
    ['Total Cash', reportData.balances.totalCash],
    ['Total Bank', reportData.balances.totalBank],
    ['Total Balance', reportData.balances.total]
  ];
  
  const balancesSheet = XLSX.utils.aoa_to_sheet(balancesData);
  XLSX.utils.book_append_sheet(workbook, balancesSheet, 'Balances');

  // Sheet 5: All Transactions - Detailed View
  if (reportData.transactions && reportData.transactions.length > 0) {
    const transactionsData = [
      ['All Transactions - Detailed Monthly Report'],
      ['Period', reportData.period.label],
      [],
      ['Date', 'Year', 'Month', 'Day', 'Property', 'Operation Type', 'Payment Type', 'Category', 'Detail', 'Debit', 'Credit', 'Net Amount', 'Type'],
      ...reportData.transactions.map(txn => {
        const netAmount = (txn.credit || 0) - (txn.debit || 0);
        const type = txn.credit > 0 ? 'Income' : 'Expense';
        const category = (txn as any).expenseCategory || txn.typeOfOperation || '';
        return [
          `${txn.day}/${txn.month}/${txn.year}`,
          txn.year || '',
          txn.month || '',
          txn.day || '',
          txn.property || '',
          txn.typeOfOperation || '',
          txn.typeOfPayment || '',
          category,
          txn.detail || '',
          txn.debit || 0,
          txn.credit || 0,
          netAmount,
          type
        ];
      }),
      [],
      ['Summary'],
      ['Total Debits (Expenses)', reportData.transactions.reduce((sum, txn) => sum + (txn.debit || 0), 0)],
      ['Total Credits (Income)', reportData.transactions.reduce((sum, txn) => sum + (txn.credit || 0), 0)],
      ['Net Position', reportData.transactions.reduce((sum, txn) => sum + ((txn.credit || 0) - (txn.debit || 0)), 0)],
      ['Transaction Count', reportData.transactions.length]
    ];
    
    const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'All Transactions');
  }
  
  // Sheet 6: Expense Details by Category
  if (reportData.transactions && reportData.transactions.length > 0) {
    const expenses = reportData.transactions.filter(txn => txn.debit > 0);
    
    // Group by expense category
    const categoryMap = new Map<string, any[]>();
    expenses.forEach(txn => {
      const category = (txn as any).expenseCategory || txn.typeOfOperation || 'Uncategorized';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(txn);
    });
    
    const expenseDetailsData: any[] = [
      ['Expense Details by Category'],
      ['Period', reportData.period.label],
      [],
    ];
    
    // Add each category section
    categoryMap.forEach((transactions, category) => {
      const categoryTotal = transactions.reduce((sum, txn) => sum + (txn.debit || 0), 0);
      expenseDetailsData.push([`Category: ${category}`, `Total: ${categoryTotal}`]);
      expenseDetailsData.push(['Date', 'Property', 'Payment Type', 'Detail', 'Amount']);
      
      transactions.forEach(txn => {
        expenseDetailsData.push([
          `${txn.day}/${txn.month}/${txn.year}`,
          txn.property || '',
          txn.typeOfPayment || '',
          txn.detail || '',
          txn.debit || 0
        ]);
      });
      
      expenseDetailsData.push(['Subtotal', '', '', '', categoryTotal]);
      expenseDetailsData.push([]);
    });
    
    const grandTotal = expenses.reduce((sum, txn) => sum + (txn.debit || 0), 0);
    expenseDetailsData.push(['Grand Total Expenses', '', '', '', grandTotal]);
    
    const expenseDetailsSheet = XLSX.utils.aoa_to_sheet(expenseDetailsData);
    XLSX.utils.book_append_sheet(workbook, expenseDetailsSheet, 'Expense Details');
  }
  
  // Sheet 7: Income Details
  if (reportData.transactions && reportData.transactions.length > 0) {
    const income = reportData.transactions.filter(txn => txn.credit > 0);
    
    const incomeDetailsData = [
      ['Income Details'],
      ['Period', reportData.period.label],
      [],
      ['Date', 'Property', 'Payment Type', 'Detail', 'Amount'],
      ...income.map(txn => [
        `${txn.day}/${txn.month}/${txn.year}`,
        txn.property || '',
        txn.typeOfPayment || '',
        txn.detail || '',
        txn.credit || 0
      ]),
      [],
      ['Total Income', '', '', '', income.reduce((sum, txn) => sum + (txn.credit || 0), 0)]
    ];
    
    const incomeDetailsSheet = XLSX.utils.aoa_to_sheet(incomeDetailsData);
    XLSX.utils.book_append_sheet(workbook, incomeDetailsSheet, 'Income Details');
  }

  // Download file
  const fileName = filename || `BookMate_Report_${reportData.period.label.replace(/\s/g, '_')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}

/**
 * Export report to CSV
 */
export function exportToCSV(reportData: ReportData, filename?: string) {
  // Build CSV content
  const rows: string[] = [];
  
  // Header
  rows.push('BookMate Financial Report');
  rows.push(`Period,${reportData.period.label}`);
  rows.push(`Generated,${new Date(reportData.generatedAt).toLocaleString()}`);
  rows.push('');
  
  // Summary
  rows.push('Financial Summary');
  rows.push('Metric,Value');
  rows.push(`Total Revenue,${formatCurrency(reportData.summary.totalRevenue)}`);
  rows.push(`Total Expenses,${formatCurrency(reportData.summary.totalExpenses)}`);
  rows.push(`Net Profit,${formatCurrency(reportData.summary.netProfit)}`);
  rows.push(`Profit Margin,${reportData.summary.profitMargin.toFixed(2)}%`);
  rows.push(`Cash Position,${formatCurrency(reportData.summary.cashPosition)}`);
  rows.push('');
  
  // Revenue
  rows.push('Revenue Breakdown');
  rows.push('Category,Amount,Percentage');
  reportData.revenue.byCategory.forEach(cat => {
    rows.push(`${cat.category},${cat.amount},${cat.percentage.toFixed(2)}%`);
  });
  rows.push(`Total,${reportData.revenue.total},100%`);
  rows.push('');
  
  // Expenses
  rows.push('Expense Breakdown');
  rows.push('Category,Amount,Percentage');
  rows.push('Overhead Expenses');
  reportData.expenses.overhead.forEach(cat => {
    rows.push(`${cat.category},${cat.amount},${cat.percentage.toFixed(2)}%`);
  });
  rows.push('');
  rows.push('Property/Person Expenses');
  reportData.expenses.propertyPerson.forEach(cat => {
    rows.push(`${cat.category},${cat.amount},${cat.percentage.toFixed(2)}%`);
  });
  rows.push('');
  rows.push(`Overhead Subtotal,${reportData.expenses.overheadTotal || 0},`);
  rows.push(`Property/Person Subtotal,${reportData.expenses.propertyPersonTotal || 0},`);
  rows.push(`Total Expenses,${(reportData.expenses.overheadTotal || 0) + (reportData.expenses.propertyPersonTotal || 0)},`);
  rows.push('');
  
  // Balances
  rows.push('Account Balances');
  rows.push('Account Name,Balance,Type');
  reportData.balances.byAccount.forEach(acc => {
    rows.push(`${acc.accountName},${acc.balance},${acc.type}`);
  });
  rows.push(`Total,${reportData.balances.total},`);
  rows.push('');
  
  // All Transactions - Detailed
  if (reportData.transactions && reportData.transactions.length > 0) {
    rows.push('All Transactions - Detailed Monthly Report');
    rows.push('Date,Year,Month,Day,Property,Operation Type,Payment Type,Category,Detail,Debit,Credit,Net Amount,Type');
    
    reportData.transactions.forEach(txn => {
      const netAmount = (txn.credit || 0) - (txn.debit || 0);
      const type = txn.credit > 0 ? 'Income' : 'Expense';
      const category = (txn as any).expenseCategory || txn.typeOfOperation || '';
      const detail = `"${(txn.detail || '').replace(/"/g, '""')}"`;
      
      rows.push(`${txn.day}/${txn.month}/${txn.year},${txn.year},${txn.month},${txn.day},${txn.property || ''},${txn.typeOfOperation || ''},${txn.typeOfPayment || ''},${category},${detail},${txn.debit || 0},${txn.credit || 0},${netAmount},${type}`);
    });
    
    rows.push('');
    rows.push('Transaction Summary');
    rows.push(`Total Debits (Expenses),${reportData.transactions.reduce((sum, txn) => sum + (txn.debit || 0), 0)}`);
    rows.push(`Total Credits (Income),${reportData.transactions.reduce((sum, txn) => sum + (txn.credit || 0), 0)}`);
    rows.push(`Net Position,${reportData.transactions.reduce((sum, txn) => sum + ((txn.credit || 0) - (txn.debit || 0)), 0)}`);
    rows.push(`Transaction Count,${reportData.transactions.length}`);
    rows.push('');
    
    // Expense breakdown by category
    const expenses = reportData.transactions.filter(txn => txn.debit > 0);
    if (expenses.length > 0) {
      rows.push('Expense Details by Category');
      rows.push('');
      
      const categoryMap = new Map<string, any[]>();
      expenses.forEach(txn => {
        const category = (txn as any).expenseCategory || txn.typeOfOperation || 'Uncategorized';
        if (!categoryMap.has(category)) {
          categoryMap.set(category, []);
        }
        categoryMap.get(category)!.push(txn);
      });
      
      categoryMap.forEach((transactions, category) => {
        const categoryTotal = transactions.reduce((sum, txn) => sum + (txn.debit || 0), 0);
        rows.push(`Category: ${category},Total: ${categoryTotal}`);
        rows.push('Date,Property,Payment Type,Detail,Amount');
        
        transactions.forEach(txn => {
          const detail = `"${(txn.detail || '').replace(/"/g, '""')}"`;
          rows.push(`${txn.day}/${txn.month}/${txn.year},${txn.property || ''},${txn.typeOfPayment || ''},${detail},${txn.debit || 0}`);
        });
        
        rows.push(`Subtotal,,,,${categoryTotal}`);
        rows.push('');
      });
      
      rows.push(`Grand Total Expenses,,,,${expenses.reduce((sum, txn) => sum + (txn.debit || 0), 0)}`);
      rows.push('');
    }
    
    // Income details
    const income = reportData.transactions.filter(txn => txn.credit > 0);
    if (income.length > 0) {
      rows.push('Income Details');
      rows.push('Date,Property,Payment Type,Detail,Amount');
      
      income.forEach(txn => {
        const detail = `"${(txn.detail || '').replace(/"/g, '""')}"`;
        rows.push(`${txn.day}/${txn.month}/${txn.year},${txn.property || ''},${txn.typeOfPayment || ''},${detail},${txn.credit || 0}`);
      });
      
      rows.push(`Total Income,,,,${income.reduce((sum, txn) => sum + (txn.credit || 0), 0)}`);
    }
  }
  
  // Create CSV file
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fileName = filename || `BookMate_Report_${reportData.period.label.replace(/\s/g, '_')}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export raw transaction data to CSV
 */
export function exportTransactionsToCSV(reportData: ReportData, filename?: string) {
  console.log('Exporting transactions:', {
    hasTransactions: !!reportData.transactions,
    count: reportData.transactions?.length || 0,
    preview: reportData.transactions?.slice(0, 2)
  });

  if (!reportData.transactions || reportData.transactions.length === 0) {
    console.warn('No transactions to export - creating empty CSV file');
    
    // Create empty CSV with just headers
    const rows: string[] = [];
    rows.push('Date,Property,Operation Type,Payment Type,Detail,Debit,Credit');
    rows.push('# No transactions found for this period');
    
    const csvContent = rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    const fileName = filename || `BookMate_Transactions_${reportData.period.label.replace(/\s/g, '_')}_EMPTY.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('No transactions found for this period. An empty CSV file has been downloaded.');
    return;
  }

  const rows: string[] = [];
  
  // Header
  rows.push('Date,Property,Operation Type,Payment Type,Detail,Debit,Credit');
  
  // Transactions
  reportData.transactions.forEach(txn => {
    const date = `${txn.year}-${txn.month}-${txn.day}`;
    const property = txn.property || '';
    const operation = txn.typeOfOperation || '';
    const payment = txn.typeOfPayment || '';
    const detail = `"${(txn.detail || '').replace(/"/g, '""')}"`;
    const debit = txn.debit || 0;
    const credit = txn.credit || 0;
    
    rows.push(`${date},${property},${operation},${payment},${detail},${debit},${credit}`);
  });
  
  // Download
  const csvContent = rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  const fileName = filename || `BookMate_Transactions_${reportData.period.label.replace(/\s/g, '_')}.csv`;
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Print report (opens print dialog)
 */
export function printReport() {
  window.print();
}
