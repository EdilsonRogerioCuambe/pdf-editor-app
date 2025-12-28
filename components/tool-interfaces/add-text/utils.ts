import { degrees, PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { TextBox } from './types';

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

export async function addTextBoxToPDFPage(page: PDFPage, textBox: TextBox, pdfDoc: PDFDocument) {
  const { width: pageWidth, height: pageHeight } = page.getSize();

  // Embed font
  let font;
  const fontName = textBox.fontFamily.toLowerCase();

  // Map UI fonts to Standard PDF Fonts
  // Note: For custom fonts (e.g. Arial proper) we would need to embed generic TTF files.
  // Here we map to the closest Standard Font to ensure reliability without external requests.

  if (fontName.includes('helvetica') || fontName.includes('arial') || fontName.includes('verdana')) {
    font = textBox.fontWeight === 'bold' || textBox.fontWeight === '700'
      ? await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      : await pdfDoc.embedFont(StandardFonts.Helvetica);
  } else if (fontName.includes('times') || fontName.includes('georgia')) {
    font = textBox.fontWeight === 'bold' || textBox.fontWeight === '700'
      ? await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      : await pdfDoc.embedFont(StandardFonts.TimesRoman);
  } else if (fontName.includes('courier') || fontName.includes('consolas')) {
    font = textBox.fontWeight === 'bold' || textBox.fontWeight === '700'
      ? await pdfDoc.embedFont(StandardFonts.CourierBold)
      : await pdfDoc.embedFont(StandardFonts.Courier);
  } else {
    // Default to Helvetica
    font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // Convert coordinates (canvas Y is top-down, PDF Y is bottom-up)
  // We assume the textBox.y is relative to the top of the details.
  // Note: textBox.y comes from the visual editor where (0,0) is top-left.
  // In pdf-lib, (0,0) is bottom-left.

  // Adjust for PDF coordinate system
  // We subtract fontSize because visually text is often aligned by baseline or top,
  // but we need to ensure it lands where the user sees it.
  const lines = textBox.content.split('\n');

  // Calculate specific position based on user's input
  // The user sends x/y as top-left coordinates relative to page size

  // Calculate total height of the text block to position correctly if needed,
  // but for top-down logic:
  // visually: top = y
  // pdf-lib: y = pageHeight - top - (height of first line roughly?)
  // Actually, drawText y approach is usually baseline.

  const lineHeight = textBox.fontSize * textBox.lineHeight;

  // Parse color
  const color = hexToRgb(textBox.color);
  const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255);

  const pdfY = pageHeight - textBox.y - (textBox.fontSize * 0.8); // adjusting for baseline approximate

  // Draw background if enabled
  if (textBox.hasBackground) {
    // We need to calculate text width roughly or use the box width
    const textWidth = textBox.width; // Use the box width if fixed, or calc max line width

    // If width is fixed (number), simple. If content-based, we'd need to measure.
    // For now, let's assume textBox.width is accurate from the frontend measurement

    const bgWidth = textBox.width + (textBox.backgroundPadding * 2);
    // Approximate height based on lines
    const totalTextHeight = lines.length * lineHeight;
    const bgHeight = totalTextHeight + (textBox.backgroundPadding * 2);

    const bgColor = hexToRgb(textBox.backgroundColor);
    const bgRgb = rgb(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255);

    // Draw rect. Y is bottom-left for rect.
    // Top of rect should be at pageHeight - textBox.y + padding
    const rectY = pageHeight - textBox.y - totalTextHeight - textBox.backgroundPadding;

    // Fix: Using simple coordinate mapping from the request source
    // They used: pageHeight - textBox.y - textBox.fontSize
    // Let's stick closer to their logic but ensure we handle the block correctly.

    page.drawRectangle({
      x: textBox.x - textBox.backgroundPadding,
      y: pageHeight - textBox.y - totalTextHeight - textBox.backgroundPadding + (textBox.fontSize * 0.2), // Tweak offset
      width: bgWidth,
      height: bgHeight,
      color: bgRgb,
      opacity: textBox.backgroundOpacity,
      // borderRadius: textBox.backgroundBorderRadius // pdf-lib drawRectangle doesn't support radius directly in standard API simply
    });
  }

  // Draw border if enabled
  if (textBox.hasBorder) {
      const borderColor = hexToRgb(textBox.borderColor);
      const borderRgb = rgb(borderColor.r / 255, borderColor.g / 255, borderColor.b / 255);
      const totalTextHeight = lines.length * lineHeight;

      page.drawRectangle({
        x: textBox.x,
        y: pageHeight - textBox.y - totalTextHeight + (textBox.fontSize * 0.2),
        width: textBox.width,
        height: totalTextHeight,
        borderColor: borderRgb,
        borderWidth: textBox.borderWidth,
        opacity: 0 // transparent fill
      });
  }

  // Draw shadow if enabled
  if (textBox.hasShadow) {
    const shadowColor = hexToRgb(textBox.shadowColor);
    const shadowRgb = rgb(shadowColor.r / 255, shadowColor.g / 255, shadowColor.b / 255);

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: textBox.x + textBox.shadowX,
        y: pdfY - (index * lineHeight) + textBox.shadowY,
        size: textBox.fontSize,
        font: font,
        color: shadowRgb,
        opacity: 0.5,
        rotate: degrees(textBox.rotation)
      });
    });
  }

  // Draw outline - crude implementation using offsets
  if (textBox.hasOutline) {
    const outlineColor = hexToRgb(textBox.outlineColor);
    const outlineRgb = rgb(outlineColor.r / 255, outlineColor.g / 255, outlineColor.b / 255);

    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ];

    lines.forEach((line, lineIndex) => {
      offsets.forEach(([dx, dy]) => {
        page.drawText(line, {
          x: textBox.x + (dx * textBox.outlineWidth),
          y: pdfY - (lineIndex * lineHeight) + (dy * textBox.outlineWidth),
          size: textBox.fontSize,
          font: font,
          color: outlineRgb,
          opacity: textBox.opacity,
          rotate: degrees(textBox.rotation)
        });
      });
    });
  }

  // Draw main text
  lines.forEach((line, index) => {
    page.drawText(line, {
      x: textBox.x,
      y: pdfY - (index * lineHeight),
      size: textBox.fontSize,
      font: font,
      color: rgbColor,
      opacity: textBox.opacity,
      rotate: degrees(textBox.rotation),
      lineHeight: lineHeight
    });
  });
}
