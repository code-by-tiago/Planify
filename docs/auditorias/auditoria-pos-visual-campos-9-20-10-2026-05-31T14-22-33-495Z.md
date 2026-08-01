# Planify — Auditoria 9.20.10 — Pós-visual e campos inteligentes

Data: 31/05/2026, 11:22:33

[AVISO] Sem falhas críticas, mas com 2 aviso(s) para revisar.


## Arquivos principais
[OK] src/app/page.tsx encontrado.
[OK] src/app/globals.css encontrado.
[OK] src/app/layout.tsx encontrado.
[OK] src/components/PlanifyBrandLogo.tsx encontrado.
[OK] src/components/PlanifyFieldEnhancer.tsx encontrado.

## Home e identidade visual
[OK] Home compacta permanece aplicada.
[OK] Home contém links separados para Biblioteca e Marketplace.
[OK] Camada da landing premium 9.20.6 presente.
[OK] Camada de compactação 9.20.7 presente.
[OK] Camada de refinamento interno 9.20.8 presente.
[OK] CSS dos campos inteligentes 9.20.9 presente.

## Campos inteligentes
[OK] PlanifyFieldEnhancer está montado no layout.
[OK] Token do enhancer encontrado: STAGE_INFANTIL
[OK] Token do enhancer encontrado: STAGE_FUNDAMENTAL
[OK] Token do enhancer encontrado: STAGE_MEDIO
[OK] Token do enhancer encontrado: Linguagens e suas Tecnologias
[OK] Token do enhancer encontrado: Matem\u00e1tica
[OK] Token do enhancer encontrado: getOptionsForKind
[OK] Token do enhancer encontrado: openMenu
[OK] Token do enhancer encontrado: KeyboardEvent
[OK] Sem encoding corrompido no enhancer: MatemÃ
[OK] Sem encoding corrompido no enhancer: LÃ
[OK] Sem encoding corrompido no enhancer: EducaÃ
[OK] Sem encoding corrompido no enhancer: CiÃ
[OK] Sem encoding corrompido no enhancer: HistÃ
[OK] Sem encoding corrompido no enhancer: SÃ
[OK] Sem encoding corrompido no enhancer: InformaÃ

## Textos profissionais
[OK] Texto técnico/provisório ausente: Checkout criado no servidor
[OK] Texto técnico/provisório ausente: A chave secreta do Stripe
[OK] Texto técnico/provisório ausente: cadastrados pelo administrador
[OK] Texto técnico/provisório ausente: publicados pelo admin
[OK] Texto técnico/provisório ausente: sem materiais fictícios
[OK] Nenhum mojibake comum encontrado em src/app.

## Rotas principais
[OK] Rota existe: src/app/planejamentos/page.tsx
[OK] Rota existe: src/app/materiais/page.tsx
[OK] Rota existe: src/app/editor/page.tsx
[OK] Rota existe: src/app/biblioteca/page.tsx
[OK] Rota existe: src/app/marketplace/page.tsx
[OK] Rota existe: src/app/admin/page.tsx
[OK] Rota existe: src/app/admin/biblioteca/page.tsx
[OK] Rota existe: src/app/planos/page.tsx
[OK] Rota existe: src/app/login/page.tsx
[OK] Rota existe: src/app/contato/page.tsx

## Áreas sensíveis preservadas
[AVISO] Arquivo sensível não encontrado no caminho esperado: src/app/api/planejamentos/gerar/route.ts
[OK] Arquivo sensível preservado: src/app/api/planejamentos/docx-pacote/route.ts
[OK] Arquivo sensível preservado: src/app/api/stripe/checkout/route.ts
[OK] Arquivo sensível preservado: src/app/api/stripe/webhook/route.ts
[OK] Arquivo sensível preservado: src/app/api/biblioteca/materiais/route.ts
[OK] Arquivo sensível preservado: src/app/api/marketplace/materiais/route.ts

## Git status
[OK] git version 2.54.0.windows.1
[AVISO] Há arquivos modificados/novos aguardando commit.
```text
M .gitignore
 D AGENTS.md
 D CLAUDE.md
 D README.md
 D eslint.config.mjs
 D next.config.ts
 M package-lock.json
 M package.json
 M postcss.config.mjs
 D public/file.svg
 D public/globe.svg
 D public/next.svg
 D public/vercel.svg
 D public/window.svg
 D src/app/favicon.ico
 M src/app/globals.css
 M src/app/layout.tsx
 M src/app/page.tsx
 M tsconfig.json
?? data/
?? database/
?? docs/
?? middleware.ts
?? next-env.d.ts
?? next.config.mjs
?? package-lock.json.bak-9-17-1-20260531-070317
?? package.json.bak-9-17-1-20260531-070317
?? public/videos/
?? scripts/
?? src/app/acesso-negado/
?? src/app/admin/
?? src/app/api/
?? src/app/biblioteca/
?? src/app/contato/
?? src/app/dashboard/
?? src/app/editor/
?? src/app/globals.css.bak-9-20-3-2026-05-31T11-29-47-326Z
?? src/app/globals.css.bak-9-20-4-2026-05-31T11-50-47-372Z
?? src/app/globals.css.bak-9-20-5-2026-05-31T11-59-35-710Z
?? src/app/globals.css.bak-9-20-6-2026-05-31T13-18-00-108Z
?? src/app/globals.css.bak-9-20-7-2026-05-31T13-44-32-374Z
?? src/app/globals.css.bak-9-20-8-2026-05-31T13-54-53-721Z
?? src/app/globals.css.bak-9-20-9-2026-05-31T14-09-18-545Z
?? src/app/historico/
?? src/app/layout.tsx.bak-9-20-9-2026-05-31T14-09-18-556Z
?? src/app/login/
?? src/app/logout/
?? src/app/marketplace/
?? src/app/materiais/
?? src/app/not-found.tsx
?? src/app/page.tsx.bak-9-16-1
?? src/app/page.tsx.bak-9-20-6
?? src/app/page.tsx.bak-9-20-7
?? src/app/page.tsx.bak-9-20-9
?? src/app/planejamentos/
?? src/app/planos/
?? src/app/sair/
?? src/components/
?? src/config/
?? src/data/
?? src/lib/
?? src/middleware.ts
?? src/server/
?? src/types/
?? supabase/
?? tailwind.config.ts
?? tmp/
```

## Checklist manual recomendado
- Abrir `/` e confirmar Home compacta.
- Abrir `/planos` e confirmar ausência de texto técnico.
- Abrir `/planejamentos` e clicar em Etapa, Ano/Série, Área e Componente.
- Abrir `/materiais` e clicar em Etapa, Ano/Série, Componente e Tipo de material.
- Abrir `/biblioteca` e confirmar texto profissional e materiais reais.
- Abrir `/marketplace` e confirmar página própria.
- Gerar um planejamento simples e baixar DOCX.
- Abrir o documento no Editor e confirmar edição.
- Testar login admin e usuário premium.
