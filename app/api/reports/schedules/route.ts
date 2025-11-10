/**
 * API Route: /api/reports/schedules
 * 
 * Manages scheduled report generation and delivery
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateNextRun } from '@/lib/reports/sharing';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace') || searchParams.get('workspaceId') || 'default';
    
    // Fetch schedules from database
    const schedules = await prisma.scheduledReport.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      schedules,
      count: schedules.length,
    });
  } catch (error) {
    console.error('Schedules GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schedules' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name || !body.schedule || !body.recipients || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'Schedule name, schedule configuration, and recipients are required' },
        { status: 400 }
      );
    }
    
    // Calculate next run time
    const nextRun = calculateNextRun(body.schedule);
    
    // Create new scheduled report in database
    const schedule = await prisma.scheduledReport.create({
      data: {
        workspaceId: body.workspace || body.workspaceId || 'default',
        templateId: body.templateId || null,
        name: body.name,
        scheduleConfig: body.schedule,
        recipients: body.recipients,
        deliveryConfig: body.deliveryConfig || {},
        status: 'active',
        nextRun,
        runCount: 0,
        failureCount: 0,
        createdBy: body.userId || 'system',
      },
    });
    
    console.log('Scheduled report created:', schedule.name, 'Next run:', schedule.nextRun);
    
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('Schedules POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }
    
    const updates = await req.json();
    
    // Find schedule
    const existing = await prisma.scheduledReport.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    // Recalculate next run if schedule changed
    let nextRun = existing.nextRun;
    if (updates.schedule) {
      nextRun = calculateNextRun(updates.schedule);
    }
    
    // Update schedule
    const schedule = await prisma.scheduledReport.update({
      where: { id },
      data: {
        name: updates.name,
        scheduleConfig: updates.schedule,
        recipients: updates.recipients,
        deliveryConfig: updates.deliveryConfig,
        status: updates.status,
        nextRun,
      },
    });
    
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('Schedules PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      );
    }
    
    // Find schedule
    const schedule = await prisma.scheduledReport.findUnique({
      where: { id },
    });
    
    if (!schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }
    
    // Delete schedule
    const deleted = await prisma.scheduledReport.delete({
      where: { id },
    });
    
    console.log('Scheduled report deleted:', deleted.name);
    
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Schedules DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    );
  }
}
