# Planify — Auditoria Final Local

Data: 31/05/2026, 06:51:49

## Resultado geral

[AVISO] Não há falhas críticas detectadas, mas existem avisos para revisar.


## Arquivos essenciais
[OK] package.json
[OK] .env.local
[OK] src/components/PageShell.tsx
[OK] src/components/PremiumRouteGuard.tsx
[OK] src/app/login/LoginClient.tsx
[OK] src/app/api/access/status/route.ts
[OK] src/app/api/owner/session/route.ts
[OK] src/app/api/admin/session/route.ts
[OK] src/app/api/admin/status/route.ts
[OK] src/app/api/admin/biblioteca/materiais/route.ts
[OK] src/app/api/biblioteca/materiais/route.ts
[OK] src/app/admin/page.tsx
[OK] src/app/admin/biblioteca/page.tsx
[OK] src/app/admin/biblioteca/AdminBibliotecaClient.tsx
[OK] src/app/biblioteca/BibliotecaClient.tsx
[OK] src/app/planejamentos/page.tsx
[OK] src/app/materiais/page.tsx
[OK] src/app/editor/page.tsx
[OK] src/app/marketplace/page.tsx
[OK] src/lib/auth/session-client.ts
[OK] src/server/auth/admin-access.ts
[OK] src/server/auth/premium-access-service.ts

## Arquivos opcionais esperados
[OK] database/09-15-14-biblioteca-admin-simples-definitiva.sql
[OK] database/09-10-stripe-webhook-subscriptions.sql
[AVISO] Arquivo opcional não encontrado: database/09-premium-access-safe.sql
[AVISO] Arquivo opcional não encontrado: database/09-user-history-safe.sql

## .env.local
[OK] NEXT_PUBLIC_SUPABASE_URL configurado
[OK] NEXT_PUBLIC_SUPABASE_ANON_KEY configurado
[OK] SUPABASE_SERVICE_ROLE_KEY configurado
[OK] GEMINI_API_KEY configurado
[OK] STRIPE_SECRET_KEY configurado
[OK] STRIPE_WEBHOOK_SECRET configurado
[OK] PLANIFY_ADMIN_EMAIL configurado
[OK] NEXT_PUBLIC_ADMIN_EMAIL configurado
[OK] Há variáveis relacionadas a planos/Stripe no .env.local

## Proteção Premium
[OK] PageShell usa PremiumRouteGuard.
[OK] Rota protegida listada: /dashboard
[OK] Rota protegida listada: /planejamentos
[OK] Rota protegida listada: /materiais
[OK] Rota protegida listada: /editor
[OK] Rota protegida listada: /historico
[OK] Rota protegida listada: /biblioteca
[OK] Rota protegida listada: /marketplace
[OK] /api/access/status valida premium e proprietário.

## Admin e proprietário
[OK] Admin valida PLANIFY_ADMIN_EMAIL e cookie admin.
[OK] Sessão Admin usa cookie httpOnly.
[OK] Sessão de proprietário configurada.

## Biblioteca Admin + Usuário
[OK] API Admin salva em library_materials e bucket biblioteca-materiais.
[OK] API Admin da Biblioteca exige admin.
[OK] API pública da Biblioteca lê materiais publicados do Admin.
[OK] Biblioteca do usuário chama a API de materiais reais.
[OK] Biblioteca Admin tem formulário simples com upload.

## Planejamentos e modelos DOCX
[OK] Modelos DOCX encontrados em data: data/modelos-oficiais/modelo-anual.docx, data/modelos-oficiais/modelo-trimestral.docx
[OK] Referências a DOCX encontradas em 23 arquivo(s).

## Stripe e assinaturas
[OK] Referências Stripe/subscriptions encontradas em 21 arquivo(s).
[OK] Webhook Stripe encontrado: src/app/api/stripe/webhook/route.ts

## Marketplace e Editor
[OK] Página Marketplace existe.
[OK] Página Editor existe.
[OK] Editor possui sinais de edição rica.

## Texto/encoding/frontend
[AVISO] Possíveis marcas de encoding em 8 ocorrência(s):
   - src/app/materiais/MateriaisClient.tsx:95: titulo: "Atividade de leitura e interpretaÃ§Ã£o",
   - src/app/materiais/MateriaisClient.tsx:99: anoSerie: "5Âº ano",
   - src/app/materiais/MateriaisClient.tsx:101: componenteCurricular: "LÃ­ngua Portuguesa",
   - src/app/materiais/MateriaisClient.tsx:102: tema: "Leitura e interpretaÃ§Ã£o de textos",
   - src/app/materiais/MateriaisClient.tsx:105: duracao: "2 perÃ­odos",
   - src/app/materiais/MateriaisClient.tsx:106: objetivos: "Desenvolver leitura, interpretaÃ§Ã£o e produÃ§Ã£o escrita.",
   - src/app/materiais/MateriaisClient.tsx:108: "Leitura de texto narrativo\nLocalizaÃ§Ã£o de informaÃ§Ãµes explÃ­citas\nInferÃªncia de sentidos\nProduÃ§Ã£o de respostas escritas",
   - src/app/materiais/MateriaisClient.tsx:110: "Ler o texto com atenÃ§Ã£o, responder com frases completas e revisar a escrita antes de entregar.",
[OK] Nenhuma referência visual a Gemini encontrada fora de APIs/arquivos internos.
