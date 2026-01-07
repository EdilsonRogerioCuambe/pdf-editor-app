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
  params,
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

  const baseUrl = 'https://pdfmaster.com' // Substitua pelo seu domínio real
  const title = `${tCommon('appName')} - Free Online PDF Editor & Converter`
  const description = t('heroDescription')

  return {
    title: {
      default: title,
      template: `%s | ${tCommon('appName')}`,
    },
    metadataBase: new URL(baseUrl),
    description,
    keywords: [
      'PDF editor',
      'PDF converter',
      'merge PDF',
      'split PDF',
      'compress PDF',
      'sign PDF',
      'annotate PDF',
      'free PDF tools',
      'online PDF editor',
      'PDF watermark',
      'rotate PDF',
      'PDF to image',
      'image to PDF',
      'protect PDF',
      'unlock PDF',
      'editor de PDF',
      'conversor de PDF',
      'ferramentas PDF grátis',
    ],
    authors: [{ name: 'Edilson Rogério Cuambe', url: 'https://github.com/EdilsonRogerioCuambe' }],
    creator: 'Edilson Rogério Cuambe',
    publisher: tCommon('appName'),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        'en': `${baseUrl}/en`,
        'pt-BR': `${baseUrl}/pt-BR`,
        'es': `${baseUrl}/es`,
      },
    },
    openGraph: {
      type: 'website',
      locale: localeMap[locale] || 'en_US',
      alternateLocale: Object.keys(localeMap).filter(l => l !== locale).map(l => localeMap[l]),
      url: `${baseUrl}/${locale}`,
      title,
      description,
      siteName: tCommon('appName'),
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${tCommon('appName')} - Free Online PDF Editor`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
      creator: '@pdfmaster',
    },
    verification: {
      google: '8b8SjCVAGyjY3SDNkAD4E6GvKpfJsTF6ULjf8W8oX_M',
      other: {
        'msvalidate.01': 'C4520CB409BDDABF509D7E41ADE3DFA9',
      },
    },
    category: 'technology',
    applicationName: tCommon('appName'),
    appleWebApp: {
      capable: true,
      title: tCommon('appName'),
      statusBarStyle: 'black-translucent',
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      icon: [
        {
          url: '/icon-light-32x32.png',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: '/icon-dark-32x32.png',
          media: '(prefers-color-scheme: dark)',
        },
        {
          url: '/icon.svg',
          type: 'image/svg+xml',
        },
      ],
      apple: '/apple-icon.png',
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
