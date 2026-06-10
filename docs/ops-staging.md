# Ops — staging e cron

Verificações recomendadas em cron diário (GitHub Actions ou Vercel Cron):

```bash
npm run verify:generators-live -- --suite=sprint1
npm run verify:generators-live -- --suite=sprint3
npm run verify:generators-live -- --suite=sprint4
```

Gates locais antes de merge:

```bash
npm run typecheck
npm run verify:generators
npm run verify:sprint2
npm run verify:sprint3
npm run verify:sprint4
npm run build
```

## Migration operacional (Sprint 4)

```bash
supabase db push   # aplica 20260622_operational_events.sql
```

## Sentry (opcional)

Defina `SENTRY_DSN` no ambiente de staging/produção. Sem DSN, o bundle Sentry não é inicializado.
