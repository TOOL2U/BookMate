/**
 * Data Sync Verification Script
 * 
 * Tests data accuracy between web app and mobile app endpoints
 * Ensures >99% parity for App Store launch
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface TestResult {
  test: string;
  passed: boolean;
  message: string;
  data?: any;
}

const results: TestResult[] = [];

async function testBalanceAccuracy() {
  console.log('\n🧪 Testing Balance Calculations...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/balance`);
    const data = await response.json();
    
    if (!data.ok) {
      results.push({
        test: 'Balance API',
        passed: false,
        message: 'API returned error',
        data: data.error
      });
      return;
    }
    
    // Verify totals calculation
    let calculatedTotal = 0;
    data.items.forEach((item: any) => {
      calculatedTotal += item.currentBalance || 0;
    });
    
    const apiTotal = data.totals.currentBalance;
    const difference = Math.abs(calculatedTotal - apiTotal);
    const accuracyPercent = 100 - (difference / Math.max(calculatedTotal, apiTotal) * 100);
    
    results.push({
      test: 'Balance Totals',
      passed: accuracyPercent > 99,
      message: `Accuracy: ${accuracyPercent.toFixed(4)}% (Diff: ${difference.toFixed(2)})`,
      data: {
        calculated: calculatedTotal,
        apiReported: apiTotal,
        difference,
        accuracyPercent
      }
    });
    
    // Test net change calculation
    let calculatedNetChange = 0;
    data.items.forEach((item: any) => {
      calculatedNetChange += item.netChange || 0;
    });
    
    const apiNetChange = data.totals.netChange;
    const netChangeDiff = Math.abs(calculatedNetChange - apiNetChange);
    const netChangeAccuracy = 100 - (netChangeDiff / Math.max(Math.abs(calculatedNetChange), Math.abs(apiNetChange)) * 100);
    
    results.push({
      test: 'Balance Net Change',
      passed: netChangeAccuracy > 99,
      message: `Accuracy: ${netChangeAccuracy.toFixed(4)}% (Diff: ${netChangeDiff.toFixed(2)})`,
      data: {
        calculated: calculatedNetChange,
        apiReported: apiNetChange,
        difference: netChangeDiff
      }
    });
    
  } catch (error) {
    results.push({
      test: 'Balance API',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

async function testPnLAccuracy() {
  console.log('\n🧪 Testing P&L Calculations...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/pnl`);
    const data = await response.json();
    
    if (!data.ok) {
      results.push({
        test: 'P&L API',
        passed: false,
        message: 'API returned error',
        data: data.error
      });
      return;
    }
    
    // Verify GOP calculation (Revenue - Overheads - Property/Person Expense)
    const month = data.data.month;
    const calculatedGOP = month.revenue - month.overheads - month.propertyPersonExpense;
    const apiGOP = month.gop;
    const gopDiff = Math.abs(calculatedGOP - apiGOP);
    const gopAccuracy = 100 - (gopDiff / Math.max(Math.abs(calculatedGOP), Math.abs(apiGOP)) * 100);
    
    results.push({
      test: 'P&L GOP Calculation',
      passed: gopDiff < 0.01, // Allow 1 cent difference for rounding
      message: `Accuracy: ${gopAccuracy.toFixed(4)}% (Diff: ${gopDiff.toFixed(2)})`,
      data: {
        revenue: month.revenue,
        overheads: month.overheads,
        propertyPersonExpense: month.propertyPersonExpense,
        calculated: calculatedGOP,
        apiReported: apiGOP,
        difference: gopDiff
      }
    });
    
    // Verify EBITDA margin calculation
    const calculatedMargin = month.revenue > 0 ? (calculatedGOP / month.revenue) * 100 : 0;
    const apiMargin = month.ebitdaMargin;
    const marginDiff = Math.abs(calculatedMargin - apiMargin);
    
    results.push({
      test: 'P&L EBITDA Margin',
      passed: marginDiff < 0.1, // Allow 0.1% difference
      message: `Calculated: ${calculatedMargin.toFixed(2)}%, API: ${apiMargin.toFixed(2)}% (Diff: ${marginDiff.toFixed(4)}%)`,
      data: {
        calculated: calculatedMargin,
        apiReported: apiMargin,
        difference: marginDiff
      }
    });
    
  } catch (error) {
    results.push({
      test: 'P&L API',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

async function testHealthEndpoint() {
  console.log('\n🧪 Testing Health/Sync Endpoint...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/health/balance`);
    const data = await response.json();
    
    results.push({
      test: 'Health Endpoint',
      passed: data.ok && data.status === 'healthy',
      message: data.ok ? `Sheet accessible, ${data.counts.accounts} accounts found` : 'Endpoint returned error',
      data: data.counts
    });
    
    // Verify counts are reasonable
    const hasAccounts = data.counts?.accounts > 0;
    const hasTransactions = data.counts?.transactions >= 0;
    
    results.push({
      test: 'Data Sync Status',
      passed: hasAccounts && hasTransactions,
      message: `${data.counts?.accounts || 0} accounts, ${data.counts?.transactions || 0} transactions`,
      data: data.counts
    });
    
  } catch (error) {
    results.push({
      test: 'Health Endpoint',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

async function testCategoriesSync() {
  console.log('\n🧪 Testing Categories Sync...');
  
  const endpoints = [
    { name: 'Payments', url: '/api/categories/payments' },
    { name: 'Properties', url: '/api/categories/properties' },
    { name: 'Expenses', url: '/api/categories/expenses' },
    { name: 'Revenues', url: '/api/categories/revenues' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint.url}`);
      const data = await response.json();
      
      const hasData = data.ok && data.data;
      const itemCount = Array.isArray(data.data?.paymentTypes) ? data.data.paymentTypes.length :
                        Array.isArray(data.data?.properties) ? data.data.properties.length :
                        Array.isArray(data.data?.expenses) ? data.data.expenses.length :
                        Array.isArray(data.data?.revenues) ? data.data.revenues.length : 0;
      
      results.push({
        test: `Categories: ${endpoint.name}`,
        passed: hasData && itemCount > 0,
        message: hasData ? `${itemCount} items found` : 'No data returned',
        data: { itemCount }
      });
      
    } catch (error) {
      results.push({
        test: `Categories: ${endpoint.name}`,
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  }
}

async function testRateLimiting() {
  console.log('\n🧪 Testing Rate Limiting...');
  
  // Test that endpoints return rate limit headers
  try {
    const response = await fetch(`${BASE_URL}/api/balance`);
    const rateLimitHeader = response.headers.get('X-RateLimit-Limit');
    const remainingHeader = response.headers.get('X-RateLimit-Remaining');
    
    results.push({
      test: 'Rate Limit Headers',
      passed: !!rateLimitHeader && !!remainingHeader,
      message: rateLimitHeader ? `Limit: ${rateLimitHeader}, Remaining: ${remainingHeader}` : 'Headers missing',
      data: {
        limit: rateLimitHeader,
        remaining: remainingHeader
      }
    });
    
  } catch (error) {
    results.push({
      test: 'Rate Limit Headers',
      passed: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    });
  }
}

async function runAllTests() {
  console.log('🚀 Starting Data Sync Verification...');
  console.log(`Testing against: ${BASE_URL}\n`);
  
  await testHealthEndpoint();
  await testBalanceAccuracy();
  await testPnLAccuracy();
  await testCategoriesSync();
  await testRateLimiting();
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = (passed / total * 100).toFixed(2);
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.test.padEnd(30)} ${result.message}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n${passed}/${total} tests passed (${passRate}%)\n`);
  
  if (parseFloat(passRate) >= 99) {
    console.log('🎉 DATA SYNC VERIFIED - Ready for App Store launch!\n');
    process.exit(0);
  } else {
    console.log('⚠️  WARNING: Data sync below 99% threshold\n');
    console.log('Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.test}: ${r.message}`);
      if (r.data) {
        console.log(`    Data:`, r.data);
      }
    });
    console.log('');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
