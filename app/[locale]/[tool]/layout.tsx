import { PDFToolContent } from "@/components/pdf-tool-content"
import type { ToolId } from "@/lib/pdf-tools"
import type React from "react"
import { use } from "react"

export default function ToolLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ tool: string; locale: string }>
}>) {
  const { tool } = use(params)

  return <PDFToolContent activeTool={tool as ToolId}>{children}</PDFToolContent>
}
