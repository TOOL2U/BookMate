/**
 * Firebase Admin SDK Initialization
 * ============================================================================
 * Initializes Firebase Admin SDK for Cloud Functions
 * Used by all Cloud Functions to access Firestore, Auth, etc.
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin (singleton pattern)
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export Firestore instance
export const db = admin.firestore();

// Export Auth instance (for future use)
export const auth = admin.auth();

// Export Admin instance (for future use)
export default admin;
