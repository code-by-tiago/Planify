# Planify — 9.14.4 — Diagnóstico + IA + DOCX cirúrgico

## Problema corrigido

O botão estava baixando o DOCX instantaneamente, sem uma etapa real de geração da matriz pedagógica com IA.

Além disso, o documento ficava com texto estreito/vertical porque o motor tentava reutilizar propriedades de tabela do modelo de forma inadequada.

## Novo fluxo

```text
1. Sugerir BNCC
2. Gerar planejamento com IA
3. Baixar DOCX oficial
```

## Arquivos alterados

```text
src/server/planejamentos/planning-ai-service.ts
src/server/planejamentos/official-planning-docx.ts
src/app/api/planejamentos/gerar-ia/route.ts
src/app/planejamentos/PlanejamentosClient.tsx
scripts/planify/planejamentos/diagnosticar-modelos-oficiais.cjs
```

## Diagnóstico dos modelos

O instalador gera:

```text
C:\planify\tmp\diagnostico-modelos-oficiais.md
```

Esse arquivo mostra:

```text
- quantidade de tabelas
- quantidade de linhas
- quantidade de células
- textos das primeiras linhas/células
- headers, footers e imagens
```

## Regra importante

O DOCX oficial só baixa depois de gerar a matriz pedagógica.

Se tentar baixar antes, aparece erro claro:

```text
Gere o planejamento com IA antes de baixar o DOCX oficial.
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```
