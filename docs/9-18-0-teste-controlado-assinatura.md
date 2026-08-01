# Planify — 9.18.0 — Teste controlado do fluxo de assinatura

## Objetivo

Validar o fluxo comercial sem alterar funcionalidades:

```text
Planos
Checkout Stripe
Webhook
Subscriptions
Login premium
Bloqueio de usuário sem plano
```

## Scripts criados

```text
scripts/planify/stripe/teste-controlado-assinatura.cjs
scripts/planify/stripe/verificar-assinatura-email.cjs
```

## Rodar diagnóstico geral

```powershell
cd C:\planify
node scripts\planify\stripe\teste-controlado-assinatura.cjs
```

Esse script:

```text
Confere modo Stripe live/test
Confere conta Stripe
Confere price IDs
Confere tabela subscriptions
Gera relatório em docs/auditorias
```

## Verificar assinatura por e-mail

Depois de um pagamento:

```powershell
node scripts\planify\stripe\verificar-assinatura-email.cjs email@exemplo.com
```

## Teste manual correto

```text
1. Abra /planos.
2. Clique no plano mensal ou anual.
3. Confirme se abriu o Checkout Stripe correto.
4. Se estiver usando chave LIVE, não use cartão de teste.
5. Se estiver usando chave TEST, use cartão de teste Stripe.
6. Depois do pagamento, confirme se voltou para /planos/sucesso.
7. Verifique o e-mail comprador:
   node scripts\planify\stripe\verificar-assinatura-email.cjs email@exemplo.com
8. Faça login com o e-mail comprador.
9. Abra /api/access/status.
10. Deve retornar premium=true.
11. Abra /dashboard, /planejamentos, /materiais e /biblioteca.
12. Teste outro usuário sem plano e confirme bloqueio.
```

## Importante

Se `STRIPE_SECRET_KEY` começar com:

```text
sk_live_
```

o ambiente é LIVE. Pagamentos são reais.

Se começar com:

```text
sk_test_
```

o ambiente é TEST. Pode usar cartões de teste Stripe.

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
Webhook Stripe
```
