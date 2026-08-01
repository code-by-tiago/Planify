# Planify - Etapa 9.26.0 - Gerador de Materiais Elite Max

Foco absoluto: fortalecer a pagina e o motor do Gerador de Material Didatico para entregar material coerente, preciso e de alto nivel para diferentes temas, componentes, series e tipos.

## O que esta etapa aplica

- Une a precisao da etapa 9.25 com uma camada superior de especialistas por tipo de material.
- Cria contrato interno por tipo: apostila, prova, atividade, lista, revisao, sequencia, projeto, roteiro e jogo.
- Reforca a quantidade exata de questoes/exercicios quando o professor informa um numero.
- Garante que o gabarito acompanhe as questoes finais.
- Reforca secoes obrigatorias conforme o tipo de material.
- Confere cobertura dos conteudos selecionados para nao deixar conteudo citado sem ser trabalhado.
- Ajusta o prompt para obedecer ao especialista ativo e ao contrato de entrega.
- Inclui recuperacao deterministica verificada quando a IA externa falhar ou retornar estrutura quebrada.

## Areas preservadas

Nao altera Planejamentos, DOCX oficial, BNCC, Stripe, Biblioteca Premium, Marketplace, Editor, Admin, Supabase ou rotas de assinatura.

## Validacao realizada no pacote

- `npm run typecheck`: OK.
- `npm run build`: compilacao e TypeScript OK no sandbox; a fase final de coleta de dados excedeu o tempo do ambiente. No Windows do projeto, rode o build completo antes do commit.

## Regra de uso

Esta etapa substitui a 9.25 isolada. Aplique somente a 9.26 se ela ainda nao foi aplicada.
