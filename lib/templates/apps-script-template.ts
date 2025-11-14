/**
 * Apps Script Template Generator
 * 
 * Uses the real BookMate Apps Script V9.0 template with transfer logic,
 * P&L calculations, balance tracking, and inbox management.
 */

import { buildBookmateAppsScriptTemplate } from './bookmateAppsScriptTemplate';

export interface AppsScriptTemplateOptions {
  scriptSecret: string;
  sheetId?: string;
  companyName?: string;
}

/**
 * Generate the complete Apps Script code with embedded secret
 * 
 * @param options - Configuration options for the script template
 * @returns Complete Apps Script code as a string (V9.0 with transfer logic)
 */
export function generateAppsScriptTemplate(options: AppsScriptTemplateOptions): string {
  const { scriptSecret } = options;
  
  // Use the real V9.0 production template
  return buildBookmateAppsScriptTemplate(scriptSecret);
}

/**
 * Get deployment instructions as formatted text
 */
export function getDeploymentInstructions(): string[] {
  return [
    "Open your Google Spreadsheet",
    "Click Extensions → Apps Script",
    "Delete any default code in the editor",
    "Paste the entire script template below",
    "Click the 'Save' icon (or Ctrl/Cmd + S)",
    "Click 'Deploy' → 'New deployment'",
    "Click the gear icon ⚙️ next to 'Select type'",
    "Choose 'Web app'",
    "Set 'Execute as' to 'Me'",
    "Set 'Who has access' to 'Anyone'",
    "Click 'Deploy'",
    "Copy the 'Web app URL' (ending in /exec)",
    "Paste it into the 'Script URL' field below"
  ];
}

/**
 * Get security warnings
 */
export function getSecurityWarnings(): string[] {
  return [
    "⚠️ The secret is embedded in this code - treat it like a password",
    "🔒 Do not share this code publicly or commit it to public repositories",
    "👥 Only share the deployed Web App URL with authorized users",
    "🔄 If the secret is compromised, generate a new one and update both the Apps Script and BookMate account"
  ];
}
