# CRITICAL: Fix Vercel Firebase Environment Variable

## The Problem

Your Firebase private key in Vercel has **actual newlines** (line breaks) instead of the string `\n`.

This causes the error:
```
Metadata string value "projects/bookmate-bfd43
/databases/(default)" contains illegal characters
```

The newline after `bookmate-bfd43` is breaking the Firebase SDK.

## The Fix (MUST DO IN VERCEL DASHBOARD)

### Step 1: Go to Vercel
https://vercel.com/tool2us-projects/bookmate/settings/environment-variables

### Step 2: Edit FIREBASE_ADMIN_PRIVATE_KEY

Click on the variable and **delete the current value**.

### Step 3: Copy this EXACT value (ONE CONTINUOUS LINE)

**IMPORTANT**: This should be ONE LONG LINE. When you paste it in Vercel, it should NOT wrap to multiple lines. The `\n` characters should be visible as text, not actual line breaks.

```
-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDJnTgMIzvX2caE\nDdbaZQpsstNqUEHpyqqDwWQkEmybokUJiwBMn8RqU5SvUdiogGilNbeTIQzgLNRV\nQ7faFVgfV1mMFL69DsGlOpoftJrI5BHYTCe0viqYnFQGZCGAV7heOO14SLSeD1L\nbD1Cu/YWj2F5sXcqc/MZxb3+RB4iPAMqnAP5TWSmmpFlIJa6mqeM9/BZFiFfi4Z/\n1dcMAETGPchKxxhUIbBB2xJ/Y3lgc3/0NRgaa+auEj0xBJ6GaRifl9DZ+KM9sxNa\nthbDGqiqRTCJd4950a8okKusulk5RMpa1THFuO4HwVy+a1/8smwG+baEZjCIAI5u\nr/u/mg6nAgMBAAECggEAToediCTFL3tU9qTJVkHbAKHa9WMTeXQGXNGcJuzCPxDC\noUfyMuZcRCoQFQXlRSTXHdrBiV5rPHpZrotBesWR08ag9afG+pbc0uB4OYGEhlTQ\n4uy5WnPEheFYT6HViEzKXzqOP47U2HQbM+CSMAc0gG8SwardRrzpKNW7/mkb76sN\ndvWQ4IVgIifAxUtCjfzRDUbP0kJi4GMkPdfCnpCZv+GMDKyO0A1r+BdMw0eAIOsG\n8/0s5K9ZTqi0a69jHncBZK/PtRzBrzj+9JNYUfPUFMZiblWpuu9JtQtneCWJEvmu\n7f6q4dkATLqSI7eF0Ya94TQyjtuDtdxDm+TgHew2WQKBgQDlcNMta8ZPpA2oBEtV\nSPELP6Pb9HHE8HvTA+F8s7Rqw5C844fhPGRZ7iq6pRsyXeczBCcoXjNvXLsN7Nyd\nUlmXroVhmWGJ2pBycNPZBzcyQsw2LybieRW1UiKl0PuNEoM0YuSzYzZkR/jVh2T4\nOhWW2thruCY8VmAeHlZ5h+RJRQKBgQDg88okuZIbYgD2mwI0kJZGZ/xeWnNuIGWW\n+RnyC1MZYFcPX1abZxVgyBaLy4SBSr4LLhcNu2+X5ovA9TFp2m8Jmr5pOdOIlaR6\nIJY0kykw5mPLpHSjP8OKhFCDeyjq+WOmHicFOWJBKjVFA2a0XkA26/I9ihxJV8ko\n/7mSjmTY+wKBgBAy5gX37PlkeL5bB0KPMs17gcMewAWKgQOF656VRXCgPBDJ86b4\nT5F12jhxPblRneghK+6SsAj1wBMcnPrSfJbT8IDShmtoLfiWdK6G7uOyiZ5tt84X\nhGvXz7BrT8dG/lJthP4RTB7KYgwZUgygdTPAYbVBPBnYc1LNC4frCzgNAoGAG2a2\n1dhg6sL6WQ+yqhJ+q57ZB+k+rEh393bqaShl++5XTIERfKaG3R4iWO72egVPtu7r\nUfnl8vvbRCrZ1QoNgn79+LVZhgasXVAA2/CdEN7PgyvKJWSL/iB16j4jUtQEBmUf\n3awKwuNQT9LFPO1KJyaAgGyFW4287CiSQz7jG+cCgYBySFLbTVeNkpFH8Lp9QPMZ\nE05mybSrblgfBhRGjMu8Jkdg4SPj3pTnD2bhK0MsYZS3BL9f/iu0cRreF6ErKUS+\nOJxsHnfaKAhb41iA7EZuC0OrtxowP3YAy86cGCeEm6aealBZVtvQCcBqVuBAq0Op\nqJK+oaPioCTAxnCVr/l2mg==\n-----END PRIVATE KEY-----\n
```

### Step 4: Verify the format

After pasting, the value in Vercel should show:
- `-----BEGIN PRIVATE KEY-----\nMIIEvAI...` (with visible `\n` characters)
- **NOT** multiple lines like:
  ```
  -----BEGIN PRIVATE KEY-----
  MIIEvAI...
  ```

### Step 5: Also verify these variables

Make sure these are correct too:

**FIREBASE_ADMIN_PROJECT_ID**
```
bookmate-bfd43
```

**FIREBASE_ADMIN_CLIENT_EMAIL**
```
firebase-adminsdk-fbsvc@bookmate-bfd43.iam.gserviceaccount.com
```

### Step 6: Save and Redeploy

1. Click "Save" on all variables
2. Go to Deployments tab
3. Click "Redeploy" on the latest deployment
4. Wait 2-3 minutes

### Step 7: Test

After deployment:
1. Try creating a share link
2. Check Vercel logs - should see NO "illegal characters" error
3. Share link should work perfectly

---

## Why This Happens

Your code (lib/firebase/admin.ts) already has the correct logic:
```typescript
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
```

This converts the string `\n` to actual newlines that Firebase expects.

But if Vercel has **actual newlines** in the env var, then:
- The replace doesn't work (nothing to replace)
- Firebase gets broken newlines in the middle of metadata
- Error: "illegal characters"

The fix is to ensure Vercel has `\n` as **text** (two characters: backslash + n), not as an actual line break.
