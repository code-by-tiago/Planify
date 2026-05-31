# Planify — 9.20.11 — Landing final de conversao

## Objetivo

Adicionar uma camada final de conversao na Home publica.

## O que muda

```text
Beneficios claros
Secao Como funciona
Secao seguranca/premium sem texto tecnico
Depoimentos/validacao social
FAQ de planos
CTA final mais forte
```

## Arquivos alterados

```text
src/app/page.tsx
src/app/globals.css
```

## Scripts criados

```text
scripts/planify/ui/aplicar-landing-final-conversao-9-20-11.cjs
scripts/planify/ui/auditoria-landing-final-conversao-9-20-11.cjs
```

## O que nao muda

```text
DOCX oficial
Planejamentos
BNCC
Editor funcional
Biblioteca real
Marketplace real
Admin
Stripe
Supabase
APIs
Banco
Login
Assinaturas
Premium Gate
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-11-landing-final-conversao.ps1
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
Home
/planos
/login
/dashboard
/planejamentos
/biblioteca
/marketplace
```
