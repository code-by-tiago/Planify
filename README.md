# Planify

Plataforma pedagógica brasileira para criar, organizar e compartilhar materiais
didáticos alinhados à BNCC. O projeto combina geração assistida, edição visual,
Comunidade Docente e exportação para DOCX, PDF, Google e Classroom.

![CI](https://github.com/code-by-tiago/Planify/actions/workflows/ci.yml/badge.svg)

> **Site oficial:** [iaplanify.com.br](https://iaplanify.com.br)  
> **Código-fonte:** [github.com/code-by-tiago/Planify](https://github.com/code-by-tiago/Planify)
>
> O site público está temporariamente em manutenção enquanto as integrações
> externas são homologadas. Para avaliação técnica, execute o projeto localmente
> seguindo as instruções abaixo.

## Principais recursos

- Planejamentos, provas, listas, slides, jogos e materiais visuais.
- Sugestões de habilidades BNCC por etapa, componente e conteúdo.
- Exportações com preservação de tabelas, listas, gabaritos e layouts.
- Comunidade Docente com posts, participantes, anexos e moderação.
- Fluxos de marketplace, histórico e integrações opcionais.

## Desenvolvimento

Requisitos: Node.js 22+ e uma instância Supabase para os recursos autenticados.

```bash
npm ci
npm run verify:material-quality
npm run typecheck
npm run build
```

Copie `.env.example` para `.env.local` e preencha as credenciais das integrações
que desejar habilitar. A aplicação continua funcional em modo local para os
fluxos que não dependem de serviços externos.

## Validações

```bash
npm run verify:go-live
npm run verify:generators
npm run verify:comunidade-docente
npm run verify:planning-bncc
```

Os testes E2E usam Playwright e podem exigir `npx playwright install` na primeira
execução. Nunca publique chaves privadas no repositório.

## Arquitetura e deploy

O frontend e as rotas server-side usam Next.js com TypeScript. Regras de domínio
ficam em `src/lib` e `src/server`; migrações e políticas ficam em `supabase/`.
O deploy recomendado é Vercel conectado à branch `main`, com as variáveis de
ambiente configuradas no painel do projeto.

### Demonstração e modo de manutenção

O deploy de produção permanece em modo de manutenção até que as integrações
externas sejam homologadas com credenciais reais. O código continua disponível
para avaliação no GitHub e pode ser executado localmente com `npm ci`, `.env.local`
e `npm run dev`. Para reativar uma implantação Vercel após a homologação, defina
`SITE_OFFLINE=0` no ambiente Production e faça um novo deploy. Em ambiente local,
o modo de manutenção não é ativado por padrão.

## CI

Push e pull requests para `main` executam smoke de qualidade, typecheck e build de produção (`.github/workflows/ci.yml`).
