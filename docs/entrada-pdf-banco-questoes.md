# Extrator de PDFs de Provas

PoC para transformar PDFs de vestibulares/provas de admissao em questoes estruturadas para o Banco de Questoes.

## Dataset importado

Os PDFs do desafio Teachy foram copiados para:

`data/teachy-ai-challenge/entrance-exams`

Origem fixa:

`TeachyEducation/teachy-ai-challenge@f36669f944c705a101c4699b07e13e6088c6d0ed/entrance-exams`

## Uso no site

No Banco de Questoes, abra `Adicionar questoes proprias` e escolha `Importar PDF de prova`.

O fluxo aceita um ou mais PDFs, detecta layout em uma ou duas colunas, extrai enunciado, alternativas, texto de apoio e imagens quando o PDF expoe objetos de imagem.

## Uso local

```bash
npm run extract:entrance-exams -- --input data/teachy-ai-challenge/entrance-exams --output tmp/entrance-exam-extraction --columns auto
```

Saidas:

- `questions.json`: questoes consolidadas no formato do desafio.
- `<pdf>.questions.json`: questoes e relatorio por PDF.
- `report.json`: resumo de paginas, linhas, questoes e imagens.
- `assets/`: imagens extraidas.

## Verificacao

Smoke local do extractor:

```bash
npm run verify:question-pdf-extractor
```

Smoke local + Supabase, validando a coluna `image_urls` e upload no bucket:

```bash
npm run verify:question-pdf-extractor -- --supabase
```

## Configuracao opcional

Passe `--config caminho/config.json`. O arquivo pode ser uma configuracao unica ou um mapa por PDF.

```json
{
  "enem.pdf": {
    "columns": 2,
    "questionPattern": "^(?:QUESTAO\\s*)?(\\d{1,3})\\b",
    "alternativePattern": "^\\(?([A-E])\\)\\s+(.+)$",
    "supportTextMarkers": ["Texto para as questoes", "Leia o texto"]
  }
}
```

## Imagens em producao

Em desenvolvimento, as imagens extraidas sao gravadas em:

`public/question-extract-assets`

Em producao/Vercel, configure:

```bash
QUESTION_EXTRACT_STORAGE_BUCKET=question-extract-assets
```

O bucket e criado pela migration `20260702131000_question_extract_assets_bucket.sql`, e as URLs ficam persistidas na coluna `question_bank_items.image_urls`.

## Limites conhecidos

- PDFs escaneados sem camada textual precisam de OCR.
- Equacoes e formulas sao preservadas conforme o texto do PDF permite; Math OCR fica para uma camada posterior.
- A qualidade da segmentacao depende do padrao de numeracao e alternativas; use `--config` para provas com formato muito especifico.
