# Correção — Jogo pedagógico somente quando solicitado

## Ajuste

Atividades, provas, apostilas, sequências, projetos e roteiros não devem exibir bloco de jogo pedagógico.

## Regra

```text
tipo = jogo     -> pode exibir bloco jogo
tipo != jogo    -> backend descarta jogo e editor não imprime jogo
```

## Arquivos

```text
src/server/ai/prompts/material-prompt.ts
src/server/ai/material-ai-service.ts
src/lib/editor/format-ai-output.ts
src/app/materiais/MateriaisClient.tsx
```
