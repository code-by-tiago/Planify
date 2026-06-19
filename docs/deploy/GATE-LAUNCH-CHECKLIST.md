# Planify — Gate Launch (pré-produção)

Checklist acionável antes do go-live. Atualizado: 18/06/2026 (pós-Fase 5F/5G, commit Gate Launch).

**Plataforma professor-only:** sem login, portal ou links públicos para alunos. Indicação = professor convida professor.

Legenda: ✅ verificado | ⚠️ parcial / manual | ❌ pendente

| # | Item | Owner | Status | Como verificar |
|---|------|-------|--------|----------------|
| 1 | **Gemini / Vercel billing** | Ops | ⚠️ | Conferir no painel Google AI Studio / Cloud Billing que a API Gemini está ativa, com quota e alertas de custo. No Vercel: plano, limites de execução serverless e domínio. **Não automatizável em código.** |
| 2 | **Fase 0 — sem debug localhost em `src/`** | Code | ✅ | `npm run verify:gate-launch` ou `rg "127\\.0\\.0\\.1:7616|localhost:7616" src/` → zero hits. Fallbacks `localhost:3000` em config de dev são aceitos. |
| 3 | **Fase 1 — créditos fail-closed** | Code | ✅ | `src/server/generation/generation-api-shared.ts` bloqueia geração com `insufficient_credits` (HTTP 402) antes de chamar IA. Rotas de correção/materiais retornam o mesmo código. Teste manual: conta sem créditos → mensagem de bloqueio, sem consumo de IA. |
| 4 | **Fase 2 — ToolStudioShell + ExportDock (lista/prova)** | Code | ✅ | Em studio mode, `MateriaisClient` usa `ToolStudioShell` + `ExportDock` para `tipo === "lista"` e `tipo === "prova"`. Verificar: gerar lista/prova no dashboard → barra fixa inferior com exportação visível. |
| 5 | **Export audit — scripts de referência** | Code | ✅ | Rodar suite de export: `npm run verify:export-pipeline`, `node scripts/verify-export-motors.mjs`, `node scripts/verify-forms-export-payload.mjs`, `npm run verify:planejamento-docx`. Incluídos em `npm run verify:go-live`. |
| 6 | **Stripe E2E** | Ops + manual | ⚠️ | Modo teste: checkout em `/planos` → cartão `4242…` → webhook `checkout.session.completed` → premium liberado. Scripts: `node scripts/planify/stripe/inspecionar-webhook-stripe.cjs`. Docs: `docs/9-17-0-auditoria-stripe-assinaturas.md`, `docs/auditorias/teste-controlado-assinatura-*.md`. |
| 7 | **Login / signup — rotas e middleware** | Code | ✅ | `/login` existe (`src/app/login/page.tsx`); signup redireciona para `/planos` (`mode=signup`). Proxy (`src/proxy.ts`) protege rotas premium sem loop óbvio login↔dashboard. Smoke: `e2e/smoke.spec.ts`, `e2e/responsive.spec.ts` (redirects `/dashboard` → login/planos). |
| 8 | **Smoke mobile (E2E responsivo)** | Code | ✅ | `e2e/responsive.spec.ts` — viewports 390×844, 768×1024, 1280×800. CI job **e2e** após **verify**. Rodar: `npm run test:e2e`. |
| 9 | **Privacidade / termos (IA, Stripe, contato)** | Code | ✅ | `/privacidade` menciona Gemini, Stripe e link `/contato`. `/termos` menciona Stripe e IA. `/contato` operacional. |
| 10 | **Rollback (< 15 min)** | Ops | ⚠️ | Procedimento em `docs/deploy/DEPLOY-CHECKLIST.md` § Rollback. Vercel: redeploy do deployment anterior. Supabase: migrations são aditivas; rollback de app não exige reverter SQL imediato. |
| 11 | **Fase 5F — Saúde IA + `/status` público** | Code | ✅ | Admin: card **Saúde IA** em `AdminQualidadePanel` (gerações 24h, falha, cota, 429). Professores: `/status` + link no footer. `npm run verify:wcag-forms` para labels nos fluxos materiais/planejamentos. |
| 12 | **Fase 5G — Indicação + PWA leve** | Code | ✅ | `/cadastro?ref=CODE` → cookie → `teacher_referrals` no activate-account. Painel: **Indique um colega** no dashboard. `public/manifest.webmanifest` + cache offline do último material (`localStorage`). Migration: `20260628_teacher_referrals.sql`. |

## Automação

```bash
npm run verify:gate-launch   # checks estáticos dos itens 2–5, 7–9
npm run verify:wcag-forms    # labels nos formulários core materiais/planejamentos
npm run verify:go-live       # suite completa pré-deploy
npm run typecheck
npm run build
npm run test:e2e             # smoke + responsivo (+ autenticado se secrets)
```

## Migrations Supabase (produção)

| Migration | Status | Aplicada em |
|-----------|--------|-------------|
| `20260618_teacher_correction_profile` | ✅ | remoto (20260618) |
| `teacher_teaching_context` | ✅ | remoto (20260619) |
| `teacher_referrals` | ✅ | remoto (20260619) |

Projeto: `zvhdqdtrhmvdadbbucey`. Demais migrations do repositório já estavam sincronizadas antes deste sprint.

Ver também `docs/deploy/DEPLOY-CHECKLIST.md`.

## Sign-off

| Papel | Nome | Data | OK |
|-------|------|------|-----|
| Engenharia | | | |
| Ops / billing | | | |
| Produto | | | |
