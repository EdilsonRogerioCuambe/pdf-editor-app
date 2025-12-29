"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
// import { Slider } from "@/components/ui/slider" // Kept for future advanced mode
import { analyzePDF, type PDFAnalysisResult, validateCompressionSettings } from "@/lib/pdf-analysis"
import { cn } from "@/lib/utils"
import { AlertTriangle, ArrowRight, CheckCircle2, Download, FileText, Image as ImageIcon, Loader2, Minimize2, RefreshCw, ShieldAlert } from "lucide-react"
import { useTranslations } from "next-intl"
import { PDFDocument } from "pdf-lib"
import * as pdfjsLib from "pdfjs-dist"
import { useState } from "react"
import { toast } from "sonner"

// Ensure worker
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
}

type CompressionLevel = 'low' | 'medium' | 'high'

const LEVEL_KEYS: Record<CompressionLevel, { labelKey: string, descKey: string, quality: number, scale: number }> = {
    low: { labelKey: "low", descKey: "lowDesc", quality: 0.8, scale: 1.5 },
    medium: { labelKey: "medium", descKey: "mediumDesc", quality: 0.6, scale: 1.0 },
    high: { labelKey: "high", descKey: "highDesc", quality: 0.4, scale: 0.8 }
}

export function CompressInterface() {
  const t = useTranslations('compress')
  const tCommon = useTranslations('common')
  const [file, setFile] = useState<UploadedFile | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<PDFAnalysisResult | null>(null)

  const [selectedLevel, setSelectedLevel] = useState<CompressionLevel>('medium')

  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState(0)

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [compressionStats, setCompressionStats] = useState<{original: number, new: number} | null>(null)
  const [processedPdfBytes, setProcessedPdfBytes] = useState<Uint8Array | null>(null)

  const handleFileSelected = async (files: UploadedFile[]) => {
    if (files.length === 0) return
    const newFile = files[0]
    setFile(newFile)
    setProcessedPdfBytes(null)
    setCompressionStats(null)

    // Start Analysis
    setIsAnalyzing(true)
    try {
        const result = await analyzePDF(newFile.file)
        setAnalysis(result)
        // Auto-select safest level
        setSelectedLevel(result.recommendation)

        if (result.warnings.length > 0) {
            toast(t('analysisComplete'), {
                description: t('analysisCompleteDesc'),
            })
        }
    } catch (err) {
        console.error("Analysis Failed", err)
        toast.error(t('analysisFailed'))
        // Fallback default
        setAnalysis({
            totalPages: 1,
            hasText: false,
            hasImages: true,
            textRatio: 0,
            imageQualityEstimation: 100,
            alreadyCompressed: false,
            compressionPotential: 50,
            recommendation: 'medium',
            warnings: [],
            minSafeQuality: 0.1
        })
    } finally {
        setIsAnalyzing(false)
    }
  }

  const handleCompress = async (confirmed = false) => {
    if (!file || !analysis) return

    // 1. Validation Pre-Check
    const settings = LEVEL_KEYS[selectedLevel]
    const validation = validateCompressionSettings(analysis, settings.quality)

    if (!validation.valid && !confirmed) {
        // Show Blocking Alert or Warning Modal?
        // For this requirements, we block hazardous compression unless user overrides (if we allowed custom)
        // But since we have fixed levels, we might just want to show a strong warning confirmation
        toast.error(validation.message)
        return
    }

    setIsCompressing(true)
    setProgress(0)

    try {
        const fileBuffer = await file.file.arrayBuffer()

        // Rasterization Strategy
        // 1. Load PDF with PDF.js
        const pdf = await pdfjsLib.getDocument(fileBuffer).promise
        const newPdfDoc = await PDFDocument.create()

        const totalPages = pdf.numPages

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i)
            const viewport = page.getViewport({ scale: settings.scale }) // Scale affects resolution

            // Render to Canvas
            const canvas = document.createElement('canvas')
            canvas.width = viewport.width
            canvas.height = viewport.height
            const context = canvas.getContext('2d')

            await page.render({ canvasContext: context!, viewport }).promise

            // Compress as JPEG
            const imgDataUrl = canvas.toDataURL('image/jpeg', settings.quality)

            // Embed in new PDF
            const jpgImage = await newPdfDoc.embedJpg(imgDataUrl)
            const newPage = newPdfDoc.addPage([viewport.width, viewport.height])
            newPage.drawImage(jpgImage, {
                x: 0,
                y: 0,
                width: viewport.width,
                height: viewport.height,
            })

            setProgress(Math.round((i / totalPages) * 90))
        }

        const compressedBytes = await newPdfDoc.save()
        setProgress(100)

        // Stats Check
        const originalSize = file.file.size
        const newSize = compressedBytes.byteLength

        setCompressionStats({ original: originalSize, new: newSize })
        setProcessedPdfBytes(compressedBytes)

        // Heuristic: If size increased or barely decreased, warn
        if (newSize > originalSize * 0.95) {
             toast.warning(t('optimizationLimited'), {
                 description: t('optimizationLimitedDesc'),
                 duration: 6000
             })
        } else {
             toast.success(t('compressionSuccess'), {
                 description: t('saved', { size: ((originalSize - newSize) / 1024 / 1024).toFixed(2) })
             })
        }

    } catch (err) {
        console.error("Compression ended with error", err)
        toast.error("Failed to compress PDF")
    } finally {
        setIsCompressing(false)
    }
  }

  const downloadPDF = () => {
    if (!processedPdfBytes || !file) return
    const blob = new Blob([processedPdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `compressed-${file.name}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!file) {
      return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
             <div className="text-center space-y-2">
                 <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
                 <p className="text-muted-foreground">{t('subtitle')}</p>
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

  if (isAnalyzing) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <div className="text-center">
                  <h3 className="font-semibold text-lg">{t('analyzing')}</h3>
                  <p className="text-muted-foreground text-sm">{t('detecting')}</p>
              </div>
          </div>
      )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-20">

       <div className="flex items-center justify-between">
            <div>
                <h3 className="text-2xl font-semibold opacity-90">{file.name}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('originalSize')}: {(file.file.size / 1024 / 1024).toFixed(2)} MB • {analysis?.totalPages} {tCommon('pages')}
                </p>
            </div>
            <Button variant="ghost" onClick={() => setFile(null)}>{t('changeFile')}</Button>
       </div>

       {/* Analysis Report */}
       {analysis && (
           <div className="grid md:grid-cols-3 gap-4">
                <Card className={cn("border-l-4", analysis.hasText ? "border-l-amber-500" : "border-l-blue-500")}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                            {analysis.hasText ? <FileText className="w-5 h-5 text-amber-500" /> : <ImageIcon className="w-5 h-5 text-blue-500" />}
                            <span className="font-semibold">{analysis.hasText ? t('textHeavy') : t('imageRich')}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {analysis.hasText
                              ? t('textHeavyDesc')
                              : t('imageRichDesc')}
                        </p>
                    </CardContent>
                </Card>

                <Card className={cn("border-l-4", analysis.alreadyCompressed ? "border-l-red-500" : "border-l-green-500")}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                             {analysis.alreadyCompressed ? <Minimize2 className="w-5 h-5 text-red-500" /> : <RefreshCw className="w-5 h-5 text-green-500" />}
                             <span className="font-semibold">{analysis.alreadyCompressed ? t('alreadyOptimized') : t('compressible')}</span>
                        </div>
                        <div className="space-y-1">
                             <div className="flex justify-between text-xs">
                                 <span>{t('potential')}</span>
                                 <span className={cn("font-bold", analysis.compressionPotential > 70 ? "text-green-600" : "text-amber-600")}>
                                     {analysis.compressionPotential > 70 ? t('high') : analysis.compressionPotential > 30 ? t('medium') : t('low')}
                                 </span>
                             </div>
                             <Progress value={analysis.compressionPotential} className="h-1.5" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                             <ShieldAlert className="w-5 h-5 text-purple-500" />
                             <span className="font-semibold">{t('safetyLimits')}</span>
                        </div>
                         <p className="text-xs text-muted-foreground mb-1">
                            Min Quality: {Math.round(analysis.minSafeQuality * 100)}%
                        </p>
                        <div className="flex flex-wrap gap-1">
                            {analysis.warnings.length > 0 ? (
                                <Badge variant="destructive" className="text-[10px]">{t('activeConstraints')}</Badge>
                            ) : (
                                <Badge variant="secondary" className="text-[10px]">{t('noMajorRisks')}</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
           </div>
       )}

       {/* Warnings Display */}
       {analysis?.warnings && analysis.warnings.length > 0 && (
           <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
               <AlertTriangle className="h-4 w-4" />
               <AlertTitle>{t('optimizationWarning')}</AlertTitle>
               <AlertDescription className="text-sm mt-1">
                   <ul className="list-disc pl-4 space-y-1">
                       {analysis.warnings.map((w, i) => <li key={i}>{w}</li>)}
                   </ul>
               </AlertDescription>
           </Alert>
       )}

       {/* Compression Levels */}
       <div>
           <Label className="text-base mb-4 block">{t('selectMode')}</Label>
           <div className="grid md:grid-cols-3 gap-4">
               {(Object.keys(LEVEL_KEYS) as CompressionLevel[]).map((level) => {
                   const config = LEVEL_KEYS[level]
                   const isRisky = config.quality < (analysis?.minSafeQuality || 0)
                   const isSelected = selectedLevel === level

                   return (
                       <button
                           key={level}
                           onClick={() => setSelectedLevel(level)}
                           disabled={isRisky}
                           className={cn(
                               "relative text-left p-4 rounded-xl border-2 transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring",
                               isSelected ? "border-primary bg-primary/5" : "border-border",
                               isRisky && "opacity-50 cursor-not-allowed bg-muted"
                           )}
                       >
                           {isSelected && <div className="absolute top-3 right-3 text-primary"><CheckCircle2 className="w-5 h-5"/></div>}

                           <h4 className="font-semibold flex items-center gap-2">
                               {t(`levels.${config.labelKey}`)}
                               {analysis?.recommendation === level && <Badge className="text-[10px] h-5">{t('levels.recommended')}</Badge>}
                           </h4>
                           <p className="text-sm text-muted-foreground mt-1 mb-3">{t(`levels.${config.descKey}`)}</p>

                           {isRisky && (
                               <div className="flex items-center gap-1.5 text-xs text-destructive font-medium mt-2 bg-destructive/10 p-1.5 rounded">
                                   <AlertTriangle className="w-3 h-3" />
                                   <span>{t('unsafe')}</span>
                               </div>
                           )}
                       </button>
                   )
               })}
           </div>
       </div>

       {/* Action Area */}
       <div className="flex flex-col items-center gap-4 py-6">
           {!processedPdfBytes ? (
               <Button
                    size="lg"
                    onClick={() => handleCompress()}
                    disabled={isCompressing || !analysis}
                    className="w-full md:w-auto min-w-[200px]"
                >
                   {isCompressing ? (
                       <>
                         <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                         {t('optimizing')} ({progress}%)
                       </>
                   ) : (
                       <>
                         <Minimize2 className="mr-2 h-4 w-4" />
                         {t('compressPdf')}
                       </>
                   )}
               </Button>
           ) : (
                <div className="w-full max-w-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Download className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-1">{t('compressionComplete')}</h3>

                    {compressionStats && (
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                            <span>{(compressionStats.original / 1024 / 1024).toFixed(2)} MB</span>
                            <ArrowRight className="w-3 h-3" />
                            <span className="font-bold text-foreground">{(compressionStats.new / 1024 / 1024).toFixed(2)} MB</span>
                            <Badge variant="outline" className="ml-2">
                                -{Math.round((1 - compressionStats.new / compressionStats.original) * 100)}%
                            </Badge>
                        </div>
                    )}

                    <div className="flex gap-3 justify-center">
                        <Button onClick={downloadPDF} size="lg" className="bg-green-600 hover:bg-green-700 text-white">
                            {t('downloadCompressed')}
                        </Button>
                        <Button variant="outline" onClick={() => { setProcessedPdfBytes(null); setCompressionStats(null); }}>
                            {t('compressAnother')}
                        </Button>
                    </div>
                </div>
           )}
       </div>


    </div>
  )
}
