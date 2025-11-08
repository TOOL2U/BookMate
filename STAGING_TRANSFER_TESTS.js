/**
 * STAGING TEST CONFIGURATION
 * Transfer Feature Validation - 6 Test Cases
 * 
 * Usage:
 * 1. Copy this file to your test environment
 * 2. Update STAGING_API_URL to your staging server
 * 3. Run: node STAGING_TRANSFER_TESTS.js
 * 
 * Expected Results:
 * - Test 1-3: ✅ Should PASS (valid entries)
 * - Test 4-6: ❌ Should FAIL with specific error messages
 */

const STAGING_API_URL = 'http://localhost:3000';
const API_ENDPOINT = '/api/sheets';

// ========================================
// TEST PAYLOADS
// ========================================

const TEST_CASES = {
  // ✅ SHOULD PASS: Valid expense entry
  validExpense: {
    name: 'Valid Expense Entry',
    payload: {
      day: '10',
      month: 'Jan',
      year: '2025',
      property: 'Alesia House',
      typeOfOperation: 'EXP - Utilities  - Electricity',
      typeOfPayment: 'Bank Transfer - Bangkok Bank - Shaun Ducker',
      detail: 'Monthly electric bill',
      ref: '',
      debit: '2500',
      credit: '0'
    },
    expected: {
      status: 200,
      shouldPass: true,
      checks: [
        'Should be accepted by validation',
        'Should appear in P&L expenses',
        'Should deduct from bank balance'
      ]
    }
  },

  // ✅ SHOULD PASS: Valid revenue entry
  validRevenue: {
    name: 'Valid Revenue Entry',
    payload: {
      day: '1',
      month: 'Jan',
      year: '2025',
      property: 'Alesia House',
      typeOfOperation: 'Revenue - Rental Income',
      typeOfPayment: 'Bank Transfer - Bangkok Bank - Shaun Ducker',
      detail: 'January rent payment',
      ref: '',
      debit: '0',
      credit: '15000'
    },
    expected: {
      status: 200,
      shouldPass: true,
      checks: [
        'Should be accepted by validation',
        'Should appear in P&L revenue',
        'Should add to bank balance'
      ]
    }
  },

  // ✅ SHOULD PASS: Valid transfer (Row A - Source)
  validTransferRowA: {
    name: 'Valid Transfer Row A (Source - Debit)',
    payload: {
      day: '15',
      month: 'Jan',
      year: '2025',
      property: '',  // ✅ Empty for transfers
      typeOfOperation: 'Transfer',
      typeOfPayment: 'Cash - Family',
      detail: 'Transfer to Bangkok Bank',
      ref: 'T-2025-001',  // ✅ Required for transfers
      debit: '50000',
      credit: '0'
    },
    expected: {
      status: 200,
      shouldPass: true,
      checks: [
        'Should be accepted by validation',
        'Should decrease Kasikorn balance by 50,000',
        'Should NOT appear in P&L revenue',
        'Should NOT appear in P&L expenses',
        'Overall balance total unchanged (zero drift)'
      ]
    }
  },

  // ✅ SHOULD PASS: Valid transfer (Row B - Destination)
  validTransferRowB: {
    name: 'Valid Transfer Row B (Destination - Credit)',
    payload: {
      day: '15',
      month: 'Jan',
      year: '2025',
      property: '',  // ✅ Empty for transfers
      typeOfOperation: 'Transfer',
      typeOfPayment: 'Bank Transfer - Bangkok Bank - Shaun Ducker',
      detail: 'Transfer from Cash',
      ref: 'T-2025-001',  // ✅ Same ref as Row A
      debit: '0',
      credit: '50000'
    },
    expected: {
      status: 200,
      shouldPass: true,
      checks: [
        'Should be accepted by validation',
        'Should increase SCB Savings balance by 50,000',
        'Should link to Row A via ref "T-2025-001"',
        'Both rows together should maintain zero drift'
      ]
    }
  },

  // ❌ SHOULD FAIL: Transfer missing ref
  invalidTransferNoRef: {
    name: 'Invalid Transfer - Missing Ref',
    payload: {
      day: '15',
      month: 'Jan',
      year: '2025',
      property: '',
      typeOfOperation: 'Transfer',
      typeOfPayment: 'Cash - Family',
      detail: 'Transfer to Bangkok Bank',
      ref: '',  // ❌ Missing ref
      debit: '50000',
      credit: '0'
    },
    expected: {
      status: 400,
      shouldPass: false,
      errorMessage: 'Ref is required for transfer entries',
      checks: [
        'Should be rejected by validation',
        'Error message should mention "Ref is required"'
      ]
    }
  },

  // ❌ SHOULD FAIL: Transfer with both debit and credit
  invalidTransferBothValues: {
    name: 'Invalid Transfer - Both Debit and Credit',
    payload: {
      day: '15',
      month: 'Jan',
      year: '2025',
      property: '',
      typeOfOperation: 'Transfer',
      typeOfPayment: 'Cash - Family',
      detail: 'Transfer to Bangkok Bank',
      ref: 'T-001',
      debit: '50000',  // ❌ Both non-zero
      credit: '50000'
    },
    expected: {
      status: 400,
      shouldPass: false,
      errorMessage: 'Transfer entries must have either debit OR credit, not both',
      checks: [
        'Should be rejected by validation',
        'Error message should mention "either debit OR credit"'
      ]
    }
  },

  // ❌ SHOULD FAIL: Transfer missing "Transfer to/from" in detail
  invalidTransferNoDetail: {
    name: 'Invalid Transfer - Missing "Transfer to/from"',
    payload: {
      day: '15',
      month: 'Jan',
      year: '2025',
      property: '',
      typeOfOperation: 'Transfer',
      typeOfPayment: 'Cash - Family',
      detail: 'Money movement',  // ❌ Missing "Transfer to/from"
      ref: 'T-001',
      debit: '50000',
      credit: '0'
    },
    expected: {
      status: 400,
      shouldPass: false,
      errorMessage: 'Transfer entries must have detail containing "Transfer to" or "Transfer from"',
      checks: [
        'Should be rejected by validation',
        'Error message should mention "Transfer to" or "Transfer from"'
      ]
    }
  }
};

// ========================================
// TEST RUNNER
// ========================================

async function runTest(testCase) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${testCase.name}`);
  console.log('='.repeat(80));

  try {
    const response = await fetch(`${STAGING_API_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCase.payload)
    });

    const data = await response.json();
    const passed = response.status === testCase.expected.status;

    console.log(`Status: ${response.status} (Expected: ${testCase.expected.status})`);
    console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);

    if (testCase.expected.shouldPass) {
      console.log('Expected: Should accept payload');
      console.log('Checks:');
      testCase.expected.checks.forEach(check => console.log(`  - ${check}`));
    } else {
      console.log('Expected: Should reject payload');
      console.log(`Expected Error: "${testCase.expected.errorMessage}"`);
      console.log(`Actual Response:`, JSON.stringify(data, null, 2));
      
      if (data.error && data.error.includes(testCase.expected.errorMessage)) {
        console.log('✅ Error message matches expected');
      } else {
        console.log('❌ Error message does not match expected');
      }
    }

    return {
      testName: testCase.name,
      passed,
      status: response.status,
      data
    };

  } catch (error) {
    console.log('❌ TEST FAILED WITH ERROR');
    console.error(error);
    return {
      testName: testCase.name,
      passed: false,
      error: error.message
    };
  }
}

async function runAllTests() {
  console.log('\n');
  console.log('╔' + '═'.repeat(78) + '╗');
  console.log('║' + ' BOOKMATE TRANSFER FEATURE - STAGING TESTS'.padEnd(78) + '║');
  console.log('╚' + '═'.repeat(78) + '╝');
  console.log(`\nTarget: ${STAGING_API_URL}${API_ENDPOINT}`);
  console.log(`Total Tests: ${Object.keys(TEST_CASES).length}`);

  const results = [];

  // Run tests sequentially
  for (const [key, testCase] of Object.entries(TEST_CASES)) {
    const result = await runTest(testCase);
    results.push(result);
    
    // Wait 1 second between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.testName}`);
  });

  console.log('\n' + '-'.repeat(80));
  console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('-'.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Transfer feature ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Review logs above for details.');
  }

  return results;
}

// ========================================
// MANUAL TEST HELPERS
// ========================================

// Helper function to test a single case
async function testSingle(testKey) {
  const testCase = TEST_CASES[testKey];
  if (!testCase) {
    console.error(`Test case "${testKey}" not found`);
    return;
  }
  return await runTest(testCase);
}

// Helper function to get test payload
function getPayload(testKey) {
  const testCase = TEST_CASES[testKey];
  if (!testCase) {
    console.error(`Test case "${testKey}" not found`);
    return null;
  }
  console.log(JSON.stringify(testCase.payload, null, 2));
  return testCase.payload;
}

// ========================================
// EXPORT FOR NODE.JS
// ========================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testSingle,
    getPayload,
    TEST_CASES,
    STAGING_API_URL
  };
}

// ========================================
// AUTO-RUN IF EXECUTED DIRECTLY
// ========================================

if (require.main === module) {
  console.log('⚠️  WARNING: Update STAGING_API_URL before running tests!');
  console.log(`Current URL: ${STAGING_API_URL}`);
  console.log('\nPress Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  setTimeout(() => {
    runAllTests()
      .then(() => process.exit(0))
      .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
      });
  }, 5000);
}

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// Run all tests
node STAGING_TRANSFER_TESTS.js

// Run in Node.js REPL
const tests = require('./STAGING_TRANSFER_TESTS.js');
tests.runAllTests();

// Run single test
tests.testSingle('validTransferRowA');

// Get payload JSON
tests.getPayload('validTransferRowB');
*/
