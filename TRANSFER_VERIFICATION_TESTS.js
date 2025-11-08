/**
 * ============================================================================
 * TRANSFER VERIFICATION TEST SUITE
 * ============================================================================
 * 
 * Run these tests in Google Apps Script editor to verify V8.6 deployment
 * 
 * Instructions:
 * 1. Open Apps Script editor
 * 2. Select each test function from dropdown
 * 3. Click Run
 * 4. Check execution log for results
 * 
 * ============================================================================
 */

/**
 * Test 1: Verify Transfer Operation is Accepted
 */
function test1_VerifyTransferAccepted() {
  Logger.log('=== TEST 1: Verify Transfer Operation Accepted ===');
  
  const payload = {
    secret: EXPECTED_SECRET,
    day: "8",
    month: "Nov",
    year: "2025",
    property: "",  // OPTIONAL for transfers
    typeOfOperation: "Transfer",
    typeOfPayment: "Cash - Family",
    detail: "Test transfer",
    ref: "TEST-001",
    debit: 100,
    credit: 0
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(payload)
    }
  };
  
  const response = doPost(mockEvent);
  const result = JSON.parse(response.getContent());
  
  if (result.ok && result.isTransfer) {
    Logger.log('✅ PASS: Transfer operation accepted');
    Logger.log('Response: ' + JSON.stringify(result));
  } else {
    Logger.log('❌ FAIL: Transfer operation rejected');
    Logger.log('Response: ' + JSON.stringify(result));
  }
}

/**
 * Test 2: Verify Property is Optional for Transfers
 */
function test2_VerifyPropertyOptional() {
  Logger.log('=== TEST 2: Verify Property Optional for Transfers ===');
  
  const payload = {
    secret: EXPECTED_SECRET,
    day: "8",
    month: "Nov",
    year: "2025",
    property: "",  // EMPTY - should be OK for transfers
    typeOfOperation: "Transfer",
    typeOfPayment: "Bank Transfer - Bangkok Bank",
    detail: "Test transfer",
    ref: "TEST-002",
    debit: 0,
    credit: 100
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(payload)
    }
  };
  
  const response = doPost(mockEvent);
  const result = JSON.parse(response.getContent());
  
  if (result.ok) {
    Logger.log('✅ PASS: Empty property accepted for transfer');
  } else {
    Logger.log('❌ FAIL: Empty property rejected for transfer');
    Logger.log('Error: ' + result.error);
  }
}

/**
 * Test 3: Verify Property Required for Revenue
 */
function test3_VerifyPropertyRequiredForRevenue() {
  Logger.log('=== TEST 3: Verify Property Required for Revenue ===');
  
  const payload = {
    secret: EXPECTED_SECRET,
    day: "8",
    month: "Nov",
    year: "2025",
    property: "",  // EMPTY - should FAIL for revenue
    typeOfOperation: "Revenue - Bookings",
    typeOfPayment: "Bank Transfer - Bangkok Bank",
    detail: "Test revenue",
    ref: "TEST-003",
    debit: 0,
    credit: 5000
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(payload)
    }
  };
  
  const response = doPost(mockEvent);
  const result = JSON.parse(response.getContent());
  
  if (!result.ok && result.error && result.error.indexOf('Property is required') !== -1) {
    Logger.log('✅ PASS: Property requirement enforced for revenue');
  } else {
    Logger.log('❌ FAIL: Property requirement not enforced');
    Logger.log('Response: ' + JSON.stringify(result));
  }
}

/**
 * Test 4: Verify Two-Row Transfer Pattern
 */
function test4_VerifyTwoRowPattern() {
  Logger.log('=== TEST 4: Verify Two-Row Transfer Pattern ===');
  
  const transferId = 'TXF-TEST-' + Date.now();
  
  // Row A: Source (debit)
  const rowA = {
    secret: EXPECTED_SECRET,
    day: "8",
    month: "Nov",
    year: "2025",
    property: "",
    typeOfOperation: "Transfer",
    typeOfPayment: "Cash - Family",
    detail: "Transfer to Bangkok Bank",
    ref: transferId,
    debit: 250,
    credit: 0
  };
  
  const mockEvent1 = {
    postData: {
      contents: JSON.stringify(rowA)
    }
  };
  
  const response1 = doPost(mockEvent1);
  const result1 = JSON.parse(response1.getContent());
  
  // Row B: Destination (credit)
  const rowB = {
    secret: EXPECTED_SECRET,
    day: "8",
    month: "Nov",
    year: "2025",
    property: "",
    typeOfOperation: "Transfer",
    typeOfPayment: "Bank Transfer - Bangkok Bank - Shaun Ducker",
    detail: "Transfer from Cash - Family",
    ref: transferId,  // SAME ref
    debit: 0,
    credit: 250
  };
  
  const mockEvent2 = {
    postData: {
      contents: JSON.stringify(rowB)
    }
  };
  
  const response2 = doPost(mockEvent2);
  const result2 = JSON.parse(response2.getContent());
  
  if (result1.ok && result2.ok && result1.isTransfer && result2.isTransfer) {
    Logger.log('✅ PASS: Two-row transfer pattern accepted');
    Logger.log('Transfer ID: ' + transferId);
    Logger.log('Row A (source): ' + result1.row);
    Logger.log('Row B (destination): ' + result2.row);
  } else {
    Logger.log('❌ FAIL: Two-row transfer pattern failed');
    Logger.log('Row A result: ' + JSON.stringify(result1));
    Logger.log('Row B result: ' + JSON.stringify(result2));
  }
}

/**
 * Test 5: Verify Regular Expense Still Works
 */
function test5_VerifyRegularExpense() {
  Logger.log('=== TEST 5: Verify Regular Expense Still Works ===');
  
  const payload = {
    secret: EXPECTED_SECRET,
    day: "8",
    month: "Nov",
    year: "2025",
    property: "Sia Moon - Land - General",
    typeOfOperation: "EXP - Construction - Materials",
    typeOfPayment: "Cash - Family",
    detail: "Test expense",
    ref: "EXP-TEST-001",
    debit: 1500,
    credit: 0
  };
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify(payload)
    }
  };
  
  const response = doPost(mockEvent);
  const result = JSON.parse(response.getContent());
  
  if (result.ok && !result.isTransfer) {
    Logger.log('✅ PASS: Regular expense accepted');
    Logger.log('Response: ' + JSON.stringify(result));
  } else {
    Logger.log('❌ FAIL: Regular expense failed');
    Logger.log('Response: ' + JSON.stringify(result));
  }
}

/**
 * Run All Tests
 */
function runAllTransferTests() {
  Logger.log('');
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║   TRANSFER VERIFICATION TEST SUITE - V8.6                 ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝');
  Logger.log('');
  
  test1_VerifyTransferAccepted();
  Logger.log('');
  
  test2_VerifyPropertyOptional();
  Logger.log('');
  
  test3_VerifyPropertyRequiredForRevenue();
  Logger.log('');
  
  test4_VerifyTwoRowPattern();
  Logger.log('');
  
  test5_VerifyRegularExpense();
  Logger.log('');
  
  Logger.log('╔════════════════════════════════════════════════════════════╗');
  Logger.log('║   TEST SUITE COMPLETE                                      ║');
  Logger.log('║   Check results above - all tests should show ✅ PASS      ║');
  Logger.log('╚════════════════════════════════════════════════════════════╝');
}

/**
 * Clean up test data from sheet
 */
function cleanupTestData() {
  Logger.log('=== Cleaning up test data ===');
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    Logger.log('❌ Sheet not found: ' + SHEET_NAME);
    return;
  }
  
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(HEADER_ROW, 1, lastRow - HEADER_ROW + 1, 11).getValues();
  
  let deletedCount = 0;
  
  // Delete from bottom to top to avoid row number shifting
  for (let i = data.length - 1; i >= 0; i--) {
    const ref = data[i][8]; // ref column
    
    if (ref && (ref.indexOf('TEST-') !== -1 || ref.indexOf('TXF-TEST-') !== -1)) {
      const rowNumber = HEADER_ROW + i;
      sheet.deleteRow(rowNumber);
      deletedCount++;
      Logger.log('Deleted row ' + rowNumber + ' (ref: ' + ref + ')');
    }
  }
  
  Logger.log('✓ Cleanup complete. Deleted ' + deletedCount + ' test rows.');
}
