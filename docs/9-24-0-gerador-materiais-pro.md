# Planify — Etapa 9.24.0 — Gerador de Materiais Didáticos Pro

## Foco
Esta etapa corrige e fortalece exclusivamente a página e o motor de geração de materiais didáticos.

## Preservado
- Planejamentos
- DOCX oficial de planejamentos
- BNCC
- Stripe
- Biblioteca Premium
- Marketplace
- Admin
- Editor
- Histórico

## Alterações principais
1. Página `/materiais` enriquecida com campos profissionais:
   - título
   - escola
   - professor
   - finalidade
   - nível de aprofundamento
   - contexto da turma
   - recursos disponíveis
   - critérios de avaliação
   - conteúdos manuais
   - objetivos
   - orientações especiais
   - observações

2. Curadoria inteligente agora aparece na interface:
   - botão para sugerir conteúdos
   - cards selecionáveis
   - aplicar conteúdos ao campo principal
   - recomendação de formatos

3. Motor de IA reforçado por tipo de material:
   - apostila não vira atividade
   - prova não vira apostila
   - projeto não vira lista de questões
   - sequência didática não vira prova
   - jogo continua usando construtor visual

4. Apostila fortalecida:
   - capítulos/unidades
   - explicação antes dos exercícios
   - exemplos contextualizados
   - boxes de curiosidade
   - vocabulário/glossário
   - síntese final
   - exercícios apenas como prática final ou por unidade

5. Qualidade do backend:
   - a IA passa a ser saída principal para materiais complexos
   - o motor rígido deixou de descartar apostilas boas por não terem questões no padrão anterior
   - fallback genérico para material comum foi removido do frontend; se a IA falhar, mostra erro em vez de entregar material pobre
   - jogos ainda mantêm fallback visual seguro

## Validação feita
- `npm ci --ignore-scripts`
- `npx tsc --noEmit` passou sem erros
- `npm run build` compilou e passou pela etapa de TypeScript; no sandbox, ficou preso na fase final de `Collecting build traces`, comportamento ambiental do container. No projeto local/Vercel, rode o build completo normalmente.
