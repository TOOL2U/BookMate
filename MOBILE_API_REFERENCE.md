# Mobile Team - API Integration Quick Reference

**Backend Status**: ✅ Production Ready  
**Base URL**: `https://accounting.siamoon.com`  
**Last Updated**: January 2025

---

## 🎯 Quick Start

All endpoints are now secured with:
- ✅ Rate limiting (see limits below)
- ✅ Security headers (CORS enabled)
- ✅ Standardized error responses
- ✅ Request tracing (X-Request-ID)

---

## 📡 Key Endpoints

### 1. Balance Summary
```
GET /api/balance
Rate Limit: 100 requests/min
Response Time: ~300ms

Response:
{
  "ok": true,
  "items": [
    {
      "accountName": "Cash - CIMB",
      "openingBalance": 50000,
      "inflow": 20000,
      "outflow": 15000,
      "currentBalance": 55000
    }
  ],
  "totals": {
    "openingBalance": 100000,
    "inflow": 40000,
    "outflow": 30000,
    "currentBalance": 110000
  }
}
```

### 2. P&L Data
```
GET /api/pnl
Rate Limit: 100 requests/min
Response Time: ~600ms

Response:
{
  "ok": true,
  "data": {
    "month": {
      "revenue": 150000,
      "overheads": 45000,
      "propertyPersonExpense": 30000,
      "gop": 75000,
      "ebitda": 45000,
      "ebitdaMargin": 30.0
    },
    "year": { ... }
  }
}
```

### 3. Health Check (for sync indicator)
```
GET /api/health/balance
Rate Limit: 200 requests/min
Response Time: ~150ms

Response:
{
  "ok": true,
  "status": "healthy",
  "timestamp": "2025-01-15T12:00:00Z",
  "syncedAccounts": 5,
  "lastSync": "2025-01-15T11:55:00Z"
}
```

### 4. AI Report Generation
```
POST /api/reports/ai-insights
Rate Limit: 10 requests/min
Content-Type: application/json

Request:
{
  "period": {
    "type": "monthly",
    "start": "2025-11-01",
    "end": "2025-11-30",
    "label": "November 2025"
  },
  "metrics": {
    "totalRevenue": 150000,
    "totalExpenses": 85000,
    "netProfit": 65000,
    "profitMargin": 43.3,
    "cashPosition": 250000
  },
  "tone": "investor",  // Options: standard, investor, casual, executive
  "organizationProfile": {
    "businessName": "Sia Moon Co., Ltd.",
    "sector": "Property Management"
  }
}

Response:
{
  "executiveSummary": ["Revenue increased...", "..."],
  "keyTrends": ["Strong performance...", "..."],
  "risks": ["Cash flow concern...", "..."],
  "opportunities": ["Potential for...", "..."]
}
```

### 5. Categories
```
GET /api/categories/payments
GET /api/categories/properties
GET /api/categories/expenses
GET /api/categories/revenues

Rate Limit: 100 requests/min (GET), 30 requests/min (POST)

Response:
{
  "ok": true,
  "data": [
    { "name": "Category 1", "type": "expense" },
    { "name": "Category 2", "type": "revenue" }
  ]
}
```

---

## 🚦 Rate Limits

| Tier | Limit | Endpoints |
|------|-------|-----------|
| Health | 200/min | `/api/health/*` |
| Read | 100/min | `/api/balance`, `/api/pnl`, `/api/categories/*` (GET) |
| Write | 30/min | `/api/balance/save`, `/api/categories/*` (POST) |
| Reports | 10/min | `/api/reports/*` |
| Auth | 5/min | `/api/auth/*` (future) |

**Headers Returned**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1705320000000
```

**When Exceeded**:
```json
HTTP 429 Too Many Requests
{
  "ok": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT",
  "details": {
    "resetAt": "2025-01-15T12:05:00Z",
    "limit": 100,
    "remaining": 0
  }
}
```

---

## 🎨 AI Tones

4 customizable AI report tones:

| Tone | Style | Use Case |
|------|-------|----------|
| **standard** | Professional, balanced | General reports |
| **investor** | Formal, data-driven, ROI-focused | Investor updates |
| **casual** | Conversational, simplified | Client-facing |
| **executive** | Brief, strategic | Management summaries |

**Temperature Settings**:
- casual: 0.7 (more creative)
- investor/executive: 0.5 (precise)
- standard: 0.6 (balanced)

---

## 🔒 Security Headers

All responses include:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Access-Control-Allow-Origin: *
X-Request-ID: <uuid>
```

---

## 📱 Mobile Client Headers

**Recommended Headers to Send**:
```
Content-Type: application/json
X-Platform: ios | android
X-Client-Version: 1.0.0
X-Device-ID: <device-uuid>
X-Request-ID: <request-uuid>
```

---

## ⚡ Performance Tips

### 1. Balance Polling
```swift
// Poll health endpoint every 30 seconds for sync indicator
let healthTimer = Timer.scheduledTimer(withTimeInterval: 30) {
    fetch("https://accounting.siamoon.com/api/health/balance")
}
```

### 2. PDF Caching
```
First generation: 5-10 seconds
Cached response: <1 second
Cache duration: 24 hours

// PDFs are automatically cached on Firebase Storage
// Same report within 24h = instant download
```

### 3. Batch Requests
```swift
// Use Promise.all / DispatchGroup for parallel requests
async let balance = fetchBalance()
async let pnl = fetchPnL()
async let categories = fetchCategories()

let (balanceData, pnlData, categoriesData) = await (balance, pnl, categories)
```

---

## ❌ Error Handling

### Standard Error Response
```json
{
  "ok": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Error Codes
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `INVALID_TOKEN` | 401 | Token invalid or expired |
| `MISSING_TOKEN` | 401 | No auth token provided |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks permission |
| `INVALID_INPUT` | 400 | Invalid request body |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `SERVICE_UNAVAILABLE` | 503 | Backend service down |

### Handle Errors Gracefully
```swift
do {
    let response = try await fetch(url)
    if response.ok {
        // Success
    } else {
        // Show user-friendly error
        showAlert(response.error)
    }
} catch {
    // Network error
    showAlert("Unable to connect")
}
```

---

## 🧪 Testing Endpoints

### Using curl
```bash
# Test balance endpoint
curl https://accounting.siamoon.com/api/balance

# Test AI insights
curl -X POST https://accounting.siamoon.com/api/reports/ai-insights \
  -H "Content-Type: application/json" \
  -d '{
    "period": {"type": "monthly", "start": "2025-11-01", "end": "2025-11-30"},
    "metrics": {"totalRevenue": 150000, "totalExpenses": 85000},
    "tone": "investor"
  }'

# Test rate limiting
for i in {1..105}; do
  curl https://accounting.siamoon.com/api/balance
done
```

### Using Postman
Import this collection:
```json
{
  "info": { "name": "BookMate API" },
  "item": [
    {
      "name": "Get Balance",
      "request": {
        "method": "GET",
        "url": "https://accounting.siamoon.com/api/balance"
      }
    }
  ]
}
```

---

## 🚨 Known Issues / Limitations

1. **Rate Limiting**: Aggressive limits to prevent abuse. If user hits limit, show "Please wait X seconds" message.

2. **AI Generation**: Limited to 10 requests/min. Cache results on mobile if possible.

3. **PDF Export**: First generation takes 5-10s. Show loading indicator. Subsequent requests are cached (<1s).

4. **No Offline Support**: All endpoints require internet. Implement local caching for better UX.

---

## 📞 Support

**Issues?** Contact WebApp team:
- GitHub: TOOL2U/BookMate
- Production URL: https://accounting.siamoon.com
- Health Status: https://accounting.siamoon.com/api/health/balance

**Backend Status**: All Phase 2 items complete ✅  
**Mobile Integration**: Ready to proceed 🚀

---

**Last Updated**: January 15, 2025  
**API Version**: v2.0 (Phase 2 Complete)
