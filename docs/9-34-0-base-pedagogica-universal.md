# Etapa 9.34 — Base Pedagógica Universal Offline

Esta etapa cria uma base pedagógica original para o Planify enriquecer o Gerador de Materiais sem depender apenas de uma chamada de IA.

Ela não promete conter “todo o conhecimento do mundo”. Isso não é tecnicamente possível em um ZIP estático. O que ela entrega é uma estrutura sólida: contratos por material, lentes por disciplina, progressão por etapa, padrões de questão, rubricas, metodologias, mensagens premium e portões de qualidade.

## Arquivos principais

- `data/planify-pedagogical-brain/pedagogical-brain.json`
- `data/planify-pedagogical-brain/question-models.json`
- `data/planify-pedagogical-brain/discipline-lenses.json`
- `data/planify-pedagogical-brain/grade-progression.json`
- `data/planify-pedagogical-brain/rubrics.json`
- `data/planify-pedagogical-brain/methodologies.json`
- `data/planify-pedagogical-brain/quality-rules.json`
- `src/lib/materiais/planify-pedagogical-brain.ts`
- `database/planify-pedagogical-brain-schema.sql`
- `database/planify-pedagogical-brain-seed.sql`

## Uso correto

1. Usar a base para planejar a estrutura antes da geração.
2. Usar a base para auditar a saída depois da geração.
3. Rejeitar material que caia em gabarito genérico, textão ou estrutura errada.
4. Ampliar com fontes abertas, materiais autorizados e curadoria do Admin.
