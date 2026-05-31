# Planify — 9.19.1 — Marketplace real

## Objetivo

Transformar o Marketplace em funcionalidade real:

```text
Upload
Listagem
Busca
Download
Materiais por professor
Proteção premium
Dono/admin com acesso de teste
```

## Arquivos alterados

```text
database/09-19-1-marketplace-real.sql
src/app/api/marketplace/materiais/route.ts
src/app/marketplace/MarketplaceClient.tsx
src/app/marketplace/page.tsx
```

## SQL obrigatório

Rode no Supabase SQL Editor:

```text
C:\planify\database\09-19-1-marketplace-real.sql
```

Esse SQL:

```text
Cria/ajusta marketplace_materials
Cria bucket marketplace-materiais
Ativa RLS
Cria políticas básicas
Cria índices
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
1. Entre como usuário premium ou dono.
2. Abra /marketplace.
3. Publique um material com anexo.
4. Veja se aparece na lista.
5. Baixe o material.
6. Clique Ver meus materiais.
7. Remova o material.
```

## Observação

O Marketplace é diferente da Biblioteca Premium:

```text
Biblioteca Premium:
materiais oficiais publicados pelo Admin.

Marketplace:
materiais compartilhados por professores premium.
```

## O que não foi alterado

```text
DOCX oficial
Planejamentos
BNCC
Editor
Biblioteca Admin
Biblioteca do usuário
Admin
Stripe
Premium Gate
Acesso do proprietário
```
