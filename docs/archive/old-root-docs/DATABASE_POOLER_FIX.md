# 🚨 CRITICAL: Database Connection Failures

**Date:** November 13, 2025  
**Issue:** Can't reach database server at aws-1-ap-southeast-2.pooler.supabase.com:5432  
**Status:** 🔴 REQUIRES IMMEDIATE FIX

## Problem

Your Vercel deployment is using **Session Pooler (port 5432)** but serverless functions require **Transaction Pooler (port 6543)**.

### Current Errors
```
Error [PrismaClientKnownRequestError]: Can't reach database server
Code: P1001
Affected APIs: /api/pnl, /api/inbox, /api/balance
```

### Root Cause
**Session Pooler is NOT compatible with serverless functions** due to:
- Connection pooling limitations
- Timeout issues on cold starts
- Missing pgbouncer configuration

## Solution

Switch from **Session Pooler** to **Transaction Pooler**:

### Current (WRONG) ❌
```
postgresql://postgres.bzyuhtyanneookgrponx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
```

### Correct (FIXED) ✅
```
postgresql://postgres.bzyuhtyanneookgrponx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key Changes:**
- Port: `5432` → `6543`
- Added: `?pgbouncer=true` parameter

## Implementation Steps

### Step 1: Get Your Supabase Password

You need the database password. Find it in:
- Supabase Dashboard → Settings → Database → Connection string
- Or reset it: Settings → Database → Database password → Reset

### Step 2: Update DATABASE_URL in Vercel

```bash
# Remove old DATABASE_URL
vercel env rm DATABASE_URL production

# Add new DATABASE_URL with Transaction Pooler (port 6543)
vercel env add DATABASE_URL production
# When prompted, paste:
# postgresql://postgres.bzyuhtyanneookgrponx:[YOUR_PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 3: Redeploy

```bash
vercel --prod --yes
```

### Step 4: Verify

```bash
# Wait for deployment to complete, then test
curl -H "Authorization: Bearer [YOUR_TOKEN]" https://accounting.siamoon.com/api/auth/me
```

## Why Transaction Pooler?

### Session Pooler (port 5432) ❌
- ❌ Long-lived connections
- ❌ Not optimized for serverless
- ❌ Connection pool exhaustion
- ❌ Timeouts on cold starts

### Transaction Pooler (port 6543) ✅
- ✅ Short-lived connections
- ✅ Designed for serverless
- ✅ Handles cold starts
- ✅ Better connection management
- ✅ pgbouncer optimization

## Connection String Format

### Full Format
```
postgresql://[USERNAME]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?[PARAMS]
```

### For Supabase Transaction Pooler
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Required Parameters:**
- `pgbouncer=true` - Enables connection pooling mode

**Optional Parameters:**
- `sslmode=require` - Enforce SSL (usually not needed for Supabase)
- `connection_limit=1` - Limit connections per function

## Testing Checklist

After updating and redeploying:

- [ ] No database connection errors in Vercel logs
- [ ] `/api/auth/me` returns user data
- [ ] `/api/balance` works with valid auth
- [ ] `/api/pnl` returns data
- [ ] `/api/inbox` loads messages
- [ ] New user registration works
- [ ] Login/logout functions properly

## Troubleshooting

### Still getting P1001 errors?

**Check 1: Verify the password**
```bash
# Test connection locally (requires psql)
PGPASSWORD='[YOUR_PASSWORD]' psql -h aws-1-ap-southeast-2.pooler.supabase.com -p 6543 -U postgres.bzyuhtyanneookgrponx -d postgres
```

**Check 2: Verify environment variable**
```bash
vercel env pull .env.production
grep DATABASE_URL .env.production
# Should show port 6543 and pgbouncer=true
```

**Check 3: Clear Vercel cache**
```bash
vercel --prod --yes --force
```

### Connection timeout?

Add `connection_limit` parameter:
```
postgresql://...?pgbouncer=true&connection_limit=1
```

## Additional Optimizations

### Prisma Connection Pool Configuration

Add to `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

### For Migrations (Optional)

Use **Direct Connection** (not pooler) for migrations:
```bash
# Direct connection (port 5432, no pooler)
export DIRECT_URL="postgresql://postgres.bzyuhtyanneookgrponx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Run migrations with direct connection
npx prisma migrate deploy
```

## Quick Reference

| Pooler Type | Port | Use Case | Serverless |
|------------|------|----------|-----------|
| Session | 5432 | Long-running apps | ❌ No |
| Transaction | 6543 | Serverless functions | ✅ Yes |
| Direct | 5432 | Migrations only | ⚠️ Limited |

## Priority: 🔴 CRITICAL

This needs to be fixed **immediately** as production is currently unable to connect to the database.

---

## Quick Fix Commands

```bash
# 1. Remove old DATABASE_URL
vercel env rm DATABASE_URL production

# 2. Add new DATABASE_URL (you'll need to paste the password)
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.bzyuhtyanneookgrponx:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true

# 3. Redeploy
vercel --prod --yes

# 4. Test
curl https://accounting.siamoon.com/api/auth/login -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"shaun@siamoon.com","password":"[YOUR_PASSWORD]"}'
```

---

**Status:** Awaiting database password to update DATABASE_URL  
**Next Step:** Get Supabase password and update to Transaction Pooler (port 6543)
