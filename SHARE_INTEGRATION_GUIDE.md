# 🚀 Quick Integration Guide

## Add Share Button to Reports Page

### Step 1: Import the Component

In `/app/reports/page.tsx`, add the import:

```typescript
import ShareReportButton from './components/ShareReportButton';
```

### Step 2: Add to Action Buttons

Find the section with export buttons and add the share button:

```tsx
{/* Existing buttons */}
<button onClick={handleDownloadPDF}>
  <Download className="w-4 h-4" />
  Download PDF
</button>

{/* NEW: Add share button */}
{reportData && (
  <ShareReportButton 
    reportData={reportData}
    aiInsights={aiInsights}
  />
)}
```

### Step 3: Test It

1. Generate a report
2. Click "Share Report"
3. Copy the link
4. Open in incognito/private window
5. Click "Download PDF"
6. Browser creates perfect PDF!

---

## Firestore Security Rules

Add to `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Shared reports - public read, authenticated write
    match /sharedReports/{reportId} {
      allow read: if true; // Public read for share links
      allow create: if request.auth != null; // Only authenticated users can create
      allow update, delete: if request.auth != null; // Only authenticated users can revoke
    }
    
    // ... your other rules
  }
}
```

---

## Environment Variable

Add to `.env.local`:

```bash
NEXT_PUBLIC_APP_URL=https://app.bookmate.com
```

Or for local development:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## That's It!

Your reports now have:
- ✅ Shareable links
- ✅ Perfect print PDFs
- ✅ Investor-grade quality
- ✅ Mobile-friendly viewing
- ✅ No more export headaches!

🎉 **Ready to share with investors!**
