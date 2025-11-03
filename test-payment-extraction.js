// Simulate the API response
const apiResponse = {
  ok: true,
  data: {
    typeOfPayments: [
      {
        name: "Bank Transfer - Bangkok Bank - Shaun Ducker",
        monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
        yearTotal: 0
      },
      {
        name: "Bank Transfer - Bangkok Bank - Maria Ren",
        monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
        yearTotal: 0
      },
      {
        name: "Bank transfer - Krung Thai Bank - Family Account",
        monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
        yearTotal: 0
      },
      {
        name: "Cash - Family",
        monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
        yearTotal: 0
      },
      {
        name: "Cash - Alesia",
        monthly: [0,0,0,0,0,0,0,0,0,0,0,0],
        yearTotal: 0
      }
    ]
  }
};

// Test the extraction logic (OLD - BROKEN)
console.log("OLD LOGIC (BROKEN):");
const oldBankNames = apiResponse.data.typeOfPayments.map((bankName) => {
  console.log("  Parameter:", bankName);
  return bankName;
});
console.log("Result:", oldBankNames);

console.log("\n---\n");

// Test the extraction logic (NEW - FIXED)
console.log("NEW LOGIC (FIXED):");
const newBankNames = apiResponse.data.typeOfPayments.map((payment) => {
  const bankName = typeof payment === 'string' ? payment : payment.name;
  console.log("  Extracted:", bankName);
  return bankName;
});
console.log("\nFinal bank names:", newBankNames);
