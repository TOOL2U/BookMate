/**
 * Firebase Cloud Functions - Main Export
 * ============================================================================
 * This file exports all Cloud Functions for deployment
 * 
 * Available Functions:
 * - onTransactionWrite: Syncs balances when transactions change
 * 
 * Deploy with:
 * firebase deploy --only functions
 */

// Export all functions
export { onTransactionWrite } from "./onTransactionWrite";

/**
 * Future functions to add:
 * - onBalanceRecalc: AI drift detection when balances change
 * - scheduledAICheck: Scheduled consistency checks
 * - syncFromSheets: Manual trigger to sync from Google Sheets
 * - getBalances: HTTP endpoint to fetch balances
 */
