# Planify — Etapa 9.4 — Histórico local/provisório

## O que foi feito

```text
Planejamentos enviados ao Editor entram no Histórico local.
Materiais enviados ao Editor entram no Histórico local.
Documentos salvos localmente no Editor atualizam o Histórico local.
Página /historico lista, filtra, remove e abre documentos no Editor.
```

## Arquitetura

```text
src/types/history.ts
src/lib/history/history-storage.ts
src/lib/editor/editor-storage.ts
src/app/historico/page.tsx
src/app/historico/HistoricoClient.tsx
```

## Importante

Este histórico ainda é local no navegador. Ele prepara o fluxo para a próxima integração real com Supabase.

## Fluxo esperado

```text
1. Gere um planejamento ou material.
2. Envie para o Editor.
3. Abra /historico.
4. O item deve aparecer.
5. Clique em Abrir no Editor.
```
