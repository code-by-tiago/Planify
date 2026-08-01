# Planify — 9.10 — Webhook Stripe para Supabase

## O que foi criado

```text
src/server/stripe/stripe-api.ts
src/server/stripe/webhook-service.ts
src/app/api/stripe/webhook/route.ts
src/server/stripe/checkout-service.ts
database/09-10-stripe-webhook-subscriptions.sql
scripts/planify/stripe/verificar-webhook-env.cjs
```

## Eventos tratados

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

## Fluxo

```text
1. Usuário escolhe plano em /planos.
2. Stripe Checkout coleta o e-mail.
3. Ao concluir pagamento, Stripe envia webhook.
4. Webhook valida stripe-signature com STRIPE_WEBHOOK_SECRET.
5. Planify busca subscription na Stripe.
6. Planify localiza usuário no Supabase pelo e-mail.
7. Planify grava/atualiza public.subscriptions.
8. Login premium libera acesso se status for active ou trialing.
```

## SQL obrigatório

Execute no Supabase:

```text
database/09-10-stripe-webhook-subscriptions.sql
```

## Variáveis obrigatórias

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://...
```

## Verificar ambiente

```powershell
cd C:\planify
node scripts\planify\stripe\verificar-webhook-env.cjs
```

## Endpoint do webhook

```text
/api/stripe/webhook
```

Em produção, ficará parecido com:

```text
https://seudominio.com/api/stripe/webhook
```

Em local, o Stripe não consegue chamar localhost diretamente. Para teste local, use um túnel ou a CLI da Stripe. Em deploy real, configure o endpoint público no painel da Stripe.
