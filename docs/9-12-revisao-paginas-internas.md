# Planify — 9.12 — Revisão Profissional das Páginas Internas

## Objetivo

Corrigir textos quebrados por encoding e deixar Biblioteca, Marketplace e Materiais com funcionamento local validável.

## Arquivos alterados

```text
src/app/materiais/MateriaisClient.tsx
src/app/biblioteca/BibliotecaClient.tsx
src/app/marketplace/MarketplaceClient.tsx
src/app/marketplace/novo/NewMarketplaceItemClient.tsx
scripts/planify/fix-encoding-mojibake.cjs
```

## O que mudou

```text
1. /materiais com textos corrigidos, fluxo profissional e geração com fallback estruturado.
2. /biblioteca com busca, filtros, visualização, download e abrir no editor.
3. /marketplace com busca, filtros, salvar material, download e itens locais.
4. /marketplace/novo com formulário, tags, anexo nominal, prévia e publicação local.
5. Script global para corrigir mojibake comum em arquivos .ts/.tsx.
```

## Teste

```powershell
cd C:\planify
npm run build
npm run dev
```

Abrir:

```text
http://localhost:3000/materiais
http://localhost:3000/biblioteca
http://localhost:3000/marketplace
http://localhost:3000/marketplace/novo
```
