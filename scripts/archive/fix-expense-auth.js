const fs = require('fs');

// Read the file
const file = '/Users/shaunducker/Desktop/BookMate-webapp/components/settings/ExpenseCategoryManager.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add helper function after showToast function
const helperFunction = `
  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    return token ? { 'Authorization': \`Bearer \${token}\` } : {};
  };
`;

// Find the position after showToast function (after line with setTimeout)
content = content.replace(
  /(setTimeout\(\(\) => setToast\(null\), 5000\);\n  \};)/,
  `$1\n${helperFunction}`
);

// Update all fetch calls to include auth headers

// 1. GET request in fetchCategories
content = content.replace(
  /const res = await fetch\('\/api\/categories\/expenses'\);/,
  `const res = await fetch('/api/categories/expenses', {
        headers: { ...getAuthHeaders() },
      });`
);

// 2-4. POST requests - add getAuthHeaders to headers
content = content.replace(
  /headers: \{ 'Content-Type': 'application\/json' \},/g,
  `headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },`
);

// Write the fixed content
fs.writeFileSync(file, content);
console.log('✅ Fixed ExpenseCategoryManager.tsx');
