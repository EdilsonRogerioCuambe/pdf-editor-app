#!/usr/bin/env node
/**
 * Script de Validação de Internacionalização (i18n)
 *
 * Este script verifica se todas as chaves de tradução estão presentes em todos os locales
 * e se todas as chaves usadas no código existem nas traduções.
 *
 * Execute: npx tsx scripts/validate-i18n.ts
 * ou adicione ao package.json: "validate:i18n": "tsx scripts/validate-i18n.ts"
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuração
const LOCALES = ['en', 'pt-BR', 'es'];
const MESSAGES_DIR = path.join(process.cwd(), 'messages');
const SRC_DIRS = [
  path.join(process.cwd(), 'app'),
  path.join(process.cwd(), 'components'),
];

interface TranslationStructure {
  [key: string]: string | TranslationStructure;
}

interface ValidationError {
  type: 'missing-key' | 'extra-key' | 'unused-key' | 'key-not-found';
  locale?: string;
  key: string;
  message: string;
  file?: string;
}

// Cores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Carrega todas as mensagens de um locale
 */
function loadMessages(locale: string): TranslationStructure {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`${colors.red}Error loading ${locale}.json:${colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Extrai todas as chaves aninhadas de um objeto de tradução
 * Exemplo: { common: { appName: "..." } } -> ["common.appName"]
 */
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

/**
 * Extrai todas as chaves usadas no código usando regex
 * Procura por padrões como:
 * - useTranslations('namespace')
 * - t('key')
 * - getTranslations({ namespace: '...' })
 */
function extractUsedKeys(directories: string[]): Set<string> {
  const usedKeys = new Set<string>();
  const patterns = [
    // useTranslations hook: useTranslations('common')
    /useTranslations\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // t function calls: t('header.toggleMenu')
    /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // getTranslations calls: getTranslations({ locale, namespace: 'landing' })
    /getTranslations\s*\(\s*\{[^}]*namespace:\s*['"`]([^'"`]+)['"`]/g,
  ];

  function processFile(filePath: string) {
    if (!filePath.match(/\.(tsx?|jsx?)$/)) return;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');

      // Encontrar namespaces usados
      const namespaces = new Set<string>();
      const namespacePattern = /useTranslations\s*\(\s*['"`]([^'"`]+)['"`]\s*\)|getTranslations\s*\(\s*\{[^}]*namespace:\s*['"`]([^'"`]+)['"`]/g;
      let match;

      while ((match = namespacePattern.exec(content)) !== null) {
        const namespace = match[1] || match[2];
        if (namespace) namespaces.add(namespace);
      }

      // Encontrar chaves de tradução
      const keyPattern = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g;
      while ((match = keyPattern.exec(content)) !== null) {
        const key = match[1];
        // Se temos namespaces no arquivo, adicionar com namespace
        if (namespaces.size > 0) {
          namespaces.forEach(ns => {
            usedKeys.add(`${ns}.${key}`);
          });
        } else {
          // Adicionar a chave isolada para verificação manual
          usedKeys.add(key);
        }
      }

      // Também adicionar os namespaces como chaves base
      namespaces.forEach(ns => usedKeys.add(ns));

    } catch (error) {
      // Ignorar erros de leitura
    }
  }

  function walkDirectory(dir: string) {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          // Ignorar node_modules e .next
          if (!file.startsWith('.') && file !== 'node_modules') {
            walkDirectory(filePath);
          }
        } else {
          processFile(filePath);
        }
      }
    } catch (error) {
      // Ignorar erros de leitura de diretório
    }
  }

  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      walkDirectory(dir);
    }
  });

  return usedKeys;
}

/**
 * Valida a consistência entre locales
 */
function validateConsistency(): ValidationError[] {
  const errors: ValidationError[] = [];
  const allMessages: Record<string, TranslationStructure> = {};
  const allKeys: Record<string, string[]> = {};

  // Carregar todas as mensagens
  for (const locale of LOCALES) {
    allMessages[locale] = loadMessages(locale);
    allKeys[locale] = extractKeys(allMessages[locale]);
  }

  // Usar o inglês como referência (geralmente mais completo)
  const referenceLocale = 'en';
  const referenceKeys = new Set(allKeys[referenceLocale]);

  // Verificar se todos os locales têm as mesmas chaves
  for (const locale of LOCALES) {
    if (locale === referenceLocale) continue;

    const localeKeys = new Set(allKeys[locale]);

    // Chaves faltando neste locale
    for (const key of referenceKeys) {
      if (!localeKeys.has(key)) {
        errors.push({
          type: 'missing-key',
          locale,
          key,
          message: `Key "${key}" exists in ${referenceLocale} but is missing in ${locale}`,
        });
      }
    }

    // Chaves extras neste locale
    for (const key of localeKeys) {
      if (!referenceKeys.has(key)) {
        errors.push({
          type: 'extra-key',
          locale,
          key,
          message: `Key "${key}" exists in ${locale} but not in ${referenceLocale}`,
        });
      }
    }
  }

  return errors;
}

/**
 * Valida se as chaves usadas no código existem nas traduções
 */
function validateUsage(): ValidationError[] {
  const errors: ValidationError[] = [];
  const usedKeys = extractUsedKeys(SRC_DIRS);
  const enMessages = loadMessages('en');
  const availableKeys = new Set(extractKeys(enMessages));

  for (const usedKey of usedKeys) {
    // Verificar se a chave existe exatamente ou como prefixo (namespace)
    const exists = availableKeys.has(usedKey) ||
                   Array.from(availableKeys).some(k => k.startsWith(usedKey + '.'));

    if (!exists) {
      errors.push({
        type: 'key-not-found',
        key: usedKey,
        message: `Key "${usedKey}" is used in code but not found in translations`,
      });
    }
  }

  return errors;
}

/**
 * Encontra chaves não utilizadas (opcional - pode gerar falsos positivos)
 */
function findUnusedKeys(): ValidationError[] {
  const errors: ValidationError[] = [];
  const usedKeys = extractUsedKeys(SRC_DIRS);
  const enMessages = loadMessages('en');
  const availableKeys = extractKeys(enMessages);

  // Criar set de prefixos usados (namespaces)
  const usedPrefixes = new Set<string>();
  usedKeys.forEach(key => {
    const parts = key.split('.');
    for (let i = 1; i <= parts.length; i++) {
      usedPrefixes.add(parts.slice(0, i).join('.'));
    }
  });

  for (const availableKey of availableKeys) {
    // Verificar se a chave ou algum de seus prefixos é usado
    const parts = availableKey.split('.');
    let isUsed = false;

    for (let i = parts.length; i > 0; i--) {
      const prefix = parts.slice(0, i).join('.');
      if (usedPrefixes.has(prefix)) {
        isUsed = true;
        break;
      }
    }

    if (!isUsed) {
      errors.push({
        type: 'unused-key',
        key: availableKey,
        message: `Key "${availableKey}" exists in translations but may not be used in code`,
      });
    }
  }

  return errors;
}

/**
 * Imprime o relatório de erros
 */
function printReport(errors: ValidationError[], showUnused = false) {
  const grouped = {
    'missing-key': errors.filter(e => e.type === 'missing-key'),
    'extra-key': errors.filter(e => e.type === 'extra-key'),
    'key-not-found': errors.filter(e => e.type === 'key-not-found'),
    'unused-key': errors.filter(e => e.type === 'unused-key'),
  };

  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.cyan}${colors.cyan}  i18n Validation Report${colors.reset}`);
  console.log('='.repeat(80));
  console.log('\n');

  // Missing Keys (crítico)
  if (grouped['missing-key'].length > 0) {
    console.log(`${colors.red}❌ Missing Keys (${grouped['missing-key'].length})${colors.reset}`);
    console.log(`${colors.red}These keys exist in the reference locale but are missing in others:${colors.reset}\n`);

    const byLocale = new Map<string, ValidationError[]>();
    grouped['missing-key'].forEach(err => {
      if (!byLocale.has(err.locale!)) {
        byLocale.set(err.locale!, []);
      }
      byLocale.get(err.locale!)!.push(err);
    });

    byLocale.forEach((errs, locale) => {
      console.log(`  ${colors.yellow}Locale: ${locale}${colors.reset}`);
      errs.slice(0, 10).forEach(err => {
        console.log(`    - ${err.key}`);
      });
      if (errs.length > 10) {
        console.log(`    ... and ${errs.length - 10} more`);
      }
      console.log('');
    });
  }

  // Keys Not Found in Code (crítico)
  if (grouped['key-not-found'].length > 0) {
    console.log(`${colors.red}❌ Keys Used But Not Found (${grouped['key-not-found'].length})${colors.reset}`);
    console.log(`${colors.red}These keys are referenced in code but don't exist in translations:${colors.reset}\n`);

    grouped['key-not-found'].slice(0, 20).forEach(err => {
      console.log(`  - ${err.key}`);
    });
    if (grouped['key-not-found'].length > 20) {
      console.log(`  ... and ${grouped['key-not-found'].length - 20} more`);
    }
    console.log('');
  }

  // Extra Keys (aviso)
  if (grouped['extra-key'].length > 0) {
    console.log(`${colors.yellow}⚠️  Extra Keys (${grouped['extra-key'].length})${colors.reset}`);
    console.log(`${colors.yellow}These keys exist in some locales but not in the reference:${colors.reset}\n`);

    grouped['extra-key'].slice(0, 10).forEach(err => {
      console.log(`  - ${err.key} (in ${err.locale})`);
    });
    if (grouped['extra-key'].length > 10) {
      console.log(`  ... and ${grouped['extra-key'].length - 10} more`);
    }
    console.log('');
  }

  // Unused Keys (informativo)
  if (showUnused && grouped['unused-key'].length > 0) {
    console.log(`${colors.blue}ℹ️  Potentially Unused Keys (${grouped['unused-key'].length})${colors.reset}`);
    console.log(`${colors.blue}These keys may not be used in code (this can include false positives):${colors.reset}\n`);

    grouped['unused-key'].slice(0, 15).forEach(err => {
      console.log(`  - ${err.key}`);
    });
    if (grouped['unused-key'].length > 15) {
      console.log(`  ... and ${grouped['unused-key'].length - 15} more`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  const criticalErrors = grouped['missing-key'].length + grouped['key-not-found'].length;

  if (criticalErrors === 0) {
    console.log(`${colors.green}✅ All translations are consistent!${colors.reset}`);
  } else {
    console.log(`${colors.red}❌ Found ${criticalErrors} critical errors${colors.reset}`);
  }

  console.log(`${colors.cyan}Summary:${colors.reset}`);
  console.log(`  Missing keys: ${grouped['missing-key'].length}`);
  console.log(`  Keys not found: ${grouped['key-not-found'].length}`);
  console.log(`  Extra keys: ${grouped['extra-key'].length}`);
  if (showUnused) {
    console.log(`  Potentially unused: ${grouped['unused-key'].length}`);
  }
  console.log('='.repeat(80));
  console.log('\n');

  return criticalErrors;
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  const showUnused = args.includes('--unused');
  const exitOnError = !args.includes('--no-exit');

  console.log(`${colors.cyan}Starting i18n validation...${colors.reset}\n`);
  console.log(`Locales: ${LOCALES.join(', ')}`);
  console.log(`Source directories: ${SRC_DIRS.join(', ')}\n`);

  const errors: ValidationError[] = [];

  // 1. Validar consistência entre locales
  console.log('Checking consistency between locales...');
  errors.push(...validateConsistency());

  // 2. Validar uso no código
  console.log('Checking keys used in code...');
  errors.push(...validateUsage());

  // 3. Encontrar chaves não usadas (opcional)
  if (showUnused) {
    console.log('Finding unused keys...');
    errors.push(...findUnusedKeys());
  }

  // 4. Imprimir relatório
  const criticalErrors = printReport(errors, showUnused);

  // 5. Sair com erro se houver problemas críticos
  if (exitOnError && criticalErrors > 0) {
    process.exit(1);
  }
}

// Executar
main();
