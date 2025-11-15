# 📚 Mobile App Team - Complete Documentation Index

**Date:** November 14, 2025  
**Status:** ✅ COMPLETE  
**For:** Mobile App Engineering Team

---

## 🎯 Start Here

**NEW:** [📱 Mobile App Integration - Complete Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)

This is the **master document** that contains everything you need to integrate with the new multi-tenant BookMate system:
- ✅ Authentication flow (login/logout/session management)
- ✅ All API endpoints with examples
- ✅ Multi-tenant architecture explained
- ✅ Code examples (React Native)
- ✅ Testing guide
- ✅ Migration from old system
- ✅ Troubleshooting

**Read this first!** It consolidates all previous documentation into one comprehensive guide.

---

## 📖 Historical Documentation (Reference Only)

These documents were created during the system build phases. They're included in the new complete guide above, but kept here for reference.

### Phase 1: Initial Mobile Integration
- [MOBILE_INTEGRATION_CONFIRMATION.md](./MOBILE_INTEGRATION_CONFIRMATION.md) - Initial API verification (Nov 11, 2025)
  - Rate limit confirmation
  - Header format recommendations
  - Health check polling setup

### Phase 2: Account Configuration System
- [PHASE_3-1_MOBILE_QUICK_START.md](./PHASE_3-1_MOBILE_QUICK_START.md) - Quick setup guide for account config
  - AccountContext implementation
  - fetchAccountConfig() service
  - Loading/error screens
  
- [PHASE_3-1_MOBILE_ACCOUNT_CONFIG.md](./PHASE_3-1_MOBILE_ACCOUNT_CONFIG.md) - Full account config documentation
  - Complete TypeScript types
  - Firestore integration
  - React Context patterns

### Phase 3: Transaction API Client
- [PHASE_3-2_MOBILE_API_CLIENT.md](./PHASE_3-2_MOBILE_API_CLIENT.md) - Robust API client implementation
  - BookmateTransactionPayload types
  - Retry logic (3 attempts with backoff)
  - Offline queue system
  - useSendTransaction hook

---

## 🔄 What Changed (November 2025)

### System Evolution

#### Old System (Before Nov 2025)
```
❌ Single-tenant
❌ Hardcoded Google Sheet ID
❌ Hardcoded webhook URL and secret
❌ All users shared same data
```

#### New System (Current)
```
✅ Multi-tenant architecture
✅ Dynamic account configuration
✅ Each user has own Google Sheet
✅ Complete data isolation
✅ Session-based authentication
```

### Key Changes for Mobile App

| Area | Old Approach | New Approach |
|------|--------------|--------------|
| **Authentication** | None (direct Apps Script calls) | JWT session tokens via web API |
| **Configuration** | Hardcoded in app | Retrieved from Firestore after login |
| **Data Access** | Direct Google Sheets API | Web API endpoints (multi-tenant) |
| **User Management** | Single user | Multiple users with isolated data |
| **Settings** | Fixed | User-specific (properties, categories) |

---

## 📋 Multi-Tenant Data Isolation Reports

These documents explain how the web app was converted to multi-tenant:

### Core Multi-Tenant Fixes
- [MULTI_TENANT_COMPLETE_FIX.md](./MULTI_TENANT_COMPLETE_FIX.md) - Main P&L and Options endpoints
  - Fixed: Property/Person breakdown
  - Fixed: Overhead expenses breakdown
  - Fixed: Settings/Options dropdown
  - Cache isolation strategy
  
- [SETTINGS_PAGE_MULTI_TENANT_FIX.md](./SETTINGS_PAGE_MULTI_TENANT_FIX.md) - Settings page category endpoints
  - Fixed: `/api/categories/properties`
  - Fixed: `/api/categories/expenses`
  - Fixed: `/api/categories/revenues`
  - Fixed: `/api/categories/payments`

### Security Impact
**Critical Data Leakage Fixed:**
- ❌ **Before:** Maria was seeing Shaun's data in web app
- ✅ **After:** Each user sees only their own data

**This affects mobile app:**
- ✅ Users can now safely use mobile app
- ✅ Each user will see their own properties, categories, balance, P&L
- ✅ Zero cross-contamination between accounts

---

## 🔗 API Endpoints Quick Reference

All endpoints documented in detail in the [Complete Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md#api-endpoints-reference).

### Authentication
| Endpoint | Method | Auth |
|----------|--------|------|
| `/api/auth/login` | POST | ❌ |
| `/api/auth/signup` | POST | ❌ |
| `/api/auth/logout-session` | POST | ✅ |
| `/api/auth/me` | GET | ✅ |

### Data (All Multi-Tenant ✅)
| Endpoint | Method | Auth | Rate Limit |
|----------|--------|------|------------|
| `/api/balance` | GET | ✅ | 100/min |
| `/api/pnl` | GET | ✅ | 100/min |
| `/api/pnl/property-person` | GET | ✅ | 100/min |
| `/api/pnl/overhead-expenses` | GET | ✅ | 100/min |
| `/api/inbox` | GET/POST/DELETE | ✅ | 100/30/30 |
| `/api/options` | GET | ✅ | 100/min |

### Settings (All Multi-Tenant ✅)
| Endpoint | Method | Auth | Rate Limit |
|----------|--------|------|------------|
| `/api/categories/properties` | GET/POST | ✅ | 100/30 |
| `/api/categories/expenses` | GET/POST | ✅ | 100/30 |
| `/api/categories/revenues` | GET/POST | ✅ | 100/30 |
| `/api/categories/payments` | GET/POST | ✅ | 100/30 |
| `/api/categories/sync` | POST | ✅ | 10/min |

---

## 🧪 Testing Resources

### Test Accounts
```
Account 1:
Email: shaun@siamoon.com
Company: Sia Moon Company Limited

Account 2:
Email: maria@siamoon.com
Company: Alesia House Company Ltd
```

**Contact web team for passwords.**

### Testing Scenarios
1. **Authentication Test**
   - Login → Receive token + account config
   - Logout → Token cleared
   - Expired token → Auto-logout

2. **Multi-Tenant Test**
   - Login as User A → See User A's data
   - Logout
   - Login as User B → See User B's different data
   - Verify zero overlap

3. **Settings Sync Test**
   - Add property in web app
   - Fetch categories in mobile app
   - Property should appear
   - Add property in mobile app
   - Check web app - should appear

---

## 🚀 Implementation Checklist

Use this checklist when integrating the new system:

### Week 1: Authentication
- [ ] Read [Complete Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)
- [ ] Create `authService.ts` (login/logout/session)
- [ ] Create `apiClient.ts` (authenticated requests)
- [ ] Create Login screen
- [ ] Test login flow with test account
- [ ] Verify session persistence

### Week 2: API Integration
- [ ] Remove hardcoded config (SCRIPT_URL, SCRIPT_SECRET, SHEET_ID)
- [ ] Update all API calls to use new endpoints
- [ ] Implement `useBalance` hook
- [ ] Implement `usePnL` hook
- [ ] Implement `useCategories` hook
- [ ] Test data fetching

### Week 3: Settings Management
- [ ] Create category management screens
- [ ] Implement add/edit/delete for properties
- [ ] Implement add/edit/delete for expenses
- [ ] Implement add/edit/delete for revenues
- [ ] Implement add/edit/delete for payments
- [ ] Test sync with web app

### Week 4: Testing
- [ ] Test with Account 1 (shaun@siamoon.com)
- [ ] Test with Account 2 (maria@siamoon.com)
- [ ] Verify data isolation (no cross-contamination)
- [ ] Test session expiration handling
- [ ] Test error scenarios
- [ ] Performance testing

### Week 5: Production Deployment
- [ ] Final QA testing
- [ ] Update app store screenshots
- [ ] Submit to app stores
- [ ] Monitor error logs
- [ ] Gather user feedback

---

## 📞 Support

### Getting Help
1. **Read the [Complete Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)** - 90% of questions answered there
2. **Check historical docs** - Phase documents for specific implementation details
3. **Create GitHub issue** - For bugs or feature requests
4. **Contact web team** - For urgent production issues

### Web Team Resources
- **Production URL:** https://accounting.siamoon.com
- **Health Dashboard:** https://accounting.siamoon.com/dashboard/health
- **GitHub:** TOOL2U/BookMate

### Response Times
- **Critical (Production down):** < 2 hours
- **API Issues:** < 4 hours
- **Feature Requests:** 1-2 weeks
- **Documentation:** 24-48 hours

---

## 📊 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Login Screen │  │  Dashboard   │  │   Settings   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                  ┌─────────▼─────────┐                      │
│                  │   API Client      │                      │
│                  │ (with JWT token)  │                      │
│                  └─────────┬─────────┘                      │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    HTTPS    │
                             ▼
         ┌───────────────────────────────────────┐
         │   accounting.siamoon.com              │
         │                                       │
         │  ┌─────────────────────────────────┐ │
         │  │  /api/auth/login               │ │
         │  │  /api/auth/logout-session      │ │
         │  │  /api/balance                  │ │
         │  │  /api/pnl                      │ │
         │  │  /api/categories/*             │ │
         │  └────────────┬────────────────────┘ │
         │               │                      │
         │    ┌──────────▼──────────┐          │
         │    │  getAccountFrom     │          │
         │    │  Session()          │          │
         │    └──────────┬──────────┘          │
         │               │                      │
         └───────────────┼────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │Firebase  │  │Firestore │  │ Google   │
    │  Auth    │  │ accounts │  │  Sheets  │
    │          │  │collection│  │   API    │
    └──────────┘  └──────────┘  └──────────┘
         │              │              │
         │              │              │
         └──────────────┼──────────────┘
                        │
                User-Specific Data:
                - sheetId
                - scriptUrl
                - scriptSecret
                - companyName
```

---

## ✅ Summary

### What You Need to Know
1. **BookMate is now multi-tenant** - Each user has isolated data
2. **Authentication is required** - Use JWT tokens from `/api/auth/login`
3. **All APIs are account-specific** - Automatically handled by web API
4. **Settings are user-managed** - Properties/categories unique per user
5. **Complete guide available** - See [MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)

### What to Do Next
1. **Read the Complete Guide** - Start to finish, it has everything
2. **Set up test environment** - Get test account credentials from web team
3. **Implement authentication** - Login/logout/session management
4. **Update API calls** - Remove hardcoded config, use authenticated endpoints
5. **Test thoroughly** - Multiple accounts, data isolation, error handling
6. **Deploy to production** - Roll out to users

---

**Ready to Build?** Start with the [📱 Complete Integration Guide](./MOBILE_APP_INTEGRATION_COMPLETE_GUIDE.md)!

---

**Document Version:** 1.0  
**Last Updated:** November 14, 2025  
**Maintained by:** Web Application Team  
**For:** Mobile App Engineering Team
