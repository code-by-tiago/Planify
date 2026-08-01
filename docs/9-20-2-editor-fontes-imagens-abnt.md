# Planify — 9.20.2 — Editor fontes, imagens e ABNT

## Objetivo

Unificar em uma etapa completa:

```text
Ajuste de imagem
Fontes
Tamanhos de fonte
Justificação e alinhamento
Espaçamentos
Recuo de primeira linha
Padrão ABNT
Página visual A4
```

## Recursos adicionados

```text
Clique em imagem para selecionar
Imagem 25%, 40%, 50%, 60%, 75%, 100%
Largura personalizada da imagem
Alinhar imagem à esquerda, centro e direita
Flutuar imagem com texto ao redor
Remover imagem
Fontes: Arial, Times New Roman, Calibri, Verdana, Georgia, Cambria, Tahoma
Tamanhos: 10, 11, 12, 14, 16, 18, 24
Espaçamento entre linhas: 1.0, 1.15, 1.5, 2.0
Espaço antes/depois do parágrafo
Recuo de primeira linha
Justificar, alinhar esquerda, centro e direita
Aplicar padrão ABNT no documento
Texto normal ABNT
Título ABNT
Citação ABNT
```

## Padrão ABNT aplicado

```text
Fonte Times New Roman
Tamanho 12pt
Linha 1.5
Texto justificado
Primeira linha 1.25cm
Margens visuais A4: superior 3cm, esquerda 3cm, direita 2cm, inferior 2cm
Citação: fonte 10pt, linha simples, recuo 4cm
```

## Não aplicar a 9.20.1

Esta etapa substitui a 9.20.1.

## O que não foi alterado

```text
DOCX oficial
Planejamentos
BNCC
Biblioteca
Marketplace
Admin
Stripe
Premium Gate
Acesso do proprietário
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
1. Abra /editor.
2. Insira imagem.
3. Clique na imagem e ajuste tamanho.
4. Teste fonte Times New Roman, Arial e Calibri.
5. Teste linha 1.5 e 2.0.
6. Teste justificar texto.
7. Teste aplicar padrão ABNT.
8. Teste baixar Word .doc.
9. Teste imprimir/PDF.
```
