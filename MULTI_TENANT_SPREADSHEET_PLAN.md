# 📊 Multi-Tenant Spreadsheet Provisioning System

**Date**: November 12, 2025  
**Status**: Implementation Plan  
**Goal**: Auto-create personalized Google Sheets for each new user

---

## 🎯 Overview

When a user creates an account, automatically:
1. ✅ Copy the master template spreadsheet
2. ✅ Set up all Apps Script with their specific data
3. ✅ Configure permissions (only that user can access)
4. ✅ Store the spreadsheet ID in the user's database record
5. ✅ Keep original spreadsheet (Shaun's) completely isolated

---

## 📋 Master Template Details

**Template Spreadsheet**:
- **ID**: `1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8`
- **Name**: "BookMate Spreadsheet Template"
- **URL**: https://docs.google.com/spreadsheets/d/1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8/edit
- **Purpose**: Clean template with all sheets, formulas, and structure (NO user data)

**Original Spreadsheet** (Shaun's - PROTECTED):
- **ID**: `1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8`
- **Name**: "BookMate P&L 2025"
- **Owner**: shaun@siamoon.com
- **Purpose**: Production data - NEVER modify this

---

## 🗄️ Database Changes Needed

### 1. Update User Model
Add field to store each user's spreadsheet ID:

```prisma
model User {
  id                String    @id @default(uuid())
  firebaseUid       String?   @unique @map("firebase_uid")
  
  // ... existing fields ...
  
  // Google Sheets Integration
  spreadsheetId     String?   @unique @map("spreadsheet_id") // User's personal spreadsheet
  spreadsheetUrl    String?   @map("spreadsheet_url")        // Direct link to their sheet
  spreadsheetCreatedAt DateTime? @map("spreadsheet_created_at")
  
  // ... rest of fields ...
}
```

### 2. Migration Command
```bash
npx prisma migrate dev --name add_user_spreadsheet
```

---

## 🔧 Implementation Steps

### Phase 1: Update Database Schema ✅
**Time**: 5 minutes

1. Add `spreadsheetId` field to User model
2. Run migration
3. Update Prisma client

### Phase 2: Create Spreadsheet Service 🔨
**Time**: 2 hours

Create: `lib/services/spreadsheet-provisioning.ts`

**Features**:
- Copy master template
- Rename to user's name
- Set permissions (only user can access)
- Deploy Apps Script with user-specific config
- Return spreadsheet ID and URL

### Phase 3: Update Registration Flow 🔨
**Time**: 1 hour

Modify: `app/api/auth/register/route.ts`

**Flow**:
1. Create user account
2. Create Firebase user
3. **NEW**: Create user's spreadsheet
4. Store spreadsheet ID in database
5. Return success

### Phase 4: Create Management API 🔨
**Time**: 1 hour

Create: `app/api/spreadsheet/provision/route.ts`

**Endpoints**:
- `POST /api/spreadsheet/provision` - Manually create spreadsheet for existing user
- `GET /api/spreadsheet/status/:userId` - Check if user has spreadsheet
- `DELETE /api/spreadsheet/:userId` - Remove spreadsheet (admin only)

### Phase 5: Update API Routes 🔨
**Time**: 2 hours

**Current Issue**: All APIs use `process.env.GOOGLE_SHEET_ID` (hardcoded to Shaun's sheet)

**Solution**: Get spreadsheet ID from authenticated user

**Files to Update**:
- `app/api/pnl/**` - All P&L endpoints
- `app/api/balance/**` - Balance endpoints  
- `app/api/categories/**` - Category endpoints
- `app/api/transfers/**` - Transfer endpoints

**Pattern**:
```typescript
// OLD:
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

// NEW:
const user = await getCurrentUser(request); // Get from JWT token
const spreadsheetId = user.spreadsheetId;

if (!spreadsheetId) {
  return NextResponse.json(
    { error: 'No spreadsheet configured for this user' },
    { status: 404 }
  );
}
```

### Phase 6: Authentication Middleware 🔨
**Time**: 1 hour

Create: `lib/middleware/auth.ts`

**Purpose**: Extract user from JWT token and attach to request

```typescript
export async function getCurrentUser(request: Request): Promise<User> {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new Error('Unauthorized');
  }
  
  const decoded = verifyJWT(token);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });
  
  if (!user) {
    throw new Error('User not found');
  }
  
  return user;
}
```

---

## 📝 Implementation Code

### 1. Database Schema Update

```prisma
// prisma/schema.prisma

model User {
  id                String    @id @default(uuid())
  firebaseUid       String?   @unique @map("firebase_uid")
  
  // Profile Information
  email             String    @unique
  emailVerified     Boolean   @default(false) @map("email_verified")
  name              String?
  avatarUrl         String?   @map("avatar_url")
  phone             String?
  
  // Authentication
  passwordHash      String?   @map("password_hash")
  provider          String    @default("email")
  
  // Account Status
  status            String    @default("active")
  role              String    @default("user")
  
  // Google Sheets Integration - NEW
  spreadsheetId     String?   @unique @map("spreadsheet_id")
  spreadsheetUrl    String?   @map("spreadsheet_url")
  spreadsheetCreatedAt DateTime? @map("spreadsheet_created_at")
  
  // Workspace & Organization
  workspaceId       String?   @map("workspace_id")
  organizationId    String?   @map("organization_id")
  
  // Security
  lastLoginAt       DateTime? @map("last_login_at")
  lastLoginIp       String?   @map("last_login_ip")
  loginCount        Int       @default(0) @map("login_count")
  failedLoginCount  Int       @default(0) @map("failed_login_count")
  lockedUntil       DateTime? @map("locked_until")
  
  // Preferences
  preferences       Json      @default("{}")
  
  // Metadata
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  deletedAt         DateTime? @map("deleted_at")
  
  // Relations
  sessions          Session[]
  refreshTokens     RefreshToken[]
  auditLogs         AuditLog[]
  
  // Indexes
  @@index([email])
  @@index([firebaseUid])
  @@index([spreadsheetId])
  @@index([workspaceId])
  @@index([status])
  @@index([role])
  @@map("users")
}
```

---

### 2. Spreadsheet Provisioning Service

```typescript
// lib/services/spreadsheet-provisioning.ts

import { google } from 'googleapis';
import { getGoogleAuth } from '@/utils/google-auth';

const MASTER_TEMPLATE_ID = '1XkpAnGc0_gCctGkDmANkR068TjicEeQ1xHgREQqc3F8';

interface ProvisionResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  success: boolean;
  error?: string;
}

/**
 * Create a new spreadsheet for a user by copying the master template
 */
export async function provisionUserSpreadsheet(
  userId: string,
  userEmail: string,
  userName: string
): Promise<ProvisionResult> {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Copy the master template
    console.log(`📋 Copying master template for user: ${userEmail}`);
    
    const copyResponse = await drive.files.copy({
      fileId: MASTER_TEMPLATE_ID,
      requestBody: {
        name: `BookMate - ${userName || userEmail}`,
        description: `Personal BookMate spreadsheet for ${userEmail}`,
      },
    });

    const newSpreadsheetId = copyResponse.data.id;
    
    if (!newSpreadsheetId) {
      throw new Error('Failed to create spreadsheet copy');
    }

    console.log(`✅ Spreadsheet created: ${newSpreadsheetId}`);

    // 2. Set permissions - Only the user can access
    console.log(`🔐 Setting permissions for ${userEmail}...`);
    
    // Remove public access (if template was shared)
    try {
      await drive.permissions.delete({
        fileId: newSpreadsheetId,
        permissionId: 'anyoneWithLink',
      });
    } catch (error) {
      // Permission might not exist, that's okay
      console.log('No public permission to remove');
    }

    // Grant edit access to the user
    await drive.permissions.create({
      fileId: newSpreadsheetId,
      requestBody: {
        type: 'user',
        role: 'writer', // Can edit
        emailAddress: userEmail,
      },
      sendNotificationEmail: true, // Send email to user
      emailMessage: `Welcome to BookMate! Your personal accounting spreadsheet has been created.`,
    });

    // Grant view access to service account (for API access)
    const serviceAccountEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    if (serviceAccountEmail) {
      await drive.permissions.create({
        fileId: newSpreadsheetId,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: serviceAccountEmail,
        },
      });
    }

    console.log(`✅ Permissions set successfully`);

    // 3. Update spreadsheet metadata (optional - add user info)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: newSpreadsheetId,
      requestBody: {
        requests: [
          {
            updateSpreadsheetProperties: {
              properties: {
                title: `BookMate - ${userName || userEmail}`,
              },
              fields: 'title',
            },
          },
        ],
      },
    });

    // 4. Initialize data (optional - add welcome message or initial data)
    // This can be done via Apps Script deployment (Phase 2)

    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${newSpreadsheetId}/edit`;

    console.log(`🎉 Spreadsheet provisioned successfully for ${userEmail}`);
    console.log(`📊 URL: ${spreadsheetUrl}`);

    return {
      spreadsheetId: newSpreadsheetId,
      spreadsheetUrl,
      success: true,
    };
  } catch (error) {
    console.error('❌ Error provisioning spreadsheet:', error);
    return {
      spreadsheetId: '',
      spreadsheetUrl: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a user's spreadsheet (admin only)
 */
export async function deleteUserSpreadsheet(spreadsheetId: string): Promise<boolean> {
  try {
    const auth = await getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    await drive.files.delete({
      fileId: spreadsheetId,
    });

    console.log(`🗑️ Spreadsheet deleted: ${spreadsheetId}`);
    return true;
  } catch (error) {
    console.error('❌ Error deleting spreadsheet:', error);
    return false;
  }
}

/**
 * Check if a spreadsheet exists and is accessible
 */
export async function checkSpreadsheetAccess(spreadsheetId: string): Promise<boolean> {
  try {
    const auth = await getGoogleAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.get({
      spreadsheetId,
    });

    return true;
  } catch (error) {
    console.error('❌ Spreadsheet not accessible:', error);
    return false;
  }
}
```

---

### 3. Update Registration Flow

```typescript
// app/api/auth/register/route.ts

import { provisionUserSpreadsheet } from '@/lib/services/spreadsheet-provisioning';

// ... existing imports ...

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // 1. Register user (existing code)
    const result = await registerUser({
      email: validated.email,
      password: validated.password,
      name: validated.name,
      phone: validated.phone,
    });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error || 'Registration failed' },
        { status: 400 }
      );
    }

    // 2. Provision spreadsheet for new user
    console.log(`📊 Provisioning spreadsheet for ${validated.email}...`);
    
    const spreadsheetResult = await provisionUserSpreadsheet(
      result.user.id,
      validated.email,
      validated.name || validated.email.split('@')[0]
    );

    // 3. Update user record with spreadsheet info
    if (spreadsheetResult.success) {
      await prisma.user.update({
        where: { id: result.user.id },
        data: {
          spreadsheetId: spreadsheetResult.spreadsheetId,
          spreadsheetUrl: spreadsheetResult.spreadsheetUrl,
          spreadsheetCreatedAt: new Date(),
        },
      });

      console.log(`✅ Spreadsheet linked to user ${validated.email}`);
    } else {
      console.error(`⚠️ Failed to provision spreadsheet for ${validated.email}:`, spreadsheetResult.error);
      // Don't fail registration, user can provision later
    }

    // 4. Return success (existing code)
    return NextResponse.json({
      success: true,
      user: result.user,
      tokens: result.tokens,
      spreadsheet: spreadsheetResult.success ? {
        id: spreadsheetResult.spreadsheetId,
        url: spreadsheetResult.spreadsheetUrl,
      } : null,
    }, { status: 201 });

  } catch (error) {
    // ... existing error handling ...
  }
}
```

---

### 4. Get Current User Middleware

```typescript
// lib/middleware/auth.ts

import { NextRequest } from 'next/server';
import { verifyJWT } from '@/lib/auth/tokens';
import { prisma } from '@/lib/prisma';
import type { User } from '@prisma/client';

/**
 * Extract and verify JWT token from request, return authenticated user
 */
export async function getCurrentUser(request: NextRequest): Promise<User> {
  // Get token from Authorization header
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authorization token provided');
  }

  const token = authHeader.replace('Bearer ', '');

  // Verify JWT token
  const decoded = await verifyJWT(token);
  
  if (!decoded || !decoded.userId) {
    throw new Error('Invalid token');
  }

  // Fetch user from database
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'active') {
    throw new Error('User account is not active');
  }

  return user;
}

/**
 * Get user's spreadsheet ID or throw error
 */
export async function getUserSpreadsheetId(request: NextRequest): Promise<string> {
  const user = await getCurrentUser(request);
  
  if (!user.spreadsheetId) {
    throw new Error('No spreadsheet configured for this user');
  }

  return user.spreadsheetId;
}
```

---

### 5. Update API Routes Pattern

```typescript
// Example: app/api/pnl/route.ts

import { getCurrentUser } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and their spreadsheet
    const user = await getCurrentUser(request);
    const spreadsheetId = user.spreadsheetId;

    if (!spreadsheetId) {
      return NextResponse.json(
        { error: 'No spreadsheet configured. Please contact support.' },
        { status: 404 }
      );
    }

    // Use user's spreadsheet ID instead of env variable
    const data = await fetchPnLData(spreadsheetId);

    return NextResponse.json(data);
  } catch (error) {
    if (error.message.includes('authorization') || error.message.includes('token')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🔐 Security Considerations

### 1. Spreadsheet Isolation
- ✅ Each user gets their own spreadsheet
- ✅ No user can access another user's data
- ✅ Service account has access to all (for API operations)
- ✅ Original spreadsheet (Shaun's) is never touched

### 2. Permission Model
```
User Spreadsheet:
  - Owner: Google Service Account
  - Editor: User (their email)
  - Editor: Service Account (for API access)
  - No public access
```

### 3. Database Security
- ✅ Spreadsheet ID is unique per user
- ✅ Cannot be changed by user (only admin)
- ✅ Validated on every API request

---

## 📊 Testing Plan

### 1. Manual Testing
```bash
# 1. Create test user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'

# 2. Check database - verify spreadsheet ID exists
psql bookmate_dev -c "SELECT id, email, spreadsheet_id, spreadsheet_url FROM users WHERE email = 'test@example.com';"

# 3. Check Google Drive - verify spreadsheet was created
# Visit the spreadsheet_url from database

# 4. Test API with user's token
curl http://localhost:3000/api/pnl \
  -H "Authorization: Bearer {ACCESS_TOKEN}"

# 5. Verify data is isolated
# Create another test user, verify they get different spreadsheet
```

### 2. Automated Tests
- [ ] Test spreadsheet provisioning
- [ ] Test permission setting
- [ ] Test API isolation (user A cannot access user B's data)
- [ ] Test fallback if spreadsheet creation fails

---

## ⚠️ Important Notes

### Shaun's Account Protection
```typescript
// Ensure Shaun's account always uses original spreadsheet
const SHAUN_EMAIL = 'shaun@siamoon.com';
const SHAUN_SPREADSHEET_ID = '1UnCopzurl27VRqVDSIgrro5KyAfuP9T0GRePrtljAR8';

// In registration:
if (email === SHAUN_EMAIL) {
  // Link to existing spreadsheet, don't create new one
  await prisma.user.update({
    where: { email: SHAUN_EMAIL },
    data: {
      spreadsheetId: SHAUN_SPREADSHEET_ID,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SHAUN_SPREADSHEET_ID}/edit`,
    },
  });
}
```

### Master Template Preparation
1. ✅ Create clean template (no data)
2. ✅ Include all sheets (P&L, Transfers, Balance, etc.)
3. ✅ Include all formulas and structure
4. ✅ Include Apps Script (will need separate deployment per user - Phase 2)
5. ✅ Set template as "View only" for safety

---

## 📅 Implementation Timeline

### Day 1: Database & Service (4 hours)
- [ ] Update database schema
- [ ] Create spreadsheet provisioning service
- [ ] Test spreadsheet creation manually

### Day 2: Registration Flow (3 hours)
- [ ] Update registration endpoint
- [ ] Add middleware for user authentication
- [ ] Test end-to-end registration with spreadsheet

### Day 3: Update API Routes (4 hours)
- [ ] Update all P&L endpoints
- [ ] Update all category endpoints
- [ ] Update balance endpoints
- [ ] Update transfer endpoints

### Day 4: Testing & Refinement (3 hours)
- [ ] Test with multiple users
- [ ] Verify data isolation
- [ ] Test permission model
- [ ] Add error handling

### Day 5: Apps Script Deployment (Advanced - Optional)
- [ ] Research Apps Script deployment API
- [ ] Deploy custom Apps Script per user
- [ ] Configure Apps Script with user-specific webhook URLs

**Total**: 14-18 hours (2-3 days)

---

## 🎯 Success Criteria

- ✅ Each new user gets their own spreadsheet
- ✅ Spreadsheet is named with user's name/email
- ✅ Only user (+ service account) can access their spreadsheet
- ✅ All API routes use user's spreadsheet (not Shaun's)
- ✅ Shaun's original spreadsheet is untouched
- ✅ Data is completely isolated between users
- ✅ System is production-ready and scalable

---

## 🚀 Next Steps

1. **Review this plan** - Confirm approach
2. **Update database schema** - Add spreadsheet fields
3. **Create provisioning service** - Build the core logic
4. **Test with test account** - Verify it works
5. **Update all API routes** - Make multi-tenant
6. **Deploy to production** - Roll out feature

---

**Created**: November 12, 2025  
**Status**: Ready for implementation  
**Estimated Time**: 2-3 days  
**Priority**: High (enables multi-user system)
