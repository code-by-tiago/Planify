# Planify — Auditoria client-ready (Fases 0–5)

Data: 18/06/2026  
Commit base pós-Fase 3: `8b4ff103`  
Fase 4: E2E, CI e auditoria RLS  
Fase 5: Diferenciação docente (professor-first)

## Resumo executivo

| Fase | Escopo | Status |
|------|--------|--------|
| **0** | Fundação go-live (`verify:go-live`, proxy, gates premium) | Concluída |
| **1** | Qualidade de materiais e export pipeline | Concluída |
| **2** | Ecossistema pedagógico (BNCC, comunidade, banco) | Concluída |
| **3** | Paridade Teachy P0 (studio, export dock, dashboard hub) | Concluída (`8b4ff103`) |
| **4** | Produção client-ready (E2E, CI, RLS, docs) | Concluída |
| **5** | Diferenciação docente (contexto, distribuição, histórico) | Concluída |

## Fase 5 — Entregas (professor-only)

### 5A — Contexto docente persistente

- Coluna `profiles.teaching_context` (jsonb) + API `GET/PUT /api/me/teaching-context`
- Sincronização local (`localStorage`) + Supabase, padrão igual a `correction_profile`
- Chip **Minha turma** em `MateriaisClient` e `PlanejamentosClient` — pré-preenche etapa, série, componente e turma
- Auto-aplicação no primeiro carregamento quando o professor já tem contexto salvo
- Salvamento automático após geração bem-sucedida

### 5B — Distribuição (ações do professor)

- **5B.1** Botão **Publicar na turma** (`GoogleClassroomDockButton`) em destaque no ExportDock de materiais
- **5B.2** Compartilhamento **WhatsApp** + copiar resumo (`MaterialWhatsAppShareButton`) — professor envia externamente via `wa.me/?text=…`
- **5B.3 omitido de propósito:** sem link público read-only para alunos, sem `shareToken`, sem portal aluno no Planify

### 5C — Histórico inteligente

- **Gerar de novo** no histórico — reabre o studio com tipo, tema e campos pedagógicos pré-preenchidos (`buildDashboardRegenerateHref`)

### Explicitamente fora do escopo (Fase 5 neste commit)

- Wizard de primeiro login (deferido — risco no fluxo de auth)
- 5D OCR / relatório turma correção
- 5E publish comunidade 1-clique além do existente
- 5F admin health / WCAG
- 5G referral / PWA

### Restrição de produto (mantida)

**Planify é plataforma exclusiva para professores.** Alunos não fazem login nem acessam materiais via Planify; o professor distribui por Classroom, WhatsApp ou impressão.

## Fase 4 — Entregas

### Testes E2E (Playwright)

| Arquivo | Cobertura |
|---------|-----------|
| `e2e/smoke.spec.ts` | Landing, login, rotas públicas, redirects premium/auth-only |
| `e2e/responsive.spec.ts` | Viewports **390×844**, **768×1024**, **1280×800** — landing, login, rotas críticas, redirects |
| `e2e/authenticated.spec.ts` | Login fixture (`PLANIFY_E2E_*`), dashboard, biblioteca (lista), studio materiais mobile, export dock in-viewport quando há material |
| `e2e/fixtures/auth.ts` | Helper de login; skip automático sem credenciais |

**CI sem secrets:** smoke + responsivo rodam sempre; testes autenticados fazem `test.skip` quando `PLANIFY_E2E_EMAIL` / `PLANIFY_E2E_PASSWORD` não estão definidos.

**CI com secrets:** configurar `PLANIFY_E2E_EMAIL` e `PLANIFY_E2E_PASSWORD` (conta com plano ativo) para cobrir dashboard, biblioteca e export dock mobile.

### CI (`.github/workflows/ci.yml`)

- Job **verify** (inalterado): `verify:go-live` → `typecheck` → `build`
- Job **e2e** (novo, `needs: verify`): `playwright install chromium` → `build` → `npm run test:e2e`

### Segurança — RLS

Revisão de `supabase/planify-schema.sql` + migrations:

**Schema base (`planify-schema.sql`)** — RLS habilitado em 10 tabelas core:

- `profiles`, `plans`, `subscriptions`, `documents`, `lesson_plans`, `teaching_materials`, `bncc_skills`, `user_history`, `marketplace_items`, `library_items`

Padrão de políticas:

- **Own-or-admin** em dados de usuário (`profiles`, `subscriptions`)
- **Owner + premium** (`can_access_app()`) em documentos, planejamentos, materiais, histórico, marketplace
- **Published + premium** em biblioteca e marketplace (leitura)
- **Admin-only** em mutações de planos e BNCC

**Migrations** — todas as tabelas adicionais declaram `enable row level security` com políticas owner/admin/service:

- Créditos, comunidade docente, escolas, geração, banco de questões, Google integrations, etc.

Nenhuma tabela `public.*` identificada sem RLS nas migrations revisadas.

### Auditoria anti-vazamento

Executada em 18/06/2026:

```
node scripts/planify/final/auditoria-anti-vazamento-9-21-0.cjs
Resultado: OK
Relatório: docs/auditorias/auditoria-anti-vazamento-9-21-0-2026-06-18T23-47-37-276Z.md
```

- `.gitignore` protege `.env*`
- Nenhum secret hardcoded no scan
- Referências a chaves públicas via `NEXT_PUBLIC_*` conforme esperado

## Verificações locais (Fases 4–5)

```bash
npm run verify:go-live
npm run typecheck
npm run build
npm run test:e2e
npm run test:e2e:install   # primeira vez / CI
```

## Pendências / secrets opcionais

| Item | Requer secret? |
|------|----------------|
| Smoke + responsivo E2E | Não |
| E2E autenticado (dashboard, biblioteca, export dock) | Sim — `PLANIFY_E2E_EMAIL`, `PLANIFY_E2E_PASSWORD` |
| Export dock in-viewport | Sim + material gerado na sessão (skip se ausente) |
| Deploy produção | Supabase, Stripe, Gemini, Google OAuth |

## Documentação atualizada

- `docs/deploy/DEPLOY-CHECKLIST.md` — passos E2E e job CI
- `.env.example` — variáveis `PLANIFY_E2E_*`
