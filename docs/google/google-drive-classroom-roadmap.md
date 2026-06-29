# Planify - Google Drive/Classroom Roadmap

## Estrategia segura

A integracao Google preserva o motor de geracao do Planify: primeiro o material
e gerado no Editor; depois o backend exporta DOCX/PDF, salva no Drive do
professor e publica no Classroom somente apos confirmacao.

## Fluxo atual

```text
1. OAuth Google com state assinado
2. Tokens salvos no backend
3. DOCX/PDF gerado pelo pipeline existente
4. Arquivo salvo no Google Drive
5. Turmas reais listadas pela Classroom API
6. Professor seleciona uma ou varias turmas
7. Backend publica material/atividade via Classroom API
8. Download DOCX/PDF permanece como fallback
```

## Variaveis

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_DRIVE_FOLDER_ID
GOOGLE_OAUTH_STATE_SECRET
```

## Principio importante

Nunca mexer no motor de geracao DOCX/PDF para integrar Google. O Classroom
consome o arquivo pronto e anexado pelo Drive.
