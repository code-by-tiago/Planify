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

## Deploy

1. Configurar variáveis de ambiente no painel do provedor.
2. Configurar Supabase URLs, service role e anon key.
3. Configurar Stripe keys, prices e webhook.
4. Configurar admin email.
5. Rodar build no deploy.
6. Testar login, planos, premium gate, planejamentos, biblioteca, marketplace e editor.

## Google Drive/Classroom

Implementar em etapa separada e segura:

1. OAuth start/callback.
2. Exportar DOCX já gerado para Drive.
3. Depois compartilhar/publicar via Classroom.
4. Manter download DOCX como fallback.

## Referência

- Auditoria client-ready (fases 0–4): `docs/auditorias/auditoria-client-ready-2026-06.md`
