"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Download,
    Loader2,
    RotateCcw,
    Trash2,
    X,
    ZoomIn,
    ZoomOut
} from "lucide-react"
import { PDFDocument } from "pdf-lib"
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
}

export function DeleteInterface() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [pdfProxy, setPdfProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([])
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)

  // Sets of page indices
  const [pagesToDelete, setPagesToDelete] = useState<Set<number>>(new Set())
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())

  // Range Input
  const [rangeInput, setRangeInput] = useState("")

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Viewer
  const [viewingPageIndex, setViewingPageIndex] = useState<number | null>(null)
  const [viewerScale, setViewerScale] = useState(1.0)
  const viewerCanvasRef = useRef<HTMLCanvasElement>(null)

  const resetState = () => {
    setFile(null)
    setPdfProxy(null)
    setThumbnails([])
    setPagesToDelete(new Set())
    setSelectedPages(new Set())
    setIsProcessing(false)
    setProgress(0)
    setRangeInput("")
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

          const canvas = document.createElement("canvas")
          const context = canvas.getContext("2d")
          canvas.height = viewport.height
          canvas.width = viewport.width

          await page.render({
            canvasContext: context!,
            viewport: viewport,
          }).promise

          newThumbnails.push({
            pageIndex: i,
            imageUrl: canvas.toDataURL("image/jpeg", 0.8),
            width: viewport.width,
            height: viewport.height,
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

  // --- Deletion Logic ---

  const togglePageDeletion = (index: number) => {
    const newSet = new Set(pagesToDelete)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setPagesToDelete(newSet)
  }

  const deleteSelected = () => {
    if (selectedPages.size === 0) {
        toast.info("No pages selected")
        return
    }
    const newSet = new Set(pagesToDelete)
    selectedPages.forEach(idx => newSet.add(idx))
    setPagesToDelete(newSet)
    setSelectedPages(new Set()) // Clear selection after action? Or keep it? Let's clear for clarity.
    toast.success(`Marked ${selectedPages.size} pages for deletion`)
  }

  const keepOnlySelected = () => {
      if (selectedPages.size === 0) {
          toast.info("No pages selected to keep")
          return
      }
      if (!pdfProxy) return

      const newSet = new Set<number>()
      for(let i=0; i < pdfProxy.numPages; i++) {
          if (!selectedPages.has(i)) {
              newSet.add(i)
          }
      }
      setPagesToDelete(newSet)
      toast.success(`Marked ${newSet.size} pages for deletion`)
  }

  const deleteEvenPages = () => {
      if (!pdfProxy) return
      const newSet = new Set(pagesToDelete)
      for(let i=0; i < pdfProxy.numPages; i++) {
          if ((i + 1) % 2 === 0) newSet.add(i)
      }
      setPagesToDelete(newSet)
      toast.success("Marked all even pages for deletion")
  }

  const deleteOddPages = () => {
      if (!pdfProxy) return
      const newSet = new Set(pagesToDelete)
      for(let i=0; i < pdfProxy.numPages; i++) {
          if ((i + 1) % 2 !== 0) newSet.add(i)
      }
      setPagesToDelete(newSet)
      toast.success("Marked all odd pages for deletion")
  }

  const undoAllDeletions = () => {
      setPagesToDelete(new Set())
      toast.success("Restored all pages")
  }

  // Range Logic
  const parseRange = (str: string, max: number): number[] => {
      const result: number[] = []
      const parts = str.split(",")
      for(const part of parts) {
          const trimmed = part.trim()
          if(trimmed.includes("-")) {
              const [start, end] = trimmed.split("-").map(Number)
              if(!isNaN(start) && !isNaN(end)) {
                  for(let i=start; i<=end; i++) {
                      if(i >= 1 && i <= max) result.push(i-1)
                  }
              }
          } else {
              const num = Number(trimmed)
              if(!isNaN(num) && num >= 1 && num <= max) result.push(num-1)
          }
      }
      return result
  }

  const handleDeleteRange = () => {
      if (!rangeInput || !pdfProxy) return
      const indices = parseRange(rangeInput, pdfProxy.numPages)
      if (indices.length === 0) {
          toast.error("Invalid range or no pages found")
          return
      }
      const newSet = new Set(pagesToDelete)
      indices.forEach(idx => newSet.add(idx))
      setPagesToDelete(newSet)
      setRangeInput("")
      toast.success(`Marked ${indices.length} pages from range`)
  }

  // --- Selection Logic ---
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

  const invertSelection = () => {
      if (!pdfProxy) return
      const newSet = new Set<number>()
      for(let i=0; i<pdfProxy.numPages; i++) {
          if(!selectedPages.has(i)) newSet.add(i)
      }
      setSelectedPages(newSet)
  }

  // --- Save Logic ---

  const handleSaveClick = () => {
      if (!pdfProxy) return
      if (pagesToDelete.size === 0) {
          toast.info("No pages marked for deletion")
          return
      }
      if (pagesToDelete.size >= pdfProxy.numPages) {
          toast.error("Cannot delete all pages. At least one page must remain.")
          return
      }
      setShowConfirmModal(true)
  }

  const executeSave = async () => {
    if (!file || !pdfProxy) return
    setShowConfirmModal(false)

    try {
        setIsProcessing(true)
        setProgress(0)

        // Load orig
        const fileBytes = await file.file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(fileBytes)

        // Create new
        const newPdfDoc = await PDFDocument.create()

        // Determine pages to keep
        const pagesToKeep: number[] = []
        for(let i=0; i < pdfDoc.getPageCount(); i++) {
            if (!pagesToDelete.has(i)) {
                pagesToKeep.push(i)
            }
        }

        // Copy pages
        const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToKeep)
        copiedPages.forEach(page => newPdfDoc.addPage(page))

        setProgress(80)

        // Save
        const pdfBytes = await newPdfDoc.save()

        const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `edited-${file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setProgress(100)
        toast.success(`Successfully removed ${pagesToDelete.size} pages`)

    } catch (err) {
        console.error("Deletion error", err)
        toast.error("Failed to save PDF")
    } finally {
        setIsProcessing(false)
    }
  }

  // --- Viewer Logic (Duplicate from Rotate/Split basically)
  const renderViewerPage = useCallback(async () => {
    if (!pdfProxy || viewingPageIndex === null || !viewerCanvasRef.current) return
    try {
      const page = await pdfProxy.getPage(viewingPageIndex + 1)
      const viewport = page.getViewport({ scale: viewerScale })
      const canvas = viewerCanvasRef.current
      const context = canvas.getContext("2d")
      canvas.width = viewport.width
      canvas.height = viewport.height
      await page.render({ canvasContext: context!, viewport }).promise
    } catch (e) {
      console.error("Viewer render error", e)
    }
  }, [pdfProxy, viewingPageIndex, viewerScale])

  useEffect(() => {
    if (viewingPageIndex !== null) {
      const timer = setTimeout(() => renderViewerPage(), 50)
      return () => clearTimeout(timer)
    }
  }, [viewingPageIndex, renderViewerPage])


  if (!file) {
      return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">Delete Pages</h2>
                 <p className="text-muted-foreground">Remove specific pages from your PDF document.</p>
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

  const totalPages = pdfProxy?.numPages || 0
  const remainingPages = totalPages - pagesToDelete.size

  return (
    <div className="space-y-6 h-full flex flex-col">
       {/* Actions Bar */}
       <div className="bg-card border rounded-xl p-4 shadow-sm flex flex-col gap-4">
           {/* Top Row: File Info & Main Actions */}
           <div className="flex flex-col md:flex-row items-center justify-between gap-4">
               <div>
                   <h3 className="font-semibold text-lg flex items-center gap-2">
                      <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                   </h3>
                   <div className="flex items-center gap-3 text-sm mt-1">
                       <span className="text-muted-foreground">{totalPages} total</span>
                       <span className="text-destructive font-medium">• {pagesToDelete.size} to delete</span>
                       <span className="text-success font-medium">• {remainingPages} remaining</span>
                   </div>
               </div>

               <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                       disabled={pagesToDelete.size === 0}
                       variant="outline"
                       onClick={undoAllDeletions}
                       title="Restore all pages"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Undo All
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleSaveClick}
                        disabled={isProcessing || pagesToDelete.size === 0 || remainingPages < 1}
                        className="flex-1 md:flex-none"
                    >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                        Save PDF
                    </Button>
               </div>
           </div>

           {/* Bottom Row: Toolbars */}
           <div className="flex flex-col lg:flex-row gap-4 pt-2 border-t">
               {/* Selection Group */}
               <div className="flex flex-wrap items-center gap-2 border-r pr-4 mr-2">
                   <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
                       <Button variant="ghost" size="sm" onClick={selectAll} title="Select All">All</Button>
                       <Button variant="ghost" size="sm" onClick={deselectAll} title="Deselect All">None</Button>
                       <Button variant="ghost" size="sm" onClick={invertSelection} title="Invert Selection">Inv</Button>
                   </div>
               </div>

               {/* Bulk Actions Group */}
               <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={deleteSelected}
                        disabled={selectedPages.size === 0}
                        className="text-destructive hover:text-destructive"
                    >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Delete Selected ({selectedPages.size})
                    </Button>

                    <div className="h-6 w-px bg-border mx-1" />

                    <Button variant="ghost" size="sm" onClick={deleteEvenPages}>Even</Button>
                    <Button variant="ghost" size="sm" onClick={deleteOddPages}>Odd</Button>
               </div>

               <div className="flex-1" />

               {/* Range Input */}
               <div className="flex items-center gap-2 max-w-[300px]">
                   <span className="text-xs font-medium whitespace-nowrap">Range:</span>
                   <Input
                      placeholder="e.g. 1-5, 8"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      className="h-8 text-xs"
                   />
                   <Button variant="secondary" size="sm" onClick={handleDeleteRange}>
                       Delete
                   </Button>
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
                   {thumbnails.map((page, idx) => {
                       const isDeleted = pagesToDelete.has(idx)
                       const isSelected = selectedPages.has(idx)

                       return (
                           <div
                              key={idx}
                              className={cn(
                                 "relative group flex flex-col gap-2 rounded-lg p-3 transition-all duration-200 border",
                                 isDeleted
                                    ? "bg-destructive/5 border-destructive/50 opacity-80"
                                    : isSelected
                                        ? "bg-primary/5 border-primary"
                                        : "bg-card border-border hover:border-primary/50"
                              )}
                           >
                               {/* Controls Overlay */}
                               <div className="absolute top-3 right-3 z-20 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm rounded-md shadow-sm p-1">
                                   <Button
                                       size="icon"
                                       variant={isDeleted ? "secondary" : "destructive"}
                                       className="h-7 w-7"
                                       onClick={(e) => { e.stopPropagation(); togglePageDeletion(idx) }}
                                       title={isDeleted ? "Restore Page" : "Delete Page"}
                                   >
                                       {isDeleted ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                                   </Button>
                                   <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setViewingPageIndex(idx) }} title="Zoom">
                                       <ZoomIn className="h-3.5 w-3.5" />
                                   </Button>
                               </div>

                               {/* Checkbox */}
                               <div className="absolute top-3 left-3 z-20">
                                   <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => togglePageSelection(idx)}
                                      className={cn(
                                          "shadow-sm bg-background",
                                          isSelected ? "data-[state=checked]:bg-primary" : ""
                                      )}
                                   />
                               </div>

                               {/* Deleted Badge Overlay */}
                               {isDeleted && (
                                   <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                                       <div className="bg-destructive/90 text-destructive-foreground px-3 py-1 rounded-md text-xs font-bold shadow-lg transform -rotate-12 backdrop-blur-sm border border-destructive-foreground/20">
                                           DELETED
                                       </div>
                                   </div>
                               )}

                               {/* Thumbnail Image */}
                               <div
                                  className={cn(
                                      "aspect-[3/4] relative flex items-center justify-center overflow-hidden bg-muted/20 rounded-md cursor-pointer transition-opacity",
                                      isDeleted ? "opacity-50 grayscale-[0.5]" : ""
                                  )}
                                  onClick={() => togglePageDeletion(idx)}
                               >
                                   {page.imageUrl ? (
                                       // eslint-disable-next-line @next/next/no-img-element
                                       <img
                                         src={page.imageUrl}
                                         alt={`Page ${idx + 1}`}
                                         className="object-contain max-w-full max-h-full shadow-sm"
                                         loading="lazy"
                                       />
                                   ) : (
                                       <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                                   )}
                               </div>

                               {/* Footer Info */}
                               <div className="flex items-center justify-between text-xs px-1">
                                   <span className={cn("font-medium", isDeleted ? "text-destructive line-through" : "text-muted-foreground")}>
                                       Page {idx + 1}
                                   </span>
                                   {isDeleted && (
                                       <Trash2 className="h-3 w-3 text-destructive" />
                                   )}
                               </div>
                           </div>
                       )
                   })}
               </div>
           )}
       </div>

       {/* Confirm Modal */}
       <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Confirm Deletion
                    </DialogTitle>
                    <DialogDescription>
                        You are about to delete <strong>{pagesToDelete.size} pages</strong> from this document.
                        <br/><br/>
                        The new PDF will have <strong>{remainingPages} pages</strong>.
                        <br/>
                        This action creates a new file and cannot be undone on the generated file.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
                    <Button variant="destructive" onClick={executeSave}>
                        Yes, Delete Pages
                    </Button>
                </DialogFooter>
            </DialogContent>
       </Dialog>

       {/* Full Screen Viewer */}
       <Dialog open={viewingPageIndex !== null} onOpenChange={(open) => !open && setViewingPageIndex(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogTitle className="sr-only">PDF Page Preview</DialogTitle>
                <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/10 shrink-0">
                    <span className="font-medium">Page {viewingPageIndex !== null ? viewingPageIndex + 1 : 0} of {totalPages}</span>
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
                   <div className="relative shadow-lg ring-1 ring-black/5">
                        <canvas ref={viewerCanvasRef} className="bg-white block" />
                   </div>

                   {/* Nav */}
                   {viewingPageIndex !== null && (
                        <>
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
                                disabled={viewingPageIndex >= totalPages - 1}
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
