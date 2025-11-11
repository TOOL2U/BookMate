/**
 * Cloud Function Secrets Configuration
 * ============================================================================
 * Defines secret parameters that are stored in Google Cloud Secret Manager
 * These are accessed via defineSecret() and exposed to functions
 * 
 * To set secrets, run:
 * firebase functions:secrets:set SECRET_NAME --data "value"
 */

import { defineSecret } from "firebase-functions/params";

// Google Sheet ID containing balance data
export const GOOGLE_SHEET_ID = defineSecret("GOOGLE_SHEET_ID");

// Webhook secret for Apps Script authentication
export const SHEETS_WEBHOOK_SECRET = defineSecret("SHEETS_WEBHOOK_SECRET");

// Base URL for webapp API calls
export const BASE_URL = defineSecret("BASE_URL");

// OpenAI API key for AI-powered analysis
export const OPENAI_API_KEY = defineSecret("OPENAI_API_KEY");

/**
 * Usage in Cloud Functions:
 * 
 * import { GOOGLE_SHEET_ID, BASE_URL } from "./secrets";
 * 
 * export const myFunction = onRequest(
 *   { secrets: [GOOGLE_SHEET_ID, BASE_URL] },
 *   async (req, res) => {
 *     const sheetId = GOOGLE_SHEET_ID.value();
 *     const baseUrl = BASE_URL.value();
 *     // ... use values
 *   }
 * );
 */
