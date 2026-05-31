# Planify — Google Drive/Classroom Roadmap

## Estrategia segura

A integracao com Google deve ser feita em etapa propria, depois do GitHub seguro.

## Ordem recomendada

```text
1. OAuth Google
2. Salvar tokens no servidor
3. Exportar DOCX ja gerado para Google Drive
4. Confirmar link do arquivo
5. Depois integrar Classroom
6. Manter baixar DOCX como fallback
```

## Variaveis previstas

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_DRIVE_FOLDER_ID
```

## Principio importante

Nunca mexer no motor de geracao DOCX para integrar Google.

Fluxo correto:

```text
Gerar DOCX certo primeiro
Depois exportar o arquivo pronto
Depois compartilhar/publicar
```
