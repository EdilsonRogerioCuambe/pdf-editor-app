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
 * Extrai todas as chaves usadas no código usando rastreamento de variáveis
 */
function extractUsedKeysFromContent(content: string, filePath: string): Set<string> {
  const usedKeys = new Set<string>();

  // Map variable name to namespace(s)
  // const t = useTranslations('common') -> t: ['common']
  // const t = await getTranslations({ namespace: 'landing' }) -> t: ['landing']
  const varToNamespaces = new Map<string, string[]>();

  // 1. Encontrar definições de tradutores (useTranslations / getTranslations)
  // Captura: varName, namespace
  const hookPattern = /(?:const|let|var)\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\s*\(\s*(?:\{[^}]*namespace:\s*)?['"`]([^'"`]+)['"`]/g;

  let match;
  while ((match = hookPattern.exec(content)) !== null) {
     const [_, varName, namespace] = match;
     if (!varToNamespaces.has(varName)) {
        varToNamespaces.set(varName, []);
     }
     varToNamespaces.get(varName)?.push(namespace);
  }

  // 2. Encontrar uso: t('key') ou t("key")
  // Captura: varName, key
  const usagePattern = /\b(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/g;
  while ((match = usagePattern.exec(content)) !== null) {
      const [_, varName, key] = match;

      // Ignorar template literals complexos por enquanto
      if (key.includes('${')) continue;

      if (varToNamespaces.has(varName)) {
          const namespaces = varToNamespaces.get(varName)!;
          namespaces.forEach(ns => {
              if (ns) {
                // Ignore dynamic namespaces
                if (ns.includes('${')) {
                  return;
                }
                usedKeys.add(`${ns}.${key}`);
              } else {
                usedKeys.add(key);
              }
          });
      }
  }

  return usedKeys;
}

function extractUsedKeys(directories: string[]): Set<string> {
  const allUsedKeys = new Set<string>();

  function walkDirectory(dir: string) {
    try {
      const files = fs.readdirSync(dir);

      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          if (!file.startsWith('.') && file !== 'node_modules') {
            walkDirectory(filePath);
          }
        } else if (file.match(/\.(tsx?|jsx?)$/)) {
          const content = fs.readFileSync(filePath, 'utf-8');
          const fileKeys = extractUsedKeysFromContent(content, filePath);
          fileKeys.forEach(key => allUsedKeys.add(key));
        }
      }
    } catch (error) {
      // Ignorar erros
    }
  }

  directories.forEach(dir => {
    if (fs.existsSync(dir)) {
      walkDirectory(dir);
    }
  });

  return allUsedKeys;
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

  // Usar o inglês como referência
  const referenceLocale = 'en';
  const referenceKeys = new Set(allKeys[referenceLocale]);

  // Verificar consistência
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
    // Verificar se a chave existe exatamente
    // Também permitir acesso a objetos (ex: tools.merge para iterar) se suportado, mas nossa extração de chaves flatten all.
    // Se usedKey é "tools", e temos "tools.merge.name", é válido se o código usar o objeto?
    // Nosso regex extractKeys retorna todas as folhas.
    // Se o código faz t('tools'), isso geralmente espera um retorno de objeto ou string.
    // Se "tools" é um objeto no JSON, ele não aparece no Set availableKeys (que só tem folhas),
    // a menos que mudemos extractKeys para incluir nós intermediários.

    // Vamos verificar se usedKey é prefixo de alguma chave existente (significa que é um objeto)
    const isObject = Array.from(availableKeys).some(k => k.startsWith(usedKey + '.'));
    const exists = availableKeys.has(usedKey) || isObject;

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
 * Imprime o relatório de erros
 */
function printReport(errors: ValidationError[]) {
  const grouped = {
    'missing-key': errors.filter(e => e.type === 'missing-key'),
    'extra-key': errors.filter(e => e.type === 'extra-key'),
    'key-not-found': errors.filter(e => e.type === 'key-not-found'),
  };

  console.log('\n');
  console.log('='.repeat(80));
  console.log(`${colors.cyan}  i18n Validation Report${colors.reset}`);
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
  console.log('='.repeat(80));
  console.log('\n');

  return criticalErrors;
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2);
  const exitOnError = !args.includes('--no-exit');

  console.log(`${colors.cyan}Starting i18n validation...${colors.reset}\n`);
  console.log(`Locales: ${LOCALES.join(', ')}`);

  const errors: ValidationError[] = [];

  // 1. Validar consistência entre locales
  console.log('Checking consistency between locales...');
  errors.push(...validateConsistency());

  // 2. Validar uso no código
  console.log('Checking keys used in code...');
  errors.push(...validateUsage());

  // 3. Imprimir relatório
  const criticalErrors = printReport(errors);

  // 4. Sair com erro se houver problemas críticos
  if (exitOnError && criticalErrors > 0) {
    process.exit(1);
  }
}

main();
