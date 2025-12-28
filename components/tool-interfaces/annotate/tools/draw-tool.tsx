"use client"

import { useEffect, useRef } from "react"
import { type DrawingAnnotation, type DrawSettings } from "../types"

interface DrawToolProps {
  pageIndex: number
  scale: number
  settings: DrawSettings
  onAddAnnotation: (annotation: DrawingAnnotation) => void
  isActive: boolean
  author: string
}

export function DrawTool({
  pageIndex,
  scale,
  settings,
  onAddAnnotation,
  isActive,
  author,
}: DrawToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const currentPath = useRef<{ x: number, y: number }[]>([])

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

  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive) return
    isDrawing.current = true
    const point = getPoint(e)
    currentPath.current = [point]

    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.beginPath()
      ctx.moveTo(point.x * scale, point.y * scale)
      ctx.strokeStyle = settings.color
      ctx.lineWidth = settings.thickness * scale
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = settings.opacity
    }
  }

  const draw = (e: React.MouseEvent) => {
    if (!isActive || !isDrawing.current) return

    const point = getPoint(e)
    currentPath.current.push(point)

    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) {
      ctx.lineTo(point.x * scale, point.y * scale)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (!isActive || !isDrawing.current) return
    isDrawing.current = false

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx && currentPath.current.length > 0) {
      // Clear current drawing from temp canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Create annotation
      // Calculate bounds
      const xs = currentPath.current.map(p => p.x)
      const ys = currentPath.current.map(p => p.y)
      const minX = Math.min(...xs)
      const minY = Math.min(...ys)
      const maxX = Math.max(...xs)
      const maxY = Math.max(...ys)

      const annotation: DrawingAnnotation = {
        id: `draw-${Date.now()}`,
        type: 'draw',
        pageIndex,
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        rotation: 0,
        opacity: 1,
        strokes: [{
          points: currentPath.current,
          color: settings.color,
          thickness: settings.thickness,
          opacity: settings.opacity
        }],
        zIndex: 1, // Will be set by parent
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author,
        isSelected: false,
        isEditing: false,
        isVisible: true
      }

      onAddAnnotation(annotation)
      currentPath.current = []
    }
  }

  if (!isActive) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-50 cursor-crosshair touch-none"
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
    />
  )
}
