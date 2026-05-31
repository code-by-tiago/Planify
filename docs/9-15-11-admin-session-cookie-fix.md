# Planify — 9.15.11 — Admin session cookie fix

## Problema

A tela mostrava:

```text
Login realizado, mas esta conta não possui permissão de administrador.
```

Mesmo usando o e-mail correto.

## Causa

O login do Supabase acontecia no navegador, mas o servidor não recebia de forma confiável o token Supabase com o e-mail admin. O cookie premium (`planify_access`) não era suficiente para identificar o dono.

## Correção

Foi criada uma sessão admin separada:

```text
POST /api/admin/session
cookie httpOnly: planify_admin_access
```

Fluxo novo:

```text
1. Login admin entra no Supabase.
2. Login admin envia accessToken para /api/admin/session.
3. Servidor valida o token com Supabase auth.getUser().
4. Servidor confere e-mail com PLANIFY_ADMIN_EMAIL.
5. Servidor grava cookie seguro planify_admin_access.
6. /admin passa a validar esse cookie.
```

## Arquivos alterados

```text
src/server/auth/admin-access.ts
src/app/api/admin/session/route.ts
src/app/api/admin/status/route.ts
src/lib/auth/session-client.ts
src/app/login/LoginClient.tsx
scripts/planify/admin/definir-admin-email.cjs
```

## Variáveis garantidas

```text
PLANIFY_ADMIN_EMAIL=ts162351@gmail.com
NEXT_PUBLIC_ADMIN_EMAIL=ts162351@gmail.com
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

Depois é obrigatório parar o servidor antigo e iniciar novamente:

```powershell
npm run dev
```

## Teste limpo

```text
1. Abra /sair.
2. Abra /admin.
3. Clique Entrar como Admin.
4. Entre com ts162351@gmail.com.
5. Deve liberar /admin.
```

## Verificação

Depois de logar, abra:

```text
/api/admin/status
```

Esperado:

```json
{
  "authenticated": true,
  "isAdmin": true,
  "email": "ts162351@gmail.com"
}
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Biblioteca
Marketplace
Downloads anual/trimestral
Visual geral do login
```
