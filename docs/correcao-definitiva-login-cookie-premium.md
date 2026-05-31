# Correção definitiva — Login premium e cookie do middleware

## Problema

O login validava premium/admin, mas o middleware não liberava as rotas internas porque o cookie `planify_access` podia não ser interpretado corretamente.

## Correção

```text
1. Cookie agora é salvo como JSON codificado por encodeURIComponent.
2. Middleware aceita cookie novo e cookie antigo em base64url.
3. Login força navegação com window.location.href.
4. Cookie dura 7 dias em ambiente local/produção.
```

## Arquivos

```text
src/app/api/auth/access-cookie/route.ts
src/middleware.ts
src/app/login/LoginClient.tsx
```

## Teste

```text
1. Rode npm run build
2. Rode npm run dev
3. Acesse /sair
4. Acesse /login
5. Entre com o admin
6. Deve abrir /dashboard
```
