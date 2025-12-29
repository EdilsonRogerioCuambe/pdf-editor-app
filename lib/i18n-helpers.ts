import { useTranslations } from 'next-intl';
import type { ToolId } from './pdf-tools';

export function useToolTranslations() {
  const t = useTranslations('tools');

  return (toolId: ToolId) => ({
    name: t(`${toolId}.name`),
    description: t(`${toolId}.description`)
  });
}

export function formatLocale(locale: string): string {
  const localeMap: Record<string, string> = {
    'pt-BR': 'Português (BR)',
    'en': 'English',
    'es': 'Español'
  };
  return localeMap[locale] || locale;
}

export function getLocaleFlag(locale: string): string {
  const flagMap: Record<string, string> = {
    'pt-BR': '🇧🇷',
    'en': '🇺🇸',
    'es': '🇪🇸'
  };
  return flagMap[locale] || '🌐';
}
