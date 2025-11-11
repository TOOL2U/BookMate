/**
 * Firebase Admin SDK Configuration
 * Used in server-side code (API routes, Cloud Functions)
 */

import { initializeApp, cert, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

let appInstance: App | undefined;
let dbInstance: Firestore | undefined;
let authInstance: Auth | undefined;

/**
 * Initialize Firebase Admin (lazy initialization)
 * Only initializes when actually needed, not during build time
 */
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    appInstance = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
  } else {
    appInstance = getApps()[0];
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
  }
  
  return { app: appInstance, adminDb: dbInstance, adminAuth: authInstance };
}

/**
 * Get Firebase Admin instances
 * Initializes on first call, then returns cached instances
 */
export function getFirebaseAdmin() {
  if (!appInstance || !dbInstance || !authInstance) {
    return initializeFirebaseAdmin();
  }
  return { app: appInstance, adminDb: dbInstance, adminAuth: authInstance };
}

/**
 * Get Firebase Admin App
 * Use this in API routes instead of importing adminApp directly
 */
export function getAdminApp(): App {
  const { app } = getFirebaseAdmin();
  if (!app) throw new Error('Firebase Admin app not initialized');
  return app;
}

/**
 * Get Firebase Admin Firestore
 * Use this in API routes instead of importing adminDb directly
 */
export function getAdminDb(): Firestore {
  const { adminDb } = getFirebaseAdmin();
  if (!adminDb) throw new Error('Firebase Admin Firestore not initialized');
  return adminDb;
}

/**
 * Get Firebase Admin Auth
 * Use this in API routes instead of importing adminAuth directly
 */
export function getAdminAuth(): Auth {
  const { adminAuth } = getFirebaseAdmin();
  if (!adminAuth) throw new Error('Firebase Admin Auth not initialized');
  return adminAuth;
}
