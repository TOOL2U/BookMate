/**
 * API Route: /api/reports/templates
 * 
 * Manages report templates (CRUD operations)
 * Updated to use Firestore for production compatibility
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspace') || searchParams.get('workspaceId') || 'default';
    
    const db = getAdminDb();
    
    // Fetch templates from Firestore
    const templatesRef = db.collection('reportTemplates');
    const snapshot = await templatesRef
      .where('workspaceId', '==', workspaceId)
      .orderBy('createdAt', 'desc')
      .get();
    
    // Also get default templates
    const defaultSnapshot = await templatesRef
      .where('isDefault', '==', true)
      .orderBy('createdAt', 'desc')
      .get();
    
    const templates = [
      ...defaultSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      ...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    ];
    
    // Remove duplicates (in case workspace has default templates)
    const uniqueTemplates = Array.from(
      new Map(templates.map(t => [t.id, t])).values()
    );
    
    return NextResponse.json({
      templates: uniqueTemplates,
      count: uniqueTemplates.length,
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
    
    const db = getAdminDb();
    
    // Create new template in Firestore
    const templateData = {
      workspaceId: body.workspace || body.workspaceId || 'default',
      name: body.name,
      description: body.description || '',
      type: body.type,
      filters: body.filters || {},
      sections: body.sections || {},
      branding: body.brandingOverrides || body.branding || {},
      isDefault: false,
      createdBy: body.userId || 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const docRef = await db.collection('reportTemplates').add(templateData);
    const template = { id: docRef.id, ...templateData };
    
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
    const db = getAdminDb();
    
    // Find template in Firestore
    const docRef = db.collection('reportTemplates').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    // Update template
    const updateData = {
      name: updates.name,
      description: updates.description,
      filters: updates.filters,
      sections: updates.sections,
      branding: updates.brandingOverrides || updates.branding,
      updatedAt: new Date().toISOString(),
    };
    
    await docRef.update(updateData);
    const updatedDoc = await docRef.get();
    const template = { id: updatedDoc.id, ...updatedDoc.data() };
    
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
    
    const db = getAdminDb();
    
    // Find template in Firestore
    const docRef = db.collection('reportTemplates').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }
    
    const templateData = doc.data();
    
    // Don't allow deletion of default templates
    if (templateData?.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 403 }
      );
    }
    
    // Delete template
    await docRef.delete();
    
    return NextResponse.json({ success: true, deleted: { id, ...templateData } });
  } catch (error) {
    console.error('Templates DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    );
  }
}
