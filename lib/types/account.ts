/**
 * Account Configuration Types
 * 
 * Each BookMate account has:
 * - A unique Google Sheet (copied from Master Template)
 * - A bound Apps Script with WebApp URL and secret
 * - Associated user email(s)
 */

import type { Timestamp } from 'firebase-admin/firestore';

/**
 * Full Account Config document stored in Firestore
 */
export interface AccountConfig {
  /** Firestore document ID (auto-generated) */
  id: string;
  
  /** Human-readable account identifier (slug/company name) */
  accountId: string;
  
  /** Company/Account name */
  companyName: string;
  
  /** Primary user email associated with this account */
  userEmail: string;
  
  /** Google Sheets ID for this account's spreadsheet */
  sheetId: string;
  
  /** Apps Script WebApp URL (unique per account) */
  scriptUrl: string;
  
  /** Apps Script secret for authentication (unique per account) */
  scriptSecret: string;
  
  /** Timestamp when account was created */
  createdAt: Timestamp;
  
  /** Firebase UID of admin who created this account */
  createdBy: string;
  
  /** Optional: Account status (active, suspended, etc.) */
  status?: 'active' | 'suspended' | 'archived';
  
  /** Optional: Last updated timestamp */
  updatedAt?: Timestamp;
  
  /** Optional: Updated by UID */
  updatedBy?: string;
  
  /** Optional: Last connection test timestamp */
  lastConnectionTestAt?: Timestamp;
  
  /** Optional: Last connection test status */
  lastConnectionTestStatus?: 'success' | 'error';
  
  /** Optional: Last connection test message */
  lastConnectionTestMessage?: string;
}

/**
 * Input type for creating a new account
 * (excludes auto-generated fields like id, createdAt)
 */
export interface CreateAccountInput {
  /** Human-readable account identifier */
  accountId: string;
  
  /** Company/Account name */
  companyName: string;
  
  /** Primary user email */
  userEmail: string;
  
  /** Google Sheets ID */
  sheetId: string;
  
  /** Apps Script WebApp URL */
  scriptUrl: string;
  
  /** Apps Script secret */
  scriptSecret: string;
  
  /** Firebase UID of admin creating this account */
  createdBy: string;
  
  /** Optional: Initial status (defaults to 'active') */
  status?: 'active' | 'suspended' | 'archived';
}

/**
 * Input type for updating an existing account
 */
export interface UpdateAccountInput {
  /** Optional: Update company name */
  companyName?: string;
  
  /** Optional: Update user email */
  userEmail?: string;
  
  /** Optional: Update sheet ID */
  sheetId?: string;
  
  /** Optional: Update script URL */
  scriptUrl?: string;
  
  /** Optional: Update script secret */
  scriptSecret?: string;
  
  /** Optional: Update status */
  status?: 'active' | 'suspended' | 'archived';
  
  /** Firebase UID of admin updating this account */
  updatedBy: string;
  
  /** Optional: Last connection test timestamp (ISO string) */
  lastConnectionTestAt?: string;
  
  /** Optional: Last connection test status */
  lastConnectionTestStatus?: 'success' | 'error';
  
  /** Optional: Last connection test message */
  lastConnectionTestMessage?: string;
}

/**
 * Serialized version of AccountConfig (for client-side)
 * Converts Firestore Timestamps to ISO strings
 */
export interface AccountConfigSerialized {
  id: string;
  accountId: string;
  companyName: string;
  userEmail: string;
  sheetId: string;
  scriptUrl: string;
  scriptSecret: string;
  createdAt: string; // ISO string
  createdBy: string;
  status?: 'active' | 'suspended' | 'archived';
  updatedAt?: string; // ISO string
  updatedBy?: string;
  
  /** Optional: Last connection test timestamp (ISO string) */
  lastConnectionTestAt?: string;
  
  /** Optional: Last connection test status */
  lastConnectionTestStatus?: 'success' | 'error';
  
  /** Optional: Last connection test message */
  lastConnectionTestMessage?: string;
}

