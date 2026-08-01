# Planify — 9.20.5 — Interface clean SaaS educacional

## Objetivo

Substituir o visual anterior por uma interface mais limpa, clara e profissional, inspirada em padrões modernos de SaaS educacional.

A referência visual foi usada apenas como direção de clareza e organização. Não copiamos identidade, logo, layout ou marca de terceiros.

## O que muda

```text
Remove camada visual 9.20.3, se existir
Remove camada visual 9.20.4, se existir
Aplica fundo claro
Cards brancos
Sombras leves
Header limpo
Botões suaves
Formulários claros
Logo Planify discreto
Menos neon
Menos fundo azul/preto pesado
```

## Arquivos envolvidos

```text
src/app/globals.css
src/components/PlanifyBrandLogo.tsx
scripts/planify/ui/aplicar-interface-clean-9-20-5.cjs
scripts/planify/ui/auditoria-interface-clean-9-20-5.cjs
scripts/planify/ui/reverter-interface-clean-9-20-5.cjs
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
Rotas
APIs
Banco de dados
Lógica de login
Lógica de assinatura
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-5-interface-clean-saas-educacional.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Reverter só esta camada

```powershell
cd C:\planify
node scripts\planify\ui\reverter-interface-clean-9-20-5.cjs
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Testar visual

```text
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
Contato
```

Confirme se ficou mais limpo e profissional.
