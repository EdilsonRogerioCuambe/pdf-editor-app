import { LandingPage } from "@/components/landing-page";
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(props: { params: Promise<{ locale: string }> }) {
  const params = await props.params;
  const t = await getTranslations({locale: params.locale, namespace: 'header'});
  return {
    title: `PDF Master - ${t('tagline')} ${t('taglineHighlight')}`,
    description: t('slogan')
  };
}

export default function Home() {
  return <LandingPage />
}
