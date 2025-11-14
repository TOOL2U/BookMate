# 🚀 Quick Start: Admin Account Management

## Get Started in 5 Minutes

### Step 1: Set Your First Admin User

You need to give admin privileges to at least one user. Choose one method:

#### Option A: Using the Setup API (Easiest)

1. **Add secret to `.env.local`:**
   ```bash
   ADMIN_SETUP_SECRET=some-random-secure-string-here
   ```

2. **Get your Firebase UID:**
   - Login to your app
   - Go to Firebase Console → Authentication
   - Find your user and copy the UID

3. **Call the setup endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/admin/setup \
     -H "Content-Type: application/json" \
     -d '{"uid": "YOUR_FIREBASE_UID", "secret": "some-random-secure-string-here"}'
   ```

4. **Logout and login again**

5. **Delete the setup file:**
   ```bash
   rm app/api/admin/setup/route.ts
   ```

#### Option B: Using Firebase CLI

```bash
# Install Firebase tools
npm install -g firebase-tools

# Set custom claim
firebase auth:import --project YOUR_PROJECT_ID \
  --hash-algo SCRYPT \
  --custom-claims '{"admin":true}' \
  users.json
```

---

### Step 2: Access Admin Pages

Once you're an admin:

1. **Navigate to accounts list:**
   ```
   http://localhost:3000/admin/accounts
   ```

2. **Create a new account:**
   ```
   http://localhost:3000/admin/accounts/new
   ```

---

### Step 3: Create Your First Account

Before filling the form, prepare:

1. **Create Google Sheet:**
   - Copy your Master Template
   - Note the Sheet ID (from URL between `/d/` and `/edit`)

2. **Create Apps Script:**
   - Open Extensions → Apps Script
   - Deploy as Web App
   - Copy the WebApp URL
   - Generate a unique secret

3. **Fill the form:**
   - Company Name: `Test Company`
   - User Email: `test@example.com`
   - Sheet ID: `1UnCopzurl...`
   - Script URL: `https://script.google.com/macros/s/AKfycbw.../exec`
   - Script Secret: `secret_test_123`

4. **Submit!**

---

## 📋 Admin Routes

| Route | Purpose | Access |
|-------|---------|--------|
| `/admin/accounts` | List all accounts | Admin only |
| `/admin/accounts/new` | Create new account | Admin only |

---

## 🔒 Security Notes

1. **Admin claim required** - Set via Firebase custom claims
2. **Session-based auth** - Token stored in cookies
3. **Server-side validation** - All checks happen on server
4. **One-time setup** - Delete setup API after use

---

## 🐛 Troubleshooting

### "Not authorized" error

**Problem:** You're not an admin

**Solution:**
1. Make sure you set the admin claim (Step 1)
2. Logout and login again (claims are cached)
3. Check Firebase console for custom claims

### "This email already has an account"

**Problem:** Email already registered

**Solution:**
- Use a different email, or
- Check the accounts list to see existing accounts

### Import errors in VSCode

**Problem:** TypeScript can't find modules

**Solution:**
- Restart TypeScript server (Cmd+Shift+P → "Restart TS Server")
- Files exist, it's just a language server cache issue

---

## 📖 Full Documentation

- **Phase 1 Step 1:** [Account Model](./docs/PHASE_1_ACCOUNT_MODEL.md)
- **Phase 1 Step 2:** [Admin UI](./PHASE_1_STEP_2_COMPLETE.md)
- **Quick Reference:** [Account Model Quick Ref](./docs/PHASE_1_ACCOUNT_MODEL_QUICK_REF.md)

---

## ✅ Checklist

- [ ] Set ADMIN_SETUP_SECRET in .env.local
- [ ] Get Firebase UID from console
- [ ] Call setup API to set admin claim
- [ ] Logout and login again
- [ ] Delete setup API file
- [ ] Navigate to /admin/accounts/new
- [ ] Prepare Google Sheet + Apps Script
- [ ] Create first account
- [ ] Verify account appears in list

---

**Ready to go!** 🎉

After these steps, you'll have a working admin interface to create and manage BookMate accounts.
