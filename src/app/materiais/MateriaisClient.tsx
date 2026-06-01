"use client";

import Link from "next/link";
import { downloadDocxDocument } from "../../lib/downloads/docx-download-client";
import { useMemo, useState } from "react";

type MaterialType =
  | "atividade"
  | "prova"
  | "apostila"
  | "sequencia"
  | "jogo"
  | "projeto"
  | "roteiro";

type GameModel =
  | "caca_palavras"
  | "cruzadinha"
  | "bingo"
  | "memoria"
  | "domino"
  | "quiz"
  | "cartas";

type FormState = {
  titulo: string;
  escola: string;
  professor: string;
  etapa: string;
  anoSerie: string;
  areaConhecimento: string;
  componenteCurricular: string;
  tema: string;
  tipo: MaterialType;
  modeloJogo: GameModel;
  quantidadeQuestoes: string;
  duracao: string;
  objetivos: string;
  conteudos: string;
  orientacoes: string;
  observacoes: string;
};

type StatusState = {
  type: "idle" | "info" | "success" | "error";
  message: string;
};

type MaterialSection = {
  titulo: string;
  descricao?: string;
  conteudo?: string;
  itens?: string[];
};

type MaterialQuestion = {
  numero: number;
  tipo?: string;
  enunciado: string;
  alternativas?: string[];
  respostaEsperada?: string;
  criterioCorrecao?: string;
};

type GeneratedMaterial = {
  tipo: string;
  titulo: string;
  subtitulo?: string;
  resumo?: string;
  dadosGerais: {
    escola?: string;
    professor?: string;
    etapa?: string;
    anoSerie?: string;
    areaConhecimento?: string;
    componenteCurricular?: string;
    tema?: string;
    duracao?: string;
  };
  objetivos?: string[];
  conteudos?: string[];
  introducao?: string;
  orientacoesProfessor?: string[];
  orientacoesAluno?: string[];
  secoes?: MaterialSection[];
  questoes?: MaterialQuestion[];
  gabarito?: string[];
  jogo?: {
    nome: string;
    tipoJogo?: string;
    objetivo: string;
    materiais: string[];
    preparacao: string[];
    regras: string[];
    modoDeJogar: string[];
    variacoes?: string[];
    fechamento?: string;
  } | null;
  criteriosAvaliacao?: string[];
  adaptacoesInclusivas?: string[];
  sugestoesUso?: string[];
  alertas?: string[];
};

const initialForm: FormState = {
  titulo: "",
  escola: "",
  professor: "",
  etapa: "Ensino Fundamental",
  anoSerie: "",
  areaConhecimento: "",
  componenteCurricular: "",
  tema: "",
  tipo: "atividade",
  modeloJogo: "caca_palavras",
  quantidadeQuestoes: "10",
  duracao: "",
  objetivos: "",
  conteudos: "",
  orientacoes: "",
  observacoes: "",
};

const exemploAtividade: FormState = {
  titulo: "Atividade de leitura e interpretação",
  escola: "Escola Teste Planify",
  professor: "Professor(a)",
  etapa: "Ensino Fundamental",
  anoSerie: "5º ano",
  areaConhecimento: "",
  componenteCurricular: "Língua Portuguesa",
  tema: "Leitura e interpretação de textos",
  tipo: "atividade",
  modeloJogo: "caca_palavras",
  quantidadeQuestoes: "10",
  duracao: "2 períodos",
  objetivos: "Desenvolver leitura, interpretação e produção escrita.",
  conteudos:
    "Leitura de texto narrativo\nLocalização de informações explícitas\nInferência de sentidos\nProdução de respostas escritas",
  orientacoes:
    "Ler o texto com atenção, responder com frases completas e revisar a escrita antes de entregar.",
  observacoes: "Turma com foco em reforço de leitura.",
};

const exemploJogo: FormState = {
  titulo: "Jogo de revisão — Mundo hispânico",
  escola: "Escola Teste Planify",
  professor: "Professor(a)",
  etapa: "Ensino Médio",
  anoSerie: "1ª série",
  areaConhecimento: "Linguagens e suas Tecnologias",
  componenteCurricular: "Língua Espanhola",
  tema: "Países hispânicos, vocabulário e cultura",
  tipo: "jogo",
  modeloJogo: "bingo",
  quantidadeQuestoes: "",
  duracao: "1 período",
  objetivos:
    "Revisar conteúdos de Língua Espanhola por meio de uma dinâmica lúdica, colaborativa e avaliável.",
  conteudos:
    "Países hispânicos\nSaudações em espanhol\nVocabulário de apresentação\nCultura e diversidade\nVariação linguística",
  orientacoes:
    "Gerar um jogo pronto para imprimir, com instruções para o professor, instruções para os alunos, peças recortáveis e gabarito.",
  observacoes: "Material para uso em grupos, com socialização final e registro das aprendizagens.",
};

const etapaOptions = ["Educação Infantil", "Ensino Fundamental", "Ensino Médio"];

const anoSerieByEtapa: Record<string, string[]> = {
  "Educação Infantil": ["Creche", "Pré-escola"],
  "Ensino Fundamental": [
    "1º ano",
    "2º ano",
    "3º ano",
    "4º ano",
    "5º ano",
    "6º ano",
    "7º ano",
    "8º ano",
    "9º ano",
  ],
  "Ensino Médio": ["1ª série", "2ª série", "3ª série"],
};

const componentesByEtapa: Record<string, string[]> = {
  "Educação Infantil": [
    "Campos de experiências",
    "O eu, o outro e o nós",
    "Corpo, gestos e movimentos",
    "Traços, sons, cores e formas",
    "Escuta, fala, pensamento e imaginação",
    "Espaços, tempos, quantidades, relações e transformações",
  ],
  "Ensino Fundamental": [
    "Língua Portuguesa",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Língua Espanhola",
    "Matemática",
    "Ciências",
    "História",
    "Geografia",
    "Ensino Religioso",
  ],
  "Ensino Médio": [],
};

const areasEnsinoMedio = [
  "Linguagens e suas Tecnologias",
  "Matemática e suas Tecnologias",
  "Ciências da Natureza e suas Tecnologias",
  "Ciências Humanas e Sociais Aplicadas",
];

const componentesEnsinoMedio: Record<string, string[]> = {
  "Linguagens e suas Tecnologias": [
    "Língua Portuguesa",
    "Arte",
    "Educação Física",
    "Língua Inglesa",
    "Língua Espanhola",
  ],
  "Matemática e suas Tecnologias": ["Matemática"],
  "Ciências da Natureza e suas Tecnologias": ["Biologia", "Física", "Química"],
  "Ciências Humanas e Sociais Aplicadas": [
    "História",
    "Geografia",
    "Filosofia",
    "Sociologia",
  ],
};

const materialTypes: Array<{
  value: MaterialType;
  label: string;
  description: string;
}> = [
  {
    value: "atividade",
    label: "Atividade",
    description: "Exercícios, comandos e questões orientadas.",
  },
  {
    value: "prova",
    label: "Prova",
    description: "Avaliação com gabarito e critérios de correção.",
  },
  {
    value: "apostila",
    label: "Apostila",
    description: "Explicação didática, exemplos e atividades.",
  },
  {
    value: "sequencia",
    label: "Sequência didática",
    description: "Etapas de aula, mediações e avaliação.",
  },
  {
    value: "jogo",
    label: "Jogo pedagógico",
    description: "Jogos imprimíveis, editáveis, com peças e gabarito.",
  },
  {
    value: "projeto",
    label: "Projeto",
    description: "Problema norteador, etapas e produto final.",
  },
  {
    value: "roteiro",
    label: "Roteiro de estudo",
    description: "Orientações para estudo autônomo.",
  },
];

const gameModelOptions: Array<{
  value: GameModel;
  label: string;
  description: string;
}> = [
  {
    value: "caca_palavras",
    label: "Caça-palavras",
    description: "Grade pronta para imprimir, lista de palavras e gabarito.",
  },
  {
    value: "cruzadinha",
    label: "Cruzadinha",
    description: "Pistas numeradas, respostas e molde para preenchimento.",
  },
  {
    value: "bingo",
    label: "Bingo pedagógico",
    description: "Cartelas, comandos de sorteio e banco de conceitos.",
  },
  {
    value: "memoria",
    label: "Jogo da memória",
    description: "Pares de cartas recortáveis com conceito e pista.",
  },
  {
    value: "domino",
    label: "Dominó pedagógico",
    description: "Peças encadeadas com pergunta e resposta.",
  },
  {
    value: "quiz",
    label: "Quiz com gabarito",
    description: "Perguntas de revisão, pontuação e resposta esperada.",
  },
  {
    value: "cartas",
    label: "Cartas recortáveis",
    description: "Baralho pedagógico com desafios, pistas e comandos.",
  },
];

const typeLabels: Record<MaterialType, string> = {
  atividade: "Atividade",
  prova: "Prova",
  apostila: "Apostila",
  sequencia: "Sequência didática",
  jogo: "Jogo pedagógico",
  projeto: "Projeto",
  roteiro: "Roteiro de estudo",
};

const gameLabels: Record<GameModel, string> = {
  caca_palavras: "Caça-palavras",
  cruzadinha: "Cruzadinha",
  bingo: "Bingo pedagógico",
  memoria: "Jogo da memória",
  domino: "Dominó pedagógico",
  quiz: "Quiz com gabarito",
  cartas: "Cartas recortáveis",
};

function splitLines(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isEnsinoMedio(etapa: string) {
  return etapa === "Ensino Médio";
}

function needsQuestionQuantity(tipo: MaterialType) {
  return tipo === "atividade" || tipo === "prova";
}

function getComponentesDisponiveis(form: FormState) {
  if (isEnsinoMedio(form.etapa)) {
    return form.areaConhecimento
      ? componentesEnsinoMedio[form.areaConhecimento] || []
      : [];
  }

  return componentesByEtapa[form.etapa] || [];
}

function validateForm(form: FormState): string | null {
  if (!form.titulo.trim()) return "Informe o título do material.";
  if (!form.anoSerie) return "Selecione o ano/série.";
  if (isEnsinoMedio(form.etapa) && !form.areaConhecimento) {
    return "Selecione a área do conhecimento.";
  }
  if (!form.componenteCurricular) return "Selecione o componente curricular.";
  if (!form.tema.trim()) return "Informe o tema central.";
  if (form.tipo === "jogo" && !form.modeloJogo) {
    return "Selecione o modelo de jogo pedagógico.";
  }
  if (splitLines(form.conteudos).length === 0) {
    return "Informe ao menos um conteúdo.";
  }
  if (needsQuestionQuantity(form.tipo) && !form.quantidadeQuestoes.trim()) {
    return "Informe a quantidade de questões para atividade ou prova.";
  }

  return null;
}

function normalizeWord(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function uniqueItems(items: string[]) {
  return Array.from(
    new Map(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLocaleLowerCase("pt-BR"), item]),
    ).values(),
  );
}

function getGameTerms(form: FormState) {
  const conteudos = splitLines(form.conteudos);
  const base = uniqueItems([form.tema, ...conteudos]);
  const expanded = base.flatMap((item) => {
    const words = item
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && normalizeWord(word).length >= 4);

    return [item, ...words];
  });

  return uniqueItems(expanded).slice(0, 24);
}

function getPrintableWords(form: FormState) {
  const words = getGameTerms(form)
    .map(normalizeWord)
    .filter((word) => word.length >= 4 && word.length <= 14);

  return uniqueItems(words).slice(0, 12);
}

function buildWordSearch(words: string[]) {
  const size = 14;
  const grid = Array.from({ length: size }, () => Array.from({ length: size }, () => ""));
  const placed: string[] = [];
  const directions = [
    [0, 1],
    [1, 0],
    [1, 1],
  ];

  function canPlace(word: string, row: number, col: number, dr: number, dc: number) {
    for (let index = 0; index < word.length; index++) {
      const r = row + dr * index;
      const c = col + dc * index;

      if (r < 0 || c < 0 || r >= size || c >= size) return false;
      if (grid[r][c] && grid[r][c] !== word[index]) return false;
    }

    return true;
  }

  function place(word: string, row: number, col: number, dr: number, dc: number) {
    for (let index = 0; index < word.length; index++) {
      grid[row + dr * index][col + dc * index] = word[index];
    }
    placed.push(word);
  }

  words.forEach((word, wordIndex) => {
    for (let attempt = 0; attempt < size * size; attempt++) {
      const [dr, dc] = directions[(wordIndex + attempt) % directions.length];
      const row = (wordIndex * 3 + attempt) % size;
      const col = (wordIndex * 5 + attempt * 2) % size;

      if (canPlace(word, row, col, dr, dc)) {
        place(word, row, col, dr, dc);
        return;
      }
    }
  });

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) {
        grid[row][col] = letters[(row * 7 + col * 11) % letters.length];
      }
    }
  }

  return {
    placed,
    grid: grid.map((row) => row.join(" ")).join("\n"),
  };
}

function buildCards(terms: string[], label: string, count = 16) {
  const source = terms.length > 0 ? terms : ["Conceito", "Exemplo", "Aplicação", "Revisão"];

  return Array.from({ length: count }).map((_, index) => {
    const term = source[index % source.length];
    return `${label} ${index + 1}: ${term}`;
  });
}

function chunkItems(items: string[], size: number) {
  const chunks: string[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildBingoCards(terms: string[]) {
  const base = terms.length >= 8 ? terms : [...terms, "Conceito", "Exemplo", "Contexto", "Revisão", "Aplicação", "Síntese"];

  return Array.from({ length: 4 }).map((_, cardIndex) => {
    const cells = Array.from({ length: 16 }).map((__, cellIndex) => {
      return base[(cardIndex * 5 + cellIndex * 2) % base.length];
    });
    const rows = chunkItems(cells, 4)
      .map((row) => `| ${row.join(" | ")} |`)
      .join("\n");

    return `Cartela ${cardIndex + 1}\n| ${["B", "I", "N", "G"].join(" | ")} |\n${rows}`;
  });
}

function buildGameMaterial(form: FormState): GeneratedMaterial {
  const terms = getGameTerms(form);
  const words = getPrintableWords(form);
  const gameLabel = gameLabels[form.modeloJogo];
  const baseTitle = form.titulo || `${gameLabel} — ${form.tema}`;
  const objetivos = splitLines(form.objetivos).length
    ? splitLines(form.objetivos)
    : [
        `Revisar o tema ${form.tema} de forma lúdica, colaborativa e avaliável.`,
        "Promover participação, registro de aprendizagem e socialização das respostas.",
      ];

  const commonTeacher = [
    "Imprima o material e recorte as peças quando houver indicação.",
    "Explique as regras antes do início e faça uma rodada demonstrativa.",
    "Organize os estudantes individualmente, em duplas ou grupos conforme o tempo disponível.",
    "Finalize com correção coletiva, registro das aprendizagens e retomada dos pontos de dificuldade.",
  ];

  let secoes: MaterialSection[] = [];
  let gabarito: string[] = [];
  let materiais = ["Material impresso", "Tesoura sem ponta quando houver recorte", "Lápis ou caneta", "Quadro para socialização"];
  let regras = [
    "Participar respeitando a vez de cada colega ou grupo.",
    "Registrar as respostas e justificar quando solicitado.",
    "Pontuar respostas corretas e revisar coletivamente os erros ao final.",
  ];
  let modoDeJogar = [
    "Distribua o material aos estudantes.",
    "Leia as instruções em voz alta.",
    "Realize a atividade em tempo combinado.",
    "Conclua com socialização e correção coletiva.",
  ];

  if (form.modeloJogo === "caca_palavras") {
    const wordSearch = buildWordSearch(words);
    materiais = ["Grade do caça-palavras impressa", "Lista de palavras", "Lápis colorido", "Gabarito do professor"];
    modoDeJogar = [
      "Entregue a grade e a lista de palavras aos estudantes.",
      "Oriente que encontrem e circulem as palavras relacionadas ao conteúdo.",
      "Peça que escolham três palavras e expliquem sua relação com o tema.",
      "Corrija coletivamente usando o gabarito.",
    ];
    secoes = [
      {
        titulo: "Material para imprimir — Caça-palavras",
        conteudo: `Encontre na grade as palavras relacionadas ao tema.\n\n${wordSearch.grid}`,
        itens: wordSearch.placed,
      },
      {
        titulo: "Desafio de registro",
        conteudo:
          "Depois de encontrar as palavras, escolha três delas e escreva uma frase explicando sua relação com o conteúdo estudado.",
        itens: ["Palavra 1: ________________________________", "Palavra 2: ________________________________", "Palavra 3: ________________________________"],
      },
    ];
    gabarito = wordSearch.placed.map((word) => `Palavra presente no caça-palavras: ${word}.`);
  }

  if (form.modeloJogo === "cruzadinha") {
    const answers = terms.slice(0, 12);
    materiais = ["Folha da cruzadinha", "Banco de pistas", "Lápis", "Gabarito do professor"];
    modoDeJogar = [
      "Entregue as pistas numeradas aos estudantes.",
      "Oriente que preencham cada resposta nos espaços correspondentes.",
      "Permita consulta ao caderno nos minutos finais se desejar transformar em revisão orientada.",
      "Corrija coletivamente destacando os conceitos mais importantes.",
    ];
    secoes = [
      {
        titulo: "Cruzadinha — pistas para os alunos",
        conteudo: "Leia cada pista e escreva a resposta no espaço indicado.",
        itens: answers.map((answer, index) => `${index + 1}. Conceito relacionado a: ${answer}. (${normalizeWord(answer).length || answer.length} letras)`),
      },
      {
        titulo: "Molde de preenchimento",
        conteudo: answers
          .map((answer, index) => `${index + 1}. ${"_ ".repeat(Math.max(4, Math.min(18, normalizeWord(answer).length || answer.length))).trim()}`)
          .join("\n"),
      },
    ];
    gabarito = answers.map((answer, index) => `${index + 1}. ${answer}`);
  }

  if (form.modeloJogo === "bingo") {
    const cards = buildBingoCards(terms.slice(0, 18));
    materiais = ["Cartelas de bingo", "Fichas ou marcadores", "Lista de sorteio", "Gabarito do professor"];
    regras = [
      "Cada estudante ou grupo recebe uma cartela.",
      "O professor sorteia pistas, conceitos ou exemplos.",
      "Os estudantes marcam na cartela o termo correspondente.",
      "Vence quem completar linha, coluna ou cartela inteira, conforme a regra escolhida.",
    ];
    modoDeJogar = [
      "Distribua uma cartela por estudante, dupla ou grupo.",
      "Sorteie um item da lista e leia uma pista relacionada ao conteúdo.",
      "Peça que os estudantes justifiquem oralmente algumas marcações.",
      "Ao final, confira as cartelas vencedoras e retome os conceitos.",
    ];
    secoes = [
      {
        titulo: "Cartelas para imprimir",
        conteudo: cards.join("\n\n"),
      },
      {
        titulo: "Lista de sorteio do professor",
        conteudo: "Recorte ou leia os itens abaixo durante a partida.",
        itens: terms.slice(0, 24),
      },
    ];
    gabarito = terms.slice(0, 24).map((term) => `Item de sorteio: ${term}.`);
  }

  if (form.modeloJogo === "memoria") {
    const pairs = terms.slice(0, 12);
    materiais = ["Cartas recortáveis", "Envelope ou saquinho para guardar as cartas", "Mesa ou chão para organizar as peças"];
    regras = [
      "As cartas ficam viradas para baixo.",
      "Na sua vez, o estudante vira duas cartas.",
      "O par é formado por conceito e pista correspondente.",
      "Quem formar o par precisa explicar a relação entre as cartas.",
    ];
    secoes = [
      {
        titulo: "Cartas recortáveis — conceitos",
        conteudo: "Recorte cada carta na linha pontilhada.",
        itens: pairs.map((term, index) => `Carta A${index + 1}: ${term}`),
      },
      {
        titulo: "Cartas recortáveis — pistas",
        conteudo: "Misture com as cartas de conceito para formar os pares.",
        itens: pairs.map((term, index) => `Carta B${index + 1}: pista ou exemplo relacionado a ${term}.`),
      },
    ];
    gabarito = pairs.map((term, index) => `Par ${index + 1}: Carta A${index + 1} combina com Carta B${index + 1} — ${term}.`);
  }

  if (form.modeloJogo === "domino") {
    const pieces = terms.slice(0, 14);
    materiais = ["Peças de dominó impressas", "Tesoura", "Mesa para montagem do percurso", "Gabarito do professor"];
    regras = [
      "Cada peça tem uma resposta de um lado e uma pergunta de outro.",
      "Os estudantes devem encaixar a resposta correta na pergunta correspondente.",
      "O grupo precisa justificar cada encaixe antes de avançar.",
    ];
    secoes = [
      {
        titulo: "Peças recortáveis do dominó pedagógico",
        conteudo: "Recorte as peças. Cada linha representa uma peça do jogo.",
        itens: pieces.map((term, index) => {
          const next = pieces[(index + 1) % pieces.length] || term;
          return `Peça ${index + 1}: [${term}]  |  [Pergunta: qual conceito se relaciona a ${next}?]`;
        }),
      },
      {
        titulo: "Percurso sugerido",
        conteudo: "Monte a sequência unindo perguntas e respostas até fechar o ciclo do dominó.",
      },
    ];
    gabarito = pieces.map((term, index) => `Peça ${index + 1}: resposta esperada relacionada a ${term}.`);
  }

  if (form.modeloJogo === "quiz") {
    const questions = terms.slice(0, 12);
    materiais = ["Cartões de pergunta", "Folha de pontuação", "Gabarito do professor"];
    regras = [
      "Cada equipe responde uma pergunta por rodada.",
      "Resposta correta vale 1 ponto; justificativa bem explicada vale ponto extra.",
      "A equipe deve ouvir a correção e registrar o aprendizado.",
    ];
    secoes = [
      {
        titulo: "Cartões de perguntas para o quiz",
        conteudo: "Recorte os cartões ou leia as perguntas em voz alta.",
        itens: questions.map((term, index) => `Pergunta ${index + 1}: explique, identifique ou aplique o conceito ${term} em uma situação do conteúdo estudado.`),
      },
      {
        titulo: "Placar sugerido",
        conteudo:
          "Equipe: __________________ | Pontos: ______\nEquipe: __________________ | Pontos: ______\nEquipe: __________________ | Pontos: ______",
      },
    ];
    gabarito = questions.map((term, index) => `Pergunta ${index + 1}: resposta deve demonstrar compreensão de ${term} e relação com o tema ${form.tema}.`);
  }

  if (form.modeloJogo === "cartas") {
    const cards = buildCards(terms, "Carta", 24);
    materiais = ["Cartas recortáveis", "Envelope para armazenar", "Quadro para registrar respostas", "Gabarito do professor"];
    regras = [
      "Cada estudante ou grupo compra uma carta por rodada.",
      "A carta indica um desafio, uma explicação, um exemplo ou uma associação.",
      "O grupo responde e justifica para ganhar pontuação.",
      "O professor conduz a correção e retoma os conteúdos.",
    ];
    secoes = [
      {
        titulo: "Baralho pedagógico recortável",
        conteudo: "Recorte as cartas abaixo. Use como revisão, rotação por estações ou dinâmica de grupos.",
        itens: cards.map((card, index) => `${card} — desafio: explique, exemplifique ou relacione este item ao tema ${form.tema}.`),
      },
      {
        titulo: "Cartas especiais",
        conteudo:
          "Carta bônus: dê um exemplo prático.\nCarta desafio: explique para a turma.\nCarta troca: escolha outra carta.\nCarta síntese: escreva uma conclusão curta.",
      },
    ];
    gabarito = terms.slice(0, 12).map((term) => `Carta relacionada a ${term}: aceitar respostas coerentes, contextualizadas e com justificativa.`);
  }

  return {
    tipo: "jogo",
    titulo: baseTitle,
    subtitulo: `${gameLabel} — ${form.componenteCurricular}`,
    resumo: `Jogo pedagógico imprimível e editável para trabalhar ${form.tema}.`,
    dadosGerais: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      tema: form.tema,
      duracao: form.duracao,
    },
    objetivos,
    conteudos: splitLines(form.conteudos),
    introducao:
      "Material lúdico estruturado para impressão, aplicação em sala, registro da aprendizagem e edição no Planify Editor.",
    orientacoesProfessor: commonTeacher,
    orientacoesAluno: [
      "Leia as instruções antes de começar.",
      "Participe respeitando os colegas e justificando suas respostas.",
      "Registre dúvidas e aprendizagens para a correção coletiva.",
    ],
    secoes,
    questoes: [],
    gabarito,
    jogo: {
      nome: baseTitle,
      tipoJogo: gameLabel,
      objetivo: objetivos.join(" "),
      materiais,
      preparacao: [
        "Conferir o número de cópias conforme a quantidade de estudantes ou grupos.",
        "Recortar cartas, peças ou fichas quando necessário.",
        "Separar tempo para explicação, jogo e correção coletiva.",
      ],
      regras,
      modoDeJogar,
      variacoes: [
        "Aplicar individualmente como revisão silenciosa.",
        "Aplicar em duplas para favorecer argumentação.",
        "Transformar em competição saudável por equipes.",
        "Usar como estação de aprendizagem em aula rotativa.",
      ],
      fechamento:
        "Finalize com retomada dos conceitos, correção coletiva e registro de uma síntese no caderno.",
    },
    criteriosAvaliacao: [
      "Participação e colaboração durante o jogo.",
      "Compreensão dos conceitos trabalhados.",
      "Justificativa das respostas e uso adequado da linguagem do componente.",
      "Registro final das aprendizagens.",
    ],
    adaptacoesInclusivas: [
      "Permitir realização em dupla para estudantes que necessitam de apoio.",
      "Ler comandos em voz alta quando necessário.",
      "Ampliar fonte ou espaçamento do material antes de imprimir.",
    ],
    sugestoesUso: [
      "Usar como revisão antes de avaliação.",
      "Usar como retomada diagnóstica no início da aula.",
      "Enviar ao Editor para ajustar linguagem, quantidade de cartas ou layout de impressão.",
    ],
    alertas: [],
  };
}

function buildFallbackMaterial(form: FormState): GeneratedMaterial {
  if (form.tipo === "jogo") {
    return buildGameMaterial(form);
  }

  const conteudos = splitLines(form.conteudos);
  const quantidade = Number(form.quantidadeQuestoes) || 5;

  return {
    tipo: typeLabels[form.tipo],
    titulo: form.titulo,
    subtitulo: `${typeLabels[form.tipo]} — ${form.componenteCurricular}`,
    resumo: "Material estruturado para apoiar a prática docente com objetivos claros, organização didática e linguagem adequada à turma.",
    dadosGerais: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      tema: form.tema,
      duracao: form.duracao,
    },
    objetivos: splitLines(form.objetivos).length
      ? splitLines(form.objetivos)
      : [`Desenvolver aprendizagem sobre ${form.tema}.`],
    conteudos,
    introducao:
      "Material estruturado para apoiar a prática docente com objetivos claros, organização didática e linguagem adequada à turma.",
    orientacoesProfessor: [
      "Apresente os objetivos antes da atividade.",
      "Acompanhe a realização e registre dúvidas recorrentes.",
      "Finalize com correção coletiva e retomada dos pontos essenciais.",
    ],
    orientacoesAluno: [
      "Leia cada comando com atenção antes de responder.",
      "Registre suas respostas de forma organizada.",
      "Revise sua produção antes de entregar.",
    ],
    secoes: conteudos.map((conteudo, index) => ({
      titulo: `Seção ${index + 1}: ${conteudo}`,
      conteudo: `Atividades orientadas para desenvolver o conteúdo "${conteudo}" de forma progressiva e contextualizada.`,
      itens: [
        "Retomada do conhecimento prévio.",
        "Exploração guiada do conteúdo.",
        "Registro individual ou em grupo.",
        "Socialização das respostas.",
      ],
    })),
    questoes: needsQuestionQuantity(form.tipo)
      ? Array.from({ length: quantidade }).map((_, index) => ({
          numero: index + 1,
          tipo: "discursiva",
          enunciado: `Questão ${index + 1}: resolva uma situação relacionada ao tema "${form.tema}".`,
          alternativas: [],
          respostaEsperada:
            "Resposta coerente com o conteúdo estudado, com justificativa clara.",
          criterioCorrecao:
            "Considerar compreensão do comando, organização da resposta e relação com o conteúdo.",
        }))
      : [],
    gabarito: needsQuestionQuantity(form.tipo)
      ? Array.from({ length: quantidade }).map(
          (_, index) => `Questão ${index + 1}: resposta esperada conforme o conteúdo trabalhado.`,
        )
      : [],
    jogo: null,
    criteriosAvaliacao: [
      "Participação nas atividades propostas.",
      "Compreensão dos conteúdos trabalhados.",
      "Clareza e organização das respostas.",
      "Capacidade de argumentar e revisar a própria produção.",
    ],
    adaptacoesInclusivas: [
      "Permitir apoio em dupla quando necessário.",
      "Adaptar tempo, fonte ou quantidade conforme necessidade da turma.",
    ],
    sugestoesUso: ["Usar em sala, no reforço, no dever de casa ou como revisão."],
    alertas: [],
  };
}

function normalizeGeneratedMaterial(material: GeneratedMaterial, form: FormState): GeneratedMaterial {
  if (form.tipo === "jogo") {
    const hasGame = Boolean(material?.jogo?.nome && material?.jogo?.objetivo);
    const hasSections = Array.isArray(material?.secoes) && material.secoes.length > 0;

    if (!hasGame || !hasSections) {
      return buildGameMaterial(form);
    }
  }

  return {
    ...material,
    tipo: material.tipo || form.tipo,
    titulo: material.titulo || form.titulo,
    subtitulo: material.subtitulo || `${typeLabels[form.tipo]} — ${form.componenteCurricular}`,
    resumo: material.resumo || "Material didático gerado com base nos dados informados.",
    dadosGerais: {
      escola: form.escola,
      professor: form.professor,
      etapa: form.etapa,
      anoSerie: form.anoSerie,
      areaConhecimento: form.areaConhecimento,
      componenteCurricular: form.componenteCurricular,
      tema: form.tema,
      duracao: form.duracao,
      ...material.dadosGerais,
    },
    objetivos: material.objetivos || splitLines(form.objetivos),
    conteudos: material.conteudos || splitLines(form.conteudos),
    secoes: material.secoes || [],
    questoes: material.questoes || [],
    gabarito: material.gabarito || [],
    criteriosAvaliacao: material.criteriosAvaliacao || [],
    adaptacoesInclusivas: material.adaptacoesInclusivas || [],
    sugestoesUso: material.sugestoesUso || [],
    alertas: material.alertas || [],
  };
}

function saveToLocalHistory(material: GeneratedMaterial) {
  const item = {
    id: crypto.randomUUID(),
    type: "material",
    title: material.titulo,
    subtitle: `${material.tipo} • ${material.dadosGerais.componenteCurricular || "Componente não informado"}`,
    createdAt: new Date().toISOString(),
    content: material,
  };

  const key = "planify_history";
  const current = JSON.parse(localStorage.getItem(key) || "[]") as unknown[];
  localStorage.setItem(key, JSON.stringify([item, ...current].slice(0, 50)));
}

async function downloadDocument(material: GeneratedMaterial) {
  await downloadDocxDocument(
    "material",
    material,
    material.titulo || "material-planify",
  );
}

function renderList(items: string[] | undefined) {
  const valid = (items || []).filter(Boolean);
  if (valid.length === 0) return "";

  return `<ul>${valid.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function renderTextBlock(value: string | undefined) {
  const text = String(value || "").trim();
  if (!text) return "";

  if (text.includes("\n") && (text.includes("|") || /^[A-ZÁÉÍÓÚÑÇ ]+(\s+[A-ZÁÉÍÓÚÑÇ ])+/m.test(text))) {
    return `<pre style="white-space:pre-wrap;font-family:'Courier New',monospace;font-size:10pt;border:1px solid #cbd5e1;padding:10px;border-radius:8px;">${escapeHtml(text)}</pre>`;
  }

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

function buildMaterialEditorHtml(material: GeneratedMaterial) {
  const dados = material.dadosGerais || {};
  const sections = material.secoes || [];
  const questions = material.questoes || [];
  const title = material.titulo || "Material Planify";

  return `
<article class="planify-doc">
  <h1>${escapeHtml(title)}</h1>
  ${material.subtitulo ? `<p><em>${escapeHtml(material.subtitulo)}</em></p>` : ""}
  ${material.resumo ? `<p>${escapeHtml(material.resumo)}</p>` : ""}

  <h2>Dados gerais</h2>
  <table>
    <tbody>
      ${[
        ["Escola", dados.escola],
        ["Professor", dados.professor],
        ["Etapa", dados.etapa],
        ["Ano/Série", dados.anoSerie],
        ["Área do conhecimento", dados.areaConhecimento],
        ["Componente curricular", dados.componenteCurricular],
        ["Tema", dados.tema],
        ["Duração", dados.duracao],
      ]
        .filter(([, value]) => String(value || "").trim())
        .map(
          ([label, value]) => `
      <tr>
        <td><strong>${escapeHtml(label)}</strong></td>
        <td>${escapeHtml(value)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  ${material.introducao ? `<h2>Introdução</h2>${renderTextBlock(material.introducao)}` : ""}
  ${(material.objetivos || []).length ? `<h2>Objetivos</h2>${renderList(material.objetivos)}` : ""}
  ${(material.conteudos || []).length ? `<h2>Conteúdos</h2>${renderList(material.conteudos)}` : ""}
  ${(material.orientacoesProfessor || []).length ? `<h2>Orientações ao professor</h2>${renderList(material.orientacoesProfessor)}` : ""}
  ${(material.orientacoesAluno || []).length ? `<h2>Orientações aos alunos</h2>${renderList(material.orientacoesAluno)}` : ""}

  ${material.jogo ? `
    <h2>Jogo pedagógico</h2>
    <p><strong>Modelo:</strong> ${escapeHtml(material.jogo.tipoJogo || "Jogo pedagógico")}</p>
    <p><strong>Objetivo:</strong> ${escapeHtml(material.jogo.objetivo)}</p>
    <h3>Materiais</h3>${renderList(material.jogo.materiais)}
    <h3>Preparação</h3>${renderList(material.jogo.preparacao)}
    <h3>Regras</h3>${renderList(material.jogo.regras)}
    <h3>Modo de jogar</h3>${renderList(material.jogo.modoDeJogar)}
    ${(material.jogo.variacoes || []).length ? `<h3>Variações</h3>${renderList(material.jogo.variacoes)}` : ""}
    ${material.jogo.fechamento ? `<h3>Fechamento</h3>${renderTextBlock(material.jogo.fechamento)}` : ""}
  ` : ""}

  ${sections
    .map((section, index) => {
      const content = section.conteudo || section.descricao || "";
      return `
        <h2>${index + 1}. ${escapeHtml(section.titulo || "Seção")}</h2>
        ${renderTextBlock(content)}
        ${renderList(section.itens)}
      `;
    })
    .join("")}

  ${questions.length ? `
    <h2>Questões</h2>
    ${questions
      .map(
        (question) => `
        <h3>Questão ${question.numero}</h3>
        <p>${escapeHtml(question.enunciado)}</p>
        ${renderList(question.alternativas)}
        ${question.respostaEsperada ? `<p><strong>Resposta esperada:</strong> ${escapeHtml(question.respostaEsperada)}</p>` : ""}
        ${question.criterioCorrecao ? `<p><strong>Critério de correção:</strong> ${escapeHtml(question.criterioCorrecao)}</p>` : ""}
      `,
      )
      .join("")}
  ` : ""}

  ${(material.gabarito || []).length ? `<h2>Gabarito</h2>${renderList(material.gabarito)}` : ""}
  ${(material.criteriosAvaliacao || []).length ? `<h2>Critérios de avaliação</h2>${renderList(material.criteriosAvaliacao)}` : ""}
  ${(material.adaptacoesInclusivas || []).length ? `<h2>Adaptações inclusivas</h2>${renderList(material.adaptacoesInclusivas)}` : ""}
  ${(material.sugestoesUso || []).length ? `<h2>Sugestões de uso</h2>${renderList(material.sugestoesUso)}` : ""}
</article>
`.trim();
}

export function MateriaisClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<StatusState>({
    type: "idle",
    message: "Aguardando preenchimento.",
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMaterial, setGeneratedMaterial] =
    useState<GeneratedMaterial | null>(null);

  const conteudos = useMemo(() => splitLines(form.conteudos), [form.conteudos]);
  const componentesDisponiveis = useMemo(
    () => getComponentesDisponiveis(form),
    [form],
  );
  const selectedGameModel = gameModelOptions.find((item) => item.value === form.modeloJogo);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "etapa") {
        next.anoSerie = "";
        next.areaConhecimento = "";
        next.componenteCurricular = "";
      }

      if (key === "areaConhecimento") {
        next.componenteCurricular = "";
      }

      if (key === "tipo" && value === "jogo") {
        next.quantidadeQuestoes = "";
        if (!next.modeloJogo) next.modeloJogo = "caca_palavras";
      }

      if (key === "tipo" && value !== "jogo" && !next.quantidadeQuestoes) {
        next.quantidadeQuestoes = "10";
      }

      return next;
    });
  }

  function clearAll() {
    setForm(initialForm);
    setGeneratedMaterial(null);
    setStatus({
      type: "idle",
      message: "Campos limpos. Preencha os dados para gerar um novo material.",
    });
  }

  function applyExample(type: "atividade" | "jogo") {
    setForm(type === "atividade" ? exemploAtividade : exemploJogo);
    setGeneratedMaterial(null);
    setStatus({
      type: "info",
      message:
        type === "atividade"
          ? "Exemplo de atividade aplicado."
          : "Exemplo de jogo aplicado. Escolha o modelo de jogo e gere o material imprimível.",
    });
  }

  async function generateMaterial() {
    const validation = validateForm(form);

    if (validation) {
      setStatus({
        type: "error",
        message: validation,
      });
      return;
    }

    setIsGenerating(true);
    setStatus({
      type: "info",
      message:
        form.tipo === "jogo"
          ? `Gerando ${gameLabels[form.modeloJogo]} com IA pedagógica...`
          : "Gerando material didático com IA...",
    });

    try {
      const response = await fetch("/api/ai/material", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(
          result?.error?.message ||
            result?.message ||
            "Não foi possível gerar material com IA agora.",
        );
      }

      const material = normalizeGeneratedMaterial(
        (result.data || result.material) as GeneratedMaterial,
        form,
      );
      setGeneratedMaterial(material);
      saveToLocalHistory(material);
      setStatus({
        type: "success",
        message:
          form.tipo === "jogo"
            ? "Jogo pedagógico gerado. Você pode revisar, baixar DOCX ou abrir no Editor."
            : "Material gerado com IA. Você pode revisar, baixar ou enviar para o Editor.",
      });
    } catch (error) {
      const fallback = buildFallbackMaterial(form);
      setGeneratedMaterial(fallback);
      saveToLocalHistory(fallback);
      setStatus({
        type: "success",
        message:
          error instanceof Error
            ? `A IA não respondeu agora. Uma versão premium estruturada foi criada para não interromper seu fluxo. Detalhe: ${error.message}`
            : "Uma versão premium estruturada foi criada para não interromper seu fluxo.",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function openInEditor() {
    if (!generatedMaterial) {
      return;
    }

    const html = buildMaterialEditorHtml(generatedMaterial);

    localStorage.setItem(
      "planify_editor_document",
      JSON.stringify({
        type: "material",
        title: generatedMaterial.titulo || "Material Planify",
        html,
        content: html,
        updatedAt: new Date().toISOString(),
      }),
    );
    window.location.href = "/editor";
  }

  const statusClass =
    status.type === "success"
      ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
      : status.type === "error"
        ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
        : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";

  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[0.72fr_1.28fr] sm:px-8">
      <aside className="space-y-6">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-cyan-300/10 p-6 shadow-2xl shadow-cyan-500/10">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
            IA pedagógica
          </p>
          <h1 className="mt-4 text-3xl font-black text-white">
            Materiais com IA
          </h1>
          <p className="mt-4 text-sm leading-7 text-cyan-100/80">
            Gere atividades, provas, apostilas e jogos pedagógicos imprimíveis,
            editáveis e prontos para abrir no Editor.
          </p>

          <div className="mt-6 grid gap-3">
            {[
              ["Tipo", form.tipo === "jogo" ? selectedGameModel?.label || "Jogo" : typeLabels[form.tipo]],
              ["Conteúdos", String(conteudos.length)],
              [
                "Questões",
                needsQuestionQuantity(form.tipo)
                  ? form.quantidadeQuestoes || "0"
                  : "Não se aplica",
              ],
              ["IA", isGenerating ? "Gerando" : "Aguardando"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-slate-950/45 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={() => applyExample("atividade")}
              className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Exemplo de atividade
            </button>
            <button
              type="button"
              onClick={() => applyExample("jogo")}
              className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-5 py-4 text-sm font-black text-cyan-100 transition hover:-translate-y-1 hover:bg-cyan-300/20"
            >
              Exemplo de jogo premium
            </button>
          </div>
        </div>

        {form.tipo === "jogo" && (
          <div className="rounded-[2rem] border border-emerald-300/20 bg-emerald-300/10 p-6 shadow-2xl shadow-emerald-500/10">
            <p className="text-sm font-black uppercase tracking-[0.24em] text-emerald-200">
              Jogos de alto impacto
            </p>
            <div className="mt-4 grid gap-3">
              {gameModelOptions.map((game) => (
                <button
                  key={game.value}
                  type="button"
                  onClick={() => updateField("modeloJogo", game.value)}
                  className={`rounded-2xl border px-4 py-3 text-left transition hover:-translate-y-0.5 ${
                    form.modeloJogo === game.value
                      ? "border-emerald-200/60 bg-white text-slate-950"
                      : "border-white/10 bg-slate-950/40 text-emerald-50 hover:bg-white/10"
                  }`}
                >
                  <span className="block text-sm font-black">{game.label}</span>
                  <span className="mt-1 block text-xs leading-5 opacity-80">
                    {game.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`rounded-[1.5rem] border p-5 text-sm leading-7 ${statusClass}`}>
          <p className="font-black uppercase tracking-[0.2em]">Status</p>
          <p className="mt-2">{status.message}</p>
        </div>
      </aside>

      <div className="space-y-6">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300">
                Dados
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Informações do material
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Escolha o tipo, informe conteúdos claros e gere um material
                pronto para revisar, editar e imprimir.
              </p>
            </div>

            <button
              type="button"
              onClick={clearAll}
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Limpar tudo
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Título</span>
              <input
                value={form.titulo}
                onChange={(event) => updateField("titulo", event.target.value)}
                placeholder="Ex.: Bingo pedagógico de revisão"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Escola</span>
              <input
                value={form.escola}
                onChange={(event) => updateField("escola", event.target.value)}
                placeholder="Nome da escola"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Professor</span>
              <input
                value={form.professor}
                onChange={(event) => updateField("professor", event.target.value)}
                placeholder="Nome do professor"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Etapa</span>
              <select
                value={form.etapa}
                onChange={(event) => updateField("etapa", event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                {etapaOptions.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Ano/Série</span>
              <select
                value={form.anoSerie}
                onChange={(event) => updateField("anoSerie", event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                <option value="" className="bg-slate-950">
                  Selecione
                </option>
                {(anoSerieByEtapa[form.etapa] || []).map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            {isEnsinoMedio(form.etapa) && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">
                  Área do conhecimento
                </span>
                <select
                  value={form.areaConhecimento}
                  onChange={(event) => updateField("areaConhecimento", event.target.value)}
                  className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
                >
                  <option value="" className="bg-slate-950">
                    Selecione
                  </option>
                  {areasEnsinoMedio.map((item) => (
                    <option key={item} value={item} className="bg-slate-950">
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">
                Componente curricular
              </span>
              <select
                value={form.componenteCurricular}
                onChange={(event) => updateField("componenteCurricular", event.target.value)}
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                <option value="" className="bg-slate-950">
                  {isEnsinoMedio(form.etapa) && !form.areaConhecimento
                    ? "Selecione a área primeiro"
                    : "Selecione"}
                </option>
                {componentesDisponiveis.map((item) => (
                  <option key={item} value={item} className="bg-slate-950">
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Tipo</span>
              <select
                value={form.tipo}
                onChange={(event) => updateField("tipo", event.target.value as MaterialType)}
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-cyan-300/50"
              >
                {materialTypes.map((type) => (
                  <option key={type.value} value={type.value} className="bg-slate-950">
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            {form.tipo === "jogo" && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">
                  Modelo de jogo
                </span>
                <select
                  value={form.modeloJogo}
                  onChange={(event) => updateField("modeloJogo", event.target.value as GameModel)}
                  className="h-14 rounded-2xl border border-emerald-300/30 bg-slate-950/50 px-4 text-sm text-white outline-none transition focus:border-emerald-300/60"
                >
                  {gameModelOptions.map((game) => (
                    <option key={game.value} value={game.value} className="bg-slate-950">
                      {game.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Tema</span>
              <input
                value={form.tema}
                onChange={(event) => updateField("tema", event.target.value)}
                placeholder="Ex.: Leitura e interpretação de textos"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            {needsQuestionQuantity(form.tipo) && (
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-300">
                  Quantidade de questões
                </span>
                <input
                  value={form.quantidadeQuestoes}
                  onChange={(event) => updateField("quantidadeQuestoes", event.target.value)}
                  placeholder="10"
                  className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
                />
              </label>
            )}

            <label className="grid gap-2">
              <span className="text-sm font-bold text-slate-300">Duração</span>
              <input
                value={form.duracao}
                onChange={(event) => updateField("duracao", event.target.value)}
                placeholder="Ex.: 2 períodos"
                className="h-14 rounded-2xl border border-white/10 bg-slate-950/50 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            {form.tipo === "jogo" && selectedGameModel && (
              <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 md:col-span-2">
                <p className="text-sm font-black text-emerald-100">
                  {selectedGameModel.label}
                </p>
                <p className="mt-1 text-sm leading-6 text-emerald-50/80">
                  {selectedGameModel.description} O resultado será enviado ao
                  Editor com estrutura de impressão, peças/cartas quando aplicável
                  e gabarito.
                </p>
              </div>
            )}

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Conteúdos</span>
              <textarea
                value={form.conteudos}
                onChange={(event) => updateField("conteudos", event.target.value)}
                rows={5}
                placeholder={
                  "Digite um conteúdo por linha.\nEx.: Países hispânicos\nEx.: Saudações em espanhol\nEx.: Cultura e diversidade"
                }
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Objetivos</span>
              <textarea
                value={form.objetivos}
                onChange={(event) => updateField("objetivos", event.target.value)}
                rows={3}
                placeholder="Objetivos pedagógicos do material"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Orientações</span>
              <textarea
                value={form.orientacoes}
                onChange={(event) => updateField("orientacoes", event.target.value)}
                rows={3}
                placeholder="Instruções, formato desejado, número de grupos, nível de dificuldade ou detalhes para impressão"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>

            <label className="grid gap-2 md:col-span-2">
              <span className="text-sm font-bold text-slate-300">Observações</span>
              <textarea
                value={form.observacoes}
                onChange={(event) => updateField("observacoes", event.target.value)}
                rows={3}
                placeholder="Características da turma, adaptações ou necessidades específicas"
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/50"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={generateMaterial}
              disabled={isGenerating}
              className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGenerating
                ? "Gerando..."
                : form.tipo === "jogo"
                  ? `Gerar ${selectedGameModel?.label || "jogo"}`
                  : "Gerar material"}
            </button>

            <Link
              href="/historico"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-center text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
            >
              Ver histórico
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl">
          {generatedMaterial ? (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Prévia
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                {generatedMaterial.titulo}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {generatedMaterial.introducao || generatedMaterial.resumo}
              </p>

              <div className="mt-6 grid gap-4">
                {(generatedMaterial.orientacoesAluno || []).length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <p className="text-sm font-black text-cyan-200">
                      Orientações ao aluno
                    </p>
                    <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                      {(generatedMaterial.orientacoesAluno || []).map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedMaterial.jogo && (
                  <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-200">
                      Jogo pedagógico
                    </p>
                    <h3 className="mt-2 text-xl font-black text-white">
                      {generatedMaterial.jogo.nome}
                    </h3>
                    <p className="mt-2 text-sm font-bold text-emerald-100">
                      {generatedMaterial.jogo.tipoJogo}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-emerald-50/80">
                      {generatedMaterial.jogo.objetivo}
                    </p>
                  </div>
                )}

                {(generatedMaterial.secoes || []).slice(0, 4).map((section, index) => {
                  const content = section.conteudo || section.descricao || "";

                  return (
                    <div
                      key={`${section.titulo}-${index}`}
                      className="rounded-2xl border border-white/10 bg-slate-950/50 p-5"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        Seção {index + 1}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {section.titulo}
                      </h3>
                      {content && (
                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">
                          {content.length > 900 ? `${content.slice(0, 900)}...` : content}
                        </p>
                      )}
                      {section.itens && section.itens.length > 0 && (
                        <ul className="mt-3 grid gap-2 text-sm leading-6 text-slate-300">
                          {section.itens.slice(0, 8).map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}

                {(generatedMaterial.questoes || []).length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5">
                    <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                      Questões
                    </p>
                    <div className="mt-4 grid gap-4">
                      {(generatedMaterial.questoes || []).slice(0, 6).map((question) => (
                        <div key={question.numero} className="text-sm text-slate-300">
                          <p className="font-black text-white">
                            {question.numero}. {question.enunciado}
                          </p>
                          {question.respostaEsperada && (
                            <p className="mt-2 text-slate-400">
                              Resposta esperada: {question.respostaEsperada}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openInEditor}
                  className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-slate-950 transition hover:-translate-y-1 hover:bg-cyan-100"
                >
                  Abrir no Editor
                </button>
                <button
                  type="button"
                  onClick={() => downloadDocument(generatedMaterial)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm font-black text-white transition hover:-translate-y-1 hover:bg-white/10"
                >
                  Baixar DOCX
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Prévia
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Aguardando geração com IA
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                Preencha os dados do material, informe conteúdos claros e clique
                em gerar. A prévia aparecerá aqui antes de abrir no Editor.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default MateriaisClient;
