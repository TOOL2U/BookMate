# 💻 WEBAPP TEAM INFORMATION FOR PROJECT MANAGER

**Date:** November 3, 2025  
**Project:** BookMate Web Application  
**For:** P&L Dashboard Integration

---

## 🔢 1. TECH STACK

### Frontend:
- **Next.js 15.0.0** (React 18.2.0) with App Router architecture
- **TypeScript 5.5.3** for type safety
- **Tailwind CSS 4.1.16** for styling
- **Framer Motion 11.2.10** for animations

### Backend:
- **Next.js API Routes** (server-side TypeScript)
- **Node.js** runtime (Vercel serverless functions)
- **Google APIs (googleapis 164.1.0)** for direct Google Sheets access

### Visualization:
- **Recharts 3.3.0** for charts and graphs (LineChart, BarChart, etc.)

### Deployment:
- **Vercel** (Production: https://accounting.siamoon.com)
- **Auto-deploy from GitHub** (main branch)

---

## 📡 2. DATA RETRIEVAL METHOD

We use **TWO methods** (hybrid approach):

### Method A: Google Sheets API (Direct) ✅ **PRIMARY**
- **Library:** `googleapis` npm package (v164.1.0)
- **Use cases:** 
  - Settings page (CRUD operations on Data sheet)
  - Category management (revenues, expenses, properties, payments)
  - Dropdown value fetching from Data!A/B/C/D
- **Authentication:** Service Account with JSON key
- **Location:** Server-side API routes only (`app/api/categories/*`)

### Method B: Apps Script Webhook ✅ **SECONDARY**
- **URL:** `SHEETS_WEBHOOK_URL` (Apps Script web app deployment)
- **Use cases:**
  - Transaction uploads (append to BookMate P&L 2025 sheet)
  - P&L KPI data (revenue, overheads, GOP, EBITDA)
  - Overhead expenses breakdown
  - Property/Person expenses breakdown
  - Balance tracking
- **Authentication:** Shared secret (`SHEETS_WEBHOOK_SECRET`)
- **Location:** Apps Script handles complex calculations/aggregations

**Why Hybrid?**
- Direct API: Fast reads/writes for simple data (categories)
- Apps Script: Complex calculations already exist in sheet formulas (P&L aggregations)

---

## 🔐 3. AUTHENTICATION

### ✅ Service Account (Google Cloud)
- **Status:** ✅ Already authorized and active
- **Email:** `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
- **Key Format:** JSON key file (entire credential object)
- **Permissions:** Editor access to the spreadsheet
- **Shared with sheet:** ✅ Yes, via Google Sheets sharing settings

### Apps Script Webhook
- **Auth Method:** Shared secret (VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=)
- **Status:** ✅ Active and deployed
- **URL:** https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec

---

## 📋 4. SPREADSHEET ACCESS

### Environment Variables (.env):
```bash
# Direct Google Sheets API (Method A)
GOOGLE_SHEET_ID=1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"accounting-buddy-476114",...}

# Apps Script Webhook (Method B)
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/.../exec
SHEETS_WEBHOOK_SECRET=VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=
SHEETS_PNL_URL=https://script.google.com/macros/s/.../exec
```

**Storage Location:**
- ✅ Local development: `.env.local` (gitignored)
- ✅ Production: Vercel environment variables dashboard
- ✅ Backup: `.env.vercel.production` (encrypted, version-controlled)

**Sheet Structure:**
- **Sheet Name:** "BookMate P&L 2025" (transaction data)
- **Data Sheet:** "Data" (dropdown categories)
- **P&L Sheet:** "P&L (DO NOT EDIT)" (calculated formulas)
- **Balance Sheet:** "Bank & Cash Balance" (balance tracking)

---

## 🏗️ 5. BACKEND LOGIC LOCATION

### ✅ Server-Side Only (API Routes)
All data fetching happens **server-side** via Next.js API routes:

```
app/api/
├── categories/
│   ├── all/route.ts          # Batch fetch all dropdowns (Data!A/B/C/D)
│   ├── revenues/route.ts     # CRUD for Data!A2:A
│   ├── expenses/route.ts     # CRUD for Data!B2:B
│   ├── properties/route.ts   # CRUD for Data!C2:C
│   └── payments/route.ts     # CRUD for Data!D2:D
├── pnl/
│   ├── route.ts              # Main P&L KPIs (via Apps Script)
│   ├── overhead-expenses/route.ts   # Overhead breakdown
│   └── property-person/route.ts     # Property/Person breakdown
├── balance/
│   └── by-property/route.ts  # Balance by property
├── extract/route.ts          # AI extraction (OCR → structured data)
└── sheets/route.ts           # Transaction upload webhook
```

**Why server-side only?**
- ✅ API keys never exposed to browser
- ✅ Service account credentials stay secure
- ✅ Centralized error handling and logging
- ✅ Caching layer (60-second in-memory cache for P&L)

**Client-Side:**
- Frontend components call `/api/*` endpoints (localhost or production domain)
- No direct Google Sheets API calls from browser

---

## 📊 6. PREFERRED DATA SHAPE FOR UI

### Option A: **Grouped by P&L Blocks** ✅ **CURRENTLY USING**

```typescript
{
  ok: true,
  data: {
    month: {
      revenue: 150000,
      overheads: 45000,
      propertyPersonExpense: 30000,
      gop: 75000,
      ebitdaMargin: 50.0
    },
    year: {
      revenue: 1800000,
      overheads: 540000,
      propertyPersonExpense: 360000,
      gop: 900000,
      ebitdaMargin: 50.0
    },
    updatedAt: "2025-11-03T10:30:00.000Z"
  },
  cached: false,
  warnings: [],
  computedFallbacks: []
}
```

**Benefits:**
- Clean separation: month vs year
- Easy to display in KPI cards
- Matches P&L sheet structure
- No client-side aggregation needed

### Option B: Category Breakdown (Overhead/Property Details)

```typescript
{
  ok: true,
  data: [
    { name: "EXP - Utilities - Gas", expense: 5420, percentage: 12.5 },
    { name: "EXP - Construction - Tools", expense: 4200, percentage: 9.7 },
    // ...29 total categories
  ],
  period: "month",
  totalExpense: 43280,
  count: 29
}
```

**Used for:**
- Overhead Expenses modal (detailed breakdown)
- Property/Person expenses
- Settings page category management

---

## ⚡ 7. CACHING STRATEGY

### ✅ Short-term In-Memory Cache (60 seconds)

**Implementation:**
```typescript
// In-memory cache (app/api/pnl/route.ts)
let cache: CachedData | null = null;
const CACHE_DURATION_MS = 60 * 1000; // 60 seconds

if (cache && (now - cache.timestamp) < CACHE_DURATION_MS) {
  return cached data;
}
```

**Applied to:**
- ✅ P&L KPI data (`/api/pnl`)
- ❌ Category data (always live - for CRUD operations)
- ❌ Transaction uploads (write-only, no caching)

**Why 60 seconds?**
- Google Sheets formulas update in real-time
- Apps Script has 60-second cache on their end
- Reduces load on Apps Script (6 requests/min quota)
- Manual refresh button available for users who need instant updates

**No Redis/External Cache:**
- Vercel serverless functions are stateless
- In-memory cache is sufficient for current scale
- Consider Redis if traffic exceeds 1000 requests/min

---

## 🌍 8. TIMEZONE & CURRENCY SETTINGS

### Currency: **THB (Thai Baht)** ฿
```typescript
// Format function (used across all components)
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
// Output: ฿45,000
```

### Timezone: **Asia/Bangkok (UTC+7)**
```typescript
// Date handling
const currentMonth = new Date().getMonth() + 1; // 1-12
const currentYear = new Date().getFullYear();

// Display format
new Date(result.data.updatedAt).toLocaleString('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Bangkok' // Ensures consistent timezone
});
// Output: "Nov 3, 10:30 AM"
```

**Why important?**
- Month-end calculations depend on correct timezone
- Apps Script uses sheet's timezone (should match Bangkok)
- Frontend displays times in Bangkok timezone
- Prevents off-by-one-day errors in month filtering

---

## 📈 9. VISUALIZATION COMPONENTS

### Current Implementation:

#### A. **Monthly Columns (Jan–Dec)** ❌ **NOT YET**
- **Status:** Placeholder data only
- **File:** `components/pnl/PnLTrendChart.tsx`
- **Current:** Generates 6 months of mock data
- **Future:** Will fetch actual monthly breakdown from Apps Script

#### B. **Totals & Graphs** ✅ **ACTIVE**

**KPI Cards (4 metrics):**
- Revenue (month/year)
- Overheads (month/year)
- Property/Person (month/year)
- GOP (month/year)
- EBITDA Margin % (month/year)

**Charts:**
1. **Trend Chart** (LineChart from Recharts)
   - Revenue, Expenses, GOP over time
   - Currently: Last 6 months (placeholder)
   - Future: Real monthly data

2. **Expense Breakdown** (Table + Donut Charts)
   - Top 5 overhead categories
   - Top 5 property/person categories
   - Click "View All" → Modal with all categories

**Visual Components:**
- `PnLKpiRow.tsx` - 4 KPI cards with skeleton loading
- `PnLTrendChart.tsx` - Line chart (Recharts)
- `PnLExpenseBreakdown.tsx` - Two-column expense tables
- `PnLDetailedTable.tsx` - Full P&L table (desktop only)
- `OverheadExpensesModal.tsx` - Modal with all 29 categories
- `PropertyPersonModal.tsx` - Modal with property expenses

---

## 🔮 10. FUTURE PLAN

### Write-Back Support: **⏳ PLANNED**

**Current Capabilities:**
- ✅ **Read-Only:** P&L data, expenses, balances
- ✅ **Write (Append):** New transactions via `/api/sheets`
- ✅ **Write (CRUD):** Category management via `/api/categories/*`
  - Add/edit/delete revenues (Data!A)
  - Add/edit/delete expenses (Data!B)
  - Add/edit/delete properties (Data!C)
  - Add/edit/delete payment types (Data!D)

**Future Requirements (from mobile team):**
- ⏳ **Adjustments from webapp → Sheet**
  - Edit existing transactions (modify row data)
  - Delete transactions (remove rows)
  - Bulk import/export
- ⏳ **P&L Formula Overrides**
  - Manual adjustments to calculated values
  - Notes/annotations on specific line items
- ⏳ **Approval Workflow**
  - Review transactions before finalizing
  - Multi-user approval chains

**Technical Approach (when needed):**
```typescript
// Example: Edit transaction
POST /api/transactions/[id]
{
  rowNumber: 42,
  updates: {
    typeOfOperation: "EXP - Utilities - Gas",
    debit: 5500
  }
}

// Apps Script handles:
1. Find row by ID/number
2. Update specific columns
3. Trigger formula recalculation
4. Return updated P&L data
```

**Considerations:**
- Need transaction IDs (currently rows don't have unique IDs)
- Concurrency control (prevent simultaneous edits)
- Audit trail (track who changed what)
- Undo functionality

---

## 🎯 CURRENT ARCHITECTURE SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 15 + React 18 + TypeScript)             │
│  ├── P&L Dashboard (app/pnl/page.tsx)                      │
│  ├── Settings (app/settings/page.tsx)                      │
│  ├── Upload (app/upload/page.tsx)                          │
│  └── Review (app/review/[id]/page.tsx)                     │
└──────────────────┬──────────────────────────────────────────┘
                   │ fetch('/api/...')
                   ▼
┌─────────────────────────────────────────────────────────────┐
│  BACKEND (Next.js API Routes - Server-Side)                │
│  ├── /api/pnl → Apps Script (P&L KPIs)                     │
│  ├── /api/pnl/overhead-expenses → Apps Script              │
│  ├── /api/categories/all → Direct Sheets API               │
│  └── /api/sheets → Apps Script (append transactions)       │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────────┐  ┌──────────────────────────┐
│ Apps Script      │  │ Google Sheets API        │
│ (Webhook)        │  │ (Direct googleapis)      │
│                  │  │                          │
│ • P&L calcs      │  │ • Data!A/B/C/D (CRUD)   │
│ • Aggregations   │  │ • Fast reads/writes      │
│ • 60s cache      │  │ • No formula logic       │
└────────┬─────────┘  └────────┬─────────────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
        ┌───────────────────────────┐
        │  GOOGLE SHEET             │
        │  ID: 1UnCopzurl27VRqV...  │
        │                           │
        │  Sheets:                  │
        │  • BookMate P&L 2025      │
        │  • Data (dropdowns)       │
        │  • P&L (DO NOT EDIT)      │
        │  • Bank & Cash Balance    │
        └───────────────────────────┘
```

---

## 📞 CONTACT & SUPPORT

**Webapp Team Lead:** [Your Name]  
**Repository:** https://github.com/TOOL2U/BookMate  
**Production URL:** https://accounting.siamoon.com  
**Deployment Platform:** Vercel  

**Response Time:**
- Critical issues: < 2 hours
- Feature requests: 1-2 business days
- Documentation updates: Same day

---

## ✅ QUICK ANSWERS CHECKLIST

| # | Question | Answer |
|---|----------|--------|
| 1️⃣ | Tech stack | Next.js 15 (React 18) + TypeScript + Node.js serverless |
| 2️⃣ | Data retrieval | Hybrid: googleapis npm (categories) + Apps Script webhook (P&L) |
| 3️⃣ | Authentication | ✅ Service account authorized + shared secret for Apps Script |
| 4️⃣ | Spreadsheet access | ✅ GOOGLE_SHEET_ID in .env (1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8) |
| 5️⃣ | Backend logic | Server-side API routes only (app/api/*) |
| 6️⃣ | Data shape | Grouped by P&L blocks (month/year with KPIs) |
| 7️⃣ | Caching | 60-second in-memory cache (no Redis) |
| 8️⃣ | Timezone/Currency | THB + Asia/Bangkok (UTC+7) |
| 9️⃣ | Visualization | Totals/graphs (Recharts), monthly columns planned |
| 🔟 | Future plan | CRUD for categories ✅ done, transaction edits ⏳ planned |

---

**Last Updated:** November 3, 2025  
**Version:** 1.0  
**Document Status:** ✅ Ready for PM review
