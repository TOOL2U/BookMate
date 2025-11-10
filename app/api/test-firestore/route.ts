/**
 * Simple test endpoint to verify Firestore connection
 * GET /api/test-firestore
 */

import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Try to list collections
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    return NextResponse.json({
      ok: true,
      message: '✅ Firestore connected successfully!',
      collections: collectionNames,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
