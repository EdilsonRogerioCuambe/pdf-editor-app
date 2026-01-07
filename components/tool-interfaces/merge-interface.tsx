"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ArrowDownToLine, Download, FileText, GripVertical, Loader2, Merge, MoveDown, MoveUp, Plus, RotateCcw, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { PDFDocument } from "pdf-lib"
import type React from "react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { generatePageThumbnail, loadPDFDocument } from "./annotate/pdf-renderer"

interface MergeFile extends UploadedFile {
  thumbnail?: string
}

export function MergeInterface() {
  const t = useTranslations('tools.merge')
  const tCommon = useTranslations('common')
  const tMsg = useTranslations('messages')
  const [files, setFiles] = useState<MergeFile[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [mergeProgress, setMergeProgress] = useState(0)
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null)

  // Track if we are currently generating thumbnails to avoid double processing if needed
  // implementation below handles it per file addition

  // Drag and drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const generateThumbnails = async (newFiles: MergeFile[]) => {
    for (const fileItem of newFiles) {
      if (fileItem.thumbnail) continue // Already has thumbnail

      try {
        const pdfDoc = await loadPDFDocument(fileItem.file)
        const page = await pdfDoc.getPage(1)
        const thumbnail = await generatePageThumbnail(page, 100) // 100px width for thumbnail

        // Update state with new thumbnail
        setFiles(prev => prev.map(f =>
          f.id === fileItem.id ? { ...f, thumbnail } : f
        ))

        // Cleanup
        // In a real app we might want to keep the doc open if we process it immediately,
        // but here we just want the thumb.
        // pdfDoc.destroy() // Note: pdfjs-dist proxy doesn't strictly need manual destroy always but good practice if heavy.
        // The helper 'cleanupPDFDocument' could be used, but we just let GC handle it as we only grabbed one page.
      } catch (error) {
        console.error("Error generating thumbnail for", fileItem.name, error)
      }
    }
  }

  const handleFilesSelected = (incomingFiles: UploadedFile[]) => {
    const newMergeFiles: MergeFile[] = incomingFiles.map(f => ({ ...f }))

    setFiles((prev) => {
      const updated = [...prev, ...newMergeFiles]
      return updated
    })

    setMergedPdfUrl(null)

    // Trigger thumbnail generation
    generateThumbnails(newMergeFiles)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setMergedPdfUrl(null)
  }

  const moveFile = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= files.length) return

    setFiles((prevFiles) => {
      const newFiles = [...prevFiles]
      const [movedItem] = newFiles.splice(fromIndex, 1)
      newFiles.splice(toIndex, 0, movedItem)
      return newFiles
    })
  }

  // Drag handlers
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    // HACK: for Firefox, need to set some data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e.dataTransfer.setData("text/html", (e.currentTarget.parentNode as any) as string)

    // Create a custom drag image from the thumbnail if it exists
    const file = files[index];
    if (file.thumbnail) {
        const img = new Image();
        img.src = file.thumbnail;
        img.width = 50; // Scale it down for the drag ghost
        e.dataTransfer.setDragImage(img, 25, 25);
    }
  }

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    dragOverItem.current = index
  }

  const onDragEnd = () => {
    if (draggedIndex !== null && dragOverItem.current !== null && draggedIndex !== dragOverItem.current) {
      moveFile(draggedIndex, dragOverItem.current)
    }
    setDraggedIndex(null)
    dragOverItem.current = null
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const mergePdfs = async () => {
    if (files.length < 2) {
      toast.error(tMsg('selectTwoFiles'))
      return
    }

    setIsMerging(true)
    setMergeProgress(0)
    setMergedPdfUrl(null)

    try {
      const mergedPdf = await PDFDocument.create()
      const totalFiles = files.length

      for (let i = 0; i < totalFiles; i++) {
        const fileData = await files[i].file.arrayBuffer()
        const pdf = await PDFDocument.load(fileData)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

        copiedPages.forEach((page) => mergedPdf.addPage(page))

        setMergeProgress(Math.round(((i + 1) / totalFiles) * 80)) // Up to 80% processing
      }

      setMergeProgress(90)
      const mergedPdfBytes = await mergedPdf.save()
      const blob = new Blob([mergedPdfBytes as any], { type: "application/pdf" })
      const url = URL.createObjectURL(blob)

      setMergedPdfUrl(url)
      setMergeProgress(100)
      toast.success(tMsg('mergeSuccess'))

      // Auto download
      const link = document.createElement("a")
      link.href = url
      link.download = "merged.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error("Merge failed:", error)
      toast.error(tMsg('mergeError'))
    } finally {
      setIsMerging(false)
    }
  }

  const handleReset = () => {
    setFiles([])
    setMergedPdfUrl(null)
    setMergeProgress(0)
  }

  if (mergedPdfUrl && !isMerging) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <Download className="h-10 w-10 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="mb-2 text-2xl font-semibold text-foreground">{tMsg('mergeSuccessTitle')}</h3>
        <p className="mb-8 text-muted-foreground max-w-md">
          {tMsg('mergeSuccessDesc', { count: files.length })}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button size="lg" className="gap-2" onClick={() => {
              const link = document.createElement("a")
              link.href = mergedPdfUrl
              link.download = "merged.pdf"
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
          }}>
            <ArrowDownToLine className="h-5 w-5" />
            {tMsg('downloadAgain')}
          </Button>
          <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            {tMsg('mergeMore')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
      {!files.length ? (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                 <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Merge className="h-8 w-8 text-primary" />
                 </div>
                 <h2 className="text-3xl font-bold tracking-tight">{t('name')}</h2>
                 <p className="text-muted-foreground">{t('description')}</p>
             </div>
             <FileDropZone
                onFilesSelected={handleFilesSelected}
                accept=".pdf"
                multiple={true}
                maxFiles={50}
             />
        </div>
      ) : (
        <div className="space-y-6 h-full flex flex-col">
           <div className="flex items-center justify-between border-b pb-4">
               <div>
                   <h3 className="font-semibold text-lg flex items-center gap-2">
                      {t('name')} ({files.length})
                   </h3>
                   <button onClick={handleReset} className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">
                       <RotateCcw className="w-3 h-3" /> {tCommon('startOver')}
                   </button>
               </div>

                <div className="flex items-center gap-2 relative">
                    <input
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                const newFiles: UploadedFile[] = Array.from(e.target.files).map((file, i) => ({
                                    id: `${file.name}-${Date.now()}-${i}`,
                                    name: file.name,
                                    size: file.size,
                                    file: file
                                }))
                                handleFilesSelected(newFiles)
                                e.target.value = ''
                            }
                        }}
                        className="absolute inset-0 cursor-pointer opacity-0 w-10 h-full z-10"
                        title={tCommon('addFiles')}
                     />
                   <Button variant="secondary" size="sm" className="gap-2" disabled={isMerging}>
                        <Plus className="h-4 w-4" />
                        {tCommon('addFiles')}
                   </Button>
                   <Button onClick={mergePdfs} disabled={files.length < 2 || isMerging}>
                       {isMerging ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                       {isMerging ? tCommon('merging') : t('name')}
                   </Button>
               </div>
           </div>

           {isMerging && (
             <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
               <div className="flex items-center justify-between text-sm">
                 <span>{tCommon('processing')}</span>
                 <span>{mergeProgress}%</span>
               </div>
               <Progress value={mergeProgress} className="h-2" />
             </div>
           )}

          <div className="space-y-3">
             <div className="flex items-center justify-between px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <span>{tCommon('fileOrder')}</span>
                <span>{tCommon('actions')}</span>
             </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  draggable={!isMerging}
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index)}
                  onDragEnd={onDragEnd}
                  className={cn(
                    "relative flex flex-col aspect-[3/4] rounded-xl border border-border bg-card shadow-sm transition-all select-none overflow-hidden group",
                    draggedIndex === index ? "opacity-50 border-primary border-dashed ring-2 ring-primary/10" : "hover:border-primary/50 hover:shadow-md",
                    isMerging ? "cursor-not-allowed opacity-80" : "cursor-grab active:cursor-grabbing"
                  )}
                >
                  {/* Thumbnail / Preview Area */}
                  <div className="flex-1 bg-muted/30 relative flex items-center justify-center overflow-hidden">
                      {file.thumbnail ? (
                          <img
                              src={file.thumbnail}
                              alt={`Preview ${file.name}`}
                              className="w-full h-full object-contain p-2"
                          />
                      ) : (
                          <div className="flex flex-col items-center gap-2 text-muted-foreground/50">
                              <FileText className="h-10 w-10" />
                              <span className="text-xs">PDF</span>
                          </div>
                      )}

                      {/* Hover Overlay for Drag Handle */}
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <GripVertical className="h-8 w-8 text-foreground/50" />
                      </div>
                  </div>

                  {/* Footer Info */}
                  <div className="p-3 bg-card border-t border-border z-10">
                      <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary shrink-0">
                             {index + 1}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(file.size)}</span>
                      </div>
                      <p className="truncate text-xs font-medium text-foreground w-full py-1" title={file.name}>{file.name}</p>
                  </div>

                  {/* Actions Overlay - Top Right */}
                   <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity z-20">
                       <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeFile(file.id)}
                          disabled={isMerging}
                          className="h-7 w-7 rounded-lg shadow-sm"
                          title={tCommon('remove')}
                       >
                          <X className="h-3 w-3" />
                       </Button>
                   </div>

                   {/* Move Actions Overlay - Bottom (Optional, if drag is hard) */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                         <div className="flex flex-col gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-0.5 border shadow-sm">
                             <Button
                               variant="ghost" size="icon" className="h-6 w-6"
                               disabled={index === 0 || isMerging}
                               onClick={() => moveFile(index, index - 1)}
                               title={tCommon('previous')}
                             >
                               <MoveUp className="h-3 w-3" />
                             </Button>
                             <Button
                               variant="ghost" size="icon" className="h-6 w-6"
                               disabled={index === files.length - 1 || isMerging}
                               onClick={() => moveFile(index, index + 1)}
                               title={tCommon('next')}
                             >
                               <MoveDown className="h-3 w-3" />
                             </Button>
                         </div>
                    </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
