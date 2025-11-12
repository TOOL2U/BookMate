import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | BookMate',
  description: 'BookMate Privacy Policy - How we handle your financial data',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 11, 2025
        </p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to BookMate (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and web services (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By using BookMate, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, and password when you create an account</li>
              <li><strong>Financial Data:</strong> Bank balances, transactions, profit & loss information, and expense categories that you manually enter or upload</li>
              <li><strong>Business Information:</strong> Business name, property details, and team member information</li>
              <li><strong>Communication Data:</strong> Messages you send to our support team</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Device Information:</strong> Device type, operating system, and unique device identifiers</li>
              <li><strong>Usage Data:</strong> How you interact with the app, features used, and session duration</li>
              <li><strong>Log Data:</strong> IP address, browser type, and timestamps of requests</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Sheets:</strong> If you connect your Google account, we access spreadsheet data you authorize</li>
              <li><strong>Firebase Authentication:</strong> Authentication tokens and profile information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the collected information for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Providing and maintaining the BookMate Service</li>
              <li>Calculating balances, generating financial reports, and tracking expenses</li>
              <li>Syncing your data with Google Sheets (if authorized)</li>
              <li>Sending you reports, notifications, and important updates</li>
              <li>Improving our app features and user experience</li>
              <li>Detecting and preventing fraud or security issues</li>
              <li>Complying with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3.5 Google Services Integration</h2>
            <p className="mb-4">
              BookMate integrates with Google Sheets and Google Drive to provide accounting functionality. 
              Here&apos;s exactly how we use Google APIs:
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">What We Access</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Sheets API:</strong> We create and manage a personal accounting spreadsheet in your Google Drive</li>
              <li><strong>Google Drive API:</strong> We access only the spreadsheet we create for you (using drive.file scope)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Why We Need This Access</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>To create your personal accounting spreadsheet during registration</li>
              <li>To read and write your financial transactions to the spreadsheet</li>
              <li>To generate reports and analytics based on your data</li>
              <li>To keep your data synchronized between the app and spreadsheet</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">What We Do NOT Do</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>❌ We do NOT access other files in your Google Drive</li>
              <li>❌ We do NOT share your spreadsheet with anyone else</li>
              <li>❌ We do NOT read your personal or private files</li>
              <li>❌ We do NOT use your Google data for advertising</li>
              <li>❌ We ONLY access the single spreadsheet we create for BookMate</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">Your Ownership and Control</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>✅ YOU own the spreadsheet (it lives in YOUR Google Drive)</li>
              <li>✅ YOU can view and edit the spreadsheet directly in Google Sheets</li>
              <li>✅ YOU can revoke our access anytime at <a href="https://myaccount.google.com/permissions" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Google Account Permissions</a></li>
              <li>✅ YOU can delete the spreadsheet anytime</li>
              <li>✅ YOU can export your data anytime</li>
            </ul>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h4 className="font-semibold text-blue-900 mb-2">🔒 Google OAuth Security</h4>
              <p className="text-blue-800 text-sm">
                We use OAuth 2.0 (Google&apos;s recommended authorization protocol) to access your spreadsheet. 
                This means we never see your Google password, and you can revoke our access at any time without 
                affecting your Google account or other apps.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">OAuth Token Storage</h3>
            <p className="mb-4">
              When you authorize BookMate to access Google Sheets, we store:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access Token:</strong> Stored encrypted in our database, expires after 1 hour</li>
              <li><strong>Refresh Token:</strong> Stored encrypted in our database, used to renew access</li>
              <li><strong>Spreadsheet ID:</strong> The identifier of your personal accounting spreadsheet</li>
            </ul>
            <p className="mt-4 text-sm text-gray-600">
              These tokens are encrypted at rest and in transit. If you revoke access via Google Account settings, 
              these tokens become invalid immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.1 Where We Store Data</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Firebase (Google Cloud):</strong> User authentication and primary database</li>
              <li><strong>Google Sheets:</strong> Financial data storage (if you enable this feature)</li>
              <li><strong>Vercel:</strong> Web application hosting and API services</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">4.2 Security Measures</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>All data transmitted is encrypted using HTTPS/TLS</li>
              <li>Passwords are hashed using industry-standard algorithms</li>
              <li>API authentication using secure tokens</li>
              <li>Regular security audits and monitoring</li>
              <li>Limited employee access to user data</li>
            </ul>

            <p className="mt-4">
              However, no method of transmission over the Internet is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do NOT sell your personal or financial data. We may share information in these limited circumstances:</p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>With Your Consent:</strong> When you authorize integration with Google Sheets or other services</li>
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate (Firebase, Vercel, SendGrid for emails)</li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or government regulation</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale</li>
              <li><strong>Protection:</strong> To protect the rights, property, or safety of BookMate, our users, or others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
            <p className="mb-4">You have the following rights regarding your data:</p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and data</li>
              <li><strong>Export:</strong> Download your financial data at any time</li>
              <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails (transactional emails may still be sent)</li>
              <li><strong>Disconnect:</strong> Revoke Google Sheets access at any time</li>
            </ul>

            <p className="mt-4">
              To exercise these rights, contact us at <a href="mailto:support@siamoon.com" className="text-blue-600 hover:underline">support@siamoon.com</a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. If you delete your account, we will delete or anonymize your data within 30 days, except where we&apos;re required to retain it for legal, regulatory, or security purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Children&apos;s Privacy</h2>
            <p>
              BookMate is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using BookMate, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Services</h2>
            <p className="mb-4">BookMate integrates with the following third-party services:</p>
            
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Firebase/Google Cloud:</strong> <a href="https://firebase.google.com/support/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Google Sheets:</strong> <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>Vercel:</strong> <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
              <li><strong>SendGrid:</strong> <a href="https://www.twilio.com/legal/privacy" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a></li>
            </ul>

            <p className="mt-4">
              These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email or through a notice in the app. Your continued use of BookMate after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="mb-4">If you have questions or concerns about this Privacy Policy or our data practices, please contact us:</p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p><strong>Email:</strong> <a href="mailto:support@siamoon.com" className="text-blue-600 hover:underline">support@siamoon.com</a></p>
              <p className="mt-2"><strong>Business Name:</strong> Siamoon / BookMate</p>
              <p className="mt-2"><strong>Response Time:</strong> We aim to respond within 48 hours</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This Privacy Policy is effective as of November 11, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
