# Validação de Internacionalização (i18n)

Este diretório contém scripts para validar a consistência das traduções em todo o projeto.

## Script de Validação

O script `validate-i18n.ts` verifica automaticamente:

### ✅ O que é verificado

1. **Consistência entre locales**: Garante que todas as chaves de tradução presentes em `en.json` também existem em `pt-BR.json` e `es.json`
2. **Chaves usadas no código**: Verifica se todas as chaves referenciadas com `useTranslations()` e `getTranslations()` existem nos arquivos de tradução
3. **Chaves extras**: Identifica chaves que existem em alguns locales mas não em outros
4. **Chaves não utilizadas** (opcional): Encontra traduções que podem não estar sendo usadas no código

### 🚀 Como usar

#### Validação básica

```bash
npm run validate:i18n
```

Este comando:
- Verifica consistência entre todos os locales
- Valida se as chaves usadas no código existem nas traduções
- Falha se encontrar erros críticos (útil para CI/CD)

#### Validação com chaves não utilizadas

```bash
npm run validate:i18n:unused
```

Além da validação básica, também mostra chaves que podem não estar sendo usadas (pode ter falsos positivos).

#### Validação sem falhar

```bash
npm run validate:i18n:no-exit
```

Executa a validação mas não falha o processo, apenas mostra os erros (útil para desenvolvimento).

#### Gerar relatório detalhado

```bash
npm run i18n:report
```

Gera um relatório detalhado em Markdown (`i18n-errors-report.md`) com todas as chaves faltando, extras e sugestões de correção. Útil para corrigir problemas manualmente.

### 📊 Exemplo de Output

```
================================================================================
  i18n Validation Report
================================================================================

❌ Missing Keys (15)
These keys exist in the reference locale but are missing in others:

  Locale: pt-BR
    - header.toggleMenu
    - header.toggleDarkMode
    - footer.github
    ... and 12 more

❌ Keys Used But Not Found (3)
These keys are referenced in code but don't exist in translations:

  - settings.profile.title
  - dashboard.overview
  - tools.export.options

⚠️  Extra Keys (2)
These keys exist in some locales but not in the reference:

  - common.oldKey (in pt-BR)
  - landing.deprecatedFeature (in es)

================================================================================
❌ Found 18 critical errors
Summary:
  Missing keys: 15
  Keys not found: 3
  Extra keys: 2
================================================================================
```

### 🔧 Integração com Build

O script já está integrado ao processo de build:

```json
{
  "scripts": {
    "build": "npm run validate:i18n && next build"
  }
}
```

Isso significa que:
- ✅ O build **falhará** se houver traduções faltando
- ✅ Você descobrirá erros **antes** de ir para produção
- ✅ Não há risco de mensagens `MISSING_MESSAGE` em produção

### 🐛 Corrigindo Erros

#### 1. Chaves faltando em um locale

**Erro:**
```
Key "header.toggleMenu" exists in en but is missing in pt-BR
```

**Solução:**
Adicione a chave no arquivo `messages/pt-BR.json`:

```json
{
  "header": {
    "toggleMenu": "Alternar menu"
  }
}
```

#### 2. Chave usada no código não existe

**Erro:**
```
Key "settings.profile.title" is used in code but not found in translations
```

**Solução:**
Adicione a chave em todos os arquivos de tradução:

`messages/en.json`:
```json
{
  "settings": {
    "profile": {
      "title": "Profile Settings"
    }
  }
}
```

`messages/pt-BR.json`:
```json
{
  "settings": {
    "profile": {
      "title": "Configurações do Perfil"
    }
  }
}
```

#### 3. Chaves extras

**Erro:**
```
Key "common.oldKey" exists in pt-BR but not in en
```

**Solução:**
- Se a chave deve existir: adicione em todos os locales
- Se é obsoleta: remova do locale que a contém

### 📝 Boas Práticas

1. **Execute antes de fazer commit:**
   ```bash
   npm run validate:i18n
   ```

2. **Use namespaces organizados:**
   ```typescript
   // ✅ Bom
   const t = useTranslations('header')
   t('toggleMenu')

   // ❌ Evite
   const t = useTranslations()
   t('headerToggleMenu')
   ```

3. **Mantenha a estrutura consistente:**
   - Use sempre a mesma profundidade de aninhamento
   - Siga a mesma organização em todos os locales
   - Mantenha as chaves em ordem alfabética quando possível

4. **Referência sempre em inglês:**
   - O inglês (`en.json`) é usado como referência
   - Sempre adicione novas chaves primeiro em `en.json`
   - Depois traduza para `pt-BR.json` e `es.json`

### 🔍 Limitações Conhecidas

1. **Chaves dinâmicas**: O script não detecta chaves construídas dinamicamente:
   ```typescript
   // Não será detectado pelo script
   const key = isAdmin ? 'admin.title' : 'user.title'
   t(key)
   ```

2. **Falsos positivos em chaves não usadas**: Algumas chaves podem ser marcadas como não usadas mesmo estando em uso (ex: em arquivos de configuração, metadata, etc.)

3. **Templates literais**: Chaves em template literals podem não ser detectadas:
   ```typescript
   // Pode não ser detectado
   t(`${namespace}.${key}`)
   ```

### 🤝 Contribuindo

Ao adicionar novas traduções:

1. Adicione a chave em **todos** os arquivos de locale
2. Execute `npm run validate:i18n` para verificar
3. Corrija quaisquer erros antes de fazer commit
4. Considere adicionar testes se estiver usando chaves dinâmicas

### 📚 Recursos Adicionais

- [Documentação next-intl](https://next-intl-docs.vercel.app/)
- [Estrutura de mensagens](https://next-intl-docs.vercel.app/docs/usage/messages)
- [Uso de namespaces](https://next-intl-docs.vercel.app/docs/usage/namespaces)
