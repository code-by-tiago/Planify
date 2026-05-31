# Planify — 9.15.5 — Admin visível só para dono

## Motivo

A opção Admin sumiu completamente porque a etapa anterior removeu o link público para proteger usuários comuns.

## Correção

Agora existe:

```text
src/components/AdminShortcut.tsx
src/app/api/admin/status/route.ts
```

O botão Admin aparece somente se:

```text
authenticated = true
isAdmin = true
```

## Fluxo correto

```text
Usuário comum:
não vê Admin.

Usuário logado sem permissão:
não vê Admin.

Dono/admin logado:
vê botão Admin no topo.
```

## Segurança

Mesmo que alguém digite `/admin` manualmente:

```text
sem login -> tela de acesso administrativo
usuário comum -> acesso restrito
admin -> painel completo
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Entre com o e-mail configurado em PLANIFY_ADMIN_EMAIL.
2. Recarregue a página.
3. O botão Admin deve aparecer no topo.
4. Saia da conta.
5. O botão Admin deve sumir.
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Marketplace
Biblioteca
Downloads anual/trimestral
```
