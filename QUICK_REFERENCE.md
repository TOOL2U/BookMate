# 🎯 BookMate Webapp - Quick Reference Guide

**Last Updated:** November 2, 2025  
**Repository:** `TOOL2U/BookMate` (renamed from BookMate-Application)  
**Production URL:** `bookmate.siamoon.com` (migrating from accounting.siamoon.com)

---

## 📚 Documentation Index

1. **[BOOKMATE_WEBAPP_COMPLETE_MAP.md](./BOOKMATE_WEBAPP_COMPLETE_MAP.md)** - Complete architecture guide
2. **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - Visual system diagrams
3. **[README.md](./README.md)** - Project overview and getting started

---

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
# → http://localhost:3000
```

### Environment Variables (Required)
```bash
# API Keys
GOOGLE_VISION_KEY="AIzaSy..."
OPENAI_API_KEY="sk-proj-..."
GOOGLE_SHEET_ID="1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8"
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# Apps Script Webhook (same URL for all)
SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/AKfycb.../exec"
SHEETS_WEBHOOK_SECRET="VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8="
SHEETS_PNL_URL="https://script.google.com/macros/s/AKfycb.../exec"
SHEETS_BALANCES_APPEND_URL="https://script.google.com/macros/s/AKfycb.../exec"
SHEETS_BALANCES_GET_URL="https://script.google.com/macros/s/AKfycb.../exec"

# Base URL
BASE_URL="https://bookmate.siamoon.com"
```

---

## 🗂️ Project Structure at a Glance

```
BookMate-webapp/
├── app/
│   ├── api/              # Backend API routes
│   │   ├── ocr/          # Google Vision OCR
│   │   ├── extract/      # OpenAI extraction
│   │   ├── sheets/       # Google Sheets webhook
│   │   ├── pnl/          # P&L analytics
│   │   ├── balance/      # Balance tracking
│   │   ├── inbox/        # Transaction management
│   │   └── options/      # Dropdown options
│   │
│   ├── dashboard/        # ⭐ Main analytics hub
│   ├── pnl/              # P&L analytics page
│   ├── balance/          # Balance tracking page
│   ├── inbox/            # Transaction inbox
│   └── upload/           # Receipt upload (Phase 1)
│
├── components/
│   ├── layout/           # AdminShell, Navigation
│   ├── dashboard/        # Dashboard components
│   ├── pnl/              # P&L components
│   └── ui/               # Reusable UI components
│
├── config/
│   ├── options.json      # ⭐ Canonical dropdowns + keywords
│   └── live-dropdowns.json # Synced from Google Sheets
│
├── utils/
│   ├── matchOption.ts    # ⭐ Fuzzy matching engine
│   ├── validatePayload.ts # Server-side validation
│   └── ...               # Other utilities
│
└── COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js  # Google Apps Script
```

---

## 🔄 Data Flow Summary

### Phase 1: Receipt Processing (Mobile → Sheets)
```
Mobile App Upload
  ↓
/api/ocr (Google Vision)
  ↓
/api/extract (OpenAI + Fuzzy Match)
  ↓
Review & Edit
  ↓
/api/sheets (Apps Script Webhook)
  ↓
Google Sheets ("BookMate P&L 2025")
```

### Phase 2: Analytics (Sheets → Desktop)
```
Google Sheets
  ↓
Apps Script (getPnL, balancesGetLatest, getInbox)
  ↓
API Routes (60s/30s/5s cache)
  ↓
React Components (Dashboard, P&L, Balance, Inbox)
  ↓
Desktop Browser
```

---

## 🎨 Key Pages

| Page | Route | Purpose | Layout |
|------|-------|---------|--------|
| **Dashboard** | `/dashboard` | Main analytics hub | AdminShell |
| **P&L** | `/pnl` | Profit & Loss analytics | AdminShell |
| **Balance** | `/balance` | Balance tracking & reconciliation | AdminShell |
| **Inbox** | `/inbox` | Transaction list + delete | AdminShell |
| **Upload** | `/upload` | Receipt upload (Phase 1) | Navigation |
| **Review** | `/review/[id]` | Edit extracted data (Phase 1) | Navigation |

---

## 🛣️ API Routes Cheat Sheet

| Endpoint | Method | Purpose | Cache |
|----------|--------|---------|-------|
| `/api/ocr` | POST | Extract text from image | None |
| `/api/extract` | POST | AI extraction + fuzzy match | None |
| `/api/sheets` | POST | Append to Google Sheets | None |
| `/api/pnl` | GET | Fetch P&L KPIs | 60s |
| `/api/inbox` | GET | Fetch all transactions | 5s |
| `/api/inbox` | DELETE | Delete transaction | None |
| `/api/balance/get` | POST | Get latest balances | 30s |
| `/api/balance/save` | POST | Save new balance | None |
| `/api/balance/by-property` | POST | Running balance calc | 30s |
| `/api/balance/ocr` | POST | Extract balance from image | None |
| `/api/options` | GET | Fetch dropdown options | Static |

---

## 🧰 Key Utilities

### `utils/matchOption.ts`
**Fuzzy matching engine with Levenshtein distance**

```typescript
// Match property name
matchProperty(input: string, comment?: string): MatchResult
// → { value: "Sia Moon - Land - General", confidence: 0.95, matched: true }

// Match type of operation
matchTypeOfOperation(input: string, comment?: string): MatchResult
// → { value: "EXP - Construction - Wall", confidence: 0.88, matched: true }

// Match type of payment
matchTypeOfPayment(input: string, comment?: string): MatchResult
// → { value: "Cash", confidence: 1.0, matched: true }

// Normalize all fields at once
normalizeDropdownFields(data, comment?): NormalizedData
```

### `utils/validatePayload.ts`
**Server-side validation**

```typescript
validatePayload(data: any): {
  isValid: boolean;
  error?: string;
  data?: ReceiptPayload;
}
```

### Other Utilities
- `enhancedPrompt.ts` - Build AI prompts with live options
- `manualParse.ts` - Parse manual text input
- `balanceParse.ts` - Extract balance from OCR
- `imageCompression.ts` - 65% size reduction for images > 1MB
- `vendorCache.ts` - Cache vendor→category mappings

---

## 📊 Google Sheets Structure

### Sheet 1: "BookMate P&L 2025" (Main Data)
| Col | Field | Example |
|-----|-------|---------|
| A | (empty) | |
| B | Day | 27 |
| C | Month | Feb |
| D | Year | 2025 |
| E | Property | Sia Moon - Land - General |
| F | Type of operation | EXP - Construction - Wall |
| G | Type of payment | Cash |
| H | Detail | Materials |
| I | Ref | INV-001 |
| J | Debit | 4785 |
| K | Credit | 0 |

**Header Row:** 6  
**Data Starts:** Row 7

### Sheet 2: "Bank & Cash Balance"
| Col | Field | Example |
|-----|-------|---------|
| A | Timestamp | 2025-11-02 10:30:00 |
| B | Bank Name | Cash |
| C | Balance | 50000 |
| D | Note | Monthly reconciliation |

**Header Row:** 1  
**Data Starts:** Row 2

### Sheet 3: "P&L (DO NOT EDIT)" (Auto-generated)
Contains named ranges for KPI extraction:
- `month_revenue`, `year_revenue`
- `month_overheads`, `year_overheads`
- `month_property_person_expense`, `year_property_person_expense`
- `month_gop`, `year_gop`
- `month_ebitda_margin`, `year_ebitda_margin`

---

## 🔧 Apps Script Actions

**Webhook URL:** Same for all endpoints  
**Secret:** `VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=`

| Action | Purpose | Input | Output |
|--------|---------|-------|--------|
| `append` | Add transaction | Receipt payload | Success/error |
| `getPnL` | Fetch P&L KPIs | Secret | Month/year data |
| `getInbox` | Fetch transactions | Secret | Array of receipts |
| `deleteEntry` | Delete row | Row number | Success/error |
| `balancesAppend` | Save balance | Bank + balance | Success/error |
| `balancesGetLatest` | Get balances | Secret | Balance map |
| `getPropertyPersonDetails` | Expense breakdown | Period | Category details |
| `getOverheadExpensesDetails` | Overhead breakdown | Period | Overhead details |
| `list_named_ranges` | Debug ranges | Secret | Range list |

---

## 📈 Caching Strategy

| Layer | Type | TTL | Purpose |
|-------|------|-----|---------|
| Apps Script | CacheService | 60s | Named ranges, KPIs |
| Next.js API | In-memory | 60s | P&L data |
| Next.js API | In-memory | 30s | Balance data |
| Next.js API | In-memory | 5s | Inbox data |
| Browser | localStorage | Infinite | Vendor cache |
| Config | Static file | Build-time | Dropdown options |

**Cache Invalidation:**
- Manual: Refresh button in UI
- Automatic: TTL expiration
- POST operations: Invalidate related caches

---

## 🎨 Design System

### Colors
```css
/* Background */
--bg-primary: #000000;
--bg-surface: #0f172a;

/* Gradients */
--gradient-primary: linear-gradient(to bottom right, #2563eb, #9333ea);
--gradient-success: linear-gradient(to bottom right, #22c55e, #3b82f6);

/* Text */
--text-primary: #ffffff;
--text-secondary: #cbd5e1;
--text-tertiary: #64748b;
```

### Components
- **Cards:** Gradient backgrounds with `backdrop-blur-sm`
- **Buttons:** Gradient hover with shadow effects
- **Tables:** Hover states with smooth transitions
- **Modals:** Backdrop blur with slide-in animations

---

## 🔒 Security

### Authentication
- Apps Script webhook uses secret in POST body
- No user authentication yet (single user)

### Environment Variables
- Never commit `.env.local`
- Use Vercel dashboard for production secrets
- Rotate webhook secret regularly

### API Keys
- Google Vision API key (server-side only)
- OpenAI API key (server-side only)
- Service account JSON (server-side only)

---

## 🚢 Deployment

### Vercel Setup
1. Connect GitHub repo: `TOOL2U/BookMate`
2. Set all environment variables in Vercel dashboard
3. Deploy from `main` branch
4. Domain: `bookmate.siamoon.com`

### Build Command
```bash
npm run build
```

### Environment Variables Checklist
- [x] `GOOGLE_VISION_KEY`
- [x] `OPENAI_API_KEY`
- [x] `GOOGLE_SHEET_ID`
- [x] `GOOGLE_SERVICE_ACCOUNT_KEY`
- [x] `SHEETS_WEBHOOK_URL`
- [x] `SHEETS_WEBHOOK_SECRET`
- [x] `SHEETS_PNL_URL`
- [x] `SHEETS_BALANCES_APPEND_URL`
- [x] `SHEETS_BALANCES_GET_URL`
- [x] `BASE_URL`

---

## 🧪 Testing

### Manual Testing
```bash
# Test all endpoints
npm run test

# Test with verbose logging
npm run test:verbose

# Skip build (faster)
npm run test:quick
```

### Test Scripts
- `test-all.js` - Comprehensive test runner
- `test-service-account.js` - Test Google Sheets connection
- `test-production-endpoints.sh` - Test production API
- `test-mobile-viewport.js` - Test mobile responsiveness

---

## 📝 Common Tasks

### Sync Dropdown Options from Google Sheets
```bash
npm run sync
# or
node sync-sheets.js
```

### Fetch Fresh Dropdown Values
```bash
npm run sync-dropdowns
# or
node scripts/fetch-live-dropdowns.js
```

### Inspect Sheet Validation
```bash
npm run inspect-sheet
# or
node scripts/inspect-sheet-validation.js
```

### Run Persistent Dev Server
```bash
npm run dev:persistent  # Start server in background
npm run dev:status      # Check server logs
npm run dev:stop        # Stop server
npm run dev:check       # Check if port 3000 is free
```

---

## 🐛 Troubleshooting

### Issue: "Apps Script returns 302 redirect"
**Solution:** Use `redirect: 'manual'` in fetch options + follow redirect manually

### Issue: "Empty category detected"
**Solution:** AI returned empty string → force user to select manually

### Issue: "Cache not invalidating"
**Solution:** Check TTL settings, use manual refresh, or restart server

### Issue: "Fuzzy matching incorrect"
**Solution:** Update keywords in `config/options.json`, adjust confidence threshold

### Issue: "Balance not updating"
**Solution:** Check cache invalidation in `balance/save/route.ts`, verify sheet permissions

---

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Image Compression | 65% reduction for files > 1MB |
| Vendor Cache Hit Rate | ~50% (estimated) |
| API Cost Reduction | 100% for repeat vendors |
| Page Load Time | < 1s (after initial load) |
| Build Time | 2-3 minutes on Vercel |

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Migrate domain to `bookmate.siamoon.com`
- [ ] Update all "Accounting Buddy" branding to "BookMate"
- [ ] Mobile app integration (React Native / Flutter)
- [ ] Balance trend charts (historical tracking)
- [ ] Category breakdown with drill-down
- [ ] Custom date range selection
- [ ] Export to CSV/PDF
- [ ] User authentication
- [ ] Redis for caching (replace in-memory)
- [ ] Database for transaction storage

### Performance Optimizations
- [ ] Implement Redis for distributed caching
- [ ] Add database (PostgreSQL) for faster queries
- [ ] Optimize large sheet reads with pagination
- [ ] Add rate limiting
- [ ] Implement service worker for offline support

---

## 📞 Support & Maintenance

### Key Files to Monitor
- `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js` - Apps Script code
- `config/options.json` - Canonical dropdown values
- `.env.vercel.production` - Production environment variables
- `vercel.json` - Deployment configuration

### Regular Maintenance Tasks
1. **Weekly:** Check error logs in Vercel dashboard
2. **Monthly:** Rotate webhook secret
3. **Quarterly:** Update dependencies (`npm update`)
4. **As needed:** Sync dropdown options (`npm run sync`)

### Version History
- **V8.4:** Fixed balance tracking + P&L sheet name
- **V7:** Added balance management endpoints
- **V6:** Added P&L analytics + caching
- **V5:** Added inbox + delete functionality
- **V4:** Polish & performance optimizations
- **V3:** Google Sheets integration
- **V2:** OpenAI AI extraction
- **V1:** Google Vision OCR
- **V0:** UI scaffold

---

## 🎓 Learning Resources

### Documentation
- [Next.js App Router](https://nextjs.org/docs/app)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Apps Script](https://developers.google.com/apps-script)
- [OpenAI API](https://platform.openai.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Internal Docs
- `BOOKMATE_WEBAPP_COMPLETE_MAP.md` - Full architecture
- `ARCHITECTURE_DIAGRAM.md` - Visual diagrams
- `PHASE1_COMPLETE_SUMMARY.md` - Phase 1 summary
- `SYNC_SHEETS_GUIDE.md` - Dropdown sync guide

---

**Repository:** [TOOL2U/BookMate](https://github.com/TOOL2U/BookMate)  
**Maintained by:** Shaun Ducker  
**Last Updated:** November 2, 2025
