"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ArrowDownToLine, Download, FileText, GripVertical, Loader2, MoveDown, MoveUp, Plus, RotateCcw, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { PDFDocument } from "pdf-lib"
import type React from "react"
import { useRef, useState } from "react"
import { toast } from "sonner"

export function MergeInterface() {
  const t = useTranslations('tools.merge')
  const tCommon = useTranslations('common')
  const tMsg = useTranslations('messages')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isMerging, setIsMerging] = useState(false)
  const [mergeProgress, setMergeProgress] = useState(0)
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null)

  // Drag and drop reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const handleFilesSelected = (newFiles: UploadedFile[]) => {
    setFiles((prev) => {
      // Create a set of existing file names to avoid duplicates if that's a concern,
      // but simplistic appending is usually fine for a merge tool unless the user adds the exact same file twice intentionally.
      // We will just append.
      return [...prev, ...newFiles]
    })
    setMergedPdfUrl(null)
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
            {files.map((file, index) => (
              <div
                key={file.id}
                draggable={!isMerging}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={cn(
                  "flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm transition-all select-none group",
                  draggedIndex === index ? "opacity-50 border-primary border-dashed ring-2 ring-primary/10" : "hover:border-primary/30 hover:shadow-md",
                  isMerging ? "cursor-not-allowed opacity-80" : "cursor-grab active:cursor-grabbing"
                )}
              >
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground shrink-0 transition-colors">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="h-10 w-10 shrink-0 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>

                <div className="flex-1 min-w-0 grid gap-1">
                   <div className="flex items-center gap-2">
                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground shrink-0">
                          {index + 1}
                       </span>
                       <p className="truncate font-medium text-foreground">{file.name}</p>
                   </div>
                  <p className="text-xs text-muted-foreground ml-7">{formatFileSize(file.size)}</p>
                </div>

                 <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                     <Button
                       variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                       disabled={index === 0 || isMerging}
                       onClick={() => moveFile(index, index - 1)}
                       title={tCommon('previous')}
                     >
                       <MoveUp className="h-4 w-4" />
                     </Button>
                     <Button
                       variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hidden sm:flex"
                       disabled={index === files.length - 1 || isMerging}
                       onClick={() => moveFile(index, index + 1)}
                       title={tCommon('next')}
                     >
                       <MoveDown className="h-4 w-4" />
                     </Button>
                     <div className="w-px h-4 bg-border mx-1 hidden sm:block" />
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        disabled={isMerging}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                     >
                        <X className="h-4 w-4" />
                     </Button>
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
