# Planify — 9.14.13 — Matriz anual + downloads

## Objetivo

Garantir a regra obrigatória:

```text
O professor gera o planejamento anual primeiro.
Os trimestrais são gerados a partir da matriz anual.
```

## Novos botões

Quando o planejamento anual é gerado com IA, aparece a seção:

```text
Matriz anual aprovada
```

Com botões:

```text
Anual DOCX
1º Trimestre
2º Trimestre
3º Trimestre
Pacote ZIP
```

## Regras preservadas

```text
- Não refaz busca BNCC para trimestral.
- Usa a mesma matriz anual.
- Usa os mesmos conteúdos.
- Usa as mesmas habilidades BNCC.
- Não muda o motor DOCX que já foi validado.
- Não altera Editor, Login, Stripe, Supabase, Biblioteca ou Marketplace.
```

## Nova rota

```text
/api/planejamentos/docx-pacote
```

Ela gera um ZIP com:

```text
planejamento-anual.docx
planejamento-trimestral-1.docx
planejamento-trimestral-2.docx
planejamento-trimestral-3.docx
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

```text
1. Abrir /planejamentos
2. Gerar planejamento anual
3. Sugerir BNCC
4. Gerar planejamento com IA
5. Baixar Anual DOCX
6. Baixar cada trimestre
7. Baixar Pacote ZIP
8. Confirmar que trimestrais seguem o anual
```
