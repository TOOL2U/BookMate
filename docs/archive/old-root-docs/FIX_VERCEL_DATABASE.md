# 🔧 Fix Vercel Database Connection Error

## 🚨 Current Error
```
Can't reach database server at `db.bzyuhtyanneookgrponx.supabase.co:5432`
```

This means the DATABASE_URL is set but Vercel can't connect to Supabase.

---

## ✅ Solution 1: Use Supabase Connection Pooler (Recommended for Vercel)

Vercel serverless functions need **connection pooling** to work with Supabase.

### Step 1: Get the Correct Connection String

1. Go to: https://supabase.com/dashboard/project/bzyuhtyanneookgrponx/settings/database
2. Look for **Connection string** section
3. Select **"Connection pooling"** tab (NOT "Session mode")
4. Copy the **Transaction Mode** connection string

It should look like:
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Key differences:**
- Uses `pooler.supabase.com` instead of `db.`
- Port `6543` instead of `5432`
- Has `?pgbouncer=true` at the end

### Step 2: Update Vercel

```bash
# Remove old DATABASE_URL
vercel env rm DATABASE_URL production

# Add new pooled connection string
vercel env add DATABASE_URL production
# Paste the pooled connection string when prompted

# Redeploy
vercel --prod
```

---

## ✅ Solution 2: Wake Up Supabase Database

If your Supabase project is on the free tier and hasn't been used recently, it might be paused.

1. Go to: https://supabase.com/dashboard/project/bzyuhtyanneookgrponx
2. Check if there's a message saying "Database is paused"
3. Click **"Restore database"** if needed

---

## ✅ Solution 3: Verify Database Password

Your connection string needs the correct password. If you don't remember it:

1. Go to: https://supabase.com/dashboard/project/bzyuhtyanneookgrponx/settings/database
2. Click **"Reset database password"**
3. Copy the new password
4. Update your connection string:

**For Connection Pooling (Recommended):**
```
postgresql://postgres.[PROJECT-REF]:[NEW-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**For Direct Connection (Not recommended for Vercel):**
```
postgresql://postgres:[NEW-PASSWORD]@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres
```

---

## ✅ Solution 4: Check Prisma Schema for Connection Pooling

Your `prisma/schema.prisma` should have this for Supabase:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

If you need both pooled and direct connections:

```bash
# Add pooled connection for queries (Vercel)
vercel env add DATABASE_URL production
# Paste: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# Add direct connection for migrations (optional)
vercel env add DIRECT_URL production
# Paste: postgresql://postgres:[PASSWORD]@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres
```

---

## 🧪 Test the Connection

After updating, test it:

```bash
# Redeploy
vercel --prod

# Wait for deployment, then test login
curl -X POST https://accounting.siamoon.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 📋 Quick Fix Steps

**If you have your Supabase password:**

```bash
# 1. Get pooled connection string from Supabase dashboard
# (Connection pooling tab → Transaction mode)

# 2. Update Vercel
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Paste the pooled connection string

# 3. Redeploy
vercel --prod
```

**If you DON'T have your password:**

```bash
# 1. Reset password at:
#    https://supabase.com/dashboard/project/bzyuhtyanneookgrponx/settings/database

# 2. Get new pooled connection string with new password

# 3. Update Vercel
vercel env rm DATABASE_URL production
vercel env add DATABASE_URL production
# Paste the new pooled connection string

# 4. Redeploy
vercel --prod
```

---

## 🔍 Verify It's Fixed

Check Vercel logs:
```bash
vercel logs --prod
```

You should see successful database connections instead of timeout errors.

---

## 💡 Why Connection Pooling?

Vercel serverless functions:
- Spin up/down frequently
- Create many database connections
- Can exhaust Supabase's connection limit (default: 15-60)

Connection pooling (PgBouncer):
- Reuses connections efficiently
- Required for production Vercel + Supabase
- Uses port 6543 instead of 5432

---

**Need help?** Check Supabase dashboard for the exact connection strings!
