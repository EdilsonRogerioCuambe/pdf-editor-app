import { PDFToolContent } from "@/components/pdf-tool-content"
import { pdfTools, type ToolId } from "@/lib/pdf-tools"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return pdfTools.map((tool) => ({
    tool: tool.id,
  }))
}

interface ToolPageProps {
  params: Promise<{
    tool: string
  }>
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool } = await params
  const toolId = tool as ToolId
  const foundTool = pdfTools.find((t) => t.id === toolId)

  if (!foundTool) {
    notFound()
  }

  return <PDFToolContent activeTool={toolId} />
}
