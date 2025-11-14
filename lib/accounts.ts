/**
 * Account Configuration Data Access Layer
 * 
 * Provides type-safe CRUD operations for account configs in Firestore.
 * 
 * Firestore Structure:
 * - Collection: `accounts`
 * - Each document represents one BookMate account with its spreadsheet config
 * 
 * Security:
 * - All functions are server-side only
 * - Should only be called from admin routes/actions
 * - Client should NEVER have direct Firestore access to accounts collection
 */

import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  AccountConfig,
  CreateAccountInput,
  UpdateAccountInput,
  AccountConfigSerialized
} from '@/lib/types/account';

/**
 * Firestore collection name
 */
const ACCOUNTS_COLLECTION = 'accounts';

/**
 * Convert Firestore document snapshot to AccountConfig type
 */
function docToAccountConfig(
  docSnapshot: FirebaseFirestore.QueryDocumentSnapshot
): AccountConfig {
  const data = docSnapshot.data();
  
  return {
    id: docSnapshot.id,
    accountId: data.accountId,
    companyName: data.companyName,
    userEmail: data.userEmail,
    sheetId: data.sheetId,
    scriptUrl: data.scriptUrl,
    scriptSecret: data.scriptSecret,
    createdAt: data.createdAt,
    createdBy: data.createdBy,
    status: data.status || 'active',
    updatedAt: data.updatedAt,
    updatedBy: data.updatedBy,
  };
}

/**
 * Serialize AccountConfig for client-side (converts Timestamps to strings)
 */
export function serializeAccountConfig(
  config: AccountConfig
): AccountConfigSerialized {
  return {
    ...config,
    createdAt: config.createdAt.toDate().toISOString(),
    updatedAt: config.updatedAt?.toDate().toISOString(),
    lastConnectionTestAt: config.lastConnectionTestAt?.toDate().toISOString(),
  };
}

/**
 * Create a new account configuration
 * 
 * @param input - Account configuration data
 * @returns Created account config with auto-generated ID
 * @throws Error if creation fails or duplicate accountId exists
 */
export async function createAccount(
  input: CreateAccountInput
): Promise<AccountConfig> {
  try {
    const db = getAdminDb();
    
    // Check if accountId already exists
    const existingAccount = await getAccountById(input.accountId);
    if (existingAccount) {
      throw new Error(`Account with ID "${input.accountId}" already exists`);
    }
    
    // Check if userEmail already has an account
    const existingEmailAccount = await getAccountByEmail(input.userEmail);
    if (existingEmailAccount) {
      throw new Error(`Account already exists for email "${input.userEmail}"`);
    }
    
    // Create the account document
    const accountsRef = db.collection(ACCOUNTS_COLLECTION);
    const docRef = await accountsRef.add({
      accountId: input.accountId,
      companyName: input.companyName,
      userEmail: input.userEmail,
      sheetId: input.sheetId,
      scriptUrl: input.scriptUrl,
      scriptSecret: input.scriptSecret,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: input.createdBy,
      status: input.status || 'active',
    });
    
    // Fetch the created document to get server timestamp
    const createdDoc = await docRef.get();
    if (!createdDoc.exists) {
      throw new Error('Failed to fetch created account');
    }
    
    return docToAccountConfig(createdDoc as FirebaseFirestore.QueryDocumentSnapshot);
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

/**
 * Get account by user email
 * 
 * @param userEmail - User's email address
 * @returns Account config or null if not found
 */
export async function getAccountByEmail(
  userEmail: string
): Promise<AccountConfig | null> {
  try {
    const db = getAdminDb();
    const accountsRef = db.collection(ACCOUNTS_COLLECTION);
    const querySnapshot = await accountsRef
      .where('userEmail', '==', userEmail)
      .limit(1)
      .get();
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // Return first match (should only be one due to unique constraint)
    return docToAccountConfig(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting account by email:', error);
    throw error;
  }
}

/**
 * Get account by accountId (human-readable ID)
 * 
 * @param accountId - Account identifier
 * @returns Account config or null if not found
 */
export async function getAccountById(
  accountId: string
): Promise<AccountConfig | null> {
  try {
    const db = getAdminDb();
    const accountsRef = db.collection(ACCOUNTS_COLLECTION);
    const querySnapshot = await accountsRef
      .where('accountId', '==', accountId)
      .limit(1)
      .get();
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return docToAccountConfig(querySnapshot.docs[0]);
  } catch (error) {
    console.error('Error getting account by ID:', error);
    throw error;
  }
}

/**
 * Get account by Firestore document ID
 * 
 * @param docId - Firestore document ID
 * @returns Account config or null if not found
 */
export async function getAccountByDocId(
  docId: string
): Promise<AccountConfig | null> {
  try {
    const db = getAdminDb();
    const docRef = db.collection(ACCOUNTS_COLLECTION).doc(docId);
    const docSnapshot = await docRef.get();
    
    if (!docSnapshot.exists) {
      return null;
    }
    
    return docToAccountConfig(docSnapshot as FirebaseFirestore.QueryDocumentSnapshot);
  } catch (error) {
    console.error('Error getting account by doc ID:', error);
    throw error;
  }
}

/**
 * Get all accounts (admin only)
 * 
 * @returns Array of all account configs
 */
export async function getAllAccounts(): Promise<AccountConfig[]> {
  try {
    const db = getAdminDb();
    const accountsRef = db.collection(ACCOUNTS_COLLECTION);
    const querySnapshot = await accountsRef.get();
    
    return querySnapshot.docs.map((doc) => docToAccountConfig(doc));
  } catch (error) {
    console.error('Error getting all accounts:', error);
    throw error;
  }
}

/**
 * Update an existing account
 * 
 * @param accountId - Account identifier to update
 * @param input - Fields to update
 * @returns Updated account config
 * @throws Error if account not found or update fails
 */
export async function updateAccount(
  accountId: string,
  input: UpdateAccountInput
): Promise<AccountConfig> {
  try {
    const db = getAdminDb();
    
    // Find the account
    const existingAccount = await getAccountById(accountId);
    if (!existingAccount) {
      throw new Error(`Account "${accountId}" not found`);
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: input.updatedBy,
    };
    
    if (input.companyName !== undefined) updateData.companyName = input.companyName;
    if (input.userEmail !== undefined) updateData.userEmail = input.userEmail;
    if (input.sheetId !== undefined) updateData.sheetId = input.sheetId;
    if (input.scriptUrl !== undefined) updateData.scriptUrl = input.scriptUrl;
    if (input.scriptSecret !== undefined) updateData.scriptSecret = input.scriptSecret;
    if (input.status !== undefined) updateData.status = input.status;
    
    // Handle connection test fields
    if (input.lastConnectionTestAt !== undefined) {
      updateData.lastConnectionTestAt = input.lastConnectionTestAt 
        ? Timestamp.fromDate(new Date(input.lastConnectionTestAt))
        : null;
    }
    if (input.lastConnectionTestStatus !== undefined) {
      updateData.lastConnectionTestStatus = input.lastConnectionTestStatus;
    }
    if (input.lastConnectionTestMessage !== undefined) {
      updateData.lastConnectionTestMessage = input.lastConnectionTestMessage;
    }
    
    // Update the document
    const docRef = db.collection(ACCOUNTS_COLLECTION).doc(existingAccount.id);
    await docRef.update(updateData);
    
    // Fetch updated document
    const updatedAccount = await getAccountByDocId(existingAccount.id);
    if (!updatedAccount) {
      throw new Error('Failed to fetch updated account');
    }
    
    return updatedAccount;
  } catch (error) {
    console.error('Error updating account:', error);
    throw error;
  }
}

/**
 * Delete an account (soft delete by setting status to 'archived')
 * 
 * @param accountId - Account identifier to delete
 * @param deletedBy - UID of admin performing deletion
 * @returns Updated account config
 */
export async function deleteAccount(
  accountId: string,
  deletedBy: string
): Promise<AccountConfig> {
  return updateAccount(accountId, {
    status: 'archived',
    updatedBy: deletedBy,
  });
}

/**
 * Check if a user has access to an account
 * 
 * @param userEmail - User's email
 * @param accountId - Account to check
 * @returns True if user has access
 */
export async function userHasAccountAccess(
  userEmail: string,
  accountId: string
): Promise<boolean> {
  try {
    const account = await getAccountById(accountId);
    if (!account) return false;
    
    // For now, simple check: user email must match
    // TODO: In the future, support multiple users per account
    return account.userEmail === userEmail;
  } catch (error) {
    console.error('Error checking account access:', error);
    return false;
  }
}
