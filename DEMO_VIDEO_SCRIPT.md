# Demo Video Script for Google OAuth Verification

## Video Requirements
- **Length**: 3-5 minutes
- **Quality**: 1080p minimum (1920x1080)
- **Platform**: YouTube (unlisted)
- **Audio**: Clear narration, minimal background noise
- **Format**: MP4 or MOV

---

## Pre-Recording Checklist

**Technical Setup**:
- [ ] Clean browser (incognito/private mode)
- [ ] Close unnecessary tabs and applications
- [ ] Check internet connection (stable for screen recording)
- [ ] Test microphone audio quality
- [ ] Set screen resolution to 1920x1080
- [ ] Prepare test account email (not your main account)

**Recording Tools**:
- **Mac**: QuickTime, Loom, or OBS Studio
- **Windows**: OBS Studio or Loom
- **Chrome Extension**: Loom

**What to Prepare**:
- Test Google account (e.g., testing@yourdomain.com)
- Production URL: https://accounting.siamoon.com
- Script (below) printed or on second screen
- Practice run (1-2 times before final recording)

---

## Video Script

### INTRO (30 seconds)

**[Screen: accounting.siamoon.com homepage]**

**Script**:
> "Hi, I'm Shaun from BookMate, a cloud-based accounting platform that integrates with Google Sheets. In this video, I'll show you how BookMate uses the Google Sheets API and Drive API, and how we protect user data privacy."

**Action**:
- Show homepage briefly
- Scroll to features section
- Highlight "Google Sheets Integration"

---

### SECTION 1: User Registration (1 minute)

**[Screen: Navigate to /register]**

**Script**:
> "First, let's walk through the user registration process. A new user visits our registration page and creates an account."

**Action**:
1. Click "Sign Up" or navigate to /register
2. Fill in form:
   - Name: "Test User"
   - Email: "testing@example.com" (your test account)
   - Password: (use strong password)
3. Click "Create Account"

**Script**:
> "After creating an account, the user is immediately redirected to Google's OAuth consent screen. This is where Google asks the user to authorize BookMate to access their Google account."

---

### SECTION 2: OAuth Authorization (1.5 minutes)

**[Screen: Google OAuth consent screen appears]**

**Script**:
> "Here's Google's consent screen. Notice it shows our app name 'BookMate' and lists the specific permissions we're requesting. Let me explain each one:"

**Action**:
- Pause on consent screen
- Point to (or highlight) each permission

**Script**:
> "First, we request access to Google Sheets. This allows us to create, read, and write to a personal accounting spreadsheet for this user. We need full spreadsheet access because users will add transactions, which requires write permissions, not just read-only."

**Action**:
- Scroll down (if needed) to show Drive permission

**Script**:
> "Second, we request limited Google Drive access using the 'drive.file' scope. This is important - we specifically use the LIMITED scope, which means we can ONLY access files that our app creates. We cannot browse the user's Drive, access their personal documents, photos, or any other files. We only need this to copy our accounting template into the user's Drive during initial setup."

**Action**:
- Scroll down to show "What BookMate will be able to do" section

**Script**:
> "Google clearly shows what we can do: 'See, edit, create, and delete only the specific Google Drive files you use with this app.' This is exactly what we need - access to just the ONE spreadsheet we create for accounting."

**Action**:
- Click "Allow" button

**Script**:
> "The user clicks 'Allow' to authorize these permissions."

---

### SECTION 3: Spreadsheet Creation (1 minute)

**[Screen: Redirecting to dashboard, loading indicator]**

**Script**:
> "After authorization, BookMate immediately creates a personal accounting spreadsheet in the user's Google Drive. Let's watch this happen."

**Action**:
- Wait for redirect to dashboard
- Dashboard should load successfully

**Script**:
> "Great! The user is now on the BookMate dashboard. Behind the scenes, we've created their spreadsheet. Let me show you exactly what was created."

**Action**:
- Open new browser tab
- Navigate to Google Drive (drive.google.com)
- Log in as the same test user if needed

**Script**:
> "Here's the user's Google Drive. You can see we created exactly ONE file: 'Accounting Buddy Spreadsheet' or 'BookMate Accounting'."

**Action**:
- Point to the created spreadsheet
- Show file details (hover or right-click → Details)

**Script**:
> "Notice that the user is the OWNER of this file. It's in THEIR Drive, not ours. They have complete control over it."

**Action**:
- Click to open the spreadsheet

**Script**:
> "Let's open it. You can see it contains several sheets: Transactions, Categories, Properties, and Balance Tracking. This is the template we copied into their Drive."

**Action**:
- Quickly show each sheet tab
- Point out it's empty (ready for user's data)

---

### SECTION 4: App Functionality (1.5 minutes)

**[Screen: Return to BookMate dashboard tab]**

**Script**:
> "Now let's see how the app uses this spreadsheet. I'll add a financial transaction through the BookMate app."

**Action**:
- Navigate to "Add Transaction" or equivalent
- Fill in form:
  - Type: Expense
  - Amount: $150
  - Category: Office Supplies
  - Date: Today
  - Description: "Printer paper and ink"
- Click "Save" or "Add"

**Script**:
> "I've just added an expense for $150 for office supplies. BookMate writes this transaction to the user's Google Spreadsheet using the Sheets API."

**Action**:
- Wait for success message
- Switch to Google Sheets tab
- Refresh the spreadsheet if needed
- Navigate to "Transactions" sheet

**Script**:
> "And here it is in the spreadsheet! The transaction we just added appears in the Transactions sheet. This demonstrates how we write data to the spreadsheet."

**Action**:
- Point to the new row in the spreadsheet
- Show columns: Date, Type, Category, Amount, Description

**Script**:
> "Now watch this - the user can also edit directly in the spreadsheet."

**Action**:
- Edit the amount in the spreadsheet: Change $150 to $175
- Press Enter to save

**Script**:
> "I've changed the amount from $150 to $175 directly in Google Sheets."

**Action**:
- Switch back to BookMate tab
- Refresh the page or navigate to a view showing transactions

**Script**:
> "When we refresh the app, it reads the updated data from the spreadsheet. You can see the amount is now $175. This bidirectional sync allows users to work in either the app or the spreadsheet - whichever they prefer."

---

### SECTION 5: Data Privacy & User Control (1 minute)

**[Screen: Navigate to Google Account → Security → Third-party apps]**

**Script**:
> "Let me show you how users maintain complete control over their data and can revoke access at any time."

**Action**:
- Open new tab: https://myaccount.google.com/permissions
- Show list of apps with access
- Locate "BookMate" or "Accounting Buddy"

**Script**:
> "Here in the user's Google Account settings, they can see all apps that have access to their account. BookMate is listed here."

**Action**:
- Click on BookMate to expand details

**Script**:
> "The user can click on our app to see exactly what access we have: Google Sheets and limited Drive access. And most importantly, they can revoke this access at any time by clicking 'Remove Access'."

**Action**:
- Point to "Remove Access" button (DON'T click it!)

**Script**:
> "If they revoke access, BookMate can no longer read or write to their spreadsheet. But the spreadsheet remains in their Drive - they still own it, they can still use it, they just can't sync it with our app anymore."

**Action**:
- Navigate back to Google Drive tab
- Show the spreadsheet still exists

**Script**:
> "The user can also delete the spreadsheet from their Drive at any time. They can export it as Excel, CSV, or PDF. They can share it with their accountant or bookkeeper. They have complete control."

---

### SECTION 6: What We Don't Access (30 seconds)

**[Screen: Google Drive with other files]**

**Script**:
> "Let me emphasize what we DO NOT access. Even though the user authorized our app, we cannot and do not:"

**Action**:
- Show various files in Drive (if any): documents, photos, etc.
- Create a test document if Drive is empty: "Personal Document.docx"

**Script**:
> "See these other files in the user's Drive? We cannot see these. We cannot access them. We don't even know they exist. The 'drive.file' scope restricts us to ONLY the spreadsheet we created. This is Google's most privacy-protective Drive scope."

**Action**:
- Point to different file types
- Emphasize the privacy protection

---

### CONCLUSION (30 seconds)

**[Screen: Return to BookMate dashboard]**

**Script**:
> "To summarize: BookMate uses Google Sheets to give users ownership and control of their financial data. We request the minimum scopes necessary: Sheets API for accounting functionality, and the limited 'drive.file' scope to create the spreadsheet. Users can revoke access anytime, their data remains in their Drive, and we never access their personal files."

**Action**:
- Show dashboard one more time
- Show user settings (if there's a "Delete Account" option)

**Script**:
> "If a user deletes their BookMate account, we delete their account data and revoke OAuth tokens, but their spreadsheet remains in their Drive - because they own it, not us."

**Script**:
> "Thank you for watching. If you have any questions about our use of the Google Sheets API or our privacy practices, please visit our privacy policy at accounting.siamoon.com/privacy, or contact us at shaunducker1@gmail.com."

**[Screen: Fade to black or show URL]**

**Display on screen**:
```
BookMate - Cloud Accounting with Google Sheets

Privacy Policy: accounting.siamoon.com/privacy
Contact: shaunducker1@gmail.com

Thank you!
```

---

## Post-Recording Checklist

**Edit the Video**:
- [ ] Trim any mistakes or dead air
- [ ] Add title card at beginning (optional)
- [ ] Add conclusion card at end with URLs
- [ ] Check audio levels (consistent volume)
- [ ] Add captions/subtitles (auto-generate in YouTube)

**Upload to YouTube**:
- [ ] Title: "BookMate - Google Sheets Integration Demo for OAuth Verification"
- [ ] Description: 
  ```
  This video demonstrates how BookMate integrates with Google Sheets and Google Drive APIs.
  
  Scopes used:
  - Google Sheets API (full access)
  - Google Drive API (limited to files created by app)
  
  Privacy Policy: https://accounting.siamoon.com/privacy
  Terms of Service: https://accounting.siamoon.com/terms
  
  This video is for Google OAuth verification purposes.
  ```
- [ ] Visibility: **Unlisted** (not private, not public)
- [ ] Tags: oauth, google sheets, api, verification, accounting
- [ ] Enable auto-generated captions
- [ ] Copy YouTube URL for verification form

---

## Tips for a Great Video

**Do's**:
- ✅ Speak clearly and at moderate pace
- ✅ Show the complete OAuth flow
- ✅ Emphasize user privacy and control
- ✅ Demonstrate both read and write operations
- ✅ Show that users own their data
- ✅ Explain WHY you need each scope

**Don'ts**:
- ❌ Rush through the OAuth consent screen
- ❌ Skip showing the created spreadsheet in Drive
- ❌ Forget to show data syncing both ways
- ❌ Use your production account (use test account)
- ❌ Make video too long (keep under 5 minutes)
- ❌ Have poor audio quality

**Common Mistakes to Avoid**:
- Not showing that user owns the spreadsheet
- Not demonstrating write functionality (why you need write access)
- Not showing how to revoke access
- Not explaining the "drive.file" scope limitation
- Recording at low resolution
- Background noise or distractions

---

## Sample Timeline

| Time | Section | Key Points |
|------|---------|------------|
| 0:00-0:30 | Intro | App overview, purpose of video |
| 0:30-1:30 | Registration | Create account, OAuth redirect |
| 1:30-3:00 | OAuth Consent | Explain scopes, show consent screen |
| 3:00-4:00 | Spreadsheet | Show creation in Drive, user owns it |
| 4:00-5:30 | Functionality | Add transaction, sync, edit in Sheets |
| 5:30-6:00 | Privacy | Revoke access, what we don't access |
| 6:00-6:30 | Conclusion | Summary, contact info |

**Target**: 5-6 minutes total

---

## YouTube URL

After uploading, paste the URL here:

```
YouTube URL: [TO BE ADDED AFTER RECORDING]

Example: https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

This URL will be submitted with the Google OAuth verification request.

---

**Ready to Record?**

1. Set up screen recording
2. Open fresh browser (incognito)
3. Practice once
4. Record final version
5. Upload to YouTube (unlisted)
6. Update this document with URL
7. Submit verification with video link

**Questions?** Contact: shaunducker1@gmail.com

**Good luck!** 🎥🚀
