# 📊 Phase 1 Sync Audit Report - Webapp Engineering Team

**Date:** October 31, 2025  
**Auditor:** Webapp Engineering Team (AI Assistant)  
**Project:** Accounting Buddy - Dropdown Data Source Audit  
**Status:** ⚠️ **PARTIALLY SYNCED** - Static config files, not live API

---

## 🎯 Executive Summary

**Current State:** All dropdown data (`typeOfOperation`, `typeOfPayment`, `property`) is sourced from **STATIC JSON configuration files** in the repository, NOT from live Google Sheets API calls.

**Sync Mechanism:** A manual sync script (`sync-sheets.js`) must be run by developers to update the static config files when Google Sheets changes.

**Impact:** Changes made directly in Google Sheets do NOT automatically reflect in the webapp until a developer runs `npm run sync` and redeploys.

---

## 📋 Dropdown Data Source Analysis

| Field | Data Source | File(s) / Folder(s) | Live Sync? | Notes |
|-------|-------------|---------------------|------------|-------|
| **typeOfOperation** | Static JSON file | `config/options.json` (line 11-45)<br>`config/live-dropdowns.json` (line 11-45) | ❌ **NO** | Hardcoded in repo. Updated via `npm run sync` script. |
| **typeOfPayment** | Static JSON file | `config/options.json` (line 46-51)<br>`config/live-dropdowns.json` (line 46-51) | ❌ **NO** | Hardcoded in repo. Updated via `npm run sync` script. |
| **property** | Static JSON file | `config/options.json` (line 2-10)<br>`config/live-dropdowns.json` (line 2-10) | ❌ **NO** | Hardcoded in repo. Updated via `npm run sync` script. |

---

## 🔍 Detailed Analysis

### **1. How Dropdowns Are Currently Loaded**

#### **Frontend Components:**
- **Upload Page** (`app/upload/page.tsx` line 10, 43):
  ```typescript
  import { getOptions } from '@/utils/matchOption';
  const options = getOptions();
  ```

- **Review Page** (`app/review/[id]/page.tsx` line 7, 34):
  ```typescript
  import { getOptions } from '@/utils/matchOption';
  const options = getOptions();
  ```

#### **Utility Function:**
- **`utils/matchOption.ts`** (line 1, 286-292):
  ```typescript
  import options from '@/config/options.json';
  
  export function getOptions() {
    return {
      properties: options.properties,
      typeOfOperation: options.typeOfOperation,
      typeOfPayment: options.typeOfPayment,
    };
  }
  ```

**Conclusion:** All dropdown data is imported from static JSON files at build time.

---

### **2. Configuration Files**

#### **`config/options.json`** (618 lines)
- **Purpose:** Primary source of dropdown options + AI keywords
- **Last Updated:** Via `npm run sync` script
- **Content:**
  - `properties`: 7 items (line 2-10)
  - `typeOfOperation`: 33 items (line 11-45)
  - `typeOfPayment`: 4 items (line 46-51)
  - `keywords`: AI matching keywords for each option (line 52-617)

#### **`config/live-dropdowns.json`** (80 lines)
- **Purpose:** Duplicate of dropdown data with metadata
- **Last Updated:** Via `npm run sync` script
- **Content:**
  - Same dropdown arrays as `options.json`
  - Metadata: `extractedAt`, `source`, `ranges`, `filtered`, `fetchedAt`
  - **Note:** Despite the name "live-dropdowns", this is NOT live - it's a static snapshot

#### **`config/enhanced-keywords.json`**
- **Purpose:** Enhanced AI keywords for matching
- **Last Updated:** Via `npm run sync` script

---

### **3. Sync Mechanism**

#### **Sync Script:** `sync-sheets.js` (945 lines)
- **Purpose:** Fetch dropdown data from Google Sheets and update config files
- **Trigger:** Manual - Developer must run `npm run sync`
- **Process:**
  1. Connects to Google Sheets API using service account
  2. Reads dropdown options from "Data" sheet:
     - `property`: Range `Data!A38:A43`
     - `typeOfOperation`: Range `Data!A4:A35`
     - `typeOfPayment`: Range `Data!A46:A49`
  3. Filters out headers and test values
  4. Generates AI keywords using OpenAI
  5. Updates 3 config files:
     - `config/options.json`
     - `config/live-dropdowns.json`
     - `config/enhanced-keywords.json`
  6. Updates Apps Script configuration
  7. Generates sync report

#### **How to Run:**
```bash
npm run sync
# or
node sync-sheets.js
```

#### **When to Run:**
- After adding/removing dropdown options in Google Sheets "Data" sheet
- After renaming dropdown options
- After restructuring P&L sheet rows
- After adding/removing named ranges

#### **When NOT to Run:**
- After adding transaction data to "Accounting Buddy P&L 2025" sheet
- After changing formulas in P&L sheet
- After updating balance data

---

### **4. API Endpoints**

#### **No Live Dropdown API Exists**

**Current API Endpoints:**
- ❌ `/api/options` - Does NOT exist
- ❌ `/api/config` - Does NOT exist
- ❌ `/api/dropdowns` - Does NOT exist

**Existing Endpoints:**
- ✅ `/api/sheets` (GET) - Health check only, does NOT return dropdown options
- ✅ `/api/extract` - Uses `getOptions()` internally to pass dropdown options to OpenAI
- ✅ `/api/pnl` - Fetches P&L data from Google Sheets (live)
- ✅ `/api/inbox` - Fetches transactions from Google Sheets (live)
- ✅ `/api/balance/get` - Fetches balances from Google Sheets (live)

**Conclusion:** No API endpoint exists to fetch dropdown options dynamically from Google Sheets.

---

### **5. Verification Test**

#### **Test Scenario:**
1. Open Google Sheets "Data" sheet
2. Add a new property: "Test Property - DO NOT USE"
3. Refresh webapp
4. Check if new property appears in dropdown

#### **Expected Result (Current System):**
❌ **New property will NOT appear** until:
1. Developer runs `npm run sync`
2. Config files are updated
3. Webapp is redeployed to Vercel

#### **Actual Behavior:**
✅ **Confirmed** - Dropdowns are static and require manual sync + redeploy

---

## 📊 Summary Table

| Aspect | Status | Details |
|--------|--------|---------|
| **Live Sync from Google Sheets** | ❌ **NO** | All dropdown data is static |
| **API Endpoint for Dropdowns** | ❌ **NO** | No `/api/options` or `/api/config` endpoint exists |
| **Sync Mechanism** | ⚠️ **MANUAL** | Developer must run `npm run sync` |
| **Auto-Update on Sheet Changes** | ❌ **NO** | Requires manual sync + redeploy |
| **Mobile App Impact** | ⚠️ **HARDCODED** | Mobile app must hardcode dropdown values or fetch from GitHub |

---

## ⚠️ Current Limitations

### **1. No Real-Time Sync**
- Changes in Google Sheets do NOT automatically reflect in webapp
- Requires developer intervention (run sync script + redeploy)
- Delay between Sheet update and webapp update

### **2. No API for Mobile App**
- Mobile app cannot fetch live dropdown options from webapp
- Mobile app must either:
  - **Option A:** Hardcode dropdown values (current recommendation)
  - **Option B:** Fetch from GitHub API (advanced)
  - **Option C:** Wait for `/api/config` endpoint (future enhancement)

### **3. Version Mismatch Risk**
- If Google Sheets is updated but sync is not run:
  - Webapp will have outdated dropdown options
  - Mobile app will have outdated dropdown options
  - Users may submit invalid data that doesn't match Sheet structure

### **4. Manual Process**
- Sync script must be run manually by developer
- No automated sync on Sheet changes
- No webhook from Google Sheets to trigger sync

---

## 🛠 Recommended Next Actions

### **Phase 1 Completion:**
✅ **Audit Complete** - All dropdown sources identified and documented

### **Phase 2 Recommendations:**

#### **Option A: Keep Current System (Recommended for MVP)**
**Pros:**
- Simple, proven, works
- No additional infrastructure needed
- Fast performance (no API calls)

**Cons:**
- Manual sync required
- No real-time updates
- Mobile app must hardcode values

**Action Items:**
1. ✅ Document sync process for team
2. ✅ Create sync checklist
3. ⚠️ Add sync reminder to Sheet (e.g., "Run npm run sync after changing dropdowns")
4. ⚠️ Set up automated sync on deploy (GitHub Actions)

---

#### **Option B: Create Live Dropdown API (Future Enhancement)**
**Pros:**
- Real-time sync
- Mobile app can fetch live options
- No manual sync needed

**Cons:**
- Additional API endpoint to maintain
- Slightly slower (API call overhead)
- Caching complexity

**Implementation Plan:**
1. Create `/api/config` endpoint
2. Endpoint calls Google Sheets API directly (like `/api/pnl`)
3. Cache results for 5-10 minutes
4. Mobile app fetches from `/api/config` on app launch
5. Webapp fetches from `/api/config` on page load

**Estimated Effort:** 4-6 hours

**Code Example:**
```typescript
// app/api/config/route.ts
export async function GET() {
  const scriptUrl = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  
  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'getDropdownOptions',
      secret: secret
    })
  });
  
  const data = await response.json();
  
  return NextResponse.json({
    ok: true,
    options: {
      properties: data.properties,
      typeOfOperation: data.typeOfOperation,
      typeOfPayment: data.typeOfPayment
    },
    fetchedAt: new Date().toISOString()
  });
}
```

**Apps Script Changes Required:**
```javascript
// Add to COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js
function getDropdownOptions() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data');
  
  return {
    ok: true,
    properties: getColumnValues(sheet, 'A38:A43'),
    typeOfOperation: getColumnValues(sheet, 'A4:A35'),
    typeOfPayment: getColumnValues(sheet, 'A46:A49')
  };
}
```

---

#### **Option C: Hybrid Approach (Best of Both Worlds)**
**Strategy:**
1. Keep static config files for fast local development
2. Add `/api/config` endpoint for production
3. Webapp checks API first, falls back to static config
4. Mobile app fetches from API
5. Sync script updates both static files AND validates API

**Pros:**
- Fast local development
- Real-time sync in production
- Fallback if API fails

**Cons:**
- More complex
- Two sources of truth to maintain

---

## 📝 Conclusion

### **Current State:**
- ❌ **NOT live-synced** - All dropdown data is static
- ⚠️ **Manual sync required** - Developer must run `npm run sync`
- ❌ **No API endpoint** - Mobile app cannot fetch live options

### **Recommendation:**
For **Phase 1 MVP**, keep the current system and:
1. ✅ Document sync process (DONE - see `SYNC-SCRIPT-README.md`)
2. ⚠️ Add sync reminder to Google Sheets
3. ⚠️ Set up automated sync on deploy (GitHub Actions)
4. ⚠️ Mobile team should hardcode dropdown values from `MOBILE_API_INTEGRATION_GUIDE.md`

For **Phase 2**, consider implementing `/api/config` endpoint for real-time sync.

---

## 📞 Next Steps

1. **Mobile Team:** Review this report and confirm understanding
2. **Mobile Team:** Run mirror audit on mobile app dropdown sources
3. **PM:** Decide on Phase 2 approach (keep static vs. add live API)
4. **Webapp Team:** Implement chosen approach
5. **Both Teams:** Test sync mechanism end-to-end

---

**Report Completed:** October 31, 2025  
**Status:** ✅ **PHASE 1 COMPLETE**  
**Next Phase:** Mobile team mirror audit



