/**
 * Spreadsheet Provisioning Service
 * Creates and configures personalized Goo    // IMPORTANT: Copy the template from Shared Drive INTO the same Shared Drive
    // This avoids storage quota issues and keeps all user sheets organized
    const copyName = `BookMate P&L – ${userName || userEmail}`;
    
    console.log('📋 Copying master template:', MASTER_TEMPLATE_ID);
    console.log('📝 New spreadsheet name:', copyName);
    
    if (!SHARED_DRIVE_ID) {
      throw new Error('BOOKMATE_SHARED_DRIVE_ID environment variable is not set');
    }

    console.log('📁 Target Shared Drive ID:', SHARED_DRIVE_ID);
    
    const copyResponse = await drive.files.copy({
      fileId: MASTER_TEMPLATE_ID,
      requestBody: {
        name: copyName,
        parents: [SHARED_DRIVE_ID], // Place in Shared Drive (crucial!)
      },
      supportsAllDrives: true, // Required for Shared Drive operations
      fields: 'id, name, webViewLink, owners',
    });r users
 * Uses Service Account for automatic provisioning (no OAuth required)
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { JWT } from 'google-auth-library';

// NEW TEMPLATE ID - In Shared Drive
const MASTER_TEMPLATE_ID = '1GHY5YkwPgmTmyiFre1quFcYQ902KFg_gbNSU2aTfIkU';

// Shared Drive ID (provided by PM, set via environment variable)
const SHARED_DRIVE_ID = process.env.BOOKMATE_SHARED_DRIVE_ID;

export interface ProvisionResult {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  success: boolean;
  error?: string;
}

/**
 * Get Service Account auth client
 */
function getServiceAccountAuth(): JWT {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is required');
  }

  let credentials;
  try {
    credentials = JSON.parse(serviceAccountKey);
  } catch (error) {
    throw new Error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY format');
  }

  // IMPORTANT: Fix escaped newlines in private key (if present)
  if (credentials.private_key) {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive',
    ],
  });
}

/**
 * Provision a new spreadsheet for a user using Service Account (automatic, no OAuth needed)
 * Uses Google Drive API to COPY the master template (not create from scratch)
 * The spreadsheet is created by the service account and then shared with the user
 */
export async function provisionUserSpreadsheetAuto(
  userId: string,
  userEmail: string,
  userName: string
): Promise<ProvisionResult> {
  try {
    const auth = getServiceAccountAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('🔧 Creating spreadsheet for user:', userEmail);
    
    // Debug: Verify which account we're authenticated as
    if (process.env.NODE_ENV !== 'production') {
      try {
        const about = await drive.about.get({ fields: 'user(emailAddress)' });
        console.log('✅ Google Drive authenticated as:', about.data.user?.emailAddress);
      } catch (err) {
        console.warn('⚠️  Could not verify Drive account:', err);
      }
    }

    // IMPORTANT: Copy the template using Drive API (not create from scratch)
    // This is much more reliable than copying individual sheets
    const copyName = `BookMate P&L 2025 – ${userName || userEmail}`;
    
    console.log('� Copying master template:', MASTER_TEMPLATE_ID);
    console.log('📝 New spreadsheet name:', copyName);
    
    const copyResponse = await drive.files.copy({
      fileId: MASTER_TEMPLATE_ID,
      requestBody: {
        name: copyName,
        // Optional: place in a specific folder if configured
        // parents: process.env.BOOKMATE_USER_SHEETS_FOLDER_ID 
        //   ? [process.env.BOOKMATE_USER_SHEETS_FOLDER_ID] 
        //   : undefined,
      },
      supportsAllDrives: true, // Future-proof for Shared Drives
      fields: 'id, name, webViewLink, owners',
    });

    const newSpreadsheetId = copyResponse.data.id;
    
    if (!newSpreadsheetId) {
      throw new Error('Failed to copy template: spreadsheet ID missing');
    }

    console.log('✅ Template copied successfully');
    console.log('   New Spreadsheet ID:', newSpreadsheetId);
    console.log('   Owner:', copyResponse.data.owners?.[0]?.emailAddress);
    
    const spreadsheetUrl = copyResponse.data.webViewLink || 
      `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;

    // Share the spreadsheet with the user as WRITER (not owner)
    console.log('🔓 Sharing spreadsheet with user:', userEmail);
    try {
      await drive.permissions.create({
        fileId: newSpreadsheetId,
        requestBody: {
          type: 'user',
          role: 'writer', // User can edit, but service account remains owner
          emailAddress: userEmail,
        },
        sendNotificationEmail: true, // User receives email with link
        emailMessage: `Welcome to BookMate! Your personal P&L spreadsheet has been created and is ready to use.`,
        supportsAllDrives: true,
      });
      console.log('✅ Spreadsheet shared with user as WRITER');
    } catch (shareError: any) {
      console.error('⚠️  Warning: Could not share spreadsheet:', shareError.message);
      // Continue anyway - we can manually share later if needed
    }

    console.log('🎉 Spreadsheet provisioning complete!');
    console.log('📋 ID:', newSpreadsheetId);
    console.log('🔗 URL:', spreadsheetUrl);

    return {
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl,
      success: true,
    };

  } catch (error: any) {
    console.error('❌ Error provisioning spreadsheet:', error.message);
    console.error('   Error details:', {
      code: error.code,
      status: error.status,
      errors: error.errors,
    });
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get OAuth2 client with user's access token (legacy OAuth flow)
 */
function getOAuth2ClientWithToken(accessToken: string): OAuth2Client {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  
  return oauth2Client;
}

/**
 * Provision a new spreadsheet for a user using their OAuth access token (legacy)
 * @deprecated Use provisionUserSpreadsheetAuto() instead for automatic provisioning
 */
export async function provisionUserSpreadsheet(
  userId: string,
  userEmail: string,
  userName: string,
  accessToken: string
): Promise<ProvisionResult> {
  try {
    const auth = getOAuth2ClientWithToken(accessToken);
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Creating spreadsheet for user:', userEmail);
    
    // Create a blank spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `BookMate - ${userName || userEmail}`,
        },
      },
    });

    const newSpreadsheetId = createResponse.data.spreadsheetId;
    
    if (!newSpreadsheetId) {
      throw new Error('Failed to create blank spreadsheet');
    }

    console.log('Blank spreadsheet created:', newSpreadsheetId);
    console.log('Copying sheets from template...');
    
    // Get all sheets from the template
    const templateSpreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: MASTER_TEMPLATE_ID,
    });

    const templateSheets = templateSpreadsheet.data.sheets || [];
    console.log('Found', templateSheets.length, 'sheets in template');

    // Copy each sheet from template to new spreadsheet
    for (const sheet of templateSheets) {
      const sheetId = sheet.properties?.sheetId;
      const sheetTitle = sheet.properties?.title;
      
      if (!sheetId) continue;

      console.log('Copying sheet:', sheetTitle);
      
      await sheets.spreadsheets.sheets.copyTo({
        spreadsheetId: MASTER_TEMPLATE_ID,
        sheetId: sheetId,
        requestBody: {
          destinationSpreadsheetId: newSpreadsheetId,
        },
      });
    }

    // Get the new spreadsheet to find the default Sheet1
    const newSpreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: newSpreadsheetId,
    });

    // Delete the default "Sheet1" that was created
    const defaultSheet = newSpreadsheet.data.sheets?.find(
      s => s.properties?.title === 'Sheet1'
    );

    if (defaultSheet?.properties?.sheetId) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: newSpreadsheetId,
        requestBody: {
          requests: [{
            deleteSheet: {
              sheetId: defaultSheet.properties.sheetId,
            },
          }],
        },
      });
      console.log('Removed default Sheet1');
    }

    console.log('All sheets copied successfully');
    
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;

    console.log('Spreadsheet provisioning complete!');
    console.log('ID:', newSpreadsheetId);
    console.log('URL:', spreadsheetUrl);

    return {
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl,
      success: true,
    };

  } catch (error: any) {
    console.error('Error provisioning spreadsheet:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Delete a user's spreadsheet
 */
export async function deleteUserSpreadsheet(
  spreadsheetId: string,
  accessToken: string
): Promise<boolean> {
  try {
    const auth = getOAuth2ClientWithToken(accessToken);
    const drive = google.drive({ version: 'v3', auth });
    
    await drive.files.delete({ fileId: spreadsheetId });
    console.log('Deleted spreadsheet:', spreadsheetId);
    return true;
  } catch (error: any) {
    console.error('Error deleting spreadsheet:', error.message);
    return false;
  }
}
