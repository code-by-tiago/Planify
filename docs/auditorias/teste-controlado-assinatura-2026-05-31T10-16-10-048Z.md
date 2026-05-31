# Planify — Teste controlado do fluxo de assinatura

Data: 31/05/2026, 07:16:06

## Objetivo

Validar Stripe, planos, subscriptions e condições para testar login premium sem alterar funcionalidades.

## Stripe
[OK] STRIPE_SECRET_KEY configurado (sk_live_...7H8w)
[OK] Modo detectado: LIVE
[AVISO] Você está usando chave LIVE. Não use cartão de teste aqui. Qualquer pagamento será real.
[OK] Conta Stripe conectada: acct_1Rju3WLaHMckI3fp
[OK] Charges enabled: true
[OK] Payouts enabled: true

### Price IDs
[OK] STRIPE_PRICE_PRO_MONTHLY: price_1TYzKqLaHMckI3fpxVM81DEX | ativo | BRL 49.9 | month | produto: Professor Pro - Planify
[OK] STRIPE_PRICE_PRO_YEARLY: price_1TYzNmLaHMckI3fph86mj7aJ | ativo | BRL 479.9 | year | produto: Professor Pro Anual - Planify

## Supabase / subscriptions
[OK] Tabela subscriptions acessível. Total aproximado: 0
[AVISO] Nenhuma assinatura encontrada ainda. Isso é normal antes do primeiro checkout concluído.

## Checklist manual seguro

1. Abra /planos.
2. Clique no plano mensal ou anual.
3. Confirme se abriu o Checkout Stripe correto.
4. Se estiver em modo LIVE, não use cartão de teste. Pagamento será real.
5. Se estiver em modo TEST, use cartão de teste Stripe.
6. Depois do pagamento, confira /planos/sucesso.
7. Confira a tabela subscriptions no Supabase.
8. Faça login com o e-mail comprador.
9. Abra /api/access/status.
10. O esperado para pagante ativo é premium=true.
11. Abra /dashboard, /planejamentos, /materiais e /biblioteca.
12. Teste um usuário comum sem plano e confirme bloqueio.
