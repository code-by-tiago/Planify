# Planify — 9.14.1 — BNCC por Conteúdo

## Objetivo

Garantir que a sugestão de habilidades BNCC use a caixa `Conteúdos` como fonte principal.

## Regra

```text
Conteúdos + etapa + ano/série + área/componente = suficientes para sugerir habilidades BNCC.
```

Não depender de:

```text
Objetivos
Observações
```

## Arquivos criados

```text
src/server/bncc/bncc-suggestion-engine.ts
src/app/api/bncc/sugerir/route.ts
src/app/api/planejamentos/habilidades/route.ts
scripts/planify/patch-9-14-1-bncc-conteudos.cjs
scripts/planify/planejamentos/testar-bncc-por-conteudo.cjs
```

## Como funciona

```text
1. Lê os conteúdos digitados pelo professor.
2. Separa um conteúdo por linha.
3. Busca habilidades no JSON local em data/bncc.
4. Se não houver JSON local, usa fallback mínimo para não deixar a tela vazia.
5. Retorna 2 ou 3 habilidades por conteúdo.
6. Cada habilidade vem com código + descrição.
```

## Rotas

```text
/api/bncc/sugerir
/api/planejamentos/habilidades
```

## Teste

Terminal 1:

```powershell
cd C:\planify
npm run dev
```

Terminal 2:

```powershell
cd C:\planify
node scripts\planify\planejamentos\testar-bncc-por-conteudo.cjs
```
