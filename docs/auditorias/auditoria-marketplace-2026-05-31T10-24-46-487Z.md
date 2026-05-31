# Planify — Auditoria Marketplace

Data: 31/05/2026, 07:24:46

## Resultado geral

[AVISO] Sem falhas críticas, mas com 7 aviso(s) para revisar.


## Arquivos Marketplace
[OK] src/app/marketplace/page.tsx existe.
[OK] Referências Marketplace encontradas em 26 arquivo(s).
   - src/app/admin/AdminClient.tsx
   - src/app/contato/ContatoClient.tsx
   - src/app/dashboard/page.tsx
   - src/app/historico/HistoricoClient.tsx
   - src/app/layout.tsx
   - src/app/marketplace/MarketplaceClient.tsx
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx
   - src/app/marketplace/novo/page.tsx
   - src/app/marketplace/page.tsx
   - src/app/page.tsx
   - src/app/planos/page.tsx
   - src/components/PageShell.tsx
   - src/components/PremiumRouteGuard.tsx
   - src/config/app.ts
   - src/config/billing.ts
   - src/config/protected-routes.ts
   - src/config/routes.ts
   - src/data/module-categories.ts
   - src/data/plans.ts
   - src/lib/downloads/docx-download-client.ts
   - src/lib/navigation.ts
   - src/middleware.ts
   - src/server/docx/document-normalizer.ts
   - src/types/database.ts
   - src/types/editor.ts
   - src/types/supabase-models.ts

## Proteção Premium
[OK] /marketplace está listado no PremiumRouteGuard.
[OK] PageShell usa PremiumRouteGuard.

## API Marketplace
[AVISO] Nenhuma API Marketplace encontrada em src/app/api.
[AVISO] Se o Marketplace ainda for apenas visual, a próxima etapa deve criar API real com upload/download.

## Interface Marketplace
[OK] Interface tem campo de arquivo/upload.
[AVISO] Interface não parece chamar API. Pode estar estática/mock.
[OK] Interface tem sinais de download/anexo.
[OK] Interface tem estado/client logic.

## Conteúdo fictício/mock
[AVISO] Possíveis conteúdos fictícios/mock encontrados (26).
   - src/app/admin/AdminClient.tsx:676: placeholder="Buscar no painel"
   - src/app/admin/AdminClient.tsx:677: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-
   - src/app/contato/ContatoClient.tsx:275: placeholder="Seu nome"
   - src/app/contato/ContatoClient.tsx:276: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-
   - src/app/contato/ContatoClient.tsx:285: placeholder="seu@email.com"
   - src/app/contato/ContatoClient.tsx:287: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-
   - src/app/contato/ContatoClient.tsx:326: placeholder="Ex.: Dúvida sobre acesso premium"
   - src/app/contato/ContatoClient.tsx:327: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-
   - src/app/contato/ContatoClient.tsx:337: placeholder="Descreva sua solicitação com detalhes."
   - src/app/contato/ContatoClient.tsx:338: className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-
   - src/app/historico/HistoricoClient.tsx:264: placeholder="Buscar por título, conteúdo, tipo..."
   - src/app/historico/HistoricoClient.tsx:265: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-
   - src/app/marketplace/MarketplaceClient.tsx:227: placeholder="Buscar material, componente ou tag"
   - src/app/marketplace/MarketplaceClient.tsx:228: className="h-12 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:220: placeholder="Ex.: Atividade de leitura e interpretação"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:221: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:233: placeholder="Explique o objetivo, o uso e o tipo de material."
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:234: className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:262: placeholder="Ex.: 5º ano"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:263: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:313: placeholder="Nome do professor ou escola"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:314: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:334: placeholder="Ex.: leitura, interpretação, produção textual"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:335: className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:349: placeholder="Explique como aplicar o material em sala."
   - src/app/marketplace/novo/NewMarketplaceItemClient.tsx:350: className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"

## Banco de dados / Marketplace
[AVISO] Nenhum SQL Marketplace encontrado em database.
[AVISO] A próxima etapa provavelmente precisará criar tabela e bucket para Marketplace.

## Supabase Probe Marketplace
[OK] Tabela encontrada/acessível: marketplace_materials. Registros aproximados: 0
[AVISO] Nenhum bucket com nome de Marketplace encontrado.
