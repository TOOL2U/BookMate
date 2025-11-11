import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | BookMate',
  description: 'BookMate Terms of Service - Rules and guidelines for using our service',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white shadow-sm rounded-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        
        <p className="text-sm text-gray-600 mb-8">
          <strong>Last Updated:</strong> November 11, 2025
        </p>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using BookMate (the &quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="mb-4">
              BookMate is a financial management platform that helps users:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Track bank balances and financial accounts</li>
              <li>Calculate profit and loss statements</li>
              <li>Generate financial reports</li>
              <li>Manage expense categories</li>
              <li>Sync data with Google Sheets</li>
              <li>Share reports with team members</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.1 Account Creation</h3>
            <p className="mb-4">
              To use BookMate, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Be responsible for all activity under your account</li>
              <li>Notify us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Age Requirement</h3>
            <p>
              You must be at least 18 years old to use BookMate. By using the Service, you represent that you meet this age requirement.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.3 Account Termination</h3>
            <p>
              We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or illegal activity.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. User Responsibilities</h2>
            
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe upon the intellectual property rights of others</li>
              <li>Upload malicious code, viruses, or harmful software</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Impersonate another person or entity</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data and Privacy</h2>
            <p className="mb-4">
              Your use of BookMate is also governed by our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>. By using the Service, you consent to our collection and use of your data as described in the Privacy Policy.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.1 Your Data</h3>
            <p className="mb-4">
              You retain all rights to your financial data. We do not claim ownership of any content you upload or create in BookMate.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Data Accuracy</h3>
            <p>
              You are responsible for the accuracy of data you enter into BookMate. We provide tools to help manage your finances, but we are not responsible for financial decisions based on this data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Payment and Subscriptions</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.1 Free Tier</h3>
            <p>
              BookMate may offer a free tier with limited features. We reserve the right to modify or discontinue the free tier at any time.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Paid Subscriptions (If Applicable)</h3>
            <p className="mb-4">
              If you subscribe to a paid plan:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Fees are charged in advance on a recurring basis</li>
              <li>All fees are non-refundable except as required by law</li>
              <li>You can cancel your subscription at any time</li>
              <li>Cancellation takes effect at the end of the current billing period</li>
              <li>We reserve the right to change pricing with 30 days notice</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.1 Our Property</h3>
            <p className="mb-4">
              BookMate and its original content, features, and functionality are owned by Siamoon/BookMate and are protected by:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Copyright</li>
              <li>Trademark</li>
              <li>Patent</li>
              <li>Trade secret</li>
              <li>Other intellectual property laws</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">7.2 License to Use</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable license to use BookMate for your personal or business financial management. This license does not include the right to resell or commercially exploit the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Third-Party Services</h2>
            <p className="mb-4">
              BookMate integrates with third-party services like Google Sheets and Firebase. Your use of these services is subject to their respective terms and conditions. We are not responsible for the actions of third-party service providers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Disclaimers and Limitations</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.1 No Financial Advice</h3>
            <p>
              BookMate is a financial management tool, NOT a financial advisor. We do not provide financial, investment, tax, or legal advice. Consult with qualified professionals for financial decisions.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.2 Service Availability</h3>
            <p>
              We strive to keep BookMate available 24/7, but we do not guarantee uninterrupted access. The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">9.3 Limitation of Liability</h3>
            <p className="mb-4">
              To the maximum extent permitted by law, BookMate and its affiliates shall not be liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Indirect, incidental, or consequential damages</li>
              <li>Loss of profits, revenue, or data</li>
              <li>Service interruptions or errors</li>
              <li>Financial losses resulting from use of the Service</li>
              <li>Unauthorized access to your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless BookMate, its affiliates, and employees from any claims, damages, losses, or expenses (including legal fees) arising from your use of the Service or violation of these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Modifications to Service and Terms</h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.1 Service Changes</h3>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">11.2 Terms Updates</h3>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes via email or app notification. Your continued use after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Termination</h2>
            <p className="mb-4">
              Either party may terminate this agreement at any time:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>You:</strong> Delete your account through the app settings</li>
              <li><strong>Us:</strong> Terminate or suspend your access if you violate these Terms</li>
            </ul>
            <p className="mt-4">
              Upon termination, your right to use the Service immediately ceases. We may delete your data after 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction where Siamoon operates, without regard to conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Dispute Resolution</h2>
            <p className="mb-4">
              For any disputes arising from these Terms:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>First, contact us at support@siamoon.com to resolve informally</li>
              <li>If unresolved, disputes will be settled through binding arbitration</li>
              <li>You waive the right to participate in class action lawsuits</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Severability</h2>
            <p>
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Information</h2>
            <p className="mb-4">For questions about these Terms of Service, contact us:</p>
            
            <div className="bg-gray-50 p-6 rounded-lg">
              <p><strong>Email:</strong> <a href="mailto:support@siamoon.com" className="text-blue-600 hover:underline">support@siamoon.com</a></p>
              <p className="mt-2"><strong>Business Name:</strong> Siamoon / BookMate</p>
              <p className="mt-2"><strong>Response Time:</strong> We aim to respond within 48 hours</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            These Terms of Service are effective as of November 11, 2025
          </p>
        </div>
      </div>
    </div>
  );
}
