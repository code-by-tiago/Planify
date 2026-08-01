# Planify — 9.15.6 — Botão Voltar global

## Objetivo

Adicionar um botão **Voltar** nas páginas internas para o usuário não depender da seta do navegador.

## O que foi feito

```text
src/components/BackButton.tsx
scripts/planify/ui/instalar-botao-voltar-global.cjs
```

O script insere o botão no `PageShell`.

## Comportamento

```text
Página inicial /
→ não mostra Voltar

Páginas internas
→ mostra Voltar

Se houver histórico
→ router.back()

Se não houver histórico
→ /dashboard
```

## Por que no PageShell?

Porque o `PageShell` é a estrutura visual compartilhada pelas páginas principais do Planify. Assim o botão aparece de forma consistente.

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Abra /dashboard
2. Abra /planejamentos
3. Clique em Voltar
4. Abra /admin/biblioteca
5. Clique em Voltar
6. Abra /biblioteca
7. Clique em Voltar
```

## O que não foi alterado

```text
DOCX oficial
Editor
Planejamentos
BNCC
Stripe
Marketplace
Biblioteca
Admin
Downloads anual/trimestral
```
