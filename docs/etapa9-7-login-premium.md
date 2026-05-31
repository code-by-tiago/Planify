# Planify — Etapa 9.7 — Login conectado ao acesso premium

## O que foi criado

```text
src/lib/supabase/browser-client.ts
src/lib/auth/session-client.ts
src/app/login/page.tsx
src/app/login/LoginClient.tsx
src/app/logout/route.ts
src/app/sair/page.tsx
src/app/sair/SairClient.tsx
```

## Fluxo

```text
1. Usuário faz login com Supabase.
2. Frontend recebe access_token.
3. Frontend chama /api/auth/access-cookie.
4. Backend valida perfil e assinatura.
5. Se premium/admin, grava cookie planify_access.
6. Middleware libera páginas internas.
7. Sem plano ativo, usuário vai para /planos.
```

## Cadastro

```text
Criar conta não libera acesso.
Após criar conta, o usuário vai para /planos.
```

## Sair

```text
/sair encerra sessão Supabase e remove cookie premium.
```

## Importante

Para um usuário comum acessar o dashboard, ele precisa ter registro ativo na tabela subscriptions com status active ou trialing.

Para o dono acessar tudo, o profile deve ter:

```text
role = admin
is_admin = true
```
