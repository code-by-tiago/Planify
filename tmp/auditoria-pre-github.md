# Planify — Auditoria pré-GitHub

Data: 2026-05-31T06:43:11.005Z

## Arquivos obrigatórios
- OK .gitignore
- OK .env.local
- OK package.json
- OK src/app/admin/biblioteca/page.tsx
- OK src/app/api/admin/biblioteca/materiais/route.ts
- OK src/app/api/biblioteca/materiais/route.ts

## .gitignore
- OK .env
- OK .env.local
- OK node_modules
- OK .next

## Busca por segredos em arquivos de código
- ATENÇÃO: docs\9-10-stripe-webhook-supabase.md: SUPABASE_SERVICE_ROLE_KE...
- ATENÇÃO: docs\9-10-stripe-webhook-supabase.md: STRIPE_SECRET_KEY=...
- ATENÇÃO: docs\9-9-correcao-stripe-checkout-planos.md: STRIPE_SECRET_KEY=...
- ATENÇÃO: docs\etapa9-5-supabase-historico-preparado.md: SUPABASE_SERVICE_ROLE_KE...

## Próximos passos
- Rodar npm run build
- Testar /admin/biblioteca
- Testar /biblioteca
- Confirmar upload e download de anexo
- Só depois criar commit GitHub