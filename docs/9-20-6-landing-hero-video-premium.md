# Planify — 9.20.6 — Landing premium com hero vídeo

## Objetivo

Transformar a home em uma landing page limpa, dinâmica e profissional, com área de vídeo pedagógico e chamadas claras para as funcionalidades do Planify.

## O que muda

```text
Home pública totalmente redesenhada
Hero grande e profissional
Bloco visual de vídeo pedagógico
Cards de funcionalidades
Fluxo anual → trimestral
Preview do painel/documento
CTA final
Logo Planify mais profissional
Visual claro, sem neon pesado
```

## Vídeo pedagógico

A landing já tem um slot de vídeo:

```text
public/videos/planify-hero.mp4
```

Se esse arquivo existir, o navegador tenta exibir o vídeo.

Se não existir, a página usa fallback visual animado, então não quebra.

## Arquivos alterados

```text
src/app/page.tsx
src/components/PlanifyBrandLogo.tsx
src/app/globals.css
```

## Scripts criados

```text
scripts/planify/ui/aplicar-landing-video-9-20-6.cjs
scripts/planify/ui/auditoria-landing-video-9-20-6.cjs
scripts/planify/ui/reverter-landing-video-9-20-6.cjs
```

## O que não muda

```text
DOCX oficial
Planejamentos
BNCC
Editor funcional
Biblioteca
Marketplace
Admin
Stripe
Premium Gate
Rotas internas
APIs
Banco de dados
Login
Assinaturas
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-6-landing-hero-video-premium.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Testar

```text
/
Home
Login
Planos
Dashboard
Planejamentos
Materiais
Editor
Biblioteca
Marketplace
Admin
```

Confirme que a home ficou mais profissional e que os links continuam abrindo as áreas corretas.
