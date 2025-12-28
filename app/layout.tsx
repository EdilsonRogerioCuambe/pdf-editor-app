import { ClientLayout } from "@/components/client-layout"
import { Analytics } from "@vercel/analytics/next"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "PDF Master - Free Online PDF Tools",
    template: "%s | PDF Master",
  },
  description: "Edit, merge, split, compress, and convert PDF files online for free. 100% secure, no login required, files processed locally in your browser.",
  keywords: ["pdf", "editor", "merge", "split", "compress", "convert", "free", "offline", "secure", "pdf tools"],
  authors: [{ name: "PDF Master Team" }],
  creator: "PDF Master",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://pdf-master.app",
    siteName: "PDF Master",
    title: "PDF Master - Ferramentas de PDF Online Grátis",
    description: "Edite, converta e assine PDFs. Grátis, seguro e sem login.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PDF Master Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Master - Ferramentas de PDF Online Grátis",
    description: "Edite, converta e assine PDFs. Grátis, seguro e sem login.",
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

export const viewport: Viewport = {
  themeColor: "#1e293b",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  )
}
