# Planify — BNCC Oficial

## Pastas

Arquivos oficiais originais:

```text
data/bncc/original
```

JSON processado usado pelo sistema:

```text
data/bncc/processado/bncc-habilidades.json
```

## Regra principal

O Planify não inventa habilidades BNCC.

A API `/api/bncc/sugerir` lê somente o arquivo:

```text
data/bncc/processado/bncc-habilidades.json
```

Se esse arquivo não existir, a API retorna array vazio e a mensagem:

```text
Nenhuma base BNCC oficial foi instalada ainda. Coloque o arquivo processado em data/bncc/processado/bncc-habilidades.json.
```

## Formato esperado do JSON

O arquivo pode ser um array direto:

```json
[
  {
    "codigo": "EF15LP01",
    "descricao": "Texto oficial da habilidade...",
    "etapa": "ensino_fundamental",
    "ano": "1º ano",
    "componente": "Língua Portuguesa"
  }
]
```

Também aceita variações comuns de campos:

```text
codigo | code
descricao | description
etapa | educationStage
ano | grade
serie | série
componente | subject
areaConhecimento | knowledgeArea
unidadeTematica | thematicUnit
objetoConhecimento | knowledgeObject
```

## Ensino Fundamental e Ensino Médio

O serviço reconhece códigos:

```text
EF...
EM...
```

## Limite de retorno

A busca retorna no máximo 3 habilidades por conteúdo informado.
