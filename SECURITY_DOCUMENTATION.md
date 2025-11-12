# Security & Data Protection Documentation

## For Google OAuth Verification

Complete answers to Google's security and data protection questions.

---

## 1. OAuth Token Storage & Security

### How do you store OAuth tokens?

**Storage Infrastructure**:
- **Database**: PostgreSQL (hosted on secure cloud platform)
- **Encryption**: AES-256 encryption for tokens at rest
- **Access Control**: Database access restricted to application server only
- **Connection**: SSL/TLS encrypted connections (TLS 1.3)
- **Environment**: Tokens never stored in code, logs, or client-side storage

**Token Types**:
1. **Access Tokens**:
   - Short-lived (1 hour expiry)
   - Encrypted in database
   - Used for API calls to Google Sheets
   - Automatically refreshed when expired

2. **Refresh Tokens**:
   - Long-lived (no expiry unless revoked)
   - Encrypted separately with key rotation
   - Used only to obtain new access tokens
   - Never transmitted to client

**Security Measures**:
```
Database Column: google_access_token
- Type: TEXT (encrypted)
- Encryption: AES-256-GCM
- Key Management: Stored in environment variables (not in code)
- Access: Only backend server can decrypt

Database Column: google_refresh_token
- Type: TEXT (encrypted)
- Encryption: AES-256-GCM
- Key Rotation: Every 90 days
- Revocation: Automatic on account deletion
```

**Token Lifecycle**:
1. User authorizes → Google returns tokens
2. We encrypt and store in database
3. Access token used for API calls
4. When expired, we use refresh token to get new access token
5. On account deletion, both tokens deleted from database
6. User can manually revoke at https://myaccount.google.com/permissions

---

## 2. Data Protection & Privacy

### What user data do you collect and store?

**Data We Store in Our Database**:

1. **Account Information**:
   - Email address (for login and communication)
   - Name (for personalization)
   - Password hash (bcrypt, never plain-text)
   - Account creation date

2. **OAuth Information**:
   - Google access token (encrypted)
   - Google refresh token (encrypted)
   - Token expiry timestamp
   - Spreadsheet ID (unique identifier for user's spreadsheet)
   - Spreadsheet URL (link to user's Google Drive file)

3. **Session Data**:
   - JWT tokens (short-lived, 7 days)
   - Last login timestamp
   - IP address (for security monitoring)

**Data We Do NOT Store**:
- ❌ Financial transaction data (lives in user's Google Spreadsheet, not our database)
- ❌ Bank account numbers
- ❌ Credit card information
- ❌ Social security numbers
- ❌ Unencrypted passwords
- ❌ User's other Google Drive files or metadata

**Where Financial Data Lives**:
- **Location**: User's Google Drive (they own it)
- **Access**: We read/write via Google Sheets API
- **Ownership**: User is the owner, not our app
- **Persistence**: Data remains even if user deletes our app
- **Control**: User can delete, export, or share anytime

---

## 3. Data Encryption

### How do you protect data in transit and at rest?

**In Transit (Network)**:
- All connections use HTTPS/SSL (TLS 1.3)
- API calls to Google: OAuth 2.0 over HTTPS
- Client to server: TLS-encrypted
- No unencrypted HTTP traffic allowed

**At Rest (Storage)**:
- **Database**: Encryption at rest (provider-level encryption)
- **OAuth Tokens**: AES-256-GCM encryption (application-level)
- **Passwords**: bcrypt hashing (industry standard)
- **Environment Variables**: Stored in secure configuration (Vercel secrets, not in code)
- **Backups**: Encrypted backups with 30-day retention

**Key Management**:
- Encryption keys stored in environment variables
- Never committed to code repository
- Rotated every 90 days
- Access restricted to production environment only

---

## 4. Authentication & Authorization

### How do you authenticate users?

**Primary Authentication**:
- **Method**: Email + Password (bcrypt hashed)
- **Session**: JWT tokens with 7-day expiry
- **Storage**: HttpOnly cookies (not accessible to JavaScript)
- **Security**: CSRF protection enabled

**Google OAuth Flow**:
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. User authorizes scopes
4. Google returns authorization code
5. We exchange code for access/refresh tokens
6. Tokens encrypted and stored
7. User authenticated and session created

**API Authorization**:
- Every API request requires valid JWT token
- Token sent in Authorization header: `Bearer <token>`
- Middleware validates token and extracts user ID
- User can only access their own spreadsheet
- Spreadsheet ID verified against database record

**Protection Against**:
- ✅ SQL Injection (parameterized queries via Prisma ORM)
- ✅ XSS (Content Security Policy headers)
- ✅ CSRF (SameSite cookies, CSRF tokens)
- ✅ Brute Force (rate limiting on login endpoints)
- ✅ Session Hijacking (HttpOnly cookies, secure flags)

---

## 5. User Data Rights (GDPR/CCPA Compliance)

### How can users access, export, or delete their data?

**Right to Access**:
- Users can view all account data in app settings
- Users can see their spreadsheet in Google Drive anytime
- We provide transparent access to what we store

**Right to Export**:
- Users can download spreadsheet as Excel, CSV, or PDF from Google Sheets
- We provide account data export via API (if requested)
- No proprietary formats - standard spreadsheet format

**Right to Delete** (Account Deletion):
1. User clicks "Delete Account" in app settings
2. Confirmation modal (to prevent accidents)
3. We immediately delete from our database:
   - User account record
   - OAuth access token (encrypted)
   - OAuth refresh token (encrypted)
   - Spreadsheet ID reference
   - Session tokens
4. We revoke OAuth access with Google
5. We do NOT delete user's spreadsheet (it's in THEIR Drive, they own it)
6. User can separately delete spreadsheet from Drive if desired
7. Database deletion confirmed within 1 hour
8. Backups purged after 30 days

**Right to Rectify**:
- Users can update email, name, password in app settings
- Users can edit financial data directly in spreadsheet
- Changes sync between app and spreadsheet

**Right to Revoke Access**:
- Users can revoke OAuth access at: https://myaccount.google.com/permissions
- Revoking access prevents our app from accessing spreadsheet
- User can re-authorize anytime if they want to restore access

---

## 6. Third-Party Data Sharing

### Do you share user data with third parties?

**NO - We do not share, sell, or rent user data.**

**Third-Party Services We Use**:

1. **Google Sheets & Drive**:
   - Purpose: Store user's financial data in THEIR Google Drive
   - Data Shared: OAuth tokens (for API access)
   - User Control: User explicitly authorizes this in OAuth flow
   - User Ownership: Spreadsheet belongs to user, not shared with us

2. **SendGrid (Email Service)**:
   - Purpose: Send account notifications, password resets
   - Data Shared: Email address only
   - Data NOT Shared: Financial data, passwords, OAuth tokens
   - User Control: Transactional emails only (not marketing)

3. **Firebase Authentication** (optional):
   - Purpose: Alternative authentication method
   - Data Shared: Email, name, authentication tokens
   - Data NOT Shared: Financial data, spreadsheet data

4. **Vercel/Hosting Provider**:
   - Purpose: Host application infrastructure
   - Data Shared: Minimal (encrypted database, environment variables)
   - Compliance: SOC 2, GDPR compliant hosting

**What We Never Share**:
- ❌ Financial transaction data
- ❌ Spreadsheet contents
- ❌ OAuth tokens
- ❌ Passwords (even hashed)
- ❌ Personal financial information
- ❌ User behavior or usage analytics (beyond basic app analytics)

**Marketing/Advertising**:
- We do NOT sell data to advertisers
- We do NOT use data for marketing purposes
- We do NOT share with data brokers
- We do NOT allow third-party tracking scripts

---

## 7. Data Retention Policy

### How long do you retain user data?

**Active Accounts**:
- Account data: Retained while account is active
- OAuth tokens: Refreshed periodically, stored while authorized
- Session data: 7-day expiry (JWT tokens)
- Activity logs: 90 days

**Deleted Accounts**:
- Immediate deletion: Account record, OAuth tokens, session data
- Backup retention: 30 days (for disaster recovery)
- After 30 days: Complete permanent deletion from all systems
- User's spreadsheet: NOT deleted (it's in user's Drive, they control it)

**Inactive Accounts**:
- No automatic deletion
- Users can delete account anytime
- We may send reminder emails after 6 months of inactivity

---

## 8. Security Incident Response

### What happens if there's a security breach?

**Detection**:
- Automated monitoring for unusual activity
- Database access logs
- API rate limit monitoring
- Failed authentication alerts

**Response Plan**:
1. **Immediate** (0-1 hour):
   - Isolate affected systems
   - Stop ongoing breach
   - Preserve logs for investigation

2. **Short-term** (1-24 hours):
   - Assess scope of breach
   - Identify affected users
   - Notify affected users via email
   - Report to authorities if required by law

3. **Long-term** (24-72 hours):
   - Implement security fixes
   - Force password resets if needed
   - Revoke OAuth tokens if compromised
   - Public disclosure if appropriate

**User Notification**:
- Email to affected users within 24 hours
- Transparent explanation of what happened
- Steps users should take (change password, revoke access, etc.)
- Free credit monitoring if sensitive data exposed (if applicable)

**Prevention**:
- Regular security audits
- Dependency updates (automated via Dependabot)
- Penetration testing (annual)
- Security training for developers

---

## 9. Compliance & Certifications

### What regulations do you comply with?

**GDPR (General Data Protection Regulation)**:
- ✅ Right to access
- ✅ Right to rectification
- ✅ Right to erasure ("right to be forgotten")
- ✅ Right to data portability
- ✅ Right to object
- ✅ Privacy by design
- ✅ Data protection impact assessment
- ✅ Transparent privacy policy

**CCPA (California Consumer Privacy Act)**:
- ✅ Right to know what data we collect
- ✅ Right to delete personal information
- ✅ Right to opt-out of data sales (we don't sell data)
- ✅ Right to non-discrimination

**SOC 2 Compliance** (via hosting provider):
- Security controls
- Availability
- Processing integrity
- Confidentiality

**PCI DSS**:
- Not applicable (we don't store credit card data)
- Payment processing handled by third-party (Stripe, if applicable)

---

## 10. Vulnerability Management

### How do you handle security vulnerabilities?

**Dependency Scanning**:
- Automated: Dependabot alerts on GitHub
- Regular: npm audit, Snyk scanning
- Response: Patches applied within 48 hours for critical issues

**Code Security**:
- Static analysis: ESLint security rules
- OWASP Top 10 awareness
- Secure coding practices
- Code reviews for all changes

**API Security**:
- Rate limiting (100 requests/minute per user)
- Input validation (Zod schemas)
- Parameterized queries (no SQL injection)
- CORS restrictions
- JWT token validation

**Vulnerability Disclosure**:
- Security contact: shaunducker1@gmail.com
- Responsible disclosure policy
- Acknowledge reports within 24 hours
- Fix critical issues within 7 days

---

## 11. Access Control

### Who has access to user data?

**Application Access**:
- Only authenticated users can access their own data
- No cross-user data access
- Spreadsheet ID verified for every API call

**Developer Access**:
- Production database: Restricted to senior developers only
- Read-only access for debugging (with user consent)
- All access logged and audited
- No access to decrypted OAuth tokens

**Third-Party Access**:
- Google: Only via OAuth (user explicitly authorizes)
- Hosting provider: Infrastructure only (encrypted data)
- No other third parties have access

**Audit Logs**:
- All database queries logged
- API access logged
- Failed authentication attempts tracked
- Regular security audits

---

## 12. Data Minimization

### Do you collect only necessary data?

**Yes - We follow the principle of least privilege:**

**What We Collect**:
- Email: Required for account and communication
- Name: Required for personalization
- Password: Required for authentication
- OAuth tokens: Required to access Google Sheets
- Spreadsheet ID: Required to identify user's spreadsheet

**What We Do NOT Collect**:
- Social security number
- Bank account numbers
- Credit card details (handled by payment processor if applicable)
- Location data (beyond IP address for security)
- Browsing history
- Device identifiers (beyond standard web analytics)
- Social media profiles
- Phone number (unless user provides for 2FA)

**Financial Data Storage**:
- Stored in USER's Google Drive (not our servers)
- We only store the reference (spreadsheet ID)
- User maintains ownership and control

---

## Summary

**Our Security Philosophy**:
1. **User Owns Their Data**: Financial data stays in user's Google Drive
2. **Encryption Everywhere**: OAuth tokens encrypted, HTTPS/TLS for all traffic
3. **Least Privilege**: Minimal scopes, minimal data collection
4. **Transparency**: Clear privacy policy, user can see what we access
5. **User Control**: Easy to revoke, delete, or export data
6. **Compliance**: GDPR, CCPA, SOC 2 standards
7. **Continuous Improvement**: Regular audits, updates, monitoring

---

**For Questions**:
- **Security Contact**: shaunducker1@gmail.com
- **Privacy Policy**: https://accounting.siamoon.com/privacy
- **Terms of Service**: https://accounting.siamoon.com/terms

**Last Updated**: November 12, 2025
**Document Version**: 1.0
**Prepared For**: Google OAuth Verification Process
