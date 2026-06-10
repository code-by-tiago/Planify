/**
 * Pacotes da Biblioteca Premium — conteúdo curado Planify (nível demonstração).
 * Consumido por scripts/seed-biblioteca-pacotes.mjs
 */

export const SEED_PACKAGES = [
  {
    slug: "pacote-lista-fracoes-5ano",
    title: "Lista de exercícios — Frações (5º ano)",
    description:
      "Lista completa com 15 questões progressivas sobre representação, equivalência, comparação e operações com frações. Inclui critérios de correção, gabarito comentado e alinhamento BNCC EF05MA03/EF05MA04.",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componente: "Matemática",
    tipoMaterial: "Atividade",
    categoria: "lista",
    tema: "Frações",
    finalidade: "Prática, consolidação e avaliação formativa",
    nivelDificuldade: "Intermediário",
    duracao: "50 min",
    habilidadesBncc: ["EF05MA03", "EF05MA04", "EF05MA05"],
    tags: ["frações", "lista", "5º ano", "matemática", "bncc"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 5º ano · Matemática · Lista curada Planify",
        metadata: {
          Tema: this.tema,
          Duração: this.duracao,
          "Habilidades BNCC": this.habilidadesBncc.join(", "),
          Finalidade: this.finalidade,
        },
        sections: [
          {
            title: "Orientações ao professor",
            items: [
              "Aplicar após revisão de representação fracionária (parte-todo, reta numérica e equivalência).",
              "Tempo sugerido: 50 minutos (40 min resolução + 10 min correção coletiva).",
              "Valor sugerido: 15 pontos (1 ponto por questão objetiva; 2 pontos nas discursivas 13–15).",
              "Permitir uso de material concreto (fitas, barras de fração) nas questões 1, 8 e 14.",
            ],
          },
          {
            title: "Habilidades BNCC trabalhadas",
            items: [
              "EF05MA03 — Identificar e representar frações (menores e maiores que a unidade), associando-as ao resultado de uma divisão ou à ideia de parte de um todo.",
              "EF05MA04 — Identificar frações equivalentes.",
              "EF05MA05 — Comparar e ordenar números racionais positivos (representação fracionária), relacionando-os a pontos na reta numérica.",
            ],
          },
          {
            title: "Instruções ao aluno",
            content:
              "Leia cada questão com atenção. Mostre todos os cálculos e desenhos quando solicitado. Use lápis e régua. Não é permitido o uso de calculadora.",
          },
          {
            title: "Nível 1 — Representação e equivalência",
            items: [
              "1) (Objetiva) Em uma turma de 28 alunos, 7 praticam natação. Que fração da turma pratica natação? Simplifique o resultado.",
              "2) (Objetiva) Marque a alternativa que representa a mesma quantidade que 3/4:\n   a) 6/8   b) 9/12   c) 12/16   d) Todas as anteriores",
              "3) (Discursiva) Desenhe uma barra retangular dividida em partes iguais para representar 5/6. Explique por que sua representação está correta.",
              "4) (Objetiva) Complete: 2/5 = ?/20",
              "5) (Discursiva) Converta 17/4 para número misto e explique o significado de cada parte (inteiro e fração).",
            ],
          },
          {
            title: "Nível 2 — Comparação e ordenação",
            items: [
              "6) (Objetiva) Compare usando >, < ou =: 5/8 ___ 3/4",
              "7) (Objetiva) Qual é a maior fração? 7/10 — 2/3 — 3/5",
              "8) (Discursiva) Coloque na reta numérica (desenhe a reta de 0 a 2) as frações: 1/2, 3/4, 5/4 e 7/4.",
              "9) (Objetiva) Ordene em ordem crescente: 3/5, 1/2, 4/5, 2/10",
            ],
          },
          {
            title: "Nível 3 — Operações e problemas",
            items: [
              "10) João comeu 2/8 de uma pizza e Maria comeu 3/8 da mesma pizza. Que fração da pizza foi consumida? A pizza estava inteira no início.",
              "11) Ana tinha 3/4 de litro de suco e serviu 1/4 de litro para cada um de 2 amigos. Quanto suco sobrou?",
              "12) Um terreno foi dividido em 12 lotes iguais. Pedro comprou 3 lotes e Carla comprou 4. Que fração do terreno ainda não foi vendida?",
              "13) (Desafio) Uma receita usa 2/3 de xícara de leite. Se você quiser fazer o triplo da receita, quantas xícaras de leite serão necessárias?",
              "14) (Desafio) Em uma corrida, Pedro percorreu 3/5 do percurso e parou. Luísa percorreu 7/10 do mesmo percurso. Quem está mais perto do fim? Justifique com cálculos.",
              "15) (Desafio) Encontre uma fração equivalente a 4/6 cujo denominador seja 24. Depois, compare o resultado com 3/4.",
            ],
          },
          {
            title: "Gabarito comentado",
            items: [
              "1) 7/28 = 1/4 da turma.",
              "2) Letra d — todas são equivalentes a 3/4.",
              "3) Barra com 6 partes iguais, 5 preenchidas (critério: partes iguais + quantidade correta).",
              "4) 8/20",
              "5) 4 inteiros e 1/4 — 17÷4 = 4 com resto 1.",
              "6) 5/8 < 3/4 (pois 3/4 = 6/8).",
              "7) 2/3 (≈0,67) é a maior.",
              "9) 2/10 < 1/2 < 3/5 < 4/5",
              "10) 5/8",
              "11) 3/4 − 2/4 = 1/4 de litro",
              "12) 5/12 (vendidos 7/12; sobram 5/12)",
              "13) 2 xícaras (2/3 × 3 = 2)",
              "14) Luísa (7/10 > 3/5 = 6/10)",
              "15) 16/24; 16/24 < 18/24, portanto 16/24 < 3/4",
            ],
          },
          {
            title: "Critérios de correção (sugestão)",
            items: [
              "Cálculos corretos com estratégia visível: pontuação integral.",
              "Resposta final correta sem justificativa em questões discursivas: 50% do valor.",
              "Erro de simplificação com raciocínio correto: descontar 0,5 ponto.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-plano-aula-sistema-solar-5ano",
    title: "Plano de aula — Sistema Solar (5º ano)",
    description:
      "Sequência didática completa de 2 aulas (100 min) sobre o Sistema Solar: objetivos, BNCC, roteiro em 4 momentos, atividade prática, rubrica de avaliação e adaptações inclusivas.",
    etapa: "Ensino Fundamental",
    anoSerie: "5º ano",
    componente: "Ciências",
    tipoMaterial: "Planejamento",
    categoria: "plano-aula",
    tema: "Sistema Solar",
    finalidade: "Aula investigativa com modelagem e registro científico",
    nivelDificuldade: "Básico",
    duracao: "2 × 50 min",
    habilidadesBncc: ["EF05CI10", "EF05CI11"],
    tags: ["sistema solar", "planetas", "5º ano", "ciências", "astronomia"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 5º ano · Ciências · Plano curado Planify",
        metadata: {
          Tema: this.tema,
          Duração: this.duracao,
          BNCC: this.habilidadesBncc.join(", "),
          Metodologia: "Investigação guiada + modelagem",
        },
        sections: [
          {
            title: "Identificação e contexto",
            content:
              "Os estudantes do 5º ano já possuem curiosidade sobre o espaço (foguetes, astronautas, filmes). Este plano organiza essa curiosidade em aprendizagem científica: distinguir astros, compreender a organização do Sistema Solar e refletir sobre condições para a vida. Conecta-se com Matemática (escalas, ordem) e Língua Portuguesa (produção de texto expositivo).",
          },
          {
            title: "Objetivos de aprendizagem",
            items: [
              "Identificar o Sol como estrela e fonte de luz/calor para o Sistema Solar.",
              "Reconhecer os oito planetas em ordem, diferenciando rochosos e gasosos.",
              "Descrever características observáveis (tamanho relativo, cor, presença de luas).",
              "Compreender que a distância ao Sol influencia temperatura e condições de vida.",
              "Registrar observações em ficha científica com vocabulário adequado.",
            ],
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF05CI10 — Identificar os componentes do Sistema Solar (Sol, planetas, luas, cometas, asteroides) e a posição da Terra em relação ao Sol e aos demais planetas.",
              "EF05CI11 — Associar o movimento diário do Sol e das demais estrelas no céu ao movimento de rotação da Terra.",
            ],
          },
          {
            title: "Recursos necessários",
            items: [
              "Projetor ou cartazes com imagens do Sistema Solar (NASA/ESA ou similares)",
              "Bolas de isopor ou bolas de diferentes tamanhos (modelo em escala simplificada)",
              "Fita métrica, cartolina, lápis de cor, cola",
              "Ficha de registro em dupla (anexo sugerido ao final)",
              "Vídeo curto (3–5 min) sobre o Sistema Solar — opcional no aquecimento",
            ],
          },
          {
            title: "Aula 1 — Explorando o Sistema Solar (50 min)",
            items: [
              "Momento 1 — Aquecimento (8 min): Rodada rápida: 'O que é planeta? O que é estrela?' Registro de ideias no quadro sem julgamento.",
              "Momento 2 — Investigação guiada (20 min): Apresentação dialogada com imagens. Tabela no quadro: planeta | tipo (rochoso/gasoso) | curiosidade. Destaque: Sol não é planeta; Plutão não é planeta desde 2006.",
              "Momento 3 — Modelo em escala (15 min): Duplas montam sequência dos 8 planetas com bolas e fita. Discussão: por que não dá para representar distâncias reais na sala?",
              "Momento 4 — Síntese (7 min): Mapa mental coletivo: centro (Sol) + ramos (planetas, luas, asteroides). Tarefa: observar o céu noturno (se possível) e anotar uma dúvida.",
            ],
          },
          {
            title: "Aula 2 — Vida no Sistema Solar (50 min)",
            items: [
              "Momento 1 — Retomada (5 min): Revisão da ordem dos planetas com jogo de cartas embaralhadas.",
              "Momento 2 — Leitura compartilhada (15 min): Texto curto sobre condições de vida (atmosfera, água líquida, temperatura). Destaque para a Terra como único planeta com vida conhecida.",
              "Momento 3 — Estações em dupla (20 min): Cada dupla pesquisa (material impresso ou QR) um planeta e preenche ficha: distância ao Sol, temperatura média, tem luas?, fato interessante.",
              "Momento 4 — Apresentações e avaliação (10 min): 3 duplas apresentam (2 min cada). Fechamento: 'Por que exploramos o espaço?'",
            ],
          },
          {
            title: "Avaliação formativa",
            items: [
              "Participação nas discussões e uso correto de vocabulário (planeta, astro, órbita, satélite natural).",
              "Ficha de registro: presença dos 8 planetas em ordem + pelo menos 2 características corretas por planeta estudado.",
              "Modelo físico: organização sequencial coerente (critério principal, não precisão de escala).",
            ],
          },
          {
            title: "Rubrica simplificada (ficha em dupla)",
            content:
              "Excelente (4): ordem correta, 3+ características precisas, registro legível e com vocabulário científico.\nSatisfatório (3): ordem correta, 2 características, registro compreensível.\nEm desenvolvimento (2): ordem com 1–2 erros, 1 característica correta.\nIniciante (1): participou, mas registro incompleto — necessita retomada.",
          },
          {
            title: "Adaptações inclusivas",
            items: [
              "TEA: rotina visual com os 4 momentos da aula; cartões com nome dos planetas para ordenação tátil.",
              "TDAH: missões curtas com meta clara ('Monte 4 planetas em 3 minutos'); pausas programadas.",
              "Dislexia: ficha com pictogramas; leitura em voz alta do texto-base; tempo estendido.",
              "Baixa visão: imagens ampliadas; material em contraste alto.",
            ],
          },
          {
            title: "Referências sugeridas",
            items: [
              "BNCC — Ciências da Natureza, 5º ano.",
              "NASA Solar System Exploration (recursos educativos em português quando disponíveis).",
              "Livro didático adotado pela escola — unidade de Terra e Universo.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-resumo-revolucao-industrial-9ano",
    title: "Resumo — Revolução Industrial (9º ano)",
    description:
      "Material de apoio aprofundado com contextualização histórica, linha do tempo, tabela comparativa das revoluções industriais, glossário, 10 questões de fixação com gabarito e conexões com o Brasil.",
    etapa: "Ensino Fundamental",
    anoSerie: "9º ano",
    componente: "História",
    tipoMaterial: "Material de apoio",
    categoria: "resumo",
    tema: "Revolução Industrial",
    finalidade: "Estudo dirigido, revisão e preparação para avaliação",
    nivelDificuldade: "Intermediário",
    duracao: "2 aulas de 50 min",
    habilidadesBncc: ["EF09HI13", "EF09HI14", "EF09HI15"],
    tags: ["revolução industrial", "resumo", "9º ano", "história", "modernidade"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 9º ano · História · Material curado Planify",
        metadata: {
          Tema: this.tema,
          BNCC: this.habilidadesBncc.join(", "),
          Uso: "Leitura dirigida + fixação",
        },
        sections: [
          {
            title: "Introdução — Por que estudar a Revolução Industrial?",
            content:
              "A Revolução Industrial é um marco da história moderna: marca a passagem de sociedades agrárias e artesanais para sociedades industriais e urbanas. Compreendê-la permite explicar a urbanização, as relações de trabalho atuais, a desigualdade global e a crise ambiental. O processo começou na Inglaterra no século XVIII e se espalhou pelo mundo, chegando ao Brasil de forma tardia e dependente.",
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF09HI13 — Descrever e analisar as relações entre as transformações tecnológicas, as mudanças no mundo do trabalho e os movimentos sociais do século XIX.",
              "EF09HI14 — Identificar e relacionar as demandas e os ideais dos movimentos operários e das organizações em defesa dos trabalhadores.",
              "EF09HI15 — Relacionar a Revolução Industrial ao desenvolvimento do capitalismo e ao imperialismo europeu no século XIX.",
            ],
          },
          {
            title: "Conceitos-chave",
            items: [
              "Revolução Industrial: conjunto de inovações tecnológicas que transformam a produção de bens, especialmente a partir da mecanização.",
              "Modo de produção capitalista: acumulação de capital, propriedade privada dos meios de produção, mercado de trabalho assalariado.",
              "Proletariado: classe de trabalhadores que vende sua força de trabalho em troca de salário.",
              "Burguesia industrial: classe que detém fábricas, máquinas e investimentos.",
              "Urbanização: migração massiva do campo para as cidades em busca de emprego nas fábricas.",
              "Laissez-faire: ideologia econômica que defende mínima intervenção estatal nos negócios (influente no século XIX).",
            ],
          },
          {
            title: "Por que a Inglaterra liderou o processo?",
            items: [
              "Revolução Agrícola prévia: aumento da produtividade rural liberou mão de obra para as cidades.",
              "Disponibilidade de carvão mineral e ferro — recursos essenciais para máquinas a vapor.",
              "Capital acumulado pelo comércio colonial e pela tríplice corrida (escravidão, comércio triangular).",
              "Inovações técnicas: tear mecânico (Hargreaves), máquina a vapor aprimorada (James Watt, 1769).",
              "Estabilidade política relativa após a Revolução Gloriosa (1688) favoreceu investimentos.",
            ],
          },
          {
            title: "Linha do tempo",
            items: [
              "1760–1840 — 1ª Revolução Industrial: indústria têxtil, carvão, ferro, máquina a vapor. Fábrica como novo espaço de trabalho.",
              "1870–1914 — 2ª Revolução Industrial: aço (Bessemer), eletricidade, petróleo, automóvel, química industrial.",
              "Século XIX — Expansão global: ferrovias, telégrafo, navios a vapor conectam mercados.",
              "Impactos sociais: jornadas de 14–16 horas, trabalho infantil, habitações insalubres, epidemias nas cidades.",
              "Reação social: ludismo (destruição de máquinas), sindicatos, cartismo, socialismo utópico e marxismo.",
            ],
          },
          {
            title: "Comparativo: 1ª e 2ª Revoluções Industriais",
            items: [
              "Energia: carvão/vapor → eletricidade, petróleo, combustão interna",
              "Setor líder: têxtil → siderurgia, química, automobilística",
              "Organização: fábrica disciplinada → linha de montagem (Ford, século XX)",
              "Capital: comerciantes e inventores → grandes corporações e bancos",
              "Trabalho: artesãos desempregados → operários especializados e burocracia",
            ],
          },
          {
            title: "Revolução Industrial e Brasil",
            items: [
              "Colônia e Império: economia baseada na agricultura de exportação (açúcar, café); industrialização incipiente.",
              "Segundo Reinado: primeiras iniciativas (estrada de ferro, Companhia de Navegação a Vapor).",
              "República Velha: café ainda dominante; industrialização se intensifica a partir da década de 1930 (contexto posterior, mas raízes no século XIX global).",
              "Dependência: Brasil fornecia matérias-primas e comprava manufaturas europeias — relação colonial de troca desigual.",
            ],
          },
          {
            title: "Glossário",
            items: [
              "Maquinofatura: produção baseada em máquinas e divisão do trabalho.",
              "Sindicato: organização de trabalhadores para defesa de direitos.",
              "Imperialismo: expansão de potências industriais sobre territórios e mercados.",
              "Classe média: profissionais liberais, comerciantes e técnicos que crescem nas cidades industriais.",
            ],
          },
          {
            title: "Questões de fixação",
            items: [
              "1) Explique por que a Inglaterra foi o berço da Revolução Industrial (mínimo 3 fatores).",
              "2) Cite duas invenções da 1ª Revolução Industrial e sua função.",
              "3) O que é proletariado e como surgiu esse grupo social?",
              "4) Descreva duas condições de vida dos trabalhadores nas cidades industriais do século XIX.",
              "5) O que foi o ludismo e por que os luditas destruíam máquinas?",
              "6) Diferencie 1ª e 2ª Revoluções Industriais quanto à fonte de energia.",
              "7) Relacione Revolução Industrial e imperialismo europeu.",
              "8) Por que o trabalho infantil era comum nas fábricas?",
              "9) Como a Revolução Industrial alterou a estrutura familiar?",
              "10) Explique a relação entre industrialização inglesa e economia colonial brasileira no século XIX.",
            ],
          },
          {
            title: "Gabarito orientativo",
            items: [
              "1) Revolução Agrícola, carvão/ferro, capital do comércio, inovações técnicas, estabilidade política.",
              "2) Ex.: tear mecânico (produção têxtil); máquina a vapor (energia para fábricas e transporte).",
              "3) Trabalhadores assalariados sem meios de produção; surgem com a mecanização e expulsão do campo.",
              "4) Ex.: habitações precárias, doenças, jornadas extensas, salários baixos.",
              "5) Movimento de operários que protestavam contra máquinas que substituíam empregos.",
              "6) 1ª: carvão/vapor; 2ª: eletricidade e petróleo.",
              "7) Indústrias buscam matérias-primas e mercados → colonização e domínio de territórios.",
              "8) Salários baixos da família; crianças aceitavam pagamento menor; ausência de leis protetivas.",
              "9) Família nuclear urbana; mulheres e crianças no trabalho fabril; mudança de papéis.",
              "10) Brasil exportava produtos agrícolas e importava manufaturas; dependência econômica.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-atividade-interpretacao-texto-6ano",
    title: "Atividade — Interpretação de texto (6º ano)",
    description:
      "Texto narrativo literário com 12 questões (literal, inferencial e crítica), glossário, critérios de correção e proposta de produção escrita complementar.",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componente: "Língua Portuguesa",
    tipoMaterial: "Atividade",
    categoria: "atividade",
    tema: "Interpretação de texto",
    finalidade: "Prática de leitura, inferência e produção",
    nivelDificuldade: "Intermediário",
    duracao: "2 × 45 min",
    habilidadesBncc: ["EF67LP28", "EF67LP29", "EF67LP08"],
    tags: ["interpretação", "leitura", "6º ano", "português", "narrativa"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 6º ano · Língua Portuguesa · Atividade curada Planify",
        metadata: {
          Tema: this.tema,
          Gênero: "Narrativa curta (3ª pessoa)",
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Orientações pedagógicas",
            items: [
              "Aula 1: leitura silenciosa (10 min) + leitura em voz alta pelo professor (5 min) + resolução das questões 1–8 (30 min).",
              "Aula 2: questões 9–12 (25 min) + produção do final alternativo (15 min) + socialização (5 min).",
              "Incentive marcação de evidências no texto antes de responder questões inferenciais.",
            ],
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF67LP28 — Ler, de forma autônoma, e compreender, selecionando procedimentos e estratégias de leitura adequados a diferentes objetivos e levando em conta características dos gêneros e suportes, romances, contos, crônicas, poemas, narrativas de ficção científica, poemas visuais, dentre outros.",
              "EF67LP29 — Identificar e discutir o efeito de sentido de recursos multissemióticos em textos que circulam em meios digitais.",
              "EF67LP08 — Identificar o efeito de sentido de verbos de enunciação em textos narrativos.",
            ],
          },
          {
            title: "Texto para leitura — O museu e o céu",
            content:
              "Lucas acordou antes do despertador na manhã da excursão. A turma do 6º ano visitaria o museu de ciências da cidade — seu primeiro passeio escolar no ano. No ônibus, encostou a testa no vidro e observou as ruas ainda silenciosas, com poucos pedestres e as padarias abrindo as portas.\n\nNo museu, percorreu as salas de fósseis e experimentos de eletricidade, mas foi o planetário que mudou seu dia. Deitado na poltrona reclinável, viu o céu se encher de estrelas artificiais. Quando a projeção mostrou a Terra vista do espaço — uma esfera azul e frágil —, Lucas sentiu um arrepio. 'Nunca pensei que o universo fosse tão grande', sussurrou para Ana, sentada ao lado.\n\nNo caminho de volta, enquanto o ônibus atravessava a ponte, Lucas abriu o caderno e escreveu o título de um possível livro: 'Notas de um explorador'. Prometeu a si mesmo que, na biblioteca da escola, pediria ajuda à professora para encontrar um livro sobre astronomia.",
          },
          {
            title: "Glossário do texto",
            items: [
              "Planetário: sala com projeção do céu estrelado para fins educativos.",
              "Fósseis: restos preservados de seres vivos de épocas antigas.",
              "Sussurrou: falou muito baixo, quase sem som.",
            ],
          },
          {
            title: "Questões — Compreensão literal",
            items: [
              "1) Para onde a turma foi na excursão?",
              "2) Qual setor do museu mais impressionou Lucas?",
              "3) O que Lucas escreveu no caderno no caminho de volta?",
              "4) Quem estava sentada ao lado de Lucas no planetário?",
            ],
          },
          {
            title: "Questões — Inferência e vocabulário",
            items: [
              "5) Por que Lucas acordou antes do despertador? O que isso revela sobre seu estado emocional?",
              "6) O que a frase 'esfera azul e frágil' sugere sobre a Terra?",
              "7) Substitua 'impressionado' por um sinônimo adequado ao contexto.",
              "8) Identifique o narrador do texto e o ponto de vista narrativo (1ª ou 3ª pessoa).",
            ],
          },
          {
            title: "Questões — Análise e produção",
            items: [
              "9) Qual é o tema central do texto? Justifique com uma passagem.",
              "10) O texto pertence a qual gênero literário? Aponte dois elementos que justificam sua resposta.",
              "11) Reescreva o último parágrafo na 1ª pessoa, como se Lucas estivesse contando a história.",
              "12) Produção: escreva um final alternativo para a história (mínimo 8 linhas), mantendo o personagem Lucas e o tema da curiosidade científica.",
            ],
          },
          {
            title: "Gabarito orientativo",
            items: [
              "1) Museu de ciências da cidade.",
              "2) O planetário.",
              "3) 'Notas de um explorador' (título de um possível livro).",
              "4) Ana.",
              "5) Ansiedade/empolgação com o passeio.",
              "6) Pequenez e vulnerabilidade da Terra no universo.",
              "7) Ex.: maravilhado, fascinado, impactado.",
              "8) Narrador em 3ª pessoa (focaliza Lucas).",
              "9) Descoberta, curiosidade científica, admiração pelo universo.",
              "10) Narrativa/conto: personagem, enredo, tempo e espaço definidos.",
              "11–12) Avaliar coerência, repertório e adequação ao gênero.",
            ],
          },
          {
            title: "Critérios de correção (produção)",
            content:
              "Coerência com o texto-base (2 pts) · Manutenção do tema científico (2 pts) · Coesão e pontuação (2 pts) · Criatividade e repertório (2 pts) · Extensão mínima (2 pts). Total: 10 pontos.",
          },
        ],
      };
    },
  },
  {
    slug: "pacote-lista-equacoes-1-grau-8ano",
    title: "Lista de exercícios — Equações do 1º grau (8º ano)",
    description:
      "Lista estruturada em 3 níveis com 18 exercícios de equações e problemas contextualizados, revisão teórica, gabarito comentado e critérios de avaliação.",
    etapa: "Ensino Fundamental",
    anoSerie: "8º ano",
    componente: "Matemática",
    tipoMaterial: "Atividade",
    categoria: "lista",
    tema: "Equações do 1º grau",
    finalidade: "Consolidação algorítmica e modelagem matemática",
    nivelDificuldade: "Intermediário",
    duracao: "2 × 50 min",
    habilidadesBncc: ["EF08MA08", "EF08MA09"],
    tags: ["equações", "álgebra", "8º ano", "matemática", "modelagem"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 8º ano · Matemática · Lista curada Planify",
        metadata: {
          Tema: this.tema,
          BNCC: this.habilidadesBncc.join(", "),
          Duração: this.duracao,
        },
        sections: [
          {
            title: "Revisão teórica",
            items: [
              "Equação do 1º grau: igualdade com incógnita x de expoente 1 (ex.: 3x + 5 = 20).",
              "Princípio aditivo: somar ou subtrair o mesmo valor nos dois membros.",
              "Princípio multiplicativo: multiplicar ou dividir os dois membros pelo mesmo valor (≠ 0).",
              "Verificação: substituir x na equação original e confirmar a igualdade.",
            ],
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF08MA08 — Resolver e elaborar problemas relacionados ao seu contexto próximo, que possam ser representados por sistemas de equações de 1º grau com duas incógnitas e interpretá-los.",
              "EF08MA09 — Resolver e elaborar, com e sem uso de tecnologias, problemas que podem ser representados por equações polinomiais de 2º grau do tipo ax² = b.",
            ],
          },
          {
            title: "Nível 1 — Equações fundamentais",
            items: [
              "1) 3x + 7 = 22",
              "2) 5x − 4 = 2x + 11",
              "3) 2(x + 3) = 18",
              "4) (x/4) + 2 = 7",
              "5) 3(2x − 1) = x + 12",
              "6) 0,5x + 3 = 8",
            ],
          },
          {
            title: "Nível 2 — Problemas contextualizados",
            items: [
              "7) A soma de três números consecutivos é 48. Qual é o maior deles?",
              "8) Um cinema cobra R$ 20,00 por ingresso inteiro e R$ 12,00 por meia. Em uma sessão, 30 pessoas pagaram ingresso e a arrecadação foi R$ 480,00. Quantas meias foram vendidas?",
              "9) O perímetro de um retângulo é 54 cm. O comprimento é o dobro da largura. Encontre as dimensões.",
              "10) Pedro tem o triplo da idade de Luísa. Daqui a 10 anos, Pedro terá o dobro da idade de Luísa. Quantos anos têm hoje?",
              "11) Um número somado ao seu quíntuplo resulta em 72. Qual é o número?",
            ],
          },
          {
            title: "Nível 3 — Desafios",
            items: [
              "12) A metade de um número somada a 15 resulta em 39. Qual é o número?",
              "13) Três amigos dividem R$ 240,00 de forma proporcional: o primeiro recebe o dobro do segundo, e o terceiro recebe R$ 40,00 a menos que o segundo. Quanto cada um recebe?",
              "14) Um tanque tem certa quantidade de água. Se adicionarmos 25 litros, teremos o triplo do que havia. Se retirarmos 15 litros, restará a metade. Quantos litros há no tanque?",
              "15) (Verdadeiro ou falso) A equação 2x + 4 = 2(x + 2) tem infinitas soluções. Justifique.",
            ],
          },
          {
            title: "Gabarito comentado",
            items: [
              "1) x = 5",
              "2) 3x = 15 → x = 5",
              "3) x + 3 = 9 → x = 6",
              "4) x/4 = 5 → x = 20",
              "5) 6x − 3 = x + 12 → 5x = 15 → x = 3",
              "6) 0,5x = 5 → x = 10",
              "7) x + (x+1) + (x+2) = 48 → x = 15; maior = 17",
              "8) i + m = 30; 20i + 12m = 480 → 10 meias",
              "9) 2l + 2(2l) = 54 → l = 9; comprimento = 18 cm",
              "10) P = 3L; P+10 = 2(L+10) → L = 10; P = 30",
              "11) n + 5n = 72 → n = 12",
              "12) x/2 + 15 = 39 → x = 48",
              "13) 2s + s + (s−40) = 240 → s = 70; valores: 140, 70, 30",
              "14) x + 25 = 3x e x − 15 = x/2 → x = 30 litros",
              "15) V — ambos os lados são iguais para qualquer x (identidade).",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-plano-aula-fotossintese-6ano",
    title: "Plano de aula — Fotossíntese (6º ano)",
    description:
      "Aula investigativa completa sobre fotossíntese: hipóteses, experimento com iodo, registro científico, avaliação com rubrica e extensão interdisciplinar com Geografia (desmatamento).",
    etapa: "Ensino Fundamental",
    anoSerie: "6º ano",
    componente: "Ciências",
    tipoMaterial: "Planejamento",
    categoria: "plano-aula",
    tema: "Fotossíntese",
    finalidade: "Investigação científica e compreensão de processos vitais",
    nivelDificuldade: "Básico",
    duracao: "2 × 50 min",
    habilidadesBncc: ["EF06CI04", "EF06CI05", "EF06CI06"],
    tags: ["fotossíntese", "plantas", "6º ano", "ciências", "experimento"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 6º ano · Ciências · Plano curado Planify",
        metadata: {
          Tema: this.tema,
          Duração: this.duracao,
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Contextualização",
            content:
              "Os alunos já estudaram seres vivos e células. Agora investigam como as plantas produzem seu próprio alimento — processo fundamental para a vida na Terra e para a regulação do oxigênio atmosférico. A fotossíntese conecta Ciências com Geografia (florestas, clima) e Ética (preservação ambiental).",
          },
          {
            title: "Objetivos",
            items: [
              "Definir fotossíntese com vocabulário científico adequado.",
              "Identificar reagentes (água, CO₂, luz) e produtos (glicose, O₂).",
              "Relacionar cloroplastos à produção de amido nas folhas.",
              "Registrar experimento no caderno com estrutura de relatório simples.",
              "Argumentar sobre a importância das plantas para a cadeia alimentar.",
            ],
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF06CI04 — Associar a produção de alimentos ao processo de fotossíntese.",
              "EF06CI05 — Explicar a importância da camada de ozônio para a vida na Terra.",
              "EF06CI06 — Relacionar o processo de fotossíntese à manutenção da vida na Terra.",
            ],
          },
          {
            title: "Materiais",
            items: [
              "Folhas de espinafre ou couve (frescas)",
              "Álcool etílico 70% (uso exclusivo do professor — manuseio em capela ou ventilação)",
              "Água, béqueres, pinça, tripé e tela de amianto",
              "Recipiente transparente, lâmpada ou luz solar",
              "Iodo (solução) para teste de amido",
              "Fichas de registro científico",
            ],
          },
          {
            title: "Aula 1 — O que as plantas 'comem'? (50 min)",
            items: [
              "Problematização (10 min): 'De onde vem o alimento das plantas?' — registro de hipóteses no quadro.",
              "Explicação dialogada (15 min): reagentes e produtos; esquema no quadro (luz + CO₂ + H₂O → glicose + O₂).",
              "Demonstração (20 min): teste de iodo em folha exposta à luz vs. folha privada de luz (24h antes). Professor conduz aquecimento com álcool para retirar clorofila (segurança!).",
              "Síntese (5 min): qual hipótese foi confirmada? Atualizar caderno.",
            ],
          },
          {
            title: "Aula 2 — Fotossíntese e vida no planeta (50 min)",
            items: [
              "Retomada (5 min): quiz oral — 3 perguntas rápidas.",
              "Leitura (15 min): texto sobre florestas como 'pulmões do planeta' (conexão com desmatamento).",
              "Estações (20 min): grupos montam cartaz — cadeia alimentar com produtor fotossintético em destaque.",
              "Avaliação (10 min): entrega da ficha de registro + autoavaliação.",
            ],
          },
          {
            title: "Ficha de registro científico (modelo)",
            items: [
              "Hipótese: _______________________________________",
              "Materiais utilizados: _____________________________",
              "Procedimento (passo a passo): ____________________",
              "Resultado observado: _____________________________",
              "Conclusão (a fotossíntese produz amido?): _________",
              "Importância para o ecossistema: __________________",
            ],
          },
          {
            title: "Avaliação e rubrica",
            content:
              "Ficha de registro (60%): hipótese coerente, procedimento descrito, conclusão correta.\nParticipação (20%): engajamento na demonstração e debate.\nCartaz (20%): presença de produtor, consumidores e relação com fotossíntese.\n\nRubrica ficha: 4 = completa e correta; 3 = pequenas lacunas; 2 = conclusão parcial; 1 = incompleta.",
          },
          {
            title: "Segurança",
            content:
              "Álcool é inflamável — aquecer em banho-maria, nunca chama direta. Ventilação adequada. Iodo manchante — avental e óculos. Folhas devem ser descartadas após o experimento.",
          },
        ],
      };
    },
  },
  {
    slug: "pacote-resumo-brasil-colonia-7ano",
    title: "Resumo — Brasil Colônia (7º ano)",
    description:
      "Síntese aprofundada da colonização portuguesa: períodos, economia açucareira e mineradora, sociedade colonial, revoltas e 10 questões dissertativas com orientações de resposta.",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "História",
    tipoMaterial: "Material de apoio",
    categoria: "resumo",
    tema: "Brasil Colônia",
    finalidade: "Revisão sistemática e preparação para avaliação",
    nivelDificuldade: "Intermediário",
    duracao: "2 aulas de 50 min",
    habilidadesBncc: ["EF07HI01", "EF07HI02", "EF07HI03"],
    tags: ["brasil colônia", "resumo", "7º ano", "história", "colonização"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 7º ano · História · Material curado Planify",
        metadata: {
          Tema: this.tema,
          BNCC: this.habilidadesBncc.join(", "),
          Período: "1500–1822",
        },
        sections: [
          {
            title: "Introdução",
            content:
              "O período colonial brasileiro (1500–1822) forma a base da sociedade brasileira atual. Compreender a lógica da colonização — extração de riquezas para Portugal, escravidão africana, latifúndio e poder da Igreja — é essencial para analisar desigualdades contemporâneas.",
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF07HI01 — Explicar o significado de modernidade e as transformações ocorridas no período moderno na Europa.",
              "EF07HI02 — Identificar conexões e interações entre a sociedade europeia e as sociedades americanas e africanas.",
              "EF07HI03 — Identificar as especificidades políticas, sociais e econômicas de povos ameríndios e africanos e suas estratégias de resistência.",
            ],
          },
          {
            title: "Chegada e organização territorial",
            items: [
              "1500 — Chegada da esquadra de Cabral; contato com indígenas Tupi-Guarani na costa.",
              "1500–1530 — 'Brasil presa': extração de pau-brasil com índios e europeus (índios medeiros).",
              "1534 — Capitanias hereditárias (falham na maior parte); somente Pernambuco e São Vicente prosperam.",
              "1549 — Governo Geral na Bahia — centralização administrativa.",
              "Tratado de Tordesilhas (1494) — divisão das Américas entre Portugal e Espanha (meridiano 370 léguas).",
            ],
          },
          {
            title: "Ciclos econômicos",
            items: [
              "Açúcar (séc. XVI–XVII): litoral nordestino, engenhos, latifúndio canavieiro, mão de obra escravizada (índia depois africana).",
              "Ouro (séc. XVIII): Minas Gerais, Goiás, Mato Grosso — interiorização, vilas mineiras, Caminho Novo.",
              "Consequências: concentração de riqueza, surgimento de elite rural, comércio com Europa via Lisboa.",
            ],
          },
          {
            title: "Sociedade colonial — estamentos",
            items: [
              "Elite branca: senhores de engenho, mineradores, comerciantes portugueses.",
              "Clero: educação, catequese, influência moral e política.",
              "Povo livre pobre: pequenos agricultores, artesãos, tropeiros.",
              "Escravizados africanos: base do trabalho nas engenhos e minas — resistências: quilombos, capoeira, religiosidade.",
              "Indígenas: catequese, aldeamentos, trabalho forçado, genocídio e aculturação.",
            ],
          },
          {
            title: "Administração e revoltas",
            items: [
              "1763 — Transferência da capital para o Rio de Janeiro (aproximação das minas).",
              "1789 — Inconfidência Mineira (conspiração republicana frustrada).",
              "1798 — Conjuração Baiana (influência jacobina, participação de negros e mulheres).",
              "1684 — Revolta de Beckman (Maranhão — contra monopólio da Companhia de Comércio).",
              "Jesuitas expulsos em 1759 (Pombal) — educação e proteção indígena reduzidas.",
            ],
          },
          {
            title: "Questões para fixação",
            items: [
              "1) Por que Portugal demorou a colonizar efetivamente o Brasil (1530)?",
              "2) Explique o sistema de capitanias hereditárias e por que fracassou.",
              "3) Descreva o funcionamento de um engenho de açúcar.",
              "4) Por que a mão de obra escravizada africana substituiu a indígena?",
              "5) Quais foram os impactos do ciclo do ouro na geografia brasileira?",
              "6) O que foi a Inconfidência Mineira e quais ideais a motivaram?",
              "7) Compare escravidão indígena e africana no Brasil colonial.",
              "8) Qual o papel dos jesuítas na colonização?",
              "9) O que significava o Tratado de Tordesilhas na prática?",
              "10) Como a estrutura colonial explica desigualdades regionais atuais?",
            ],
          },
          {
            title: "Orientações de resposta (professor)",
            items: [
              "1) Interesse inicial só no pau-brasil; guerras na Europa; falta de recursos.",
              "2) Divisão em faixas de terra para donatários; isolamento, ataques indígenas, falta de investimento.",
              "3) Produção em etapas: cana → moagem → cozimento → açúcar mascavo; trabalho escravizado.",
              "4) Resistência indígena, doenças, fuga; tráfico africano já estruturado pelo Atlântico.",
              "5) Povoamento do interior, vilas, estradas, Rio como capital.",
              "6) Conspiração em Vila Rica; influência do Iluminismo; insatisfação com metas de ouro para Portugal.",
              "7) Indígenas: legalmente proibido em alguns períodos; africanos: comércio transatlântico sistemático.",
              "8) Catequese, educação, defesa de aldeamentos, língua geral.",
              "9) Divisão de influência ibérica; linha atravessava o Brasil atual.",
              "10) Nordeste/Sudeste concentraram riqueza colonial; interior menos integrado.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-atividade-proporcionalidade-7ano",
    title: "Atividade — Proporcionalidade (7º ano)",
    description:
      "Sequência didática com teoria, 14 situações-problema de proporcionalidade direta e inversa, tabelas de organização e desafios contextualizados com gabarito.",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "Matemática",
    tipoMaterial: "Atividade",
    categoria: "atividade",
    tema: "Proporcionalidade",
    finalidade: "Aplicação em contextos reais e preparação para regra de três",
    nivelDificuldade: "Intermediário",
    duracao: "2 × 45 min",
    habilidadesBncc: ["EF07MA17", "EF07MA18"],
    tags: ["proporcionalidade", "regra de três", "7º ano", "matemática"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 7º ano · Matemática · Atividade curada Planify",
        metadata: {
          Tema: this.tema,
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Teoria resumida",
            items: [
              "Grandezas diretamente proporcionais: quando uma dobra, a outra também dobra (ex.: kg de arroz e preço).",
              "Grandezas inversamente proporcionais: quando uma dobra, a outra cai pela metade (ex.: operários e tempo para pintar).",
              "Regra de três simples: montar proporção, multiplicar em cruz, isolar a incógnita.",
              "Atenção: identificar o tipo de proporcionalidade antes de calcular!",
            ],
          },
          {
            title: "Proporcionalidade direta — Exercícios",
            items: [
              "1) Se 4 cadernos custam R$ 28,00, quanto custam 7 cadernos do mesmo tipo?",
              "2) Uma receita usa 3 ovos para 12 brigadeiros. Quantos ovos para 36 brigadeiros?",
              "3) Um carro consome 8 litros de gasolina para 100 km. Quantos litros para 350 km?",
              "4) Em um mapa na escala 1:200.000, duas cidades distam 5 cm. Qual a distância real em km?",
              "5) Uma torneira enche um tanque a uma vazão constante: 15 litros em 3 minutos. Quanto tempo para 60 litros?",
              "6) Se 5 máquinas produzem 200 peças em 1 hora, quantas peças 8 máquinas produzem na mesma hora?",
            ],
          },
          {
            title: "Proporcionalidade inversa — Exercícios",
            items: [
              "7) 4 operários pintam um muro em 9 horas. Em quanto tempo 6 operários pintam o mesmo muro?",
              "8) Um carro a 60 km/h percorre um trecho em 2 horas. Quanto tempo a 80 km/h?",
              "9) 10 gramas de fermento levantam 2 kg de farinha. Quantos gramas para 5 kg?",
              "10) Uma escola tinha 3 professores para 120 alunos. Se a turma crescer para 200 alunos, quantos professores (na mesma proporção)?",
            ],
          },
          {
            title: "Misto — Identifique o tipo",
            items: [
              "11) Quanto maior a velocidade, menor o tempo de viagem (mesma distância). Direta ou inversa?",
              "12) Quanto mais litros de tinta, maior a área pintada. Direta ou inversa?",
              "13) Um ciclista percorre 24 km em 2 horas. Mantendo a velocidade, quanto percorre em 5 horas?",
              "14) (Desafio) Um mapa na escala 1:50.000 mostra duas cidades a 8 cm. Qual a distância real em km? Se um ciclista pedala a 20 km/h, quanto tempo leva entre as cidades?",
            ],
          },
          {
            title: "Gabarito",
            items: [
              "1) R$ 49,00",
              "2) 9 ovos",
              "3) 28 litros",
              "4) 10 km",
              "5) 12 minutos",
              "6) 320 peças",
              "7) 6 horas",
              "8) 1,5 hora (1h30)",
              "9) 25 gramas",
              "10) 5 professores",
              "11) Inversa",
              "12) Direta",
              "13) 60 km",
              "14) 4 km; 12 minutos",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-lista-celula-7ano",
    title: "Lista — Célula e organelas (7º ano)",
    description:
      "Avaliação formativa com 20 questões sobre biologia celular: múltipla escolha, V/F, associação, diagrama e questões discursivas, com gabarito e rubrica.",
    etapa: "Ensino Fundamental",
    anoSerie: "7º ano",
    componente: "Ciências",
    tipoMaterial: "Atividade",
    categoria: "lista",
    tema: "Célula",
    finalidade: "Fixação e avaliação de biologia celular",
    nivelDificuldade: "Intermediário",
    duracao: "50 min",
    habilidadesBncc: ["EF06CI05", "EF06CI06"],
    tags: ["célula", "organelas", "7º ano", "ciências", "biologia"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 7º ano · Ciências · Lista curada Planify",
        metadata: {
          Tema: this.tema,
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Habilidades BNCC",
            items: [
              "EF06CI05 — Explicar a organização básica das células e seu papel como unidade estrutural e funcional dos seres vivos.",
              "EF06CI06 — Concluir, com base em modelos, que os organismos são um complexo arranjo de sistemas com diferentes níveis de organização.",
            ],
          },
          {
            title: "Parte A — Múltipla escolha",
            items: [
              "1) A unidade estrutural e funcional dos seres vivos é:",
              "   a) Tecido  b) Órgão  c) Célula  d) Sistema",
              "2) A organela responsável pela respiração celular (produção de energia) é:",
              "   a) Cloroplasto  b) Mitocôndria  c) Núcleo  d) Vacúolo",
              "3) Onde ocorre a fotossíntese nas células vegetais?",
              "   a) Mitocôndria  b) Ribossomo  c) Cloroplasto  d) Lisossomo",
              "4) Estrutura presente na célula vegetal e ausente na animal:",
              "   a) Membrana plasmática  b) Parede celular  c) Citoplasma  d) Núcleo",
              "5) A organela que contém o material genético (DNA) é:",
              "   a) Ribossomo  b) Retículo endoplasmático  c) Núcleo  d) Golgi",
            ],
          },
          {
            title: "Parte B — Verdadeiro ou falso",
            items: [
              "6) ( ) Todas as células possuem parede celular.",
              "7) ( ) Os ribossomos participam da síntese de proteínas.",
              "8) ( ) Células animais realizam fotossíntese.",
              "9) ( ) O vacúolo em células vegetais pode armazenar água e substâncias.",
              "10) ( ) A membrana plasmática controla a entrada e saída de substâncias.",
            ],
          },
          {
            title: "Parte C — Associe coluna",
            content:
              "Coluna A: Mitocôndria | Cloroplasto | Núcleo | Ribossomos | Membrana plasmática\nColuna B: ( ) Síntese de proteínas ( ) Controle genético ( ) Respiração celular ( ) Fotossíntese ( ) Permeabilidade seletiva",
          },
          {
            title: "Parte D — Discursivas",
            items: [
              "11) Defina célula com suas próprias palavras.",
              "12) Cite duas diferenças entre célula animal e vegetal.",
              "13) Por que a célula é chamada de unidade da vida?",
              "14) Explique a função do núcleo.",
              "15) Descreva o que aconteceria se uma célula perdesse suas mitocôndrias.",
            ],
          },
          {
            title: "Parte E — Diagrama",
            content:
              "16) Esboce e rotule uma célula vegetal indicando: parede celular, membrana plasmática, núcleo, cloroplasto, vacúolo e citoplasma. Use cores se desejar.",
          },
          {
            title: "Gabarito",
            items: [
              "1-c  2-b  3-c  4-b  5-c",
              "6-F  7-V  8-F  9-V  10-V",
              "Associação: Ribossomos | Núcleo | Mitocôndria | Cloroplasto | Membrana",
              "11–15: avaliar clareza e correção conceitual.",
              "16: 6 estruturas corretamente rotuladas.",
            ],
          },
        ],
      };
    },
  },
  {
    slug: "pacote-plano-aula-democracia-9ano",
    title: "Plano de aula — Democracia e cidadania (9º ano)",
    description:
      "Sequência de 2 aulas sobre democracia contemporânea: leitura da Constituição, estudo de caso de movimentos sociais, debate estruturado e avaliação por portfólio reflexivo.",
    etapa: "Ensino Fundamental",
    anoSerie: "9º ano",
    componente: "História",
    tipoMaterial: "Planejamento",
    categoria: "plano-aula",
    tema: "Democracia e cidadania",
    finalidade: "Formação para cidadania e participação política",
    nivelDificuldade: "Intermediário",
    duracao: "2 × 50 min",
    habilidadesBncc: ["EF09HI01", "EF09HI02", "EF09HI03"],
    tags: ["democracia", "cidadania", "9º ano", "história", "constituição"],
    buildSpec() {
      return {
        title: this.title,
        subtitle: "Ensino Fundamental · 9º ano · História · Plano curado Planify",
        metadata: {
          Tema: this.tema,
          Duração: this.duracao,
          BNCC: this.habilidadesBncc.join(", "),
        },
        sections: [
          {
            title: "Justificativa",
            content:
              "Adolescentes de 15 anos estão a um passo do voto (16 anos é facultativo no Brasil). Compreender democracia, direitos fundamentais e canais de participação é formação essencial para o exercício da cidadania. O plano articula História com Ensino Religioso/Ética e Língua Portuguesa (leitura de textos legais).",
          },
          {
            title: "Objetivos",
            items: [
              "Diferenciar democracia direta, representativa e participativa com exemplos.",
              "Identificar direitos fundamentais na Constituição de 1988.",
              "Analisar um movimento social brasileiro e seu papel na democracia.",
              "Propor formas de participação cidadã para jovens de 14–17 anos.",
              "Produzir texto reflexivo argumentativo sobre um direito fundamental.",
            ],
          },
          {
            title: "Habilidades BNCC",
            items: [
              "EF09HI01 — Identificar e analisar processos e lutas sociais e políticas da contemporaneidade.",
              "EF09HI02 — Identificar e analisar as demandas e os protagonismos de movimentos sociais.",
              "EF09HI03 — Identificar e analisar as dinâmicas dos movimentos sociais que contribuíram para mudanças ou rupturas.",
            ],
          },
          {
            title: "Recursos",
            items: [
              "Cópias do art. 1º a 5º da Constituição Federal (1988) — linguagem acessível",
              "Vídeo ou reportagem sobre movimento social (MST, movimento estudantil, LGBTQIA+, antirracista)",
              "Cartolina, marcadores, post-its",
              "Caderno para produção textual",
            ],
          },
          {
            title: "Aula 1 — O que é democracia? (50 min)",
            items: [
              "Aquecimento (8 min): 'O que é democracia para você?' — nuvem de palavras no quadro.",
              "Conceitos (15 min): democracia direta (assembleias na Grécia), representativa (voto para deputados/senadores), participativa (plebiscito, conselhos, audiências públicas).",
              "Leitura guiada (15 min): art. 1º ('Brasil é República...') e art. 5º (direitos fundamentais) — grifar 3 direitos que mais impactam a vida dos alunos.",
              "Debate (12 min): 'A democracia brasileira é plena?' — regras: respeito, tempo de fala, argumentos.",
            ],
          },
          {
            title: "Aula 2 — Cidadania em ação (50 min)",
            items: [
              "Estudo de caso (20 min): grupos recebem ficha sobre um movimento social (origem, demandas, conquistas). Preparam apresentação de 3 minutos.",
              "Apresentações (15 min): 4 grupos (3 min cada + 1 pergunta).",
              "Produção individual (10 min): texto de 10–15 linhas — 'Um direito fundamental que eu defendo e por quê'.",
              "Fechamento (5 min): professor destaca canais reais — grêmio, conselho tutelar, Ouvidoria, voto aos 16.",
            ],
          },
          {
            title: "Avaliação",
            items: [
              "Participação no debate (critérios: argumento, escuta, respeito) — 30%.",
              "Apresentação do movimento social (clareza, dados, conexão com democracia) — 30%.",
              "Texto reflexivo (coerência, argumentação, direito identificado) — 40%.",
            ],
          },
          {
            title: "Rubrica do texto reflexivo",
            content:
              "4 pts — Argumento claro, direito fundamentado na CF/88, exemplos do cotidiano.\n3 pts — Argumento presente, direito identificado, poucos exemplos.\n2 pts — Direito citado sem aprofundamento.\n1 pt — Texto incompleto ou fora do tema.",
          },
          {
            title: "Extensão (opcional)",
            content:
              "Pesquisa: entrevistar um familiar sobre a primeira eleição em que votou. Relatar em 1 parágrafo o que mudou na percepção de democracia.",
          },
        ],
      };
    },
  },
];
