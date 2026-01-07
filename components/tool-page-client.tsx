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
import { ToolId } from "@/lib/pdf-tools"

const toolComponents: Record<string, React.ComponentType> = {
  merge: MergeInterface,
  split: SplitInterface,
  compress: CompressInterface,
  rotate: RotateInterface,
  delete: DeleteInterface,
  reorder: ReorderInterface,
  "pdf-to-image": PdfToImageInterface,
  "image-to-pdf": ImageToPdfInterface,
  watermark: WatermarkInterface,
  "page-numbers": PageNumbersInterface,
  sign: SignInterface,
  annotate: AnnotationInterface,
  protect: ProtectInterface,
  unlock: UnlockInterface,
}

export function ToolPageClient({ tool }: { tool: string }) {
  // Get the component for this tool
  const Component = toolComponents[tool]
  if (!Component) {
    return <GenericInterface toolId={tool as ToolId} />
  }

  return <Component />
}
