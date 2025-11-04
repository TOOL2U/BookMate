"use strict";
/**
 * Cloud Function Secrets Configuration
 * ============================================================================
 * Defines secret parameters that are stored in Google Cloud Secret Manager
 * These are accessed via defineSecret() and exposed to functions
 *
 * To set secrets, run:
 * firebase functions:secrets:set SECRET_NAME --data "value"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OPENAI_API_KEY = exports.BASE_URL = exports.SHEETS_WEBHOOK_SECRET = exports.GOOGLE_SHEET_ID = void 0;
const params_1 = require("firebase-functions/params");
// Google Sheet ID containing balance data
exports.GOOGLE_SHEET_ID = (0, params_1.defineSecret)("GOOGLE_SHEET_ID");
// Webhook secret for Apps Script authentication
exports.SHEETS_WEBHOOK_SECRET = (0, params_1.defineSecret)("SHEETS_WEBHOOK_SECRET");
// Base URL for webapp API calls
exports.BASE_URL = (0, params_1.defineSecret)("BASE_URL");
// OpenAI API key for AI-powered analysis
exports.OPENAI_API_KEY = (0, params_1.defineSecret)("OPENAI_API_KEY");
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
//# sourceMappingURL=secrets.js.map