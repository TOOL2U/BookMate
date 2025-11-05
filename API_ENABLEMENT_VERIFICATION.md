# API Enablement Verification for Both Google Cloud Projects

## 📊 Current Project Configuration

### Project 1: `bookmate-bfd43` (Firebase)
**Purpose**: Firestore database for storing balances  
**Service Account**: `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`  
**Status**: ✅ Working (Firebase routes functional)

### Project 2: `accounting-buddy-476114` (Google Sheets)
**Purpose**: Google Sheets API access for balance data  
**Service Account**: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`  
**Status**: ❌ Sheet not shared (but APIs likely enabled)

---

## 🔍 Required APIs by Project

### For `accounting-buddy-476114` (Google Sheets Project)

**Required APIs**:
1. ✅ **Google Sheets API** - To read/write Sheet data
2. ⚠️ **Google Drive API** - May be needed for Sheet access
3. ❌ **Cloud Firestore API** - NOT needed (Firebase is in other project)

**How to Verify & Enable**:

1. Go to APIs dashboard:  
   👉 https://console.cloud.google.com/apis/dashboard?project=accounting-buddy-476114

2. Click "Enable APIs and Services"

3. Search and verify these are enabled:
   - [ ] **Google Sheets API** - https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=accounting-buddy-476114
   - [ ] **Google Drive API** - https://console.cloud.google.com/apis/library/drive.googleapis.com?project=accounting-buddy-476114

**Quick Enable Commands** (if gcloud is configured):
```bash
gcloud services enable sheets.googleapis.com --project=accounting-buddy-476114
gcloud services enable drive.googleapis.com --project=accounting-buddy-476114
```

---

### For `bookmate-bfd43` (Firebase Project)

**Required APIs**:
1. ✅ **Cloud Firestore API** - Already enabled (Firebase routes work)
2. ✅ **Firebase Admin SDK** - Already enabled
3. ❌ **Google Sheets API** - NOT needed (different project handles this)

**How to Verify**:

1. Go to Firebase Console:  
   👉 https://console.firebase.google.com/project/bookmate-bfd43/firestore

2. Verify Firestore is active (you should see the database)

3. Check APIs in Google Cloud:  
   👉 https://console.cloud.google.com/apis/dashboard?project=bookmate-bfd43

**Status**: ✅ **Likely already correct** (Firebase routes are working)

---

## 🎯 Most Likely Issue

Based on the PM's diagnostic table and the error "Requested entity was not found":

| Issue | Likelihood | Evidence |
|-------|------------|----------|
| **Sheet not shared with service account** | **99%** 🎯 | Error matches exactly, local works, Vercel doesn't |
| Google Sheets API not enabled | 10% | Would show different error: "API not enabled" |
| Google Drive API not enabled | 5% | Optional, not always required |
| Wrong project selected | 1% | Correct service account email in use |

---

## ✅ Action Plan (Priority Order)

### Priority 1: Share the Google Sheet (MOST IMPORTANT)
**This will fix the issue immediately**

1. Open Sheet: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit
2. Click "Share"
3. Add: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
4. Permission: "Editor"
5. Click "Share"

### Priority 2: Verify Google Sheets API is Enabled
**Just to be safe**

1. Go to: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=accounting-buddy-476114
2. If it says "ENABLE", click it
3. If it says "MANAGE" or "API ENABLED", you're good ✅

### Priority 3: Enable Google Drive API (If Needed)
**Sometimes required for Sheet access**

1. Go to: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=accounting-buddy-476114
2. If not enabled, click "ENABLE"

### Priority 4: Test
```bash
curl -s https://accounting-buddy-app.vercel.app/api/test-sheets | jq .
```

Expected after sharing:
```json
{
  "ok": true,
  "title": "Your Sheet Name"
}
```

---

## 🔎 How to Check API Status Manually

### For `accounting-buddy-476114`:

**Method 1: Google Cloud Console**
1. Go to: https://console.cloud.google.com/apis/dashboard?project=accounting-buddy-476114
2. Look at "Enabled APIs & services"
3. Should see:
   - Google Sheets API ✅
   - Google Drive API ✅ (optional)

**Method 2: Direct Links**
- Sheets API: https://console.cloud.google.com/apis/api/sheets.googleapis.com/overview?project=accounting-buddy-476114
- Drive API: https://console.cloud.google.com/apis/api/drive.googleapis.com/overview?project=accounting-buddy-476114

If you see "Enable API" button → Click it  
If you see usage graphs/metrics → Already enabled ✅

### For `bookmate-bfd43`:

**Method 1: Firebase Console**
1. Go to: https://console.firebase.google.com/project/bookmate-bfd43/firestore
2. If you see your database with `balances` collection → ✅ Working

**Method 2: Google Cloud Console**
1. Go to: https://console.cloud.google.com/apis/dashboard?project=bookmate-bfd43
2. Should see "Cloud Firestore API" enabled

---

## 📋 Quick Verification Checklist

### `accounting-buddy-476114` (Google Sheets Project)
- [ ] Google Sheets API enabled
- [ ] Google Drive API enabled (optional but recommended)
- [ ] Service account email: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
- [ ] **CRITICAL**: Google Sheet shared with service account email ⚠️

### `bookmate-bfd43` (Firebase Project)
- [x] Cloud Firestore API enabled (working)
- [x] Firestore database active (verified)
- [x] Service account: `firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com`

---

## 🎯 Bottom Line

**99% certain the issue is**: Google Sheet not shared with the service account

**1% possibility**: Google Sheets API or Drive API not enabled in `accounting-buddy-476114`

**Recommended order**:
1. ✅ Share the Sheet first (takes 30 seconds, no risk)
2. ✅ Test immediately
3. ⚠️ If still fails, verify APIs are enabled
4. ⚠️ If still fails, enable Google Drive API

**After sharing the Sheet, you should see instant success!** 🚀

---

## 📞 Links for Quick Access

**accounting-buddy-476114**:
- APIs Dashboard: https://console.cloud.google.com/apis/dashboard?project=accounting-buddy-476114
- Google Sheets API: https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=accounting-buddy-476114
- Google Drive API: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=accounting-buddy-476114
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts?project=accounting-buddy-476114

**bookmate-bfd43**:
- Firestore: https://console.firebase.google.com/project/bookmate-bfd43/firestore
- APIs Dashboard: https://console.cloud.google.com/apis/dashboard?project=bookmate-bfd43
- Service Accounts: https://console.cloud.google.com/iam-admin/serviceaccounts?project=bookmate-bfd43

**Google Sheet**:
- Direct Link: https://docs.google.com/spreadsheets/d/1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8/edit
- Share with: `accounting-buddy@accounting-buddy-476114.iam.gserviceaccount.com`
