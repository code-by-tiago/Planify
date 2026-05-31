# Planify — 9.17.1.1 — Hotfix script inspecionar webhook

## Problema

O comando:

```powershell
node scripts\planify\stripe\inspecionar-webhook-stripe.cjs
```

falhou porque o arquivo auxiliar não tinha sido copiado para o projeto.

## Correção

Este hotfix copia:

```text
scripts/planify/stripe/inspecionar-webhook-stripe.cjs
```

## Depois de aplicar

```powershell
cd C:\planify
node scripts\planify\stripe\inspecionar-webhook-stripe.cjs
node scripts\planify\stripe\auditoria-stripe-assinaturas.cjs
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Observação

Este arquivo é apenas diagnóstico. Ele não altera Stripe, webhook, banco, DOCX, Biblioteca, Admin ou acesso premium.
