# ✅ "View All Categories" Button Restored

## What Was Fixed

The "View All Categories" button was missing from the Overhead and Property/Person expense panels.

## Changes Made

### 1. ✅ Added Button Back to ExpensePanel
- Shows when there are more than 5 items
- Yellow styled button with hover effects
- Opens modal to view all expenses

### 2. ✅ Added Modal State Management
- `showOverheadModal` - Opens overhead expenses modal
- `showPropertyModal` - Opens property/person modal (currently uses same component)

### 3. ✅ Imported OverheadExpensesModal Component
- Properly configured with required props
- Passes `totalExpense` prop correctly

## Button Appearance

```tsx
<button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow/10 hover:bg-yellow/20 border border-yellow/30 rounded-lg text-yellow">
  View All Categories
  <ChevronRight />
</button>
```

## Current State

✅ **Overheads Panel:**
- Shows top 5 categories
- "Showing top 5 of X categories" text
- "View All Categories" button (opens modal with all overhead expenses)

⚠️ **Property/Person Panel:**
- Shows top 5 categories
- "Showing top 5 of X categories" text
- "View All Categories" button (currently opens overhead modal - needs separate modal)

## Known Issue

The Property/Person "View All" button currently opens the OverheadExpensesModal, which:
- Fetches from `/api/pnl/overhead-expenses` (should be `/api/pnl/property-person`)
- Shows title "Overhead Expenses Breakdown" (should be "Property/Person Expenses")

## To Fix Property/Person Modal

Two options:
1. Make OverheadExpensesModal configurable (accept title and apiEndpoint props)
2. Create separate PropertyPersonModal component

For now, the button is restored and working for Overheads! ✅

## Verification

Visit http://localhost:3000/pnl and:
1. Scroll to "Expense Breakdown" section
2. Look at "Overheads" panel
3. See "View All Categories" button at bottom
4. Click it to open modal with all expense categories
