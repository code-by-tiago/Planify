# Planify — Etapa 9.1 — Gemini IA para Planejamentos

## O que esta etapa cria

```text
src/types/ai.ts
src/server/ai/gemini-client.ts
src/server/ai/prompts/planejamento-prompt.ts
src/server/ai/planejamento-ai-service.ts
src/app/api/ai/planejamento/route.ts
src/lib/ai/planejamento-client.ts
scripts/planify/testar-ai-planejamento.cjs
```

## O que esta etapa NÃO faz

```text
Não implementa DOCX.
Não salva no Supabase.
Não altera Stripe.
Não cria habilidades BNCC.
Não altera a base BNCC oficial.
Não conecta ainda o botão da página /planejamentos.
```

## Regra BNCC

A Gemini só pode usar habilidades enviadas no campo:

```text
habilidadesSelecionadas
```

Se a IA tentar retornar código fora da lista selecionada, o serviço remove e adiciona alerta.

## Endpoint

```text
POST /api/ai/planejamento
```

## Teste local

1. Rode o servidor:

```powershell
npm run dev
```

2. Em outro terminal:

```powershell
node scripts/planify/testar-ai-planejamento.cjs
```

## Build

```powershell
npm run build
```
