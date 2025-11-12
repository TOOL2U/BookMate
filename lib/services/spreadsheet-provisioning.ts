/**
 * Spreadsheet Provisioning Service
 * Creates and configures personalized Google Spreadsheets for users using OAuth 2.0
 */

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const MASTER_TEMPLATE_ID = '1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8';

export interface ProvisionResult {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  success: boolean;
  error?: string;
}

/**
 * Get OAuth2 client with user's access token
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
 * Provision a new spreadsheet for a user using their OAuth access token
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
