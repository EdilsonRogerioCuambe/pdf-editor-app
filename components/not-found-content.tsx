"use client"

import { ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"

export function NotFoundContent() {
  const t = useTranslations('common.notFound')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-9xl font-black text-primary/20 mb-4 select-none">404</h1>
      <h2 className="text-3xl font-bold mb-4">{t('title')}</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        {t('description')}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('backHome')}
      </Link>
    </div>
  )
}
