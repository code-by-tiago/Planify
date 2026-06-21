# Planify | Deploy checklist

## Antes do GitHub

1. Rodar `npm run verify:go-live` (suite completa de smoke + checks estáticos).
2. Rodar `npm run typecheck` e `npm run build` local.
3. Rodar `npm run test:e2e` (smoke público + responsivo; testes autenticados exigem `PLANIFY_E2E_EMAIL` / `PLANIFY_E2E_PASSWORD`).
4. Rodar auditoria anti-vazamento: `node scripts/planify/final/auditoria-anti-vazamento-9-21-0.cjs`.
5. Confirmar que `.env.local` não aparece no git status.
6. Confirmar que os modelos DOCX oficiais estão presentes.
7. Confirmar que upload/download de Biblioteca e Marketplace funcionam.

## GitHub / CI

1. Push na branch `main` ou PR dispara `.github/workflows/ci.yml`.
2. Job **verify**: `verify:go-live`, `typecheck`, `build`.
3. Job **e2e** (após verify): Playwright Chromium — smoke, responsivo (390×844, 768×1024, 1280×800) e testes autenticados (skip automático sem credenciais).
4. Para E2E autenticado no CI, configurar secrets `PLANIFY_E2E_EMAIL` e `PLANIFY_E2E_PASSWORD` (conta com plano ativo).
5. Nunca subir `.env.local` nem secrets no repositório.

## Gate Launch

Antes do primeiro deploy de produção (ou release major), percorrer os 10 itens em
`docs/deploy/GATE-LAUNCH-CHECKLIST.md` e rodar:

```bash
npm run verify:gate-launch
npm run verify:go-live
```

## Deploy

1. **Migrations Supabase docentes** — aplicadas em produção (19/06/2026): `teaching_context`, `correction_profile`, `teacher_referrals`. Novas migrations futuras: `supabase db push` ou SQL Editor.
2. Configurar variáveis de ambiente no painel do provedor.
3. Configurar Supabase URLs, service role e anon key.
4. Configurar Stripe keys, prices e webhook.
5. Configurar admin email.
6. Rodar build no deploy.
7. Testar login, planos, premium gate, planejamentos, biblioteca, marketplace e editor.

## Rollback (< 15 min)

Se o deploy introduzir regressão crítica:

1. **Vercel:** Deployments → selecionar o deployment anterior estável → **Promote to Production** (≈ 2–5 min para propagar).
2. **Variáveis de ambiente:** se a regressão veio de env nova, reverter no painel e redeploy (≈ 5 min).
3. **Supabase migrations:** as migrations docentes são aditivas (`teaching_context`, `correction_profile` jsonb). Rollback de app **não exige** reverter SQL imediato; colunas extras são inofensivas para versões anteriores.
4. **Stripe webhook:** endpoint permanece o mesmo; não é necessário alterar em rollback de frontend.
5. **Validação pós-rollback:** smoke em `/`, `/login`, `/dashboard` (conta teste), uma geração de material.

Tempo alvo total: **menos de 15 minutos** (promote + smoke).

## Google Drive/Classroom

Implementar em etapa separada e segura:

1. OAuth start/callback.
2. Exportar DOCX já gerado para Drive.
3. Depois compartilhar/publicar via Classroom.
4. Manter download DOCX como fallback.

## Referência

- Auditoria client-ready (fases 0–4): `docs/auditorias/auditoria-client-ready-2026-06.md`
