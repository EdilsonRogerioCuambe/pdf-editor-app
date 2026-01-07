import { ClientLayout } from "@/components/client-layout"
import { NotFoundContent } from "@/components/not-found-content"
import { NextIntlClientProvider } from 'next-intl'
import "./globals.css"

export default async function NotFound() {
  const locale = 'pt-BR'
  const messages = (await import(`../messages/${locale}.json`)).default

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientLayout>
            <NotFoundContent />
          </ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
