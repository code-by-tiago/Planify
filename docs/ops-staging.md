# Ops — staging e cron

Verificações recomendadas em cron diário (GitHub Actions ou Vercel Cron):

```bash
npm run verify:generators-live -- --suite=sprint1
npm run verify:generators-live -- --suite=sprint3
npm run verify:generators-live -- --suite=sprint4
npm run verify:generators-live -- --suite=u2
npm run verify:generators-live -- --suite=u3
```

Gate global (pré-deploy):

```bash
npm run verify:ecosystem
```

Gates locais antes de merge:

```bash
npm run typecheck
npm run verify:generators
npm run verify:sprint2
npm run verify:sprint3
npm run verify:sprint4
npm run verify:unification-u1
npm run verify:unification-u2
npm run verify:unification-u3
npm run build
```

## Padrão de erro (Unificação U1+)

Rotas de geração IA retornam JSON com campos opcionais alinhados ao contrato em `src/server/generation/generation-api-contract.ts`:

```json
{ "ok": false, "code": "insufficient_credits|daily_limit_reached|offline|server_error|timeout|validation_error", "message": "...", "retryable": true }
```

Planejamentos mantêm `success: false` + `error.message` por compatibilidade, com `code` opcional.

UI: `formatGenerationError` + `GenerationErrorBanner` + `useRetryableAction` em `src/lib/pro/generation-error-ui.tsx`.

Camada compartilhada: `src/server/generation/generation-api-shared.ts` (auth, créditos, cota, refund, telemetria).

Ops: `withOperationalCapture` em rotas IA — 502 gera `operational_events` + Sentry (sem PII).

## Migration operacional (Sprint 4)

```bash
supabase db push   # aplica 20260622_operational_events.sql
```

## Sentry (opcional)

Defina `SENTRY_DSN` ou `NEXT_PUBLIC_SENTRY_DSN` no ambiente de staging/produção (Vercel → Settings → Environment Variables). Sem DSN, o Sentry não é inicializado. Após adicionar, faça redeploy.

Para validar: abra o site em produção, force um erro de teste ou aguarde um 502 real — o banner roxo “sample error” no painel Sentry **não** é do Planify.
