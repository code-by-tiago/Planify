# Planify — Auditoria release final 9.21.0

Data: 31/05/2026, 11:57:17

[AVISO] Sem falhas criticas, mas com 2 aviso(s).


## Package and build scripts
[OK] package.json has build script.
[OK] package.json has dev script.
[OK] Next.js dependency found.
[OK] Supabase dependency found.
[OK] Stripe dependency found.

## Routes
[OK] Route exists: src/app/page.tsx
[OK] Route exists: src/app/planos/page.tsx
[OK] Route exists: src/app/login/page.tsx
[OK] Route exists: src/app/dashboard/page.tsx
[OK] Route exists: src/app/planejamentos/page.tsx
[OK] Route exists: src/app/materiais/page.tsx
[OK] Route exists: src/app/editor/page.tsx
[OK] Route exists: src/app/biblioteca/page.tsx
[OK] Route exists: src/app/marketplace/page.tsx
[OK] Route exists: src/app/admin/page.tsx
[OK] Route exists: src/app/admin/biblioteca/page.tsx
[OK] Route exists: src/app/contato/page.tsx

## Sensitive server routes
[AVISO] Sensitive route not found at expected path: src/app/api/planejamentos/gerar/route.ts
[OK] Sensitive route found: src/app/api/planejamentos/docx-pacote/route.ts
[OK] Sensitive route found: src/app/api/stripe/checkout/route.ts
[OK] Sensitive route found: src/app/api/stripe/webhook/route.ts
[OK] Sensitive route found: src/app/api/access/status/route.ts
[OK] Sensitive route found: src/app/api/biblioteca/materiais/route.ts
[OK] Sensitive route found: src/app/api/marketplace/materiais/route.ts

## Env example
[OK] .env.example includes NEXT_PUBLIC_SUPABASE_URL
[OK] .env.example includes NEXT_PUBLIC_SUPABASE_ANON_KEY
[OK] .env.example includes SUPABASE_SERVICE_ROLE_KEY
[OK] .env.example includes GEMINI_API_KEY
[OK] .env.example includes NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
[OK] .env.example includes STRIPE_SECRET_KEY
[OK] .env.example includes STRIPE_WEBHOOK_SECRET
[OK] .env.example includes STRIPE_PRICE_PRO_MONTHLY
[OK] .env.example includes STRIPE_PRICE_PRO_YEARLY
[OK] .env.example includes PLANIFY_ADMIN_EMAIL
[OK] .env.example includes NEXT_PUBLIC_ADMIN_EMAIL
[OK] .env.example includes GOOGLE_CLIENT_ID
[OK] .env.example includes GOOGLE_CLIENT_SECRET
[OK] .env.example includes GOOGLE_REDIRECT_URI

## Large files warning
[OK] No local files above 25MB found outside ignored folders.

## Git status
[OK] git version 2.54.0.windows.1
[AVISO] There are changed/new files pending commit.
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
?? .env.example
?? .gitignore.planify-safe-template
?? data/
?? database/
?? docs/
?? middleware.ts
?? next-env.d.ts
?? next.config.mjs
?? public/videos/
?? scripts/
?? src/app/acesso-negado/
?? src/app/admin/
?? src/app/api/
?? src/app/biblioteca/
?? src/app/contato/
?? src/app/dashboard/
?? src/app/editor/
?? src/app/historico/
?? src/app/login/
?? src/app/logout/
?? src/app/marketplace/
?? src/app/materiais/
?? src/app/not-found.tsx
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

## Manual final checklist
- Open / and check final landing texts.
- Open /planos and confirm no technical Stripe text is visible.
- Open /planejamentos and test smart fields.
- Generate one simple annual planning DOCX.
- Open generated content in Editor.
- Open /biblioteca and download a real material.
- Open /marketplace and confirm listing/upload flow.
- Open /admin and /admin/biblioteca with owner account.
- Confirm .env.local is NOT committed.
- Configure production environment variables in deploy provider.
