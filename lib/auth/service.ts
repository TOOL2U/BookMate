/**
 * Authentication Service
 * Handles user registration, login, and session management
 */

import prisma from '@/lib/prisma';
import { getAdminAuth } from '@/lib/firebase/admin';
import { hashPassword, verifyPassword, validatePasswordStrength } from './password';
import { generateTokenPair, verifyToken as verifyJWT, type TokenPayload } from './tokens';

// Type inference from Prisma
type User = {
  id: string;
  firebaseUid: string | null;
  email: string;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
  phone: string | null;
  passwordHash: string | null;
  provider: string;
  status: string;
  role: string;
  workspaceId: string | null;
  organizationId: string | null;
  lastLoginAt: Date | null;
  lastLoginIp: string | null;
  loginCount: number;
  failedLoginCount: number;
  lockedUntil: Date | null;
  preferences: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export interface RegisterData {
  email: string;
  password: string;
  name?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterData): Promise<AuthResult> {
  const { email, password, name, phone } = data;

  // Validate email
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  // Validate password strength
  const passwordErrors = validatePasswordStrength(password);
  if (passwordErrors.length > 0) {
    throw new Error(passwordErrors[0]);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create Firebase user (optional - for mobile app auth)
  let firebaseUid: string | undefined;
  try {
    const firebaseUser = await getAdminAuth().createUser({
      email: email.toLowerCase(),
      password,
      displayName: name,
      phoneNumber: phone,
    });
    firebaseUid = firebaseUser.uid;
  } catch (error) {
    console.error('Failed to create Firebase user:', error);
    // Continue without Firebase - not critical for web app
  }

  // Create user in database
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      phone,
      firebaseUid,
      provider: 'email',
      emailVerified: false,
      status: 'active',
      role: 'user',
      loginCount: 0,
      failedLoginCount: 0,
    }
  });

  // Automatically provision spreadsheet using service account (no OAuth needed!)
  console.log('📊 Auto-provisioning spreadsheet for new user...');
  try {
    const { provisionUserSpreadsheetAuto } = await import('@/lib/services/spreadsheet-provisioning');
    
    const result = await provisionUserSpreadsheetAuto(
      user.id,
      user.email,
      name || user.email
    );

    if (result.success && result.spreadsheetId) {
      // Update user with spreadsheet info
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          spreadsheetId: result.spreadsheetId,
          spreadsheetUrl: result.spreadsheetUrl,
          spreadsheetCreatedAt: new Date(),
        },
      });
      // Update the user object with the new data
      Object.assign(user, updatedUser);
      console.log('✅ Spreadsheet auto-created:', result.spreadsheetId);
    } else {
      console.error('⚠️  Failed to auto-create spreadsheet:', result.error);
      // Continue registration anyway - user can retry later
    }
  } catch (error) {
    console.error('⚠️  Error auto-provisioning spreadsheet:', error);
    // Continue registration anyway - user can retry later
  }

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId || undefined,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
  });

  // Log the registration
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'register',
      resource: 'users',
      resourceId: user.id,
      success: true,
    }
  });

  // Remove sensitive data
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens
  };
}

/**
 * Login a user
 */
export async function loginUser(
  data: LoginData,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<AuthResult> {
  const { email, password } = data;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Check if account is locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw new Error(`Account is locked. Try again in ${remainingMinutes} minutes.`);
  }

  // Check if account is suspended
  if (user.status === 'suspended') {
    throw new Error('Account has been suspended. Please contact support.');
  }

  if (user.status === 'deleted') {
    throw new Error('Account not found.');
  }

  // Verify password
  if (!user.passwordHash) {
    throw new Error('Please use social login for this account');
  }

  const isValid = await verifyPassword(password, user.passwordHash);

  if (!isValid) {
    // Increment failed login count
    const failedCount = user.failedLoginCount + 1;
    const updates: any = {
      failedLoginCount: failedCount,
    };

    // Lock account after 5 failed attempts
    if (failedCount >= 5) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updates
    });

    // Log failed login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'login',
        resource: 'users',
        resourceId: user.id,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
        success: false,
        errorMessage: 'Invalid password',
      }
    });

    throw new Error('Invalid email or password');
  }

  // Reset failed login count and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
      loginCount: user.loginCount + 1,
      lastLoginAt: new Date(),
      lastLoginIp: metadata?.ipAddress,
    }
  });

  // Generate tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId || undefined,
  });

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
  });

  // Create session
  await prisma.session.create({
    data: {
      userId: user.id,
      token: tokens.accessToken,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
    }
  });

  // Log successful login
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'login',
      resource: 'users',
      resourceId: user.id,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      success: true,
    }
  });

  // Remove sensitive data
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResult> {
  // Verify refresh token
  let payload: TokenPayload;
  try {
    payload = verifyJWT(refreshToken);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }

  if (payload.type !== 'refresh') {
    throw new Error('Invalid token type');
  }

  // Check if refresh token exists and is not revoked
  const tokenRecord = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
    include: { user: true }
  });

  if (!tokenRecord) {
    throw new Error('Refresh token not found');
  }

  if (tokenRecord.revoked) {
    throw new Error('Refresh token has been revoked');
  }

  if (tokenRecord.expiresAt < new Date()) {
    throw new Error('Refresh token has expired');
  }

  const user = tokenRecord.user;

  // Generate new tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
    workspaceId: user.workspaceId || undefined,
  });

  // Store new refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    }
  });

  // Revoke old refresh token
  await prisma.refreshToken.update({
    where: { id: tokenRecord.id },
    data: {
      revoked: true,
      revokedAt: new Date(),
    }
  });

  // Remove sensitive data
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    tokens
  };
}

/**
 * Logout user
 */
export async function logoutUser(userId: string, refreshToken?: string): Promise<void> {
  // Revoke refresh token if provided
  if (refreshToken) {
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
      }
    });
  }

  // Delete all sessions for this user
  await prisma.session.deleteMany({
    where: { userId }
  });

  // Log logout
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'logout',
      resource: 'users',
      resourceId: userId,
      success: true,
    }
  });
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return null;

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Verify user session
 */
export async function verifySession(accessToken: string): Promise<Omit<User, 'passwordHash'> | null> {
  try {
    const payload = verifyJWT(accessToken);
    
    if (payload.type !== 'access') {
      return null;
    }

    const user = await getUserById(payload.userId);
    
    if (!user || user.status !== 'active') {
      return null;
    }

    // Update session activity
    await prisma.session.updateMany({
      where: {
        userId: user.id,
        token: accessToken,
      },
      data: {
        lastActivityAt: new Date(),
      }
    });

    return user;
  } catch {
    return null;
  }
}
