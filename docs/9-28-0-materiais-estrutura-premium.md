# Planify — Etapa 9.28.0 — Materiais Estrutura Premium

Esta etapa substitui a aplicação isolada da 9.27 e deve ser aplicada por cima da 9.26. Ela mantém o foco direto ao produto e adiciona contratos de estrutura por tipo de material.

## Objetivo

Fazer o Gerador de Materiais Didáticos entregar materiais com estrutura compatível com o tipo solicitado pelo professor.

## Melhorias

- Atividades, exercícios, listas, provas e revisões deixam de depender de texto/parágrafo corrido.
- Questões passam a ser tratadas como itens numerados, com comandos objetivos e tópicos quando houver mais de uma ação.
- Versão do aluno fica separada do gabarito do professor.
- Alternativas passam a ser renderizadas como lista ordenada A, B, C, D, E no documento do editor.
- Apostilas passam a receber contrato de livro didático: capa textual, capítulos/unidades, explicação progressiva, exemplos, boxes, vocabulário, síntese, exercícios e gabarito.
- Sequências didáticas são reforçadas como aulas/momentos.
- Projetos são reforçados como investigação, etapas, produto final, socialização e rubrica.
- Jogos continuam focados em material imprimível/jogável, não em explicação solta.

## Arquivos alterados

- `src/app/materiais/MateriaisClient.tsx`
- `src/server/ai/prompts/material-prompt.ts`
- `src/lib/materiais/pedagogical-hard-engine.ts`
- `src/lib/materiais/material-quality-guardian.ts`
- `src/lib/materiais/material-structure-contracts.ts`

## Preservado

Não altera Planejamentos, DOCX oficial, BNCC, Stripe, Biblioteca, Marketplace, Admin, Editor base ou Premium Gate.
