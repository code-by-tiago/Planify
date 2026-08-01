# Planify — Etapa 9.8 — Admin dono do site

## O que esta etapa faz

```text
Cria SQL seguro para profiles, subscriptions, trigger de profile e políticas admin.
Cria script local para verificar admin.
Cria script local para promover um e-mail a admin.
Cria API segura /api/admin/me para validar se o usuário logado é admin.
```

## Arquivos

```text
database/09-8-admin-owner-safe.sql
scripts/planify/admin/_env.cjs
scripts/planify/admin/verificar-admin.cjs
scripts/planify/admin/promover-admin.cjs
src/app/api/admin/me/route.ts
```

## Como aplicar o SQL

No Supabase:

```text
SQL Editor
New query
Cole o conteúdo de database/09-8-admin-owner-safe.sql
Run
```

## Como verificar seu usuário

No PowerShell, dentro de C:\planify:

```powershell
node scripts\planify\admin\verificar-admin.cjs --email "seu-email@dominio.com"
```

## Como promover seu usuário a admin

No PowerShell, dentro de C:\planify:

```powershell
node scripts\planify\admin\promover-admin.cjs --email "seu-email@dominio.com"
```

## Regra final

```text
Admin:
role = admin
is_admin = true
```

Admin passa pelo acesso premium mesmo sem assinatura ativa.

Usuário comum continua precisando de subscription active ou trialing.
