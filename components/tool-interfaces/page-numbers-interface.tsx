"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { AlignLeft, AlignRight, Download, Hash, Loader2 } from "lucide-react"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Ensure worker source uses unpkg (matching working components)
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

type PositionPreset = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"

interface PageNumberSettings {
  position: PositionPreset
  startFrom: number
  format: "n" | "Page n" | "n of total" | "Page n of total"
  fontSize: number
  margin: number
  opacity: number
}

const DEFAULT_SETTINGS: PageNumberSettings = {
  position: "bottom-center",
  startFrom: 1,
  format: "n",
  fontSize: 12,
  margin: 10, // mm
  opacity: 100
}

export function PageNumbersInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [settings, setSettings] = useState<PageNumberSettings>(DEFAULT_SETTINGS)

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // --- File Handling ---

  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length > 0) {
      const f = files[0].file
      setFile(f)
      try {
        const arrayBuffer = await f.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
        setPdfDoc(pdf)
        setTotalPages(pdf.numPages)
        setCurrentPage(1)
      } catch (err) {
        console.error("Error loading PDF", err)
        toast.error("Failed to load PDF file")
      }
    }
  }

  // --- Preview Logic ---

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
        renderPreview()
    }
  }, [pdfDoc, currentPage, settings])

  const renderPreview = async () => {
      if (!pdfDoc || !canvasRef.current) return

      try {
          const page = await pdfDoc.getPage(currentPage)
          const viewport = page.getViewport({ scale: 1.0 })
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')

          if (!ctx) return

          // Limit preview size
          const MAX_HEIGHT = 600
          const scale = Math.min(1, MAX_HEIGHT / viewport.height)
          const scaledViewport = page.getViewport({ scale })

          canvas.width = scaledViewport.width
          canvas.height = scaledViewport.height

          // 1. Render PDF Page
          await page.render({
              canvasContext: ctx,
              viewport: scaledViewport
          }).promise

          // 2. Draw Page Number Preview
          drawPageNumber(ctx, canvas.width, canvas.height, currentPage, totalPages)

      } catch (err) {
          console.error("Preview render failed", err)
      }
  }

  const formatText = (pageNum: number, total: number, format: PageNumberSettings['format'], startFrom: number) => {
      const n = (pageNum - 1) + startFrom
      // Note: pageNum is 1-based index of current page in viewing
      // Logic: if startFrom is 1, page 1 is 1. If startFrom is 5, page 1 is 5.

      switch (format) {
          case "n": return `${n}`
          case "Page n": return `Page ${n}`
          case "n of total": return `${n} of ${total}`
          case "Page n of total": return `Page ${n} of ${total}`
          default: return `${n}`
      }
  }

  const drawPageNumber = (ctx: CanvasRenderingContext2D, width: number, height: number, pageNum: number, total: number) => {
      const { position, fontSize, margin, opacity, format, startFrom } = settings

      const text = formatText(pageNum, totalPages, format, startFrom) // Use totalPages state for preview

      ctx.save()
      ctx.font = `${fontSize}px Helvetica` // Match default PDF font
      ctx.fillStyle = `rgba(0, 0, 0, ${opacity / 100})`

      const metrics = ctx.measureText(text)
      const textWidth = metrics.width
      const textHeight = fontSize // Approx

      // Calculate Position (Approx)
      // Margin is in mm usually, here we approximate px (1mm ~ 3.78px)
      // But for preview consistency with PDF-lib (points), let's say viewport is 72dpi usually. 1mm = 2.83pt.
      // We need to scale margin by canvas scale ideally, but let's keep it simple visual

      const marginPx = margin * 3

      let x = 0
      let y = 0

      if (position.includes("left")) x = marginPx
      if (position.includes("center")) x = (width / 2) - (textWidth / 2)
      if (position.includes("right")) x = width - marginPx - textWidth

      if (position.includes("top")) y = marginPx + textHeight
      if (position.includes("bottom")) y = height - marginPx

      ctx.fillText(text, x, y)

      ctx.restore()
  }

  // --- PDF Application Logic ---

  const handleApply = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)

    try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const pages = pdf.getPages()
        const font = await pdf.embedFont(StandardFonts.Helvetica)

        const count = pages.length

        for (let i = 0; i < count; i++) {
            const page = pages[i]
            const { width, height } = page.getSize()

            const text = formatText(i + 1, count, settings.format, settings.startFrom)
            const textSize = settings.fontSize
            const textWidth = font.widthOfTextAtSize(text, textSize)
            const textHeight = font.heightAtSize(textSize)

            // 1mm = 2.83465 points
            const marginPt = settings.margin * 2.83465

            let x = 0
            let y = 0

            // Coordinate system: Origin is Bottom-Left

            if (settings.position.includes("left")) x = marginPt
            if (settings.position.includes("center")) x = (width / 2) - (textWidth / 2)
            if (settings.position.includes("right")) x = width - marginPt - textWidth

            if (settings.position.includes("top")) y = height - marginPt - textHeight
            if (settings.position.includes("bottom")) y = marginPt

            page.drawText(text, {
                x,
                y,
                size: textSize,
                font: font,
                color: rgb(0, 0, 0),
                opacity: settings.opacity / 100,
            })

            setProgress(Math.round(((i + 1) / count) * 100))
        }

        const pdfBytes = await pdf.save()
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = `numbered-${file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Page numbers added successfully!")

    } catch (err) {
        console.error("Failed to add numbers", err)
        toast.error("Failed to add page numbers")
    } finally {
        setIsProcessing(false)
    }
  }

  if (!file) {
      return (
         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">Add Page Numbers</h2>
                 <p className="text-muted-foreground">Insert page numbers into your PDF document.</p>
             </div>
             <FileDropZone
                onFilesSelected={handleFileSelected}
                accept=".pdf"
                multiple={false}
            />
         </div>
      )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-20 max-w-6xl mx-auto h-[calc(100vh-200px)]">
         {/* Left: Preview */}
        <div className="lg:col-span-2 bg-muted/30 rounded-xl border flex flex-col relative overflow-hidden">
            <div className="p-4 border-b bg-background flex justify-between items-center">
                 <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
                         <AlignLeft className="w-4 h-4 rotate-180" />
                     </Button>
                     <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
                         <AlignRight className="w-4 h-4" />
                     </Button>
                 </div>
                 <Badge variant="outline">{file.name}</Badge>
            </div>

            <div className="flex-1 overflow-auto p-8 flex items-center justify-center bg-checkerboard">
                <canvas
                    ref={canvasRef}
                    className="shadow-2xl border bg-white max-w-full"
                />
            </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-6 overflow-y-auto pr-2">
             <Card className="p-6 space-y-6">
                 <div className="space-y-2">
                     <h3 className="font-semibold flex items-center gap-2">
                         <Hash className="w-5 h-5 text-primary" />
                         Numbering Settings
                     </h3>
                     <Separator />
                 </div>

                 <div className="space-y-4">
                     {/* Position Grid */}
                     <div className="space-y-2">
                         <Label>Position</Label>
                         <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                              <div className="col-span-3 h-0" /> {/* Spacer for layout matching */}
                              {/* Top Row */}
                              {['top-left', 'top-center', 'top-right'].map(pos => (
                                   <Button
                                     key={pos}
                                     variant={settings.position === pos ? "default" : "outline"}
                                     size="icon"
                                     className="w-8 h-8"
                                     onClick={() => setSettings(s => ({...s, position: pos as PositionPreset}))}
                                   >
                                       <div className={cn("w-2 h-2 rounded-full", settings.position === pos ? "bg-background" : "bg-foreground")} />
                                   </Button>
                              ))}
                              {/* Middle Row Spacer */}
                              <div className="col-span-3 h-8 flex items-center justify-center text-xs text-muted-foreground">
                                  ---
                              </div>
                              {/* Bottom Row */}
                              {['bottom-left', 'bottom-center', 'bottom-right'].map(pos => (
                                   <Button
                                     key={pos}
                                     variant={settings.position === pos ? "default" : "outline"}
                                     size="icon"
                                     className="w-8 h-8"
                                     onClick={() => setSettings(s => ({...s, position: pos as PositionPreset}))}
                                   >
                                       <div className={cn("w-2 h-2 rounded-full", settings.position === pos ? "bg-background" : "bg-foreground")} />
                                   </Button>
                              ))}
                         </div>
                     </div>

                     <div className="space-y-2">
                         <Label>Format</Label>
                         <Select value={settings.format} onValueChange={(v: any) => setSettings(s => ({...s, format: v}))}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="n">1, 2, 3...</SelectItem>
                                 <SelectItem value="Page n">Page 1, Page 2...</SelectItem>
                                 <SelectItem value="n of total">1 of 5, 2 of 5...</SelectItem>
                                 <SelectItem value="Page n of total">Page 1 of 5...</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label>Start Number</Label>
                             <Input
                                type="number"
                                min={1}
                                value={settings.startFrom}
                                onChange={(e) => setSettings(s => ({...s, startFrom: Number(e.target.value)}))}
                             />
                        </div>
                         <div className="space-y-2">
                             <Label>Font Size</Label>
                             <Input
                                type="number"
                                value={settings.fontSize}
                                onChange={(e) => setSettings(s => ({...s, fontSize: Number(e.target.value)}))}
                             />
                        </div>
                     </div>

                     <div className="space-y-2">
                         <Label className="flex justify-between">
                             <span>Margin</span>
                             <span className="text-muted-foreground">{settings.margin}mm</span>
                         </Label>
                         <Slider
                            value={[settings.margin]}
                            min={0}
                            max={50}
                            step={1}
                            onValueChange={([v]) => setSettings(s => ({...s, margin: v}))}
                         />
                     </div>
                 </div>

                 <Button
                    size="lg"
                    className="w-full"
                    onClick={handleApply}
                    disabled={isProcessing}
                 >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing... {progress}%
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Add Page Numbers
                        </>
                    )}
                 </Button>
            </Card>
        </div>
    </div>
  )
}
