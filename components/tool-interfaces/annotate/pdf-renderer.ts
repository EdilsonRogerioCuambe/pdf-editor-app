// PDF rendering utilities using PDF.js

import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import * as pdfjsLib from 'pdfjs-dist'

// Set worker source
if (typeof window !== 'undefined' && 'Worker' in window) {
  // Use https explicitly and specific version to avoid issues
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

/**
 * Load a PDF document from a file
 */
export async function loadPDFDocument(file: File): Promise<PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  return await loadingTask.promise
}

/**
 * Render a PDF page to a canvas
 */
export async function renderPageToCanvas(
  page: PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number = 1
): Promise<void> {
  const viewport = page.getViewport({ scale })
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not get canvas context')
  }

  canvas.width = viewport.width
  canvas.height = viewport.height

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  }

  await page.render(renderContext).promise
}

/**
 * Get page dimensions at a given scale
 */
export function getPageDimensions(page: PDFPageProxy, scale: number = 1) {
  const viewport = page.getViewport({ scale })
  return {
    width: viewport.width,
    height: viewport.height,
  }
}

/**
 * Generate thumbnail for a page
 */
export async function generatePageThumbnail(
  page: PDFPageProxy,
  maxWidth: number = 150
): Promise<string> {
  const viewport = page.getViewport({ scale: 1 })
  const scale = maxWidth / viewport.width
  const thumbnailViewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  if (!context) {
    throw new Error('Could not get canvas context for thumbnail')
  }

  canvas.width = thumbnailViewport.width
  canvas.height = thumbnailViewport.height

  await page.render({
    canvasContext: context,
    viewport: thumbnailViewport,
  }).promise

  return canvas.toDataURL('image/png')
}

/**
 * Get total page count from PDF document
 */
export function getPageCount(pdfDoc: PDFDocumentProxy): number {
  return pdfDoc.numPages
}

/**
 * Clean up PDF document
 */
export async function cleanupPDFDocument(pdfDoc: PDFDocumentProxy): Promise<void> {
  await pdfDoc.destroy()
}

/**
 * Convert canvas coordinates to PDF coordinates
 * PDF coordinates are bottom-up, canvas coordinates are top-down
 */
export function canvasToPDFCoordinates(
  canvasX: number,
  canvasY: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: canvasX,
    y: canvasHeight - canvasY,
  }
}

/**
 * Convert PDF coordinates to canvas coordinates
 */
export function pdfToCanvasCoordinates(
  pdfX: number,
  pdfY: number,
  canvasHeight: number
): { x: number; y: number } {
  return {
    x: pdfX,
    y: canvasHeight - pdfY,
  }
}
