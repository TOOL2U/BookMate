/**
 * Image Export Utility for BookMate Reports
 * 
 * Uses dom-to-image-more (supports Tailwind v4 OKLCH colors)
 * html2canvas CANNOT be used - breaks with oklch() color functions
 */

import domtoimage from 'dom-to-image-more';

/**
 * Export report snapshot - pixel-perfect screenshot
 */
export async function exportReportSnapshot(
  elementId: string = 'report-preview',
  filename: string = 'bookmate-report.png'
): Promise<void> {
  console.log('[IMAGE EXPORT] 🔍 Looking for element:', elementId);
  
  const element = document.getElementById(elementId);
  
  if (!element) {
    console.error(`[IMAGE EXPORT] ❌ Element #${elementId} not found`);
    alert(`ERROR: Cannot find element #${elementId}`);
    return;
  }

  console.log('[IMAGE EXPORT] ✅ Found element:', {
    id: element.id,
    width: element.offsetWidth,
    height: element.offsetHeight,
  });

  // Create a temporary white overlay to render the report cleanly
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = '#FFFFFF';
  overlay.style.zIndex = '999999';
  overlay.style.overflow = 'auto';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'flex-start';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '0';

  // Clone the element
  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'report-preview-clone';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  
  overlay.appendChild(clone);
  document.body.appendChild(overlay);

  try {
    // Wait for everything to render (charts, fonts, etc)
    await new Promise((res) => setTimeout(res, 1200));

    console.log('[IMAGE EXPORT] 📸 Taking screenshot at 3x scale...');

    // Capture the clone at native resolution, then scale up
    const dataUrl = await domtoimage.toPng(clone, {
      quality: 1,
      pixelRatio: 3,  // 3x resolution for retina quality
      cacheBust: true,
      bgcolor: '#FFFFFF',
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('[IMAGE EXPORT] ✅ Screenshot exported:', filename);

  } catch (error) {
    console.error('[IMAGE EXPORT] ❌ Export failed:', error);
    alert('Export failed. Check console for details.');
  } finally {
    // Remove the overlay
    document.body.removeChild(overlay);
  }
}

/**
 * Legacy wrapper for high-res image export
 */
export async function exportReportToHighResImage(
  elementId: string = 'report-preview',
  filename: string = 'bookmate-report-a4.png'
): Promise<void> {
  return exportReportSnapshot(elementId, filename);
}

/**
 * Export report as PNG (legacy wrapper)
 */
export async function exportReportToPNG(
  elementId: string = 'report-preview',
  filename: string = 'bookmate-report.png'
): Promise<void> {
  return exportReportSnapshot(elementId, filename);
}

/**
 * Export report as JPEG (smaller file size)
 */
export async function exportReportToJPEG(
  elementId: string = 'report-preview',
  filename: string = 'bookmate-report.jpg',
  quality: number = 0.95
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[IMAGE EXPORT] Element #${elementId} not found`);
    return;
  }

  // Create temporary white overlay
  const overlay = document.createElement('div');
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = '#FFFFFF';
  overlay.style.zIndex = '999999';
  overlay.style.overflow = 'auto';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'flex-start';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '0';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.id = 'report-preview-clone-jpeg';
  clone.style.margin = '0';
  clone.style.boxShadow = 'none';
  
  overlay.appendChild(clone);
  document.body.appendChild(overlay);

  try {
    await new Promise((res) => setTimeout(res, 1200));

    console.log('[IMAGE EXPORT] 📸 Taking JPEG screenshot...');

    const dataUrl = await domtoimage.toJpeg(clone, {
      quality: quality,
      pixelRatio: 3,  // 3x resolution
      cacheBust: true,
      bgcolor: '#FFFFFF',
    });

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('[IMAGE EXPORT] ✅ JPEG exported:', filename);

  } catch (error) {
    console.error('[IMAGE EXPORT] ❌ JPEG export failed:', error);
  } finally {
    document.body.removeChild(overlay);
  }
}
