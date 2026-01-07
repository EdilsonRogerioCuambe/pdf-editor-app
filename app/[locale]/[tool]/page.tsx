import { ToolPageClient } from "@/components/tool-page-client"
import { pdfTools } from "@/lib/pdf-tools"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ tool: string; locale: string }>
}

export async function generateMetadata({ params }: Props) {
  const { tool, locale } = await params
  const toolConfig = pdfTools.find((t) => t.id === tool)

  if (!toolConfig) {
    return {
      title: 'Not Found | PDF Master',
      description: 'Tool not found'
    }
  }

  const t = await getTranslations({ locale, namespace: `tools.${tool}` })

  // Handling description fallback safely
  let description = ''
  try {
     description = t('description')
  } catch (e) {
     description = toolConfig.description
  }

  return {
    title: `${t('name')} | PDF Master`,
    description: description
  }
}

export default async function ToolPage(props: Props) {
  const params = await props.params;
  const { tool } = params;

  // Validate tool exists
  const toolConfig = pdfTools.find((t) => t.id === tool)
  if (!toolConfig) {
    notFound()
  }

  return <ToolPageClient tool={tool} />
}
