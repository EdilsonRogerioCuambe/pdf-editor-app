#!/usr/bin/env node
/**
 * Script para corrigir duplicatas no es.json
 * Remove versões aninhadas e mantém apenas as versões planas
 */

import * as fs from 'fs';
import * as path from 'path';

const esPath = path.join(process.cwd(), 'messages', 'es.json');

// Ler o arquivo
const content = fs.readFileSync(esPath, 'utf-8');
const json = JSON.parse(content);

// As 4 chaves que devem ser strings simples
const flatKeys = {
  'protect.fileInfo': 'Información del Archivo',
  'protect.ownerPassword': 'Contraseña de Propietario (Permisos)',
  'protect.permissions': 'Permisos del Documento',
  'protect.userPassword': 'Contraseña de Usuario (Abrir)',
};

// Verificar e substituir se forem objetos
for (const [keyPath, value] of Object.entries(flatKeys)) {
  const keys = keyPath.split('.');
  let current: any = json;

  // Navegar até o pai
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }

  const finalKey = keys[keys.length - 1];

  // Se for um objeto, substituir por string
  if (typeof current[finalKey] === 'object') {
    console.log(`🔧 Corrigindo ${keyPath}: object -> string`);
    current[finalKey] = value;
  } else if (typeof current[finalKey] === 'string') {
    console.log(`✅ ${keyPath} já é string`);
  }
}

// Salvar de volta
fs.writeFileSync(esPath, JSON.stringify(json, null, 2), 'utf-8');

console.log('\n✨ Arquivo es.json corrigido!\n');
