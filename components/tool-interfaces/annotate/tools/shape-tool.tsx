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

    if (settings.shapeType === 'rectangle') {
       ctx.strokeRect(x, y, w, h)
    } else if (settings.shapeType === 'circle') {
       ctx.beginPath()
       ctx.ellipse(x + w/2, y + h/2, Math.abs(w/2), Math.abs(h/2), 0, 0, 2 * Math.PI)
       ctx.stroke()
    }
    // Add logic for other shapes as needed
  }

  const finishShape = (e: React.MouseEvent) => {
    if (!isActive || !isDrawing.current || !startPoint.current) return
    isDrawing.current = false

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const current = getPoint(e)
      const width = Math.abs(current.x - startPoint.current.x)
      const height = Math.abs(current.y - startPoint.current.y)
      const x = Math.min(startPoint.current.x, current.x)
      const y = Math.min(startPoint.current.y, current.y)

      if (width > 5 && height > 5) {
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
