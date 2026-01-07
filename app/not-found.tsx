import { ClientLayout } from "@/components/client-layout"
import { ArrowLeft } from "lucide-react"
import { NextIntlClientProvider } from 'next-intl'
import Link from "next/link"
import "./globals.css"

export default async function NotFound() {
  const locale = 'pt-BR'
  const messages = (await import(`../messages/${locale}.json`)).default

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientLayout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <h1 className="text-9xl font-black text-primary/20 mb-4 select-none">404</h1>
              <h2 className="text-3xl font-bold mb-4">Página Não Encontrada</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Ops! A página que você está procurando não existe. Ela pode ter sido movida ou excluída.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Início
              </Link>
            </div>
          </ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
