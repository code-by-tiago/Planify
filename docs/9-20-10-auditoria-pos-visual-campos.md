# Planify — 9.20.10 — Auditoria pós-visual e campos inteligentes

## Objetivo

Validar a estabilidade do projeto depois das etapas visuais e dos campos inteligentes.

## Esta etapa não altera funcionalidades

Ela apenas cria e executa auditoria local.

## O que verifica

```text
Home compacta
Biblioteca e Marketplace separados
CSS visual aplicado
PlanifyFieldEnhancer montado no layout
Ausência de encoding corrompido no enhancer
Textos técnicos removidos de /planos
Textos pouco profissionais removidos da Biblioteca
Rotas principais existentes
Arquivos sensíveis preservados
Git status
```

## Arquivo criado

```text
scripts/planify/ui/auditoria-pos-visual-campos-9-20-10.cjs
```

## Relatório gerado

```text
docs/auditorias/auditoria-pos-visual-campos-9-20-10-*.md
```

## Aplicar

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-9-20-10-auditoria-pos-visual-campos.ps1
```

Depois:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Checklist manual

```text
/
/planos
/planejamentos
/materiais
/editor
/biblioteca
/marketplace
/admin
/admin/biblioteca
/login
```

Se auditoria e build passarem, a próxima etapa recomendada é preparação segura para GitHub.
