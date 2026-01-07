"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowDown, ArrowUp, Loader2, Stamp, Type, Upload } from "lucide-react"
import { useTranslations } from "next-intl"
import { degrees, PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { useState } from "react"
import { toast } from "sonner"

// --- Types ---
type WatermarkType = "text" | "image" | "stamp"

interface WatermarkSettings {
  type: WatermarkType
  text: string
  fontSize: number
  color: string // hex
  opacity: number
  rotation: number
  position: "center" | "tl" | "tr" | "bl" | "br"
  offsetX: number
  offsetY: number
  scale: number // for image
  imageFile: File | null
  imagePreview: string | null
}

export function WatermarkInterface() {
  const t = useTranslations('watermark')
  const [file, setFile] = useState<UploadedFile | null>(null)

  const [settings, setSettings] = useState<WatermarkSettings>({
    type: "text",
    text: "CONFIDENTIAL",
    fontSize: 48,
    color: "#ff0000",
    opacity: 50,
    rotation: 45,
    position: "center",
    offsetX: 0,
    offsetY: 0,
    scale: 50,
    imageFile: null,
    imagePreview: null
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)

  // Handlers
  const handleFileSelected = (files: UploadedFile[]) => {
      if (files.length > 0) setFile(files[0])
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const img = e.target.files[0]
          setSettings(s => ({
              ...s,
              imageFile: img,
              imagePreview: URL.createObjectURL(img)
          }))
      }
  }

  const handleApply = async () => {
    if (!file) return
    setIsProcessing(true)
    setProgress(0)

    try {
        const arrayBuffer = await file.file.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        const pages = pdfDoc.getPages()
        const total = pages.length

        // Prepare Resources
        let embeddedImage
        if (settings.type === 'image' && settings.imageFile) {
            const imgBuffer = await settings.imageFile.arrayBuffer()
            const isPng = settings.imageFile.type === 'image/png'
            embeddedImage = isPng ? await pdfDoc.embedPng(imgBuffer) : await pdfDoc.embedJpg(imgBuffer)
        }

        const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        // Process Pages
        for (let i = 0; i < total; i++) {
            const page = pages[i]
            const { width, height } = page.getSize()

            // Calculate Position Base
            let x = 0, y = 0
            if (settings.position === 'center') {
                x = width / 2
                y = height / 2
            } else if (settings.position === 'tl') {
                x = 50
                y = height - 50
            } else if (settings.position === 'tr') {
                x = width - 50
                y = height - 50
            } else if (settings.position === 'bl') {
                x = 50
                y = 50
            } else if (settings.position === 'br') {
                x = width - 50
                y = 50
            }

            // Add Offsets
            x += settings.offsetX
            y += settings.offsetY

            const opacity = settings.opacity / 100
            const rotate = degrees(settings.rotation)

            if (settings.type === 'text') {
                // Convert Hex to RGB
                const r = parseInt(settings.color.slice(1, 3), 16) / 255
                const g = parseInt(settings.color.slice(3, 5), 16) / 255
                const b = parseInt(settings.color.slice(5, 7), 16) / 255

                // Draw Text
                // Simple centering adjustment implies measuring text usually, but simple approach:
                const textWidth = helveticaFont.widthOfTextAtSize(settings.text, settings.fontSize)
                const textHeight = helveticaFont.heightAtSize(settings.fontSize)

                // If centered, offset by half dimensions
                if (settings.position === 'center') {
                     // Approximate centering with rotation is complex, simplified here:
                     page.drawText(settings.text, {
                         x: x - (textWidth / 2),
                         y: y - (textHeight / 2),
                         size: settings.fontSize,
                         font: helveticaFont,
                         color: rgb(r, g, b),
                         opacity,
                         rotate,
                     })
                } else {
                     page.drawText(settings.text, { x, y, size: settings.fontSize, font: helveticaFont, color: rgb(r, g, b), opacity, rotate })
                }

            } else if (settings.type === 'image' && embeddedImage) {
                 const scale = settings.scale / 100
                 const imgDims = embeddedImage.scale(scale)

                 page.drawImage(embeddedImage, {
                     x: x - (imgDims.width / 2),
                     y: y - (imgDims.height / 2),
                     width: imgDims.width,
                     height: imgDims.height,
                     opacity,
                     rotate
                 })
            }

            setProgress(Math.round(((i + 1) / total) * 100))
            await new Promise(r => setTimeout(r, 1)) // Yield
        }

        const pdfBytes = await pdfDoc.save()
        const blob = new Blob([pdfBytes as any], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `watermarked-${file.name}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success(t('success'))

    } catch (err) {
        console.error("Watermark failed", err)
        toast.error(t('error'))
    } finally {
        setIsProcessing(false)
    }
  }

  if (!file) {
      return (
         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Stamp className="h-8 w-8 text-primary" />
                 </div>
                 <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                 <p className="text-muted-foreground">{t('description')}</p>
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
    <div className="grid lg:grid-cols-3 gap-8 pb-20 max-w-6xl mx-auto">
        {/* Left: Preview (Simple placeholder for now, ideally shows PDF page) */}
        <div className="lg:col-span-2 bg-muted/20 rounded-xl border flex items-center justify-center min-h-[500px] relative">
            <div className="text-center">
                <Stamp className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-2">Preview not available (Processing happens on Apply)</p>
            </div>

            {/* Visualizer for Settings (abstract) */}
            <div
                className="absolute w-40 h-40 border-2 border-dashed border-primary/50 flex items-center justify-center pointer-events-none"
                style={{
                    top: settings.position === 'center' ? '50%' : settings.position.includes('b') ? '80%' : '20%',
                    left: settings.position === 'center' ? '50%' : settings.position.includes('r') ? '80%' : '20%',
                    transform: `translate(-50%, -50%) rotate(${settings.rotation}deg)`,
                    opacity: settings.opacity / 100
                }}
            >
                {settings.type === 'text' ? (
                    <span className="font-bold text-primary truncate max-w-full" style={{ fontSize: `${Math.max(12, settings.fontSize / 2)}px`, color: settings.color }}>
                        {settings.text}
                    </span>
                ) : settings.imagePreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={settings.imagePreview} alt="Watermark" className="max-w-full max-h-full object-contain" />
                ) : (
                    <span className="text-xs">{t('image')}</span>
                )}
            </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-6">
             <Card className="p-6 space-y-6">
                 <div>
                     <h3 className="font-semibold">{t('settingsTitle')}</h3>
                     <Separator className="mt-2" />
                 </div>

                 <Tabs value={settings.type} onValueChange={(v) => setSettings(s => ({...s, type: v as WatermarkType}))}>
                     <TabsList className="w-full grid grid-cols-3">
                         <TabsTrigger value="text"><Type className="w-4 h-4 mr-2"/> {t('tabText')}</TabsTrigger>
                         <TabsTrigger value="image"><Upload className="w-4 h-4 mr-2"/> {t('tabImage')}</TabsTrigger>
                         <TabsTrigger value="stamp" disabled><Stamp className="w-4 h-4 mr-2"/> {t('tabStamp')}</TabsTrigger>
                     </TabsList>

                     <TabsContent value="text" className="space-y-4 mt-4">
                         <div className="space-y-2">
                             <Label>{t('textLabel')}</Label>
                             <Input
                                value={settings.text}
                                onChange={e => setSettings(s => ({...s, text: e.target.value}))}
                             />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                 <Label>{t('fontSize')}</Label>
                                 <Input
                                    type="number"
                                    value={settings.fontSize}
                                    onChange={e => setSettings(s => ({...s, fontSize: Number(e.target.value)}))}
                                 />
                             </div>
                             <div className="space-y-2">
                                 <Label>{t('color')}</Label>
                                 <div className="flex gap-2">
                                     <Input
                                        type="color"
                                        value={settings.color}
                                        className="w-12 p-1"
                                        onChange={e => setSettings(s => ({...s, color: e.target.value}))}
                                     />
                                     <Input
                                        value={settings.color}
                                        onChange={e => setSettings(s => ({...s, color: e.target.value}))}
                                        className="flex-1"
                                     />
                                 </div>
                             </div>
                         </div>
                     </TabsContent>

                     <TabsContent value="image" className="space-y-4 mt-4">
                         <div className="space-y-2">
                             <Label>{t('uploadImage')}</Label>
                             <Input type="file" accept="image/*" onChange={handleImageUpload} />
                         </div>
                         {settings.imagePreview && (
                             <div className="space-y-2">
                                 <div className="flex justify-between">
                                     <Label>{t('scale', { value: settings.scale })}</Label>
                                 </div>
                                 <Slider
                                    value={[settings.scale]}
                                    min={10} max={200} step={5}
                                    onValueChange={([v]) => setSettings(s => ({...s, scale: v}))}
                                 />
                             </div>
                         )}
                     </TabsContent>

                     <TabsContent value="stamp">
                         <div className="text-center py-4 text-muted-foreground text-sm">
                             {t('stampPlaceholder')}
                         </div>
                     </TabsContent>
                 </Tabs>

                 <Separator />

                 {/* Common Settings */}
                 <div className="space-y-4">
                     <div className="space-y-2">
                         <div className="flex justify-between">
                            <Label>{t('opacity')}: {settings.opacity}%</Label>
                         </div>
                         <Slider
                            value={[settings.opacity]}
                            min={10} max={100} step={5}
                            onValueChange={([v]) => setSettings(s => ({...s, opacity: v}))}
                         />
                     </div>

                     <div className="space-y-2">
                         <div className="flex justify-between">
                            <Label>{t('rotation')}: {settings.rotation}°</Label>
                         </div>
                         <Slider
                            value={[settings.rotation]}
                            min={0} max={360} step={15}
                            onValueChange={([v]) => setSettings(s => ({...s, rotation: v}))}
                         />
                     </div>

                     <div className="space-y-2">
                         <Label>{t('position')}</Label>
                         <div className="grid grid-cols-3 gap-2">
                            <div/>
                            <Button variant={settings.position === 'tl' ? 'default' : 'outline'} size="sm" onClick={() => setSettings(s => ({...s, position: 'tl'}))}><ArrowUp className="rotate-[-45deg] w-3 h-3"/></Button>
                            <div/>

                            <Button variant={settings.position === 'bl' ? 'default' : 'outline'} size="sm" onClick={() => setSettings(s => ({...s, position: 'bl'}))}><ArrowDown className="rotate-45deg w-3 h-3"/></Button>
                            <Button variant={settings.position === 'center' ? 'default' : 'outline'} size="sm" onClick={() => setSettings(s => ({...s, position: 'center'}))} className="text-xs">{t('center')}</Button>
                            <Button variant={settings.position === 'tr' ? 'default' : 'outline'} size="sm" onClick={() => setSettings(s => ({...s, position: 'tr'}))}><ArrowUp className="rotate-45deg w-3 h-3"/></Button>

                            <div/>
                            <Button variant={settings.position === 'br' ? 'default' : 'outline'} size="sm" onClick={() => setSettings(s => ({...s, position: 'br'}))}><ArrowDown className="rotate-[-45deg] w-3 h-3"/></Button>
                            <div/>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                             <Label className="text-xs">{t('offsetX')}</Label>
                             <Input type="number" value={settings.offsetX} onChange={e => setSettings(s => ({...s, offsetX: Number(e.target.value)}))} />
                         </div>
                         <div className="space-y-2">
                             <Label className="text-xs">{t('offsetY')}</Label>
                             <Input type="number" value={settings.offsetY} onChange={e => setSettings(s => ({...s, offsetY: Number(e.target.value)}))} />
                         </div>
                     </div>
                 </div>

                 <Button
                    className="w-full"
                    size="lg"
                    onClick={handleApply}
                    disabled={isProcessing}
                 >
                     {isProcessing ? (
                         <>
                             <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                             {t('applying', { progress })}
                         </>
                     ) : (
                         <>
                             <Stamp className="w-4 h-4 mr-2" />
                             {t('apply')}
                         </>
                     )}
                 </Button>

             </Card>
        </div>
    </div>
  )
}
