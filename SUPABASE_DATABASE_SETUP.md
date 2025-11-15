# 🗄️ Supabase Database Connection Setup

## Step 1: Get Your Supabase Database Connection String

### Option A: Via Dashboard (Easiest)

1. **Open Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/bzyuhtyanneookgrponx/settings/database
   ```

2. **Get Connection String:**
   - Click on **"Connection string"** tab
   - Select **"URI"** (not "Session mode")
   - Copy the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres
   ```

3. **Replace `[YOUR-PASSWORD]`** with your actual database password

### Option B: Via Supabase CLI (If you have it installed)

```bash
# Install Supabase CLI (if not installed)
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Get connection string
supabase db dump --db-url
```

---

## Step 2: Update Local Environment

Once you have the connection string, update your `.env.local`:

```bash
# Open .env.local
nano .env.local

# Replace the DATABASE_URL line with:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres"
```

---

## Step 3: Test Connection Locally

```bash
# Test the connection
npx prisma db pull

# If successful, run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

---

## Step 4: Update Vercel Production

```bash
# Remove old DATABASE_URL
vercel env rm DATABASE_URL production

# Add new Supabase DATABASE_URL
vercel env add DATABASE_URL production
# When prompted, paste: postgresql://postgres:YOUR_PASSWORD@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres

# Redeploy
vercel --prod
```

---

## Step 5: Run Migrations on Production Database

```bash
# Set the DATABASE_URL temporarily for migration
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres"

# Run migrations
npx prisma migrate deploy

# Unset the temporary variable
unset DATABASE_URL
```

---

## 📋 Your Supabase Credentials (Found in .env.local)

- **Project URL:** `https://bzyuhtyanneookgrponx.supabase.co`
- **Project ID:** `bzyuhtyanneookgrponx`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6eXVodHlhbm5lb29rZ3Jwb254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTMyMzcsImV4cCI6MjA3ODUyOTIzN30.XHgMPpji9xcEtdMJN1zm_6AqqiiEkaaVudu28-o0f0c`

**Database Host:** `db.bzyuhtyanneookgrponx.supabase.co`

---

## 🔐 If You Don't Remember Your Database Password

1. Go to: https://supabase.com/dashboard/project/bzyuhtyanneookgrponx/settings/database
2. Click **"Reset database password"**
3. Copy the new password
4. Use it in the connection string above

---

## 🚀 Quick Setup Script

Run this after you have your database password:

```bash
#!/bin/bash

# Replace YOUR_PASSWORD with your actual Supabase password
DB_PASSWORD="YOUR_PASSWORD"
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.bzyuhtyanneookgrponx.supabase.co:5432/postgres"

# Update Vercel environment
vercel env rm DATABASE_URL production
echo "$DATABASE_URL" | vercel env add DATABASE_URL production

# Run migrations
export DATABASE_URL="$DATABASE_URL"
npx prisma migrate deploy
unset DATABASE_URL

# Redeploy
vercel --prod

echo "✅ Supabase database connected and deployed!"
```

---

## ✅ Verification

After setup, verify the connection:

```bash
# Check Vercel environment variables
vercel env ls

# Test production deployment
curl https://accounting.siamoon.com/api/health
```

---

**Next Steps:**
1. Get your database password from Supabase
2. Update the connection string
3. Run the setup script above
