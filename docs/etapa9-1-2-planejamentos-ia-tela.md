# Planify — Etapa 9.1.2 — Planejamentos com Gemini na tela

## O que foi feito

```text
/planejamentos agora chama:
POST /api/bncc/sugerir
POST /api/ai/planejamento
```

## Fluxo

```text
1. Professor preenche dados.
2. Clica em Sugerir habilidades BNCC.
3. Sistema mostra até 3 habilidades oficiais.
4. Professor seleciona manualmente.
5. Professor clica em Gerar planejamento com IA.
6. Gemini gera o planejamento.
7. Backend garante que as habilidades da tabela venham com código + descrição oficial.
```

## Regra BNCC

```text
A Gemini não inventa habilidade.
A Gemini trabalha com códigos.
O backend monta código + descrição oficial.
```

## Ainda não faz

```text
Não gera DOCX.
Não salva no Supabase.
Não envia para editor automaticamente.
```
