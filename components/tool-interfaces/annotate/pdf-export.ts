// PDF export utilities using pdf-lib

import { degrees, PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { hexToRgb } from './annotation-utils'
import type {
    Annotation,
    DrawingAnnotation,
    HighlightAnnotation,
    ImageAnnotation,
    NoteAnnotation,
    ShapeAnnotation,
    StampAnnotation,
    TextAnnotation,
} from './types'

/**
 * Save PDF with annotations
 */
export async function saveAnnotatedPDF(
  pdfFile: File,
  annotations: Annotation[]
): Promise<Uint8Array> {
  const arrayBuffer = await pdfFile.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)

  // Group annotations by page
  const annotationsByPage = new Map<number, Annotation[]>()
  annotations.forEach(ann => {
    if (!annotationsByPage.has(ann.pageIndex)) {
      annotationsByPage.set(ann.pageIndex, [])
    }
    annotationsByPage.get(ann.pageIndex)!.push(ann)
  })

  // Add annotations to each page
  for (const [pageIndex, pageAnnotations] of annotationsByPage) {
    const page = pdfDoc.getPage(pageIndex)
    const { height: pageHeight } = page.getSize()

    // Sort by z-index
    const sortedAnnotations = [...pageAnnotations].sort((a, b) => a.zIndex - b.zIndex)

    // Only render visible annotations
    const visibleAnnotations = sortedAnnotations.filter(a => a.isVisible)

    for (const annotation of visibleAnnotations) {
      await addAnnotationToPDF(page, annotation, pdfDoc, pageHeight)
    }
  }

  // Save PDF
  const pdfBytes = await pdfDoc.save()
  return pdfBytes
}

/**
 * Add annotation to PDF page
 */
async function addAnnotationToPDF(
  page: any,
  annotation: Annotation,
  pdfDoc: PDFDocument,
  pageHeight: number
): Promise<void> {
  // Convert Y coordinate (canvas is top-down, PDF is bottom-up)
  const pdfY = pageHeight - annotation.y - annotation.height

  // Don't add if not visible
  if (!annotation.isVisible) return

  try {
    switch (annotation.type) {
      case 'highlight':
        await addHighlightToPDF(page, annotation as HighlightAnnotation, pdfY)
        break
      case 'draw':
        await addDrawingToPDF(page, annotation as DrawingAnnotation, pageHeight)
        break
      case 'shape':
        await addShapeToPDF(page, annotation as ShapeAnnotation, pdfY)
        break
      case 'text':
        await addTextToPDF(page, annotation as TextAnnotation, pdfDoc, pageHeight)
        break
      case 'note':
        await addNoteToPDF(page, annotation as NoteAnnotation, pdfY)
        break
      case 'stamp':
        await addStampToPDF(page, annotation as StampAnnotation, pdfDoc, pdfY)
        break
      case 'image':
        await addImageToPDF(page, annotation as ImageAnnotation, pdfDoc, pdfY)
        break
    }
  } catch (error) {
    console.error(`Failed to add annotation to PDF:`, error)
  }
}

/**
 * Add highlight to PDF
 */
async function addHighlightToPDF(
  page: any,
  annotation: HighlightAnnotation,
  pdfY: number
): Promise<void> {
  const color = hexToRgb(annotation.highlightColor)
  const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255)

  if (annotation.highlightStyle === 'solid') {
    page.drawRectangle({
      x: annotation.x,
      y: pdfY,
      width: annotation.width,
      height: annotation.height,
      color: rgbColor,
      opacity: annotation.highlightOpacity,
      borderWidth: 0,
    })
  } else if (annotation.highlightStyle === 'underline') {
    page.drawRectangle({
      x: annotation.x,
      y: pdfY,
      width: annotation.width,
      height: 2,
      color: rgbColor,
      opacity: annotation.highlightOpacity,
    })
  } else if (annotation.highlightStyle === 'strikethrough') {
    page.drawRectangle({
      x: annotation.x,
      y: pdfY + annotation.height / 2,
      width: annotation.width,
      height: 2,
      color: rgbColor,
      opacity: annotation.highlightOpacity,
    })
  } else if (annotation.highlightStyle === 'squiggly') {
    // Simplified squiggly underline
    page.drawRectangle({
      x: annotation.x,
      y: pdfY,
      width: annotation.width,
      height: 2,
      color: rgbColor,
      opacity: annotation.highlightOpacity,
    })
  }
}

/**
 * Add drawing to PDF
 */
async function addDrawingToPDF(
  page: any,
  annotation: DrawingAnnotation,
  pageHeight: number
): Promise<void> {
  for (const stroke of annotation.strokes) {
    if (stroke.points.length < 2) continue

    const color = hexToRgb(stroke.color)
    const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255)

    // Draw path using lines
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i]
      const p2 = stroke.points[i + 1]

      page.drawLine({
        start: { x: p1.x, y: pageHeight - p1.y },
        end: { x: p2.x, y: pageHeight - p2.y },
        thickness: stroke.thickness,
        color: rgbColor,
        opacity: stroke.opacity,
      })
    }
  }
}

/**
 * Add shape to PDF
 */
async function addShapeToPDF(
  page: any,
  annotation: ShapeAnnotation,
  pdfY: number
): Promise<void> {
  const borderColor = hexToRgb(annotation.borderColor)
  const borderRgb = rgb(borderColor.r / 255, borderColor.g / 255, borderColor.b / 255)

  let fillRgb
  if (annotation.fillColor) {
    const fillColor = hexToRgb(annotation.fillColor)
    fillRgb = rgb(fillColor.r / 255, fillColor.g / 255, fillColor.b / 255)
  }

  switch (annotation.shapeType) {
    case 'rectangle':
      page.drawRectangle({
        x: annotation.x,
        y: pdfY,
        width: annotation.width,
        height: annotation.height,
        borderColor: borderRgb,
        borderWidth: annotation.borderWidth,
        color: fillRgb,
        opacity: annotation.fillOpacity,
      })
      break

    case 'circle':
      const centerX = annotation.x + annotation.width / 2
      const centerY = pdfY + annotation.height / 2

      page.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: annotation.width / 2,
        yScale: annotation.height / 2,
        borderColor: borderRgb,
        borderWidth: annotation.borderWidth,
        color: fillRgb,
        opacity: annotation.fillOpacity,
      })
      break

    case 'line':
    case 'arrow':
      page.drawLine({
        start: { x: annotation.x, y: pdfY + annotation.height },
        end: { x: annotation.x + annotation.width, y: pdfY },
        thickness: annotation.borderWidth,
        color: borderRgb,
        opacity: annotation.opacity,
      })

      // Add arrowhead for arrow
      if (annotation.shapeType === 'arrow') {
        const headLength = 15
        const angle = Math.atan2(-annotation.height, annotation.width)
        const endX = annotation.x + annotation.width
        const endY = pdfY

        // Draw arrowhead lines
        page.drawLine({
          start: { x: endX, y: endY },
          end: {
            x: endX - headLength * Math.cos(angle - Math.PI / 6),
            y: endY + headLength * Math.sin(angle - Math.PI / 6),
          },
          thickness: annotation.borderWidth,
          color: borderRgb,
          opacity: annotation.opacity,
        })

        page.drawLine({
          start: { x: endX, y: endY },
          end: {
            x: endX - headLength * Math.cos(angle + Math.PI / 6),
            y: endY + headLength * Math.sin(angle + Math.PI / 6),
          },
          thickness: annotation.borderWidth,
          color: borderRgb,
          opacity: annotation.opacity,
        })
      }
      break
  }
}

/**
 * Add text to PDF
 */
/**
 * Add text to PDF
 */
async function addTextToPDF(
  page: any,
  annotation: TextAnnotation,
  pdfDoc: PDFDocument,
  pageHeight: number
): Promise<void> {
  // Embed font
  let font
  const fontName = annotation.fontFamily.toLowerCase()

  // Map UI fonts to Standard PDF Fonts
  if (fontName.includes('helvetica') || fontName.includes('arial') || fontName.includes('verdana')) {
    font = annotation.fontWeight === 'bold' || annotation.fontWeight === '700'
      ? await pdfDoc.embedFont(StandardFonts.HelveticaBold)
      : await pdfDoc.embedFont(StandardFonts.Helvetica)
  } else if (fontName.includes('times') || fontName.includes('georgia')) {
    font = annotation.fontWeight === 'bold' || annotation.fontWeight === '700'
      ? await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
      : await pdfDoc.embedFont(StandardFonts.TimesRoman)
  } else if (fontName.includes('courier') || fontName.includes('consolas')) {
    font = annotation.fontWeight === 'bold' || annotation.fontWeight === '700'
      ? await pdfDoc.embedFont(StandardFonts.CourierBold)
      : await pdfDoc.embedFont(StandardFonts.Courier)
  } else {
    // Default to Helvetica
    font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  }

  const lines = annotation.content.split('\n')
  const lineHeight = annotation.fontSize * (annotation.lineHeight || 1.2)

  // Calculate top Y position for text (converting from top-left to bottom-left coordinate system)
  // annotation.y is the top position in the viewer
  // We subtract fontSize * 0.8 as an approximate baseline adjustment
  const startY = pageHeight - annotation.y - (annotation.fontSize * 0.8)

  const color = hexToRgb(annotation.color)
  const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255)

  // Draw background if set
  if (annotation.hasBackground) {
    // Calculate total dimensions
    const totalTextHeight = lines.length * lineHeight
    const bgWidth = annotation.width + ((annotation.backgroundPadding || 0) * 2)
    const bgHeight = totalTextHeight + ((annotation.backgroundPadding || 0) * 2)

    const bgColor = hexToRgb(annotation.backgroundColor)
    const bgRgb = rgb(bgColor.r / 255, bgColor.g / 255, bgColor.b / 255)

    // Draw rect. Y is bottom-left
    page.drawRectangle({
      x: annotation.x - (annotation.backgroundPadding || 0),
      y: pageHeight - annotation.y - totalTextHeight - (annotation.backgroundPadding || 0) + (annotation.fontSize * 0.2),
      width: bgWidth,
      height: bgHeight,
      color: bgRgb,
      opacity: annotation.backgroundOpacity,
    })
  }

  // Draw border if enabled
  if (annotation.hasBorder) {
    const borderColor = hexToRgb(annotation.borderColor)
    const borderRgb = rgb(borderColor.r / 255, borderColor.g / 255, borderColor.b / 255)
    const totalTextHeight = lines.length * lineHeight

    page.drawRectangle({
      x: annotation.x,
      y: pageHeight - annotation.y - totalTextHeight + (annotation.fontSize * 0.2),
      width: annotation.width,
      height: totalTextHeight,
      borderColor: borderRgb,
      borderWidth: annotation.borderWidth,
      opacity: 0 // transparent fill
    })
  }

  // Draw shadow if enabled
  if (annotation.hasShadow) {
    const shadowColor = hexToRgb(annotation.shadowColor)
    const shadowRgb = rgb(shadowColor.r / 255, shadowColor.g / 255, shadowColor.b / 255)

    lines.forEach((line: string, index: number) => {
      page.drawText(line, {
        x: annotation.x + annotation.shadowX,
        y: startY - (index * lineHeight) + annotation.shadowY,
        size: annotation.fontSize,
        font: font,
        color: shadowRgb,
        opacity: 0.5,
        rotate: degrees(annotation.rotation || 0)
      })
    })
  }

  // Draw outline
  if (annotation.hasOutline) {
    const outlineColor = hexToRgb(annotation.outlineColor)
    const outlineRgb = rgb(outlineColor.r / 255, outlineColor.g / 255, outlineColor.b / 255)

    const offsets = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1], [0, 1],
      [1, -1], [1, 0], [1, 1]
    ]

    lines.forEach((line: string, lineIndex: number) => {
      offsets.forEach(([dx, dy]) => {
        page.drawText(line, {
          x: annotation.x + (dx * annotation.outlineWidth),
          y: startY - (lineIndex * lineHeight) + (dy * annotation.outlineWidth),
          size: annotation.fontSize,
          font: font,
          color: outlineRgb,
          opacity: annotation.opacity,
          rotate: degrees(annotation.rotation || 0)
        })
      })
    })
  }

  // Draw main text
  lines.forEach((line: string, index: number) => {
    page.drawText(line, {
      x: annotation.x,
      y: startY - (index * lineHeight),
      size: annotation.fontSize,
      font: font,
      color: rgbColor,
      opacity: annotation.opacity,
      rotate: degrees(annotation.rotation || 0)
    })
  })
}

/**
 * Add sticky note to PDF
 */
async function addNoteToPDF(
  page: any,
  annotation: NoteAnnotation,
  pdfY: number
): Promise<void> {
  // Draw note icon background
  const noteColors: Record<string, { r: number; g: number; b: number }> = {
    yellow: { r: 255, g: 255, b: 136 },
    pink: { r: 255, g: 179, b: 217 },
    blue: { r: 179, g: 217, b: 255 },
    green: { r: 179, g: 255, b: 179 },
    orange: { r: 255, g: 217, b: 179 },
  }

  const color = noteColors[annotation.noteColor]
  const bgColor = rgb(color.r / 255, color.g / 255, color.b / 255)

  // Draw note indicator
  page.drawRectangle({
    x: annotation.x,
    y: pdfY,
    width: 24,
    height: 24,
    color: bgColor,
    opacity: 0.8,
  })

  // Note: PDF.js comment annotations would require more complex PDF structure
  // For now, we just draw a visual indicator
}

/**
 * Add stamp to PDF
 */
async function addStampToPDF(
  page: any,
  annotation: StampAnnotation,
  pdfDoc: PDFDocument,
  pdfY: number
): Promise<void> {
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const color = hexToRgb(annotation.stampColor)
  const rgbColor = rgb(color.r / 255, color.g / 255, color.b / 255)

  // Draw border
  page.drawRectangle({
    x: annotation.x,
    y: pdfY,
    width: annotation.width,
    height: annotation.height,
    borderColor: rgbColor,
    borderWidth: 3,
    opacity: 0,
  })

  // Draw text
  const textSize = 24
  const textWidth = font.widthOfTextAtSize(annotation.stampText, textSize)
  const textX = annotation.x + (annotation.width - textWidth) / 2
  const textY = pdfY + (annotation.height - textSize) / 2

  page.drawText(annotation.stampText, {
    x: textX,
    y: textY,
    size: textSize,
    font: font,
    color: rgbColor,
    rotate: degrees(-15),
    opacity: annotation.opacity,
  })
}

/**
 * Add image to PDF
 */
async function addImageToPDF(
  page: any,
  annotation: ImageAnnotation,
  pdfDoc: PDFDocument,
  pdfY: number
): Promise<void> {
  try {
    // Check if it's a data URL
    if (annotation.imageData.startsWith('data:image/')) {
      const base64Data = annotation.imageData.split(',')[1]
      const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))

      let pdfImage
      if (annotation.imageData.includes('image/png')) {
        pdfImage = await pdfDoc.embedPng(imageBytes)
      } else if (annotation.imageData.includes('image/jpeg') || annotation.imageData.includes('image/jpg')) {
        pdfImage = await pdfDoc.embedJpg(imageBytes)
      } else {
        console.warn('Unsupported image format')
        return
      }

      page.drawImage(pdfImage, {
        x: annotation.x,
        y: pdfY,
        width: annotation.width,
        height: annotation.height,
        opacity: annotation.imageOpacity,
        rotate: degrees(annotation.rotation),
      })
    }
  } catch (error) {
    console.error('Failed to embed image:', error)
  }
}
