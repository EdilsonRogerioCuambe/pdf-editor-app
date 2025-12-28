import { PDFToolContent } from "@/components/pdf-tool-content"
import { pdfTools, type ToolId } from "@/lib/pdf-tools"
import { notFound } from "next/navigation"

import type { Metadata } from "next"

export async function generateMetadata({ params }: { params: Promise<{ tool: string }> }): Promise<Metadata> {
  const { tool } = await params
  const toolId = tool as ToolId
  const foundTool = pdfTools.find((t) => t.id === toolId)

  if (!foundTool) {
    return {
      title: "Tool Not Found",
    }
  }

  return {
    title: foundTool.name,
    description: `${foundTool.description}. Free online tool to ${foundTool.name.toLowerCase()}. No login required.`,
    openGraph: {
      title: `${foundTool.name} - PDF Master`,
      description: foundTool.description,
    },
  }
}

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
