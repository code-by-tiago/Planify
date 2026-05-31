# Planify — 9.14.6 — Preenchimento fiel do template

## Objetivo

Parar de criar documento/tabela própria e passar a preencher o DOCX oficial existente.

## O que muda

```text
- O motor abre o modelo-anual.docx ou modelo-trimestral.docx.
- Preserva o document.xml original.
- Preserva tabelas, larguras, bordas e estrutura do modelo.
- Substitui somente conteúdos de células.
- No anual, identifica a tabela principal e clona a linha do próprio modelo.
- No trimestral, identifica a tabela principal e repete a própria tabela do modelo por conteúdo.
```

## Arquivo principal alterado

```text
src/server/planejamentos/official-planning-docx.ts
```

## Modelos obrigatórios

```text
C:\planify\data\modelos-oficiais\modelo-anual.docx
C:\planify\data\modelos-oficiais\modelo-trimestral.docx
```

## Diagnóstico gerado

```text
C:\planify\tmp\diagnostico-preenchimento-template.md
```

## Depois de aplicar

```powershell
cd C:\planify
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
npm run dev
```

## Teste

Na tela `/planejamentos`:

```text
1. Sugerir BNCC
2. Gerar planejamento com IA
3. Baixar DOCX oficial
```
