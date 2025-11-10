/**
 * High-Quality PDF Export Utility for Reports
 * 
 * Generates investor-grade PDFs using html2canvas with:
 * - 3x scale for sharp resolution
 * - Full scrollHeight capture (no cropping)
 * - Multi-page support for long reports
 * - Proper A4 portrait orientation
 */

'use client';

/**
 * Convert oklch() colors to rgb() for html2canvas compatibility
 * html2canvas doesn't support oklch() color format from Tailwind CSS v4
 * 
 * Strategy: Walk through all computed styles and replace oklch with hex/rgb
 */
function convertOklchToRgb(element: HTMLElement) {
  // Get all elements
  const allElements = [element, ...Array.from(element.querySelectorAll('*'))];
  
  console.log('[OKLCH] Converting colors for', allElements.length, 'elements');
  
  let oklchCount = 0;
  
  allElements.forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    
    const computed = window.getComputedStyle(el);
    const inlineStyle = el.style;
    
    // Properties that might contain colors
    const colorProps = [
      'color', 'backgroundColor', 'borderColor',
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 'columnRuleColor',
      'fill', 'stroke'
    ];
    
    colorProps.forEach((prop) => {
      const value = computed.getPropertyValue(prop);
      
      if (value && value.includes('oklch')) {
        oklchCount++;
        
        // Extract oklch parameters and convert to approximate RGB
        // oklch(L C H) format
        const match = value.match(/oklch\(([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\)/);
        
        if (match) {
          const l = parseFloat(match[1]);
          const c = parseFloat(match[2]);
          const h = parseFloat(match[3]);
          
          // Very rough approximation: convert to HSL then RGB
          // For production, you'd use a proper color conversion library
          const lightness = l; // 0-100
          const saturation = Math.min(100, c * 100); // Approximate
          const hue = h; // 0-360
          
          // Convert HSL to RGB (simplified)
          const hslToRgb = (h: number, s: number, l: number) => {
            s /= 100;
            l /= 100;
            const k = (n: number) => (n + h / 30) % 12;
            const a = s * Math.min(l, 1 - l);
            const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
            return [
              Math.round(255 * f(0)),
              Math.round(255 * f(8)),
              Math.round(255 * f(4))
            ];
          };
          
          const [r, g, b] = hslToRgb(hue, saturation, lightness);
          const rgbValue = `rgb(${r}, ${g}, ${b})`;
          
          // Apply the RGB value
          inlineStyle.setProperty(prop, rgbValue, 'important');
          
          console.log(`[OKLCH] Converted ${prop}:`, value, '→', rgbValue);
        }
      }
    });
  });
  
  console.log(`[OKLCH] Converted ${oklchCount} oklch colors`);
}

export async function exportReportToPDF(
  elementId: string = 'report-preview',
  filename: string = 'bookmate-report.pdf'
): Promise<string | undefined> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[PDF EXPORT] Element #${elementId} not found`);
    return undefined;
  }

  try {
    // Dynamically import to avoid SSR issues
    const html2canvas = (await import('html2canvas')).default;
    const jsPDF = (await import('jspdf')).default;

    console.log('[PDF EXPORT] Starting high-quality capture...');

    // Clone the element to avoid modifying the original DOM
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = element.scrollWidth + 'px';
    document.body.appendChild(clonedElement);

    // Convert oklch() colors to rgb() for html2canvas compatibility
    convertOklchToRgb(clonedElement);

    // Allow charts/fonts to fully render before capture
    await new Promise((res) => setTimeout(res, 1000));

    // 🔑 Key fix: Use scrollWidth/scrollHeight for full content capture
    const canvas = await html2canvas(clonedElement, {
      scale: 3,                           // 3x resolution for sharp exports
      useCORS: true,                      // Handle external resources
      backgroundColor: '#ffffff',         // Solid white background
      width: clonedElement.scrollWidth,         // Full width (no horizontal crop)
      height: clonedElement.scrollHeight,       // Full height (no vertical crop)
      windowWidth: clonedElement.scrollWidth,   // Prevent viewport constraints
      windowHeight: clonedElement.scrollHeight, // Capture everything
      logging: true,                      // Enable logging to debug
      imageTimeout: 0,                    // Wait for all images
      onclone: (clonedDoc) => {
        // This runs after cloning, before rendering
        // Force all elements to use computed RGB values
        const allEls = clonedDoc.querySelectorAll('*');
        allEls.forEach((el) => {
          if (el instanceof HTMLElement) {
            const computed = window.getComputedStyle(el);
            // Force inline styles to override any oklch
            el.style.color = computed.color;
            el.style.backgroundColor = computed.backgroundColor;
            el.style.borderColor = computed.borderColor;
          }
        });
      },
    });

    // Remove cloned element
    document.body.removeChild(clonedElement);

    const imgData = canvas.toDataURL('image/png', 1.0); // Maximum quality PNG

    console.log('[PDF EXPORT] Canvas captured:', {
      width: canvas.width,
      height: canvas.height,
      ratio: (canvas.width / canvas.height).toFixed(2),
    });

    // Create PDF in PORTRAIT orientation (A4)
    const pdf = new jsPDF('p', 'pt', 'a4'); // Using points for precision
    const pageWidth = pdf.internal.pageSize.getWidth();   // ~595pt
    const pageHeight = pdf.internal.pageSize.getHeight(); // ~842pt

    // Calculate image dimensions to fit page width
    const ratio = canvas.width / canvas.height;
    const pdfWidth = pageWidth;
    const pdfHeight = pdfWidth / ratio;

    console.log('[PDF EXPORT] PDF layout:', {
      pageWidth,
      pageHeight,
      pdfWidth,
      pdfHeight,
      pages: Math.ceil(pdfHeight / pageHeight),
    });

    // Single page or multi-page handling
    if (pdfHeight <= pageHeight) {
      // ✅ Single page - simple case
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    } else {
      // ✅ Multi-page - slice vertically for long reports
      let remainingHeight = canvas.height;
      const sliceHeight = (pageHeight * canvas.width) / pageWidth;
      let position = 0;
      let pageNumber = 0;

      while (remainingHeight > 0) {
        // Create slice canvas
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHeight, remainingHeight);

        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) break;

        // Draw slice from main canvas
        ctx.drawImage(
          canvas,
          0,                      // source x
          position,               // source y (moves down each iteration)
          canvas.width,           // source width
          sliceCanvas.height,     // source height
          0,                      // dest x
          0,                      // dest y
          canvas.width,           // dest width
          sliceCanvas.height      // dest height
        );

        const sliceData = sliceCanvas.toDataURL('image/png', 1.0);

        // Add new page if not first
        if (pageNumber > 0) pdf.addPage();

        // Add slice to PDF
        const slicePdfHeight = (sliceCanvas.height * pageWidth) / canvas.width;
        pdf.addImage(sliceData, 'PNG', 0, 0, pageWidth, slicePdfHeight, undefined, 'FAST');

        // Move to next slice
        position += sliceHeight;
        remainingHeight -= sliceHeight;
        pageNumber++;
      }

      console.log(`[PDF EXPORT] Generated ${pageNumber} pages`);
    }

    // Save the PDF
    pdf.save(filename);
    
    // Return base64 for email (without data URI prefix)
    const pdfBase64 = pdf.output('dataurlstring').split(',')[1];
    const sizeKB = Math.round((pdfBase64.length * 3) / 4 / 1024);
    console.log(`[PDF EXPORT] PDF generated successfully (${sizeKB} KB)`);
    
    return pdfBase64;

  } catch (error) {
    console.error('[PDF EXPORT] Failed:', error);
    throw error;
  }
}

/**
 * Generate filename based on report period
 */
export function generatePDFFilename(period: {
  type: string;
  label: string;
  start: string;
  end: string;
}): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const periodLabel = period.label.replace(/\s+/g, '-').toLowerCase();
  return `bookmate-report-${periodLabel}-${timestamp}.pdf`;
}

/**
 * Export report as high-quality PNG image
 * 
 * Alternative to PDF for sharing/printing
 */
export async function exportReportAsPNG(
  elementId: string = 'report-preview',
  filename: string = 'bookmate-report.png'
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`[PNG EXPORT] Element #${elementId} not found`);
    return;
  }

  try {
    const html2canvas = (await import('html2canvas')).default;

    console.log('[PNG EXPORT] Starting high-quality capture...');

    // Clone the element to avoid modifying the original DOM
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = element.scrollWidth + 'px';
    document.body.appendChild(clonedElement);

    // Convert oklch() colors to rgb() for html2canvas compatibility
    convertOklchToRgb(clonedElement);

    // Allow charts/fonts to fully render
    await new Promise((res) => setTimeout(res, 1000));

    // High-resolution capture
    const canvas = await html2canvas(clonedElement, {
      scale: 3,                           // 3x resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      width: clonedElement.scrollWidth,
      height: clonedElement.scrollHeight,
      windowWidth: clonedElement.scrollWidth,
      windowHeight: clonedElement.scrollHeight,
      logging: false,
      imageTimeout: 0,
    });

    // Remove cloned element
    document.body.removeChild(clonedElement);

    // Convert to PNG and download
    const imgData = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    link.href = imgData;
    link.download = filename;
    link.click();

    console.log('[PNG EXPORT] PNG generated successfully');
  } catch (error) {
    console.error('[PNG EXPORT] Failed:', error);
    throw error;
  }
}

/**
 * Generate PNG filename based on report period
 */
export function generatePNGFilename(period: {
  type: string;
  label: string;
  start: string;
  end: string;
}): string {
  const timestamp = new Date().toISOString().split('T')[0];
  const periodLabel = period.label.replace(/\s+/g, '-').toLowerCase();
  return `bookmate-report-${periodLabel}-${timestamp}.png`;
}
