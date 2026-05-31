# Planify — 9.20.4 — Identidade visual premium

## Objetivo

Aplicar uma identidade visual mais clara, moderna e profissional ao Planify, inspirada em padrões de SaaS educacional premium, sem alterar funcionalidades.

## O que muda

```text
Visual mais claro
Cards mais limpos
Cabeçalho mais leve
Botões mais modernos
Paleta azul/ciano/teal/lavanda
Logo Planify original em SVG/React
Melhor contraste e leitura
```

## Arquivos criados/alterados

```text
src/components/PlanifyBrandLogo.tsx
src/app/globals.css
scripts/planify/ui/aplicar-identidade-visual-9-20-4.cjs
scripts/planify/ui/auditoria-identidade-visual-9-20-4.cjs
scripts/planify/ui/reverter-identidade-visual-9-20-4.cjs
```

## Segurança

Esta etapa não altera:

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
Acesso do proprietário
Rotas
APIs
Banco de dados
```

## Observação sobre o logo

A etapa tenta aplicar o `PlanifyBrandLogo` automaticamente no cabeçalho se encontrar um bloco seguro com:

```text
Planify
SaaS educacional premium
```

Se não encontrar, ela não força alteração arriscada. Mesmo assim, o CSS melhora o logo existente.

## Como aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-4-identidade-visual-premium.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Reverter camada visual

```powershell
cd C:\planify
node scripts\planify\ui\reverter-identidade-visual-9-20-4.cjs
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Teste visual

```text
1. Home
2. Login
3. Dashboard
4. Planejamentos
5. Materiais
6. Editor
7. Biblioteca
8. Marketplace
9. Admin
10. Planos
```

Confirme que está mais claro e que todos os botões continuam funcionando.
