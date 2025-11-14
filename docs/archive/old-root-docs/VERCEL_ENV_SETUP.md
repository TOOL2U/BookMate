# ⚠️ Missing Vercel Environment Variables

## Current Vercel Environment Variables ✅

Based on `vercel env ls`, you currently have:
- ✅ DATABASE_URL
- ✅ GOOGLE_SERVICE_ACCOUNT_KEY
- ✅ GOOGLE_SHEET_ID
- ✅ SENDGRID_API_KEY
- ✅ SENDGRID_FROM_EMAIL
- ✅ BASE_URL
- ✅ NEXT_PUBLIC_APP_URL
- ✅ FRONTEND_URL
- ✅ FIREBASE_ADMIN_*

## ❌ MISSING - OAuth 2.0 Variables (CRITICAL)

You need to add these for OAuth to work in production:

### 1. GOOGLE_OAUTH_CLIENT_ID
```
YOUR_GOOGLE_OAUTH_CLIENT_ID
```

### 2. GOOGLE_OAUTH_CLIENT_SECRET
```
YOUR_GOOGLE_OAUTH_CLIENT_SECRET
```

### 3. NEXTAUTH_URL (Update if exists)
```
https://accounting.siamoon.com
```

### 4. NEXTAUTH_SECRET (Generate new for production)
```bash
# Generate with:
openssl rand -base64 32
```

### 5. JWT_SECRET (Generate new for production)
```bash
# Generate with:
openssl rand -base64 32
```

---

## 🚀 How to Add Variables to Vercel

### Option 1: Using Vercel CLI (Fastest)

```bash
# Add OAuth Client ID
vercel env add GOOGLE_OAUTH_CLIENT_ID production
# Paste: YOUR_GOOGLE_OAUTH_CLIENT_ID

# Add OAuth Client Secret
vercel env add GOOGLE_OAUTH_CLIENT_SECRET production
# Paste: YOUR_GOOGLE_OAUTH_CLIENT_SECRET

# Add NextAuth URL
vercel env add NEXTAUTH_URL production
# Paste: https://accounting.siamoon.com

# Generate and add NextAuth Secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo $NEXTAUTH_SECRET | vercel env add NEXTAUTH_SECRET production

# Generate and add JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET | vercel env add JWT_SECRET production
```

### Option 2: Using Vercel Dashboard

1. **Go to**: https://vercel.com/tool2us-projects/bookmate/settings/environment-variables

2. **Add each variable**:
   - Click "Add New"
   - Enter variable name
   - Enter value
   - Select "Production" environment
   - Click "Save"

**Variables to add**:

| Name | Value | Environment |
|------|-------|-------------|
| `GOOGLE_OAUTH_CLIENT_ID` | `YOUR_GOOGLE_OAUTH_CLIENT_ID` | Production |
| `GOOGLE_OAUTH_CLIENT_SECRET` | `YOUR_GOOGLE_OAUTH_CLIENT_SECRET` | Production |
| `NEXTAUTH_URL` | `https://accounting.siamoon.com` | Production |
| `NEXTAUTH_SECRET` | [Generate with `openssl rand -base64 32`] | Production |
| `JWT_SECRET` | [Generate with `openssl rand -base64 32`] | Production |

---

## 🔐 Generate Secrets

Run these commands to generate production secrets:

```bash
# Generate NextAuth Secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"

# Generate JWT Secret
echo "JWT_SECRET=$(openssl rand -base64 32)"
```

Copy the output and add to Vercel.

---

## ⚠️ IMPORTANT: Redeploy After Adding Variables

After adding environment variables, you MUST redeploy:

```bash
# Option 1: Trigger redeploy via CLI
vercel --prod

# Option 2: Trigger redeploy via dashboard
# Go to: https://vercel.com/tool2us-projects/bookmate
# Click "Redeploy" on latest deployment
```

Environment variables are only loaded during build time, so a redeploy is required!

---

## ✅ Verification

After adding variables and redeploying:

1. **Check environment variables are set**:
   ```bash
   vercel env ls
   ```
   Should show:
   - GOOGLE_OAUTH_CLIENT_ID
   - GOOGLE_OAUTH_CLIENT_SECRET
   - NEXTAUTH_URL
   - NEXTAUTH_SECRET
   - JWT_SECRET

2. **Test OAuth flow**:
   - Visit: https://accounting.siamoon.com/register
   - Create test account
   - Should redirect to Google OAuth
   - After authorization, should create spreadsheet
   - Should redirect back to dashboard

3. **Check logs for errors**:
   ```bash
   vercel logs --prod
   ```

---

## 📝 Complete Environment Variables Checklist

### ✅ Already in Vercel:
- [x] DATABASE_URL
- [x] GOOGLE_SERVICE_ACCOUNT_KEY
- [x] GOOGLE_SHEET_ID
- [x] SENDGRID_API_KEY
- [x] SENDGRID_FROM_EMAIL
- [x] BASE_URL
- [x] NEXT_PUBLIC_APP_URL
- [x] FRONTEND_URL
- [x] FIREBASE_ADMIN_PROJECT_ID
- [x] FIREBASE_ADMIN_CLIENT_EMAIL
- [x] FIREBASE_ADMIN_PRIVATE_KEY

### ❌ Need to Add:
- [ ] GOOGLE_OAUTH_CLIENT_ID
- [ ] GOOGLE_OAUTH_CLIENT_SECRET
- [ ] NEXTAUTH_URL (or update if exists)
- [ ] NEXTAUTH_SECRET (generate new)
- [ ] JWT_SECRET (generate new)

---

## 🚨 Critical: Don't Commit Secrets!

**Your `.env.local` file should NOT be committed to git!**

Current `.gitignore` should include:
```
.env
.env.local
.env.*.local
```

✅ Verify: Your secrets are safe in Vercel, not in git.

---

## Quick Commands

```bash
# Add all OAuth variables at once
vercel env add GOOGLE_OAUTH_CLIENT_ID production
# Paste: YOUR_GOOGLE_OAUTH_CLIENT_ID

vercel env add GOOGLE_OAUTH_CLIENT_SECRET production
# Paste: YOUR_GOOGLE_OAUTH_CLIENT_SECRET

vercel env add NEXTAUTH_URL production
# Paste: https://accounting.siamoon.com

# Generate and add secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" | pbcopy
vercel env add NEXTAUTH_SECRET production
# Paste from clipboard

echo "JWT_SECRET=$(openssl rand -base64 32)" | pbcopy
vercel env add JWT_SECRET production
# Paste from clipboard

# Redeploy
vercel --prod
```

---

**Next Steps**:
1. ✅ Add the 5 missing environment variables
2. ✅ Redeploy to production
3. ✅ Test OAuth flow
4. ✅ Publish OAuth app
5. 🚀 Launch!

---

**Last Updated**: November 12, 2025  
**Status**: Environment variables identified, ready to add
