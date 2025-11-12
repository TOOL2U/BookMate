# Google OAuth Verification Submission Checklist

## Complete Checklist for Production Launch

Track your progress through the entire verification process.

---

## PHASE 1: Documentation (COMPLETE ✅)

### Privacy Policy
- [x] Created comprehensive privacy policy
- [x] Added Google Services Integration section (3.5)
- [x] Explained what data we collect
- [x] Explained Google Sheets API usage
- [x] Explained Google Drive API usage
- [x] Listed user rights (access, delete, export)
- [x] Included data security measures
- [x] Added contact information
- [x] File location: `/app/privacy/page.tsx`
- [x] Will be accessible at: `https://accounting.siamoon.com/privacy`

### Terms of Service
- [x] Created comprehensive terms of service
- [x] Added Google Sheets Authorization section (Section 8)
- [x] Explained what we access
- [x] Explained what we DON'T access
- [x] Explained user ownership and control
- [x] Explained OAuth token storage
- [x] Added account termination policy
- [x] File location: `/app/terms/page.tsx`
- [x] Will be accessible at: `https://accounting.siamoon.com/terms`

### Scope Justifications
- [x] Created detailed scope justifications document
- [x] Explained Google Sheets scope (why we need write access)
- [x] Explained Google Drive scope (why we use drive.file, not drive)
- [x] Listed specific use cases for each scope
- [x] Explained why alternatives won't work
- [x] Included benefits to users
- [x] File location: `OAUTH_SCOPE_JUSTIFICATIONS.md`

### Security Documentation
- [x] Created security and data protection document
- [x] Explained OAuth token storage (AES-256 encryption)
- [x] Explained data protection measures
- [x] Listed what data we collect and DON'T collect
- [x] Explained GDPR/CCPA compliance
- [x] Detailed user data rights
- [x] Explained no third-party sharing
- [x] Included data retention policy
- [x] File location: `SECURITY_DOCUMENTATION.md`

### Demo Video Script
- [x] Created complete demo video script
- [x] Included pre-recording checklist
- [x] Written narration for each section
- [x] Listed actions to demonstrate
- [x] Included tips and best practices
- [x] File location: `DEMO_VIDEO_SCRIPT.md`

---

## PHASE 2: Domain & Deployment (PENDING)

### Domain Configuration
- [ ] Domain verified: `accounting.siamoon.com`
  - Go to: https://search.google.com/search-console
  - Add property: accounting.siamoon.com
  - Choose verification method (DNS TXT record recommended)
  - Add TXT record to DNS:
    ```
    Host: accounting.siamoon.com
    Type: TXT
    Value: google-site-verification=xxxxx (from Google)
    ```
  - Wait for DNS propagation (5-60 minutes)
  - Click "Verify" in Search Console

### Production Deployment
- [ ] App deployed to production
  - Platform: Vercel (recommended) or self-hosted
  - URL: https://accounting.siamoon.com
  - HTTPS/SSL certificate active
  - Environment variables configured
  - Database connected (production instance)

- [ ] Production Environment Variables:
  ```bash
  DATABASE_URL=postgresql://... (production database)
  NEXTAUTH_URL=https://accounting.siamoon.com
  NEXTAUTH_SECRET=... (generate new for production)
  JWT_SECRET=... (generate new for production)
  GOOGLE_OAUTH_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
  GOOGLE_OAUTH_CLIENT_SECRET=YOUR_GOOGLE_OAUTH_CLIENT_SECRET
  GOOGLE_SHEET_ID=1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8
  SENDGRID_API_KEY=...
  SENDGRID_FROM_EMAIL=shaunducker1@gmail.com
  ```

### Production Database
- [ ] Database created (Neon, Supabase, or Railway)
- [ ] Connection string copied
- [ ] Migrations run: `npx prisma migrate deploy`
- [ ] Database accessible from production app

---

## PHASE 3: OAuth Configuration (PENDING)

### OAuth Consent Screen
- [ ] Navigate to: https://console.cloud.google.com/apis/credentials/consent?project=accounting-buddy-476114
- [ ] Complete all required fields:

**Basic Information**:
- [ ] App name: `BookMate` (or keep "Accounting Buddy")
- [ ] User support email: `shaunducker1@gmail.com`
- [ ] Developer contact: `shaunducker1@gmail.com`

**App Logo**:
- [ ] Logo created (120x120px minimum, PNG format)
- [ ] Logo uploaded to consent screen
- [ ] Logo appears correctly in preview

**App Domains**:
- [ ] Application homepage: `https://accounting.siamoon.com`
- [ ] Privacy policy: `https://accounting.siamoon.com/privacy`
- [ ] Terms of service: `https://accounting.siamoon.com/terms`

**Authorized Domains**:
- [ ] Add: `siamoon.com`
- [ ] Add: `accounting.siamoon.com`
- [ ] Verify domain ownership (if prompted)

**Scopes**:
- [ ] Current scopes verified:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`
- [ ] Scope justifications prepared (from OAUTH_SCOPE_JUSTIFICATIONS.md)

### OAuth Redirect URIs
- [ ] Navigate to: https://console.cloud.google.com/apis/credentials?project=accounting-buddy-476114
- [ ] Click on OAuth 2.0 Client ID
- [ ] Add authorized redirect URIs:
  - [ ] `https://accounting.siamoon.com/api/auth/callback/google`
  - [ ] `https://accounting.siamoon.com/auth/callback`
  - [ ] Keep localhost URIs for development:
    - `http://localhost:3000/api/auth/callback/google`
    - `http://localhost:3001/api/auth/callback/google`
- [ ] Save changes

---

## PHASE 4: Demo Video (PENDING)

### Pre-Recording
- [ ] Test account created (not your main account)
- [ ] Screen recording software ready (Loom, OBS, QuickTime)
- [ ] Microphone tested (clear audio)
- [ ] Browser cleaned (incognito/private mode)
- [ ] Production URL accessible: https://accounting.siamoon.com
- [ ] Script reviewed (DEMO_VIDEO_SCRIPT.md)
- [ ] Practice run completed

### Recording
- [ ] Record complete demo (follow script)
- [ ] Show user registration
- [ ] Show OAuth consent screen (explain scopes)
- [ ] Show spreadsheet creation in Google Drive
- [ ] Show transaction added in app
- [ ] Show data appears in spreadsheet
- [ ] Show how to revoke access
- [ ] Show what we don't access
- [ ] Length: 3-6 minutes
- [ ] Quality: 1080p minimum

### Post-Production
- [ ] Edit video (trim mistakes)
- [ ] Add title card (optional)
- [ ] Add conclusion with URLs
- [ ] Check audio levels
- [ ] Export as MP4 (1920x1080, H.264)

### Upload to YouTube
- [ ] Upload to YouTube
- [ ] Title: "BookMate - Google Sheets Integration Demo for OAuth Verification"
- [ ] Description: Includes scopes, privacy policy URL, purpose
- [ ] Visibility: **Unlisted** (not private, not public)
- [ ] Enable auto-captions
- [ ] Copy YouTube URL
- [ ] YouTube URL: `___________________________`

---

## PHASE 5: Verification Submission (PENDING)

### Pre-Submission Check
- [ ] Privacy policy live at: https://accounting.siamoon.com/privacy
- [ ] Terms of service live at: https://accounting.siamoon.com/terms
- [ ] App logo uploaded to OAuth consent screen
- [ ] Domain verified: accounting.siamoon.com
- [ ] All OAuth consent screen fields completed
- [ ] Demo video uploaded to YouTube (unlisted)
- [ ] Demo video URL copied
- [ ] Scope justifications document ready
- [ ] Security documentation ready

### Submit for Verification
- [ ] Navigate to: https://console.cloud.google.com/apis/credentials/consent?project=accounting-buddy-476114
- [ ] Click **"PREPARE FOR VERIFICATION"**
- [ ] Complete questionnaire:

**Section 1: App Information**
- [ ] App name: BookMate
- [ ] Description: Cloud-based accounting platform with Google Sheets integration
- [ ] Category: Finance & Accounting
- [ ] Website: https://accounting.siamoon.com
- [ ] Demo video URL: [Paste YouTube URL]

**Section 2: Scope Justification**
- [ ] Spreadsheets scope: [Copy from OAUTH_SCOPE_JUSTIFICATIONS.md]
- [ ] Drive.file scope: [Copy from OAUTH_SCOPE_JUSTIFICATIONS.md]

**Section 3: Privacy & Security**
- [ ] Privacy policy URL: https://accounting.siamoon.com/privacy
- [ ] Terms of service URL: https://accounting.siamoon.com/terms
- [ ] Data handling: [Copy from SECURITY_DOCUMENTATION.md]
- [ ] Token storage: [Copy from SECURITY_DOCUMENTATION.md]
- [ ] User deletion: [Copy from SECURITY_DOCUMENTATION.md]

**Section 4: Compliance**
- [ ] Data protection: [Copy from SECURITY_DOCUMENTATION.md]
- [ ] User consent: Explicit OAuth consent screen
- [ ] Data minimization: Yes, minimal data collection
- [ ] Third-party sharing: No data sharing

**Section 5: Additional Info**
- [ ] Support email: shaunducker1@gmail.com
- [ ] Developer contact: shaunducker1@gmail.com
- [ ] Company: TOOL2U (or your company name)

### Attach Documentation
- [ ] Demo video URL attached
- [ ] Privacy policy URL verified
- [ ] Terms of service URL verified
- [ ] Screenshots (optional but helpful)

### Review & Submit
- [ ] Double-check all answers
- [ ] Verify all URLs are accessible
- [ ] Click **"SUBMIT FOR VERIFICATION"**
- [ ] Save confirmation email
- [ ] Note submission date: `_______________`

---

## PHASE 6: Immediate Launch (OPTIONAL - RECOMMENDED)

**Don't wait for verification! Launch now with unverified status:**

### Publish App
- [ ] Go to: https://console.cloud.google.com/apis/credentials/consent?project=accounting-buddy-476114
- [ ] Click **"PUBLISH APP"**
- [ ] Confirm publication
- [ ] Status changes from "Testing" to "In production"

### Update Register Page
- [ ] Add warning notice to `/app/register/page.tsx`:
  ```tsx
  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
    <p className="text-sm text-yellow-800">
      <strong>Note:</strong> During signup, you'll see a Google warning 
      screen. This is normal while we complete Google's verification 
      process. Simply click "Continue" to proceed. Your data is secure.
    </p>
  </div>
  ```
- [ ] Deploy updated code
- [ ] Test registration flow

### Test Production OAuth
- [ ] Create test account
- [ ] Verify OAuth consent screen appears
- [ ] Verify warning message shows (expected)
- [ ] Click "Continue" (or "Advanced" → "Go to BookMate")
- [ ] Verify spreadsheet created in Drive
- [ ] Verify app works correctly
- [ ] Test adding transaction
- [ ] Verify data syncs to spreadsheet

### Monitor
- [ ] Set up error logging
- [ ] Monitor OAuth success/failure rates
- [ ] Watch for user questions about warning screen

---

## PHASE 7: Respond to Google (WEEKS 4-8)

### Monitor Email
- [ ] Check email daily for Google responses
- [ ] Respond within 24-48 hours to any questions
- [ ] Provide additional documentation if requested

### Common Follow-up Requests
- [ ] Additional scope justification
- [ ] More detailed privacy policy
- [ ] Security audit or assessment
- [ ] Clarification on data retention
- [ ] Updated demo video
- [ ] Screenshots of specific features

### Response Templates
All prepared in:
- OAUTH_SCOPE_JUSTIFICATIONS.md
- SECURITY_DOCUMENTATION.md
- GOOGLE_VERIFICATION_COMPLETE_GUIDE.md

---

## PHASE 8: Approval! (WEEKS 6-8)

### When Approved
- [ ] Receive approval email from Google
- [ ] Status changes to "Verified"
- [ ] Test OAuth flow (no warning screen)
- [ ] Verify "Verified by Google" badge appears

### Announce to Users
- [ ] Email existing users (if launched unverified)
- [ ] Update homepage with "Verified by Google" badge
- [ ] Update marketing materials
- [ ] Celebrate! 🎉

### Remove Warning Notice
- [ ] Remove yellow warning from register page
- [ ] Deploy updated code
- [ ] Test registration flow

---

## Quick Reference URLs

**Google Cloud Console**:
- OAuth Consent Screen: https://console.cloud.google.com/apis/credentials/consent?project=accounting-buddy-476114
- Credentials: https://console.cloud.google.com/apis/credentials?project=accounting-buddy-476114

**Production URLs** (once deployed):
- App: https://accounting.siamoon.com
- Privacy: https://accounting.siamoon.com/privacy
- Terms: https://accounting.siamoon.com/terms
- Register: https://accounting.siamoon.com/register

**Google Verification**:
- OAuth Guide: https://support.google.com/cloud/answer/9110914
- Domain Verification: https://search.google.com/search-console

**Support**:
- Email: shaunducker1@gmail.com

---

## Progress Tracker

**Phase 1 - Documentation**: ✅ COMPLETE (100%)
**Phase 2 - Domain & Deployment**: ⏳ PENDING (0%)
**Phase 3 - OAuth Config**: ⏳ PENDING (0%)
**Phase 4 - Demo Video**: ⏳ PENDING (0%)
**Phase 5 - Submission**: ⏳ PENDING (0%)
**Phase 6 - Launch**: ⏳ OPTIONAL (0%)
**Phase 7 - Google Response**: ⏳ PENDING (0%)
**Phase 8 - Approval**: ⏳ PENDING (0%)

**Overall Progress**: 12.5% (1/8 phases complete)

---

## Next Immediate Actions

**TODAY**:
1. [ ] Create/convert app logo to 120x120 PNG
2. [ ] Set up domain verification (DNS TXT record)
3. [ ] Deploy app to production (Vercel recommended)

**THIS WEEK**:
1. [ ] Configure OAuth consent screen (upload logo, add URLs)
2. [ ] Update redirect URIs for production
3. [ ] Record demo video
4. [ ] Upload video to YouTube
5. [ ] Submit for verification

**RECOMMENDED - PARALLEL LAUNCH**:
1. [ ] Click "PUBLISH APP" (launch unverified) 
2. [ ] Add warning notice to register page
3. [ ] Start getting users
4. [ ] Submit verification in parallel
5. [ ] Warning disappears when approved (4-6 weeks)

---

## Need Help?

Contact: shaunducker1@gmail.com

**Documentation Created**:
- ✅ PRODUCTION_SETUP_STEP_BY_STEP.md
- ✅ GOOGLE_VERIFICATION_COMPLETE_GUIDE.md
- ✅ OAUTH_VERIFICATION_ACTION_PLAN.md
- ✅ OAUTH_SCOPE_JUSTIFICATIONS.md
- ✅ SECURITY_DOCUMENTATION.md
- ✅ DEMO_VIDEO_SCRIPT.md
- ✅ This Checklist

**You have everything you need!** 🚀

---

**Last Updated**: November 12, 2025
**Project**: BookMate Production Launch
**Version**: 1.0
