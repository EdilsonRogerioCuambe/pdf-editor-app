import { ClientLayout } from "@/components/client-layout"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { Inter } from "next/font/google"
import { notFound } from 'next/navigation'
import type React from "react"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

const locales = ['pt-BR', 'en', 'es']

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'landing' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })

  const localeMap: Record<string, string> = {
    'pt-BR': 'pt_BR',
    'en': 'en_US',
    'es': 'es_ES'
  }

  return {
    title: {
      default: `${tCommon('appName')} - ${t('heroDescription')}`,
      template: `%s | ${tCommon('appName')}`,
    },
    description: t('heroDescription'),
    keywords: ["pdf", "editor", "merge", "split", "compress", "convert", "free", "offline", "secure", "pdf tools"],
    authors: [{ name: `${tCommon('appName')} Team` }],
    creator: tCommon('appName'),
    openGraph: {
      type: "website",
      locale: localeMap[locale] || 'en_US',
      url: "https://pdf-master.app",
      siteName: tCommon('appName'),
      title: `${tCommon('appName')} - ${t('heroDescription')}`,
      description: t('heroDescription'),
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${tCommon('appName')} Preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${tCommon('appName')} - ${t('heroDescription')}`,
      description: t('heroDescription'),
      images: ["/og-image.png"],
      creator: "@pdfmaster",
    },
    icons: {
      icon: [
        {
          url: "/icon-light-32x32.png",
          media: "(prefers-color-scheme: light)",
        },
        {
          url: "/icon-dark-32x32.png",
          media: "(prefers-color-scheme: dark)",
        },
        {
          url: "/icon.svg",
          type: "image/svg+xml",
        },
      ],
      apple: "/apple-icon.png",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#1e293b",
}

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params

  // Validate locale
  if (!locales.includes(locale)) {
    notFound()
  }

  const messages = await getMessages({ locale })

  return (
    <html lang={locale}>
      <body className={`font-sans antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ClientLayout>{children}</ClientLayout>
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  )
}
