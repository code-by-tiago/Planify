# Planify — Checklist de testes (professor)

Use após deploy + migrations Supabase. **Plataforma só para professores** — alunos não fazem login no Planify.

## Pré-requisitos

- [ ] Vercel em produção com commit `8dce162` ou mais recente
- [ ] Migrations docentes aplicadas no Supabase (`teaching_context`, `teacher_referrals`)
- [ ] `GEMINI_API_KEY` com billing ativo (geração IA)

## Fluxos core (15–30 min)

| # | Fluxo | O que validar |
|---|--------|----------------|
| 1 | Login / cadastro | Email, recuperação senha, redirect dashboard |
| 2 | **Minha turma** | Chip pré-preenche série/disciplina; persiste após gerar material |
| 3 | Lista 10 itens | Gera em &lt; 90s; BNCC autocomplete; ExportDock visível (mobile 390px) |
| 4 | Export DOCX | Abre no Word sem layout quebrado |
| 5 | **Publicar na turma** | Google Classroom (OAuth) |
| 6 | **WhatsApp** | Copiar/abrir wa.me com resumo |
| 7 | **Publicar na comunidade** | Botão fuchsia no ExportDock |
| 8 | Planejamento trimestral | Download DOCX oficial |
| 9 | Correção lote | 2+ respostas → relatório turma (copiar/txt/imprimir) |
| 10 | Histórico | **Gerar de novo** pré-preenche formulário |
| 11 | **Indique um colega** | Link `/cadastro?ref=…` no dashboard |
| 12 | `/status` | Página pública + link no footer |
| 13 | Offline | Gerar material → modo avião → banner último material |

## Ops (manual)

| Item | Como |
|------|------|
| Stripe | Checkout teste → premium liberado |
| Gemini 429 | Mensagem acionável + link `/status` |
| Rollback | Vercel → promote deployment anterior |

## Comandos locais (regressão)

```bash
npm run verify:gate-launch
npm run verify:go-live
npm run test:e2e
```
