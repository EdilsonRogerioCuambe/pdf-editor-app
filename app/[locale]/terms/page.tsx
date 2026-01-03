"use client"

import { useTranslations } from "next-intl"

export default function TermsPage() {
  const t = useTranslations('legal.terms')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-muted-foreground mb-8">{t('lastUpdated')}</p>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">1. {t('acceptance')}</h2>
          <p>{t('acceptanceDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">2. {t('serviceDesc')}</h2>
          <p>{t('serviceIntro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('editMerge')}</li>
            <li>{t('convert')}</li>
            <li>{t('addAnnotations')}</li>
            <li>{t('protect')}</li>
            <li>{t('otherOps')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">3. {t('useOfService')}</h2>
          <p className="mb-4">{t('useIntro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('lawful')}</li>
            <li>{t('accordance')}</li>
            <li>{t('noViolate')}</li>
            <li>{t('noInfringe')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">4. {t('intellectualProperty')}</h2>
          <p>{t('ipDesc')}</p>
          <p className="mt-4">{t('copyrightDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">5. {t('disclaimer')}</h2>
          <p className="mb-4">{t('disclaimerIntro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('noInterruption')}</li>
            <li>{t('noCorrected')}</li>
            <li>{t('noVirus')}</li>
            <li>{t('noAccuracy')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">6. {t('limitation')}</h2>
          <p>{t('limitationDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">7. {t('userResponsibilities')}</h2>
          <p className="mb-4">{t('responsibilitiesIntro')}</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>{t('deviceSecurity')}</li>
            <li>{t('backups')}</li>
            <li>{t('verifyOutput')}</li>
            <li>{t('rightToModify')}</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">8. {t('modifications')}</h2>
          <p>{t('modificationsDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">9. {t('governingLaw')}</h2>
          <p>{t('lawDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">10. {t('changesToTerms')}</h2>
          <p>{t('changesDesc')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">11. {t('contactInfo')}</h2>
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
