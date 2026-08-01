# Planify — 9.17.0 — Auditoria Stripe e Assinaturas

## Objetivo

Auditar o fluxo comercial do Planify sem alterar funcionalidades existentes.

## Esta etapa verifica

```text
.env.local
chaves Stripe
Price IDs
checkout
webhook
STRIPE_WEBHOOK_SECRET
eventos de assinatura
tabela subscriptions
premium-access-service
risco de chave secreta exposta no frontend
status de premium para usuário pagante
```

## Arquivos criados

```text
scripts/planify/stripe/auditoria-stripe-assinaturas.cjs
scripts/planify/stripe/stripe-probe.cjs
```

## Auditoria local

```powershell
cd C:\planify
node scripts\planify\stripe\auditoria-stripe-assinaturas.cjs
```

Ela salva relatório em:

```text
docs/auditorias/
```

## Teste real de conexão com Stripe

Opcional:

```powershell
cd C:\planify
node scripts\planify\stripe\stripe-probe.cjs
```

Esse script usa `STRIPE_SECRET_KEY` localmente e apenas mostra dados mascarados.

## Depois

```powershell
cd C:\planify
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
Marketplace
Admin
Premium Gate
Acesso do proprietário
```

## Teste manual recomendado

```text
1. Criar checkout com plano mensal em modo teste.
2. Pagar com cartão teste Stripe.
3. Confirmar evento checkout.session.completed.
4. Confirmar linha em subscriptions.
5. Login com e-mail comprador.
6. /api/access/status deve retornar premium=true.
7. /dashboard deve abrir.
8. Cancelar assinatura no Stripe.
9. Webhook deve atualizar/cancelar.
10. Usuário comum deve perder acesso premium.
```
