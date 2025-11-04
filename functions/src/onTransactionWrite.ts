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

import * as functions from "firebase-functions";
import fetch from "node-fetch";
import { db } from "./firebase";
import { BASE_URL } from "./secrets";

export const onTransactionWrite = functions
  .runWith({
    secrets: [BASE_URL],
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
      const baseUrl = BASE_URL.value();
      const url = `${baseUrl}/api/balance/by-property`;
      
      console.log(`Fetching balances from: ${url}`);
      
      const response = await fetch(url, {
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
      const batch = db.batch();
      let updateCount = 0;
      
      for (const balance of data.propertyBalances) {
        if (!balance.property) {
          console.warn("Skipping balance with no property name");
          continue;
        }
        
        const docRef = db.collection("balances").doc(balance.property);
        
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
      await db.collection("activityLogs").add({
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
      
    } catch (error) {
      console.error("Error syncing balances:", error);
      
      // Log error activity
      await db.collection("activityLogs").add({
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
