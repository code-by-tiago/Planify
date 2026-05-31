# Planify — 9.14.11.1 — Hotfix seguro

## Correção

Corrige o erro de build:

```text
Cannot find name 'expandAnnualItemsToTemplateRows'
```

## O que foi feito

A função que completa as linhas do trimestre anual foi adicionada ao motor DOCX.

Ela mantém:

```text
1 a 10
11 a 20
21 a 30
31 a 40
```

Quando a IA envia poucos conteúdos para um trimestre, o motor completa as linhas faltantes usando desdobramentos pedagógicos do próprio conteúdo.

## O que não foi alterado

```text
Login
Stripe
Supabase
Marketplace
Biblioteca
Modelos oficiais DOCX
Fluxo BNCC
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```
