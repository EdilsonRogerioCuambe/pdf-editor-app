#!/usr/bin/env node
/**
 * Script de Correção Automática de Chaves Faltando
 *
 * Este script adiciona automaticamente as chaves que estão faltando
 * baseado no relatório de erros.
 */

import * as fs from 'fs';
import * as path from 'path';

const MESSAGES_DIR = path.join(process.cwd(), 'messages');

// Chaves a adicionar em pt-BR
const ptBRMissingKeys = {
  'annotate.name': 'Anotar PDF',
  'delete.processing': 'Processando...',
  'delete.saveError': 'Falha ao salvar PDF',
  'page-numbers.name': 'Números de Página',
  'page-numbers.description': 'Adicione numeração às páginas do seu PDF.',
  'reorder.page': 'Página {index}',
  'reorder.saveError': 'Falha ao salvar PDF',
  'sign.name': 'Assinar PDF',
  'sign.description': 'Assine digitalmente seus documentos PDF.',

  // Protect keys
  'protect.name': 'Proteger PDF',
  'protect.description': 'Adicione senha e criptografe seus arquivos PDF importantes.',
  'protect.addUserPassword': 'Adicionar senha de usuário (recomendado)',
  'protect.allowAnnotations': 'Permitir anotações',
  'protect.allowAssembly': 'Permitir montagem do documento',
  'protect.allowCopying': 'Permitir cópia de conteúdo',
  'protect.allowForms': 'Permitir preenchimento de formulários',
  'protect.allowModifying': 'Permitir modificação',
  'protect.allowScreenReaders': 'Permitir leitores de tela',
  'protect.cancel': 'Cancelar',
  'protect.confirmOwnerPassword': 'Confirmar Senha de Proprietário',
  'protect.confirmPassword': 'Confirmar Senha',
  'protect.encryption40bit': 'RC4 de 40 bits',
  'protect.encryption40bitDesc': '(legado, fraco)',
  'protect.encryption128rc4': 'RC4 de 128 bits',
  'protect.encryption128rc4Desc': '(padrão)',
  'protect.encryption128aes': 'AES de 128 bits',
  'protect.encryption128aesDesc': '(recomendado) ✓',
  'protect.encryption256aes': 'AES de 256 bits',
  'protect.encryption256aesDesc': '(mais forte)',
  'protect.encryptionInfo': 'Criptografia mais forte oferece melhor segurança, mas pode ter problemas de compatibilidade com leitores de PDF antigos',
  'protect.encryptionLevel': 'Nível de Criptografia',
  'protect.encryptionSettings': 'Configurações de Criptografia',
  'protect.enterOwnerPassword': 'Digite a senha de proprietário',
  'protect.enterPassword': 'Digite a senha',
  'protect.errors.noFile': 'Nenhum arquivo fornecido',
  'protect.errors.noPassword': 'Por favor, defina pelo menos uma senha',
  'protect.errors.passwordMismatch': 'As senhas não coincidem',
  'protect.errors.passwordTooShort': 'A senha deve ter pelo menos 8 caracteres',
  'protect.errors.passwordsSame': 'A senha de proprietário deve ser diferente da senha de usuário',
  'protect.fileInfo': 'Informações do Arquivo',
  'protect.notProtected': 'Não Protegido',
  'protect.ownerPassword': 'Senha de Proprietário (Permissões)',
  'protect.ownerPasswordDesc': 'Controle restrições e permissões do documento',
  'protect.ownerPasswordWarning': 'A senha de proprietário deve ser diferente da senha de usuário',
  'protect.password': 'Senha',
  'protect.passwordStrength.weak': 'Fraca',
  'protect.passwordStrength.fair': 'Razoável',
  'protect.passwordStrength.good': 'Boa',
  'protect.passwordStrength.strong': 'Forte',
  'protect.permissions': 'Permissões do Documento',
  'protect.printing': 'Impressão',
  'protect.printingHigh': 'Alta Resolução (qualidade total)',
  'protect.printingLow': 'Baixa Resolução (150 DPI)',
  'protect.printingNone': 'Nenhuma (sem impressão)',
  'protect.processing': 'Processando...',
  'protect.protectPdf': 'Proteger PDF',
  'protect.quickPresets': 'Predefinições Rápidas',
  'protect.setOwnerPassword': 'Definir senha de proprietário',
  'protect.subtitle': 'Proteja seu PDF com criptografia e permissões',
  'protect.title': 'Proteger PDF com Senha',
  'protect.toasts.error': 'Falha ao proteger PDF',
  'protect.toasts.errorDesc': 'Ocorreu um erro ao proteger o PDF',
  'protect.toasts.success': 'PDF protegido com sucesso!',
  'protect.toasts.successDesc': 'Seu PDF criptografado foi baixado.',
  'protect.userPassword': 'Senha de Usuário (Senha de Abertura)',
  'protect.userPasswordDesc': 'Necessária para abrir o documento PDF',

  // Unlock keys
  'unlock.name': 'Desbloquear PDF',
  'unlock.description': 'Remova a senha e proteção de arquivos PDF.',
  'unlock.change': 'Alterar',
  'unlock.enterPasswordPlaceholder': 'Digite a senha para desbloquear',
  'unlock.enterPdfPassword': 'Digite a Senha do PDF',
  'unlock.features.removePassword': 'Remover Senha',
  'unlock.features.removePasswordDesc': 'Remover senha de abertura',
  'unlock.features.removeRestrictions': 'Remover Restrições',
  'unlock.features.removeRestrictionsDesc': 'Habilitar impressão e edição',
  'unlock.features.secureHandling': 'Processamento Seguro',
  'unlock.features.secureHandlingDesc': 'Arquivos processados localmente',
  'unlock.passwordNote': 'Nota: Você deve fornecer a senha correta para desbloquear o documento. Não podemos quebrar senhas desconhecidas.',
  'unlock.subtitle': 'Remova a proteção por senha e restrições dos seus arquivos PDF',
  'unlock.supportNote': 'Suportamos a remoção de senhas de proprietário e usuário se você as conhecer.',
  'unlock.title': 'Desbloquear PDF',
  'unlock.toasts.error': 'Falha ao desbloquear PDF. Verifique a senha.',
  'unlock.toasts.success': 'PDF desbloqueado com sucesso!',
  'unlock.unlockPdf': 'Desbloquear PDF',
  'unlock.unlocking': 'Desbloqueando...',
};

// Chaves a adicionar em es
const esMissingKeys = {
  'common.addFiles': 'Agregar Archivos',
  'compress.levels.recommended': 'Recomendado',

  // Protect keys (igual pt-BR mas em espanhol)
  'protect.name': 'Proteger PDF',
  'protect.description': 'Añade contraseña y encripta tus archivos PDF importantes.',
  'protect.addUserPassword': 'Agregar contraseña de usuario (recomendado)',
  'protect.allowAnnotations': 'Permitir anotaciones',
  'protect.allowAssembly': 'Permitir ensamblaje de documentos',
  'protect.allowCopying': 'Permitir copia de contenido',
  'protect.allowForms': 'Permitir llenado de formularios',
  'protect.allowModifying': 'Permitir modificación',
  'protect.allowScreenReaders': 'Permitir lectores de pantalla',
  'protect.cancel': 'Cancelar',
  'protect.confirmOwnerPassword': 'Confirmar Contraseña de Propietario',
  'protect.confirmPassword': 'Confirmar Contraseña',
  'protect.encryption40bit': 'RC4 de 40 bits',
  'protect.encryption40bitDesc': '(legado, débil)',
  'protect.encryption128rc4': 'RC4 de 128 bits',
  'protect.encryption128rc4Desc': '(estándar)',
  'protect.encryption128aes': 'AES de 128 bits',
  'protect.encryption128aesDesc': '(recomendado) ✓',
  'protect.encryption256aes': 'AES de 256 bits',
  'protect.encryption256aesDesc': '(más fuerte)',
  'protect.encryptionInfo': 'Un cifrado más alto ofrece mejor seguridad pero puede tener problemas de compatibilidad con lectores PDF antiguos',
  'protect.encryptionLevel': 'Nivel de Cifrado',
  'protect.encryptionSettings': 'Configuración de Cifrado',
  'protect.enterOwnerPassword': 'Ingrese contraseña de propietario',
  'protect.enterPassword': 'Ingrese contraseña',
  'protect.errors.noFile': 'No se proporcionó archivo',
  'protect.errors.noPassword': 'Por favor establezca al menos una contraseña',
  'protect.errors.passwordMismatch': 'Las contraseñas no coinciden',
  'protect.errors.passwordTooShort': 'La contraseña debe tener al menos 8 caracteres',
  'protect.errors.passwordsSame': 'La contraseña de propietario debe ser diferente a la de usuario',
  'protect.fileInfo': 'Información del Archivo',
  'protect.notProtected': 'No Protegido',
  'protect.ownerPassword': 'Contraseña de Propietario (Permisos)',
  'protect.ownerPasswordDesc': 'Controle restricciones y permisos del documento',
  'protect.ownerPasswordWarning': 'La contraseña de propietario debe ser diferente a la de usuario',
  'protect.password': 'Contraseña',
  'protect.passwordStrength.weak': 'Débil',
  'protect.passwordStrength.fair': 'Aceptable',
  'protect.passwordStrength.good': 'Buena',
  'protect.passwordStrength.strong': 'Fuerte',
  'protect.permissions': 'Permisos del Documento',
  'protect.printing': 'Impresión',
  'protect.printingHigh': 'Alta Resolución (calidad total)',
  'protect.printingLow': 'Baja Resolución (150 DPI)',
  'protect.printingNone': 'Ninguna (sin impresión)',
  'protect.processing': 'Procesando...',
  'protect.protectPdf': 'Proteger PDF',
  'protect.quickPresets': 'Preajustes Rápidos',
  'protect.setOwnerPassword': 'Establecer contraseña de propietario',
  'protect.toasts.error': 'Error al proteger PDF',
  'protect.toasts.errorDesc': 'Ocurrió un error al proteger el PDF',
  'protect.toasts.success': '¡PDF protegido exitosamente!',
  'protect.toasts.successDesc': 'Su PDF cifrado ha sido descargado.',
  'protect.userPassword': 'Contraseña de Usuario (Abrir)',
  'protect.userPasswordDesc': 'Requerida para abrir el documento PDF',

  // Unlock keys
  'unlock.name': 'Desbloquear PDF',
  'unlock.description': 'Elimina la contraseña y protección de archivos PDF.',
  'unlock.change': 'Cambiar',
  'unlock.enterPasswordPlaceholder': 'Ingrese la contraseña para desbloquear',
  'unlock.enterPdfPassword': 'Ingrese la Contraseña del PDF',
  'unlock.passwordNote': 'Nota: Debe proporcionar la contraseña correcta para desbloquear el documento. No podemos descifrar contraseñas desconocidas.',
  'unlock.supportNote': 'Admitimos la eliminación de contraseñas de propietario y usuario si las conoce.',
  'unlock.toasts.error': 'Error al desbloquear PDF. Verifique la contraseña.',
  'unlock.toasts.success': '¡PDF desbloqueado exitosamente!',
  'unlock.unlockPdf': 'Desbloquear PDF',
  'unlock.unlocking': 'Desbloqueando...',
};

function addMissingKeys(locale: string, keysToAdd: Record<string, string>) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(content);

  let addedCount = 0;

  for (const [keyPath, value] of Object.entries(keysToAdd)) {
    const keys = keyPath.split('.');
    let current: any = json;

    // Navigate/create the path
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }

    // Set the value if it doesn't exist
    const finalKey = keys[keys.length - 1];
    if (!current[finalKey]) {
      current[finalKey] = value;
      addedCount++;
    }
  }

  // Save back
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf-8');

  return addedCount;
}

console.log('🔧 Adicionando chaves faltando...\n');

const ptBRAdded = addMissingKeys('pt-BR', ptBRMissingKeys);
console.log(`✅ pt-BR: ${ptBRAdded} chaves adicionadas`);

const esAdded = addMissingKeys('es', esMissingKeys);
console.log(`✅ es: ${esAdded} chaves adicionadas`);

console.log('\n✨ Concluído! Execute npm run validate:i18n para verificar.\n');
