"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
    ChevronLeft, ChevronRight,
    Download,
    Loader2,
    RefreshCw,
    RotateCcw, RotateCw,
    RotateCcw as Undo2,
    X,
    ZoomIn,
    ZoomOut
} from "lucide-react"
import { PDFDocument, degrees } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

interface PageThumbnail {
  pageIndex: number
  imageUrl: string | null
  width: number
  height: number
  originalRotation: number // The rotation inherent in the PDF file
}

export function RotateInterface() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [pdfProxy, setPdfProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([])
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)

  // Rotations mapped by page index (0-based) -> added rotation (0, 90, 180, 270)
  // This is the VISUAL added rotation.
  const [rotations, setRotations] = useState<Record<number, number>>({})
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Viewer
  const [viewingPageIndex, setViewingPageIndex] = useState<number | null>(null)
  const [viewerScale, setViewerScale] = useState(1.0)
  const viewerCanvasRef = useRef<HTMLCanvasElement>(null)

  const resetState = () => {
    setFile(null)
    setPdfProxy(null)
    setThumbnails([])
    setRotations({})
    setSelectedPages(new Set())
    setIsProcessing(false)
    setProgress(0)
    setViewingPageIndex(null)
  }

  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length === 0) return
    const newFile = files[0]

    try {
      setLoadingThumbnails(true)
      setFile(newFile)

      const arrayBuffer = await newFile.file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      setPdfProxy(pdf)

      const pageCount = pdf.numPages
      const newThumbnails: PageThumbnail[] = []

      const SCALE = 0.5

      for (let i = 0; i < pageCount; i++) {
        try {
          const page = await pdf.getPage(i + 1)
          const viewport = page.getViewport({ scale: SCALE })

          // Render to canvas
          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context!,
            viewport: viewport
          }).promise

          newThumbnails.push({
            pageIndex: i,
            imageUrl: canvas.toDataURL("image/jpeg", 0.8),
            width: viewport.width,
            height: viewport.height,
            originalRotation: page.rotate // The rotation metadata in the PDF
          })

          // Update in chunks
          if (i % 5 === 0 || i === pageCount - 1) {
             setThumbnails([...newThumbnails])
          }

        } catch (err) {
          console.error(`Error rendering page ${i + 1}`, err)
        }
      }

    } catch (error) {
      console.error("Error loading PDF", error)
      toast.error("Failed to load PDF. Please try another file.")
      resetState()
    } finally {
      setLoadingThumbnails(false)
    }
  }

  // selection logic
  const togglePageSelection = (index: number) => {
    const newSet = new Set(selectedPages)
    if (newSet.has(index)) newSet.delete(index)
    else newSet.add(index)
    setSelectedPages(newSet)
  }

  const selectAll = () => {
     if (!pdfProxy) return
     const newSet = new Set<number>()
     for(let i=0; i<pdfProxy.numPages; i++) newSet.add(i)
     setSelectedPages(newSet)
  }

  const deselectAll = () => setSelectedPages(new Set())

  // Rotation Logic
  const normalizeRotation = (deg: number) => {
     return ((deg % 360) + 360) % 360
  }

  const rotatePage = (index: number, degrees: number) => {
      setRotations(prev => ({
          ...prev,
          [index]: normalizeRotation((prev[index] || 0) + degrees)
      }))
  }

  const rotateSelected = (degrees: number) => {
      if (selectedPages.size === 0) {
          toast.info("Please select pages first")
          return
      }
      setRotations(prev => {
          const next = { ...prev }
          selectedPages.forEach(idx => {
              next[idx] = normalizeRotation((next[idx] || 0) + degrees)
          })
          return next
      })
      toast.success(`Rotated ${selectedPages.size} pages`)
  }

  const rotateAll = (degrees: number) => {
      if (!pdfProxy) return
      setRotations(prev => {
          const next = { ...prev }
          for(let i=0; i<pdfProxy.numPages; i++) {
              next[i] = normalizeRotation((next[i] || 0) + degrees)
          }
          return next
      })
      toast.success("Rotated all pages")
  }

  const resetRotations = () => {
      setRotations({})
      toast.success("Reset all rotations")
  }

  // Saving
  const handleSave = async () => {
      if (!file || !pdfProxy) return

      const modifiedCount = Object.values(rotations).filter(r => r !== 0).length
      if (modifiedCount === 0) {
          toast.info("No pages have been rotated yet.")
          return
      }

      try {
          setIsProcessing(true)
          setProgress(0)

          const fileBytes = await file.file.arrayBuffer()
          const pdfDoc = await PDFDocument.load(fileBytes)
          const pages = pdfDoc.getPages()

          for (let i = 0; i < pages.length; i++) {
              const addedRotation = rotations[i] || 0
              if (addedRotation !== 0) {
                  const page = pages[i]
                  const currentRotation = page.getRotation().angle
                  page.setRotation(degrees(normalizeRotation(currentRotation + addedRotation)))
              }
              setProgress(Math.round(((i + 1) / pages.length) * 80))
          }

          setProgress(90)
          const pdfBytes = await pdfDoc.save()

          const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `rotated-${file.name}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)

          setProgress(100)
          toast.success("PDF saved successfully!")

      } catch (err) {
          console.error("Save error", err)
          toast.error("Failed to save PDF")
      } finally {
          setIsProcessing(false)
      }
  }

  // Full Screen Preview Renderer
  const renderViewerPage = useCallback(async () => {
    if (!pdfProxy || viewingPageIndex === null || !viewerCanvasRef.current) return

    try {
      const page = await pdfProxy.getPage(viewingPageIndex + 1)
      const viewport = page.getViewport({ scale: viewerScale })
      const canvas = viewerCanvasRef.current
      const context = canvas.getContext("2d")

      // Handle canvas dimension swapping for preview if needed?
      // Actually, standard PDF.js render + CSS rotate is easiest for preview too.
      // But if we want high quality, we might want to render with rotation.
      // For now, let's just render normally and rotate with CSS to match thumbnail experience.

      canvas.width = viewport.width
      canvas.height = viewport.height

      await page.render({
        canvasContext: context!,
        viewport: viewport
      }).promise

    } catch (e) {
      console.error("Viewer render error", e)
    }
  }, [pdfProxy, viewingPageIndex, viewerScale])

  useEffect(() => {
    if (viewingPageIndex !== null) {
      // Give the Dialog a moment to mount the canvas
      const timer = setTimeout(() => {
        renderViewerPage()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [viewingPageIndex, renderViewerPage])

  if (!file) {
      return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">Rotate PDF</h2>
                 <p className="text-muted-foreground">Rotate individual pages or the entire document permanently.</p>
             </div>
             <FileDropZone
                onFilesSelected={handleFileSelected}
                accept=".pdf"
                multiple={false}
                maxFiles={1}
            />
        </div>
      )
  }

  const modifiedPagesCount = Object.values(rotations).filter(r => r !== 0).length

  return (
    <div className="space-y-6 h-full flex flex-col">
       {/* Actions Bar */}
       <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-4">
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                   <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                   </h3>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                       <span>{pdfProxy?.numPages} pages</span>
                       <span>•</span>
                       <span>{modifiedPagesCount} modified</span>
                   </div>
               </div>

               <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSave} disabled={isProcessing || modifiedPagesCount === 0} className="w-full md:w-auto">
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                        Save PDF
                    </Button>
               </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center gap-4 pt-2 border-t">
               <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Selected ({selectedPages.size}):</span>
                    <div className="flex bg-muted/50 rounded-lg p-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => rotateSelected(-90)} disabled={selectedPages.size === 0} title="Rotate Left">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => rotateSelected(90)} disabled={selectedPages.size === 0} title="Rotate Right">
                             <RotateCw className="h-4 w-4" />
                        </Button>
                        <div className="w-px bg-border mx-1" />
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => rotateSelected(180)} disabled={selectedPages.size === 0} title="Rotate 180">
                             <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
               </div>

               <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">All Pages:</span>
                     <div className="flex bg-muted/50 rounded-lg p-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => rotateAll(-90)} title="Rotate All Left">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => rotateAll(90)} title="Rotate All Right">
                             <RotateCw className="h-4 w-4" />
                        </Button>
                        <div className="w-px bg-border mx-1" />
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive" onClick={resetRotations} title="Reset All">
                             <Undo2 className="h-4 w-4" />
                        </Button>
                    </div>
               </div>

               <div className="flex-1" />

               <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={selectAll}>Select All</Button>
                   <Button variant="outline" size="sm" onClick={deselectAll}>Deselect</Button>
               </div>
           </div>
       </div>

       {isProcessing && (
           <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
               <div className="flex justify-between text-xs text-muted-foreground">
                   <span>Processing...</span>
                   <span>{progress}%</span>
               </div>
               <Progress value={progress} className="h-2" />
           </div>
       )}

       {/* Grid */}
       <div className="bg-muted/10 rounded-xl border p-4 flex-1 overflow-y-auto min-h-[500px]">
           {loadingThumbnails && thumbnails.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                   <Loader2 className="w-8 h-8 animate-spin mb-4" />
                   <p>Rendering pages...</p>
               </div>
           ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 pb-10">
                   {thumbnails.map((page, idx) => (
                       <div
                          key={idx}
                          className={cn(
                             "relative group flex flex-col gap-2 rounded-lg p-3 transition-all",
                             selectedPages.has(idx) ? "bg-primary/5 ring-1 ring-primary" : "bg-card border hover:border-primary/50"
                          )}
                       >
                           {/* Quick Actions Overlay */}
                           <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm p-1">
                               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); rotatePage(idx, -90) }} title="Rotate Left">
                                   <RotateCcw className="h-3 w-3" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); rotatePage(idx, 90) }} title="Rotate Right">
                                   <RotateCw className="h-3 w-3" />
                               </Button>
                               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setViewingPageIndex(idx) }} title="Zoom">
                                   <ZoomIn className="h-3 w-3" />
                               </Button>
                           </div>

                           {/* Selection Checkbox */}
                           <div className="absolute top-3 left-3 z-20">
                               <Checkbox
                                  checked={selectedPages.has(idx)}
                                  onCheckedChange={() => togglePageSelection(idx)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary bg-background shadow-sm"
                               />
                           </div>

                           {/* Thumbnail Container */}
                           <div
                              className="aspect-[3/4] relative flex items-center justify-center overflow-hidden bg-muted/20 rounded-md cursor-pointer"
                              onClick={() => togglePageSelection(idx)}
                           >
                               <div
                                  className="transition-transform duration-300 ease-in-out w-full h-full flex items-center justify-center"
                                  style={{ transform: `rotate(${rotations[idx] || 0}deg)` }}
                               >
                                   {page.imageUrl ? (
                                       // eslint-disable-next-line @next/next/no-img-element
                                       <img
                                         src={page.imageUrl}
                                         alt={`Page ${idx + 1}`}
                                         className={cn(
                                             "object-contain shadow-sm max-w-full max-h-full transition-all duration-300",
                                             // If rotated 90 or 270, we might need to adjust logic if we want "contain",
                                             // but simple CSS rotate usually works fine for square-ish containers.
                                             // For rectangular, it might clip.
                                             // Let's trust object-contain + flex center handles it reasonable well visually.
                                             (rotations[idx] || 0) % 180 !== 0 ? "scale-[0.7]" : "scale-100"
                                             // Scale down slightly on 90deg rotation to prevent clipping in portrait container if page is also portrait
                                         )}
                                         loading="lazy"
                                       />
                                   ) : (
                                       <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                                   )}
                               </div>
                           </div>

                           {/* Footer Info */}
                           <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                               <span className="font-medium">Page {idx + 1}</span>
                               {(rotations[idx] && rotations[idx] !== 0) && (
                                   <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
                                       {rotations[idx]}°
                                   </Badge>
                               )}
                           </div>
                       </div>
                   ))}
               </div>
           )}
       </div>

       {/* Mobile Zoom Modal/Viewer */}
       <Dialog open={viewingPageIndex !== null} onOpenChange={(open) => !open && setViewingPageIndex(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogTitle className="sr-only">PDF Page Preview</DialogTitle>
                <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/10 shrink-0">
                    <span className="font-medium">Page {viewingPageIndex !== null ? viewingPageIndex + 1 : 0} of {pdfProxy?.numPages}</span>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setViewerScale(s => Math.max(0.5, s - 0.25))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-xs w-12 text-center">{Math.round(viewerScale * 100)}%</span>
                        <Button variant="ghost" size="icon" onClick={() => setViewerScale(s => Math.min(3, s + 0.25))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-4 bg-border mx-2" />
                         <Button variant="ghost" size="icon" onClick={() => setViewingPageIndex(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-8 relative">
                   {viewingPageIndex !== null && (
                      <div
                        className="relative shadow-lg ring-1 ring-black/5 transition-transform duration-300"
                         style={{ transform: `rotate(${rotations[viewingPageIndex] || 0}deg)` }}
                      >
                        <canvas ref={viewerCanvasRef} className="bg-white block" />
                      </div>
                   )}

                    {viewingPageIndex !== null && (
                        <>
                             {/* Nav buttons positioned fixed relative to modal container to ignore rotation */}
                             <Button
                                variant="secondary"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 shadow-lg z-50"
                                disabled={viewingPageIndex <= 0}
                                onClick={() => setViewingPageIndex(i => (i !== null ? i - 1 : 0))}
                             >
                                <ChevronLeft className="h-5 w-5" />
                             </Button>

                             <Button
                                variant="secondary"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 shadow-lg z-50"
                                disabled={viewingPageIndex >= (pdfProxy?.numPages || 0) - 1}
                                onClick={() => setViewingPageIndex(i => (i !== null ? i + 1 : 0))}
                             >
                                <ChevronRight className="h-5 w-5" />
                             </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    </div>
  )
}
