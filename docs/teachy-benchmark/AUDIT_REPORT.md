# AUDIT REPORT — ações de código por ferramenta

> Gerado após auditoria Opção A (jun/2026). Implementações marcadas ✅ foram aplicadas nesta entrega.

## P0 — Avaliações e pacote

### lista / prova

| Dimensão | Teachy | Planify antes | Ação | Arquivo | Status |
|----------|--------|---------------|------|---------|--------|
| Formulário | Qtd 5/10/15/20 | Presets 5–20 | Já existia | `material-quantity-presets.ts` | ✅ |
| Formulário | Autocomplete BNCC assunto | Campo tema livre | Usar cache pedagógico existente | `MateriaisClient.tsx` + `enrich-with-pedagogical-context` | ⚠ roadmap |
| Conteúdo | Enunciado 1–3 frases | Verboso | Contrato Teachy | `teachy-document-contract.ts` | ✅ |
| Visual | Gabarito tabela | Bloco texto | Tabela `# \| resposta` | `material-document-layout.ts`, `editor-print-html.ts` | ✅ |
| Qualidade | Retry implícito | Alertas only | Gate score < 80 bloqueia P0 | `material-engine-service.ts` | ✅ |
| Geração | Outline 2-pass | Só prova/lista/apostila | Expandir tipos | `material-pedagogical-outline.ts` | ✅ |

### slides

| Dimensão | Ação | Arquivo | Status |
|----------|------|---------|--------|
| Sequência capa→fechamento | Regras pedagógicas | `material-engine-prompts.ts` | ✅ |
| Outline 2-pass | Incluir slides | `material-pedagogical-outline.ts` | ✅ |
| Export PPTX | Teachy nativo | Planify Google Slides | ⚠ roadmap |

### plano-aula / atividade

| Dimensão | Ação | Arquivo | Status |
|----------|------|---------|--------|
| Outline 2-pass | Expandir | `material-pedagogical-outline.ts` | ✅ |
| Etapas com duração | Hints Teachy | `teachy-document-contract.ts` | ✅ |

### aula-completa (Aula Mágica)

| Dimensão | Teachy | Ação | Arquivo | Status |
|----------|--------|------|---------|--------|
| Pacote | 6–8 materiais | 4 itens | Expandir default bundle | `lesson-bundle-config.ts` | ✅ |
| Narrativa | Tema compartilhado | Observações bundle | `lesson-bundle-orchestrator.ts` | ✅ existente |

## P1 — Outros materiais

| Tipo | Ação principal | Arquivo | Status |
|------|----------------|---------|--------|
| sequencia | Outline 2-pass | `material-pedagogical-outline.ts` | ✅ |
| resumo | Bullets curtos + outline | `material-engine-quality.ts`, outline | ✅ |
| redacao | Motivadores + teacherNotes | `teachy-document-contract.ts` | ✅ |
| apostila | Capítulos progressivos + outline | outline | ✅ |
| projeto | Fases + outline | outline | ✅ |
| flashcards | Frente/verso | hints | ✅ |
| mapa-mental | Hierarquia sintética | hints | ✅ |
| inclusao | Adaptações objetivas | hints | ✅ |

## Jogos (Teachy → Planify `jogo`)

| Formato Teachy | Ação | Arquivo | Status |
|----------------|------|---------|--------|
| Caça-palavras | Alias `caca_palavras` | `game-builder.ts` | ✅ |
| Palavra cruzada | Alias `cruzadinha` | `game-builder.ts` | ✅ |
| Bingo | Alias `bingo` | `game-builder.ts` | ✅ |
| Jogo da memória | Alias `memoria` | `game-builder.ts` | ✅ |

## Correção IA

| Dimensão | Teachy | Ação | Arquivo | Status |
|----------|--------|------|---------|--------|
| Feedback | Curto, rubrica | Prompt Teachy-style | `correction-ai-service.ts` | ✅ |
| Foto prova | OCR | — | — | ❌ roadmap P2 |

## UX formulário Planify

| Campo Teachy | Ação | Status |
|--------------|------|--------|
| Contexto opcional | Campo `observacoes` já exposto | ✅ |
| Quantidade 5/10/15/20 | Presets lista/prova | ✅ |
| BNCC autocomplete assunto | Integrar suggest pedagógico | ⚠ |

## Infra / qualidade

| Item | Ação | Arquivo | Status |
|------|------|---------|--------|
| Few-shot Gemini | Amostras anonimizadas | `teachy-few-shot-samples.ts`, `material-engine-prompts.ts` | ✅ |
| Benchmark script | 10 cenários estruturais | `scripts/benchmark-teachy-parity.mjs` | ✅ |
| Debug session 0e58e7 | Remover ingest | `material-engine-service.ts`, `EditorClient.tsx` | ✅ |
| Pro universal | Tier advanced | `material-generation-policy.ts` | ✅ (working tree) |

## Browser automation — limitações honestas

| Tarefa | Resultado |
|--------|-----------|
| Catálogo 60+ | ✅ Página pública + dashboard abas |
| Login Teachy | ✅ Sessão já autiva no browser MCP |
| Form lista (screenshot) | ✅ `samples/teachy-quiz-generator/form.png` |
| BNCC autocomplete | ✅ Observado (opções Frações Matemática) |
| Fluxo Lista automática | ⚠ Modal observado; geração completa interrompida (Escape fechou modal) |
| 23 gerações Teachy completas | ⚠ Parcial — 1 ferramenta documentada hands-on; demais via catálogo + padrões |
| 16 gerações Planify live | ⚠ Snippets locais (render engine) para lista/prova; demais via contrato |

## Próximos passos (pós-commit)

1. Completar gerações hands-on restantes com sessão Teachy/Planify manual
2. BNCC autocomplete no campo tema (`MateriaisClient`)
3. Corretor prova por foto (OCR)
4. Export PPTX slides nativo
