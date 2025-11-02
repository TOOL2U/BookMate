# 🚀 BookMate Deployment Setup Guide

## 📋 Overview

This guide covers the complete setup for deploying BookMate to production (Vercel) with the new **Expense Category Management System**.

---

## ⚙️ Environment Variables

### **Required for Production (Vercel)**

1. **GOOGLE_SHEET_ID**
   ```
   Your Google Sheet ID from the URL
   Example: 1234567890abcdefghijklmnopqrstuvwxyz
   ```

2. **GOOGLE_CREDENTIALS_JSON**
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "...",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
     "client_id": "...",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "...",
     "universe_domain": "googleapis.com"
   }
   ```
   ⚠️ **IMPORTANT**: Store the entire JSON as a single-line string in Vercel environment variables

3. **WEBHOOK_SECRET**
   ```
   Your Apps Script webhook secret
   Example: VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=
   ```

### **Setting Environment Variables in Vercel**

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: `GOOGLE_CREDENTIALS_JSON`
   - **Value**: Paste the entire JSON object (copy from `config/google-credentials.json`)
   - **Environments**: Select Production, Preview, Development

4. Click **Save**
5. **Redeploy** your project for changes to take effect

---

## 🔧 Local Development Setup

### **1. Create `.env.local` file**

```bash
# .env.local
GOOGLE_SHEET_ID=your_spreadsheet_id_here
WEBHOOK_SECRET=your_webhook_secret_here
```

### **2. Create `config/google-credentials.json`**

**⚠️ This file is gitignored - NEVER commit it to GitHub!**

```bash
# Create config directory if it doesn't exist
mkdir -p config

# Copy your Google service account credentials
# Download from Google Cloud Console → IAM & Admin → Service Accounts
cp ~/Downloads/your-service-account-key.json config/google-credentials.json
```

### **3. Verify Setup**

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Test the expense categories API
curl http://localhost:3000/api/categories/expenses
```

Expected response:
```json
{
  "ok": true,
  "data": {
    "categories": [...],
    "count": 28,
    "source": "google_sheets"
  }
}
```

---

## 🔐 Google Cloud Setup

### **1. Create Service Account**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create new one)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Name: `bookmate-webapp`
6. Description: `BookMate Webapp Google Sheets Integration`
7. Click **Create and Continue**
8. **Skip** role assignment (we'll grant permissions directly on the sheet)
9. Click **Done**

### **2. Generate Key**

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON**
5. Click **Create**
6. Save the downloaded JSON file securely

### **3. Grant Sheet Access**

1. Open your Google Sheet
2. Click **Share**
3. Paste the service account email (e.g., `bookmate-webapp@your-project.iam.gserviceaccount.com`)
4. Grant **Editor** permissions
5. Uncheck **Notify people**
6. Click **Share**

---

## 📊 Google Sheets Setup

### **1. Required Sheets**

Your spreadsheet must have these sheets:

- ✅ **Data** - Contains category lists (Column B starting at B30)
- ✅ **P&L (DO NOT EDIT)** - Auto-generated P&L sheet
- ✅ **Lists** - Aggregated transaction data
- ✅ **BookMate P&L 2025** - Raw transaction log

### **2. Data Sheet Structure**

```
Row 30: First expense category
Column B: Expense category names
```

Example:
```
B30: EXP - Utilities - Gas
B31: EXP - Utilities - Water
B32: EXP - Utilities  - Electricity
...
```

### **3. P&L Sheet ARRAYFORMULA**

In cell **A31** of "P&L (DO NOT EDIT)" sheet:

```
=ARRAYFORMULA(FILTER(Data!B30:B, LEN(Data!B30:B)))
```

This automatically pulls all expense categories from the Data sheet.

### **4. Apps Script Deployment**

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete any existing code
4. Copy and paste the entire contents of `COMPLETE_APPS_SCRIPT_V7_WITH_BALANCE.js`
5. Click **Save** (💾)
6. Click **Deploy** → **New deployment**
7. Select **Web app**
8. Execute as: **Me**
9. Who has access: **Anyone** (the webhook secret provides security)
10. Click **Deploy**
11. Copy the **Web app URL** - this is your webhook endpoint

### **5. Set Webhook Secret**

The Apps Script has a built-in secret:
```javascript
const EXPECTED_SECRET = "VqwvzpO3Ja5Yn+qhWg6DLwTspv/t2V8f3CXI+iJ9Dz8=";
```

⚠️ **For production, change this to a unique value!**

Generate a secure secret:
```bash
# Generate a new secret
openssl rand -base64 32
```

Update the Apps Script and your environment variables with the new secret.

---

## 🧪 Testing

### **1. Test Local Development**

```bash
# Start dev server
npm run dev

# In another terminal, test the API
curl http://localhost:3000/api/categories/expenses

# Should return list of expense categories
```

### **2. Test Adding a Category**

```bash
curl -X POST http://localhost:3000/api/categories/expenses \
  -H "Content-Type: application/json" \
  -d '{"action":"add","newValue":"EXP - Test Category"}'
```

Expected response:
```json
{
  "ok": true,
  "message": "Added expense category: \"EXP - Test Category\"",
  "data": {
    "categories": [...],
    "count": 29
  }
}
```

### **3. Verify in Google Sheets**

1. Open your Google Sheet
2. Go to **Data** sheet
3. Check Column B - new category should be appended
4. Go to **P&L (DO NOT EDIT)** sheet
5. Check that new row was added automatically (wait 1-2 seconds)
6. Verify formulas were generated correctly

---

## 🔄 Deployment Workflow

### **1. Deploy to Vercel**

```bash
# Commit your changes
git add -A
git commit -m "Your commit message"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

### **2. Monitor Deployment**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Watch the deployment progress
4. Check logs for any errors

### **3. Verify Production**

```bash
# Test production API
curl https://your-app.vercel.app/api/categories/expenses

# Should return categories from Google Sheets
```

---

## 🐛 Troubleshooting

### **Error: Google credentials not found**

**Symptom**: API returns 500 error with message "Google credentials not found"

**Solution**:
1. **Local**: Ensure `config/google-credentials.json` exists
2. **Production**: Check `GOOGLE_CREDENTIALS_JSON` environment variable in Vercel
3. Verify the JSON is valid (use a JSON validator)

### **Error: Permission denied**

**Symptom**: API returns error about accessing the sheet

**Solution**:
1. Verify service account email has **Editor** access to the sheet
2. Check `GOOGLE_SHEET_ID` environment variable is correct
3. Ensure sheet is shared with the service account

### **Categories not appearing in P&L**

**Symptom**: Category added to Data sheet but not showing in P&L

**Solution**:
1. Check **P&L!A31** has the ARRAYFORMULA
2. Wait 1-2 seconds after adding category
3. Check Apps Script is deployed and trigger is enabled
4. Refresh the sheet

### **Duplicate category error**

**Symptom**: Cannot add category that already exists

**Solution**:
1. Check Data sheet Column B for existing category
2. Names are case-sensitive
3. Remove any trailing/leading spaces

---

## 📚 Additional Resources

- [Expense Category Management Guide](./EXPENSE_CATEGORY_MANAGEMENT.md)
- [Apps Script Deployment](./APPS_SCRIPT_DEPLOYMENT_DIAGNOSIS.md)
- [Vercel Documentation](https://vercel.com/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] Google Cloud project created
- [ ] Service account created with JSON key downloaded
- [ ] Service account granted Editor access to Google Sheet
- [ ] `GOOGLE_SHEET_ID` set in Vercel
- [ ] `GOOGLE_CREDENTIALS_JSON` set in Vercel (entire JSON as string)
- [ ] `WEBHOOK_SECRET` set in Vercel
- [ ] Apps Script deployed as web app
- [ ] ARRAYFORMULA in P&L!A31
- [ ] Data sheet has expense categories in Column B
- [ ] Test API endpoints locally
- [ ] Test API endpoints in production
- [ ] Verify P&L auto-updates when categories change
- [ ] Document custom webhook secret

---

**Last Updated**: November 2, 2025  
**Version**: 2.0  
**Author**: Shaun Ducker
