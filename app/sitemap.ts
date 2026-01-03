import { locales } from '@/i18n/request'
import { pdfTools } from '@/lib/pdf-tools'
import { MetadataRoute } from 'next'

const BASE_URL = 'https://pdf-master.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const sitemapEntries: MetadataRoute.Sitemap = []

  // Add root URL
  sitemapEntries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  })

  // Add locales and tools
  locales.forEach((locale) => {
    // Landing page for locale
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    })

    // Tools pages for locale
    pdfTools.forEach((tool) => {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}/${tool.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    })
  })

  return sitemapEntries
}
