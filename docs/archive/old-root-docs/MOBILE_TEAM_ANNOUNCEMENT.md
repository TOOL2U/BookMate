# 📢 MOBILE TEAM: New Multi-Tenant System Documentation

**Date:** November 14, 2025  
**Priority:** 🔴 HIGH - SYSTEM ARCHITECTURE CHANGED  
**Action Required:** Mobile app integration updates needed  

---

## 🎯 TL;DR (Too Long; Didn't Read)

**BookMate web application has been converted from single-tenant to multi-tenant architecture.**

### What This Means for You:
- ✅ Each user now has their own isolated data (Google Sheet, settings, categories)
- ⚠️ **Breaking change:** Hardcoded configuration no longer works
- ✅ **New requirement:** Authentication via `/api/auth/login` endpoint
- ✅ All API endpoints now require `Authorization: Bearer <token>` header
- ✅ Complete documentation provided (see below)

### What You Need to Do:
1. **Read the documentation** (we've made it comprehensive)
2. **Implement authentication** (login/logout screens)
3. **Update API calls** (remove hardcoded config, use tokens)
4. **Test thoroughly** (multiple accounts, data isolation)
5. **Deploy** (estimated 3-5 weeks timeline)

---

## 📚 Documentation Structure

We've created **3 comprehensive documents** for you:

### 1. 🎯 [START HERE](./MOBILE_TEAM_START_HERE.md) - Overview & Index
**What's inside:**
- Quick overview of what changed
- Links to all relevant documentation
- Testing resources
- Implementation checklist
- Support contact info

**When to use:** First read, general orientation

---

### 2. 📱 [COMPLETE INTEGRATION GUIDE](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md) - Main Reference
**What's inside:**
- Full system architecture explanation
- Authentication flow (login/logout/session management)
- All API endpoints with request/response examples
- Multi-tenant data flow diagrams
- Complete code examples (React Native/TypeScript)
- Testing guide with test accounts
- Migration from old system
- Security best practices
- Troubleshooting common issues

**When to use:** Implementation reference, code examples, API documentation

**Table of Contents:**
1. System Architecture Overview
2. Authentication System
3. API Endpoints Reference
4. Multi-Tenant Data Flow
5. Mobile App Integration Steps
6. Code Examples
7. Testing Guide
8. Migration from Old System
9. Security & Best Practices
10. Troubleshooting

---

### 3. 🔄 [CHANGELOG](./MOBILE_TEAM_CHANGELOG.md) - What Changed
**What's inside:**
- Recent changes summary (Nov 11-14, 2025)
- Detailed change log (before/after comparisons)
- Complete endpoint status table
- Security changes
- Migration guide
- Testing checklist
- Deployment timeline

**When to use:** Understanding what changed, migration planning

---

## 🚦 Quick Start Roadmap

### Phase 1: Understanding (Day 1)
```
Read in this order:
1. MOBILE_TEAM_START_HERE.md (10 min)
2. MOBILE_TEAM_CHANGELOG.md (15 min)
3. MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md (60 min)

Total: ~1.5 hours
```

### Phase 2: Planning (Day 2-3)
```
Tasks:
- Review code examples
- Identify files to change in your mobile app
- Set up test environment
- Get test account credentials from web team
```

### Phase 3: Implementation (Week 1-3)
```
Week 1: Authentication
- authService.ts (login/logout/session)
- apiClient.ts (authenticated requests)
- Login/Signup screens
- Session persistence

Week 2: API Integration
- Remove hardcoded config
- Update all API calls
- Implement hooks (useBalance, usePnL, useCategories)
- Error handling

Week 3: Settings Management
- Category management screens
- Add/edit/delete properties
- Add/edit/delete expenses
- Sync testing with web app
```

### Phase 4: Testing (Week 4)
```
Tests:
- Login/logout flow
- Multiple account testing (data isolation)
- Settings sync (web app ↔ mobile app)
- Error scenarios
- Performance testing
```

### Phase 5: Production (Week 5)
```
Deploy:
- Final QA
- App store submission
- Production monitoring
- User feedback collection
```

---

## 🔑 Key Concepts to Understand

### 1. Authentication Flow
```
User enters email/password
         ↓
POST /api/auth/login
         ↓
Receive: { token, account, user }
         ↓
Store in AsyncStorage
         ↓
Use token for all API requests
```

### 2. Multi-Tenant Data Isolation
```
Each user has:
- Own Google Sheet (account.sheetId)
- Own webhook URL (account.scriptUrl)
- Own webhook secret (account.scriptSecret)
- Own settings (properties, categories)

Result: Zero cross-contamination between users
```

### 3. API Request Pattern
```typescript
// OLD (❌ Don't use)
fetch(HARDCODED_URL, {
  body: JSON.stringify({ secret: HARDCODED_SECRET })
});

// NEW (✅ Use this)
fetch('https://accounting.siamoon.com/api/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## ⚠️ Breaking Changes

### What No Longer Works:

#### 1. Hardcoded Configuration ❌
```typescript
// ❌ THIS WILL FAIL
const SCRIPT_URL = 'https://script.google.com/macros/s/ABC123/exec';
const SCRIPT_SECRET = 'my-secret-key';
const SHEET_ID = '1ABC...XYZ';
```

**Why:** These were shared by all users. Now each user has their own.

**Fix:** Get from session after login:
```typescript
// ✅ THIS WORKS
const session = await getSession();
const { scriptUrl, scriptSecret, sheetId } = session.account;
```

#### 2. Direct Apps Script Calls ❌
```typescript
// ❌ THIS WILL FAIL
fetch('https://script.google.com/macros/s/ABC123/exec', {
  method: 'POST',
  body: JSON.stringify({ secret: 'hardcoded', action: 'getBalance' })
});
```

**Why:** System now uses authenticated web API for multi-tenancy.

**Fix:** Use web API endpoints:
```typescript
// ✅ THIS WORKS
const token = await getToken();
fetch('https://accounting.siamoon.com/api/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### 3. Unauthenticated Requests ❌
```typescript
// ❌ THIS WILL FAIL (401 Unauthorized)
fetch('https://accounting.siamoon.com/api/balance');
```

**Why:** All data endpoints require authentication.

**Fix:** Include Bearer token:
```typescript
// ✅ THIS WORKS
fetch('https://accounting.siamoon.com/api/balance', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## ✅ What Still Works

### No Changes Required for:
- ✅ UI/UX (screens, components, styling)
- ✅ Local state management
- ✅ Navigation flow
- ✅ Offline storage (just update what you store)
- ✅ Push notifications (if implemented)

### Minimal Changes Required for:
- 🟡 Data fetching hooks (just add auth headers)
- 🟡 Form submissions (just add auth headers)
- 🟡 Error handling (add 401 handling)

---

## 🧪 Testing Resources

### Test Accounts Available
```
Account 1:
Email: shaun@siamoon.com
Company: Sia Moon Company Limited
Purpose: Primary testing

Account 2:
Email: maria@siamoon.com
Company: Alesia House Company Ltd
Purpose: Multi-tenant isolation testing
```

**Get passwords from web team**

### Test Scenarios

#### Scenario 1: Basic Authentication
```typescript
// Test login
const response = await login('shaun@siamoon.com', 'password');
expect(response.ok).toBe(true);
expect(response.token).toBeDefined();
expect(response.account).toBeDefined();

// Test API call
const balance = await getBalance(response.token);
expect(balance.companyName).toBe('Sia Moon Company Limited');
```

#### Scenario 2: Multi-Tenant Isolation
```typescript
// Login as User A
const userA = await login('shaun@siamoon.com', 'password');
const balanceA = await getBalance(userA.token);

// Logout and login as User B
await logout(userA.token);
const userB = await login('maria@siamoon.com', 'password');
const balanceB = await getBalance(userB.token);

// Verify different data
expect(balanceA.accountId).not.toBe(balanceB.accountId);
expect(balanceA.totalCash).not.toBe(balanceB.totalCash);
```

#### Scenario 3: Settings Sync
```typescript
// Add property in mobile app
await addProperty(token, 'Building A');

// Fetch properties from API
const properties = await getProperties(token);
expect(properties).toContain('Building A');

// Verify in web app (manual test)
// Login to https://accounting.siamoon.com
// Go to Settings > Property Management
// Should see "Building A"
```

---

## 📞 Getting Support

### Documentation (Self-Service)
1. **[START HERE](./MOBILE_TEAM_START_HERE.md)** - Overview & quick start
2. **[COMPLETE GUIDE](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)** - Full reference
3. **[CHANGELOG](./MOBILE_TEAM_CHANGELOG.md)** - What changed

### Web Team Contact
- **Production API:** https://accounting.siamoon.com
- **Health Dashboard:** https://accounting.siamoon.com/dashboard/health
- **GitHub:** TOOL2U/BookMate
- **Response Time:** < 4 hours for API issues

### How to Get Help
1. **Check docs first** - 90% of questions answered there
2. **Test with provided accounts** - Verify issue is reproducible
3. **Create GitHub issue** - Include error messages, request/response examples
4. **Tag @webapp-team** - For urgent production issues

---

## 🎓 Learning Resources

### Code Examples Included
All documentation includes working code examples for:
- ✅ Authentication service (login/logout/session)
- ✅ API client (authenticated requests)
- ✅ React hooks (useBalance, usePnL, useCategories)
- ✅ Login screen implementation
- ✅ Dashboard screen with data fetching
- ✅ Error handling patterns
- ✅ Token storage/retrieval

### Technologies Used
- **Backend:** Next.js 15 API Routes
- **Authentication:** Firebase Auth + JWT
- **Database:** Firestore (account configs)
- **Data Source:** Google Sheets API
- **Security:** HTTPS, HttpOnly cookies, JWT tokens

### Architecture Patterns
- **Multi-tenancy:** Firestore account collection with user-specific configs
- **Session management:** JWT tokens with 7-day expiry
- **Cache isolation:** Account-specific cache keys
- **Data isolation:** Account session required for all data endpoints

---

## ✅ Verification Checklist

Before considering integration complete, verify:

### Authentication ✅
- [ ] Login screen implemented
- [ ] Signup screen implemented (optional)
- [ ] Logout functionality works
- [ ] Session persists across app restarts
- [ ] Token expiration handled (auto-logout on 401)

### API Integration ✅
- [ ] All hardcoded config removed
- [ ] All API calls use authenticated endpoints
- [ ] Bearer token included in all requests
- [ ] Error handling implemented (401, 429, 500)
- [ ] Loading states shown during requests

### Multi-Tenant Verification ✅
- [ ] Tested with Account 1 (shaun@siamoon.com)
- [ ] Tested with Account 2 (maria@siamoon.com)
- [ ] Verified different data shown for different users
- [ ] Verified no data cross-contamination
- [ ] Verified cache doesn't show wrong user's data

### Settings Management ✅
- [ ] Properties management works
- [ ] Expenses management works
- [ ] Revenues management works
- [ ] Payments management works
- [ ] Changes sync between web app and mobile app

### Production Readiness ✅
- [ ] All features tested
- [ ] Error scenarios handled
- [ ] Performance acceptable
- [ ] Security best practices followed
- [ ] User experience smooth

---

## 🚀 Ready to Start?

### Step 1: Read Documentation
```bash
1. Open: MOBILE_TEAM_START_HERE.md
2. Read: Overview, architecture diagram, checklist
3. Time: 10 minutes
```

### Step 2: Deep Dive
```bash
1. Open: MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md
2. Read: Full guide from start to finish
3. Time: 1 hour
```

### Step 3: Understand Changes
```bash
1. Open: MOBILE_TEAM_CHANGELOG.md
2. Read: What changed, migration guide
3. Time: 15 minutes
```

### Step 4: Start Implementation
```bash
1. Set up test environment
2. Get test account credentials
3. Implement authentication
4. Update API calls
5. Test thoroughly
6. Deploy
```

---

## 📊 Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Understanding** | 1 day | Read docs, plan changes |
| **Authentication** | 1 week | Login/logout/session management |
| **API Integration** | 1-2 weeks | Update all API calls, remove hardcoded config |
| **Settings** | 3-5 days | Category management screens |
| **Testing** | 1 week | Multi-account testing, data isolation verification |
| **Production** | 3-5 days | Final QA, deployment, monitoring |
| **Total** | **3-5 weeks** | Complete integration |

---

## 🎯 Success Criteria

Integration is successful when:
- ✅ Users can login with email/password
- ✅ Users see only their own data
- ✅ Multiple users can use app simultaneously without data mixing
- ✅ Settings changes sync between web app and mobile app
- ✅ Session persists across app restarts
- ✅ Token expiration handled gracefully
- ✅ All API endpoints work correctly
- ✅ Error handling is user-friendly
- ✅ Performance is acceptable

---

## 📝 Final Notes

### This is a Major Update
The conversion to multi-tenant architecture is a **significant change** that affects:
- System architecture
- Authentication flow
- Data access patterns
- User experience

### Documentation is Comprehensive
We've created **extensive documentation** to help you:
- Understand the new system
- Implement changes correctly
- Test thoroughly
- Deploy successfully

### We're Here to Help
The web team is **standing by to support** your integration:
- Answer questions
- Provide test accounts
- Help debug issues
- Review implementation

---

## 🎉 Let's Build!

**You have everything you need:**
- ✅ Complete documentation
- ✅ Code examples
- ✅ Test accounts
- ✅ Web team support

**Start with:** [MOBILE_TEAM_START_HERE.md](./MOBILE_TEAM_START_HERE.md)

**Questions?** Create a GitHub issue or contact the web team.

---

**Good luck with the integration! We're excited to see BookMate mobile app with the new multi-tenant system!** 🚀

---

**Document:** MOBILE_TEAM_ANNOUNCEMENT.md  
**Version:** 1.0  
**Date:** November 14, 2025  
**Author:** Web Application Team  
**For:** Mobile App Engineering Team
