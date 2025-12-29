"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, arrayMove, horizontalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Download, FileImage, GripVertical, ImagePlus, Loader2, RotateCw, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { PDFDocument } from "pdf-lib"
import { useState } from "react"
import { toast } from "sonner"

// --- Image Card Component ---
interface SortableImageProps {
  id: string
  file: ImageFile
  index: number
  onRemove: (id: string) => void
  onRotate: (id: string) => void
}

function SortableImage({ id, file, index, onRemove, onRotate }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="relative group bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
       <div className="aspect-[3/4] p-2 relative bg-muted/20">
           {/* Image Preview */}
           <div className="w-full h-full relative overflow-hidden rounded-md bg-checkerboard flex items-center justify-center">
             {/* eslint-disable-next-line @next/next/no-img-element */}
             <img
               src={file.preview}
               alt={file.file.name}
               className="max-w-full max-h-full object-contain shadow-sm transition-transform duration-300"
               style={{ transform: `rotate(${file.rotation}deg)` }}
             />
           </div>

           {/* Overlay Controls */}
           <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="destructive" className="h-7 w-7 rounded-md shadow-sm" onClick={() => onRemove(id)}>
                  <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="secondary" className="h-7 w-7 rounded-md shadow-sm" onClick={() => onRotate(id)}>
                  <RotateCw className="h-3.5 w-3.5" />
              </Button>
           </div>

           <div className="absolute top-3 left-3">
               <span className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
                   {index + 1}
               </span>
           </div>

           {/* Drag Handle */}
           <div {...attributes} {...listeners} className="absolute inset-x-0 bottom-0 top-1/2 cursor-grab opacity-0 active:cursor-grabbing" title="Drag to reorder" />
           <div {...attributes} {...listeners} className="absolute bottom-2 right-2 p-1.5 bg-white/80 dark:bg-black/50 rounded cursor-grab sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
           </div>
       </div>
       <div className="p-2 text-xs border-t bg-muted/10">
           <p className="truncate font-medium">{file.file.name}</p>
           <p className="text-muted-foreground">{(file.file.size / 1024 / 1024).toFixed(2)} MB</p>
       </div>
    </div>
  )
}

// --- Main Interface ---

interface ImageFile {
  id: string
  file: File
  preview: string
  rotation: number
}

type PageSize = "A4" | "Letter" | "Legal" | "A3" | "A5"
type Orientation = "portrait" | "landscape"
type FitMode = "fit" | "fill" | "stretch"

export function ImageToPdfInterface() {
  const t = useTranslations('imageToPdf')
  const [images, setImages] = useState<ImageFile[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  const [settings, setSettings] = useState({
    pageSize: "A4" as PageSize,
    orientation: "portrait" as Orientation,
    fitMode: "fit" as FitMode,
    margin: 10, // mm
  })

  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    useSensor(TouchSensor)
  )

  const handleFilesSelected = (files: UploadedFile[]) => {
    const newImages = files.map(f => ({
      id: Math.random().toString(36).substring(7),
      file: f.file,
      preview: URL.createObjectURL(f.file),
      rotation: 0
    }))
    setImages(prev => [...prev, ...newImages])
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const removeImage = (id: string) => {
    setImages(prev => {
        const target = prev.find(i => i.id === id)
        if (target) URL.revokeObjectURL(target.preview)
        return prev.filter(i => i.id !== id)
    })
  }

  const rotateImage = (id: string) => {
    setImages(prev => prev.map(img =>
        img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img
    ))
  }

  // --- Conversion Logic ---

  const getPageDimensions = (size: PageSize, orientation: Orientation) => {
      // Dimensions in points (1/72 inch)
      // 1mm = 2.83465 points
      const mmToPt = 2.83465
      const sizes: Record<PageSize, { w: number, h: number }> = {
          A4: { w: 210 * mmToPt, h: 297 * mmToPt },
          Letter: { w: 215.9 * mmToPt, h: 279.4 * mmToPt },
          Legal: { w: 215.9 * mmToPt, h: 355.6 * mmToPt },
          A3: { w: 297 * mmToPt, h: 420 * mmToPt },
          A5: { w: 148 * mmToPt, h: 210 * mmToPt },
      }

      const dim = sizes[size]
      return orientation === 'portrait' ? { width: dim.w, height: dim.h } : { width: dim.h, height: dim.w }
  }

  const handleConvert = async () => {
    if (images.length === 0) return
    setIsConverting(true)
    setProgress(0)

    try {
        const pdfDoc = await PDFDocument.create()
        const dimensions = getPageDimensions(settings.pageSize, settings.orientation)
        const marginPt = settings.margin * 2.83465 // Convert mm to points

        const contentWidth = dimensions.width - (marginPt * 2)
        const contentHeight = dimensions.height - (marginPt * 2)

        for (let i = 0; i < images.length; i++) {
            const imgData = images[i]
            const page = pdfDoc.addPage([dimensions.width, dimensions.height])

            // Process Image Buffer
            let imageBuffer = await imgData.file.arrayBuffer()
            let pdfImage

            // Handle Rotation via Canvas if needed (simplest is to embed then rotate in PDF draw, but non-90 deg scans might need pre-processing)
            // We'll trust pdf-lib's draw rotation for 90deg steps

            const isPng = imgData.file.type === 'image/png'
            const isJpg = imgData.file.type === 'image/jpeg' || imgData.file.type === 'image/jpg'

            if (isJpg) {
                pdfImage = await pdfDoc.embedJpg(imageBuffer)
            } else if (isPng) {
                pdfImage = await pdfDoc.embedPng(imageBuffer)
            } else {
                // Fallback: Convert to PNG via Canvas
                const canvas = document.createElement('canvas')
                const ctx = canvas.getContext('2d')
                const img = new Image()
                img.src = imgData.preview
                await new Promise(r => img.onload = r)

                canvas.width = img.width
                canvas.height = img.height
                ctx?.drawImage(img, 0, 0)
                const blob = await new Promise<Blob | null>(r => canvas.toBlob(r))
                if (blob) {
                    imageBuffer = await blob.arrayBuffer()
                    pdfImage = await pdfDoc.embedPng(imageBuffer)
                } else {
                    throw new Error(`Failed to convert ${imgData.file.name}`)
                }
            }

            // Calculate Placement
            let drawWidth = pdfImage.width
            let drawHeight = pdfImage.height
            const aspectRatio = drawWidth / drawHeight

            let x = marginPt
            let y = marginPt // Bottom-left origin usually in PDF-lib? Yes.

            // For Fit Mode
            if (settings.fitMode === 'fit') {
                 const availableRatio = contentWidth / contentHeight
                 if (aspectRatio > availableRatio) {
                     // Width constrained
                     drawWidth = contentWidth
                     drawHeight = contentWidth / aspectRatio
                 } else {
                     // Height constrained
                     drawHeight = contentHeight
                     drawWidth = contentHeight * aspectRatio
                 }
            } else if (settings.fitMode === 'fill') {
                // Scaling logic for fill would involve cropping, which requires viewports - tricky in simple embed
                // For now, let's treat Fill as "Cover" logic but clipped?
                // PDF-lib doesn't auto-clip easily without SVG paths/masks.
                // Fallback -> Stretch to aspect ratio that covers, centered.

                // Let's implement Stretch for now as requested
                drawWidth = contentWidth
                drawHeight = contentHeight
            } else if (settings.fitMode === 'stretch') {
                drawWidth = contentWidth
                drawHeight = contentHeight
            }

            // Center Content
            x = marginPt + (contentWidth - drawWidth) / 2
            y = marginPt + (contentHeight - drawHeight) / 2

            page.drawImage(pdfImage, {
                x,
                y,
                width: drawWidth,
                height: drawHeight,
                rotate: { type: 'degrees', angle: imgData.rotation } as any // Type assertion to bypass strict literal check (pdf-lib issue with dynamic values)
            })

             // Progress
             setProgress(Math.round(((i + 1) / images.length) * 100))
             await new Promise(r => setTimeout(r, 10))
        }

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "images-to-pdf.pdf"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(t('success'))

    } catch (err) {
        console.error("PDF Creation Failed", err)
        toast.error(t('error'))
    } finally {
        setIsConverting(false)
    }
  }

  if (images.length === 0) {
      return (
         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <ImagePlus className="h-8 w-8 text-primary" />
                 </div>
                 <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                 <p className="text-muted-foreground">{t('description')}</p>
             </div>
             <FileDropZone
                onFilesSelected={handleFilesSelected}
                accept="image/*"
                multiple={true}
            />
         </div>
      )
  }

  return (
    <div className="grid lg:grid-cols-3 gap-8 pb-20 max-w-6xl mx-auto">
        {/* Left: Image Grid */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-lg font-semibold">{t('imagesSelected', { count: images.length })}</h3>
                   <p className="text-sm text-muted-foreground">{t('dragReorder')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => document.getElementById("add-more-trigger")?.click()}>
                        <ImagePlus className="w-4 h-4 mr-2" /> {t('addImages')}
                    </Button>
                    {/* Hidden input hack for "Add More" since FileDropZone wraps everything usually */}
                     <input
                        id="add-more-trigger"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                             if(e.target.files) {
                                 const files = Array.from(e.target.files).map(f => ({ file: f, id: Math.random().toString(), preview: "" })) // Simple map
                                 handleFilesSelected(files as unknown as UploadedFile[])
                                 e.target.value = "" // Reset
                             }
                        }}
                    />
                    <Button variant="ghost" size="sm" onClick={() => setImages([])} className="text-destructive hover:text-destructive">
                        {t('clearAll')}
                    </Button>
                </div>
            </div>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={(e) => setActiveId(e.active.id as string)}
                onDragEnd={handleDragEnd}
            >
                <SortableContext items={images.map(i => i.id)} strategy={horizontalListSortingStrategy}>
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {images.map((img, idx) => (
                            <SortableImage
                                key={img.id}
                                id={img.id}
                                file={img}
                                index={idx}
                                onRemove={removeImage}
                                onRotate={rotateImage}
                            />
                        ))}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeId ? (
                         <div className="bg-card border rounded-xl shadow-lg opacity-80 w-[150px] h-[200px]"></div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>

        {/* Right: Settings */}
        <div className="space-y-6">
             <Card className="p-6 space-y-6 sticky top-8">
                 <div className="space-y-2">
                     <h3 className="font-semibold flex items-center gap-2">
                         <FileImage className="w-5 h-5 text-primary" />
                         {t('pdfSettings')}
                     </h3>
                     <Separator />
                 </div>

                 <div className="space-y-4">
                     {/* Page Size */}
                     <div className="space-y-2">
                         <Label>{t('pageSize')}</Label>
                         <Select value={settings.pageSize} onValueChange={(v: PageSize) => setSettings(s => ({...s, pageSize: v}))}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="A4">A4 (Standard)</SelectItem>
                                 <SelectItem value="Letter">Letter</SelectItem>
                                 <SelectItem value="Legal">Legal</SelectItem>
                                 <SelectItem value="A3">A3 (Large)</SelectItem>
                                 <SelectItem value="A5">A5 (Small)</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>

                     {/* Orientation */}
                     <div className="space-y-2">
                         <Label>{t('orientation')}</Label>
                         <div className="grid grid-cols-2 gap-2">
                             {(['portrait', 'landscape'] as const).map(o => (
                                 <Button
                                    key={o}
                                    variant={settings.orientation === o ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings(s => ({...s, orientation: o}))}
                                    className="capitalize"
                                 >
                                     {t(o)}
                                 </Button>
                             ))}
                         </div>
                     </div>

                     <Separator />

                     {/* Image Layout */}
                     <div className="space-y-2">
                         <Label>{t('imageScaling')}</Label>
                         <Select value={settings.fitMode} onValueChange={(v: FitMode) => setSettings(s => ({...s, fitMode: v}))}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                 <SelectItem value="fit">{t('scalingFit')}</SelectItem>
                                 <SelectItem value="fill">{t('scalingFill')}</SelectItem>
                                 <SelectItem value="stretch">{t('scalingStretch')}</SelectItem>
                             </SelectContent>
                         </Select>
                     </div>

                     <div className="space-y-3">
                         <div className="flex justify-between">
                            <Label>{t('margin')}</Label>
                            <span className="text-xs text-muted-foreground">{settings.margin} mm</span>
                         </div>
                         <div className="flex gap-2">
                            {[0, 10, 20].map(m => (
                                <Button
                                    key={m}
                                    variant={settings.margin === m ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => setSettings(s => ({...s, margin: m}))}
                                    className="flex-1 text-xs"
                                >
                                    {m === 0 ? t('none') : `${m}mm`}
                                </Button>
                            ))}
                         </div>
                     </div>
                 </div>

                 <Button
                    size="lg"
                    className="w-full"
                    onClick={handleConvert}
                    disabled={isConverting}
                 >
                    {isConverting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('creating', { progress })}
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            {t('createPdf')}
                        </>
                    )}
                 </Button>
             </Card>
        </div>
    </div>
  )
}
