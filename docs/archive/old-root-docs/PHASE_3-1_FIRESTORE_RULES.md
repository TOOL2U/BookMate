# Firestore Security Rules for Mobile App

## Overview

The mobile app needs **read access** to the `accounts` collection in Firestore to fetch the user's account configuration. This document outlines the required security rules.

---

## Required Firestore Rules

**File:** `firestore.rules` (on the webapp/backend side)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ============================================================================
    // ACCOUNTS COLLECTION - Mobile App Access
    // ============================================================================
    
    match /accounts/{accountId} {
      
      // READ: Allow authenticated users to read their own account
      // Users can only read accounts where userEmail matches their auth email
      allow read: if request.auth != null 
                  && request.auth.token.email == resource.data.userEmail;
      
      // WRITE: Only admins can create/update/delete accounts
      // Regular users cannot modify account configurations
      allow write: if request.auth != null 
                   && request.auth.token.admin == true;
    }
    
    // ============================================================================
    // OTHER COLLECTIONS (your existing rules)
    // ============================================================================
    
    // ... your other collection rules ...
  }
}
```

---

## Rule Explanation

### Read Access (Mobile Users)

```javascript
allow read: if request.auth != null 
            && request.auth.token.email == resource.data.userEmail;
```

**What it means:**
- ✅ User must be authenticated (`request.auth != null`)
- ✅ User's email must match the account's `userEmail` field
- ✅ Prevents users from reading other users' accounts
- ✅ Mobile app can fetch its account config

**Example:**
- User: `john@example.com` (authenticated)
- Account: `{ userEmail: "john@example.com", ... }`
- Result: ✅ **Allowed** (emails match)

- User: `john@example.com` (authenticated)
- Account: `{ userEmail: "jane@example.com", ... }`
- Result: ❌ **Denied** (emails don't match)

### Write Access (Admin Only)

```javascript
allow write: if request.auth != null 
             && request.auth.token.admin == true;
```

**What it means:**
- ✅ Only users with `admin: true` custom claim can write
- ✅ Prevents mobile users from modifying accounts
- ✅ Ensures account integrity
- ✅ Admin UI remains the only way to manage accounts

---

## Testing the Rules

### Test 1: Authenticated User Reading Own Account

```javascript
// Firebase Rules Simulator
// User: john@example.com (authenticated, not admin)

// Query
collection('accounts').where('userEmail', '==', 'john@example.com')

// Expected: ✅ ALLOWED
```

### Test 2: Authenticated User Reading Other Account

```javascript
// Firebase Rules Simulator
// User: john@example.com (authenticated, not admin)

// Query
collection('accounts').where('userEmail', '==', 'jane@example.com')

// Expected: ❌ DENIED
```

### Test 3: Unauthenticated User

```javascript
// Firebase Rules Simulator
// User: (not authenticated)

// Query
collection('accounts').where('userEmail', '==', 'john@example.com')

// Expected: ❌ DENIED
```

### Test 4: Admin Writing Account

```javascript
// Firebase Rules Simulator
// User: admin@example.com (authenticated, admin: true)

// Operation
setDoc(doc('accounts', 'new-account'), { ... })

// Expected: ✅ ALLOWED
```

### Test 5: Regular User Writing Account

```javascript
// Firebase Rules Simulator
// User: john@example.com (authenticated, not admin)

// Operation
setDoc(doc('accounts', 'new-account'), { ... })

// Expected: ❌ DENIED
```

---

## Mobile App Query

The mobile app uses this query to fetch the account:

```typescript
// services/accountService.ts

const q = query(
  collection(db, 'accounts'),
  where('userEmail', '==', currentUser.email),
  limit(1)
);

const snapshot = await getDocs(q);
```

**Security Check:**
1. User is authenticated → `request.auth != null` ✅
2. Query filters by user's email → `userEmail == request.auth.token.email` ✅
3. Firestore returns only matching documents
4. User can only see their own account ✅

---

## Alternative: Query by UID (Optional)

If you want to use Firebase UID instead of email:

### Firestore Rule
```javascript
match /accounts/{accountId} {
  allow read: if request.auth != null 
              && request.auth.uid == resource.data.userId;
}
```

### Account Document Structure
```javascript
{
  accountId: "siamoon.com",
  userId: "firebase-uid-123", // ← Firebase Auth UID
  userEmail: "user@example.com",
  // ... other fields
}
```

### Mobile Query
```typescript
const q = query(
  collection(db, 'accounts'),
  where('userId', '==', currentUser.uid),
  limit(1)
);
```

**Pros:**
- More secure (UIDs can't be guessed)
- Doesn't break if user changes email

**Cons:**
- Requires updating account documents to include `userId`
- Slightly more complex setup

---

## Firestore Indexes

You may need to create a composite index for the mobile query:

```
Collection: accounts
Fields:
  - userEmail (Ascending)
Query scope: Collection
```

**How to create:**
1. Run the mobile app and make the query
2. Check Firebase Console for error message
3. Click the link in the error to auto-create the index
4. Wait 1-2 minutes for index to build

---

## Deployment Checklist

- [ ] Update `firestore.rules` with account read permissions
- [ ] Deploy rules: `firebase deploy --only firestore:rules`
- [ ] Test rules in Firebase Console > Firestore > Rules Playground
- [ ] Verify mobile app can fetch account config
- [ ] Verify mobile app cannot fetch other users' configs
- [ ] Verify mobile app cannot write to accounts
- [ ] Verify admin can still create/update accounts from webapp

---

## Security Best Practices

### ✅ DO:
- Use `request.auth.token.email` to verify user identity
- Require authentication for all account reads
- Restrict writes to admin users only
- Use Firebase Auth custom claims for admin privileges
- Test rules thoroughly before deploying

### ❌ DON'T:
- Allow unauthenticated access to accounts
- Allow any user to write to accounts
- Expose sensitive data in Firestore rules error messages
- Forget to create necessary indexes

---

## Troubleshooting

### Issue: "Missing or insufficient permissions"

**Cause:** Firestore rules deny access

**Solutions:**
1. Check user is authenticated (`firebase.auth().currentUser` is not null)
2. Verify user's email matches account's `userEmail`
3. Check Firestore rules are deployed
4. Test query in Firebase Console

### Issue: "Index not found"

**Cause:** Missing composite index

**Solution:**
1. Click the link in the error message
2. Auto-create the index
3. Wait for index to build (1-2 minutes)
4. Retry the query

### Issue: "User can see all accounts"

**Cause:** Rules too permissive

**Solution:**
```javascript
// ❌ WRONG - allows reading all accounts
allow read: if request.auth != null;

// ✅ CORRECT - only own account
allow read: if request.auth != null 
            && request.auth.token.email == resource.data.userEmail;
```

---

## Example Full Rules File

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function - Check if user is admin
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    // Helper function - Check if user owns the account
    function isAccountOwner(userEmail) {
      return request.auth != null && request.auth.token.email == userEmail;
    }
    
    // ACCOUNTS COLLECTION
    match /accounts/{accountId} {
      // Users can read their own account
      allow read: if isAccountOwner(resource.data.userEmail);
      
      // Only admins can write
      allow write: if isAdmin();
    }
    
    // TRANSACTIONS COLLECTION (example)
    match /transactions/{transactionId} {
      // Users can read/write their own transactions
      allow read, write: if request.auth != null;
    }
    
    // OTHER COLLECTIONS
    // ... your other rules ...
  }
}
```

---

## Summary

**Minimal Required Changes:**

1. Add read rule to `accounts` collection:
   ```javascript
   allow read: if request.auth != null 
               && request.auth.token.email == resource.data.userEmail;
   ```

2. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

3. Create index if prompted

4. Test in mobile app

**That's it!** The mobile app can now securely fetch its account configuration from Firestore.

---

## Questions?

- Check Firebase Console > Firestore > Rules tab
- Use Rules Playground to test queries
- Review Firebase Auth custom claims documentation
- Contact backend team if admin claim setup is needed
