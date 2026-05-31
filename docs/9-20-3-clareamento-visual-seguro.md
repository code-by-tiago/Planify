# Planify — 9.20.3 — Clareamento visual seguro

## Objetivo

Clarear o visual do Planify sem alterar nenhuma funcionalidade.

## O que muda

```text
Fundo geral mais claro
Cards mais claros
Cabeçalho mais leve
Textos com contraste melhor
Bordas mais suaves
Sombras mais elegantes
Formulários com fundo claro
Menos azul/preto ultra escuro
```

## Arquivo alterado em runtime

```text
src/app/globals.css
```

A etapa apenas adiciona um bloco CSS final:

```text
PLANIFY_LIGHT_THEME_9_20_3
```

## O que NÃO muda

```text
DOCX oficial
Planejamentos
BNCC
Editor lógico
Biblioteca
Marketplace
Admin
Stripe
Premium Gate
Acesso do proprietário
Rotas
APIs
Banco de dados
```

## Como aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-3-clareamento-visual-seguro.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Como reverter se não gostar

```powershell
cd C:\planify
node scripts\planify\ui\reverter-clareamento-visual-9-20-3.cjs
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Observação

Este é um ajuste visual global. Se alguma página ficar clara demais ou com contraste ruim, a próxima etapa pode fazer pequenos refinamentos por página, ainda sem mexer em lógica.
