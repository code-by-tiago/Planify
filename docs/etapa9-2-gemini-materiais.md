# Planify — Etapa 9.2 — Gemini IA para Materiais Didáticos

## O que foi criado

```text
src/server/ai/prompts/material-prompt.ts
src/server/ai/material-ai-service.ts
src/app/api/ai/material/route.ts
src/lib/ai/material-client.ts
src/app/materiais/page.tsx
src/app/materiais/MateriaisClient.tsx
scripts/planify/testar-ai-material.cjs
```

## Tipos suportados

```text
atividade
prova
apostila
sequencia
jogo
projeto
roteiro
```

## Regra importante

```text
Jogo pedagógico não exige quantidade de questões.
```

## Ainda não faz

```text
Não gera DOCX.
Não salva no Supabase.
Não envia automaticamente para o editor.
```

## Teste local

Com o servidor rodando:

```powershell
node scripts/planify/testar-ai-material.cjs
```
