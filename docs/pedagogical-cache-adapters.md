# Adapters do Reservatório Didático

O Planify usa adapters modulares para popular `pedagogical_cache_entries`. Cada fonte é registrada em `pedagogical_sources` e resolvida por `pedagogical-adapter-registry.ts`.

## Contrato

Implemente `PedagogicalSourceAdapter` em `src/server/pedagogical-cache/adapters/`:

```ts
export interface PedagogicalSourceAdapter {
  slug: string;
  canHandle(query: PedagogicalScrapeQuery): boolean;
  fetch(query: PedagogicalScrapeQuery): Promise<PedagogicalScrapeResult | null>;
}
```

Campos obrigatórios em `PedagogicalScrapeResult`:

- `title`, `summary` (≤ 400 chars), `bodyMarkdown`
- `sourceUrl`, `sourceTitle`, `license`
- `contentType`: `context` | `definition` | `orientation`
- `confidence`: 0–1 (≥ 0.95 + `auto_approve` na source → `approved` automático)

## Passos para plugar Domínio Público (OER)

1. **Migration seed** — insira em `pedagogical_sources`:

   ```sql
   insert into pedagogical_sources (slug, name, adapter_type, base_url, license_label, config, priority)
   values (
     'dominio-publico',
     'Domínio Público MEC',
     'oer_api',
     'https://dominiopublico.gov.br',
     'Domínio Público',
     '{"rate_limit_ms": 2000, "search_path": "/api/search"}'::jsonb,
     70
   );
   ```

2. **Adapter** — substitua `oer-stub-adapter.ts` ou crie `dominio-publico-adapter.ts`:
   - `canHandle`: tema com ≥ 3 caracteres
   - `fetch`: busca na API ou HTML allowlist (sem crawl recursivo na v1)
   - Respeite `robots-policy.ts` antes de HTTP

3. **Registry** — registre em `pedagogical-adapter-registry.ts`:

   ```ts
   import { dominioPublicoAdapter } from "./adapters/dominio-publico-adapter";
   STATIC_ADAPTERS["dominio-publico"] = dominioPublicoAdapter;
   ```

4. **Revisão** — entradas com `confidence < 0.95` ficam `pending` até admin aprovar em `/api/admin/pedagogico/fila`.

5. **Cron** — configure Vercel Cron para `POST /api/cron/pedagogico/refresh` com header `Authorization: Bearer $CRON_SECRET`.

## Fontes v1

| Slug | Adapter | HTTP | Auto-approve |
|------|---------|------|--------------|
| `bncc-skills` | BNCC local (`bncc_skills`) | Não | Sim (1.0) |
| `wikipedia-pt` | MediaWiki API | Sim | Não (pending) |
| `bncc-gov-orientacoes` | HTML seed URLs | Sim | Não |
| `dominio-publico` | Stub (`canHandle: false`) | — | — |

## Dedup e assinatura

- `topic_signature` = hash(tema + componente + etapa + bncc[0])
- `content_hash` = hash(título + corpo) — mesmo padrão de `question-bank-hash.ts`

## Economia de tokens

- Cache hit + `approved` → zero IA no snippet
- Miss com texto estruturado → zero IA
- Miss fragmentado → `format-pedagogical-snippet.ts` (Flash lite, ~512 tokens)
- Injeção na geração → contexto fixo em `observacoes`, menos alucinação factual
