# Planify — Etapa 9.6 — Acesso premium real preparado

## Regra

```text
Login não basta.
O usuário só acessa páginas internas se tiver assinatura ativa ou for admin.
```

## Páginas protegidas

```text
/dashboard
/planejamentos
/materiais
/editor
/historico
/biblioteca
/marketplace
/admin
```

## Rotas criadas

```text
POST /api/auth/access
POST /api/auth/access-cookie
DELETE /api/auth/access-cookie
```

## Fluxo

```text
1. Login obtém access_token do Supabase.
2. Frontend chama /api/auth/access-cookie com Bearer token.
3. Backend valida o usuário com Supabase.
4. Backend consulta profiles e subscriptions.
5. Se assinatura ativa ou admin, grava cookie planify_access.
6. Middleware libera páginas internas.
```

## Importante

Esta etapa prepara a proteção premium. Para funcionar totalmente, a página /login precisa chamar syncPremiumAccessCookie(accessToken) após autenticar com Supabase.

## SQL

Execute no Supabase se ainda não tiver as colunas:

```text
database/09-6-premium-access-safe.sql
```
