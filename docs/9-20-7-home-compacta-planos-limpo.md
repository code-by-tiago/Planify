# Planify — 9.20.7 — Home compacta e planos limpo

## Objetivo

Deixar a home mais compacta, agradável e objetiva, além de remover textos técnicos visíveis na página de planos.

## O que muda

```text
Home com menos texto
Hero menor e mais direto
Vídeo/preview mais compacto
Cards mais objetivos
Workflow mais curto
CTA final mais simples
Página /planos sem texto técnico de Stripe/backend
```

## O que não muda

```text
DOCX oficial
Planejamentos
BNCC
Editor funcional
Biblioteca
Marketplace
Admin
Stripe
Premium Gate
Rotas internas
APIs
Banco de dados
Login
Assinaturas
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-7-home-compacta-planos-limpo.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
