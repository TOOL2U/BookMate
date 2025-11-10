/**
 * API Route: /api/reports/share
 * 
 * Manages shareable report links
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateShareToken, validateShareAccess } from '@/lib/reports/sharing';
import prisma from '@/lib/prisma';

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
    let expiresAt: Date | null = null;
    if (expiryDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);
    }
    
    // Create shared report in database
    const sharedReport = await prisma.sharedReport.create({
      data: {
        workspaceId: workspaceId || 'default',
        token,
        reportName,
        snapshot,
        expiresAt,
        passcode: passcode || null,
        maxViews: maxViews || null,
        viewCount: 0,
        createdBy: 'system', // TODO: Get from auth session
      },
    });
    
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
    
    // Find shared report in database
    const sharedReport = await prisma.sharedReport.findUnique({
      where: { token },
    });
    
    if (!sharedReport) {
      return NextResponse.json(
        { error: 'Shared report not found' },
        { status: 404 }
      );
    }
    
    // Validate access (expiry, view limits, passcode)
    const accessValidation = validateShareAccess(
      {
        access: {
          expiresAt: sharedReport.expiresAt?.toISOString(),
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
    await prisma.sharedReport.update({
      where: { id: sharedReport.id },
      data: {
        viewCount: sharedReport.viewCount + 1,
        lastAccessedAt: new Date(),
      },
    });
    
    // Return report in the expected format
    return NextResponse.json({
      report: {
        reportName: sharedReport.reportName,
        snapshot: sharedReport.snapshot,
        access: {
          expiresAt: sharedReport.expiresAt?.toISOString() || null,
          maxViews: sharedReport.maxViews,
          viewCount: sharedReport.viewCount + 1,
          hasPasscode: !!sharedReport.passcode,
        },
        createdAt: sharedReport.createdAt.toISOString(),
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
