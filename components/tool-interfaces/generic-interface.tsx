"use client"

import { FileDropZone, type UploadedFile } from "@/components/file-drop-zone"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { getPDFTools, type ToolId } from "@/lib/pdf-tools"
import { Download, RotateCcw } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

interface GenericInterfaceProps {
  toolId: ToolId
}

export function GenericInterface({ toolId }: GenericInterfaceProps) {
  const tTools = useTranslations('tools')
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // Get translated tools
  const tools = getPDFTools((key) => tTools(key))
  const tool = tools.find((t) => t.id === toolId)
  const Icon = tool?.icon

  const handleFilesSelected = (newFiles: UploadedFile[]) => {
    setFiles(newFiles)
    setIsComplete(false)
  }

  const handleProcess = async () => {
    if (files.length === 0) return
    setIsProcessing(true)
    setProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((r) => setTimeout(r, 150))
      setProgress(i)
    }

    setIsProcessing(false)
    setIsComplete(true)
  }

  const handleReset = () => {
    setFiles([])
    setIsComplete(false)
    setProgress(0)
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
          <Download className="h-10 w-10 text-success" />
        </div>
        <h3 className="mb-2 text-xl font-semibold text-foreground">Processing Complete!</h3>
        <p className="mb-6 text-muted-foreground">Your PDF has been processed successfully.</p>
        <div className="flex gap-3">
          <Button size="lg" className="bg-success hover:bg-success/90 text-success-foreground">
            <Download className="mr-2 h-5 w-5" />
            Download PDF
          </Button>
          <Button variant="outline" size="lg" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Process Another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="text-center space-y-2 mb-6">
        {Icon && (
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{tool?.name}</h1>
        <p className="text-muted-foreground">{tool?.description}</p>
      </div>

      <FileDropZone
        onFilesSelected={handleFilesSelected}
        multiple={toolId === "image-to-pdf"}
        accept={toolId === "image-to-pdf" ? ".jpg,.jpeg,.png,.webp" : ".pdf"}
        maxFiles={toolId === "image-to-pdf" ? 20 : 1}
      />

      {files.length > 0 && (
        <div className="space-y-4">
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-center text-sm text-muted-foreground">Processing... {progress}%</p>
            </div>
          )}

          <Button size="lg" className="w-full" onClick={handleProcess} disabled={isProcessing}>
            {tool?.name || "Process PDF"}
          </Button>
        </div>
      )}
    </div>
  )
}
