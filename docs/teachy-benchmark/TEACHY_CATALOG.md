# Teachy — catálogo completo (60+ ferramentas)

> Fonte: [teachy.com.br/pt-BR/ferramentas](https://www.teachy.com.br/pt-BR/ferramentas) (pública) + dashboard logado (`/home`, abas do menu).  
> Atualizado: jun/2026 — Opção A (auditoria Planify).

**Legenda equivalente Planify:** mapeamento em [`TOOL_MAPPING.md`](./TOOL_MAPPING.md). `GAP` = sem equivalente direto.

| # | Nome Teachy | Categoria dashboard | URL pública | aiTool (logado) | Descrição | Créditos | Campos formulário | Fluxo pós-submit | Formato saída | Edição pós-geração | Planify |
|---|-------------|---------------------|-------------|-----------------|-----------|----------|-------------------|------------------|---------------|-------------------|---------|
| 1 | Apresentação de Slides | Preparar aulas | `/ferramentas/slides` | `slides-generator` | Slides alinhados ao tema | ~100 | Disciplina, ano, assunto, qtd slides | Geração direta | PPTX/slides editáveis | Inline + export | `slides` |
| 2 | Resumo | Preparar aulas | `/ferramentas/resumo-tema` | `summary-generator` | Texto conciso sobre tema ou anexo | ~100 | Disciplina, ano, assunto, anexo opcional | Geração direta | Documento | Editor | `resumo` |
| 3 | Lista de Exercícios | Avaliações | `/ferramentas/gerador-quiz` | `quiz-generator` | Questões obj/dissertativas + gabarito | 100 | Disciplina, ano, assunto (BNCC), qtd 5/10/15/20 | Lista automática vs Banco | Documento + online | Editor + turma | `lista` |
| 4 | Prova | Avaliações | `/ferramentas/prova` | `assignment-generator` | Prova completa | ~100 | Disciplina, ano, assunto, qtd | Geração direta | Documento | Editor | `prova` |
| 5 | Avaliação diagnóstica | Avaliações | `/ferramentas/avaliacao-diagnostica` | — | Mapear conhecimento prévio | ~100 | Disciplina, ano, assunto | Geração direta | Documento | Editor | GAP |
| 6 | Plano de Aula | Planejamento | `/ferramentas/gerador-plano-aula` | `lesson-plan-generator` | Objetivos, metodologia, recursos | ~100 | Disciplina, ano, assunto, contexto | Geração direta | Documento | Editor | `plano-aula` |
| 7 | Mapa Mental | Preparar aulas | `/ferramentas/gerador-mapa-mental` | — | Mapa editável | ~100 | Disciplina, assunto | Geração direta | Visual/texto | Editor | `mapa-mental` |
| 8 | Atividades Ortografia/Alfabeto | Folhinhas | — | — | Sílabas, palavras, letras | ~100 | Ano, tema | Geração direta | Folhinha | PDF | GAP |
| 9 | Atividades Matemática Iniciante | Folhinhas | — | — | Matemática básica | ~100 | Ano | Geração direta | Folhinha | PDF | GAP |
| 10 | Atividades Química | Folhinhas | — | — | Química escolar | ~100 | Ano, tema | Geração direta | Folhinha | PDF | GAP |
| 11 | Atividades Matemática Intermediário | Folhinhas | — | — | Matemática avançada EF | ~100 | Ano, tema | Geração direta | Folhinha | PDF | GAP |
| 12 | Desenho simétrico | Folhinhas | — | — | Simetria visual | ~100 | Tema | Geração direta | Imagem | Impressão | GAP |
| 13 | Jogos Educativos Interativos | Engajar | — | — | Raciocínio lógico, memória | ~100 | Disciplina, tema | Escolha formato | Jogo | Editor | `jogo` (parcial) |
| 14 | Jogo da Memória | Engajar | — | `memory-game` | Pares tema/conceito | ~100 | Disciplina, assunto | Geração direta | Jogo visual | Impressão/online | `jogo` |
| 15 | Bingo | Engajar | — | `bingo` | Cartelas temáticas | ~100 | Disciplina, assunto | Geração direta | Cartelas | Impressão | `jogo` |
| 16 | Sudoku | Engajar | — | — | Lógica | ~100 | Dificuldade | Geração direta | Grade | Impressão | GAP |
| 17 | Caligrafia | Folhinhas | — | — | Tracejado | ~100 | Texto | Geração direta | Folhinha | PDF | GAP |
| 18 | Aprendendo libras | Folhinhas | — | — | LSB imagem-sinal | ~100 | Tema | Geração direta | Atividade | PDF | GAP |
| 19 | Unidades de Medida | Folhinhas | — | — | Termômetro, régua | ~100 | Tema | Geração direta | Folhinha | PDF | GAP |
| 20 | Planejamento Calendário Escolar | Planejamento | `/ferramentas/planejamento-calendario-escolar` | — | Semanas/bimestres/ano | ~100 | Período, disciplinas | Wizard | Calendário | Editor | GAP (Planify planejamento) |
| 21 | Aula Mágica | Preparar aulas | `/ferramentas/aulas` | `lessons` | Pacote multi-material | ~200+ | Disciplina, ano, assunto | Seleção materiais | Pacote | Editor bundle | `aula-completa` |
| 22 | Imagem para Colorir | Folhinhas | `/ferramentas/gerador-lineart` | — | Desenho linha | ~100 | Descrição cena | Geração direta | PNG/PDF | Download | GAP |
| 23 | Palavra Cruzada | Engajar | `/ferramentas/gerador-cruzadinhas` | `crossword` | Cruzadinha + gabarito | ~100 | Disciplina, assunto, termos | Geração direta | Grade visual | Impressão | `jogo` |
| 24 | Caça-Palavras | Engajar | — | `word-search` | 1–20 termos + gabarito | ~100 | Disciplina, assunto, qtd | Geração direta | Grade visual | Impressão | `jogo` |
| 25 | Ideias de Atividades | Engajar | `/ferramentas/ideias-sala-aula` | — | Dinâmicas ativas | ~100 | Tema, recursos | Geração direta | Lista ideias | Editor | `atividade` (parcial) |
| 26 | Sequência Didática | Planejamento | `/ferramentas/sequencia-aprendizagem` | `learning-sequence` | 1–10 aulas encadeadas | ~100 | Disciplina, ano, assunto, qtd aulas | Geração direta | Documento | Editor | `sequencia` |
| 27 | Proposta de Redação | Avaliações | — | — | Tema + motivadores | ~100 | Tema, formato ENEM/escolar | Geração direta | Documento | Editor | `redacao` |
| 28 | Questões sobre Texto | Avaliações | — | — | Perguntas sobre texto colado | ~100 | Texto, qtd | Geração direta | Questões | Editor | GAP |
| 29 | Plano Recuperação | Planejamento | — | — | Foco dificuldades | ~100 | Diagnóstico, tema | Geração direta | Plano | Editor | GAP |
| 30 | Ideias Confraternizações | Feedback | — | — | Eventos escolares | ~100 | Contexto | Geração direta | Lista | Editor | GAP |
| 31 | Mensagens Agradecimento | Feedback | — | — | Mensagens curtas | ~100 | Destinatário | Geração direta | Texto | Copiar | GAP |
| 32 | Complete as Lacunas | Avaliações | — | — | Fill-in-the-blank | ~100 | Texto/tema | Geração direta | Exercício | Editor | GAP |
| 33 | Questões sobre Vídeo | Avaliações | — | — | YouTube URL | ~100 | Link, qtd | Geração direta | Questões | Editor | GAP |
| 34 | Resumo de Vídeo | Preparar aulas | — | — | YouTube summary | ~100 | Link | Geração direta | Resumo | Editor | GAP |
| 35 | Contos Infantis | Educação infantil | — | — | Exercícios de contos | ~100 | Conto | Geração direta | Atividade | Editor | GAP |
| 36 | Brincadeiras Infantis | Educação infantil | — | — | Brincadeiras pedagógicas | ~100 | Tema | Geração direta | Lista | Editor | GAP |
| 37 | Jogos Educativos (roteiro) | Engajar | — | — | Roteiro lúdico | ~100 | Tema | Geração direta | Documento | Editor | `jogo` |
| 38 | Projeto | Engajar | `/ferramentas/gerador-projetos` | — | Roteiro completo | ~100 | Tema, etapas | Geração direta | Documento | Editor | `projeto` |
| 39 | Aulas Eletivas | Planejamento | — | — | Aulas eletivas | ~100 | Tema | Geração direta | Plano | Editor | GAP |
| 40 | Consulta sobre Vídeo | Ensinar com IA | — | — | Chat sobre vídeo | ~100 | Link | Chat | Resposta | — | GAP |
| 41 | Relatório | Feedback | — | — | Desempenho turma | ~100 | Dados | Geração direta | Relatório | Editor | GAP |
| 42 | Datas Comemorativas | Engajar | — | — | Atividades sazonais | ~100 | Data | Geração direta | Ideias | Editor | GAP |
| 43 | Aulas Acessíveis | Acessibilidade | — | — | Adaptações inclusivas | ~100 | Tema, necessidade | Geração direta | Plano | Editor | `inclusao` |
| 44 | Pergunte sobre Texto | Ensinar com IA | — | — | Q&A PDF | ~100 | PDF | Chat | Resposta | — | GAP |
| 45 | Projeto de Vida | Planejamento | — | — | Ideias projeto de vida | ~100 | Critérios | Geração direta | Ideias | Editor | GAP |
| 46 | PEI | Acessibilidade | — | — | Plano individualizado | ~100 | Aluno, necessidades | Geração direta | PEI | Editor | GAP |
| 47 | Corretor de Questões | Correção | — | `question-grader` | Corrige respostas | ~50 | Resposta, gabarito | Instantâneo | Feedback + nota | — | `correcao-ia` |
| 48 | Corretor de Redação | Correção | — | `essay-grader` | Avalia redação | ~100 | Texto/foto, rubrica | Instantâneo | Nota + feedback | — | `correcao-ia` |
| 49 | Educação Financeira — Plano | Educação Financeira | — | — | Plano finanças | ~100 | Tema | Geração direta | Plano | Editor | GAP |
| 50 | Atividades com IA | Ensinar com IA | — | — | Atividades + IA | ~100 | Tema | Geração direta | Atividade | Editor | GAP |
| 51 | Questões sobre PDF | Avaliações | — | — | PDF → questões | ~100 | PDF | Geração direta | Questões | Editor | GAP |
| 52 | Questões sobre Site | Avaliações | — | — | URL → questões | ~100 | URL | Geração direta | Questões | Editor | GAP |
| 53 | Simulado | Avaliações | — | — | Questões vestibular | ~100 | Área, qtd | Geração direta | Prova | Editor | GAP |
| 54 | Corretor Provas Papel | Correção | — | `paper-test-grader` | Foto prova → nota | ~100 | Imagem | OCR + correção | Nota + feedback | — | GAP (foto) |
| 55 | Adaptador Nível Texto | Acessibilidade | — | — | Simplifica texto | ~100 | Texto, nível | Geração direta | Texto | Editor | GAP |
| 56 | Acessibilidade Texto | Acessibilidade | — | — | Texto acessível | ~100 | Texto | Geração direta | Texto | Editor | `inclusao` |
| 57 | Acessibilidade Arquivo | Acessibilidade | — | — | DOC/PDF acessível | ~100 | Arquivo | Geração direta | Arquivo | Download | GAP |
| 58 | Tarefa Adaptada | Acessibilidade | — | — | Avaliação adaptada | ~100 | Tarefa | Geração direta | Documento | Editor | `inclusao` |
| 59 | Atividade Adaptada | Acessibilidade | — | — | Atividade adaptada | ~100 | Atividade | Geração direta | Documento | Editor | `inclusao` |
| 60 | Resumo de Texto | Preparar aulas | — | — | Resume texto longo | ~100 | Texto | Geração direta | Resumo | Editor | `resumo` |
| 61 | Letras de Músicas | Engajar | — | — | Música didática | ~100 | Tema | Geração direta | Letra | Editor | GAP |
| 62 | Avaliações Adaptadas (ideias) | Acessibilidade | — | — | Como adaptar provas | ~100 | Necessidade | Geração direta | Guia | Editor | GAP |
| 63 | Corretor Gramatical | Feedback | — | — | Ortografia/gramática | ~100 | Texto | Instantâneo | Correções | — | GAP |
| 64 | Estudo com Famoso | Alunos | — | — | Tutor persona | ~100 | Tema, famoso | Chat | Diálogo | — | GAP |
| 65 | Aprender prompts IA | Ensinar com IA | — | — | Escrita de prompts | ~100 | Prompt | Feedback | Guia | — | GAP |
| 66 | Resumo PDF | Preparar aulas | — | — | Resume PDF | ~100 | PDF | Geração direta | Resumo | Editor | GAP |
| 67 | Estudo com música | Alunos | — | — | Música + conteúdo | ~100 | Tema | Geração direta | Letra/áudio | — | GAP |
| 68 | Dicas Vestibular | Alunos | — | — | Dicas ENEM | ~100 | Área | Geração direta | Lista | — | GAP |
| 69 | Gerador áudio | Preparar aulas | — | — | TTS | ~100 | Texto | Geração direta | Áudio | Download | GAP |
| 70 | Jogo da Velha (9 questões) | Engajar | — | — | Quiz gamificado | ~100 | Tema | Geração direta | Jogo | Online | `jogo` |
| 71 | Transposição didática | Planejamento | — | — | Complexo → didático | ~100 | Conteúdo | Geração direta | Atividade | Editor | GAP |
| 72 | Esclarecedor dúvida | Alunos | — | — | Q&A acadêmico | ~100 | Pergunta | Chat | Resposta | — | GAP |
| 73 | Plano de estudos | Alunos | — | — | Cronograma estudo | ~100 | Matéria | Geração direta | Plano | Editor | GAP |
| 74 | Ed. Financeira — Resumo | Educação Financeira | — | — | Resumo finanças | ~100 | Tema | Geração direta | Resumo | Editor | GAP |
| 75 | Objetivos Aprendizagem | Planejamento | — | — | Objetivos mensuráveis | ~100 | Tema | Geração direta | Lista | Editor | GAP |
| 76 | Lista Vocabulário | Preparar aulas | — | — | Palavras + significados | ~100 | Tema | Geração direta | Lista | Editor | GAP |
| 77 | BNCC Descomplicada | Planejamento | — | — | Como trabalhar BNCC | ~100 | Código BNCC | Geração direta | Guia | Editor | GAP |
| 78 | Erros Comuns | Preparar aulas | — | — | Erros + soluções | ~100 | Assunto | Geração direta | Lista | Editor | GAP |
| 79 | Texto de Apoio | Avaliações | — | — | Passagem leitura | ~100 | Tema | Geração direta | Texto | Editor | GAP |
| 80 | Termos financeiros | Educação Financeira | — | — | Glossário | ~100 | Termo | Geração direta | Definição | Editor | GAP |
| 81 | Charadas | Engajar | — | — | Charadas temáticas | ~100 | Tema | Geração direta | Lista | Editor | GAP |
| 82 | Dinâmicas Sala | Engajar | — | — | Integração/quebra-gelo | ~100 | Turma | Geração direta | Roteiro | Editor | GAP |
| 83 | Critérios Avaliação | Avaliações | — | — | Rubrica | ~100 | Tarefa | Geração direta | Rubrica | Editor | `correcao-ia` |
| 84 | Chatbot | Ensinar com IA | `/ferramentas/chatbot` | — | IA + links BNCC | Chat | Pergunta | Chat | Resposta + links | — | GAP |

**Total catalogado: 84 ferramentas** (página pública + dashboard; duplicatas EN/PT consolidadas).

## Abas do dashboard logado

| Aba | Exemplos |
|-----|----------|
| Educação infantil | Contos, brincadeiras, caligrafia |
| Planejamento | Plano, sequência, calendário, BNCC |
| Folhinhas de atividades | Ortografia, matemática, química, medidas |
| Preparar aulas | Slides, resumo, apostila, aula mágica |
| Engajar alunos | Jogos, bingo, memória, cruzadinha, caça-palavras |
| Avaliações | Lista, prova, simulado, redação |
| Correção automática | Corretor questões, redação, prova papel |
| Acessibilidade | PEI, adaptações, textos acessíveis |
| Ensinar com IA | Atividades IA, chatbot, vídeo |
| Educação Financeira | Planos, resumos, sequências |

## Hands-on Opção A (23 Teachy + 16 Planify)

Ver amostras em [`samples/`](./samples/).
