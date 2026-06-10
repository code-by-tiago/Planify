# Estratégia de custo de IA — Planify

Documento de referência para tiering Gemini, cotas, créditos, reservatório didático e KPIs operacionais.

## Princípio de produto (não negociável)

- O banco de dados fornece **fatos** apenas; o Material Engine continua gerando o material final.
- Nunca entregar cache bruto como material final ao professor.
- Injetar somente entradas com `review_status = approved`.
- Se o match for fraco → **não injetar** (melhor perder contexto do que errar).

## Tiering Flash / Pro

| Superfície | Política padrão | Quando sobe para Pro |
|------------|-----------------|----------------------|
| Materiais (jogos, atividades, provas) | Flash na maioria dos tipos | Tipos profundos + `elevarQualidade` |
| Planejamentos | Flash padrão | `elevarQualidade` ou problemas de qualidade |
| Inclusão | Conforme `material-generation-policy` | — |
| Sugestão de conteúdos | Seeds locais primeiro; Gemini só se insuficiente | — |

Não alterar defaults de tiering sem revisão de produto.

## Cota diária e créditos

- Gerações **profundas** (planejamento, bundles, tipos Pro) consomem slot da cota diária (`consumeDeepGeneration`).
- Materiais leves (flashcards, resumos) não contam na cota profunda.
- Créditos de ciclo (`prepareGenerationRequest`) aplicam-se a superfícies que cobram por geração (ex.: inclusão).

## Reservatório didático (RAG)

1. `findApprovedEntries` busca por `topic_signature`, aliases e BNCC.
2. **Confidence gate** (`pedagogical-match-confidence.ts`) valida relevância antes de `cache_hit`:
   - Normaliza tema (lowercase, NFD, trim).
   - Match forte: overlap de tema (substring ou tokens ≥ 50%) **ou** overlap de `bncc_codigos`.
   - Se nenhuma entrada passa → `{ kind: "empty" }` e evento `pedagogical_inject_skipped`.
3. `recordCacheHit` só para entradas efetivamente injetadas.

### Seeds locais (sugestão de conteúdos)

`suggestMaterialContents` tenta `resolveDisciplineTopicGuidance` antes de chamar Gemini. Seeds em `discipline-topic-seeds.ts` cobrem temas de alta frequência sem custo de API.

## Variáveis de ambiente relevantes

| Variável | Uso |
|----------|-----|
| `GEMINI_API_KEY` | Geração IA |
| `GEMINI_CONTEXT_CACHE` | Cache de contexto Gemini (planejamentos, prompts longos) |
| `SLIDE_AI_IMAGES` | Imagens IA em slides (quando habilitado) |
| `CRON_SECRET` | Auth dos crons (`/api/cron/pedagogico/*`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Scripts e admin server-side |

## KPIs

Monitorar no painel **Admin → Qualidade**:

- **Hit rate** = hits / (hits + misses)
- **Tokens economizados** (estimativa por hit no reservatório)
- **Top miss themes** (temas sem cobertura — priorizar seed/ingest)
- **pedagogical_inject_skipped** (match fraco evitado)
- Taxa elevação / IA real / cota diária (gerações)

## Crons e ingest curado

| Rota | Função |
|------|--------|
| `POST /api/cron/pedagogico/refresh` | Marca entradas expiradas como `stale` |
| `POST /api/cron/pedagogico/ingest` | Re-scrape stale + top miss (máx. 20/run) |

Agendar no Vercel Cron ou scheduler externo com header `Authorization: Bearer $CRON_SECRET`.

## Operações (Phase 0)

Comandos para preparar/atualizar o reservatório em produção:

```bash
# 1. Aplicar migrations
supabase db push

# 2. Backfill BNCC nas entradas existentes
npm run backfill:pedagogical-bncc

# 3. Seed de temas curados (Wikipedia PT + fallbacks)
npm run seed:pedagogical-themes

# 4. Seed da biblioteca de pacotes (se aplicável)
npm run seed:biblioteca-pacotes

# 5. (Opcional) Enfileirar scrape dos top miss
npm run seed:pedagogical-miss-queue
```

Verificação local:

```bash
npm run typecheck
npm run verify:pedagogical-ecosystem
```
