#!/usr/bin/env node
/**
 * Script Helper para Correção Automática de i18n
 *
 * Este script exporta um relatório detalhado dos erros de tradução
 * para facilitar a correção manual.
 *
 * Execute: npx tsx scripts/i18n-report.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES = ['en', 'pt-BR', 'es'];
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const OUTPUT_FILE = path.join(process.cwd(), 'i18n-errors-report.md');

interface TranslationStructure {
  [key: string]: string | TranslationStructure;
}

function loadMessages(locale: string): TranslationStructure {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function extractKeys(obj: TranslationStructure, prefix = ''): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...extractKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys.sort();
}

function getValue(obj: TranslationStructure, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

function generateReport() {
  const allMessages: Record<string, TranslationStructure> = {};
  const allKeys: Record<string, string[]> = {};

  // Carregar todas as mensagens
  for (const locale of LOCALES) {
    allMessages[locale] = loadMessages(locale);
    allKeys[locale] = extractKeys(allMessages[locale]);
  }

  const referenceLocale = 'en';
  const referenceKeys = new Set(allKeys[referenceLocale]);

  let report = '# Relatório de Erros de Tradução i18n\n\n';
  report += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
  report += '---\n\n';

  // Chaves faltando por locale
  for (const locale of LOCALES) {
    if (locale === referenceLocale) continue;

    const localeKeys = new Set(allKeys[locale]);
    const missingKeys: Array<{key: string; value: string}> = [];

    for (const key of referenceKeys) {
      if (!localeKeys.has(key)) {
        const enValue = getValue(allMessages[referenceLocale], key) || '';
        missingKeys.push({ key, value: enValue });
      }
    }

    if (missingKeys.length > 0) {
      report += `## Chaves Faltando em \`${locale}.json\` (${missingKeys.length})\n\n`;
      report += 'Estas chaves existem em `en.json` mas estão faltando:\n\n';

      // Agrupar por namespace
      const byNamespace = new Map<string, Array<{key: string; value: string}>>();
      missingKeys.forEach(item => {
        const namespace = item.key.split('.')[0];
        if (!byNamespace.has(namespace)) {
          byNamespace.set(namespace, []);
        }
        byNamespace.get(namespace)!.push(item);
      });

      byNamespace.forEach((items, namespace) => {
        report += `### Namespace: \`${namespace}\` (${items.length} chaves)\n\n`;
        report += '```json\n';
        report += `"${namespace}": {\n`;
        items.forEach((item, idx) => {
          const keyPath = item.key.split('.').slice(1).join('.');
          report += `  "${keyPath}": "[TRADUZIR] ${item.value}"`;
          if (idx < items.length - 1) report += ',';
          report += '\n';
        });
        report += '}\n';
        report += '```\n\n';

        report += '<details>\n<summary>Lista completa de chaves</summary>\n\n';
        items.forEach(item => {
          report += `- \`${item.key}\`: "${item.value}"\n`;
        });
        report += '\n</details>\n\n';
      });

      report += '---\n\n';
    }
  }

  // Chaves extras
  for (const locale of LOCALES) {
    if (locale === referenceLocale) continue;

    const localeKeys = new Set(allKeys[locale]);
    const extraKeys: string[] = [];

    for (const key of localeKeys) {
      if (!referenceKeys.has(key)) {
        extraKeys.push(key);
      }
    }

    if (extraKeys.length > 0) {
      report += `## Chaves Extras em \`${locale}.json\` (${extraKeys.length})\n\n`;
      report += 'Estas chaves existem neste locale mas não em `en.json`:\n\n';

      const byNamespace = new Map<string, string[]>();
      extraKeys.forEach(key => {
        const namespace = key.split('.')[0];
        if (!byNamespace.has(namespace)) {
          byNamespace.set(namespace, []);
        }
        byNamespace.get(namespace)!.push(key);
      });

      byNamespace.forEach((keys, namespace) => {
        report += `### Namespace: \`${namespace}\`\n\n`;
        keys.forEach(key => {
          const value = getValue(allMessages[locale], key) || '';
          report += `- \`${key}\`: "${value}"\n`;
        });
        report += '\n';
      });

      report += '**Ação recomendada:** Se estas chaves devem existir, adicione em `en.json`. Caso contrário, remova de `' + locale + '.json`.\n\n';
      report += '---\n\n';
    }
  }

  // Resumo
  report += '## Resumo Final\n\n';
  for (const locale of LOCALES) {
    if (locale === referenceLocale) continue;

    const localeKeys = new Set(allKeys[locale]);
    const missing = Array.from(referenceKeys).filter(k => !localeKeys.has(k)).length;
    const extra = Array.from(localeKeys).filter(k => !referenceKeys.has(k)).length;

    report += `- **${locale}**: ${missing} chaves faltando, ${extra} chaves extras\n`;
  }

  report += '\n---\n\n';
  report += '## Próximos Passos\n\n';
  report += '1. **Revisar chaves faltando**: Adicione as traduções necessárias nos arquivos correspondentes\n';
  report += '2. **Revisar chaves extras**: Decida se devem ser adicionadas ao `en.json` ou removidas\n';
  report += '3. **Executar validação**: `npm run validate:i18n` para verificar se os erros foram corrigidos\n';
  report += '4. **Testar**: Verifique a aplicação em todos os locales para garantir que tudo está funcionando\n\n';

  fs.writeFileSync(OUTPUT_FILE, report, 'utf-8');

  console.log('\n✅ Relatório gerado com sucesso!\n');
  console.log(`📄 Arquivo: ${OUTPUT_FILE}\n`);
  console.log('Abra o arquivo para ver os detalhes completos de todos os erros.\n');
}

generateReport();
