# Planify — 9.19.0 — Auditoria Marketplace

## Objetivo

Auditar o Marketplace antes de mexer em código pesado.

## Verificações

```text
Página Marketplace
Proteção premium
API Marketplace
Upload/anexo
Download
Tabela/bucket no Supabase
Conteúdo fictício/mock
SQL/RLS
Estado real do Marketplace
```

## Scripts criados

```text
scripts/planify/marketplace/auditoria-marketplace.cjs
scripts/planify/marketplace/marketplace-supabase-probe.cjs
```

## Como rodar

```powershell
cd C:\planify
node scripts\planify\marketplace\auditoria-marketplace.cjs
```

## Probe opcional Supabase

```powershell
node scripts\planify\marketplace\marketplace-supabase-probe.cjs
```

## Depois

```powershell
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## O que esta etapa NÃO altera

```text
DOCX oficial
Planejamentos
BNCC
Editor
Biblioteca Admin
Biblioteca do usuário
Admin
Stripe
Premium Gate
Acesso do proprietário
```

## Próxima etapa provável

Se a auditoria mostrar que o Marketplace ainda é visual/estático:

```text
9.19.1 — Marketplace real com upload/download e Supabase
```
