# Planify — 9.20.8 — Refinamento visual das páginas internas

## Objetivo

Aplicar nas páginas internas o mesmo padrão visual da home principal:

```text
fundo claro
cards brancos
botões limpos
formulários claros
menos azul escuro
páginas mais compactas
visual premium SaaS educacional
```

## Escopo

Esta etapa adiciona apenas uma camada CSS global.

## Arquivos criados

```text
scripts/planify/ui/aplicar-refinamento-paginas-internas-9-20-8.cjs
scripts/planify/ui/auditoria-refinamento-paginas-internas-9-20-8.cjs
scripts/planify/ui/reverter-refinamento-paginas-internas-9-20-8.cjs
docs/9-20-8-refinamento-paginas-internas.md
```

## Arquivo alterado automaticamente

```text
src/app/globals.css
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
.\install-9-20-8-refinamento-paginas-internas.ps1
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
/dashboard
/planejamentos
/materiais
/editor
/biblioteca
/marketplace
/admin
/admin/biblioteca
/login
/planos
/contato
```

## Reverter apenas esta camada

```powershell
cd C:\planify
node scripts\planify\ui\reverter-refinamento-paginas-internas-9-20-8.cjs
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```
