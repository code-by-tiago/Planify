# Correção — Stripe session.url null no build

## Erro

```text
Argument of type 'string | null' is not assignable to parameter of type 'string | NextURL | URL'.
```

## Causa

O tipo do Stripe permite `session.url` como `string | null`.

## Correção

```text
1. checkout-service agora retorna { id: string, url: string }.
2. route.ts valida session.url antes do redirect.
3. NextResponse.redirect recebe string garantida.
```

## Arquivos

```text
src/server/stripe/checkout-service.ts
src/app/api/stripe/checkout/route.ts
```
