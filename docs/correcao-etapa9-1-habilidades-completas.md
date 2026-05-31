# Correção Etapa 9.1 — Habilidades completas no planejamento

## Regra definitiva

No planejamento real, principalmente na tabela oficial, a habilidade deve aparecer com:

```text
CÓDIGO — DESCRIÇÃO OFICIAL
```

Exemplo:

```text
EF15LP01 — Identificar a função social de textos que circulam em campos da vida social dos quais participa cotidianamente.
```

## Como o backend passa a trabalhar

```text
habilidadesBnccCodigos = uso interno e validação de segurança
habilidadesBncc = uso na tela, editor e DOCX com código + descrição oficial
```

## Segurança

A Gemini não inventa descrição.

A Gemini retorna apenas códigos.

O backend cruza os códigos com as habilidades oficiais selecionadas pelo professor e monta a descrição final a partir da fonte oficial já selecionada.
