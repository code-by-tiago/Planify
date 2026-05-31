# Planify — 9.15.17 — Owner Premium Session Fix

## Problema

O Admin conseguia entrar na área administrativa, mas ao sair do Admin e tentar abrir áreas do site como usuário, o login do dono não passava no acesso premium:

```text
/biblioteca
/dashboard
/planejamentos
/materiais
/editor
/marketplace
```

## Causa

O acesso premium dependia do cookie de assinatura:

```text
planify_access
```

Mas o dono do site precisa testar as áreas premium mesmo sem comprar uma assinatura para si próprio.

## Correção

Foi criada uma sessão própria do proprietário:

```text
/api/owner/session
cookie: planify_owner_access
```

Fluxo novo:

```text
1. Dono faz login normal em /login.
2. O navegador envia o token Supabase para /api/owner/session.
3. O servidor valida o e-mail contra PLANIFY_ADMIN_EMAIL.
4. Se for o dono, grava planify_owner_access.
5. /api/access/status passa a considerar owner como premium.
6. /api/biblioteca/materiais passa a considerar owner como premium.
```

## Usuários comuns

Usuário comum sem plano continua bloqueado.

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
npm run dev
```

## Teste limpo

```text
1. Abra /sair.
2. Faça login normal em /login com ts162351@gmail.com.
3. Abra /biblioteca.
4. O material cadastrado pelo Admin deve aparecer.
5. Abra /dashboard, /planejamentos e /materiais.
6. Devem liberar.
```

## Verificação

Depois do login normal, abra:

```text
http://localhost:3000/api/access/status
```

Esperado:

```json
{
  "authenticated": true,
  "premium": true,
  "isOwner": true,
  "email": "ts162351@gmail.com"
}
```

## O que não foi alterado

```text
DOCX oficial
Editor motor
Planejamentos
BNCC
Stripe
Biblioteca Admin
Admin Session
Marketplace interno
Downloads anual/trimestral
```
