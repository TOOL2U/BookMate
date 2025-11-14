# Firebase Client SDK Setup

## 🚨 Action Required: Update Firebase Client Configuration

The sign-up feature requires Firebase client-side authentication, but your `.env.local` file is missing the public Firebase configuration.

## Where to Get the Configuration

1. **Go to Firebase Console:**
   https://console.firebase.google.com/project/bookmate-bfd43/settings/general

2. **Scroll down to "Your apps" section**

3. **If you don't have a Web app yet:**
   - Click "Add app" 
   - Select the `</>` (Web) icon
   - Register the app with a nickname like "BookMate Web"
   - You'll see the configuration object

4. **If you already have a Web app:**
   - Click on the existing web app
   - Look for the "Firebase SDK snippet"
   - Choose "Config" option
   - You'll see something like:

   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSy...",
     authDomain: "bookmate-bfd43.firebaseapp.com",
     projectId: "bookmate-bfd43",
     storageBucket: "bookmate-bfd43.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef..."
   };
   ```

## Update .env.local

Replace the placeholder values in `.env.local` with your real values:

```bash
# ==================== FIREBASE CLIENT SDK (PUBLIC) ====================
NEXT_PUBLIC_FIREBASE_API_KEY=<your-real-api-key>
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bookmate-bfd43.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=bookmate-bfd43
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bookmate-bfd43.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=<your-real-sender-id>
NEXT_PUBLIC_FIREBASE_APP_ID=<your-real-app-id>
```

## Enable Email/Password Authentication

1. Go to: https://console.firebase.google.com/project/bookmate-bfd43/authentication/providers
2. Click on "Email/Password"
3. Enable it (toggle the switch)
4. Save

## Restart Dev Server

After updating `.env.local`:

```bash
# Stop the dev server (Ctrl+C)
# Then restart it:
npm run dev
```

## Security Note

⚠️ These `NEXT_PUBLIC_*` variables are **safe to expose** client-side. They are not secrets.
Firebase uses other mechanisms (like security rules and authorized domains) to protect your project.

## Testing

Once configured, you should be able to:
1. Go to http://localhost:3000/login
2. Click the "Sign Up" tab
3. Create a new account
4. No more "invalid-api-key" errors!
