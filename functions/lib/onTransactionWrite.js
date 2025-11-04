"use strict";
/**
 * Cloud Function: onTransactionWrite
 * ============================================================================
 * Triggers whenever a document in the 'transactions' collection is created,
 * updated, or deleted.
 *
 * Purpose:
 * - Fetch latest balance data from webapp API
 * - Sync balances to Firestore for real-time mobile access
 * - Log activity for audit trail
 *
 * Flow:
 * 1. Transaction added/updated in Firestore
 * 2. Function triggers
 * 3. Call webapp /api/balance/by-property
 * 4. Parse balance data
 * 5. Update Firestore balances collection
 * 6. Mobile team gets real-time update
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onTransactionWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const firebase_1 = require("./firebase");
const secrets_1 = require("./secrets");
exports.onTransactionWrite = functions
    .runWith({
    secrets: [secrets_1.BASE_URL],
    timeoutSeconds: 60,
    memory: "256MB",
})
    .firestore
    .document("transactions/{txnId}")
    .onWrite(async (change, context) => {
    const txnId = context.params.txnId;
    const eventType = !change.before.exists ? "created" :
        !change.after.exists ? "deleted" : "updated";
    console.log(`Transaction ${eventType}: ${txnId}`);
    try {
        // Fetch latest balances from webapp API
        const baseUrl = secrets_1.BASE_URL.value();
        const url = `${baseUrl}/api/balance/by-property`;
        console.log(`Fetching balances from: ${url}`);
        const response = await (0, node_fetch_1.default)(url, {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache",
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`API returned ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        if (!data.propertyBalances || !Array.isArray(data.propertyBalances)) {
            console.warn("No propertyBalances found in API response");
            return;
        }
        console.log(`Found ${data.propertyBalances.length} property balances`);
        // Batch write to Firestore (more efficient than individual writes)
        const batch = firebase_1.db.batch();
        let updateCount = 0;
        for (const balance of data.propertyBalances) {
            if (!balance.property) {
                console.warn("Skipping balance with no property name");
                continue;
            }
            const docRef = firebase_1.db.collection("balances").doc(balance.property);
            batch.set(docRef, {
                accountName: balance.property,
                currentBalance: balance.balance || 0,
                currency: "THB",
                updatedAt: new Date().toISOString(),
                lastSyncedBy: "onTransactionWrite",
                lastSyncedTxn: txnId,
            }, { merge: true });
            updateCount++;
        }
        // Commit batch
        await batch.commit();
        console.log(`✓ Successfully synced ${updateCount} balances to Firestore`);
        // Log activity
        await firebase_1.db.collection("activityLogs").add({
            type: "balance_sync",
            actor: "system",
            timestamp: new Date().toISOString(),
            severity: "info",
            details: {
                triggeredBy: eventType,
                transactionId: txnId,
                balancesUpdated: updateCount,
            },
        });
        return { success: true, balancesUpdated: updateCount };
    }
    catch (error) {
        console.error("Error syncing balances:", error);
        // Log error activity
        await firebase_1.db.collection("activityLogs").add({
            type: "balance_sync",
            actor: "system",
            timestamp: new Date().toISOString(),
            severity: "error",
            details: {
                triggeredBy: eventType,
                transactionId: txnId,
                error: error instanceof Error ? error.message : String(error),
            },
        });
        throw error; // Re-throw to mark function as failed
    }
});
//# sourceMappingURL=onTransactionWrite.js.map