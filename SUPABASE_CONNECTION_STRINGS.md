# 🔗 BookMate Supabase Connection Strings

**Project:** BookMate  
**Reference ID:** bzyuhtyanneookgrponx  
**Region:** Oceania (Sydney)  
**Password:** bookmatedatabasepassword

---

## ✅ Connection Pooling URL (FOR VERCEL - USE THIS!)

**Transaction Mode (Recommended for Vercel):**
```
postgresql://postgres.bzyuhtyanneookgrponx:bookmatedatabasepassword@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Session Mode (Alternative):**
```
postgresql://postgres.bzyuhtyanneookgrponx:bookmatedatabasepassword@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres
```

---

## 🔹 Direct Connection URL (FOR LOCAL DEVELOPMENT)

```
postgresql://postgres:bookmatedatabasepassword@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres
```

---

## 📋 Quick Setup for Vercel

### Step 1: Update DATABASE_URL in Vercel

```bash
# Remove old DATABASE_URL
vercel env rm DATABASE_URL production

# Add new pooled connection (Transaction mode)
vercel env add DATABASE_URL production
```

When prompted, paste:
```
postgresql://postgres.bzyuhtyanneookgrponx:bookmatedatabasepassword@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Step 2: Redeploy

```bash
vercel --prod
```

---

## 🧪 Test Connection Locally

Update your `.env.local`:

```bash
# For local development (direct connection)
DATABASE_URL="postgresql://postgres:bookmatedatabasepassword@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres"
```

Then test:

```bash
npx prisma db pull
# Should show: Introspected X models, X enums
```

---

## 🔑 Connection String Breakdown

### Pooled (Vercel Production):
- **Host:** `aws-0-ap-southeast-2.pooler.supabase.com`
- **Port:** `6543` (Transaction mode with PgBouncer)
- **Database:** `postgres`
- **User:** `postgres.bzyuhtyanneookgrponx`
- **Password:** `bookmatedatabasepassword`
- **SSL:** Required (automatically handled)
- **Pooling:** `?pgbouncer=true`

### Direct (Local Dev):
- **Host:** `db.bzyuhtyanneookgrponx.supabase.co`
- **Port:** `5432` (Standard PostgreSQL)
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** `bookmatedatabasepassword`
- **SSL:** Required (automatically handled)

---

## ⚙️ Why Use Connection Pooling?

**Vercel Serverless Functions:**
- Spin up and down frequently
- Each function creates new connections
- Can quickly exhaust connection limits (60 concurrent for free tier)

**PgBouncer (Connection Pooling):**
- Reuses database connections
- Much more efficient for serverless
- Required for production on Vercel
- Uses port 6543 instead of 5432

---

## 🚨 Common Issues

### Issue: "Can't reach database server"
**Solution:** Make sure you're using the **pooled URL** (port 6543) in Vercel, not the direct URL (port 5432)

### Issue: "Too many connections"
**Solution:** You're using direct connection (port 5432). Switch to pooled (port 6543)

### Issue: "Invalid password"
**Solution:** Password is `bookmatedatabasepassword` - make sure it's correct in Supabase dashboard

---

## ✅ Next Steps

1. **Update Vercel Environment:**
   ```bash
   vercel env rm DATABASE_URL production
   vercel env add DATABASE_URL production
   # Paste: postgresql://postgres.bzyuhtyanneookgrponx:bookmatedatabasepassword@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

2. **Redeploy:**
   ```bash
   vercel --prod
   ```

3. **Test:**
   ```bash
   curl https://accounting.siamoon.com/api/health
   # Should return 200 OK
   ```

4. **Monitor Logs:**
   ```bash
   vercel logs --prod
   # Should see successful database connections
   ```

---

## 🎯 Summary

**Use this for Vercel Production:**
```
postgresql://postgres.bzyuhtyanneookgrponx:bookmatedatabasepassword@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Use this for Local Development:**
```
postgresql://postgres:bookmatedatabasepassword@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres
```

Copy the production URL and update Vercel now! 🚀
