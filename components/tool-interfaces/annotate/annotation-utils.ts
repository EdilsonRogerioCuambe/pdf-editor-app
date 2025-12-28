// Annotation utility functions

import type { Annotation, HighlightAnnotation, NoteAnnotation, ShapeAnnotation, StampAnnotation, TextAnnotation } from './types'

/**
 * Generate unique annotation ID
 */
export function generateAnnotationId(): string {
  return `annotation-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Check if a point is inside an annotation
 */
export function isPointInAnnotation(
  x: number,
  y: number,
  annotation: Annotation
): boolean {
  return (
    x >= annotation.x &&
    x <= annotation.x + annotation.width &&
    y >= annotation.y &&
    y <= annotation.y + annotation.height
  )
}

/**
 * Check if two annotations overlap
 */
export function annotationsOverlap(a: Annotation, b: Annotation): boolean {
  if (a.pageIndex !== b.pageIndex) return false

  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  )
}

/**
 * Constrain annotation to page bounds
 */
export function constrainToBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  pageWidth: number,
  pageHeight: number
): { x: number; y: number; width: number; height: number } {
  const constrainedX = Math.max(0, Math.min(x, pageWidth - width))
  const constrainedY = Math.max(0, Math.min(y, pageHeight - height))
  const constrainedWidth = Math.min(width, pageWidth - constrainedX)
  const constrainedHeight = Math.min(height, pageHeight - constrainedY)

  return {
    x: constrainedX,
    y: constrainedY,
    width: constrainedWidth,
    height: constrainedHeight,
  }
}

/**
 * Get annotation bounds (including rotation)
 */
export function getAnnotationBounds(annotation: Annotation): {
  x: number
  y: number
  width: number
  height: number
} {
  // For now, we don't handle rotation
  // In a full implementation, this would calculate rotated bounding box
  return {
    x: annotation.x,
    y: annotation.y,
    width: annotation.width,
    height: annotation.height,
  }
}

/**
 * Sort annotations by z-index
 */
export function sortAnnotationsByZIndex(annotations: Annotation[]): Annotation[] {
  return [...annotations].sort((a, b) => a.zIndex - b.zIndex)
}

/**
 * Get highest z-index from annotations
 */
export function getMaxZIndex(annotations: Annotation[]): number {
  if (annotations.length === 0) return 0
  return Math.max(...annotations.map(a => a.zIndex))
}

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

/**
 * Convert RGB to hex color
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Serialize annotations to JSON
 */
export function serializeAnnotations(annotations: Annotation[]): string {
  return JSON.stringify(annotations, null, 2)
}

/**
 * Deserialize annotations from JSON
 */
export function deserializeAnnotations(json: string): Annotation[] {
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      return parsed as Annotation[]
    }
    return []
  } catch (error) {
    console.error('Failed to deserialize annotations:', error)
    return []
  }
}

/**
 * Group annotations by page
 */
export function groupAnnotationsByPage(
  annotations: Annotation[]
): Map<number, Annotation[]> {
  const grouped = new Map<number, Annotation[]>()

  for (const annotation of annotations) {
    const pageAnnotations = grouped.get(annotation.pageIndex) || []
    pageAnnotations.push(annotation)
    grouped.set(annotation.pageIndex, pageAnnotations)
  }

  return grouped
}

/**
 * Get annotation summary text
 */
export function getAnnotationSummary(annotation: Annotation): string {
  switch (annotation.type) {
    case 'highlight':
      return (annotation as HighlightAnnotation).highlightedText?.substring(0, 50) || 'Highlight'
    case 'text':
      return (annotation as TextAnnotation).content.substring(0, 50) || 'Text'
    case 'note':
      return (annotation as NoteAnnotation).noteTitle || 'Sticky Note'
    case 'stamp':
      return (annotation as StampAnnotation).stampText
    case 'draw':
      return 'Drawing'
    case 'shape':
      return `${(annotation as ShapeAnnotation).shapeType} Shape`
    case 'image':
      return 'Image'
    default:
      return annotation.type
  }
}

/**
 * Get annotation icon emoji
 */
export function getAnnotationIcon(annotation: Annotation): string {
  switch (annotation.type) {
    case 'highlight':
      return '🖍️'
    case 'draw':
      return '✏️'
    case 'shape':
      return '⬜'
    case 'text':
      return 'T'
    case 'note':
      return '📝'
    case 'stamp':
      return '📌'
    case 'image':
      return '🖼️'
    default:
      return '•'
  }
}

/**
 * Clone annotation
 */
export function cloneAnnotation(annotation: Annotation): Annotation {
  return JSON.parse(JSON.stringify(annotation))
}

/**
 * Update annotation
 */
export function updateAnnotation(
  annotation: Annotation,
  updates: Partial<Annotation>
): Annotation {
  return {
    ...annotation,
    ...updates,
    modifiedAt: getCurrentTimestamp(),
  }
}
