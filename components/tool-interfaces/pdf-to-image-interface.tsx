"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import JSZip from "jszip"
import { Check, Download, Image as ImageIcon } from "lucide-react"
import * as pdfjsLib from "pdfjs-dist"
import { useState } from "react"
import { toast } from "sonner"

// Set worker source
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

type ImageFormat = "png" | "jpeg" | "webp"
type PageSelection = Set<number>

interface ConversionSettings {
  format: ImageFormat
  quality: number
  dpi: number
  prefix: string
}

const FORMATS: { id: ImageFormat; label: string; desc: string }[] = [
  { id: "png", label: "PNG", desc: "Lossless, transparent" },
  { id: "jpeg", label: "JPEG", desc: "Smaller size, lossy" },
  { id: "webp", label: "WebP", desc: "Best compression" },
]

export function PdfToImageInterface() {
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [selectedPages, setSelectedPages] = useState<PageSelection>(new Set())
  const [loadingThumbnails, setLoadingThumbnails] = useState(false)
  const [thumbnails, setThumbnails] = useState<string[]>([])

  const [settings, setSettings] = useState<ConversionSettings>({
    format: "jpeg",
    quality: 80,
    dpi: 150,
    prefix: "document",
  })

  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedImages, setConvertedImages] = useState<{ blob: Blob; filename: string }[]>([])

  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length === 0) return
    const newFile = files[0]
    setFile(newFile)
    setSettings(prev => ({ ...prev, prefix: newFile.name.replace('.pdf', '') }))
    setConvertedImages([])
    setProgress(0)
    setLoadingThumbnails(true)

    try {
      const arrayBuffer = await newFile.file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
      const pages = pdf.numPages
      setTotalPages(pages)

      // Auto-select all pages initially
      const allPages = new Set<number>()
      const thumbUrls: string[] = []

      for (let i = 1; i <= pages; i++) {
        allPages.add(i)
        // Generate low-res thumbnail
        if (i <= 20) { // Limit thumbnail generation for performance
            try {
                const page = await pdf.getPage(i)
                const viewport = page.getViewport({ scale: 0.2 })
                const canvas = document.createElement("canvas")
                canvas.width = viewport.width
                canvas.height = viewport.height
                const context = canvas.getContext("2d")
                await page.render({ canvasContext: context!, viewport }).promise
                thumbUrls[i-1] = canvas.toDataURL()
            } catch (e) {
                console.warn(`Failed to render thumbnail for page ${i}`, e)
            }
        }
      }
      setSelectedPages(allPages)
      setThumbnails(thumbUrls)

    } catch (err) {
      console.error("Error loading PDF", err)
      toast.error("Failed to load PDF")
      setFile(null)
    } finally {
      setLoadingThumbnails(false)
    }
  }

  const togglePageSelection = (pageNum: number) => {
    const newSelected = new Set(selectedPages)
    if (newSelected.has(pageNum)) {
      newSelected.delete(pageNum)
    } else {
      newSelected.add(pageNum)
    }
    setSelectedPages(newSelected)
  }

  const selectAll = () => {
    const all = new Set<number>()
    for (let i = 1; i <= totalPages; i++) all.add(i)
    setSelectedPages(all)
  }

  const deselectAll = () => setSelectedPages(new Set())

  const handleConvert = async () => {
    if (!file || selectedPages.size === 0) return

    setIsConverting(true)
    setProgress(0)
    setConvertedImages([])

    try {
        const arrayBuffer = await file.file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
        const outputImages: { blob: Blob; filename: string }[] = []

        const pagesToProcess = Array.from(selectedPages).sort((a, b) => a - b)
        const total = pagesToProcess.length

        for (let i = 0; i < total; i++) {
            const pageNum = pagesToProcess[i]
            const page = await pdf.getPage(pageNum)

            // Render at requested DPI
            // 72 DPI is scale 1.0
            const scale = settings.dpi / 72
            const viewport = page.getViewport({ scale })

            const canvas = document.createElement("canvas")
            canvas.width = viewport.width
            canvas.height = viewport.height
            const context = canvas.getContext("2d")

            await page.render({ canvasContext: context!, viewport }).promise

            const blob = await new Promise<Blob | null>((resolve) => {
                canvas.toBlob(
                    blob => resolve(blob),
                    `image/${settings.format}`,
                    settings.format === 'png' ? undefined : settings.quality / 100
                )
            })

            if (blob) {
                outputImages.push({
                    blob,
                    filename: `${settings.prefix}-page-${pageNum}.${settings.format}`
                })
            }

            // Update progress
            // Add slight delay to let UI update
            await new Promise(r => setTimeout(r, 10))
            setProgress(Math.round(((i + 1) / total) * 100))
        }

        setConvertedImages(outputImages)
        toast.success("Conversion Complete!", { description: `Converted ${outputImages.length} pages.` })

    } catch (err) {
        console.error("Conversion failed", err)
        toast.error("Failed during conversion")
    } finally {
        setIsConverting(false)
    }
  }

  const downloadZip = async () => {
      if (convertedImages.length === 0) return

      const zip = new JSZip()
      convertedImages.forEach(img => {
          zip.file(img.filename, img.blob)
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${settings.prefix}-images.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
  }

  const downloadSingle = (index: number) => {
      const img = convertedImages[index]
      if (!img) return
      const url = URL.createObjectURL(img.blob)
      const link = document.createElement("a")
      link.href = url
      link.download = img.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
  }

  if (!file) {
      return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">PDF to Image</h2>
                 <p className="text-muted-foreground">Convert PDF pages to high-quality images.</p>
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
    <div className="space-y-8 pb-20">
       {/* Configuration Header */}
       <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6">
           <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
               <div>
                   <h3 className="font-semibold text-lg truncate max-w-[300px]" title={file.name}>{file.name}</h3>
                   <p className="text-sm text-muted-foreground">{totalPages} pages • {selectedPages.size} selected</p>
               </div>
               <div className="flex gap-2">
                   <Button variant="outline" size="sm" onClick={() => setFile(null)}>Change File</Button>
               </div>
           </div>

           <Separator />

           <div className="grid md:grid-cols-2 gap-8">
               {/* Format Selection */}
               <div className="space-y-3">
                   <Label className="text-base">Image Format</Label>
                   <div className="grid grid-cols-3 gap-3">
                       {FORMATS.map(fmt => (
                           <div
                                key={fmt.id}
                                onClick={() => setSettings(s => ({ ...s, format: fmt.id }))}
                                className={cn(
                                    "cursor-pointer border-2 rounded-lg p-3 text-center transition-all hover:bg-muted/50",
                                    settings.format === fmt.id ? "border-primary bg-primary/5" : "border-muted"
                                )}
                           >
                               <div className="font-semibold uppercase text-sm mb-1">{fmt.label}</div>
                               <div className="text-[10px] text-muted-foreground leading-tight">{fmt.desc}</div>
                           </div>
                       ))}
                   </div>
               </div>

               {/* Quality Settings */}
               <div className="space-y-4">
                   <Label className="text-base flex justify-between">
                       <span>Quality & Resolution</span>
                       <span className="text-xs font-normal text-muted-foreground">{settings.dpi} DPI</span>
                   </Label>

                   {settings.format !== 'png' && (
                       <div className="space-y-2">
                           <div className="flex justify-between text-xs">
                               <span>Compression</span>
                               <span>{settings.quality}%</span>
                           </div>
                           <Slider
                               value={[settings.quality]}
                               min={1} max={100} step={1}
                               onValueChange={([v]) => setSettings(s => ({ ...s, quality: v }))}
                           />
                       </div>
                   )}

                   <div className="space-y-2">
                       <Label className="text-xs">DPI (Scale)</Label>
                       <div className="flex gap-2">
                           {[72, 150, 300].map(dpi => (
                               <Button
                                   key={dpi}
                                   variant={settings.dpi === dpi ? "secondary" : "outline"}
                                   size="sm"
                                   onClick={() => setSettings(s => ({ ...s, dpi }))}
                                   className="flex-1 text-xs"
                               >
                                   {dpi} DPI
                               </Button>
                           ))}
                           <div className="flex items-center gap-1 border rounded-md px-2 w-24">
                               <span className="text-xs text-muted-foreground">Custom</span>
                               <Input
                                   type="number"
                                   value={settings.dpi}
                                   onChange={e => setSettings(s => ({ ...s, dpi: Number(e.target.value) }))}
                                   className="h-7 p-0 border-none text-right focus-visible:ring-0"
                               />
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       </div>

       {/* Page Selection */}
       <div className="space-y-4">
           <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                   <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">Select All</Button>
                   <Button variant="ghost" size="sm" onClick={deselectAll} className="text-xs">Deselect All</Button>
               </div>
               {/* Could add Range Input here later */}
           </div>

           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4 max-h-[500px] overflow-y-auto p-1">
               {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                   const isSelected = selectedPages.has(pageNum)
                   return (
                       <div
                           key={pageNum}
                           onClick={() => togglePageSelection(pageNum)}
                           className={cn(
                               "relative group cursor-pointer border rounded-lg overflow-hidden transition-all",
                               isSelected ? "ring-2 ring-primary border-transparent" : "hover:border-primary/50"
                           )}
                       >
                           <div className="aspect-[3/4] bg-muted/20 relative">
                               {thumbnails[pageNum-1] ? (
                                   // eslint-disable-next-line @next/next/no-img-element
                                   <img src={thumbnails[pageNum-1]} alt={`Page ${pageNum}`} className="object-contain w-full h-full" />
                               ) : (
                                   <div className="flex items-center justify-center h-full text-muted-foreground text-xs p-2 text-center">
                                       {pageNum > 20 ? "No Preview" : "Loading..."}
                                   </div>
                               )}

                               {/* Checkbox Overlay */}
                               <div className="absolute top-2 right-2">
                                   <div className={cn(
                                       "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-sm",
                                       isSelected ? "bg-primary border-primary text-primary-foreground" : "bg-white/80 border-gray-300"
                                   )}>
                                       {isSelected && <Check className="w-3 h-3" />}
                                   </div>
                               </div>

                                <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                                   Page {pageNum}
                               </div>
                           </div>
                       </div>
                   )
               })}
           </div>
       </div>

       {/* Actions */}
       <div className="flex flex-col items-center gap-4 mt-8">
           {!isConverting && convertedImages.length === 0 ? (
               <Button
                   size="lg"
                   onClick={handleConvert}
                   disabled={selectedPages.size === 0}
                   className="w-full md:w-auto min-w-[200px]"
               >
                   <ImageIcon className="mr-2 h-4 w-4" />
                   Convert {selectedPages.size} Images
               </Button>
           ) : isConverting ? (
               <div className="w-full max-w-md space-y-2">
                   <Progress value={progress} />
                   <p className="text-center text-sm text-muted-foreground">Converting... {progress}%</p>
               </div>
           ) : (
               <div className="w-full max-w-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4">
                   <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                       <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                   </div>
                   <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-4">Conversion Success!</h3>

                   <div className="flex flex-col sm:flex-row gap-3 justify-center">
                       <Button onClick={downloadZip} size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                           <Download className="mr-2 h-4 w-4" />
                           Download ZIP
                       </Button>
                       {convertedImages.length === 1 && (
                            <Button variant="outline" onClick={() => downloadSingle(0)}>
                                Download Image
                            </Button>
                       )}
                       <Button variant="ghost" onClick={() => { setConvertedImages([]); setProgress(0); }}>
                           Convert More
                       </Button>
                   </div>
               </div>
           )}
       </div>

    </div>
  )
}
