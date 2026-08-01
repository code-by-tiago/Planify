# Planify — 9.11 — Premium Sync Local

## Objetivo

Fechar o ciclo premium enquanto o projeto ainda está em localhost.

Em produção, o correto é o webhook Stripe chamar:

```text
/api/stripe/webhook
```

Mas em localhost a Stripe não consegue chamar seu computador diretamente sem Stripe CLI ou túnel.

## O que esta etapa adiciona

```text
1. Serviço premium final para validar admin ou assinatura ativa.
2. Script para sincronizar manualmente assinatura Stripe pelo e-mail.
3. Script para verificar assinatura do usuário no Supabase.
```

## Arquivos

```text
src/server/supabase/admin-client.ts
src/server/auth/premium-access-service.ts
scripts/planify/stripe/_env.cjs
scripts/planify/stripe/sincronizar-assinatura-email.cjs
scripts/planify/stripe/verificar-assinatura-email.cjs
```

## Verificar assinatura no Supabase

```powershell
cd C:\planify
node scripts\planify\stripe\verificar-assinatura-email.cjs --email "professor@email.com"
```

## Sincronizar assinatura manualmente

Use isso quando um usuário pagou no Stripe, mas o webhook ainda não está público.

```powershell
cd C:\planify
node scripts\planify\stripe\sincronizar-assinatura-email.cjs --email "professor@email.com"
```

## Depois da sincronização

```text
1. Acesse /sair
2. Acesse /login
3. Entre com o e-mail sincronizado
4. Deve liberar /dashboard se status for active ou trialing
```

## Webhook real

Quando o Planify estiver em deploy público, cadastre na Stripe:

```text
https://seudominio.com/api/stripe/webhook
```

E coloque o signing secret em:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```
