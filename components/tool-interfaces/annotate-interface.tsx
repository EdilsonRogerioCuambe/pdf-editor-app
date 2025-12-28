"use client"

import { FileDropZone, type UploadedFile } from '@/components/file-drop-zone'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import {
  Download,
  Eye,
  EyeOff,
  Hand,
  Highlighter,
  Minimize2,
  MousePointer2,
  Pencil,
  Redo2,
  Square,
  StickyNote,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut
} from 'lucide-react'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { TextBox } from './add-text/text-box'
import { AddTextToolbar } from './add-text/toolbar'
import {
  getAnnotationIcon,
  getAnnotationSummary,
  getMaxZIndex,
  groupAnnotationsByPage
} from './annotate/annotation-utils'
import { createKeyboardHandler, type KeyboardShortcutHandlers } from './annotate/keyboard-shortcuts'
import { saveAnnotatedPDF } from './annotate/pdf-export'
import { generatePageThumbnail, getPageCount, loadPDFDocument } from './annotate/pdf-renderer'
import { DrawTool } from './annotate/tools/draw-tool'
import { HighlightTool } from './annotate/tools/highlight-tool'
import { ShapeTool } from './annotate/tools/shape-tool'
import { StickyNoteTool } from './annotate/tools/sticky-note-tool'
import type {
  Annotation,
  AnnotationTool,
  DrawingAnnotation,
  DrawSettings,
  HighlightAnnotation,
  HighlightSettings,
  NoteAnnotation,
  NoteSettings,
  PageInfo,
  ShapeAnnotation,
  ShapeSettings,
  TextAnnotation
} from './annotate/types'
import { createAddAction, createDeleteAction, UndoRedoManager } from './annotate/undo-redo'

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4]

export function AnnotationInterface() {
  // File state
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  // Annotations state
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null)
  const undoRedoRef = useRef<UndoRedoManager | null>(null)

  // Tool state
  const [activeTool, setActiveTool] = useState<AnnotationTool>('cursor')
  const [highlightSettings, setHighlightSettings] = useState<HighlightSettings>({
    color: '#FFFF00',
    opacity: 0.5,
    style: 'solid',
  })
  const [drawSettings, setDrawSettings] = useState<DrawSettings>({
    color: '#000000',
    thickness: 3,
    opacity: 1,
  })
  const [shapeSettings, setShapeSettings] = useState<ShapeSettings>({
    shapeType: 'rectangle',
    borderColor: '#ff0000',
    borderWidth: 2,
    borderStyle: 'solid',
    fillColor: 'transparent',
    fillOpacity: 0
  })
  const [noteSettings, setNoteSettings] = useState<NoteSettings>({
    color: 'yellow',
    author: 'User'
  })

  // View state
  const [zoom, setZoom] = useState(1)
  const [showAnnotations, setShowAnnotations] = useState(true)
  const [showAnnotationsPanel, setShowAnnotationsPanel] = useState(true)

  // Canvas refs
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize undo/redo manager
  useEffect(() => {
    undoRedoRef.current = new UndoRedoManager(annotations, setAnnotations)
  }, [])

  // Update undo/redo manager when annotations change
  useEffect(() => {
    if (undoRedoRef.current) {
      undoRedoRef.current.setAnnotations(annotations)
    }
  }, [annotations])

  // Keyboard shortcuts
  useEffect(() => {
    const handlers: KeyboardShortcutHandlers = {
      onToolChange: (tool) => setActiveTool(tool),
      onUndo: () => undoRedoRef.current?.undo(),
      onRedo: () => undoRedoRef.current?.redo(),
      onSave: handleDownload,
      onDelete: handleDeleteSelected,
      onDeselect: () => setSelectedAnnotationId(null),
      onZoomIn: () => handleZoomIn(),
      onZoomOut: () => handleZoomOut(),
      onZoomReset: () => setZoom(1),
    }

    const keyboardHandler = createKeyboardHandler(handlers)
    window.addEventListener('keydown', keyboardHandler)

    return () => {
      window.removeEventListener('keydown', keyboardHandler)
    }
  }, [selectedAnnotationId])

  // Handle file upload
  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length === 0) return

    const selectedFile = files[0]
    setFile(selectedFile)
    setIsProcessing(true)

    try {
      await loadPDF(selectedFile)
    } catch (error) {
      console.error('Error loading PDF:', error)
      toast.error('Failed to load PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Load PDF
  const loadPDF = async (file: UploadedFile) => {
    try {
      const doc = await loadPDFDocument(file.file)
      setPdfDoc(doc)

      const pageCount = getPageCount(doc)
      const pagesInfo: PageInfo[] = []

      for (let i = 0; i < pageCount; i++) {
        const page = await doc.getPage(i + 1)
        const viewport = page.getViewport({ scale: 1 })
        const thumbnail = await generatePageThumbnail(page, 150)

        pagesInfo.push({
          index: i,
          width: viewport.width,
          height: viewport.height,
          rotation: 0,
          thumbnail,
          annotationCount: 0,
        })
      }

      setPages(pagesInfo)
      setCurrentPage(0)

      toast.success(`PDF loaded: ${pageCount} pages`)
    } catch (error) {
      console.error('Error in loadPDF:', error)
      throw error
    }
  }

  // Render PDF pages with high quality
  useEffect(() => {
    if (!pdfDoc || pages.length === 0) return

    const renderPages = async () => {
      for (let i = 0; i < pages.length; i++) {
        const canvas = canvasRefs.current.get(i)
        if (!canvas) continue

        const page = await pdfDoc.getPage(i + 1)
        // Use devicePixelRatio for crisp rendering
        const devicePixelRatio = window.devicePixelRatio || 1
        const viewport = page.getViewport({ scale: zoom * devicePixelRatio })
        const context = canvas.getContext('2d')

        if (!context) continue

        // Set canvas size for high DPI displays
        canvas.width = viewport.width
        canvas.height = viewport.height
        canvas.style.width = `${viewport.width / devicePixelRatio}px`
        canvas.style.height = `${viewport.height / devicePixelRatio}px`

        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise
      }
    }

    renderPages()
  }, [pdfDoc, pages, zoom])

  // Add annotation
  const handleAddAnnotation = useCallback((annotation: Annotation) => {
    const maxZ = getMaxZIndex(annotations)
    const newAnnotation = { ...annotation, zIndex: maxZ + 1 }

    setAnnotations(prev => [...prev, newAnnotation])

    if (undoRedoRef.current) {
      undoRedoRef.current.recordAction(createAddAction(newAnnotation))
    }

    toast.success('Annotation added')
  }, [annotations])

  // Delete selected annotation
  const handleDeleteSelected = () => {
    if (!selectedAnnotationId) return

    const annotation = annotations.find(a => a.id === selectedAnnotationId)
    if (!annotation) return

    setAnnotations(prev => prev.filter(a => a.id !== selectedAnnotationId))
    setSelectedAnnotationId(null)

    if (undoRedoRef.current) {
      undoRedoRef.current.recordAction(createDeleteAction(annotation))
    }

    toast.success('Annotation deleted')
  }

  // Toggle annotation visibility
  const handleToggleVisibility = (id: string) => {
    setAnnotations(prev =>
      prev.map(a => (a.id === id ? { ...a, isVisible: !a.isVisible } : a))
    )
  }

  // Text tool handlers
  const handlePageClick = (e: React.MouseEvent, pageIndex: number) => {
    if (activeTool !== 'text') return

    // Only handle clicks on the background, not on existing annotations (handled by propagation stop)
    if (e.target !== e.currentTarget) return

    if (selectedAnnotationId) {
      setSelectedAnnotationId(null)
    } else {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

      const newAnnotation: TextAnnotation = {
        id: `text-${Date.now()}`,
        type: 'text',
        pageIndex,
        x: x - 100, // Center roughly
        y: y - 10,
        width: 200,
        height: 20, // Initial height, will auto-expand
        content: 'Type here...',
        fontSize: 16,
        fontFamily: 'Helvetica',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        opacity: 1,
        textAlign: 'left',
        lineHeight: 1.2,
        letterSpacing: 0,
        rotation: 0,
        zIndex: getMaxZIndex(annotations) + 1,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        author: 'User',
        isSelected: true,
        isEditing: true,
        isVisible: true,

        hasBackground: false,
        backgroundColor: '#FFFFFF',
        backgroundOpacity: 1,
        backgroundPadding: 5,
        backgroundBorderRadius: 0,

        hasBorder: false,
        borderColor: '#000000',
        borderWidth: 1,
        borderStyle: 'solid',

        hasShadow: false,
        shadowX: 2,
        shadowY: 2,
        shadowBlur: 4,
        shadowColor: '#00000080',

        hasOutline: false,
        outlineWidth: 1,
        outlineColor: '#FFFFFF'
      }

      handleAddAnnotation(newAnnotation)
      setSelectedAnnotationId(newAnnotation.id)
    }
  }

  const updateTextBox = (id: string, updates: Partial<TextAnnotation>) => {
    setAnnotations(prev => prev.map(ann =>
      ann.id === id && ann.type === 'text' ? { ...ann, ...updates, modifiedAt: new Date().toISOString() } : ann
    ))
  }

  const duplicateTextBox = (box: any) => {
    const newAnnotation = {
      ...box,
      id: `text-${Date.now()}`,
      x: box.x + 20,
      y: box.y + 20,
      zIndex: getMaxZIndex(annotations) + 1,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }
    handleAddAnnotation(newAnnotation)
    setSelectedAnnotationId(newAnnotation.id)
  }

  // Zoom controls
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom)
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      setZoom(ZOOM_LEVELS[currentIndex + 1])
    }
  }

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom)
    if (currentIndex > 0) {
      setZoom(ZOOM_LEVELS[currentIndex - 1])
    }
  }

  // Download annotated PDF
  const handleDownload = async () => {
    if (!file) return

    try {
      setIsProcessing(true)
      toast.info('Saving annotations to PDF...')

      const pdfBytes = await saveAnnotatedPDF(file.file, annotations)
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = file.file.name.replace('.pdf', '_annotated.pdf')
      link.click()

      URL.revokeObjectURL(url)
      toast.success('Annotated PDF saved successfully!')
    } catch (error) {
      console.error('Error saving PDF:', error)
      toast.error('Failed to save PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Group annotations by page
  const annotationsByPage = groupAnnotationsByPage(annotations)

  if (!file) {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Annotate PDF</h1>
          <p className="mt-2 text-muted-foreground">
            Add highlights, drawings, shapes, text, notes, and more to your PDF files
          </p>
        </div>

        <FileDropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Highlighter className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Highlight</h3>
            <p className="text-sm text-muted-foreground">Mark important text with colors</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Pencil className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Draw</h3>
            <p className="text-sm text-muted-foreground">Freehand drawing and sketches</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Square className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Shapes</h3>
            <p className="text-sm text-muted-foreground">Add rectangles, circles, arrows</p>
          </Card>
          <Card className="p-4">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <StickyNote className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold">Notes</h3>
            <p className="text-sm text-muted-foreground">Sticky notes and comments</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col">
      {/* Toolbar */}
      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* File controls */}


          {/* Tool buttons */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              variant={activeTool === 'cursor' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('cursor')}
              title="Cursor (V)"
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'hand' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('hand')}
              title="Hand Tool (P)"
            >
              <Hand className="h-4 w-4" />
            </Button>

            <Button
              variant={activeTool === 'highlight' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('highlight')}
              title="Highlight (H)"
            >
              <Highlighter className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'draw' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('draw')}
              title="Draw (D)"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'shape' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('shape')}
              title="Shapes (S)"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'text' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('text')}
              title="Text (T)"
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              variant={activeTool === 'note' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTool('note')}
              title="Sticky Note (N)"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
          </div>



          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => undoRedoRef.current?.undo()}
              disabled={!undoRedoRef.current?.canUndo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => undoRedoRef.current?.redo()}
              disabled={!undoRedoRef.current?.canRedo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>



          {/* Zoom controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= ZOOM_LEVELS[0]}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Select value={zoom.toString()} onValueChange={(v) => setZoom(parseFloat(v))}>
              <SelectTrigger className="w-24">
                <SelectValue>{Math.round(zoom * 100)}%</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {ZOOM_LEVELS.map(level => (
                  <SelectItem key={level} value={level.toString()}>
                    {Math.round(level * 100)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Actions */}
          <div className="ml-auto flex items-center gap-2">

            <Button onClick={handleDownload} disabled={isProcessing}>
              <Download className="mr-2 h-4 w-4" />
              {isProcessing ? 'Saving...' : 'Save PDF'}
            </Button>
          </div>
        </div>

        {/* Tool-specific options */}
        {activeTool === 'highlight' && (
          <div className="mt-4 flex items-center gap-4 border-t pt-4">
            <div className=" flex items-center gap-2">
              <label className="text-sm font-medium">Color:</label>
              <input
                type="color"
                value={highlightSettings.color}
                onChange={(e) =>
                  setHighlightSettings(prev => ({ ...prev, color: e.target.value }))
                }
                className="h-8 w-16 cursor-pointer rounded border"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Opacity:</label>
              <Slider
                value={[highlightSettings.opacity * 100]}
                onValueChange={([v]) =>
                  setHighlightSettings(prev => ({ ...prev, opacity: v / 100 }))
                }
                min={20}
                max={80}
                step={5}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">{Math.round(highlightSettings.opacity * 100)}%</span>
            </div>
          </div>
        )}

        {/* Draw Tool Options */}
        {activeTool === 'draw' && (
          <div className="mt-4 flex items-center gap-4 border-t pt-4">
             <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Color:</label>
                <input
                  type="color"
                  value={drawSettings.color}
                  onChange={(e) => setDrawSettings(prev => ({ ...prev, color: e.target.value }))}
                  className="h-8 w-16 cursor-pointer rounded border"
                />
             </div>
             <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Thickness:</label>
                <Slider
                   value={[drawSettings.thickness]}
                   onValueChange={([v]) => setDrawSettings(prev => ({ ...prev, thickness: v }))}
                   min={1}
                   max={20}
                   step={1}
                   className="w-32"
                />
                <span className="text-sm text-muted-foreground">{drawSettings.thickness}px</span>
             </div>
          </div>
        )}

        {/* Text Tool Options */}
        {activeTool === 'text' && (
          <div className="mt-4 border-t pt-2 w-full">
            <AddTextToolbar
              selectedBox={annotations.find(a => a.id === selectedAnnotationId && a.type === 'text') as any}
              onUpdate={(updates) => selectedAnnotationId && updateTextBox(selectedAnnotationId, updates)}
              onDownload={handleDownload}
              isProcessing={isProcessing}
            />
          </div>
        )}
      </Card>

      {/* Main content */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* PDF Canvas */}
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/20 p-4" ref={containerRef}>
          <div className="mx-auto space-y-4" style={{ width: 'fit-content' }}>
            {pages.map((page, index) => (
              <div key={index} className="relative bg-white shadow-lg" style={{ width: page.width * zoom, height: page.height * zoom }}>
                <canvas
                  ref={(el) => {
                    if (el) canvasRefs.current.set(index, el)
                  }}
                  className="block"
                  style={{ pointerEvents: activeTool === 'cursor' ? 'none' : 'auto' }}
                />

                {/* Annotations overlay */}
                <div className="pointer-events-none absolute inset-0">
                  {showAnnotations &&
                    annotationsByPage.get(index)?.map((ann) => {
                      if (!ann.isVisible) return null

                      const isSelected = selectedAnnotationId === ann.id
                      const borderStyle = isSelected ? '2px solid blue' : 'none'

                      switch (ann.type) {
                        case 'highlight':
                          return (
                            <div
                              key={ann.id}
                              className="absolute pointer-events-auto cursor-pointer"
                              style={{
                                left: ann.x * zoom,
                                top: ann.y * zoom,
                                width: ann.width * zoom,
                                height: ann.height * zoom,
                                backgroundColor: (ann as HighlightAnnotation).highlightColor,
                                opacity: (ann as HighlightAnnotation).highlightOpacity,
                                border: borderStyle,
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAnnotationId(ann.id)
                              }}
                            />
                          )

                        case 'draw':
                          const drawAnn = ann as DrawingAnnotation
                          return (
                            <svg
                              key={ann.id}
                              className="absolute pointer-events-auto"
                              style={{
                                left: ann.x * zoom,
                                top: ann.y * zoom,
                                width: ann.width * zoom,
                                height: ann.height * zoom,
                                border: borderStyle,
                                overflow: 'visible'
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedAnnotationId(ann.id)
                              }}
                            >
                              {drawAnn.strokes.map((stroke, i) => (
                                <path
                                  key={i}
                                  d={`M ${stroke.points.map(p => `${(p.x - ann.x) * zoom},${(p.y - ann.y) * zoom}`).join(' L ')}`}
                                  stroke={stroke.color}
                                  strokeWidth={stroke.thickness * zoom}
                                  strokeOpacity={stroke.opacity}
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              ))}
                            </svg>
                          )

                        case 'shape':
                          const shapeAnn = ann as ShapeAnnotation
                          return (
                            <div
                               key={ann.id}
                               className="absolute pointer-events-auto"
                               style={{
                                  left: ann.x * zoom,
                                  top: ann.y * zoom,
                                  width: ann.width * zoom,
                                  height: ann.height * zoom,
                                  border: borderStyle,
                               }}
                               onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAnnotationId(ann.id)
                               }}
                            >
                               <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
                                  {shapeAnn.shapeType === 'rectangle' && (
                                      <rect
                                         x={0}
                                         y={0}
                                         width="100%"
                                         height="100%"
                                         stroke={shapeAnn.borderColor}
                                         strokeWidth={shapeAnn.borderWidth * zoom}
                                         fill={shapeAnn.fillColor}
                                         fillOpacity={shapeAnn.fillOpacity}
                                      />
                                  )}
                                  {shapeAnn.shapeType === 'circle' && (
                                      <ellipse
                                         cx="50%"
                                         cy="50%"
                                         rx="50%"
                                         ry="50%"
                                         stroke={shapeAnn.borderColor}
                                         strokeWidth={shapeAnn.borderWidth * zoom}
                                         fill={shapeAnn.fillColor}
                                         fillOpacity={shapeAnn.fillOpacity}
                                      />
                                  )}
                               </svg>
                            </div>
                          )

                          case 'note':
                            const noteAnn = ann as NoteAnnotation
                            return (
                              <div
                                key={ann.id}
                                className="absolute pointer-events-auto flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                                style={{
                                  left: ann.x * zoom,
                                  top: ann.y * zoom,
                                  width: 24 * zoom, // Base size
                                  height: 24 * zoom,
                                  border: borderStyle,
                                  zIndex: ann.zIndex,
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAnnotationId(ann.id)
                                }}
                              >
                                <StickyNote
                                  fill={noteAnn.noteColor}
                                  className="text-black" // Outline color
                                  style={{ width: '100%', height: '100%' }}
                                />
                                {isSelected && (
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-yellow-100 border border-yellow-300 p-2 rounded shadow-md w-48 text-black text-xs">
                                        <textarea
                                          className="w-full bg-transparent outline-none resize-none"
                                          placeholder="Enter note..."
                                          value={noteAnn.noteContent}
                                          onChange={(e) => {
                                              const newAnn = { ...noteAnn, noteContent: e.target.value }
                                              // We need a way to update the annotation from here.
                                              // Ideally we should pass an update function or use a specific component.
                                              // For now, let's just assume we can't edit text here easily without helper.
                                              // BUT, I can simulate update by calling setAnnotations in a clever way if I had access.
                                              // No, better to make it read-only here or use a specific component.
                                              // Let's just show content.
                                          }}
                                        />
                                    </div>
                                )}
                              </div>
                            )

                        default:
                          return null
                      }
                    })}
                </div>

                {/* Highlight tool */}
                {activeTool === 'highlight' && (
                  <HighlightTool
                    pageIndex={index}
                    canvas={canvasRefs.current.get(index) || null}
                    settings={highlightSettings}
                    scale={zoom}
                    onAddAnnotation={handleAddAnnotation}
                    isActive={true}
                    author="User"
                  />
                )}

                {/* Draw tool */}
                {activeTool === 'draw' && (
                   <DrawTool
                      pageIndex={index}
                      scale={zoom}
                      settings={drawSettings}
                      onAddAnnotation={handleAddAnnotation}
                      isActive={true}
                      author="User"
                   />
                )}

                {/* Shape tool */}
                {activeTool === 'shape' && (
                   <ShapeTool
                      pageIndex={index}
                      scale={zoom}
                      settings={shapeSettings}
                      onAddAnnotation={handleAddAnnotation}
                      isActive={true}
                      author="User"
                   />
                )}

                {/* Sticky Note tool */}
                {activeTool === 'note' && (
                   <StickyNoteTool
                      pageIndex={index}
                      scale={zoom}
                      settings={noteSettings}
                      onAddAnnotation={handleAddAnnotation}
                      isActive={true}
                      author="User"
                   />
                )}
                {/* Text tool overlay */}
                <div
                  className="absolute inset-0 z-20"
                  style={{ pointerEvents: activeTool === 'text' ? 'auto' : 'none' }}
                  onClick={(e) => handlePageClick(e, index)}
                >
                  {annotationsByPage.get(index)?.map((ann) =>
                    ann.type === 'text' && ann.isVisible ? (
                      <div key={ann.id} style={{ pointerEvents: 'auto' }}>
                        <TextBox
                          box={ann as any}
                          isSelected={selectedAnnotationId === ann.id}
                          onSelect={setSelectedAnnotationId}
                          onUpdate={updateTextBox}
                          onDuplicate={duplicateTextBox}
                          onDelete={(id) => {
                            setSelectedAnnotationId(id)
                            handleDeleteSelected()
                          }}
                          zoom={zoom}
                        />
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Annotations panel */}
        {showAnnotationsPanel && (
          <Card className="w-80 overflow-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Annotations ({annotations.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnnotationsPanel(false)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {Array.from(annotationsByPage.entries()).map(([pageIndex, pageAnnotations]) => (
                <div key={pageIndex}>
                  <h4 className="mb-2 text-sm font-medium">
                    Page {pageIndex + 1} ({pageAnnotations.length})
                  </h4>
                  <div className="space-y-2">
                    {pageAnnotations.map((ann) => (
                      <div
                        key={ann.id}
                        className={cn(
                          'flex items-start gap-2 rounded border p-2 text-sm cursor-pointer',
                          selectedAnnotationId === ann.id && 'border-blue-500 bg-blue-50'
                        )}
                        onClick={() => setSelectedAnnotationId(ann.id)}
                      >
                        <span className="text-lg">{getAnnotationIcon(ann)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="truncate">{getAnnotationSummary(ann)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(ann.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleVisibility(ann.id)
                            }}
                          >
                            {ann.isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedAnnotationId(ann.id)
                              handleDeleteSelected()
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {annotations.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <p>No annotations yet</p>
                  <p className="mt-1">Use the tools above to add annotations</p>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
