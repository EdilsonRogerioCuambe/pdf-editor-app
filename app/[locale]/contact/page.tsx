import { Github, Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({locale: params.locale, namespace: 'legal.contact'});
  return {
    title: `${t('title')} | PDF Master`,
    description: t('subtitle')
  };
}

export default function ContactPage() {
  const t = useTranslations('legal.contact')

  return (
    <div className="container mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>

      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-lg text-muted-foreground mb-12">{t('subtitle')}</p>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6">{t('getInTouch')}</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
              <Mail className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">{t('email')}</h3>
                <a
                  href="mailto:edicuambe@gmail.com"
                  className="text-primary hover:underline"
                >
                  edicuambe@gmail.com
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('emailDesc')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 rounded-lg border bg-card">
              <Github className="h-6 w-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold mb-2">{t('github')}</h3>
                <a
                  href="https://github.com/EdilsonRogerioCuambe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @EdilsonRogerioCuambe
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('githubDesc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('aboutDev')}</h2>
          <p className="mb-4">{t('devDesc')}</p>
          <p>{t('openSource')}</p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">{t('faq')}</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">{t('faqFree')}</h3>
              <p>{t('faqFreeAnswer')}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('faqSafe')}</h3>
              <p>{t('faqSafeAnswer')}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('faqCommercial')}</h3>
              <p>{t('faqCommercialAnswer')}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('faqBug')}</h3>
              <p>{t('faqBugAnswer')}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">{t('faqFeature')}</h3>
              <p>{t('faqFeatureAnswer')}</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('businessHours')}</h2>
          <p>{t('businessDesc')}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t('personalProject')}</p>
        </section>
      </div>
    </div>
  )
}
