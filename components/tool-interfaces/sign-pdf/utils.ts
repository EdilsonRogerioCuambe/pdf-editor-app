import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { SignatureBox } from './types';

// Helper to convert formatting
function formatDate(date: Date, format: string) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
}

export async function addSignatureToPDF(pdfDoc: PDFDocument, signatureBoxes: SignatureBox[]) {
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Cache embedded images to avoid duplication if user reused same stamp?
  // For now simple each-time embed is fine as base64 strings might differ slightly if re-created

  for (const box of signatureBoxes) {
      if (box.pageIndex < 0 || box.pageIndex >= pages.length) continue;

      const page = pages[box.pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Convert Data URL to bytes
      const imageBytes = await fetch(box.signatureData).then(res => res.arrayBuffer());

      let signatureImage;
      try {
          if (box.signatureData.startsWith('data:image/jpeg')) {
              signatureImage = await pdfDoc.embedJpg(imageBytes);
          } else {
              signatureImage = await pdfDoc.embedPng(imageBytes);
          }
      } catch (e) {
          console.error("Failed to embed image", e);
          continue;
      }

      // CRITICAL COORDINATE CONVERSION:
      //
      // Visual Editor (what user sees):
      // - Uses PDF.js viewport at scale 1.5x
      // - Top-left origin (0,0 is top-left)
      // - Size stored in pages state: { width: viewport.width, height: viewport.height }
      // - Coordinates stored in box are ALREADY in viewport pixels
      //   (they were NOT divided by 1.5 when created - I was wrong!)
      //
      // PDF (actual document):
      // - Bottom-left origin (0,0 is bottom-left)
      // - Size in points (not pixels)
      // - Need to convert from viewport pixels to PDF points
      //
      // The viewport at scale 1.5 means:
      //   viewportWidth = pdfPageWidth * 1.5
      //   So: pdfPageWidth = viewportWidth / 1.5

      // Since box coordinates are in viewport pixels, we need to:
      // 1. Convert from viewport pixels to PDF points by dividing by scale (1.5)
      // 2. Convert Y from top-left to bottom-left

      const VIEWPORT_SCALE = 1.5;

      // Convert viewport pixels to PDF points
      const pdfX = box.x / VIEWPORT_SCALE;
      const pdfWidth = box.width / VIEWPORT_SCALE;
      const pdfHeight = box.height / VIEWPORT_SCALE;

      // Convert Y coordinate from top-left to bottom-left origin
      // box.y is distance from top in viewport pixels
      const pdfY = pageHeight - (box.y / VIEWPORT_SCALE) - pdfHeight;

      console.log('Signature conversion:', {
          boxCoords: { x: box.x, y: box.y, w: box.width, h: box.height },
          pageSize: { w: pageWidth, h: pageHeight },
          pdfCoords: { x: pdfX, y: pdfY, w: pdfWidth, h: pdfHeight }
      });

      page.drawImage(signatureImage, {
          x: pdfX,
          y: pdfY,
          width: pdfWidth,
          height: pdfHeight,
          rotate: degrees(box.rotation),
          opacity: box.opacity
      });

      // Add Date if enabled
      if (box.includeDate) {
          const dateText = formatDate(new Date(), box.dateFormat);
          const fontSize = 10;
          const VIEWPORT_SCALE = 1.5;

          // Convert coordinates the same way as the signature
          const pdfX = box.x / VIEWPORT_SCALE;
          const pdfHeight = box.height / VIEWPORT_SCALE;
          const pdfY = pageHeight - (box.y / VIEWPORT_SCALE) - pdfHeight;

          let dateX = pdfX;
          let dateY = pdfY - 15; // default below

          // Simple positioning logic relative to box
          if (box.datePosition === 'above') {
              dateY = pdfY + pdfHeight + 5;
          }

          page.drawText(dateText, {
              x: dateX,
              y: dateY,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
          });
      }
  }

  return pdfDoc;
}
