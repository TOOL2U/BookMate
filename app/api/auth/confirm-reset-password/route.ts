import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';
import prisma from '@/lib/prisma';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';

/**
 * Confirm Password Reset API
 * 
 * After user clicks Firebase reset link and sets new password,
 * this endpoint updates BOTH Firebase AND Prisma database.
 * 
 * POST /api/auth/confirm-reset-password
 * Body: { "email": "user@example.com", "newPassword": "NewPass123!" }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, newPassword } = await req.json();

    // Validate inputs
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return NextResponse.json(
        { error: passwordErrors[0] },
        { status: 400 }
      );
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update Firebase password (if user has Firebase UID)
    if (user.firebaseUid) {
      try {
        const auth = getAdminAuth();
        await auth.updateUser(user.firebaseUid, {
          password: newPassword,
        });
        console.log('✅ Firebase password updated for:', email);
      } catch (fbError: any) {
        console.error('Firebase password update failed:', fbError);
        // Continue anyway - database is source of truth for web app
      }
    }

    // Update Prisma database password
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        failedLoginCount: 0,
        lockedUntil: null,
        status: 'active',
      }
    });

    console.log('✅ Prisma password updated for:', email);

    // Revoke all existing sessions (force re-login)
    await prisma.refreshToken.updateMany({
      where: { userId: user.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
      }
    });

    await prisma.session.deleteMany({
      where: { userId: user.id }
    });

    // Log the password reset
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'password_reset',
        resource: 'users',
        resourceId: user.id,
        success: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please login with your new password.'
    });

  } catch (error: any) {
    console.error('Password reset confirmation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to reset password',
        message: error.message
      },
      { status: 500 }
    );
  }
}
