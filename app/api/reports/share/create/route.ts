import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import crypto from 'crypto';

/**
 * Create a shareable link for a report
 * 
 * POST /api/reports/share
 * Body: { reportData, aiInsights, expiresInDays?, sharedBy? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reportData, aiInsights, expiresInDays, sharedBy } = body;

    if (!reportData) {
      return NextResponse.json(
        { error: 'Report data is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Generate secure random token
    const shareToken = crypto.randomBytes(12).toString('base64url'); // URL-safe 16 chars

    // Calculate expiration date (default: 30 days)
    const expiryDays = expiresInDays || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    // Create shared report document
    const sharedReport = {
      shareToken,
      reportData,
      aiInsights: aiInsights || null,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      sharedBy: sharedBy || 'BookMate User',
      viewCount: 0,
      isRevoked: false,
      lastViewedAt: null,
    };

    // Save to Firestore
    await db.collection('sharedReports').add(sharedReport);

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/reports/share/${shareToken}`;

    return NextResponse.json({
      ok: true,
      shareToken,
      shareUrl,
      expiresAt: expiresAt.toISOString(),
    });

  } catch (error) {
    console.error('[SHARE API] Error creating share link:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

/**
 * List all shared reports for the current user
 * GET /api/reports/share
 */
export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    
    // TODO: Add authentication and filter by userId
    // For now, return all non-expired, non-revoked shares
    
    const snapshot = await db.collection('sharedReports')
      .where('isRevoked', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const shares = snapshot.docs.map(doc => ({
      id: doc.id,
      shareToken: doc.data().shareToken,
      createdAt: doc.data().createdAt,
      expiresAt: doc.data().expiresAt,
      viewCount: doc.data().viewCount || 0,
      lastViewedAt: doc.data().lastViewedAt,
      sharedBy: doc.data().sharedBy,
      reportPeriod: doc.data().reportData?.period || null,
    }));

    return NextResponse.json({ ok: true, shares });

  } catch (error) {
    console.error('[SHARE API] Error listing shares:', error);
    return NextResponse.json(
      { error: 'Failed to list shares' },
      { status: 500 }
    );
  }
}

/**
 * Revoke a share link
 * DELETE /api/reports/share?token=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    const snapshot = await db.collection('sharedReports')
      .where('shareToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Share not found' },
        { status: 404 }
      );
    }

    // Mark as revoked
    await snapshot.docs[0].ref.update({
      isRevoked: true,
      revokedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, message: 'Share link revoked' });

  } catch (error) {
    console.error('[SHARE API] Error revoking share:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share' },
      { status: 500 }
    );
  }
}
