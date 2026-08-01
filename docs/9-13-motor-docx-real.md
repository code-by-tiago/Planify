# Planify — 9.13 — Motor DOCX Real Server-side

## Objetivo

Substituir downloads técnicos por DOCX real.

## O que foi criado

```text
src/server/docx/simple-docx-builder.ts
src/server/docx/document-normalizer.ts
src/app/api/documentos/docx/route.ts
src/lib/downloads/docx-download-client.ts
scripts/planify/patch-9-13-docx-real.cjs
```

## O que muda

```text
1. /api/documentos/docx gera arquivo .docx real.
2. /materiais baixa DOCX real.
3. /biblioteca baixa DOCX real.
4. /marketplace baixa DOCX real.
5. JSON não aparece mais como download para professor.
6. Não depende de biblioteca externa.
7. Não mexe em login, Stripe, Supabase premium nem webhook.
```

## Observação sobre planejamento oficial

A próxima etapa será o DOCX oficial de planejamento anual/trimestral.

Regra registrada:

```text
Não é necessário manter logotipos nem nome da escola original se ainda estiverem visíveis no modelo.
O importante é preservar as tabelas úteis, remover/substituir textos vermelhos e preencher com conteúdo real do Planify.
```

## Teste

```powershell
cd C:\planify
npm run build
npm run dev
```

Depois abrir:

```text
http://localhost:3000/materiais
http://localhost:3000/biblioteca
http://localhost:3000/marketplace
```

Gerar/selecionar material e clicar em:

```text
Baixar DOCX
```
