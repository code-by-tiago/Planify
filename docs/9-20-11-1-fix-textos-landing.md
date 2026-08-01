# Planify — 9.20.11.1 — Correção de textos/encoding da landing

## Objetivo

Corrigir textos quebrados que apareceram visualmente na Home, como:

```text
come\u00e7ar
conte\u00fado
pedag\u00f3gica
experi\u00eancia
```

## O que corrige

```text
Sequências literais \u00xx em arquivos visuais
Mojibake comum como Ã§, Ã£, Ã©, Âº
Textos da Home e páginas visuais
```

## Segurança

Esta etapa exclui:

```text
src/components/PlanifyFieldEnhancer.tsx
src/app/api
scripts
docs
backups
```

Isso evita mexer em arquivos sensíveis ou na lógica dos campos inteligentes.

## O que não muda

```text
DOCX
Planejamentos
BNCC
IA
Stripe
Supabase
APIs
Banco
Login
Assinaturas
Biblioteca real
Marketplace real
Admin
Editor funcional
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-11-1-fix-textos-landing.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Testar

```text
/
Verificar:
Começar agora
BNCC por conteúdo
Editor avançado
Dúvidas frequentes
experiência organizada
IA pedagógica
```
