# Planify — 9.20.0 — Editor estilo Word avançado

## Objetivo

Evoluir o Editor para uma ferramenta visual rica, sem quebrar o motor DOCX oficial.

## Recursos adicionados

```text
Negrito
Itálico
Sublinhado
Riscado
Títulos
Parágrafo
Listas
Alinhamento
Cor do texto
Cor de fundo
Inserir tabela
Inserir imagem
Linha/divisor
Quebra de página
Limpar formatação
Salvar versão
Carregar versões salvas
Imprimir/exportar PDF pelo navegador
Baixar HTML
Baixar arquivo Word compatível .doc
Copiar HTML
```

## Preservação

O editor lê os conteúdos já usados pelo Planify:

```text
planify_editor_document
planify_editor_content
```

Assim, quando Planejamentos, Biblioteca ou Marketplace enviarem algo para o Editor, ele abre o conteúdo.

## Importante

Esta etapa não altera:

```text
Geração DOCX oficial
Modelos oficiais
Planejamentos
BNCC
Biblioteca Admin
Biblioteca do usuário
Marketplace
Admin
Stripe
Premium Gate
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
2. Teste negrito, itálico, títulos e listas.
3. Insira uma tabela.
4. Insira uma imagem.
5. Salve uma versão.
6. Baixe Word .doc.
7. Teste Imprimir/PDF.
8. Gere um planejamento e abra no Editor.
9. Confirme que o conteúdo vindo do planejamento continua abrindo.
```

## Observação

O botão "Baixar Word .doc" gera um arquivo Word compatível baseado em HTML.

O DOCX oficial dos planejamentos continua sendo gerado pelo motor próprio do Planify, sem alteração nesta etapa.
