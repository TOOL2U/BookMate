# Account Model Quick Reference

## 📦 Imports

```typescript
// Types
import type {
  AccountConfig,
  CreateAccountInput,
  UpdateAccountInput,
  AccountConfigSerialized
} from '@/lib/types/account';

// Functions
import {
  createAccount,
  getAccountByEmail,
  getAccountById,
  getAccountByDocId,
  getAllAccounts,
  updateAccount,
  deleteAccount,
  userHasAccountAccess,
  serializeAccountConfig,
} from '@/lib/accounts';
```

---

## 🔥 Quick Examples

### Create Account
```typescript
const account = await createAccount({
  accountId: 'company-slug',
  companyName: 'Company Name',
  userEmail: 'user@example.com',
  sheetId: '1ABC...XYZ',
  scriptUrl: 'https://script.google.com/.../exec',
  scriptSecret: 'unique-secret-123',
  createdBy: adminUid,
});
```

### Get Account
```typescript
const account = await getAccountByEmail('user@example.com');
const account = await getAccountById('company-slug');
```

### Update Account
```typescript
await updateAccount('company-slug', {
  scriptUrl: 'https://new-url.../exec',
  updatedBy: adminUid,
});
```

### List All Accounts
```typescript
const accounts = await getAllAccounts();
```

### Serialize for API Response
```typescript
return NextResponse.json({
  account: serializeAccountConfig(account),
});
```

---

## 🗄️ Firestore Collection

**Collection Name:** `accounts`

**Query Examples:**
```typescript
// Firebase Admin SDK
const db = getAdminDb();
const accountRef = db.collection('accounts').doc(docId);
const querySnapshot = await db.collection('accounts')
  .where('userEmail', '==', email)
  .get();
```

---

## 🔐 Security

- ❌ NO client-side Firestore access
- ✅ Server-side only (API routes, server components)
- ✅ Admin-protected routes only

---

## 📋 Account Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Auto | Firestore document ID |
| `accountId` | string | ✅ | Human-readable slug |
| `companyName` | string | ✅ | Company name |
| `userEmail` | string | ✅ | Primary user email |
| `sheetId` | string | ✅ | Google Sheets ID |
| `scriptUrl` | string | ✅ | Apps Script URL |
| `scriptSecret` | string | ✅ | Apps Script secret |
| `createdAt` | Timestamp | Auto | Server timestamp |
| `createdBy` | string | ✅ | Admin UID |
| `status` | string | Optional | active/suspended/archived |
| `updatedAt` | Timestamp | Auto | Update timestamp |
| `updatedBy` | string | Auto | Updater UID |

---

## ✅ Status

**Phase 1 - Step 1:** ✅ **COMPLETE**
- Firestore collection defined
- TypeScript types created
- CRUD functions implemented
- Documentation complete

**Next:** Phase 1 - Step 2 (Admin UI)
