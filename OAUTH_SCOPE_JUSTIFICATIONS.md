# Google OAuth Scope Justifications

## For Google Verification Questionnaire

When Google asks "Why do you need these scopes?", use these detailed justifications.

---

## Scope 1: Google Sheets API

**Scope**: `https://www.googleapis.com/auth/spreadsheets`

**Full Access Level**: Read, write, create, and manage spreadsheets

### Why We Need This Scope

BookMate is a cloud-based accounting platform that uses Google Sheets as the backend storage system for each user's financial data. We need full spreadsheet access to provide comprehensive accounting functionality.

### Specific Use Cases

1. **CREATE Spreadsheets**
   - When a new user registers, we copy our master accounting template to create a personalized spreadsheet in their Google Drive
   - This spreadsheet contains pre-configured sheets for: Transactions, Categories, Properties, Balance Tracking, and Monthly Reports
   - The spreadsheet is created in the user's Drive (they are the owner)

2. **READ Data**
   - Retrieve transaction history to display in the web app dashboard
   - Fetch expense and revenue categories for dropdown menus
   - Read balance data to generate charts and analytics
   - Load profit & loss data for monthly reports
   - Sync data from spreadsheet to web app for real-time updates

3. **WRITE Data**
   - Save new financial transactions (expenses, revenues, transfers)
   - Update existing transactions when user makes edits
   - Record balance snapshots for historical tracking
   - Write calculated totals and summaries
   - Sync changes from web app back to spreadsheet

4. **UPDATE Formulas and Formatting**
   - Apply Google Sheets formulas for automatic calculations (SUM, AVERAGE, etc.)
   - Maintain data validation rules (dropdowns, date formats)
   - Update conditional formatting for visual insights
   - Ensure spreadsheet integrity and accuracy

### Why Users Benefit

- **Data Ownership**: Users own their spreadsheet (it lives in THEIR Drive, not our servers)
- **Spreadsheet Flexibility**: Users can use Excel/Sheets formulas for custom calculations
- **Collaboration**: Users can share spreadsheet with accountants, bookkeepers, or team members
- **Data Portability**: Users can export as Excel, CSV, or PDF anytime
- **Data Persistence**: Even if user cancels our service, their financial data remains in their Drive
- **Transparency**: Users can see exactly what data we store and how we calculate reports

### Alternative Scopes Considered

**Why NOT `spreadsheets.readonly`?**
- Too restrictive - we need to write transaction data, not just read
- Users expect to add expenses/revenues through our app, which requires write access

**Why NOT `drive.file`?**
- Insufficient - doesn't allow spreadsheet-specific operations like:
  - Creating sheets within a spreadsheet
  - Applying formulas and data validation
  - Reading/writing specific cells and ranges
  - Managing spreadsheet metadata (sheet names, colors, etc.)

### Data We Access

We ONLY access the specific spreadsheet we create for each user. We store the spreadsheet ID in our database and use it to identify which file to access. We do NOT:
- Browse user's Drive folders
- Access other spreadsheets
- Read personal documents or files
- Access shared drives or team drives

### Security Measures

- OAuth tokens encrypted with AES-256 in our database
- Spreadsheet ID stored securely with user record
- Access limited to authenticated user's own spreadsheet
- Automatic token refresh with secure storage of refresh tokens
- Users can revoke access anytime at https://myaccount.google.com/permissions

---

## Scope 2: Google Drive API (Limited)

**Scope**: `https://www.googleapis.com/auth/drive.file`

**Limited Access Level**: Only files created by our app

### Why We Need This Scope

We need Drive access to copy our master accounting template spreadsheet to the user's Drive during initial account setup.

### Specific Use Cases

1. **Copy Template Spreadsheet**
   - When user first registers, we copy our master template to their Drive
   - Template ID: `1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8`
   - This creates a new spreadsheet owned by the user

2. **Set File Permissions**
   - Ensure user is the owner of their spreadsheet
   - We do NOT claim ownership or editor rights
   - User maintains full control

3. **Access Created Spreadsheet**
   - After creating the spreadsheet, we need to access it to read/write data
   - This is the ONLY file we access in user's Drive

### Why We Use `drive.file` (Not `drive`)

**`drive.file` is the MOST RESTRICTIVE scope that meets our needs:**
- Only allows access to files our app creates
- We CANNOT browse user's Drive
- We CANNOT access user's existing files, documents, photos, or folders
- We CANNOT access shared drives or team drives
- We CANNOT see what other files exist in user's Drive

**Why NOT `drive` (full Drive access)?**
- Too broad - we don't need to access user's personal files
- Privacy concern - users would be uncomfortable with full Drive access
- Violates principle of least privilege

### What We Do NOT Do

We explicitly do NOT:
- ❌ Browse or search user's Drive
- ❌ Access user's personal documents, photos, videos
- ❌ Read files user uploads themselves
- ❌ Access files from other apps
- ❌ Access shared drives or team drives
- ❌ Modify Drive settings or sharing permissions
- ❌ Delete files outside our created spreadsheet

### User Benefits

- **Maximum Privacy**: We can only see the file we create
- **User Ownership**: User owns the spreadsheet, not us
- **Transparency**: User can see the single file we access in their Drive
- **Control**: User can delete the spreadsheet anytime
- **Revoke Access**: Revoking our access doesn't affect user's other files

### Security Measures

- We store only the spreadsheet ID (not full Drive access)
- OAuth tokens are encrypted and securely stored
- We never request file lists or browse Drive
- Users can revoke access without affecting other Drive files

---

## Summary Table

| Scope | Access Level | What We Do | What We Don't Do |
|-------|-------------|------------|------------------|
| `spreadsheets` | Full spreadsheet access | Create, read, write user's accounting spreadsheet | Access other spreadsheets |
| `drive.file` | Files created by app only | Copy template to user's Drive | Browse Drive, access other files |

---

## Key Messaging for Google Reviewers

### 1. Principle of Least Privilege
We request the MINIMUM scopes needed for our accounting functionality:
- `drive.file` (not `drive`) - most restrictive Drive scope
- `spreadsheets` - necessary for accounting features

### 2. User-Centric Design
- Users own their data (spreadsheet in THEIR Drive)
- Users control access (can revoke anytime)
- Users benefit from spreadsheet features (formulas, sharing, export)

### 3. Transparency
- We clearly explain what we access in privacy policy
- We show users their spreadsheet in our app
- Users can open their spreadsheet directly in Google Sheets anytime

### 4. Security
- OAuth tokens encrypted (AES-256)
- Minimal data stored (just spreadsheet ID)
- Users can delete data anytime
- No third-party sharing

### 5. One File Only
We access exactly ONE file per user - the accounting spreadsheet we create for them. We never access, browse, or even see other files in their Drive.

---

## Common Follow-up Questions

### Q: Why can't you use your own database instead of Google Sheets?

**Answer**: 
We intentionally use Google Sheets because it provides significant benefits to our users:
1. **Data Ownership**: Users own their data (it's in THEIR Drive, not locked in our proprietary database)
2. **Portability**: Users can export, share, or migrate their data easily
3. **Collaboration**: Users can share with their accountant or bookkeeper
4. **Flexibility**: Users can create custom formulas and calculations
5. **Longevity**: Data persists even if user cancels our service
6. **Transparency**: Users can see exactly what data we store and how we calculate it

This aligns with modern data ownership principles where users control their own data.

### Q: Can you reduce the scopes to read-only?

**Answer**: 
No, because our core functionality requires writing data:
- Users add transactions through our app → requires WRITE to spreadsheet
- Users edit balances → requires UPDATE to spreadsheet
- Initial setup copies template → requires CREATE spreadsheet

A read-only app wouldn't provide the accounting functionality users need.

### Q: Why do you need Drive access if you already have Sheets access?

**Answer**: 
The Sheets API doesn't include the ability to:
- Copy a file (we need to copy our template)
- Create a new spreadsheet file in user's Drive
- Set the owner to the user (not our app)

We need `drive.file` scope to perform the initial template copy. After that, we primarily use the Sheets API for all read/write operations.

### Q: How do you ensure you only access the user's accounting spreadsheet?

**Answer**: 
1. When we create the spreadsheet, Google returns a unique spreadsheet ID
2. We store this ID in our database linked to the user's account
3. All API calls include this specific spreadsheet ID
4. The `drive.file` scope automatically restricts us to files we created
5. We never make API calls to list, search, or browse Drive
6. Users can verify in their Drive - they'll see exactly one file created by our app

---

## Supporting Documentation

**Privacy Policy**: https://accounting.siamoon.com/privacy
- Section 3.5: Google Services Integration

**Terms of Service**: https://accounting.siamoon.com/terms
- Section 8: Google Sheets Authorization

**Demo Video**: [YouTube URL - to be added]
- Shows complete OAuth flow and spreadsheet creation

---

**Prepared For**: Google OAuth Verification
**App Name**: BookMate (Accounting Buddy)
**Project ID**: accounting-buddy-476114
**Client ID**: YOUR_GOOGLE_OAUTH_CLIENT_ID
**Submission Date**: [To be completed]
