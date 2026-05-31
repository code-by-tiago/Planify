# Planify — 9.14.2 — Integração da página Planejamentos

## Objetivo

Integrar a tela `/planejamentos` ao motor BNCC por conteúdo e ao motor DOCX oficial.

## O que foi feito

```text
1. Página de Planejamentos reconstruída com fluxo limpo.
2. Sugestão BNCC usa Conteúdos + etapa + ano/série + área + componente.
3. Objetivos e Observações são opcionais.
4. Cards BNCC agrupados por conteúdo.
5. Seleção/remarcação de habilidades.
6. Botão Baixar DOCX oficial integrado à rota /api/planejamentos/docx-oficial.
7. Botão Enviar para Editor.
8. Interface sem menção a Gemini, usando apenas IA.
```

## Arquivos alterados

```text
src/app/planejamentos/PlanejamentosClient.tsx
src/app/planejamentos/page.tsx
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
1. Abrir /planejamentos.
2. Informar etapa, ano/série, área, componente e conteúdos.
3. Clicar em Sugerir habilidades BNCC.
4. Ver cards por conteúdo.
5. Selecionar/remover habilidades.
6. Clicar em Baixar DOCX oficial.
7. Abrir no Word.
```
