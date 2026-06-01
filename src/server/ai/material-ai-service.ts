import type {
  MaterialAIGame,
  MaterialAIInput,
  MaterialAIOutput,
  MaterialAIQuestion,
  MaterialAISection,
} from "../../types/ai";
import { generateGeminiJSON } from "./gemini-client";
import {
  buildMaterialPrompt,
  buildMaterialSystemInstruction,
} from "./prompts/material-prompt";

function normalizeConteudos(conteudos: MaterialAIInput["conteudos"]): string[] {
  if (Array.isArray(conteudos)) {
    return conteudos.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(conteudos)
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeType(type: string): string {
  return String(type || "").trim().toLowerCase();
}

function normalizeGameModel(model: unknown): string {
  const value = String(model || "").trim().toLowerCase();

  if (["caca_palavras", "cruzadinha", "bingo", "memoria", "domino", "quiz", "cartas"].includes(value)) {
    return value;
  }

  return "caca_palavras";
}

function gameModelLabel(model: string): string {
  const labels: Record<string, string> = {
    caca_palavras: "Caça-palavras",
    cruzadinha: "Cruzadinha",
    bingo: "Bingo pedagógico",
    memoria: "Jogo da memória",
    domino: "Dominó pedagógico",
    quiz: "Quiz com gabarito",
    cartas: "Cartas recortáveis",
  };

  return labels[normalizeGameModel(model)] || "Jogo pedagógico";
}

function isJogo(type: string): boolean {
  return normalizeType(type) === "jogo";
}

function isProjeto(type: string): boolean {
  return normalizeType(type) === "projeto";
}

function isRoteiro(type: string): boolean {
  return normalizeType(type) === "roteiro";
}

function needsQuestionQuantity(type: string): boolean {
  return normalizeType(type) === "atividade" || normalizeType(type) === "prova";
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item).trim()).filter(Boolean);
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

function normalizeWord(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

function getGameTerms(input: MaterialAIInput) {
  const conteudos = normalizeConteudos(input.conteudos);
  const base = uniqueItems([input.tema, ...conteudos]);
  const expanded = base.flatMap((item) => {
    const words = item
      .split(/\s+/)
      .map((word) => word.trim())
      .filter((word) => word.length >= 4 && normalizeWord(word).length >= 4);

    return [item, ...words];
  });

  return uniqueItems(expanded).slice(0, 24);
}

function getPrintableWords(input: MaterialAIInput) {
  return uniqueItems(
    getGameTerms(input)
      .map(normalizeWord)
      .filter((word) => word.length >= 4 && word.length <= 14),
  ).slice(0, 12);
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

function validateInput(input: MaterialAIInput): string | null {
  if (!input) {
    return "Dados do material não foram enviados.";
  }

  if (!String(input.titulo || "").trim()) {
    return "Informe o título do material.";
  }

  if (!String(input.etapa || "").trim()) {
    return "Informe a etapa.";
  }

  if (!String(input.anoSerie || "").trim()) {
    return "Informe o ano/série.";
  }

  if (!String(input.componenteCurricular || "").trim()) {
    return "Informe o componente curricular.";
  }

  if (!String(input.tipo || "").trim()) {
    return "Informe o tipo de material.";
  }

  if (!String(input.tema || "").trim()) {
    return "Informe o tema do material.";
  }

  if (normalizeConteudos(input.conteudos).length === 0) {
    return "Informe ao menos um conteúdo.";
  }

  if (needsQuestionQuantity(input.tipo) && !String(input.quantidadeQuestoes || "").trim()) {
    return "Informe a quantidade de questões para atividade ou prova.";
  }

  return null;
}

function normalizeQuestion(question: Partial<MaterialAIQuestion>, index: number): MaterialAIQuestion {
  return {
    numero: Number(question.numero || index + 1),
    tipo: String(question.tipo || "discursiva").trim(),
    enunciado: String(question.enunciado || "").trim(),
    alternativas: normalizeStringArray(question.alternativas),
    respostaEsperada: String(question.respostaEsperada || "").trim(),
    criterioCorrecao: String(question.criterioCorrecao || "").trim(),
  };
}

function normalizeSection(section: Partial<MaterialAISection> & { descricao?: string }): MaterialAISection {
  return {
    titulo: String(section.titulo || "Seção").trim(),
    conteudo: String(section.conteudo || section.descricao || "").trim(),
    itens: normalizeStringArray(section.itens),
  };
}

function normalizeGame(game: MaterialAIGame | undefined, input?: MaterialAIInput): MaterialAIGame | undefined {
  if (!game) {
    return undefined;
  }

  return {
    nome: String(game.nome || input?.titulo || "Jogo pedagógico").trim(),
    tipoJogo: String(game.tipoJogo || gameModelLabel(input?.modeloJogo || "")).trim(),
    objetivo: String(game.objetivo || input?.objetivos || `Revisar ${input?.tema || "o conteúdo"}.`).trim(),
    materiais: normalizeStringArray(game.materiais),
    preparacao: normalizeStringArray(game.preparacao),
    regras: normalizeStringArray(game.regras),
    modoDeJogar: normalizeStringArray(game.modoDeJogar),
    variacoes: normalizeStringArray(game.variacoes),
    fechamento: String(game.fechamento || "Finalize com correção coletiva e registro das aprendizagens.").trim(),
  };
}

function buildDeterministicGameMaterial(input: MaterialAIInput): MaterialAIOutput {
  const model = normalizeGameModel(input.modeloJogo);
  const label = gameModelLabel(model);
  const terms = getGameTerms(input);
  const words = getPrintableWords(input);
  const title = input.titulo || `${label} — ${input.tema}`;
  const objetivos = normalizeStringArray(
    String(input.objetivos || "")
      .split(/\r?\n|;/)
      .map((item) => item.trim()),
  );
  const finalObjectives = objetivos.length
    ? objetivos
    : [
        `Revisar o tema ${input.tema} de forma lúdica, colaborativa e avaliável.`,
        "Promover participação, registro de aprendizagem e socialização das respostas.",
      ];
  let secoes: MaterialAISection[] = [];
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

  if (model === "caca_palavras") {
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
        conteudo: "Depois de encontrar as palavras, escolha três delas e escreva uma frase explicando sua relação com o conteúdo estudado.",
        itens: ["Palavra 1: ________________________________", "Palavra 2: ________________________________", "Palavra 3: ________________________________"],
      },
    ];
    gabarito = wordSearch.placed.map((word) => `Palavra presente no caça-palavras: ${word}.`);
  }

  if (model === "cruzadinha") {
    const answers = terms.slice(0, 12);
    materiais = ["Folha da cruzadinha", "Banco de pistas", "Lápis", "Gabarito do professor"];
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
        itens: [],
      },
    ];
    gabarito = answers.map((answer, index) => `${index + 1}. ${answer}`);
  }

  if (model === "bingo") {
    const cards = buildBingoCards(terms.slice(0, 18));
    materiais = ["Cartelas de bingo", "Fichas ou marcadores", "Lista de sorteio", "Gabarito do professor"];
    regras = [
      "Cada estudante ou grupo recebe uma cartela.",
      "O professor sorteia pistas, conceitos ou exemplos.",
      "Os estudantes marcam na cartela o termo correspondente.",
      "Vence quem completar linha, coluna ou cartela inteira, conforme a regra escolhida.",
    ];
    secoes = [
      {
        titulo: "Cartelas para imprimir",
        conteudo: cards.join("\n\n"),
        itens: [],
      },
      {
        titulo: "Lista de sorteio do professor",
        conteudo: "Recorte ou leia os itens abaixo durante a partida.",
        itens: terms.slice(0, 24),
      },
    ];
    gabarito = terms.slice(0, 24).map((term) => `Item de sorteio: ${term}.`);
  }

  if (model === "memoria") {
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

  if (model === "domino") {
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
          return `Peça ${index + 1}: [${term}] | [Pergunta: qual conceito se relaciona a ${next}?]`;
        }),
      },
      {
        titulo: "Percurso sugerido",
        conteudo: "Monte a sequência unindo perguntas e respostas até fechar o ciclo do dominó.",
        itens: [],
      },
    ];
    gabarito = pieces.map((term, index) => `Peça ${index + 1}: resposta esperada relacionada a ${term}.`);
  }

  if (model === "quiz") {
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
        conteudo: "Equipe: __________________ | Pontos: ______\nEquipe: __________________ | Pontos: ______\nEquipe: __________________ | Pontos: ______",
        itens: [],
      },
    ];
    gabarito = questions.map((term, index) => `Pergunta ${index + 1}: resposta deve demonstrar compreensão de ${term} e relação com o tema ${input.tema}.`);
  }

  if (model === "cartas") {
    const source = terms.length ? terms : ["Conceito", "Exemplo", "Aplicação", "Revisão"];
    const cards = Array.from({ length: 24 }).map((_, index) => {
      const term = source[index % source.length];
      return `Carta ${index + 1}: ${term} — desafio: explique, exemplifique ou relacione este item ao tema ${input.tema}.`;
    });
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
        itens: cards,
      },
      {
        titulo: "Cartas especiais",
        conteudo: "Carta bônus: dê um exemplo prático.\nCarta desafio: explique para a turma.\nCarta troca: escolha outra carta.\nCarta síntese: escreva uma conclusão curta.",
        itens: [],
      },
    ];
    gabarito = terms.slice(0, 12).map((term) => `Carta relacionada a ${term}: aceitar respostas coerentes, contextualizadas e com justificativa.`);
  }

  return {
    titulo: title,
    subtitulo: `${label} — ${input.componenteCurricular}`,
    tipo: "jogo",
    resumo: `Jogo pedagógico imprimível e editável para trabalhar ${input.tema}.`,
    dadosGerais: {
      escola: input.escola || "",
      professor: input.professor || "",
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento || "",
      componenteCurricular: input.componenteCurricular,
      tema: input.tema,
      duracao: input.duracao || "",
    },
    objetivos: finalObjectives,
    conteudos: normalizeConteudos(input.conteudos),
    orientacoesProfessor: [
      "Imprima o material e recorte as peças quando houver indicação.",
      "Explique as regras antes do início e faça uma rodada demonstrativa.",
      "Organize os estudantes individualmente, em duplas ou grupos conforme o tempo disponível.",
      "Finalize com correção coletiva, registro das aprendizagens e retomada dos pontos de dificuldade.",
    ],
    orientacoesAluno: [
      "Leia as instruções antes de começar.",
      "Participe respeitando os colegas e justificando suas respostas.",
      "Registre dúvidas e aprendizagens para a correção coletiva.",
    ],
    introducao: "Material lúdico estruturado para impressão, aplicação em sala, registro da aprendizagem e edição no Planify Editor.",
    secoes,
    questoes: [],
    jogo: {
      nome: title,
      tipoJogo: label,
      objetivo: finalObjectives.join(" "),
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
      fechamento: "Finalize com retomada dos conceitos, correção coletiva e registro de uma síntese no caderno.",
    },
    projeto: undefined,
    roteiro: undefined,
    criteriosAvaliacao: [
      "Participação e colaboração durante o jogo.",
      "Compreensão dos conceitos trabalhados.",
      "Justificativa das respostas e uso adequado da linguagem do componente.",
      "Registro final das aprendizagens.",
    ],
    gabarito,
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

function normalizeOutput(output: MaterialAIOutput, input: MaterialAIInput): MaterialAIOutput {
  const type = normalizeType(input.tipo);

  if (isJogo(type)) {
    const deterministic = buildDeterministicGameMaterial(input);
    const normalizedGame = normalizeGame(output.jogo, input);
    const sections = Array.isArray(output.secoes) ? output.secoes.map(normalizeSection) : [];
    const hasUsableGame = Boolean(normalizedGame?.nome && normalizedGame?.objetivo);
    const hasUsableSections = sections.length > 0;

    if (!hasUsableGame || !hasUsableSections) {
      return deterministic;
    }

    return {
      ...deterministic,
      titulo: output.titulo || deterministic.titulo,
      subtitulo: output.subtitulo || deterministic.subtitulo,
      resumo: output.resumo || deterministic.resumo,
      objetivos: normalizeStringArray(output.objetivos).length ? normalizeStringArray(output.objetivos) : deterministic.objetivos,
      orientacoesProfessor: normalizeStringArray(output.orientacoesProfessor).length
        ? normalizeStringArray(output.orientacoesProfessor)
        : deterministic.orientacoesProfessor,
      orientacoesAluno: normalizeStringArray(output.orientacoesAluno).length
        ? normalizeStringArray(output.orientacoesAluno)
        : deterministic.orientacoesAluno,
      introducao: output.introducao || deterministic.introducao,
      secoes: sections.length >= 2 ? sections : [...sections, ...deterministic.secoes].slice(0, 6),
      jogo: {
        nome: normalizedGame?.nome || deterministic.jogo?.nome || input.titulo || "Jogo pedagógico",
        tipoJogo: normalizedGame?.tipoJogo || deterministic.jogo?.tipoJogo || gameModelLabel(input.modeloJogo || ""),
        objetivo: normalizedGame?.objetivo || deterministic.jogo?.objetivo || `Revisar ${input.tema}.`,
        materiais: normalizedGame?.materiais?.length ? normalizedGame.materiais : deterministic.jogo?.materiais || [],
        preparacao: normalizedGame?.preparacao?.length ? normalizedGame.preparacao : deterministic.jogo?.preparacao || [],
        regras: normalizedGame?.regras?.length ? normalizedGame.regras : deterministic.jogo?.regras || [],
        modoDeJogar: normalizedGame?.modoDeJogar?.length ? normalizedGame.modoDeJogar : deterministic.jogo?.modoDeJogar || [],
        variacoes: normalizedGame?.variacoes?.length ? normalizedGame.variacoes : deterministic.jogo?.variacoes || [],
        fechamento: normalizedGame?.fechamento || deterministic.jogo?.fechamento || "Finalize com correção coletiva.",
      },
      criteriosAvaliacao: normalizeStringArray(output.criteriosAvaliacao).length
        ? normalizeStringArray(output.criteriosAvaliacao)
        : deterministic.criteriosAvaliacao,
      gabarito: normalizeStringArray(output.gabarito).length ? normalizeStringArray(output.gabarito) : deterministic.gabarito,
      adaptacoesInclusivas: normalizeStringArray(output.adaptacoesInclusivas).length
        ? normalizeStringArray(output.adaptacoesInclusivas)
        : deterministic.adaptacoesInclusivas,
      sugestoesUso: normalizeStringArray(output.sugestoesUso).length ? normalizeStringArray(output.sugestoesUso) : deterministic.sugestoesUso,
      alertas: normalizeStringArray(output.alertas),
    };
  }

  return {
    titulo: output.titulo || input.titulo,
    subtitulo: output.subtitulo || `${input.tipo} de ${input.componenteCurricular}`,
    tipo: type,
    resumo: output.resumo || "Material didático gerado com base nos dados informados.",
    dadosGerais: {
      escola: input.escola || "",
      professor: input.professor || "",
      etapa: input.etapa,
      anoSerie: input.anoSerie,
      areaConhecimento: input.areaConhecimento || "",
      componenteCurricular: input.componenteCurricular,
      tema: input.tema,
      duracao: input.duracao || "",
    },
    objetivos: normalizeStringArray(output.objetivos),
    conteudos:
      normalizeStringArray(output.conteudos).length > 0
        ? normalizeStringArray(output.conteudos)
        : normalizeConteudos(input.conteudos),
    orientacoesProfessor: normalizeStringArray(output.orientacoesProfessor),
    orientacoesAluno: normalizeStringArray(output.orientacoesAluno),
    introducao: output.introducao || "",
    secoes: Array.isArray(output.secoes) ? output.secoes.map(normalizeSection) : [],
    questoes: Array.isArray(output.questoes)
      ? output.questoes.map((question, index) => normalizeQuestion(question, index))
      : [],
    jogo: undefined,
    projeto: isProjeto(type) ? output.projeto : undefined,
    roteiro: isRoteiro(type) ? output.roteiro : undefined,
    criteriosAvaliacao: normalizeStringArray(output.criteriosAvaliacao),
    gabarito: normalizeStringArray(output.gabarito),
    adaptacoesInclusivas: normalizeStringArray(output.adaptacoesInclusivas),
    sugestoesUso: normalizeStringArray(output.sugestoesUso),
    alertas: normalizeStringArray(output.alertas),
  };
}

export async function generateMaterialWithAI(
  rawInput: MaterialAIInput,
): Promise<MaterialAIOutput> {
  const validationError = validateInput(rawInput);

  if (validationError) {
    throw new Error(validationError);
  }

  const input: MaterialAIInput = {
    ...rawInput,
    tipo: normalizeType(rawInput.tipo),
    modeloJogo: normalizeGameModel(rawInput.modeloJogo),
    conteudos: normalizeConteudos(rawInput.conteudos),
  };

  const generated = await generateGeminiJSON<MaterialAIOutput>({
    systemInstruction: buildMaterialSystemInstruction(),
    prompt: buildMaterialPrompt(input),
    temperature: isJogo(input.tipo) ? 0.25 : 0.35,
    topP: 0.85,
    maxOutputTokens: isJogo(input.tipo) ? 14000 : 10000,
  });

  return normalizeOutput(generated, input);
}
