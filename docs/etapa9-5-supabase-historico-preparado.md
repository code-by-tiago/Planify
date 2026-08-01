# Planify — Etapa 9.5 — Histórico preparado para Supabase

## O que foi criado

```text
src/server/supabase/admin-client.ts
src/server/history/history-db-service.ts
src/app/api/history/route.ts
src/app/api/history/[id]/route.ts
src/app/api/history/clear/route.ts
src/lib/history/history-api-client.ts
src/lib/history/history-storage.ts
```

## Como funciona

O histórico local continua funcionando normalmente.

A sincronização com Supabase fica preparada e pode ser ativada no navegador com:

```javascript
localStorage.setItem("planify:history:sync-supabase", "true")
```

Para desativar:

```javascript
localStorage.setItem("planify:history:sync-supabase", "false")
```

## Variáveis necessárias

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## Tabela usada

```text
user_history
```

## Campos esperados

```text
id
user_id
title
subtitle
source
type
status
content_preview
content
raw
created_at
updated_at
```

## Importante

Esta etapa prepara o backend e as APIs, mas não força a troca do histórico local pelo Supabase para não quebrar o fluxo atual.
