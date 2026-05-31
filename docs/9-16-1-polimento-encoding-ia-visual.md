# Planify — 9.16.1 — Polimento de encoding + IA visual

## Objetivo

Corrigir os avisos restantes da auditoria sem mexer no motor principal do Planify.

## Corrige

```text
1. Textos quebrados no MateriaisClient.tsx.
2. Referência visual a "Gemini" em arquivos de interface.
3. Auditoria mostrando emojis quebrados no Windows PowerShell antigo.
4. Auditoria marcando Gemini interno como se fosse problema visual.
```

## Não altera

```text
DOCX oficial
Planejamentos
BNCC
Editor
Biblioteca Admin
Biblioteca do usuário
Stripe
Marketplace
Sessão Admin
Sessão Owner
Premium Gate
```

## Arquivos/scripts criados

```text
scripts/planify/polimento/fix-encoding-ia-visual.cjs
scripts/planify/polimento/patch-auditoria-final-local.cjs
```

## Depois de aplicar

```powershell
cd C:\planify
node scripts\planify\auditoria\auditoria-final-local.cjs
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Observação

Referências internas a Gemini em serviços de IA podem continuar existindo no backend. Isso é correto.

A regra do produto é:

```text
Interface do usuário fala "IA".
Backend pode usar Gemini internamente.
```
