# Planify — Auditoria Stripe e Assinaturas

Data: 31/05/2026, 07:03:24

## Resultado geral

[AVISO] Sem falhas críticas, mas com 2 aviso(s) para revisar.


## Dependências
[OK] stripe instalado: ^22.2.0
[OK] @supabase/supabase-js instalado: ^2.106.2

## .env.local Stripe/Supabase
[OK] NEXT_PUBLIC_SUPABASE_URL configurado (https:...e.co)
[OK] NEXT_PUBLIC_SUPABASE_ANON_KEY configurado (sb_pub...P9JL)
[OK] SUPABASE_SERVICE_ROLE_KEY configurado (sb_sec...hNo_)
[OK] STRIPE_SECRET_KEY configurado (sk_liv...7H8w)
[OK] STRIPE_WEBHOOK_SECRET configurado (***)
[OK] STRIPE_SECRET_KEY tem formato esperado sk_test/sk_live.
[OK] STRIPE_WEBHOOK_SECRET tem formato esperado whsec_.
[OK] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY configurado como chave pública Stripe (pk_liv...MVLV)
[OK] Price IDs Stripe encontrados: STRIPE_PRICE_PRO_MONTHLY=price_...1DEX, STRIPE_PRICE_PRO_YEARLY=price_...j7aJ

## Rotas Stripe
[OK] Arquivos com referência Stripe/subscriptions: 21
   - src/app/admin/AdminClient.tsx
   - src/app/api/stripe/checkout/route.ts
   - src/app/api/stripe/webhook/route.ts
   - src/app/contato/ContatoClient.tsx
   - src/app/planos/page.tsx
   - src/app/planos/sucesso/page.tsx
   - src/config/billing.ts
   - src/config/env.ts
   - src/config/routes.ts
   - src/lib/navigation.ts
   - src/server/auth/premium-access-service.ts
   - src/server/index.ts
   - src/server/stripe/checkout-service.ts
   - src/server/stripe/index.ts
   - src/server/stripe/stripe-api.ts
   - src/server/stripe/webhook-service.ts
   - src/types/access.ts
   - src/types/database.ts
   - src/types/plan.ts
   - src/types/subscription.ts
   - src/types/supabase-models.ts
[OK] Webhook Stripe encontrado: src/app/api/stripe/webhook/route.ts, src/server/stripe/webhook-service.ts
[OK] Rota/serviço de checkout encontrado: src/app/api/stripe/checkout/route.ts, src/server/stripe/checkout-service.ts

## Webhook Stripe
[AVISO] src/app/api/stripe/webhook/route.ts: webhook encontrado, mas não localizei constructEvent.
[OK] src/config/env.ts: usa STRIPE_WEBHOOK_SECRET.
[OK] src/server/stripe/index.ts: usa STRIPE_WEBHOOK_SECRET.
[AVISO] src/server/stripe/webhook-service.ts: webhook encontrado, mas não localizei constructEvent.
[OK] src/server/stripe/webhook-service.ts: usa STRIPE_WEBHOOK_SECRET.
[OK] src/server/stripe/webhook-service.ts: trata evento checkout.session.completed
[OK] src/server/stripe/webhook-service.ts: trata evento customer.subscription.created
[OK] src/server/stripe/webhook-service.ts: trata evento customer.subscription.updated
[OK] src/server/stripe/webhook-service.ts: trata evento customer.subscription.deleted
[OK] src/server/stripe/webhook-service.ts: grava/atualiza tabela subscriptions.

## Liberação de acesso premium
[OK] Arquivos de acesso premium encontrados: 39
   - src/app/api/access/status/route.ts
   - src/app/api/admin/me/route.ts
   - src/app/api/auth/access/route.ts
   - src/app/api/auth/access-cookie/route.ts
   - src/app/api/biblioteca/materiais/route.ts
[OK] /api/access/status usa verifyPremiumAccess.
[OK] /api/access/status mantém acesso interno do proprietário.
[OK] premium-access-service consulta subscriptions.
[OK] premium-access-service contém status: active
[OK] premium-access-service contém status: trialing
[OK] premium-access-service contém status: past_due
[OK] premium-access-service contém status: canceled
[OK] premium-access-service contém status: incomplete

## Exposição de chaves no frontend
[OK] Não encontrei uso direto de chaves secretas em arquivos visuais/client.

## Banco de dados / subscriptions
[OK] Scripts SQL com subscriptions encontrados: database/09-10-stripe-webhook-subscriptions.sql, database/09-6-premium-access-safe.sql, database/09-8-admin-owner-safe.sql
[OK] database/09-10-stripe-webhook-subscriptions.sql: cria tabela subscriptions.
[OK] database/09-10-stripe-webhook-subscriptions.sql: ativa RLS.
[OK] database/09-10-stripe-webhook-subscriptions.sql: contém customer_id.
[OK] database/09-10-stripe-webhook-subscriptions.sql: contém current_period_end.
[OK] database/09-10-stripe-webhook-subscriptions.sql: contém status.
[OK] database/09-6-premium-access-safe.sql: ativa RLS.
[OK] database/09-6-premium-access-safe.sql: contém customer_id.
[OK] database/09-6-premium-access-safe.sql: contém current_period_end.
[OK] database/09-6-premium-access-safe.sql: contém status.
[OK] database/09-8-admin-owner-safe.sql: cria tabela subscriptions.
[OK] database/09-8-admin-owner-safe.sql: ativa RLS.
[OK] database/09-8-admin-owner-safe.sql: contém customer_id.
[OK] database/09-8-admin-owner-safe.sql: contém current_period_end.
[OK] database/09-8-admin-owner-safe.sql: contém status.

## Teste manual recomendado
1. Em modo teste Stripe, compre o plano mensal com cartão de teste.
2. Confirme que o Stripe dispara checkout.session.completed.
3. Confirme que a tabela subscriptions recebe/atualiza a assinatura.
4. Faça login com o e-mail comprador.
5. Abra /api/access/status e confirme premium=true.
6. Abra /dashboard, /planejamentos, /materiais e /biblioteca.
7. Cancele a assinatura no Stripe test.
8. Reenvie ou aguarde webhook customer.subscription.updated/deleted.
9. Confirme que premium=false para usuário comum sem assinatura ativa.
