# 🌐 BookMate Webapp – App Store Launch Readiness

**Status**: Phase 1 In Progress  
**Started**: November 11, 2025  
**Target Domain**: https://accounting.siamoon.com (Current) → https://api.bookmate.app (Target)

---

## Phase 1: Backend Preparation for Mobile App Launch

### 1. ✅ Finalize Production Environment

**Current Status**:
- ✅ Production domain: `https://accounting.siamoon.com`
- ✅ Vercel deployment active
- ✅ Firebase project: `bookmate-bfd43`
- ⚠️ Need to verify API endpoint structure

**Action Items**:
- [ ] Audit current production environment variables
- [ ] Verify SSL certificate and HTTPS enforcement
- [ ] Disable test/debug routes in production
- [ ] Document final production domain strategy

**Environment Variables Required**:
```bash
NODE_ENV=production
API_BASE_URL=https://accounting.siamoon.com
FIREBASE_PROJECT_ID=bookmate-bfd43
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY=[CONFIGURED]
```

---

### 2. 🔄 API Stability & Versioning

**Current Endpoints** (Need Audit):
- `/api/auth/*` - Authentication
- `/api/balance/*` - Balance tracking
- `/api/pnl/*` - Profit & Loss
- `/api/reports/*` - Report generation
- `/api/categories/*` - Transaction categories

**Action Items**:
- [ ] Inventory all API routes
- [ ] Implement `/api/v1/*` versioning strategy
- [ ] Standardize error response format
- [ ] Configure CORS for mobile clients
- [ ] Add API authentication/authorization
- [ ] Create API-STABILITY-REPORT.md

---

### 3. 🔐 Authentication & Session Security

**Current Auth System**:
- Firebase Authentication
- Session-based for web

**Action Items**:
- [ ] Implement JWT token-based auth for mobile
- [ ] Add token refresh endpoint
- [ ] Configure token expiry (15min access, 7day refresh)
- [ ] Remove cookie dependencies for mobile
- [ ] Implement rate limiting
- [ ] Test password reset flow for mobile
- [ ] Create AUTH-FLOW-BACKEND.md

---

### 4. 📄 Privacy Policy & Legal URLs

**Required URLs**:
- [ ] Privacy Policy: `https://bookmate.app/privacy` or `https://accounting.siamoon.com/privacy`
- [ ] Terms of Use: `https://bookmate.app/terms` or `https://accounting.siamoon.com/terms`
- [ ] Support Contact: `support@siamoon.com`

**Action Items**:
- [ ] Create privacy policy page
- [ ] Create terms of service page
- [ ] Set up support email handling
- [ ] Share URLs with mobile team

---

### 5. 📊 Performance & Monitoring

**Current Monitoring**:
- Vercel Analytics (basic)

**Action Items**:
- [ ] Enable detailed request logging
- [ ] Add mobile client identification
- [ ] Set up Sentry error tracking
- [ ] Implement Firebase Performance Monitoring
- [ ] Add database indexing for frequent queries
- [ ] Load test critical endpoints
- [ ] Create MONITORING-SETUP-NOTES.md

**Critical Endpoints to Monitor**:
- Authentication (login, token refresh)
- Balance calculations
- Report generation
- Transaction queries

---

### 6. 🧪 Mobile API Testing Readiness

**Action Items**:
- [ ] Create demo/test account
- [ ] Document test credentials
- [ ] Test key user flows:
  - Login → Dashboard
  - Balance retrieval
  - P&L calculations
  - Report generation
- [ ] Test error scenarios:
  - Invalid token
  - Network timeout
  - Missing data
  - Invalid input
- [ ] Provide Postman/Insomnia collection
- [ ] Coordinate with mobile team for EAS build testing

---

### 7. 🔒 Backend Lockdown Before Launch

**Action Items**:
- [ ] Audit API routes for test endpoints
- [ ] Remove or disable `/api/test/*`, `/api/debug/*`
- [ ] Set Firebase security rules (production mode)
- [ ] Enable Firebase App Check (recommended)
- [ ] Review and lock database schema
- [ ] Final security audit
- [ ] Get mobile team approval for go-live

---

### 8. 💬 Communication Channel Setup

**Action Items**:
- [ ] Create #bookmate-mobile-launch Slack channel
- [ ] Set up deployment notifications
- [ ] Create API changelog process
- [ ] Document breaking change protocol

---

## 📋 Implementation Checklist

### Immediate Actions (Week 1)
- [ ] Audit current API endpoints
- [ ] Create API versioning strategy
- [ ] Set up error monitoring
- [ ] Create privacy/terms pages
- [ ] Document authentication flow

### Short-term Actions (Week 2)
- [ ] Implement JWT authentication for mobile
- [ ] Add rate limiting
- [ ] Performance testing
- [ ] Create test accounts
- [ ] Mobile team coordination

### Pre-launch Actions (Week 3)
- [ ] Final security audit
- [ ] Load testing
- [ ] Mobile team testing
- [ ] Lockdown test endpoints
- [ ] Go-live approval

---

## 🎯 Success Criteria

1. ✅ Stable production API used by mobile builds
2. ✅ Authentication and permissions verified
3. ✅ Legal URLs live and shared
4. ✅ Monitoring and logs in place
5. ✅ End-to-end mobile testing successful

---

## 📝 Next Steps

**Immediate Priority**:
1. Audit existing API structure
2. Create API documentation for mobile team
3. Set up monitoring infrastructure
4. Create legal pages

**Contact**:
- Backend Lead: [Your Name]
- Mobile Team: [Mobile Lead Name]
- Support: support@siamoon.com

---

*Last Updated: November 11, 2025*
