/**
 * Firebase Storage Utility for PDF/Image Caching
 * 
 * Caches generated PDFs and PNGs to Firebase Storage
 * Reduces export time from 5-10s to <1s for cached reports
 * 
 * Note: This is a client-side caching layer. Server-side caching
 * would be more efficient but requires additional infrastructure.
 */

import { getStorage, ref, uploadBytes, getDownloadURL, getMetadata } from 'firebase/storage';
import { app } from '@/lib/firebase/client';

const storage = getStorage(app);

interface CacheMetadata {
  reportType: string;
  period: string;
  generatedAt: string;
  expiresAt: string;
}

/**
 * Generate cache key for a report
 */
export function generateCacheKey(
  reportType: string,
  period: { month?: string; year?: number; quarter?: number },
  format: 'pdf' | 'png'
): string {
  const periodStr = period.month 
    ? `${period.year}-${period.month}`
    : period.quarter
    ? `${period.year}-Q${period.quarter}`
    : `${period.year}`;
  
  return `reports/${reportType}/${periodStr}.${format}`;
}

/**
 * Check if cached report exists and is still valid
 */
export async function getCachedReport(
  cacheKey: string,
  maxAgeHours: number = 24
): Promise<string | null> {
  try {
    const fileRef = ref(storage, cacheKey);
    
    // Check if file exists and get metadata
    const metadata = await getMetadata(fileRef);
    const generatedAt = new Date(metadata.timeCreated);
    const now = new Date();
    const ageHours = (now.getTime() - generatedAt.getTime()) / (1000 * 60 * 60);
    
    // Return download URL if cache is still valid
    if (ageHours < maxAgeHours) {
      const downloadURL = await getDownloadURL(fileRef);
      console.log(`[CACHE] Hit for ${cacheKey} (age: ${ageHours.toFixed(1)}h)`);
      return downloadURL;
    }
    
    console.log(`[CACHE] Expired for ${cacheKey} (age: ${ageHours.toFixed(1)}h > ${maxAgeHours}h)`);
    return null;
    
  } catch (error: any) {
    // File doesn't exist or error occurred
    if (error.code === 'storage/object-not-found') {
      console.log(`[CACHE] Miss for ${cacheKey}`);
    } else {
      console.error(`[CACHE] Error checking cache:`, error);
    }
    return null;
  }
}

/**
 * Cache a generated report to Firebase Storage
 */
export async function cacheReport(
  cacheKey: string,
  data: Blob | Uint8Array | ArrayBuffer,
  metadata: CacheMetadata
): Promise<string> {
  try {
    const fileRef = ref(storage, cacheKey);
    
    // Upload with custom metadata
    const uploadResult = await uploadBytes(fileRef, data, {
      contentType: cacheKey.endsWith('.pdf') ? 'application/pdf' : 'image/png',
      customMetadata: {
        reportType: metadata.reportType,
        period: metadata.period,
        generatedAt: metadata.generatedAt,
        expiresAt: metadata.expiresAt,
      },
    });
    
    // Get download URL
    const downloadURL = await getDownloadURL(uploadResult.ref);
    
    const sizeKB = (data as Blob).size ? ((data as Blob).size / 1024).toFixed(2) : 'unknown';
    console.log(`[CACHE] Saved ${cacheKey} (${sizeKB}KB)`);
    
    return downloadURL;
    
  } catch (error) {
    console.error(`[CACHE] Error saving cache:`, error);
    throw error;
  }
}

/**
 * Helper to convert base64 data URL to Blob
 */
export function dataURLtoBlob(dataURL: string): Blob {
  const parts = dataURL.split(',');
  const contentType = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);
  
  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  
  return new Blob([uInt8Array], { type: contentType });
}

/**
 * Simplified cache wrapper for PDF exports
 * Use this in your components to check cache before generating
 */
export async function checkPDFCache(
  reportType: string,
  period: { month?: string; year?: number; quarter?: number }
): Promise<string | null> {
  const cacheKey = generateCacheKey(reportType, period, 'pdf');
  return getCachedReport(cacheKey, 24);
}

/**
 * Save generated PDF to cache
 */
export async function savePDFToCache(
  pdfDataURL: string,
  reportType: string,
  period: { month?: string; year?: number; quarter?: number }
): Promise<string | null> {
  try {
    const cacheKey = generateCacheKey(reportType, period, 'pdf');
    const blob = dataURLtoBlob(pdfDataURL);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const cacheUrl = await cacheReport(cacheKey, blob, {
      reportType,
      period: JSON.stringify(period),
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    
    return cacheUrl;
  } catch (error) {
    console.error('[CACHE] Failed to save PDF:', error);
    return null;
  }
}

/**
 * Simplified cache wrapper for PNG exports
 */
export async function checkPNGCache(
  reportType: string,
  period: { month?: string; year?: number; quarter?: number }
): Promise<string | null> {
  const cacheKey = generateCacheKey(reportType, period, 'png');
  return getCachedReport(cacheKey, 24);
}

/**
 * Save generated PNG to cache
 */
export async function savePNGToCache(
  pngDataURL: string,
  reportType: string,
  period: { month?: string; year?: number; quarter?: number }
): Promise<string | null> {
  try {
    const cacheKey = generateCacheKey(reportType, period, 'png');
    const blob = dataURLtoBlob(pngDataURL);
    
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const cacheUrl = await cacheReport(cacheKey, blob, {
      reportType,
      period: JSON.stringify(period),
      generatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
    
    return cacheUrl;
  } catch (error) {
    console.error('[CACHE] Failed to save PNG:', error);
    return null;
  }
}
