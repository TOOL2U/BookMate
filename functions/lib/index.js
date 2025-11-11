"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.onTransactionWrite = void 0;
// Export all functions
var onTransactionWrite_1 = require("./onTransactionWrite");
Object.defineProperty(exports, "onTransactionWrite", { enumerable: true, get: function () { return onTransactionWrite_1.onTransactionWrite; } });
/**
 * Future functions to add:
 * - onBalanceRecalc: AI drift detection when balances change
 * - scheduledAICheck: Scheduled consistency checks
 * - syncFromSheets: Manual trigger to sync from Google Sheets
 * - getBalances: HTTP endpoint to fetch balances
 */
//# sourceMappingURL=index.js.map