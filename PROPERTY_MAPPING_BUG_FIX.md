# 🐛 Property Name Mapping Bug Fix

## Issue Reported
**Date**: Nov 4, 2025  
**Reporter**: User  
**Severity**: HIGH - Data validation errors preventing transaction saves

### Problem Description
When a user input an expense and selected **"Shaun Ducker - Personal"** from the dropdown, it was being saved to the Excel sheet as **"Shaun Ducker"**, causing a validation error.

### Error Symptoms
- ❌ User selects: `"Shaun Ducker - Personal"` (from dropdown)
- ❌ Value sent to Google Sheets: `"Shaun Ducker"` (truncated)
- ❌ Google Sheets validation fails (value not in approved list)
- ❌ Transaction rejected/errored

Same issue affected **"Maria Ren - Personal"** → saved as **"Maria Ren"**

---

## Root Cause Analysis

### Location 1: `/utils/manualParse.ts` (Line 146-147)
```typescript
// BEFORE (WRONG):
else if (words.includes('shaun')) finalResult = 'Shaun Ducker';
else if (words.includes('maria')) finalResult = 'Maria Ren';

// AFTER (FIXED):
else if (words.includes('shaun')) finalResult = 'Shaun Ducker - Personal';
else if (words.includes('maria')) finalResult = 'Maria Ren - Personal';
```

### Location 2: `/utils/matchOption.ts` (Line 153-154)
```typescript
// BEFORE (WRONG):
const shortcuts: Record<string, string> = {
  'shaun': 'Shaun Ducker',
  'maria': 'Maria Ren',
  // ...
};

// AFTER (FIXED):
const shortcuts: Record<string, string> = {
  'shaun': 'Shaun Ducker - Personal',
  'maria': 'Maria Ren - Personal',
  // ...
};
```

### Why This Happened
The property shortcut mappings were using **abbreviated names** instead of the **full dropdown values** from Google Sheets. This caused a mismatch:

| Shortcut Input | Old Mapping (WRONG) | New Mapping (FIXED) | Google Sheets Value |
|----------------|---------------------|---------------------|---------------------|
| `'shaun'` | `Shaun Ducker` ❌ | `Shaun Ducker - Personal` ✅ | `Shaun Ducker - Personal` |
| `'maria'` | `Maria Ren` ❌ | `Maria Ren - Personal` ✅ | `Maria Ren - Personal` |

---

## The Fix

### Commit: `3cdfa69`
```
fix: correct property name mapping for Shaun and Maria

Changes:
- 'shaun' → 'Shaun Ducker - Personal' (was: 'Shaun Ducker')
- 'maria' → 'Maria Ren - Personal' (was: 'Maria Ren')
```

### Files Changed
1. **`utils/manualParse.ts`**
   - Function: `extractProperty()`
   - Lines: 146-147
   - Purpose: Fallback keyword matching for property extraction

2. **`utils/matchOption.ts`**
   - Object: `shortcuts` mapping
   - Lines: 153-154
   - Purpose: Priority shortcuts for property name resolution

---

## Verification

### Before Fix
```typescript
extractProperty("shaun expense") 
// Returns: "Shaun Ducker" ❌
// Google Sheets rejects: Not in approved list
```

### After Fix
```typescript
extractProperty("shaun expense")
// Returns: "Shaun Ducker - Personal" ✅
// Google Sheets accepts: Exact match with dropdown
```

### Test Results
```
Input: 'shaun' → Output: Shaun Ducker - Personal ✅
Input: 'maria' → Output: Maria Ren - Personal ✅
Input: 'family' → Output: Family ✅
```

---

## Impact Assessment

### Affected Scenarios
1. **Quick Entry Flow**: Users typing "shaun" in OCR extraction
2. **Manual Property Selection**: Dropdown selections being validated
3. **Voice/Chat Input**: Natural language property detection
4. **Mobile App**: Any property shortcut usage

### Risk Level
- **Before Fix**: HIGH - Users cannot save transactions for Shaun/Maria properties
- **After Fix**: LOW - Full dropdown values ensure validation passes

### Other Properties
All other properties were already using full names:
- ✅ `'alesia'` → `'Alesia House'` (correct)
- ✅ `'lanna'` → `'Lanna House'` (correct)
- ✅ `'parents'` → `'Parents House'` (correct)
- ✅ `'sia'` → `'Sia Moon - Land - General'` (correct)
- ✅ `'family'` → `'Family'` (correct)

Only **Shaun** and **Maria** were truncated.

---

## Deployment

### Status: ✅ DEPLOYED
- Commit: `3cdfa69`
- Pushed to: `origin/main`
- Vercel: Auto-deployed
- Production: Live

### Verification Steps
1. Test with local: ✅ Passed
2. Push to GitHub: ✅ Done
3. Vercel deployment: ✅ Automatic
4. Production test: ⏳ Pending user verification

---

## Prevention

### Why This Bug Existed
- Hardcoded shortcuts were created before standardizing on full dropdown values
- No validation that shortcuts matched Google Sheets dropdown values
- Manual testing likely didn't cover all property variations

### Future Prevention
1. **Automated Tests**: Add unit tests for property mapping
   ```typescript
   test('property shortcuts match Google Sheets dropdown', () => {
     expect(shortcuts['shaun']).toBe('Shaun Ducker - Personal');
     expect(shortcuts['maria']).toBe('Maria Ren - Personal');
   });
   ```

2. **Validation Script**: Create script to verify shortcuts against live `/api/options` data
   ```bash
   node scripts/validate-property-shortcuts.js
   ```

3. **Documentation**: Update property mapping docs with requirement to use full names

---

## Related Systems

### No Changes Needed
- ✅ Google Sheets dropdown values (unchanged)
- ✅ `/api/options` endpoint (returns correct values)
- ✅ Dropdown components (already using full names)
- ✅ Database schema (accepts any valid string)

### Affected Utilities
- ✅ `manualParse.ts` - Fixed
- ✅ `matchOption.ts` - Fixed
- ✅ All other property utilities use live API data

---

## User Communication

### Message for User
```
✅ FIXED: Property mapping issue resolved

Issue: "Shaun Ducker - Personal" was being saved as "Shaun Ducker"
Fix: Now saves exact dropdown value
Status: Deployed to production

You can now save expenses for Shaun and Maria properties without errors.
The fix is live - try creating a new transaction!
```

---

## Conclusion

**Summary**: Two-line fix correcting hardcoded shortcuts to match Google Sheets dropdown values.

**Impact**: Immediate - users can now save transactions for Shaun/Maria properties.

**Lessons Learned**: Always verify hardcoded mappings against source of truth (Google Sheets).

**Next Steps**: Add automated validation to prevent similar issues in future.
