import { ToolId } from '@/lib/pdf-tools'
import { MetadataRoute } from 'next'

const baseUrl = 'https://pdfacil.site'

const locales = ['en', 'pt-BR', 'es']

const tools: ToolId[] = [
  'merge',
  'split',
  'compress',
  'rotate',
  'delete',
  'reorder',
  'pdf-to-image',
  'image-to-pdf',
  'watermark',
  'page-numbers',
  'sign',
  'annotate',
  'protect',
  'unlock',
]

const legalPages = ['privacy', 'terms', 'cookies', 'contact']

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = []

  // Homepage para cada locale
  locales.forEach((locale) => {
    routes.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    })
  })

  // Páginas de ferramentas para cada locale
  locales.forEach((locale) => {
    tools.forEach((tool) => {
      routes.push({
        url: `${baseUrl}/${locale}/${tool}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      })
    })
  })

  // Páginas legais para cada locale
  locales.forEach((locale) => {
    legalPages.forEach((page) => {
      routes.push({
        url: `${baseUrl}/${locale}/${page}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      })
    })
  })

  return routes
}
