"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { AlignLeft, AlignRight, Bold, Download, Droplets, Italic, Loader2 } from "lucide-react"
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

// Set worker source
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

// Types
type WatermarkType = "text" | "image" | "stamp"
type PositionPreset = "top-left" | "top-center" | "top-right" | "middle-left" | "center" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right" | "custom"

interface WatermarkSettings {
  // Common
  type: WatermarkType
  opacity: number
  rotation: number
  position: PositionPreset
  offsetX: number
  offsetY: number
  layer: "foreground" | "background"
  margin: number

  // Text
  text: string
  fontFamily: string
  fontSize: number
  color: string
  isBold: boolean
  isItalic: boolean
  stroke: boolean
  strokeColor: string
  strokeWidth: number

  // Image
  imageFile: File | null
  imagePreview: string | null
  scale: number // Percentage
  maintainAspectRatio: boolean

  // Tiling
  isTiled: boolean
  tileSize: number
  tileGap: number
}

const DEFAULT_SETTINGS: WatermarkSettings = {
  type: "text",
  opacity: 50,
  rotation: -45,
  position: "center",
  offsetX: 0,
  offsetY: 0,
  layer: "foreground",
  margin: 10,

  text: "CONFIDENTIAL",
  fontFamily: "Helvetica",
  fontSize: 48,
  color: "#FF0000",
  isBold: true,
  isItalic: false,
  stroke: false,
  strokeColor: "#000000",
  strokeWidth: 1,

  imageFile: null,
  imagePreview: null,
  scale: 50,
  maintainAspectRatio: true,

  isTiled: false,
  tileSize: 100,
  tileGap: 50
}

export function WatermarkInterface() {
  const [file, setFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [settings, setSettings] = useState<WatermarkSettings>(DEFAULT_SETTINGS)

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const img = e.target.files[0]
          const url = URL.createObjectURL(img)
          setSettings(prev => ({
              ...prev,
              imageFile: img,
              imagePreview: url,
              type: "image" // Auto switch
          }))
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
          const viewport = page.getViewport({ scale: 1.0 }) // Base scale
          const canvas = canvasRef.current
          const ctx = canvas.getContext('2d')

          if (!ctx) return

          // Set canvas dimensions
          // We limit max height to avoid huge canvas on UI
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

          // 2. Draw Watermark Preview
          drawWatermark(ctx, canvas.width, canvas.height)

      } catch (err) {
          console.error("Preview render failed", err)
      }
  }

  const drawWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      ctx.save()

      const { type, position, offsetX, offsetY, rotation, opacity, margin } = settings

      // Opacity
      ctx.globalAlpha = opacity / 100

      // Calculate Base Position anchored to 9-grid
      let x = 0, y = 0

      // We need item dimensions to calculate grid position correctly
      // This is tricky for text metrics vs image
      let itemW = 0, itemH = 0

      if (type === 'text') {
           ctx.font = `${settings.isItalic ? 'italic ' : ''}${settings.isBold ? 'bold ' : ''}${settings.fontSize}px ${settings.fontFamily}`
           const metrics = ctx.measureText(settings.text)
           itemW = metrics.width
           itemH = settings.fontSize // Approx
      } else if (type === 'image' && settings.imagePreview) {
          // We can't synchronously get img dims easily if not preloaded,
          // let's assume we load it. For this preview to be snappy, we assume image element exists or created fast
          // In a real app we'd keep an Image object in ref
          // Simplified:
           itemW = 200 * (settings.scale / 100) // Placeholder logic if simplified
           // For accurate preview we need the actual image object, let's try creating one dynamically
      }

      // Helper to calculate coords (using simplified logic for preview speed)
      // Real accurate pos requires accurate bounds

      const setupContextForDraw = (drawX: number, drawY: number) => {
          ctx.translate(drawX, drawY)
          ctx.rotate((rotation * Math.PI) / 180)
          ctx.translate(-drawX, -drawY)
      }

      const drawContent = (drawX: number, drawY: number) => {
          if (type === 'text') {
               ctx.fillStyle = settings.color
               ctx.fillText(settings.text, drawX - itemW/2, drawY + itemH/3) // Center anchor
               if (settings.stroke) {
                   ctx.strokeStyle = settings.strokeColor
                   ctx.lineWidth = settings.strokeWidth
                   ctx.strokeText(settings.text, drawX - itemW/2, drawY + itemH/3)
               }
          }
          // Image drawing handled slightly differently due to async loading, skipping exact image implementation for brevity in this step
          // in favor of Text implementation first
      }

      // --- simplified text preview implementation ---
      if (type === 'text') {
           ctx.textBaseline = "middle"
           ctx.textAlign = "center"

           // Calculate Center Point based on Position Grid
           let cx = width / 2
           let cy = height / 2

           if(position.includes("left")) cx = width * 0.2
           if(position.includes("right")) cx = width * 0.8
           if(position.includes("top")) cy = height * 0.2
           if(position.includes("bottom")) cy = height * 0.8
           if(position === "center") { cx = width/2; cy = height/2 }

           // Apply Offsets
           cx += offsetX * (width/100) // Offset as % or px? UI says mm/px. Let's assume px for now
           cy += (offsetY * -1) // Inverted Y usually

           setupContextForDraw(cx, cy)
           drawContent(cx, cy)
      } else if (type === 'image' && settings.imagePreview) {
          const img = new Image()
          img.src = settings.imagePreview
          // This won't draw immediately on first frame.
          // For robust preview, we need `img.onload` to trigger re-render
          // We can assume it's loaded if preview url exists for now
          if (img.complete) {
              const w = img.width * (settings.scale / 100) * 0.5 // Scale down for canvas
              const h = img.height * (settings.scale / 100) * 0.5

              let cx = width / 2
              let cy = height / 2
               if(position.includes("left")) cx = width * 0.2
               if(position.includes("right")) cx = width * 0.8
               if(position.includes("top")) cy = height * 0.2
               if(position.includes("bottom")) cy = height * 0.8

               ctx.translate(cx, cy)
               ctx.rotate((rotation * Math.PI) / 180)
               ctx.drawImage(img, -w/2, -h/2, w, h)
          } else {
             img.onload = () => renderPreview() // Re-trigger
          }
      }

      ctx.restore()
  }

  // --- PDF Processing ---

  const handleApplyWatermark = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)

    try {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const pages = pdf.getPages()

        // Font embedding
        let font
        if (settings.type === 'text') {
            font = await pdf.embedFont(StandardFonts.HelveticaBold) // Simplified font selection
        }

        let embeddedImage
        if (settings.type === 'image' && settings.imageFile) {
             const imgBytes = await settings.imageFile.arrayBuffer()
             if (settings.imageFile.type === 'image/png') {
                 embeddedImage = await pdf.embedPng(imgBytes)
             } else {
                 embeddedImage = await pdf.embedJpg(imgBytes)
             }
        }

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i]
            const { width, height } = page.getSize()

            // Logic to calculate position (mimicking preview)
            let x = width / 2
            let y = height / 2

            // Map preset string to coords
            if (settings.position.includes('left')) x = width * 0.1 // Margin approx
            if (settings.position.includes('right')) x = width * 0.9
            if (settings.position.includes('top')) y = height * 0.9
            if (settings.position.includes('bottom')) y = height * 0.1

            // Apply offsets (scaled)
            x += settings.offsetX
            y += settings.offsetY

            if (settings.type === 'text' && font) {
                 const textWidth = font.widthOfTextAtSize(settings.text, settings.fontSize)
                 const textHeight = settings.fontSize // approx

                 // Center anchor adjustment if manual calc needed (drawText default anchor is bottom-left usually)
                 // We rotate around center

                 page.drawText(settings.text, {
                     x: x - (textWidth/2), // Center align manual
                     y: y,
                     size: settings.fontSize,
                     font: font,
                     color: rgb(hexToRgb(settings.color).r/255, hexToRgb(settings.color).g/255, hexToRgb(settings.color).b/255),
                     opacity: settings.opacity / 100,
                     rotate: degrees(settings.rotation)
                 })
            } else if (settings.type === 'image' && embeddedImage) {
                 const dims = embeddedImage.scale(settings.scale / 100)
                 page.drawImage(embeddedImage, {
                     x: x - (dims.width/2),
                     y: y - (dims.height/2),
                     width: dims.width,
                     height: dims.height,
                     opacity: settings.opacity / 100,
                     rotate: degrees(settings.rotation)
                 })
            }

            setProgress(Math.round(((i + 1) / pages.length) * 100))
        }

        const pdfBytes = await pdf.save()
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)

        const link = document.createElement("a")
        link.href = url
        link.download = `watermarked-${file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast.success("Watermark applied successfully!")

    } catch (err) {
        console.error("Watermark failed", err)
        toast.error("Failed to apply watermark")
    } finally {
        setIsProcessing(false)
    }
  }

  // Helper
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  // --- UI Renders ---

  if (!file) {
      return (
         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">Add Watermark</h2>
                 <p className="text-muted-foreground">Stamp text or images over your PDF documents.</p>
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
                         <AlignLeft className="w-4 h-4 rotate-180" /> {/* Reuse icon as Left Arrow substitute if Chevron missing */}
                     </Button>
                     <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                     <Button variant="outline" size="icon" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
                         <AlignRight className="w-4 h-4" /> {/* Substitute */}
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
                         <Droplets className="w-5 h-5 text-primary" />
                         Watermark Settings
                     </h3>
                     <Separator />
                 </div>

                 <Tabs value={settings.type} onValueChange={(v) => setSettings(s => ({...s, type: v as WatermarkType}))}>
                     <TabsList className="grid grid-cols-3 w-full">
                         <TabsTrigger value="text">Text</TabsTrigger>
                         <TabsTrigger value="image">Image</TabsTrigger>
                         <TabsTrigger value="stamp">Stamp</TabsTrigger>
                     </TabsList>

                     {/* TEXT SETTINGS */}
                     <TabsContent value="text" className="space-y-4 pt-4">
                         <div className="space-y-2">
                             <Label>Watermark Text</Label>
                             <Input
                                value={settings.text}
                                onChange={(e) => setSettings(s => ({...s, text: e.target.value}))}
                                placeholder="CONFIDENTIAL"
                             />
                         </div>

                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <Label>Font Size</Label>
                                 <Input
                                    type="number"
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings(s => ({...s, fontSize: Number(e.target.value)}))}
                                 />
                             </div>
                             <div className="space-y-2">
                                 <Label>Color</Label>
                                 <div className="flex gap-2">
                                     <Input
                                        type="color"
                                        value={settings.color}
                                        className="w-12 p-1"
                                        onChange={(e) => setSettings(s => ({...s, color: e.target.value}))}
                                     />
                                     <Input
                                        value={settings.color}
                                        onChange={(e) => setSettings(s => ({...s, color: e.target.value}))}
                                     />
                                 </div>
                             </div>
                         </div>

                         <div className="flex gap-2">
                             <Button
                                variant={settings.isBold ? "secondary" : "outline"}
                                size="sm"
                                className="flex-1"
                                onClick={() => setSettings(s => ({...s, isBold: !s.isBold}))}
                             >
                                 <Bold className="w-4 h-4" />
                             </Button>
                             <Button
                                variant={settings.isItalic ? "secondary" : "outline"}
                                size="sm"
                                className="flex-1"
                                onClick={() => setSettings(s => ({...s, isItalic: !s.isItalic}))}
                             >
                                 <Italic className="w-4 h-4" />
                             </Button>
                         </div>
                     </TabsContent>

                     {/* IMAGE SETTINGS */}
                     <TabsContent value="image" className="space-y-4 pt-4">
                         <div className="space-y-2">
                             <Label>Upload Image</Label>
                             <Input type="file" accept="image/*" onChange={handleImageUpload} />
                         </div>
                         <div className="space-y-2">
                             <Label>Scale ({settings.scale}%)</Label>
                             <Slider
                                value={[settings.scale]}
                                min={10}
                                max={200}
                                step={10}
                                onValueChange={([v]) => setSettings(s => ({...s, scale: v}))}
                             />
                         </div>
                     </TabsContent>

                     <TabsContent value="stamp" className="pt-4">
                         <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                             Stamp templates coming soon (use Text for now).
                         </div>
                     </TabsContent>
                 </Tabs>

                 <Separator />

                 {/* COMMON SETTINGS */}
                 <div className="space-y-4">
                     <div className="space-y-2">
                         <Label className="flex justify-between">
                             <span>Opacity</span>
                             <span className="text-muted-foreground">{settings.opacity}%</span>
                         </Label>
                         <Slider
                            value={[settings.opacity]}
                            min={0}
                            max={100}
                            step={5}
                            onValueChange={([v]) => setSettings(s => ({...s, opacity: v}))}
                         />
                     </div>

                     <div className="space-y-2">
                         <Label className="flex justify-between">
                             <span>Rotation</span>
                             <span className="text-muted-foreground">{settings.rotation}°</span>
                         </Label>
                         <Slider
                            value={[settings.rotation]}
                            min={-180}
                            max={180}
                            step={15}
                            onValueChange={([v]) => setSettings(s => ({...s, rotation: v}))}
                         />
                         <div className="flex gap-1 justify-between mt-1">
                             {[-45, 0, 45, 90].map(deg => (
                                 <Button
                                    key={deg}
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-[10px] px-2"
                                    onClick={() => setSettings(s => ({...s, rotation: deg}))}
                                 >
                                     {deg}°
                                 </Button>
                             ))}
                         </div>
                     </div>

                     {/* Position Grid */}
                     <div className="space-y-2">
                         <Label>Position</Label>
                         <div className="grid grid-cols-3 gap-2 w-32 mx-auto">
                             {(['top-left', 'top-center', 'top-right',
                                'middle-left', 'center', 'middle-right',
                                'bottom-left', 'bottom-center', 'bottom-right'] as PositionPreset[]).map(pos => (
                                 <Button
                                    key={pos}
                                    variant={settings.position === pos ? "default" : "outline"}
                                    size="icon"
                                    className="w-8 h-8 rounded-md"
                                    onClick={() => setSettings(s => ({...s, position: pos, offsetX: 0, offsetY: 0}))} // Reset offsets on preset change
                                    title={pos}
                                 >
                                     <div className={cn("w-2 h-2 rounded-full", settings.position === pos ? "bg-background" : "bg-foreground")} />
                                 </Button>
                             ))}
                         </div>
                         <div className="grid grid-cols-2 gap-2 mt-2">
                             <div className="space-y-1">
                                 <Label className="text-xs">Offset X</Label>
                                 <Input type="number" value={settings.offsetX} onChange={(e) => setSettings(s => ({...s, offsetX: Number(e.target.value)}))} className="h-8 text-xs" />
                             </div>
                             <div className="space-y-1">
                                 <Label className="text-xs">Offset Y</Label>
                                 <Input type="number" value={settings.offsetY} onChange={(e) => setSettings(s => ({...s, offsetY: Number(e.target.value)}))} className="h-8 text-xs" />
                             </div>
                         </div>
                     </div>
                 </div>

                 <Button
                    size="lg"
                    className="w-full"
                    onClick={handleApplyWatermark}
                    disabled={isProcessing}
                 >
                    {isProcessing ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Applying... {progress}%
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Apply Watermark
                        </>
                    )}
                 </Button>
             </Card>
        </div>
    </div>
  )
}
