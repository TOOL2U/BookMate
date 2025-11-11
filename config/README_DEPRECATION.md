# ⚠️ DEPRECATED CONFIG FILES

## Status: HARD DEPRECATED

The following files in this directory are **DEPRECATED** for UI use:

- `options.json` - **DO NOT IMPORT** in any UI code
- `live-dropdowns.json` - **DO NOT IMPORT** in any UI code

## Migration Path

**OLD (Deprecated)**:
```typescript
import options from '@/config/options.json';
const payments = options.typeOfPayment;
```

**NEW (Correct)**:
```typescript
import { getOptions } from '@/utils/getOptions';

const data = await getOptions();
const payments = data.typeOfPayment; // string[] for dropdowns
const paymentsRich = data.typeOfPayments; // Rich[] for analytics
```

## Single Source of Truth

**`/api/options`** is the ONLY source of truth for dropdown data.

- ✅ Reads from Google Sheets (master Data sheet + Lists rollups)
- ✅ Returns both plain arrays (dropdowns) and rich objects (analytics)
- ✅ Always includes numeric test entries ("1", "2", "3", "4")
- ✅ Live updates without code deployment
- ✅ No cache issues

## Emergency Fallback Only

These config files may be used ONLY as emergency fallback if:
1. `FALLBACK_CONFIG_ALLOWED=true` in environment variables
2. Google Sheets API is down
3. `/api/options` endpoint explicitly fails back to config

**In all other cases**, importing these files is a **bug**.

## ESLint Rule

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "@/config/options.json",
        "message": "DEPRECATED: Use getOptions() from @/utils/getOptions instead"
      }, {
        "name": "@/config/live-dropdowns.json",
        "message": "DEPRECATED: Use getOptions() from @/utils/getOptions instead"
      }]
    }]
  }
}
```

## Last Updated
November 4, 2025 - Architecture decision to unify on /api/options
