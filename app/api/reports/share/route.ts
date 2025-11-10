/**
 * API Route: /api/reports/share
 * 
 * Manages shareable report links
 * Updated to use Firestore for production compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateShareToken, validateShareAccess } from '@/lib/reports/sharing';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: NextRequest) {
  try {
    const {
      reportName,
      snapshot,
      expiryDays,
      passcode,
      maxViews,
      workspaceId,
    } = await req.json();
    
    // Validate input
    if (!reportName || !snapshot) {
      return NextResponse.json(
        { error: 'Report name and snapshot are required' },
        { status: 400 }
      );
    }
    
    // Generate secure token
    const token = generateShareToken();
    
    // Calculate expiry date
    let expiresAt: string | null = null;
    if (expiryDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      expiresAt = expiryDate.toISOString();
    }
    
    const db = getAdminDb();
    
    // Create shared report in Firestore
    const sharedReportData = {
      workspaceId: workspaceId || 'default',
      token,
      reportName,
      snapshot,
      expiresAt,
      passcode: passcode || null,
      maxViews: maxViews || null,
      viewCount: 0,
      createdBy: 'system', // TODO: Get from auth session
      createdAt: new Date().toISOString(),
      lastAccessedAt: null,
    };
    
    const docRef = await db.collection('sharedReports').add(sharedReportData);
    const sharedReport = { id: docRef.id, ...sharedReportData };
    
    // Generate shareable URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareUrl = `${baseUrl}/shared/reports/${token}`;
    
    return NextResponse.json({
      shareUrl,
      token,
      expiresAt: sharedReport.expiresAt,
      sharedReport,
    }, { status: 201 });
  } catch (error) {
    console.error('Share POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create shareable link' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const passcode = searchParams.get('passcode');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    const db = getAdminDb();
    
    // Find shared report in Firestore by token
    const snapshot = await db.collection('sharedReports')
      .where('token', '==', token)
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Shared report not found' },
        { status: 404 }
      );
    }
    
    const doc = snapshot.docs[0];
    const sharedReport = { id: doc.id, ...doc.data() } as any;
    
    // Validate access (expiry, view limits, passcode)
    const accessValidation = validateShareAccess(
      {
        access: {
          expiresAt: sharedReport.expiresAt,
          passcode: sharedReport.passcode,
          viewCount: sharedReport.viewCount,
          maxViews: sharedReport.maxViews,
        },
      } as any,
      passcode || undefined
    );
    
    if (!accessValidation.valid) {
      const statusCode = accessValidation.reason === 'Passcode required' || 
                        accessValidation.reason === 'Invalid passcode' 
                          ? 401 
                          : 403;
      return NextResponse.json(
        { error: accessValidation.reason },
        { status: statusCode }
      );
    }
    
    // Increment view count and update last accessed time
    await doc.ref.update({
      viewCount: (sharedReport.viewCount || 0) + 1,
      lastAccessedAt: new Date().toISOString(),
    });
    
    // Return report in the expected format
    return NextResponse.json({
      report: {
        reportName: sharedReport.reportName,
        snapshot: sharedReport.snapshot,
        access: {
          expiresAt: sharedReport.expiresAt || null,
          maxViews: sharedReport.maxViews,
          viewCount: (sharedReport.viewCount || 0) + 1,
          hasPasscode: !!sharedReport.passcode,
        },
        createdAt: sharedReport.createdAt,
      },
    });
  } catch (error) {
    console.error('Share GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared report' },
      { status: 500 }
    );
  }
}
