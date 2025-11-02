# 🗺️ BookMate Webapp – Complete Architecture Map

**Repository:** `TOOL2U/BookMate` (formerly BookMate-Application)  
**Domain:** `bookmate.siamoon.com` (migrating from accounting.siamoon.com)  
**Status:** Production Desktop-First Analytics Dashboard (Phase 2)

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Folder Structure](#folder-structure)
4. [Data Flow Architecture](#data-flow-architecture)
5. [API Routes Map](#api-routes-map)
6. [UI Pages & Components](#ui-pages--components)
7. [Google Sheets Integration](#google-sheets-integration)
8. [Environment Variables](#environment-variables)
9. [Configuration Files](#configuration-files)
10. [Utilities & Helpers](#utilities--helpers)
11. [Key Features](#key-features)

---

## 🎯 Project Overview

**BookMate** is a dual-mode financial management system:

### Phase 1 (MVP - Complete ✅)
- **Upload → OCR → AI Extract → Review → Google Sheets**
- Mobile-friendly receipt processing
- 10-field accounting schema matching "BookMate P&L 2025.xlsx"
- Comment-guided extraction with fuzzy matching

### Phase 2 (Current - Desktop Analytics Dashboard)
- **Desktop-first** design for viewing/analyzing data
- Real-time P&L metrics and KPIs
- Balance tracking with reconciliation
- Transaction inbox with delete functionality
- **Mobile app handles data entry** (upload moved to mobile)

### Core Purpose
Transform receipts and manual entries into structured accounting data, with automatic categorization and validation against canonical dropdown options.

---

## 🛠️ Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js | 15.0.0 |
| **Language** | TypeScript | 5.5.3 |
| **Styling** | Tailwind CSS | 4.1.16 |
| **Runtime** | React | 18.2.0 |
| **Animations** | Framer Motion | 11.2.10 |
| **Charts** | Recharts | 3.3.0 |
| **Icons** | Lucide React | 0.548.0 |
| **OCR** | Google Cloud Vision API | v1 |
| **AI** | OpenAI GPT-4o | Latest |
| **Sheets** | Google Apps Script | V8 |
| **Hosting** | Vercel | Production |

### Key Dependencies
```json
{
  "googleapis": "^164.1.0",
  "node-fetch": "^2.7.0",
  "uuid": "^13.0.0",
  "tailwindcss": "^4.1.16",
  "framer-motion": "^11.2.10",
  "recharts": "^3.3.0"
}
```

---

## 📁 Folder Structure

```
BookMate-webapp/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout (black theme, PWA metadata)
│   ├── page.tsx                 # Homepage (redirects to /dashboard)
│   ├── globals.css              # Tailwind + custom styles
│   ├── not-found.tsx            # 404 page
│   │
│   ├── api/                     # Backend API routes
│   │   ├── ocr/route.ts         # Google Vision OCR
│   │   ├── extract/route.ts     # OpenAI extraction + fuzzy matching
│   │   ├── sheets/route.ts      # Append to Google Sheets
│   │   ├── options/route.ts     # Fetch dropdown options
│   │   ├── pnl/route.ts         # P&L KPI data (60s cache)
│   │   ├── inbox/route.ts       # Fetch/delete transactions (5s cache)
│   │   ├── balance/
│   │   │   ├── get/route.ts           # Get latest balances (30s cache)
│   │   │   ├── save/route.ts          # Save new balance
│   │   │   ├── by-property/route.ts   # Running balance calculation
│   │   │   └── ocr/route.ts           # OCR for bank statements
│   │   ├── categories/route.ts  # Category breakdown endpoint
│   │   └── test-redirect/route.ts # Debug endpoint
│   │
│   ├── dashboard/page.tsx       # ⭐ Main desktop dashboard
│   ├── pnl/page.tsx             # P&L analytics page
│   ├── balance/page.tsx         # Balance tracking + reconciliation
│   ├── balance-new/page.tsx     # New balance UI (experimental)
│   ├── inbox/page.tsx           # Transaction inbox with delete
│   ├── upload/page.tsx          # Receipt upload (Phase 1)
│   ├── upload-old/page.tsx      # Old upload UI (backup)
│   ├── review/[id]/page.tsx     # Review extracted data (Phase 1)
│   ├── settings/page.tsx        # Settings page
│   └── admin/page.tsx           # Admin panel
│
├── components/                   # React components
│   ├── Navigation.tsx           # Top nav (Upload/Inbox/P&L/Balance/Admin)
│   ├── BottomBar.tsx            # Mobile bottom navigation
│   ├── Card.tsx                 # Reusable card component
│   ├── CommandSelect.tsx        # Searchable dropdown
│   ├── ConfidenceBadge.tsx      # Shows AI confidence scores
│   ├── MobilePickerModal.tsx    # Mobile-friendly picker
│   ├── OverheadExpensesModal.tsx # Overhead breakdown modal
│   ├── OverlayDropdownPortal.tsx # Portal for dropdowns
│   ├── PropertyPersonModal.tsx  # Property/Person details modal
│   ├── Progress.tsx             # Progress indicator
│   ├── SkeletonCard.tsx         # Loading skeleton
│   ├── Toast.tsx                # Toast notifications
│   │
│   ├── layout/
│   │   └── AdminShell.tsx       # Desktop sidebar layout
│   │
│   ├── dashboard/               # Dashboard components
│   │   ├── DashboardKpiCards.tsx
│   │   ├── FinancialSummary.tsx
│   │   ├── RecentActivity.tsx
│   │   └── CashBalanceOverview.tsx
│   │
│   ├── pnl/                     # P&L components
│   │   ├── PnLKpiRow.tsx
│   │   ├── PnLTrendChart.tsx
│   │   ├── PnLExpenseBreakdown.tsx
│   │   └── PnLDetailedTable.tsx
│   │
│   ├── ui/                      # Reusable UI components
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   │
│   └── settings/                # Settings components
│       └── PropertyManagement.tsx
│
├── config/                       # Configuration files
│   ├── options.json             # ⭐ Canonical dropdown values + keywords
│   ├── live-dropdowns.json      # Live dropdown data from Google Sheets
│   └── enhanced-keywords.json   # Enhanced keyword mappings
│
├── utils/                        # Utility functions
│   ├── matchOption.ts           # ⭐ Fuzzy matching with Levenshtein distance
│   ├── validatePayload.ts       # Validate receipt data before sending
│   ├── enhancedPrompt.ts        # AI prompt builder
│   ├── manualParse.ts           # Parse manual text input
│   ├── balanceParse.ts          # Parse balance from OCR
│   ├── currency.ts              # Currency formatting
│   ├── imageCompression.ts      # Compress images before OCR
│   ├── vendorCache.ts           # Cache vendor categories
│   └── errorTracking.ts         # Error logging
│
├── hooks/                        # Custom React hooks
│   ├── useIsMobile.ts           # Detect mobile viewport
│   └── usePageAnimations.ts     # Page transition animations
│
├── public/                       # Static assets
│   ├── favicon.svg
│   └── manifest.json
│
├── scripts/                      # Build/maintenance scripts
│   ├── sync-sheets.js           # Sync options from Google Sheets
│   ├── fetch-dropdown-values.js
│   ├── inspect-sheet-validation.js
│   └── persistent-server.sh
│
├── docs/                         # Documentation
│
├── COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js  # ⭐ Google Apps Script
├── package.json
├── next.config.js
├── tsconfig.json
├── tailwind.config.ts
├── vercel.json
└── .env.vercel.production       # Production environment variables
```

---

## 🔄 Data Flow Architecture

### Overview
```
Mobile App → Upload Receipt
           ↓
    Google Vision OCR
           ↓
     OpenAI GPT-4o (Extraction)
           ↓
   Fuzzy Matching (matchOption.ts)
           ↓
    Google Apps Script Webhook
           ↓
  Google Sheets ("BookMate P&L 2025")
           ↓
    Desktop Webapp (Analytics)
```

### Detailed Flow

#### 1. **Data Entry (Mobile App)**
- User uploads receipt image or enters manual text
- Comment field helps guide AI categorization

#### 2. **OCR Processing** (`/api/ocr`)
- Google Cloud Vision API extracts text
- Retry logic with exponential backoff (3 attempts: 1s, 2s, 4s)
- Supports JPG, PNG, PDF
- Returns extracted text + unique ID

#### 3. **AI Extraction** (`/api/extract`)
- OpenAI GPT-4o processes OCR text + optional comment
- Extracts 10-field accounting schema:
  - `day`, `month`, `year` (date components)
  - `property` (Sia Moon, Alesia House, etc.)
  - `typeOfOperation` (EXP/Revenue categories)
  - `typeOfPayment` (Cash, Bank Transfer, etc.)
  - `detail` (transaction description)
  - `ref` (invoice/reference number)
  - `debit` (expense amount)
  - `credit` (income amount)

#### 4. **Fuzzy Matching** (`utils/matchOption.ts`)
- Normalizes AI output to canonical options
- Uses Levenshtein distance + keyword matching
- Returns confidence scores (0-1)
- Falls back to defaults if confidence < 0.7

#### 5. **Validation** (`utils/validatePayload.ts`)
- Server-side validation of all fields
- Ensures amounts are valid numbers
- Checks required fields are present
- Prevents empty/invalid categories

#### 6. **Google Sheets Append** (`/api/sheets`)
- Sends validated data to Apps Script webhook
- Handles 302 redirects (Apps Script requirement)
- Secret authentication in POST body
- Appends row to "BookMate P&L 2025" sheet

#### 7. **Desktop Analytics** (Dashboard)
- Fetches P&L KPIs (`/api/pnl`)
- Fetches balances (`/api/balance/*`)
- Fetches transactions (`/api/inbox`)
- Displays charts, tables, reconciliation

---

## 🛣️ API Routes Map

### Receipt Processing (Phase 1)

#### `POST /api/ocr`
**Purpose:** Extract text from receipt images  
**Input:** `multipart/form-data` with file  
**Output:**
```json
{
  "id": "uuid",
  "text": "extracted text from image"
}
```
**Features:**
- Google Cloud Vision API
- 3-attempt retry with exponential backoff
- Supports JPG, PNG, PDF
- Base64 encoding

#### `POST /api/extract`
**Purpose:** AI extraction + fuzzy matching  
**Input:**
```json
{
  "text": "OCR text or manual input",
  "comment": "optional guidance"
}
```
**Output:**
```json
{
  "day": "27",
  "month": "Feb",
  "year": "2025",
  "property": "Sia Moon - Land - General",
  "typeOfOperation": "EXP - Construction - Wall",
  "typeOfPayment": "Cash",
  "detail": "Materials",
  "ref": "",
  "debit": 4785,
  "credit": 0,
  "confidence": {
    "property": 0.95,
    "typeOfOperation": 0.88,
    "typeOfPayment": 1.0
  }
}
```
**Features:**
- OpenAI GPT-4o with custom prompt
- Enhanced keyword matching
- Auto-detects Revenue vs EXP for credit/debit
- Returns empty string for uncertain categories

#### `POST /api/sheets`
**Purpose:** Append validated data to Google Sheets  
**Input:** 10-field receipt payload  
**Output:**
```json
{
  "success": true,
  "message": "Receipt added to Google Sheet successfully"
}
```
**Features:**
- Server-side validation
- Apps Script webhook with secret auth
- Handles 302 redirects
- Normalizes dropdown values

### Analytics (Phase 2)

#### `GET/POST /api/pnl`
**Purpose:** Fetch P&L KPI data  
**Output:**
```json
{
  "ok": true,
  "data": {
    "month": {
      "revenue": 50000,
      "overheads": 20000,
      "propertyPersonExpense": 15000,
      "gop": 15000,
      "ebitdaMargin": 30
    },
    "year": { ... }
  },
  "updatedAt": "2025-11-02T10:30:00.000Z",
  "cached": false,
  "warnings": [],
  "computedFallbacks": []
}
```
**Features:**
- 60-second in-memory cache
- Fetches from Apps Script named ranges
- Auto-computes GOP and EBITDA margin
- Handles 302 redirects

#### `GET/POST /api/inbox`
**Purpose:** Fetch all transactions  
**Output:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "rowNumber": 10,
      "day": "27",
      "month": "Feb",
      "year": "2025",
      "property": "Sia Moon - Land - General",
      "typeOfOperation": "EXP - Construction - Wall",
      "typeOfPayment": "Cash",
      "detail": "Materials",
      "ref": "",
      "debit": 4785,
      "credit": 0,
      "date": "27 Feb 2025",
      "amount": 4785,
      "status": "sent"
    }
  ],
  "count": 1,
  "cached": true
}
```
**Features:**
- 5-second cache
- Returns all sheet rows
- Includes row numbers for deletion

#### `DELETE /api/inbox`
**Purpose:** Delete a transaction by row number  
**Input:**
```json
{
  "rowNumber": 10
}
```
**Output:**
```json
{
  "ok": true,
  "success": true,
  "message": "Entry deleted successfully",
  "deletedRow": 10
}
```

#### `GET /api/options`
**Purpose:** Fetch dropdown options  
**Output:**
```json
{
  "ok": true,
  "data": {
    "properties": ["Sia Moon - Land - General", ...],
    "typeOfOperations": ["EXP - Construction - Wall", ...],
    "typeOfPayments": ["Cash", "Bank Transfer - Bangkok Bank - Shaun Ducker", ...]
  },
  "updatedAt": "2025-10-30T09:38:11.978Z",
  "cached": true,
  "source": "config_file"
}
```
**Features:**
- Reads from `config/live-dropdowns.json`
- Synced from Google Sheets
- Used by mobile app

### Balance Tracking

#### `POST /api/balance/get`
**Purpose:** Get latest balances from Google Sheets  
**Output:**
```json
{
  "ok": true,
  "allBalances": {
    "Cash": { "bankName": "Cash", "balance": 50000, "timestamp": "..." },
    "Bank Transfer - Bangkok Bank - Shaun Ducker": { ... }
  },
  "reconcile": {
    "totalBalance": 150000,
    "lastUpdated": "2025-11-02"
  }
}
```
**Features:**
- 30-second cache
- Returns all bank/cash accounts
- Used by dashboard

#### `POST /api/balance/save`
**Purpose:** Save new balance for a bank account  
**Input:**
```json
{
  "bankName": "Cash",
  "balance": 55000,
  "note": "Monthly reconciliation"
}
```
**Output:**
```json
{
  "ok": true,
  "message": "Balance saved successfully",
  "savedData": {
    "bankName": "Cash",
    "balance": 55000
  }
}
```
**Features:**
- Appends to "Bank & Cash Balance" sheet
- Invalidates all balance caches
- Supports individual bank tracking

#### `GET/POST /api/balance/by-property`
**Purpose:** Calculate running balances per bank  
**Output:**
```json
{
  "ok": true,
  "propertyBalances": [
    {
      "property": "Cash",
      "balance": 55000,
      "uploadedBalance": 50000,
      "uploadedDate": "2025-11-01",
      "totalRevenue": 10000,
      "totalExpense": 5000,
      "transactionCount": 15,
      "variance": 5000
    }
  ],
  "summary": {
    "totalBalance": 150000,
    "totalRevenue": 50000,
    "totalExpense": 30000,
    "propertyCount": 3,
    "transactionCount": 45
  }
}
```
**Features:**
- 30-second cache
- Fetches uploaded balances from sheet
- Fetches transactions from inbox
- Calculates: `currentBalance = uploadedBalance + revenues - expenses`

#### `POST /api/balance/ocr`
**Purpose:** Extract balance from bank statement image  
**Input:** `multipart/form-data` with file  
**Output:**
```json
{
  "ok": true,
  "bankBalance": 55000,
  "extractedText": "Current Balance: 55,000.00 THB"
}
```

---

## 📱 UI Pages & Components

### Core Pages

#### `/dashboard` (Desktop Analytics Hub)
**Layout:** AdminShell with sidebar  
**Components:**
- `DashboardKpiCards` - P&L metrics + balance summary
- `FinancialSummary` - Revenue/expenses charts
- `RecentActivity` - Last 10 transactions
- `CashBalanceOverview` - Bank/cash breakdown

**Features:**
- Refresh button
- Real-time data fetching
- Error toast notifications
- Loading states

#### `/pnl` (P&L Analytics)
**Layout:** AdminShell  
**Components:**
- `PnLKpiRow` - Month/year KPIs
- `PnLTrendChart` - Revenue/expenses line chart
- `PnLExpenseBreakdown` - Pie charts for overheads + property/person
- `PnLDetailedTable` - Full P&L table

**Features:**
- Period toggle (month/year)
- Refresh button
- Computed GOP and EBITDA margin
- Fallback warnings in console

#### `/balance` (Balance Tracking)
**Layout:** AdminShell  
**Components:**
- Total balance card (gradient)
- Cash vs Bank breakdown
- Individual account cards
- Upload modal (OCR + manual entry)
- Reconciliation summary

**Features:**
- Bank selection dropdown
- OCR from bank statements
- Manual balance entry
- Money tracking reconciliation (100% tracking indicator)
- Cache invalidation after save

#### `/inbox` (Transaction Management)
**Layout:** AdminShell  
**Components:**
- Desktop: Table view
- Mobile: Card view
- Delete button per entry
- Refresh button
- Empty state

**Features:**
- 5-second cache
- Delete confirmation
- Synced status badges
- Responsive layout

#### `/upload` (Phase 1 - Receipt Upload)
**Layout:** Navigation  
**Components:**
- Drag-and-drop file upload
- Comment input (guides AI)
- Upload button

**Flow:** Upload → `/review/[id]`

#### `/review/[id]` (Phase 1 - Review & Edit)
**Layout:** Navigation  
**Components:**
- Editable form fields (10 fields)
- Dropdown selectors with fuzzy search
- Confidence badges
- Submit button

**Flow:** Submit → `/inbox`

### Navigation Components

#### `Navigation.tsx`
**Desktop-first top navbar**  
Links: Upload, Inbox, P&L, Balance, Admin

#### `AdminShell.tsx`
**Desktop sidebar layout**  
Links: Dashboard, P&L, Balances, Inbox, Settings, Admin

#### `BottomBar.tsx`
**Mobile bottom navigation** (Phase 1)

---

## 📊 Google Sheets Integration

### Apps Script Webhook
**File:** `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`  
**Version:** V8.4  
**URL:** `https://script.google.com/macros/s/AKfycbwKa0f0m_gMfCq7SZY8CJUpaBYdo_DLTjSMWvWYMQOenKP0UO343uWhaR46ngHMhmFl/exec`

### Supported Actions

| Action | Purpose | Input | Output |
|--------|---------|-------|--------|
| `append` | Add transaction | Receipt payload | Success/error |
| `getPnL` | Fetch P&L KPIs | Secret | Month/year data |
| `getInbox` | Fetch all transactions | Secret | Array of receipts |
| `deleteEntry` | Delete row | Row number | Success/error |
| `balancesAppend` | Save balance | Bank name + balance | Success/error |
| `balancesGetLatest` | Get all balances | Secret | Balance map |
| `getPropertyPersonDetails` | Expense breakdown | Period | Category details |
| `getOverheadExpensesDetails` | Overhead breakdown | Period | Overhead details |
| `list_named_ranges` | Debug named ranges | Secret | Range list |

### Named Ranges (P&L Sheet)
```
# Month KPIs
month_revenue
month_overheads
month_property_person_expense
month_gop
month_ebitda_margin

# Year KPIs
year_revenue
year_overheads
year_property_person_expense
year_gop
year_ebitda_margin
```

### Sheets Structure

#### "BookMate P&L 2025" (Main)
**Columns:** A (empty), B-K (data)
- B: Day
- C: Month
- D: Year
- E: Property
- F: Type of operation
- G: Type of payment
- H: Detail
- I: Ref
- J: Debit
- K: Credit

**Header Row:** 6  
**Data Starts:** Row 7

#### "Bank & Cash Balance"
**Columns:** A-D
- A: Timestamp
- B: Bank Name
- C: Balance
- D: Note

**Header Row:** 1  
**Data Starts:** Row 2

#### "P&L (DO NOT EDIT)"
**Auto-generated P&L summary**  
Contains named ranges for KPI extraction

---

## 🔐 Environment Variables

### Production (`.env.vercel.production`)

```bash
# Base URL
BASE_URL="https://accounting.siamoon.com"
# TODO: Update to bookmate.siamoon.com

# Google Cloud
GOOGLE_VISION_KEY="AIzaSy..."
GOOGLE_SHEET_ID="1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'
GOOGLE_APPLICATION_CREDENTIALS="/path/to/json"

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Apps Script Webhooks (all point to same URL)
SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
SHEETS_WEBHOOK_SECRET="VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8="
SHEETS_PNL_URL="https://script.google.com/macros/s/AKfycb.../exec"
SHEETS_BALANCES_APPEND_URL="https://script.google.com/macros/s/AKfycb.../exec"
SHEETS_BALANCES_GET_URL="https://script.google.com/macros/s/AKfycb.../exec"

# Vercel
VERCEL="1"
VERCEL_ENV="production"
NODE_ENV="production"
```

### Required for Local Development
Create `.env.local` with same variables.

---

## ⚙️ Configuration Files

### `config/options.json`
**Canonical source of truth** for all dropdown values + keyword mappings.

**Structure:**
```json
{
  "properties": [...],
  "typeOfOperation": [...],
  "typeOfPayment": [...],
  "keywords": {
    "properties": {
      "Sia Moon - Land - General": ["sia", "moon", "land", "general"],
      ...
    },
    "typeOfOperation": {
      "EXP - Construction - Wall": ["wall", "materials", "construction"],
      ...
    },
    "typeOfPayment": {
      "Cash": ["cash"],
      ...
    }
  }
}
```

### `config/live-dropdowns.json`
**Synced from Google Sheets** via `sync-sheets.js`.  
Used by `/api/options` endpoint.

### `next.config.js`
```js
{
  reactStrictMode: true,
  images: { formats: ['image/avif', 'image/webp'] },
  compiler: { removeConsole: production ? { exclude: ['error', 'warn'] } : false },
  experimental: { optimizePackageImports: ['lucide-react'] }
}
```

### `vercel.json`
```json
{
  "framework": "nextjs",
  "functions": {
    "app/api/**/*.ts": { "maxDuration": 30 }
  },
  "headers": [/* CORS headers */]
}
```

---

## 🧰 Utilities & Helpers

### `utils/matchOption.ts`
**Fuzzy matching engine**

**Functions:**
- `matchProperty(input, comment?)` → `{ value, confidence, matched }`
- `matchTypeOfOperation(input, comment?)` → `{ value, confidence, matched }`
- `matchTypeOfPayment(input, comment?)` → `{ value, confidence, matched }`
- `normalizeDropdownFields(data, comment?)` → All three matches
- `getOptions()` → Returns canonical options

**Matching Logic:**
1. Exact match → 1.0 confidence
2. Keyword matching → 0.8-0.95 confidence
3. Levenshtein distance → 0.7-1.0 confidence
4. Default fallback if < 0.7

**Special Cases:**
- "sia" → "Sia Moon - Land - General" (not "Alesia House")
- Empty operation → "" (user selects manually)
- Auto-detects Revenue vs EXP for credit/debit

### `utils/validatePayload.ts`
**Server-side validation**

```typescript
export interface ReceiptPayload {
  day: string;
  month: string;
  year: string;
  property: string;
  typeOfOperation: string;
  typeOfPayment: string;
  detail: string;
  ref: string;
  debit: number;
  credit: number;
}

export function validatePayload(data: any): {
  isValid: boolean;
  error?: string;
  data?: ReceiptPayload;
}
```

### Other Utilities
- `enhancedPrompt.ts` - Build AI prompts with live options
- `manualParse.ts` - Parse "debit - 2000 baht - salaries - cash"
- `balanceParse.ts` - Extract balance from OCR text
- `currency.ts` - Format THB amounts
- `imageCompression.ts` - Compress images > 1MB (65% reduction)
- `vendorCache.ts` - Cache vendor→category mappings (localStorage)
- `errorTracking.ts` - Error logging

---

## ✨ Key Features

### Phase 1 Features (Complete ✅)
1. **Receipt Upload**
   - Drag-and-drop interface
   - Comment-guided extraction
   - Supports JPG, PNG, PDF

2. **OCR Processing**
   - Google Cloud Vision API
   - Retry logic (3 attempts)
   - Base64 encoding

3. **AI Extraction**
   - OpenAI GPT-4o
   - 10-field accounting schema
   - Enhanced keyword matching
   - Auto-detects Revenue vs EXP

4. **Fuzzy Matching**
   - Levenshtein distance
   - Keyword matching
   - Confidence scores
   - Fallback defaults

5. **Review & Edit**
   - Editable form fields
   - Dropdown selectors
   - Confidence badges
   - Validation

6. **Google Sheets Sync**
   - Apps Script webhook
   - Secret authentication
   - 302 redirect handling
   - Real-time append

### Phase 2 Features (Current - Desktop Analytics)
1. **Dashboard**
   - P&L KPI cards
   - Financial summary charts
   - Recent activity feed
   - Cash/balance overview

2. **P&L Analytics**
   - Month/year KPIs
   - Revenue/expenses trends
   - Expense breakdown (pie charts)
   - Detailed P&L table
   - GOP and EBITDA margin

3. **Balance Tracking**
   - Individual bank accounts
   - Cash vs bank breakdown
   - Upload new balances (OCR + manual)
   - Running balance calculation
   - Money tracking reconciliation (100% indicator)

4. **Transaction Inbox**
   - View all entries
   - Delete functionality
   - Desktop table + mobile cards
   - 5-second cache

5. **Caching Strategy**
   - P&L: 60-second cache
   - Balances: 30-second cache
   - Inbox: 5-second cache
   - Options: File-based (static)

6. **Desktop-First Design**
   - AdminShell sidebar layout
   - Responsive breakpoints
   - Mobile app handles data entry
   - Analytics/viewing focus

### Performance Optimizations
- **Image Compression:** 65% reduction for files > 1MB
- **Vendor Caching:** 100% API call reduction for repeat vendors
- **In-Memory Caching:** 60s (P&L), 30s (balance), 5s (inbox)
- **Next.js Optimizations:** 
  - Console log removal in production
  - Image optimization (AVIF/WebP)
  - Package import optimization (lucide-react)

---

## 🔄 Data Flow Examples

### Example 1: Receipt Upload (Phase 1)
```
1. User uploads receipt image at /upload
2. POST /api/ocr → Google Vision → "27 Feb 2025 wall materials 4785 baht"
3. POST /api/extract → OpenAI GPT-4o → {
     day: "27", month: "Feb", year: "2025",
     property: "Sia Moon - Land - General",
     typeOfOperation: "EXP - Construction - Wall",
     typeOfPayment: "Cash",
     detail: "Materials",
     debit: 4785, credit: 0
   }
4. matchOption.ts → Normalize to canonical values + confidence scores
5. User reviews/edits at /review/[id]
6. POST /api/sheets → Apps Script → Append to Google Sheets
7. Redirect to /inbox
```

### Example 2: Dashboard Load (Phase 2)
```
1. User navigates to /dashboard
2. Parallel API calls:
   - GET /api/pnl → Apps Script → Month/year KPIs
   - POST /api/balance/get → Apps Script → All balances
   - GET /api/inbox → Apps Script → Last 10 transactions
3. DashboardKpiCards renders P&L metrics + balance summary
4. FinancialSummary renders revenue/expense charts
5. RecentActivity renders transaction feed
6. CashBalanceOverview renders bank/cash breakdown
```

### Example 3: Balance Update
```
1. User clicks "Update Balances" at /balance
2. Selects bank: "Cash"
3. Option A - OCR:
   - Uploads bank statement image
   - POST /api/balance/ocr → Google Vision → Extract balance
   - Auto-fills balance field
4. Option B - Manual:
   - Types new balance: 55000
5. Adds note: "Monthly reconciliation"
6. POST /api/balance/save → {
     bankName: "Cash",
     balance: 55000,
     note: "Monthly reconciliation"
   }
7. Apps Script → Append to "Bank & Cash Balance" sheet
8. Cache invalidation (get cache + by-property cache)
9. Refresh balance display
```

---

## 🚀 Deployment

**Platform:** Vercel  
**Domain:** `bookmate.siamoon.com` (migrating from accounting.siamoon.com)  
**Build:** `npm run build`  
**Output:** `.next` directory  
**Region:** `iad1` (US East)

### Environment Setup
1. Set all env vars in Vercel dashboard
2. Ensure `BASE_URL` matches production domain
3. Apps Script URL is same for all endpoints
4. Secret matches between webapp and Apps Script

### DNS Configuration
```
bookmate.siamoon.com → CNAME → cname.vercel-dns.com
```

---

## 📝 Next Steps / TODOs

1. **Branding Update**
   - Update `BASE_URL` to `bookmate.siamoon.com`
   - Update all references from "Accounting Buddy" to "BookMate"
   - Update logo and favicon

2. **Mobile App Integration**
   - Finalize mobile app (React Native / Flutter?)
   - Move upload functionality fully to mobile
   - Desktop remains analytics-only

3. **Enhanced Features**
   - Balance trend charts (historical tracking)
   - Category breakdown with drill-down
   - Custom date range selection
   - Export to CSV/PDF

4. **Performance**
   - Implement Redis for caching (replace in-memory)
   - Add database for transaction storage
   - Optimize large sheet reads

5. **Security**
   - Rotate webhook secret regularly
   - Add rate limiting
   - Implement user authentication

---

## 📚 Documentation References

- **Main README:** `README.md`
- **Phase 1 Summary:** `PHASE1_COMPLETE_SUMMARY.md`
- **Apps Script:** `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`
- **Sync Guide:** `SYNC_SHEETS_GUIDE.md`
- **Test Results:** `COMPLETE_TEST_RESULTS.md`

---

## 🎨 Design System

### Colors
- **Background:** Black (`#000000`)
- **Surface:** Slate-900 to Slate-950 gradients
- **Primary:** Blue-600 to Purple-600 gradients
- **Text:** White/Slate-300/Slate-400
- **Success:** Green-500
- **Danger:** Red-500
- **Warning:** Yellow-500

### Typography
- **Font:** System fonts (SF Pro, Segoe UI, etc.)
- **Headings:** Bold, white
- **Body:** Regular, slate-300
- **Labels:** Medium, slate-400

### Components
- **Cards:** Gradient backgrounds with border
- **Buttons:** Gradient hover effects
- **Tables:** Hover states with border transitions
- **Modals:** Backdrop blur with slide-in animations

---

**Last Updated:** November 2, 2025  
**Version:** Phase 2 (Desktop Analytics Dashboard)  
**Repository:** TOOL2U/BookMate  
**Maintained by:** Shaun Ducker
