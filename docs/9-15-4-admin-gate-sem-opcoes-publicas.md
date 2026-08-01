# Planify — 9.15.4 — Admin Gate sem opções públicas

## Correção

O usuário comum não deve ver opções internas do Admin.

Agora o fluxo é:

```text
Usuário não logado acessa /admin
→ vê apenas tela de acesso administrativo
→ botão Entrar como administrador

Usuário logado mas não admin acessa /admin
→ vê acesso restrito
→ não vê nenhuma opção interna

Usuário admin acessa /admin
→ vê painel admin
```

## Arquivos adicionados/alterados

```text
src/server/auth/admin-access.ts
src/components/AdminAccessGate.tsx
src/app/admin/page.tsx
src/app/admin/biblioteca/page.tsx
```

## Link Admin público

O instalador roda um script para remover links públicos para `/admin` fora da própria área admin.

## Variável obrigatória

O instalador garante no `.env.local`:

```text
PLANIFY_ADMIN_EMAIL=ts162351@gmail.com
```

Se seu e-mail admin for outro, ajuste manualmente.

## Reiniciar servidor

Como `.env.local` pode mudar, reinicie:

```powershell
npm run dev
```

## Teste

```text
1. Sem login: abrir /admin.
   Resultado esperado: tela de acesso, sem opções internas.

2. Com usuário comum: abrir /admin.
   Resultado esperado: acesso restrito, sem opções internas.

3. Com e-mail admin: abrir /admin.
   Resultado esperado: painel admin completo.
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Marketplace
Biblioteca pública
Downloads anual/trimestral
```
