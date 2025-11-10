/**
 * API Route: /api/reports/templates
 * 
 * Manages report templates (CRUD operations)
 * Updated to use Prisma database
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace') || searchParams.get('workspaceId') || 'default';
    
    // Fetch templates from database
    const templates = await prisma.reportTemplate.findMany({
      where: {
        OR: [
          { workspaceId },
          { isDefault: true },
        ],
      },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
    
    return NextResponse.json({
      templates,
      count: templates.length,
    });
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate template
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Template name and type are required' },
        { status: 400 }
      );
    }
    
    // Create new template in database
    const template = await prisma.reportTemplate.create({
      data: {
        workspaceId: body.workspace || body.workspaceId || 'default',
        name: body.name,
        description: body.description || '',
        type: body.type,
        filters: body.filters || {},
        sections: body.sections || {},
        branding: body.brandingOverrides || body.branding || {},
        isDefault: false,
        createdBy: body.userId || 'system',
      },
    });
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Templates POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
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
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    const updates = await req.json();
    
    // Find template
    const existing = await prisma.reportTemplate.findUnique({
      where: { id },
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Update template
    const template = await prisma.reportTemplate.update({
      where: { id },
      data: {
        name: updates.name,
        description: updates.description,
        filters: updates.filters,
        sections: updates.sections,
        branding: updates.brandingOverrides || updates.branding,
      },
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Templates PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update template' },
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
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Find template
    const template = await prisma.reportTemplate.findUnique({
      where: { id },
    });
    
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Don't allow deletion of default templates
    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      );
    }
    
    // Delete template
    const deleted = await prisma.reportTemplate.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    console.error('Templates DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
