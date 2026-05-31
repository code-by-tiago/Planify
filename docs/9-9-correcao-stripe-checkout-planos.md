# Planify — 9.9 — Correção Stripe Checkout / Planos

## Problema

Ao clicar em planos, o navegador abria:

```text
/api/stripe/checkout
```

E retornava 404.

## Correção

```text
1. Criada rota /api/stripe/checkout.
2. Página /planos agora usa links com ?plan=monthly ou ?plan=yearly.
3. Checkout criado no servidor com STRIPE_SECRET_KEY.
4. Price IDs lidos do .env.local.
5. Secret key nunca vai para o frontend.
6. Acesso direto sem plano volta para /planos com mensagem clara.
```

## Variáveis aceitas

```env
STRIPE_SECRET_KEY=
STRIPE_PRICE_PRO_MENSAL=
STRIPE_PRICE_PRO_ANUAL=
```

Também são aceitas:

```env
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_PRO_YEARLY=
```

## Teste

```text
1. npm run build
2. npm run dev
3. Abrir /planos
4. Clicar em plano mensal ou anual
5. Deve abrir Stripe Checkout
```
