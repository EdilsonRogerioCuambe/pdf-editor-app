"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"

export default function PrivacyPage() {
  const t = useTranslations('legal.privacy')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>{t('intro')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. {t('dataProcessing')}</h2>
          <p className="mb-4"><strong>{t('completeProcessing')}</strong></p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('noUpload')}</li>
            <li>{t('noStore')}</li>
            <li>{t('noAccess')}</li>
            <li>{t('localProcessing')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. {t('infoWeCollect')}</h2>
          <p className="mb-4">{t('minimalAnalytics')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('anonymousStats')}</li>
            <li>{t('browserType')}</li>
            <li>{t('deviceType')}</li>
            <li>{t('location')}</li>
          </ul>
          <p className="mt-4"><strong>Note:</strong> {t('noPersonalData')}</p>
        </section>

        <section className="mb-8">
  <h2 className="text-2xl font-semibold mb-4">4. {t('cookies')}</h2>
          <p>{t('cookiesDesc')} <Link href="/cookies" className="text-primary hover:underline">{t('seeCookiePolicy')}</Link></p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. {t('thirdParty')}</h2>
          <p className="mb-4">{t('thirdPartyDesc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>{t('vercelAnalytics')}</strong></li>
            <li><strong>{t('googleFonts')}</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. {t('dataSecurity')}</h2>
          <p>{t('securityDesc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('secureElement')}</li>
            <li>{t('upToDate')}</li>
            <li>{t('noPublic')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. {t('yourRights')}</h2>
          <p>{t('rightsDesc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('clearCache')}</li>
            <li>{t('privateMode')}</li>
            <li>{t('disableAnalytics')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. {t('children')}</h2>
          <p>{t('childrenDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. {t('changes')}</h2>
          <p>{t('changesDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. {t('contact')}</h2>
          <p>
            {t('contactDesc')}{' '}
            <a href="mailto:edicuambe@gmail.com" className="text-primary hover:underline">
              edicuambe@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
