// Annotation types and interfaces for PDF annotation feature

export type AnnotationTool =
  | 'cursor'
  | 'hand'
  | 'highlight'
  | 'draw'
  | 'shape'
  | 'text'
  | 'note'
  | 'stamp'
  | 'image'
  | 'eraser'

export type HighlightStyle = 'solid' | 'underline' | 'strikethrough' | 'squiggly'

export type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow' | 'polygon' | 'cloud'

export type BorderStyle = 'solid' | 'dashed' | 'dotted'

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'orange'

export type StampType =
  | 'approved'
  | 'rejected'
  | 'draft'
  | 'confidential'
  | 'reviewed'
  | 'final'
  | 'copy'
  | 'urgent'
  | 'custom'

// Base annotation interface
export interface BaseAnnotation {
  id: string
  type: 'highlight' | 'draw' | 'shape' | 'text' | 'note' | 'stamp' | 'image'
  pageIndex: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  createdAt: string
  modifiedAt: string
  author: string
  isSelected: boolean
  isEditing: boolean
  isVisible: boolean
}

// Highlight annotation
export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight'
  highlightColor: string
  highlightOpacity: number
  highlightStyle: HighlightStyle
  highlightedText?: string
}

// Drawing stroke
export interface DrawingStroke {
  points: Array<{ x: number; y: number }>
  color: string
  thickness: number
  opacity: number
}

// Drawing annotation
export interface DrawingAnnotation extends BaseAnnotation {
  type: 'draw'
  strokes: DrawingStroke[]
}

// Shape annotation
export interface ShapeAnnotation extends BaseAnnotation {
  type: 'shape'
  shapeType: ShapeType
  borderColor: string
  borderWidth: number
  borderStyle: BorderStyle
  fillColor?: string
  fillOpacity: number
  points?: Array<{ x: number; y: number }> // For lines, arrows, polygons
}

// Text annotation
export interface TextAnnotation extends BaseAnnotation {
  type: 'text'
  content: string
  fontSize: number
  fontFamily: string
  fontWeight: string | number
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing: number

  // Background
  hasBackground: boolean
  backgroundColor: string
  backgroundOpacity: number
  backgroundPadding: number
  backgroundBorderRadius: number

  // Border
  hasBorder: boolean
  borderColor: string
  borderWidth: number
  borderStyle: BorderStyle

  // Shadow
  hasShadow: boolean
  shadowX: number
  shadowY: number
  shadowBlur: number
  shadowColor: string

  // Outline
  hasOutline: boolean
  outlineWidth: number
  outlineColor: string
}

// Sticky note annotation
export interface NoteAnnotation extends BaseAnnotation {
  type: 'note'
  noteColor: NoteColor
  noteTitle: string
  noteContent: string
  noteAuthor: string
  noteTimestamp: string
  noteExpanded: boolean
}

// Stamp annotation
export interface StampAnnotation extends BaseAnnotation {
  type: 'stamp'
  stampType: StampType
  stampText: string
  stampColor: string
}

// Image annotation
export interface ImageAnnotation extends BaseAnnotation {
  type: 'image'
  imageData: string // base64 or URL
  imageOpacity: number
}

// Union type for all annotations
export type Annotation =
  | HighlightAnnotation
  | DrawingAnnotation
  | ShapeAnnotation
  | TextAnnotation
  | NoteAnnotation
  | StampAnnotation
  | ImageAnnotation

// Tool settings interfaces
export interface HighlightSettings {
  color: string
  opacity: number
  style: HighlightStyle
}

export interface DrawSettings {
  color: string
  thickness: number
  opacity: number
}

export interface ShapeSettings {
  shapeType: ShapeType
  borderColor: string
  borderWidth: number
  borderStyle: BorderStyle
  fillColor: string
  fillOpacity: number
}

export interface TextSettings {
  fontSize: number
  fontFamily: string
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
  textDecoration: 'none' | 'underline'
  textColor: string
  textAlign: 'left' | 'center' | 'right'
  backgroundColor: string
  backgroundOpacity: number
}

export interface NoteSettings {
  color: NoteColor
  author: string
}

export interface StampSettings {
  stampType: StampType
  customText?: string
}

export interface ImageSettings {
  opacity: number
}

// Page info interface
export interface PageInfo {
  index: number
  width: number
  height: number
  rotation: number
  thumbnail?: string
  annotationCount: number
}

// Annotation export format
export interface AnnotationExport {
  version: string
  pdfName: string
  exportDate: string
  annotations: Annotation[]
}
