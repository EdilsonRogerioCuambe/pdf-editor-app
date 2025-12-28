"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { ArrowDownToLine, Download, FileText, GripVertical, Loader2, MoveDown, MoveUp, Plus, RotateCcw, X } from "lucide-react"
import { PDFDocument } from "pdf-lib"
import type React from "react"
import { useRef, useState } from "react"
import { toast } from "sonner"

export function MergeInterface() {
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
      toast.error("Please select at least 2 PDF files to merge.")
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
      toast.success("PDFs merged successfully!")

      // Auto download
      const link = document.createElement("a")
      link.href = url
      link.download = "merged.pdf"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error("Merge failed:", error)
      toast.error("Failed to merge PDFs. Please check if the files are valid.")
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
        <h3 className="mb-2 text-2xl font-semibold text-foreground">PDFs Merged Successfully!</h3>
        <p className="mb-8 text-muted-foreground max-w-md">
          Your {files.length} PDF files have been combined into one document. The download has started automatically.
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
            Download Again
          </Button>
          <Button variant="outline" size="lg" onClick={handleReset} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Merge More Files
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!files.length ? (
         <FileDropZone
            onFilesSelected={handleFilesSelected}
            accept=".pdf"
            multiple={true}
            maxFiles={50}
         />
      ) : (
        <div className="space-y-6">
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                 <h3 className="font-medium">Selected Files ({files.length})</h3>
                 <p className="text-sm text-muted-foreground">Drag files to reorder or move them using arrows.</p>
              </div>
              <div className="relative">
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
                    className="absolute inset-0 cursor-pointer opacity-0"
                 />
                 <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto" disabled={isMerging}>
                    <Plus className="h-4 w-4" />
                    Add More Files
                 </Button>
              </div>
           </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={file.id}
                draggable={!isMerging}
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={onDragEnd}
                className={cn(
                  "flex items-center gap-3 rounded-lg border border-border bg-card p-3 shadow-sm transition-all select-none",
                  draggedIndex === index ? "opacity-50 border-primary border-dashed" : "",
                  isMerging ? "cursor-not-allowed opacity-80" : "cursor-grab active:cursor-grabbing hover:border-primary/50"
                )}
              >
                <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground shrink-0">
                  <GripVertical className="h-5 w-5" />
                </div>

                <div className="h-8 w-8 shrink-0 bg-red-100 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/30 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>

                <div className="flex-1 min-w-0 grid gap-0.5">
                   <div className="flex items-center gap-2">
                       <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground shrink-0">
                          {index + 1}
                       </span>
                       <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                   </div>
                  <p className="text-xs text-muted-foreground ml-7">{formatFileSize(file.size)}</p>
                </div>

                 <div className="flex items-center gap-1 shrink-0">
                     <Button
                       variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hidden sm:flex"
                       disabled={index === 0 || isMerging}
                       onClick={() => moveFile(index, index - 1)}
                       title="Move Up"
                     >
                       <MoveUp className="h-3 w-3" />
                     </Button>
                     <Button
                       variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hidden sm:flex"
                       disabled={index === files.length - 1 || isMerging}
                       onClick={() => moveFile(index, index + 1)}
                       title="Move Down"
                     >
                       <MoveDown className="h-3 w-3" />
                     </Button>
                     <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(file.id)}
                        disabled={isMerging}
                        className="text-muted-foreground hover:text-destructive h-8 w-8"
                     >
                        <X className="h-4 w-4" />
                     </Button>
                 </div>
              </div>
            ))}
          </div>

          {isMerging && (
            <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{mergeProgress}%</span>
              </div>
              <Progress value={mergeProgress} className="h-2" />
            </div>
          )}

          <div className="flex gap-4 pt-4">
             <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={handleReset}
                disabled={isMerging}
            >
                Clear All
            </Button>
            <Button
                size="lg"
                className="flex-1 gap-2"
                onClick={mergePdfs}
                disabled={files.length < 2 || isMerging}
            >
                {isMerging ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Merging...
                    </>
                ) : (
                    <>
                        Merge {files.length} PDFs
                    </>
                )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
