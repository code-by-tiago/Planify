# Planify — 9.15.15.2 — Hotfix Premium Guard Suspense

## Erro corrigido

O build falhava com:

```text
useSearchParams() should be wrapped in a suspense boundary at page "/404"
Error occurred prerendering page "/_not-found"
```

## Causa

O componente:

```text
src/components/PremiumRouteGuard.tsx
```

usava:

```text
useSearchParams()
```

Como esse componente fica dentro do `PageShell`, o Next tentou pré-renderizar também a página 404 e exigiu boundary de Suspense.

## Correção

Removido:

```text
useSearchParams()
```

Agora o guard usa:

```text
window.location.pathname
window.location.search
```

apenas no navegador, dentro do efeito client-side.

## O que continua funcionando

```text
/dashboard
/planejamentos
/materiais
/editor
/historico
/biblioteca
/marketplace
```

continuam protegidas por login premium.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Admin
Biblioteca Admin
Stripe
Marketplace
Downloads anual/trimestral
```
