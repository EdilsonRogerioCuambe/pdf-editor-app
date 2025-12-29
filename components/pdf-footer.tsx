"use client"

import { getPDFTools } from "@/lib/pdf-tools"
import { useTranslations } from "next-intl"
import Link from "next/link"
import { useParams } from "next/navigation"

export function PDFFooter() {
  const t = useTranslations('footer')
  const tCommon = useTranslations('common')
  const tTools = useTranslations('tools')
  const params = useParams()
  const locale = params.locale as string || 'pt-BR'

  // Get translated tools
  const tools = getPDFTools((key) => tTools(key))

  return (
    <footer className="border-t border-border bg-muted/30 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className="flex items-center gap-2 mb-4">
              <span className="text-xl font-bold">{tCommon('appName')}</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {t('description')}
            </p>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {tCommon('appName')}. {t('allRightsReserved')}.
            </div>
          </div>

          {/* Tools Grid */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4">{t('toolsSection')}</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              {tools.map((tool) => {
                return (
                  <Link
                    key={tool.id}
                    href={`/${locale}/${tool.id}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors hover:underline"
                  >
                    {tool.name}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Links */}
          <div className="lg:col-span-1">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <h3 className="font-semibold mb-4">{t('legalSection')}</h3>
                <div className="flex flex-col gap-3">
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('privacy')}
                  </Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('terms')}
                  </Link>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    {t('cookies')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
