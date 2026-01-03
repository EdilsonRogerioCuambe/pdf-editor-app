"use client"

import { useTranslations } from "next-intl"
import Link from "next/link"

export default function CookiesPage() {
  const t = useTranslations('legal.cookies')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. {t('whatAre')}</h2>
          <p>{t('whatDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. {t('howWeUse')}</h2>
          <p className="mb-4">{t('howDesc')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>{t('essential')}</strong></li>
            <li><strong>{t('preference')}</strong></li>
            <li><strong>{t('analytics')}</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. {t('typesWeUse')}</h2>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">{t('essentialCookies')}</h3>
            <p>{t('essentialDesc')}</p>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">{t('analyticsCookies')}</h3>
            <p>{t('analyticsDesc')}</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>{t('popularFeatures')}</li>
              <li>{t('navigation')}</li>
              <li>{t('improvements')}</li>
            </ul>
          </div>

          <div className="mt-4">
            <h3 className="text-xl font-semibold mb-2">{t('preferenceCookies')}</h3>
            <p>{t('preferenceDesc')}</p>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. {t('thirdParty')}</h2>
          <p>{t('thirdPartyIntro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>{t('vercel')}</strong></li>
            <li><strong>{t('googleFonts')}</strong></li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. {t('managing')}</h2>
          <p className="mb-4">{t('managingIntro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('deleteAll')}</li>
            <li>{t('preventCookies')}</li>
            <li>{t('browserExt')}</li>
          </ul>
          <p className="mt-4"><strong>Note:</strong> {t('disableWarning')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. {t('duration')}</h2>
          <p>{t('durationDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. {t('updates')}</h2>
          <p>{t('updatesDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. {t('moreInfo')}</h2>
          <p>
            {t('seePrivacy')}{' '}
            <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
          <p className="mt-4">
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
