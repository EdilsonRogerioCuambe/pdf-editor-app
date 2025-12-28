"use client"

import { useEffect, useRef } from "react"
import { type ShapeAnnotation, type ShapeSettings } from "../types"

interface ShapeToolProps {
  pageIndex: number
  scale: number
  settings: ShapeSettings
  onAddAnnotation: (annotation: ShapeAnnotation) => void
  isActive: boolean
  author: string
}

export function ShapeTool({
  pageIndex,
  scale,
  settings,
  onAddAnnotation,
  isActive,
  author,
}: ShapeToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const startPoint = useRef<{ x: number, y: number } | null>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isActive) return

    const parent = canvas.parentElement
    if (parent) {
      canvas.width = parent.clientWidth
      canvas.height = parent.clientHeight
    }
  }, [isActive])

  const getPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    }
  }

  const startShape = (e: React.MouseEvent) => {
    if (!isActive) return
    isDrawing.current = true
    startPoint.current = getPoint(e)
  }

  const drawPreview = (e: React.MouseEvent) => {
    if (!isActive || !isDrawing.current || !startPoint.current) return

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const current = getPoint(e)
    const x = startPoint.current.x * scale
    const y = startPoint.current.y * scale
    const w = (current.x - startPoint.current.x) * scale
    const h = (current.y - startPoint.current.y) * scale

    // Clear and draw preview
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = settings.borderColor
    ctx.lineWidth = settings.borderWidth * scale
    ctx.fillStyle = settings.fillColor
    ctx.globalAlpha = settings.fillOpacity // This applies to stroke too? Ideally only fill.
    // Actually canvas globalAlpha applies to everything.
    // For stroke opacity we might need rgba color if we want separate opacity.
    // For now simple implementation.

    ctx.beginPath()

    if (settings.shapeType === 'rectangle') {
       ctx.rect(x, y, w, h)
       ctx.stroke()
       if (settings.fillOpacity > 0) ctx.fill()
    } else if (settings.shapeType === 'circle') {
       ctx.ellipse(x + w/2, y + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI)
       ctx.stroke()
       if (settings.fillOpacity > 0) ctx.fill()
    } else if (settings.shapeType === 'triangle') {
        ctx.moveTo(x + w / 2, y)
        ctx.lineTo(x + w, y + h)
        ctx.lineTo(x, y + h)
        ctx.closePath()
        ctx.stroke()
        if (settings.fillOpacity > 0) ctx.fill()
    } else if (settings.shapeType === 'line' || settings.shapeType === 'arrow') {
        ctx.moveTo(x, y)
        ctx.lineTo(current.x * scale, current.y * scale)
        ctx.stroke()
        // For arrow preview, maybe draw a simple head
        if (settings.shapeType === 'arrow') {
            // Simple arrow head logic could be complex for preview, skip for now or keep simple
        }
    }
  }

  const finishShape = (e: React.MouseEvent) => {
    if (!isActive || !isDrawing.current || !startPoint.current) return
    isDrawing.current = false

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const current = getPoint(e)

      let x, y, width, height, points;

      if (settings.shapeType === 'line' || settings.shapeType === 'arrow') {
          // For line/arrow, we use the points
          points = [startPoint.current, current]
          const xs = points.map(p => p.x)
          const ys = points.map(p => p.y)
          x = Math.min(...xs)
          y = Math.min(...ys)
          width = Math.max(...xs) - x
          height = Math.max(...ys) - y
      } else {
          width = Math.abs(current.x - startPoint.current.x)
          height = Math.abs(current.y - startPoint.current.y)
          x = Math.min(startPoint.current.x, current.x)
          y = Math.min(startPoint.current.y, current.y)
      }

      if (width > 5 || height > 5) {
        const annotation: ShapeAnnotation = {
          id: `shape-${Date.now()}`,
          type: 'shape',
          pageIndex,
          x,
          y,
          width,
          height,
          rotation: 0,
          opacity: 1,

          shapeType: settings.shapeType,
          borderColor: settings.borderColor,
          borderWidth: settings.borderWidth,
          borderStyle: settings.borderStyle,
          fillColor: settings.fillColor,
          fillOpacity: settings.fillOpacity,
          points,

          zIndex: 1,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          author,
          isSelected: true,
          isEditing: false,
          isVisible: true
        }

        onAddAnnotation(annotation)
      }
    }
    startPoint.current = null
  }

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-50 cursor-crosshair touch-none"
      onMouseDown={startShape}
      onMouseMove={drawPreview}
      onMouseUp={finishShape}
      onMouseLeave={finishShape}
    />
  )
}
