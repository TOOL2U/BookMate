/**
 * Parse Google Service Account credentials from environment variable
 * and fix escaped newlines in private_key
 */
export function parseServiceAccountKey(): any {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set');
  }

  const credentials = JSON.parse(credentialsJson);
  
  // Fix escaped newlines in private_key (\\n -> \n)
  // This is needed because Vercel stores JSON with escaped newlines
  if (credentials.private_key && typeof credentials.private_key === 'string') {
    credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
  }

  return credentials;
}
