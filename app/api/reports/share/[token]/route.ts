import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json(
        { error: 'Share token is required' },
        { status: 400 }
      );
    }

    // Get Firestore instance
    const db = getAdminDb();

    // Query Firestore for the shared report
    const reportsRef = db.collection('sharedReports');
    const snapshot = await reportsRef.where('shareToken', '==', token).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Report not found or link has expired' },
        { status: 404 }
      );
    }

    const reportDoc = snapshot.docs[0];
    const reportData = reportDoc.data();

    // Check if expired
    if (reportData.expiresAt && new Date(reportData.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'This share link has expired' },
        { status: 410 } // Gone
      );
    }

    // Check if revoked
    if (reportData.isRevoked) {
      return NextResponse.json(
        { error: 'This share link has been revoked' },
        { status: 403 }
      );
    }

    // Increment view count
    await reportDoc.ref.update({
      viewCount: (reportData.viewCount || 0) + 1,
      lastViewedAt: new Date().toISOString(),
    });

    // Return report data (without sensitive fields)
    return NextResponse.json({
      reportData: reportData.reportData,
      aiInsights: reportData.aiInsights || null,
      createdAt: reportData.createdAt,
      sharedBy: reportData.sharedBy || 'BookMate User',
    });

  } catch (error) {
    console.error('[SHARE API] Error fetching shared report:', error);
    return NextResponse.json(
      { error: 'Failed to load report' },
      { status: 500 }
    );
  }
}
