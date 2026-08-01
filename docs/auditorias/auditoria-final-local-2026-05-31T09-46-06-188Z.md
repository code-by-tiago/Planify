# Planify — Auditoria Final Local

Data: 31/05/2026, 06:46:06

## Resultado geral

⚠️ Não há falhas críticas detectadas, mas existem avisos para revisar.


## Arquivos essenciais
✅ package.json
✅ .env.local
✅ src/components/PageShell.tsx
✅ src/components/PremiumRouteGuard.tsx
✅ src/app/login/LoginClient.tsx
✅ src/app/api/access/status/route.ts
✅ src/app/api/owner/session/route.ts
✅ src/app/api/admin/session/route.ts
✅ src/app/api/admin/status/route.ts
✅ src/app/api/admin/biblioteca/materiais/route.ts
✅ src/app/api/biblioteca/materiais/route.ts
✅ src/app/admin/page.tsx
✅ src/app/admin/biblioteca/page.tsx
✅ src/app/admin/biblioteca/AdminBibliotecaClient.tsx
✅ src/app/biblioteca/BibliotecaClient.tsx
✅ src/app/planejamentos/page.tsx
✅ src/app/materiais/page.tsx
✅ src/app/editor/page.tsx
✅ src/app/marketplace/page.tsx
✅ src/lib/auth/session-client.ts
✅ src/server/auth/admin-access.ts
✅ src/server/auth/premium-access-service.ts

## Arquivos opcionais esperados
✅ database/09-15-14-biblioteca-admin-simples-definitiva.sql
✅ database/09-10-stripe-webhook-subscriptions.sql
⚠️ Arquivo opcional não encontrado: database/09-premium-access-safe.sql
⚠️ Arquivo opcional não encontrado: database/09-user-history-safe.sql

## .env.local
✅ NEXT_PUBLIC_SUPABASE_URL configurado
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY configurado
✅ SUPABASE_SERVICE_ROLE_KEY configurado
✅ GEMINI_API_KEY configurado
✅ STRIPE_SECRET_KEY configurado
✅ STRIPE_WEBHOOK_SECRET configurado
✅ PLANIFY_ADMIN_EMAIL configurado
✅ NEXT_PUBLIC_ADMIN_EMAIL configurado
✅ Há variáveis relacionadas a planos/Stripe no .env.local

## Proteção Premium
✅ PageShell usa PremiumRouteGuard.
✅ Rota protegida listada: /dashboard
✅ Rota protegida listada: /planejamentos
✅ Rota protegida listada: /materiais
✅ Rota protegida listada: /editor
✅ Rota protegida listada: /historico
✅ Rota protegida listada: /biblioteca
✅ Rota protegida listada: /marketplace
✅ /api/access/status valida premium e proprietário.

## Admin e proprietário
✅ Admin valida PLANIFY_ADMIN_EMAIL e cookie admin.
✅ Sessão Admin usa cookie httpOnly.
✅ Sessão de proprietário configurada.

## Biblioteca Admin + Usuário
✅ API Admin salva em library_materials e bucket biblioteca-materiais.
✅ API Admin da Biblioteca exige admin.
✅ API pública da Biblioteca lê materiais publicados do Admin.
✅ Biblioteca do usuário chama a API de materiais reais.
✅ Biblioteca Admin tem formulário simples com upload.

## Planejamentos e modelos DOCX
✅ Modelos DOCX encontrados em data: data/modelos-oficiais/modelo-anual.docx, data/modelos-oficiais/modelo-trimestral.docx
✅ Referências a DOCX encontradas em 23 arquivo(s).

## Stripe e assinaturas
✅ Referências Stripe/subscriptions encontradas em 21 arquivo(s).
✅ Webhook Stripe encontrado: src/app/api/stripe/webhook/route.ts

## Marketplace e Editor
✅ Página Marketplace existe.
✅ Página Editor existe.
✅ Editor possui sinais de edição rica.

## Texto/encoding/frontend
⚠️ Possíveis marcas de encoding em 8 ocorrência(s):
   - src/app/materiais/MateriaisClient.tsx:95: titulo: "Atividade de leitura e interpretaÃ§Ã£o",
   - src/app/materiais/MateriaisClient.tsx:99: anoSerie: "5Âº ano",
   - src/app/materiais/MateriaisClient.tsx:101: componenteCurricular: "LÃ­ngua Portuguesa",
   - src/app/materiais/MateriaisClient.tsx:102: tema: "Leitura e interpretaÃ§Ã£o de textos",
   - src/app/materiais/MateriaisClient.tsx:105: duracao: "2 perÃ­odos",
   - src/app/materiais/MateriaisClient.tsx:106: objetivos: "Desenvolver leitura, interpretaÃ§Ã£o e produÃ§Ã£o escrita.",
   - src/app/materiais/MateriaisClient.tsx:108: "Leitura de texto narrativo\nLocalizaÃ§Ã£o de informaÃ§Ãµes explÃ­citas\nInferÃªncia de sentidos\nProduÃ§Ã£o de respostas escritas",
   - src/app/materiais/MateriaisClient.tsx:110: "Ler o texto com atenÃ§Ã£o, responder com frases completas e revisar a escrita antes de entregar.",
⚠️ Possível referência visual a Gemini em: src/config/env.ts, src/lib/navigation.ts, src/server/ai/material-ai-service.ts, src/server/ai/planejamento-ai-service.ts, src/server/index.ts, src/server/planejamentos/planning-ai-service.ts, src/types/ai.ts
