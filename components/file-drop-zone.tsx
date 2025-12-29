"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CloudUpload, FileText, X } from "lucide-react"
import { useCallback, useState } from "react"

export interface UploadedFile {
  id: string
  name: string
  size: number
  file: File
}

interface FileDropZoneProps {
  onFilesSelected: (files: UploadedFile[]) => void
  multiple?: boolean
  accept?: string
  maxFiles?: number
}

import { useTranslations } from "next-intl"

export function FileDropZone({ onFilesSelected, multiple = true, accept = ".pdf", maxFiles = 20 }: FileDropZoneProps) {
  const t = useTranslations('common.dropZone')
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const processFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: UploadedFile[] = []
      const existingIds = new Set(files.map((f) => f.id))

      for (let i = 0; i < Math.min(fileList.length, maxFiles - files.length); i++) {
        const file = fileList[i]
        const id = `${file.name}-${file.size}-${Date.now()}-${i}`

        if (!existingIds.has(id)) {
          newFiles.push({
            id,
            name: file.name,
            size: file.size,
            file,
          })
        }
      }

      if (newFiles.length > 0) {
        const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
        setFiles(updatedFiles)
        onFilesSelected(updatedFiles)
      }
    },
    [files, maxFiles, multiple, onFilesSelected],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      processFiles(e.dataTransfer.files)
    },
    [processFiles],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files)
      }
    },
    [processFiles],
  )

  const removeFile = useCallback(
    (id: string) => {
      const updatedFiles = files.filter((f) => f.id !== id)
      setFiles(updatedFiles)
      onFilesSelected(updatedFiles)
    },
    [files, onFilesSelected],
  )

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all group",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <input
              title="Upload"
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        <div className="flex flex-col items-center gap-4 p-8 text-center">
          <div
            className={cn(
              "flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
              isDragging ? "bg-primary/20 scale-110" : "bg-primary/10 group-hover:bg-primary/20",
            )}
          >
            <CloudUpload
              className={cn("h-10 w-10 transition-colors duration-300", isDragging ? "text-primary" : "text-primary/70 group-hover:text-primary")}
            />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">
              {isDragging ? t('dragText') : t('dropText')}
            </p>
            <p className="text-sm text-muted-foreground">{t('orClick')}</p>
          </div>
          <Button variant="default" size="lg" className="mt-2">
            {t('chooseFile')}
          </Button>
          <p className="text-xs text-muted-foreground">{t('maxFiles', { maxFiles })}</p>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{t('selected', { count: files.length })}</p>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
