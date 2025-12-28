import { useEffect, useRef, useState } from 'react'
import { generateAnnotationId, getCurrentTimestamp } from '../annotation-utils'
import type { Annotation, HighlightAnnotation, HighlightSettings } from '../types'

interface HighlightToolProps {
  pageIndex: number
  canvas: HTMLCanvasElement | null
  settings: HighlightSettings
  scale: number
  onAddAnnotation: (annotation: Annotation) => void
  isActive: boolean
  author: string
}

export function HighlightTool({
  pageIndex,
  canvas,
  settings,
  scale,
  onAddAnnotation,
  isActive,
  author,
}: HighlightToolProps) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive) {
      setIsDrawing(false)
      setStartPoint(null)
      setCurrentPoint(null)
    }
  }, [isActive])

  const getCoordinates = (e: React.MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 }

    const rect = containerRef.current.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isActive) return

    e.preventDefault()
    setIsDrawing(true)
    const point = getCoordinates(e)
    setStartPoint(point)
    setCurrentPoint(point)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return

    e.preventDefault()
    setCurrentPoint(getCoordinates(e))
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint || !currentPoint) return

    e.preventDefault()
    setIsDrawing(false)

    // Calculate bounding box
    const x = Math.min(startPoint.x, currentPoint.x)
    const y = Math.min(startPoint.y, currentPoint.y)
    const width = Math.abs(currentPoint.x - startPoint.x)
    const height = Math.abs(currentPoint.y - startPoint.y)

    // Only add if dimensions are significant enough
    if (width > 5 && height > 5) {
      const newAnnotation: HighlightAnnotation = {
        id: generateAnnotationId(),
        type: 'highlight',
        pageIndex,
        x,
        y,
        width,
        height,
        rotation: 0,
        opacity: settings.opacity,
        zIndex: 1, // Will be updated by parent
        createdAt: getCurrentTimestamp(),
        modifiedAt: getCurrentTimestamp(),
        author,
        isSelected: true,
        isEditing: false,
        isVisible: true,
        highlightColor: settings.color,
        highlightOpacity: settings.opacity,
        highlightStyle: settings.style,
      }

      onAddAnnotation(newAnnotation)
    }

    setStartPoint(null)
    setCurrentPoint(null)
  }

  const handleMouseLeave = () => {
    if (isDrawing) {
      setIsDrawing(false)
      setStartPoint(null)
      setCurrentPoint(null)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 z-10 ${isActive ? 'cursor-crosshair' : 'pointer-events-none'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Draw current selection rectangle */}
      {isDrawing && startPoint && currentPoint && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(startPoint.x, currentPoint.x) * scale,
            top: Math.min(startPoint.y, currentPoint.y) * scale,
            width: Math.abs(currentPoint.x - startPoint.x) * scale,
            height: Math.abs(currentPoint.y - startPoint.y) * scale,
            backgroundColor: settings.color,
            opacity: settings.opacity,
            pointerEvents: 'none', // Allow events to pass through during drawing if needed
          }}
        />
      )}
    </div>
  )
}
