# Planify — 9.14 — Planejamento DOCX oficial

## Objetivo

Criar o motor server-side para gerar planejamento anual e trimestral em `.docx` real, com estrutura pedagógica sólida.

## Rotas criadas

```text
/api/planejamentos/docx-oficial
/api/planejamentos/gerar-docx
/api/planejamentos/docx
```

Todas aceitam `POST` com os dados do planejamento e retornam `.docx`.

## Arquivos criados

```text
src/server/planejamentos/official-planning-docx.ts
src/server/planejamentos/official-planning-route.ts
src/app/api/planejamentos/docx-oficial/route.ts
src/app/api/planejamentos/gerar-docx/route.ts
src/app/api/planejamentos/docx/route.ts
src/lib/planejamentos/download-planejamento-oficial.ts
scripts/planify/planejamentos/testar-planejamento-docx-oficial.cjs
```

## Regras implementadas

```text
1. Planejamento anual com matriz anual.
2. Planejamento trimestral com uma tabela por conteúdo.
3. Um conteúdo específico por linha/seção.
4. Até 3 habilidades BNCC por conteúdo.
5. Habilidades aparecem com código + descrição.
6. Aulas progridem conforme os conteúdos.
7. Textos vermelhos/placeholders não aparecem.
8. Logotipo e nome de escola antiga não são preservados.
9. Se houver habilidades selecionadas, elas são priorizadas.
10. Se não houver, o sistema tenta buscar no JSON local da BNCC.
```

## Teste manual

Primeiro rode:

```powershell
cd C:\planify
npm run dev
```

Em outro terminal:

```powershell
cd C:\planify
node scripts\planify\planejamentos\testar-planejamento-docx-oficial.cjs
```

Arquivos esperados:

```text
tmp/planejamento-anual-oficial.docx
tmp/planejamento-trimestral-oficial.docx
```

Abra no Word e confira:

```text
- conteúdo legível
- tabelas preenchidas
- habilidades com código + descrição
- sem JSON
- sem texto vermelho de orientação
- sem escola antiga do modelo
```
