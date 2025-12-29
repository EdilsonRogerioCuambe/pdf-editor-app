"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import {
    Check, ChevronLeft, ChevronRight,
    Loader2, RotateCcw, Scissors,
    X,
    ZoomIn, ZoomOut
} from "lucide-react"
import { useTranslations } from "next-intl"
import { PDFDocument } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Set worker source for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

interface PageThumbnail {
  pageIndex: number
  imageUrl: string | null
  width: number
  height: number
  aspectRatio: number
}

type SplitMode = 'selected' | 'range' | 'every' | 'individual'

export function SplitInterface() {
  const t = useTranslations('split')
  const tCommon = useTranslations('common')
  const tTools = useTranslations('tools.split')

  // State
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [pdfProxy, setPdfProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([])
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set())

  // Split config
  const [splitMode, setSplitMode] = useState<SplitMode>('selected')
  const [rangeInput, setRangeInput] = useState("")
  const [everyInput, setEveryInput] = useState<number>(2)

  // Processing
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [processingStatus, setProcessingStatus] = useState("")

  // Viewer
  const [viewingPageIndex, setViewingPageIndex] = useState<number | null>(null)
  const [viewerScale, setViewerScale] = useState(1.0)
  const viewerCanvasRef = useRef<HTMLCanvasElement>(null)

  const resetState = () => {
    setFile(null)
    setPdfProxy(null)
    setThumbnails([])
    setSelectedPages(new Set())
    setRangeInput("")
    setEveryInput(2)
    setIsProcessing(false)
    setProgress(0)
    setProcessingStatus("")
    setViewingPageIndex(null)
  }

  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length === 0) return
    const newFile = files[0] // Only handle one file for split

    try {
      setLoadingThumbnails(true)
      setFile(newFile)

      const arrayBuffer = await newFile.file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      setPdfProxy(pdf)

      // Initialize thumbnails array with placeholders
      const pageCount = pdf.numPages
      const placeholders: PageThumbnail[] = Array.from({ length: pageCount }, (_, i) => ({
        pageIndex: i,
        imageUrl: null,
        width: 0,
        height: 0,
        aspectRatio: 1
      }))
      setThumbnails(placeholders)

      // Render thumbnails progressively
      const newThumbnails = [...placeholders]
      const SCALE = 0.5 // Scale for thumbnails

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
            viewport: viewport
          }).promise

          newThumbnails[i] = {
            pageIndex: i,
            imageUrl: canvas.toDataURL("image/jpeg", 0.8),
            width: viewport.width,
            height: viewport.height,
            aspectRatio: viewport.width / viewport.height
          }

          // Update state chunks to show progress
          if (i % 5 === 0 || i === pageCount - 1) {
             setThumbnails([...newThumbnails])
          }
        } catch (err) {
          console.error(`Error rendering page ${i + 1}`, err)
        }
      }

    } catch (error) {
      console.error("Error loading PDF", error)
      toast.error(tCommon('fileTooLarge', { size: 'N/A' })) // Generic error fallback
      setFile(null)
    } finally {
      setLoadingThumbnails(false)
    }
  }

  // Selection Logic
  const togglePageSelection = (index: number) => {
    const newSet = new Set(selectedPages)
    if (newSet.has(index)) {
      newSet.delete(index)
    } else {
      newSet.add(index)
    }
    setSelectedPages(newSet)
  }

  const selectAll = () => {
    if (!pdfProxy) return
    const newSet = new Set<number>()
    for (let i = 0; i < pdfProxy.numPages; i++) {
        newSet.add(i)
    }
    setSelectedPages(newSet)
  }

  const deselectAll = () => {
    setSelectedPages(new Set())
  }

  // helper to parse range
  const parseRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>()
    const parts = rangeStr.split(",")

    for (const part of parts) {
      const trimmed = part.trim()
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map(Number)
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = start; i <= end; i++) {
             if (i >= 1 && i <= maxPages) pages.add(i - 1)
          }
        }
      } else {
        const page = Number(trimmed)
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page - 1)
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b)
  }

  // Full Screen View Logic
  const renderViewerPage = useCallback(async () => {
    if (!pdfProxy || viewingPageIndex === null || !viewerCanvasRef.current) return

    try {
      const page = await pdfProxy.getPage(viewingPageIndex + 1)
      const viewport = page.getViewport({ scale: viewerScale })
      const canvas = viewerCanvasRef.current
      const context = canvas.getContext("2d")

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


  // Split Execution
  const handleSplit = async () => {
    if (!file || !pdfProxy) return

    try {
      setIsProcessing(true)
      setProgress(0)
      setProcessingStatus(t('initializing'))

      const fileBuffer = await file.file.arrayBuffer()
      const srcDoc = await PDFDocument.load(fileBuffer)
      const pageCount = srcDoc.getPageCount()

      let pagesToExtract: number[][] = [] // Array of arrays of page indices (0-based)

      // Determine what to split based on mode
      if (splitMode === 'selected') {
        if (selectedPages.size === 0) {
          toast.error(t('selectAtLeastOne'))
          setIsProcessing(false)
          return
        }
        pagesToExtract = [Array.from(selectedPages).sort((a, b) => a - b)]
      }
      else if (splitMode === 'range') {
        const indices = parseRange(rangeInput, pageCount)
        if (indices.length === 0) {
           toast.error(t('invalidRange'))
           setIsProcessing(false)
           return
        }
        pagesToExtract = [indices]
      }
      else if (splitMode === 'every') {
         if (everyInput < 1) {
            toast.error(t('enterValidNumber'))
            setIsProcessing(false)
            return
         }
         // chunk pages
         for (let i = 0; i < pageCount; i += everyInput) {
            const chunk = []
            for (let j = 0; j < everyInput && (i + j) < pageCount; j++) {
               chunk.push(i + j)
            }
            pagesToExtract.push(chunk)
         }
      }
      else if (splitMode === 'individual') {
        for (let i = 0; i < pageCount; i++) {
          pagesToExtract.push([i])
        }
      }

      setProcessingStatus(t('preparing', { count: pagesToExtract.length }))

      // Generate PDFs
      const generatedPdfs: Uint8Array[] = []

      for (let i = 0; i < pagesToExtract.length; i++) {
        const subDoc = await PDFDocument.create()
        const indices = pagesToExtract[i]

        // Copy pages
        const copied = await subDoc.copyPages(srcDoc, indices)
        copied.forEach(p => subDoc.addPage(p))

        const pdfBytes = await subDoc.save()
        generatedPdfs.push(pdfBytes)

        setProgress(Math.round(((i + 1) / pagesToExtract.length) * 90))
      }

      // Download
      setProcessingStatus(t('finalizing'))

      if (generatedPdfs.length === 1) {
         // Single file download
         const blob = new Blob([generatedPdfs[0] as any], { type: "application/pdf" })
         const url = URL.createObjectURL(blob)
         const link = document.createElement("a")
         link.href = url
         link.download = `split-${file.name}`
         document.body.appendChild(link)
         link.click()
         document.body.removeChild(link)
      } else {
         // Zip download
         const zip = new JSZip()
         generatedPdfs.forEach((bytes, idx) => {
            zip.file(`split_${idx + 1}.pdf`, bytes)
         })
         const content = await zip.generateAsync({ type: "blob" })
         const url = URL.createObjectURL(content)
         const link = document.createElement("a")
         link.href = url
         link.download = `split-files-${Date.now()}.zip`
         document.body.appendChild(link)
         link.click()
         link.remove()
      }

      setProgress(100)
      toast.success(t('success'))

    } catch (e) {
      console.error("Split error", e)
      toast.error(t('error'))
    } finally {
      setIsProcessing(false)
    }
  }

  // Render
  if (!file) {
      return (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">{tTools('name')}</h2>
                 <p className="text-muted-foreground">{tTools('description')}</p>
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

  return (
    <div className="space-y-6 h-full flex flex-col">
       <div className="flex items-center justify-between border-b pb-4">
           <div>
               <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="truncate max-w-[200px]" title={file.name}>{file.name}</span>
                  <span className="text-muted-foreground font-normal text-sm">({pdfProxy?.numPages || 0} {tCommon('pages')})</span>
               </h3>
               <button onClick={resetState} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                   <RotateCcw className="w-3 h-3" /> {t('splitAnother')}
               </button>
           </div>

           <div className="flex items-center gap-2">
               {splitMode === 'selected' && (
                  <div className="text-sm text-muted-foreground mr-4">
                      {selectedPages.size} selected
                  </div>
               )}
               <Button onClick={handleSplit} disabled={isProcessing || (splitMode === 'selected' && selectedPages.size === 0)}>
                   {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Scissors className="w-4 h-4 mr-2" />}
                   {isProcessing ? t('processing') : splitMode === 'selected' ? t('extractSelected') : t('splitPdf')}
               </Button>
           </div>
       </div>

       {isProcessing && (
           <div className="space-y-2">
               <div className="flex justify-between text-xs text-muted-foreground">
                   <span>{processingStatus}</span>
                   <span>{progress}%</span>
               </div>
               <Progress value={progress} className="h-2" />
           </div>
       )}

       <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 flex-1 min-h-0 overflow-hidden">
           {/* Sidebar Controls */}
           <div className="lg:col-span-1 space-y-6 overflow-y-auto lg:overflow-visible pr-1">
               <Tabs value={splitMode} onValueChange={(v) => setSplitMode(v as SplitMode)} className="w-full">
                  <ScrollArea className="w-full whitespace-nowrap lg:w-auto lg:whitespace-normal pb-2 lg:pb-0">
                      <TabsList className="inline-flex w-auto lg:grid lg:grid-cols-1 h-auto gap-2 bg-transparent p-0 lg:w-full">
                          <TabsTrigger value="selected" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 flex-1 lg:flex-none px-4 py-2 h-auto">
                              {t('modeSelected')}
                          </TabsTrigger>
                          <TabsTrigger value="range" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 flex-1 lg:flex-none px-4 py-2 h-auto">
                              {t('modeRange')}
                          </TabsTrigger>
                          <TabsTrigger value="every" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 flex-1 lg:flex-none px-4 py-2 h-auto">
                              {t('modeEvery')}
                          </TabsTrigger>
                          <TabsTrigger value="individual" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 flex-1 lg:flex-none px-4 py-2 h-auto">
                              {t('modeIndividual')}
                          </TabsTrigger>
                      </TabsList>
                  </ScrollArea>

                  <div className="mt-4 lg:mt-6 p-4 border rounded-lg bg-muted/30">
                     {splitMode === 'selected' && (
                        <div className="flex flex-col h-full justify-between gap-4">
                           <div className="space-y-2">
                              <h4 className="font-medium text-sm">{t('selectionMode')}</h4>
                              <p className="text-xs text-muted-foreground">
                                {t('selectionHelp')}
                              </p>
                           </div>

                           <div className="pt-4 border-t mt-4">
                              <div className="grid grid-cols-2 gap-2">
                                  <Button variant="outline" size="sm" onClick={selectAll}>{t('selectAll')}</Button>
                                  <Button variant="outline" size="sm" onClick={deselectAll}>{t('deselect')}</Button>
                              </div>
                           </div>
                        </div>
                     )}

                     {splitMode === 'range' && (
                         <div className="space-y-4">
                            <div className="space-y-2">
                               <Label>{t('pageRangeLabel')}</Label>
                               <Input
                                  placeholder={t('pageRangePlaceholder')}
                                  value={rangeInput}
                                  onChange={(e) => setRangeInput(e.target.value)}
                               />
                               <p className="text-xs text-muted-foreground">
                                 {t('pageRangeHelp')}
                               </p>
                            </div>
                         </div>
                     )}

                     {splitMode === 'every' && (
                         <div className="space-y-4">
                            <div className="space-y-2">
                               <Label>{t('splitEveryLabel')}</Label>
                               <Input
                                  type="number"
                                  min={1}
                                  value={everyInput}
                                  onChange={(e) => setEveryInput(parseInt(e.target.value) || 0)}
                               />
                               <p className="text-xs text-muted-foreground">
                                 {t('splitEveryHelp', { count: everyInput })}
                               </p>
                            </div>
                         </div>
                     )}

                    {splitMode === 'individual' && (
                         <div className="space-y-4">
                            <p className="text-sm">
                               {t('individualHelp')}
                            </p>
                         </div>
                     )}
                  </div>
               </Tabs>
           </div>

           {/* Main Grid Area */}
           <div className="lg:col-span-3 bg-muted/10 rounded-xl border p-4 flex flex-col min-h-[500px]">
               {loadingThumbnails && thumbnails.length === 0 && (
                   <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                       <Loader2 className="w-8 h-8 animate-spin mb-4" />
                       <p>{t('rendering')}</p>
                   </div>
               )}

               <ScrollArea className="flex-1 h-[600px] w-full pr-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                      {thumbnails.map((page, idx) => (
                          <div
                             key={idx}
                             className={cn(
                                "relative group rounded-lg border-2 overflow-hidden transition-all bg-card",
                                selectedPages.has(idx) ? "border-primary ring-2 ring-primary/20" : "border-transparent ring-1 ring-border hover:ring-primary/50",
                                splitMode !== 'selected' && "opacity-75 blur-[0.5px] pointer-events-none grayscale"
                             )}
                          >
                              {/* Selection overlay (only for selected mode) */}
                              {splitMode === 'selected' && (
                                  <div
                                    className="absolute inset-0 cursor-pointer z-10"
                                    onClick={() => togglePageSelection(idx)}
                                  />
                              )}

                              {/* Preview Button */}
                              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="h-6 w-6 shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setViewingPageIndex(idx)
                                    }}
                                  >
                                      <ZoomIn className="h-3 w-3" />
                                  </Button>
                              </div>

                              {/* Selection Indicator */}
                              {splitMode === 'selected' && (
                                <div className={cn(
                                    "absolute top-2 left-2 z-20 h-5 w-5 rounded border bg-background flex items-center justify-center transition-colors",
                                    selectedPages.has(idx) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/50"
                                )}>
                                    {selectedPages.has(idx) && <Check className="h-3 w-3" />}
                                </div>
                              )}

                              {/* Thumbnail Image */}
                              <div className="aspect-[3/4] bg-muted flex items-center justify-center p-2">
                                  {page.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={page.imageUrl}
                                        alt={`Page ${idx + 1}`}
                                        className="w-full h-full object-contain shadow-sm"
                                        loading="lazy"
                                      />
                                  ) : (
                                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                                  )}
                              </div>

                              <div className="bg-card border-t p-2 text-center text-xs font-medium text-muted-foreground">
                                  {tCommon('page')} {idx + 1}
                              </div>
                          </div>
                      ))}
                  </div>
               </ScrollArea>
           </div>
       </div>

       {/* Full page viewer modal */}
        <Dialog open={viewingPageIndex !== null} onOpenChange={(open) => !open && setViewingPageIndex(null)}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
                <DialogTitle className="sr-only">PDF Page Preview</DialogTitle>
                <div className="h-12 border-b flex items-center justify-between px-4 bg-muted/10 shrink-0">
                    <span className="font-medium">{tCommon('page')} {viewingPageIndex !== null ? viewingPageIndex + 1 : 0} {tCommon('of')} {pdfProxy?.numPages}</span>
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
                      <div className="relative shadow-lg ring-1 ring-black/5">
                        <canvas ref={viewerCanvasRef} className="bg-white block" />
                      </div>
                   )}

                    {viewingPageIndex !== null && (
                        <>
                             <Button
                                variant="secondary"
                                size="icon"
                                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 shadow-lg"
                                disabled={viewingPageIndex <= 0}
                                onClick={() => setViewingPageIndex(i => (i !== null ? i - 1 : 0))}
                             >
                                <ChevronLeft className="h-5 w-5" />
                             </Button>

                             <Button
                                variant="secondary"
                                size="icon"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full h-10 w-10 shadow-lg"
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
