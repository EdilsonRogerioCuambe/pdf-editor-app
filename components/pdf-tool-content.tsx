"use client"


import { AnnotationInterface } from "@/components/tool-interfaces/annotate-interface"
import { CompressInterface } from "@/components/tool-interfaces/compress-interface"
import { DeleteInterface } from "@/components/tool-interfaces/delete-interface"
import { GenericInterface } from "@/components/tool-interfaces/generic-interface"
import { ImageToPdfInterface } from "@/components/tool-interfaces/image-to-pdf-interface"
import { MergeInterface } from "@/components/tool-interfaces/merge-interface"
import { PageNumbersInterface } from "@/components/tool-interfaces/page-numbers-interface"
import { PdfToImageInterface } from "@/components/tool-interfaces/pdf-to-image-interface"
import { ProtectInterface } from "@/components/tool-interfaces/protect-interface"
import { ReorderInterface } from "@/components/tool-interfaces/reorder-interface"
import { RotateInterface } from "@/components/tool-interfaces/rotate-interface"
import { SignInterface } from "@/components/tool-interfaces/sign-interface"
import { SplitInterface } from "@/components/tool-interfaces/split-interface"
import { UnlockInterface } from "@/components/tool-interfaces/unlock-interface"
import { WatermarkInterface } from "@/components/tool-interfaces/watermark-interface"
import { getPDFTools, type ToolId } from "@/lib/pdf-tools"
import { useTranslations } from "next-intl"

interface PDFToolContentProps {
  activeTool: ToolId
  children?: React.ReactNode
}

export function PDFToolContent({ activeTool }: PDFToolContentProps) {
  const tTools = useTranslations('tools')

  // Get translated tools
  const tools = getPDFTools((key) => tTools(key))
  const tool = tools.find((t) => t.id === activeTool)

  if (!tool) return null

  const Icon = tool.icon

  const renderInterface = () => {
    switch (activeTool) {
      case "merge":
        return <MergeInterface />
      case "split":
        return <SplitInterface />
      case "compress":
        return <CompressInterface />
      case "rotate":
        return <RotateInterface />
      case "watermark":
        return <WatermarkInterface />
      case "sign":
        return <SignInterface />
      case "protect":
        return <ProtectInterface />
      case "unlock":
        return <UnlockInterface />
      case "delete":
        return <DeleteInterface />
      case "reorder":
        return <ReorderInterface />
      case "pdf-to-image":
        return <PdfToImageInterface />
      case "image-to-pdf":
        return <ImageToPdfInterface />
      case "watermark":
        return <WatermarkInterface />
      case "page-numbers":
        return <PageNumbersInterface />

      case "annotate":
        return <AnnotationInterface />
      default:
        return <GenericInterface toolId={activeTool} />
    }
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Tool Interface - Header removed to avoid duplication */}
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">{renderInterface()}</div>
    </div>
  )
}
