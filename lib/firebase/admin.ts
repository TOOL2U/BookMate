/**
 * Firebase Admin SDK Configuration
 * Used in server-side code (API routes, Cloud Functions)
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let app: App;
let adminDb: Firestore;
let adminAuth: Auth;

// Initialize Firebase Admin (singleton pattern)
if (getApps().length === 0) {
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  
  adminDb = getFirestore(app);
  adminAuth = getAuth(app);
} else {
  app = getApps()[0];
  adminDb = getFirestore(app);
  adminAuth = getAuth(app);
}

export { app as adminApp, adminDb, adminAuth };
