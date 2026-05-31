# Planify — 9.16.0 — Auditoria Final Local

## Objetivo

Verificar o estado do projeto antes dos próximos ajustes grandes:

```text
Stripe
Marketplace
Editor estilo Word
Checklist pré-GitHub
Checklist pré-deploy
```

## O que esta etapa faz

Cria um script de auditoria local:

```text
scripts/planify/auditoria/auditoria-final-local.cjs
```

Esse script verifica:

```text
.env.local
rotas premium
rotas admin
Biblioteca Admin
Biblioteca do usuário
sessão de proprietário
Stripe/subscriptions
DOCX/modelos oficiais
Editor
Marketplace
encoding quebrado
referência visual a Gemini no frontend
```

## O que esta etapa NÃO faz

```text
Não altera DOCX
Não altera Planejamentos
Não altera Editor
Não altera BNCC
Não altera Stripe
Não altera Biblioteca
Não altera Marketplace
Não altera Supabase
```

## Como rodar

```powershell
cd C:\planify
node scripts\planify\auditoria\auditoria-final-local.cjs
```

O relatório será salvo em:

```text
docs/auditorias/
```

## Depois da auditoria

Rode:

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

## Próximas decisões

Com o relatório em mãos, seguimos para:

```text
1. Corrigir avisos/falhas se aparecerem.
2. Revisar Stripe/assinatura.
3. Revisar Marketplace.
4. Melhorar Editor estilo Word.
5. Checklist final GitHub.
6. Deploy web.
```
